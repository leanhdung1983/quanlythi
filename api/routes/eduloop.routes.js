import express from 'express';
import { query, canManageClass } from '../core.js';
import { buildGapMap, planPractice, json, questionSignature } from '../eduloop.js';
import { buildPracticeCatalog, practiceCatalogSql } from '../eduLoopPractice.js';

const router = express.Router();
const positive = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const fail = (res, e) => res.status(e.status || (e.code === 'ER_NO_SUCH_TABLE' ? 503 : 500)).json({ error: e.code === 'ER_NO_SUCH_TABLE' ? 'Chưa chạy migration EduLoop. Xem docs/EduLoop.md.' : e.message });
const error = (status, message) => Object.assign(new Error(message), { status });

async function membership(classId, studentId) {
    const [row] = await query("SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ? AND status = 'APPROVED'", [classId, studentId]);
    return !!row;
}
async function scope(req, classId, studentId) {
    if (classId) {
        if (!positive(classId)) throw error(400, 'Mã lớp không hợp lệ.');
        if (!(await canManageClass(req, classId))) throw error(403, 'Bạn không quản lý lớp này.');
        if (studentId && !(await membership(classId, studentId))) throw error(403, 'Học sinh không thuộc lớp đã duyệt.');
    } else if (!studentId || (Number(studentId) !== Number(req.user.id) && req.user.role !== 'ADMIN')) {
        throw error(403, 'Chỉ được xem dữ liệu của mình hoặc học sinh trong lớp quản lý.');
    }
    if (studentId && !positive(studentId)) throw error(400, 'Mã học sinh không hợp lệ.');
}
async function evidence(classId, studentId) {
    const results = await query(`SELECT r.* FROM exam_results r WHERE r.status = 'COMPLETED'
        ${studentId ? 'AND r.user_id = ?' : ''}
        ${classId ? "AND EXISTS (SELECT 1 FROM class_students cs WHERE cs.student_id = r.user_id AND cs.class_id = ? AND cs.status = 'APPROVED')" : ''}
        ORDER BY r.created_at, r.id`, [...(studentId ? [studentId] : []), ...(classId ? [classId] : [])]);
    const ids = [...new Set(results.flatMap(r => {
        const qs = json(r.result_detail).questions;
        return Array.isArray(qs) ? qs.filter(Boolean).map(q => Number(q.id)).filter(positive) : [];
    }))];
    const bank = ids.length ? await query(`SELECT q.id, q.legacy_full_id, q.competencies, m.description,
        u.name AS unit_name, u.id AS unit_id, c.id AS chapter_id, c.name AS chapter_name FROM questions q
        LEFT JOIN id6_metadata m ON m.id_full = q.legacy_full_id
        LEFT JOIN units u ON u.id = q.unit_id LEFT JOIN chapters c ON c.id = u.chapter_id
        WHERE q.id IN (?)`, [ids]) : [];
    return { results, bank };
}

router.get('/eduloop/map', async (req, res) => {
    try {
        const { class_id, student_id } = req.query;
        const student = student_id || (!class_id ? req.user.id : null);
        await scope(req, class_id, student);
        const { results, bank } = await evidence(class_id, student);
        res.json({ success: true, data: buildGapMap(results, bank), result_count: results.length });
    } catch (e) { fail(res, e); }
});

// Uses the same authenticated shared bank as /questions and exam generation.
// Imported questions have is_public=0, so that flag is not the bank's access rule.
router.get('/eduloop/practice-catalog', async (req, res) => {
    try {
        const rows = await query(practiceCatalogSql);
        res.set('Cache-Control', 'private, no-store');
        res.json({ success: true, data: buildPracticeCatalog(rows) });
    } catch (e) { fail(res, e); }
});

router.post('/eduloop/recommendations', async (req, res) => {
    try {
        const { class_id, student_id } = req.body;
        if (!['ADMIN', 'TEACHER'].includes(req.user.role)) throw error(403, 'Giáo viên tạo đề xuất cho học sinh.');
        if (!positive(class_id) || !positive(student_id)) throw error(400, 'Chọn lớp và học sinh.');
        await scope(req, class_id, student_id);
        const { results, bank } = await evidence(class_id, student_id);
        const baseline = buildGapMap(results, bank);
        const candidates = await query(`SELECT q.id, q.legacy_full_id, q.used_count, q.difficulty_index, q.content_latex, q.content_latex_original, t.code AS type
            FROM questions q JOIN question_types t ON t.id = q.type_id
            WHERE t.code IN ('TN','TF','KQ') AND (q.is_public = 1 OR q.created_by = ?)`, [req.user.id]);
        const items = planPractice(baseline, candidates);
        if (!items.length) throw error(422, 'Chưa đủ minh chứng lỗ hổng hoặc không có câu hỏi cùng ID6 được phép sử dụng.');
        const result = await query(`INSERT INTO eduloop_recommendations
            (class_id, student_id, created_by, payload, baseline) VALUES (?, ?, ?, ?, ?)`,
            [class_id, student_id, req.user.id, JSON.stringify(items), JSON.stringify(baseline)]);
        res.json({ success: true, id: result.insertId });
    } catch (e) { fail(res, e); }
});

router.get('/eduloop/recommendations', async (req, res) => {
    try {
        const { class_id, student_id } = req.query;
        const student = student_id || (!class_id ? req.user.id : null);
        await scope(req, class_id, student);
        const rows = await query(`SELECT * FROM eduloop_recommendations WHERE 1=1
            ${class_id ? 'AND class_id = ?' : ''} ${student ? 'AND student_id = ?' : ''} ORDER BY id DESC LIMIT 100`,
            [...(class_id ? [class_id] : []), ...(student ? [student] : [])]);
        res.json({ success: true, data: rows.map(r => ({ ...r, payload: json(r.payload, []), baseline: json(r.baseline) })) });
    } catch (e) { fail(res, e); }
});

router.post('/eduloop/recommendations/:id/decision', async (req, res) => {
    try {
        if (!positive(req.params.id)) throw error(400, 'Mã đề xuất không hợp lệ.');
        const { status, note = '' } = req.body;
        if (!['APPROVED', 'REJECTED'].includes(status) || typeof note !== 'string' || note.length > 2000) throw error(400, 'Quyết định hoặc ghi chú không hợp lệ.');
        if (!['ADMIN', 'TEACHER'].includes(req.user.role)) throw error(403, 'Chỉ giáo viên được duyệt.');
        const [row] = await query('SELECT * FROM eduloop_recommendations WHERE id = ?', [req.params.id]);
        if (!row) throw error(404, 'Không tìm thấy đề xuất.');
        await scope(req, row.class_id, row.student_id);
        const result = await query(`UPDATE eduloop_recommendations SET status = ?, decision_note = ?,
            reviewed_by = ?, reviewed_at = NOW() WHERE id = ? AND status = 'PENDING'`, [status, note, req.user.id, row.id]);
        if (!result.affectedRows) throw error(409, 'Đề xuất đã được quyết định. Tạo đề xuất mới nếu cần thay đổi.');
        res.json({ success: true });
    } catch (e) { fail(res, e); }
});

router.get('/eduloop/recommendations/:id/progress', async (req, res) => {
    try {
        const [row] = await query('SELECT * FROM eduloop_recommendations WHERE id = ?', [req.params.id]);
        if (!row) throw error(404, 'Không tìm thấy đề xuất.');
        if (Number(row.student_id) === Number(req.user.id)) {
            if (!(await membership(row.class_id, req.user.id))) throw error(403, 'Bạn không còn là thành viên lớp.');
        } else await scope(req, row.class_id, row.student_id);
        const { results, bank } = await evidence(row.class_id, row.student_id);
        const map = buildGapMap(results, bank, row.reviewed_at || null);
        const keys = new Set(json(row.payload, []).map(p => p.skill));
        res.json({ success: true, data: { ...map, skills: map.skills.filter(s => keys.has(s.key)) }, split_at: row.reviewed_at,
            note: 'Trước/sau thời điểm giáo viên duyệt; tỷ lệ đúng quan sát được, không kết luận quan hệ nhân quả.' });
    } catch (e) { fail(res, e); }
});

export async function approvedPractice(req) {
    const [row] = await query('SELECT * FROM eduloop_recommendations WHERE id = ?', [req.body.recommendation_id]);
    if (!row) throw error(404, 'Không tìm thấy đề xuất.');
    if (Number(row.student_id) !== Number(req.user.id) || !(await membership(row.class_id, req.user.id))) throw error(403, 'Đề xuất không thuộc học sinh trong lớp.');
    if (row.status !== 'APPROVED') throw error(409, 'Đề xuất chưa được giáo viên duyệt.');
    const items = json(row.payload, []);
    const ids = items.map(p => p.question_id);
    if (!ids.length) throw error(422, 'Đề xuất không có câu hỏi.');
    const questions = await query(`SELECT q.id, q.legacy_full_id AS id_full, q.content_latex,
        q.content_latex_original AS original_latex, q.content_latex AS raw_latex, q.content_latex_original, qt.code AS type
        FROM questions q JOIN question_types qt ON qt.id = q.type_id WHERE q.id IN (?)
        AND (q.is_public = 1 OR q.created_by = ?)`, [ids, row.created_by]);
    if (questions.length !== ids.length) throw error(409, 'Ngân hàng câu hỏi đã thay đổi; giáo viên cần tạo và duyệt lại.');
    for (const q of questions) {
        const item = items.find(p => Number(p.question_id) === Number(q.id));
        if (parseKey(q.id_full) !== item.skill || !['TN', 'TF', 'KQ'].includes(q.type) || (item.signature && item.signature !== questionSignature(q))) throw error(409, 'Câu hỏi hoặc ID6 đã thay đổi; cần duyệt lại đề xuất.');
    }
    return { success: true, data: questions, recommendation_id: row.id,
        ai_analysis: items.map(p => p.reason).join('\n'), evidence: items, approval: { status: row.status, reviewed_at: row.reviewed_at } };
}
import { parseId6 } from '../id6.js';
const parseKey = id => parseId6(id)?.normalized;
export default router;
