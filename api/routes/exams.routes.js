import express from 'express';
import { 
    query, 
    isAdmin, 
    isSelfOrAdmin, 
    requireAdmin, 
    requireTeacherOrAdmin, 
    canManageMatrix, 
    canAccessExamResult
} from '../core.js';
import { calculateServerScore } from '../scoring.js';
import { sanitizeQuestionForStudent, rehydrateTrustedQuestions } from '../examSecurity.js';
import { buildLatexDocument } from '../texExamGenerator.js';

const router = express.Router();
// Results and live sessions must never be served from a browser/proxy cache.
router.use((req, res, next) => {
    if (/^\/(exam-results|exam\/|matrix-results)/.test(req.path)) res.set('Cache-Control', 'private, no-store');
    next();
});

// 1. Saved Matrices
router.get('/saved-matrices', async (req, res) => { 
    try { 
        const { grade_id } = req.query;
        let sql = "SELECT * FROM matrix_templates";
        const params = [];
        const where = [];
        if (!isAdmin(req)) {
            where.push('(is_public = 1 OR created_by IS NULL OR created_by = ?)');
            params.push(req.user.id);
        }
        if (grade_id) {
            where.push('grade_id = ?');
            params.push(grade_id);
        }
        if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
        sql += " ORDER BY created_at DESC";
        const rows = await query(sql, params); 
        res.json({ success: true, data: rows }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

router.post('/saved-matrices', async (req, res) => { 
    try { 
        if (!requireTeacherOrAdmin(req, res)) return;
        const { name, matrix_data, grade_id, is_public } = req.body; 
        const created_by = req.user?.id || null;
        const result = await query(
            "INSERT INTO matrix_templates (name, matrix_data, grade_id, is_public, created_by) VALUES (?, ?, ?, ?, ?)", 
            [name, JSON.stringify(matrix_data), grade_id, is_public || 0, created_by]
        ); 
        res.json({ success: true, id: result.insertId }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

router.put('/saved-matrices/:id', async (req, res) => { 
    try { 
        const { name, matrix_data, grade_id, is_public } = req.body; 
        const [existing] = await query("SELECT created_by FROM matrix_templates WHERE id = ?", [req.params.id]);
        if (!existing) return res.status(404).json({ error: "Ma trận không tồn tại" });
        if (!isAdmin(req) && Number(existing.created_by) !== Number(req.user?.id)) {
            return res.status(403).json({ error: "Bạn không có quyền chỉnh sửa ma trận của người khác." });
        }
        await query(
            "UPDATE matrix_templates SET name = ?, matrix_data = ?, grade_id = ?, is_public = ? WHERE id = ?", 
            [name, JSON.stringify(matrix_data), grade_id, is_public || 0, req.params.id]
        ); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

router.delete('/saved-matrices/:id', async (req, res) => { 
    try { 
        const [existing] = await query("SELECT created_by FROM matrix_templates WHERE id = ?", [req.params.id]);
        if (!existing) return res.status(404).json({ error: "Ma trận không tồn tại" });
        if (!isAdmin(req) && Number(existing.created_by) !== Number(req.user?.id)) {
            return res.status(403).json({ error: "Bạn không có quyền xoá ma trận của người khác." });
        }
        await query("DELETE FROM matrix_templates WHERE id = ?", [req.params.id]); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

// 2. Question Reports
router.get('/reports', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const rows = await query(`
            SELECT 
                r.id, r.question_id, r.user_id, r.report_reason, r.status, r.created_at,
                u.full_name as reporter_name, u.username,
                q.legacy_full_id as id_full,
                q.content_latex as raw_latex,
                q.content_latex_original as original_latex
            FROM question_reports r 
            JOIN users u ON r.user_id = u.id 
            LEFT JOIN questions q ON r.question_id = q.id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reports', async (req, res) => {
    try {
        const { question_id, report_reason, description } = req.body;
        const user_id = req.user.id;
        const reason = (report_reason || description || 'Báo lỗi câu hỏi').trim();
        await query(
            "INSERT INTO question_reports (user_id, question_id, report_reason, status) VALUES (?, ?, ?, 'PENDING')",
            [user_id, question_id, reason]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/reports/:id/status', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { status } = req.body;
        await query("UPDATE question_reports SET status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Exam Results History
router.get('/exam-results/all-history', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const rows = await query(`
            SELECT r.*, u.full_name, u.username, u.school 
            FROM exam_results r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.status = 'COMPLETED'
            ORDER BY r.exam_title ASC, u.full_name ASC, r.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/exam-results/history/:userId', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.userId)) return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử thi này.' });
        const rows = await query(
            "SELECT * FROM exam_results WHERE user_id = ? AND status = 'COMPLETED' ORDER BY created_at DESC", 
            [req.params.userId]
        );
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/exam-results/:id', async (req, res) => {
    try {
        const rows = await query("SELECT * FROM exam_results WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Exam result not found" });
        if (!(await canAccessExamResult(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền xem kết quả này.' });
        const examResult = rows[0];

        // If requester is a student and assignment disallows reviewing solutions, sanitize
        if (req.user?.role === 'STUDENT' && examResult.status !== 'COMPLETED') {
            const detail = typeof examResult.result_detail === 'string' ? JSON.parse(examResult.result_detail) : examResult.result_detail;
            if (Array.isArray(detail?.questions)) detail.questions = detail.questions.map(q => sanitizeQuestionForStudent(q).sanitizedQuestion);
            examResult.result_detail = detail;
            examResult.review_locked = true;
        }
        if (req.user?.role === 'STUDENT' && examResult.matrix_id) {
            const [assignment] = await query(`
                SELECT ca.allow_review, ca.deadline
                FROM class_assignments ca
                JOIN class_students cs ON ca.class_id = cs.class_id
                WHERE ca.matrix_id = ? AND cs.student_id = ?
                ORDER BY ca.created_at DESC LIMIT 1
            `, [examResult.matrix_id, req.user.id]);

            if (assignment && assignment.allow_review === 0) {
                const detail = typeof examResult.result_detail === 'string'
                    ? JSON.parse(examResult.result_detail)
                    : examResult.result_detail;

                if (detail && Array.isArray(detail.questions)) {
                    detail.questions = detail.questions.map(q => {
                        const { sanitizedQuestion } = sanitizeQuestionForStudent(q);
                        return sanitizedQuestion;
                    });
                }
                examResult.result_detail = detail;
                examResult.review_locked = true;
                examResult.review_message = "Giáo viên đã tắt chế độ xem lại đáp án và lời giải cho bài tập này.";
            }
        }

        res.json({ success: true, data: examResult });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/exam-results/all/:userId', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.userId)) return res.status(403).json({ error: 'Bạn không có quyền xóa lịch sử này.' });
        await query("DELETE FROM exam_results WHERE user_id = ?", [req.params.userId]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/exam-results/:id', async (req, res) => {
    try {
        if (!(await canAccessExamResult(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền xóa kết quả này.' });
        await query("DELETE FROM exam_results WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/exam-results/:id/score', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { score } = req.body;
        await query("UPDATE exam_results SET score = ? WHERE id = ?", [score, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/exam-results', async (req, res) => {
    try {
        const { id, duration_seconds, answers } = req.body;
        if (!id) return res.status(400).json({ error: 'Không tìm thấy phiên thi hợp lệ. Vui lòng bắt đầu lại bài thi.' });
        if (!(await canAccessExamResult(req, id))) return res.status(403).json({ error: 'Bạn không có quyền nộp bài thi này.' });

        const [existing] = await query('SELECT user_id, status, score, result_detail FROM exam_results WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Phiên thi không tồn tại.' });
        if (existing.status === 'COMPLETED') return res.json({ success: true, id, score: Number(existing.score), alreadySubmitted: true });
        if (existing.status !== 'IN_PROGRESS') return res.status(409).json({ error: 'Bài thi này không còn hiệu lực.' });
        const storedDetail = typeof existing.result_detail === 'string' ? JSON.parse(existing.result_detail) : existing.result_detail;
        const trustedQuestions = Array.isArray(storedDetail?.questions) ? storedDetail.questions : [];
        const safeAnswers = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};
        const score = calculateServerScore(trustedQuestions, safeAnswers, storedDetail?.scoring_settings || {});
        const safeDuration = Math.max(0, Math.min(Number(duration_seconds) || 0, 24 * 60 * 60));
        const resultDetail = JSON.stringify({ ...storedDetail, answers: safeAnswers });

        const updated = await query(
            "UPDATE exam_results SET score = ?, duration_seconds = ?, result_detail = ?, status = 'COMPLETED', last_updated = NOW() WHERE id = ? AND user_id = ? AND status = 'IN_PROGRESS'",
            [score, safeDuration, resultDetail, id, existing.user_id]
        );
        if (!updated.affectedRows) {
            const [confirmed] = await query('SELECT score,status FROM exam_results WHERE id = ? AND user_id = ?', [id, existing.user_id]);
            if (confirmed?.status === 'COMPLETED') return res.json({ success: true, id, score: Number(confirmed.score), alreadySubmitted: true });
            return res.status(409).json({ error: 'Phiên thi đã thay đổi. Bài chưa được xác nhận; vui lòng tải lại trạng thái.' });
        }
        res.json({ success: true, id, score });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Online Exam Sessions (Start / Progress / Active)
router.post('/exam/start', async (req, res) => {
    try {
        const { matrix_id, exam_title, questions, duration_seconds, scoring_settings } = req.body;
        const user_id = req.user.id;

        const [user] = await query("SELECT role, is_pro FROM users WHERE id = ?", [user_id]);

        // Check LMS restrictions if assigned via class
        if (user && user.role === 'STUDENT' && matrix_id) {
            const [assignment] = await query(`
                SELECT ca.open_time, ca.deadline, ca.max_attempts, ca.allow_review
                FROM class_assignments ca
                JOIN class_students cs ON ca.class_id = cs.class_id
                WHERE ca.matrix_id = ? AND cs.student_id = ?
                ORDER BY ca.created_at DESC LIMIT 1
            `, [matrix_id, user_id]);

            if (assignment) {
                const now = new Date();
                if (assignment.open_time && new Date(assignment.open_time) > now) {
                    return res.status(403).json({ error: `Bài tập chưa đến thời gian mở (Mở lúc: ${new Date(assignment.open_time).toLocaleString('vi-VN')}).` });
                }
                if (assignment.deadline && new Date(assignment.deadline) < now) {
                    return res.status(403).json({ error: `Bài tập đã quá hạn nộp bài (Hạn chót: ${new Date(assignment.deadline).toLocaleString('vi-VN')}).` });
                }
                if (assignment.max_attempts > 0) {
                    const [countRes] = await query(
                        "SELECT COUNT(*) as completed_count FROM exam_results WHERE user_id = ? AND matrix_id = ? AND status = 'COMPLETED'",
                        [user_id, matrix_id]
                    );
                    if (countRes.completed_count >= assignment.max_attempts) {
                        return res.status(403).json({ error: `Bạn đã hoàn thành đủ số lượt làm bài cho phép (Tối đa ${assignment.max_attempts} lượt).` });
                    }
                }
            }
        }

        if (user && user.role === 'STUDENT' && !user.is_pro) {
            const today = new Date().toISOString().split('T')[0];
            const [countRow] = await query(
                "SELECT COUNT(*) as count FROM exam_results WHERE user_id = ? AND DATE(created_at) = ?",
                [user_id, today]
            );
            if (countRow.count >= 2) {
                return res.status(403).json({ error: "Bạn đã hết lượt thi trong ngày (Tối đa 2 lần cho tài khoản miễn phí)." });
            }
        }

        if (!Array.isArray(questions) || questions.length === 0 || questions.length > 200) {
            return res.status(400).json({ error: 'Danh sách câu hỏi không hợp lệ.' });
        }

        // Rehydrate questions using database records so the server has the authentic answer keys
        let trustedQuestions = questions;
        const qIds = questions.map(q => Number(q.id)).filter(Number.isInteger);
        if (qIds.length > 0) {
            const dbRows = await query(
                "SELECT id, legacy_full_id as id_full, content_latex, content_latex_original, type_id FROM questions WHERE id IN (?)",
                [qIds]
            );
            const dbMap = new Map(dbRows.map(r => [r.id, r]));
            trustedQuestions = rehydrateTrustedQuestions(questions, dbMap);
        }

        const result_detail = JSON.stringify({ questions: trustedQuestions, answers: {}, scoring_settings: scoring_settings || {} });
        const result = await query(
            "INSERT INTO exam_results (user_id, matrix_id, exam_title, score, duration_seconds, result_detail, status, created_at, last_updated) VALUES (?, ?, ?, 0, ?, ?, 'IN_PROGRESS', NOW(), NOW())",
            [user_id, matrix_id, exam_title, duration_seconds, result_detail]
        );
        res.json({ success: true, id: result.insertId });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/exam/progress', async (req, res) => {
    try {
        const { id, answers } = req.body;
        if (!(await canAccessExamResult(req, id))) return res.status(403).json({ error: 'Bạn không có quyền cập nhật bài thi này.' });
        
        const [rows] = await query("SELECT result_detail FROM exam_results WHERE id = ?", [id]);
        if (rows) {
            const detail = typeof rows.result_detail === 'string' ? JSON.parse(rows.result_detail) : rows.result_detail;
            detail.answers = answers;
            
            await query(
                "UPDATE exam_results SET result_detail = ?, last_updated = NOW() WHERE id = ? AND status = 'IN_PROGRESS'",
                [JSON.stringify(detail), id]
            );
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Exam not found" });
        }
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/exam/active/:userId', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.userId)) return res.status(403).json({ error: 'Bạn không có quyền xem phiên thi này.' });
        await query("DELETE FROM exam_results WHERE status = 'IN_PROGRESS' AND last_updated < DATE_SUB(NOW(), INTERVAL 2 HOUR)");
        
        const rows = await query(
            "SELECT * FROM exam_results WHERE user_id = ? AND status = 'IN_PROGRESS' ORDER BY last_updated DESC LIMIT 1",
            [req.params.userId]
        );
        if (rows.length > 0) {
            res.json({ success: true, found: true, exam: rows[0] });
        } else {
            res.json({ success: true, found: false });
        }
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/online-exam/active-participants-all', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM exam_results WHERE status = 'IN_PROGRESS' AND last_updated < DATE_SUB(NOW(), INTERVAL 2 HOUR)");

        const rows = await query(`
            SELECT r.id, r.last_updated, r.created_at, r.matrix_id, r.exam_title, r.user_id, u.full_name, u.username, u.school, m.name as matrix_name
            FROM exam_results r 
            JOIN users u ON r.user_id = u.id 
            LEFT JOIN matrix_templates m ON r.matrix_id = m.id
            WHERE r.status = 'IN_PROGRESS'
            ORDER BY r.last_updated DESC
        `);
        
        const uniqueRows = [];
        const seenUsers = new Set();
        for (const row of rows) {
            if (!seenUsers.has(row.user_id)) {
                seenUsers.add(row.user_id);
                uniqueRows.push(row);
            }
        }
        
        uniqueRows.sort((a, b) => {
            if (a.matrix_id !== b.matrix_id) return (a.matrix_id || 0) - (b.matrix_id || 0);
            return new Date(b.last_updated) - new Date(a.last_updated);
        });

        res.json({ success: true, data: uniqueRows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/online-exam/active-participants/:matrixId', async (req, res) => {
    try {
        if (!(await canManageMatrix(req, req.params.matrixId))) return res.status(403).json({ error: 'Bạn không có quyền xem người dự thi của ma trận này.' });
        await query("DELETE FROM exam_results WHERE status = 'IN_PROGRESS' AND last_updated < DATE_SUB(NOW(), INTERVAL 2 HOUR)");

        const rows = await query(`
            SELECT r.id, r.last_updated, r.created_at, r.user_id, u.full_name, u.username, u.school 
            FROM exam_results r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.matrix_id = ? AND r.status = 'IN_PROGRESS'
            ORDER BY r.last_updated DESC
        `, [req.params.matrixId]);
        
        const uniqueRows = [];
        const seenUsers = new Set();
        for (const row of rows) {
            if (!seenUsers.has(row.user_id)) {
                seenUsers.add(row.user_id);
                uniqueRows.push(row);
            }
        }

        res.json({ success: true, data: uniqueRows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/online-exam/results/:matrixId', async (req, res) => {
    try {
        if (!(await canManageMatrix(req, req.params.matrixId))) return res.status(403).json({ error: 'Bạn không có quyền xem kết quả của ma trận này.' });
        const rows = await query(`
            SELECT r.*, u.full_name, u.username, u.school 
            FROM exam_results r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.matrix_id = ? AND r.status = 'COMPLETED'
            ORDER BY r.score DESC, r.duration_seconds ASC
        `, [req.params.matrixId]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/online-exam/generate', async (req, res) => {
    try {
        const { matrix_data } = req.body;
        const user_id = req.user.id;
        
        const mode = matrix_data?.settings?.mode || 'PRACTICE';
        const isReal = mode === 'REAL';

        if (user_id) {
            const [user] = await query("SELECT role, is_pro FROM users WHERE id = ?", [user_id]);
            if (user && user.role === 'STUDENT' && !user.is_pro) {
                const today = new Date().toISOString().split('T')[0];
                let limitRow = (await query("SELECT * FROM activity_limits WHERE user_id = ? AND activity_date = ?", [user_id, today]))[0];
                if (!limitRow) {
                    await query("INSERT INTO activity_limits (user_id, activity_date) VALUES (?, ?)", [user_id, today]);
                    limitRow = { exam_count: 0, review_count: 0 };
                }
                
                if (isReal && limitRow.exam_count >= 2) {
                    return res.status(403).json({ error: "Bạn đã hết lượt thi (REAL) trong ngày (Tối đa 2 lần)." });
                } else if (!isReal && limitRow.review_count >= 2) {
                    return res.status(403).json({ error: "Bạn đã hết lượt ôn tập (PRACTICE) trong ngày (Tối đa 2 lần)." });
                }
                
                if (isReal) {
                    await query("UPDATE activity_limits SET exam_count = exam_count + 1 WHERE user_id = ? AND activity_date = ?", [user_id, today]);
                } else {
                    await query("UPDATE activity_limits SET review_count = review_count + 1 WHERE user_id = ? AND activity_date = ?", [user_id, today]);
                }
            }
        }

        const finalQuestions = [];
        const types = ['TN', 'TF', 'KQ', 'TL'];
        const allRequirements = [];
        const allPatterns = [];

        for (const type of types) {
            const items = matrix_data[type];
            if (!items || !Array.isArray(items)) continue;
            
            for (const item of items) {
                const { cls, sub, chap, unit, count, levels } = item;
                for (const lvl of ['N', 'H', 'V', 'C']) {
                    const quantity = levels[lvl];
                    if (quantity > 0) {
                        const unitStr = unit < 10 ? `0${unit}` : `${unit}`;
                        const countStr = count < 10 ? `0${count}` : `${count}`;

                        const targetId = `${cls}${sub}${chap}${lvl}${unit}-${count}`;
                        const targetIdPaddedUnit = `${cls}${sub}${chap}${lvl}${unitStr}-${count}`;
                        const targetIdPaddedCount = `${cls}${sub}${chap}${lvl}${unit}-${countStr}`;
                        const targetIdPaddedBoth = `${cls}${sub}${chap}${lvl}${unitStr}-${countStr}`;

                        let altCls = null;
                        if (cls === 10) altCls = '0';
                        else if (cls === 11) altCls = '1';
                        else if (cls === 12) altCls = '2';
                        else if (cls === 0) altCls = '10';
                        else if (cls === 1) altCls = '11';
                        else if (cls === 2) altCls = '12';

                        const allTargetsForThis = [targetId, targetIdPaddedUnit, targetIdPaddedCount, targetIdPaddedBoth];
                        if (altCls !== null) {
                            allTargetsForThis.push(
                                `${altCls}${sub}${chap}${lvl}${unit}-${count}`,
                                `${altCls}${sub}${chap}${lvl}${unitStr}-${count}`,
                                `${altCls}${sub}${chap}${lvl}${unitStr}-${countStr}`
                            );
                        }

                        const reqItem = { type, targets: allTargetsForThis, quantity, found: [] };
                        allRequirements.push(reqItem);

                        allTargetsForThis.forEach(t => {
                            allPatterns.push(t, `[${t}]`, `%ID: ${t}%`, `%${t}%`);
                        });
                    }
                }
            }
        }

        if (allPatterns.length > 0) {
            const allIds = await query(`SELECT q.id, q.legacy_full_id as id_full, qt.code as type_code FROM questions q LEFT JOIN question_types qt ON q.type_id = qt.id WHERE q.legacy_full_id IS NOT NULL`);
            
            for (const row of allIds) {
                const idFull = (row.id_full || "").trim();
                for (const reqItem of allRequirements) {
                    if (row.type_code && row.type_code !== reqItem.type) continue;
                    
                    const match = reqItem.targets.some(t => {
                        return idFull === t || 
                               idFull === `[${t}]` || 
                               idFull.includes(`ID: ${t}`) ||
                               idFull.includes(`ID:${t}`) ||
                               (idFull.includes(t) && idFull.length < t.length + 10);
                    });
                    
                    if (match) reqItem.found.push(row);
                }
            }

            const pickedIds = [];
            const reqMapping = {};

            let current_seed = null;
            if (isReal && matrix_data.matrix_id) {
                const shift = Math.floor(Date.now() / (2 * 60 * 60 * 1000));
                current_seed = Number(matrix_data.matrix_id) * 1000000 + shift;
            }

            const getNextRandom = () => {
                if (current_seed === null) return Math.random();
                const x = Math.sin(current_seed++) * 10000;
                return x - Math.floor(x);
            };

            for (const reqItem of allRequirements) {
                if (reqItem.found.length > 0) {
                    const pool = [...reqItem.found].sort((a, b) => a.id - b.id);
                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(getNextRandom() * (i + 1));
                        [pool[i], pool[j]] = [pool[j], pool[i]];
                    }
                    const picked = pool.slice(0, reqItem.quantity);
                    picked.forEach(row => {
                        pickedIds.push(row.id);
                        reqMapping[row.id] = reqItem.type;
                    });
                } else {
                    console.warn(`Missing questions for target pattern: ${reqItem.targets[0]}`);
                }
            }

            if (pickedIds.length > 0) {
                const rowDatas = await query(
                    `SELECT id, legacy_full_id as id_full, content_latex, content_latex_original AS original_latex, type_id, difficulty_index, discrimination_index, competencies, choices 
                     FROM questions 
                     WHERE id IN (?)`,
                    [pickedIds]
                );

                for (const row of rowDatas) {
                    finalQuestions.push({
                        id: row.id,
                        id_full: row.id_full,
                        type: reqMapping[row.id],
                        content: row.content_latex,
                        original_latex: row.original_latex,
                        difficulty_index: row.difficulty_index,
                        discrimination_index: row.discrimination_index,
                        competencies: typeof row.competencies === 'string' ? JSON.parse(row.competencies) : (row.competencies || []),
                        choices: typeof row.choices === 'string' ? JSON.parse(row.choices) : (row.choices || []),
                        options: []
                    });
                }
            }
        }

        const sanitizedQuestions = finalQuestions.map(q => {
            const { sanitizedQuestion } = sanitizeQuestionForStudent(q);
            return sanitizedQuestion;
        });

        res.json({ success: true, data: sanitizedQuestions });
    } catch (e) { 
        console.error("Online Exam Gen Error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

// 5. IRT Analysis
router.get('/irt/analysis', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 50), 2000);
        const results = await query("SELECT result_detail FROM exam_results WHERE status = 'COMPLETED' ORDER BY id DESC LIMIT ?", [limit]);
        
        const stats = {};
        
        results.forEach(r => {
            try {
                const detail = typeof r.result_detail === 'string' ? JSON.parse(r.result_detail) : r.result_detail;
                const { questions, answers } = detail;
                
                if (questions && answers) {
                    questions.forEach(q => {
                        if (!stats[q.id]) stats[q.id] = { total: 0, wrong: 0 };
                        stats[q.id].total++;
                        
                        const userAns = answers[q.id];
                        let isCorrect = false;
                        if (q.type === 'TN') {
                            const correctOpt = q.options?.find(o => o.isCorrect);
                            if (correctOpt && userAns === correctOpt.id) isCorrect = true;
                        } else if (q.type === 'KQ') {
                            if (userAns && q.correctAnswer && userAns.toString().trim() === q.correctAnswer.toString().trim()) isCorrect = true;
                        }
                        
                        if (!isCorrect) stats[q.id].wrong++;
                    });
                }
            } catch (e) { console.error("Error parsing result_detail:", e); }
        });

        const qMetadata = await query(`
            SELECT q.id, q.legacy_full_id, l.code as level_code 
            FROM questions q 
            JOIN levels l ON q.level_id = l.id
        `);

        const analysis = qMetadata.map(q => {
            const s = stats[q.id] || { total: 0, wrong: 0 };
            const errorRate = s.total > 0 ? s.wrong / s.total : 0;
            let warning = null;
            if (q.level_code === 'N' && errorRate > 0.6 && s.total > 3) warning = "Câu 'Nhận biết' nhưng tỷ lệ sai quá cao (>60%)";
            if (q.level_code === 'C' && errorRate < 0.2 && s.total > 5) warning = "Câu 'Vận dụng cao' nhưng tỷ lệ sai quá thấp (<20%)";
            
            return {
                id: q.id,
                legacy_full_id: q.legacy_full_id,
                level_code: q.level_code,
                total_attempts: s.total,
                wrong_attempts: s.wrong,
                error_rate: errorRate,
                warning
            };
        });

        res.json({ success: true, data: analysis });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generate-exam-matrix', async (req, res) => {
    try {
        let { matrix, matrix_id, mode, exam_title, duration, grade_id, school_name } = req.body;

        // 1. If matrix_id is provided, load template from DB
        if (matrix_id && (!matrix || Object.keys(matrix).length === 0)) {
            const [tpl] = await query("SELECT * FROM matrix_templates WHERE id = ?", [matrix_id]);
            if (tpl) {
                exam_title = exam_title || tpl.name;
                const parsed = typeof tpl.matrix_data === 'string' ? JSON.parse(tpl.matrix_data) : tpl.matrix_data;
                matrix = parsed.matrix || parsed;
                if (parsed.settings) {
                    duration = duration || parsed.settings.duration;
                    grade_id = grade_id ?? parsed.settings.grade_id;
                }
            }
        }

        // 2. Normalize matrix: check if matrix has nested .matrix property (from frontend save/settings)
        if (matrix && typeof matrix === 'object') {
            if (matrix.matrix_id && !matrix_id) matrix_id = matrix.matrix_id;
            mode = mode || matrix.mode;
            exam_title = exam_title || matrix.exam_title;
            school_name = school_name || matrix.school_name;
            if (matrix.settings) {
                duration = duration || matrix.settings.duration;
                grade_id = grade_id ?? matrix.settings.grade_id;
                exam_title = exam_title || matrix.settings.name;
                mode = mode || matrix.settings.mode;
            }
            if (matrix.matrix) {
                matrix = matrix.matrix;
            }
        }

        if (!matrix || typeof matrix !== 'object') {
            return res.status(400).json({ error: "Dữ liệu ma trận không hợp lệ." });
        }

        const finalQuestions = { TN: [], TF: [], KQ: [], TL: [] };
        const allRequirements = [];

        // 3. Extract requirements from matrix
        for (const qType of ['TN', 'TF', 'KQ', 'TL']) {
            const requests = matrix[qType];
            if (!requests) continue;

            if (Array.isArray(requests)) {
                for (const item of requests) {
                    const { cls, sub, chap, unit, count, levels } = item;
                    if (!levels) continue;
                    for (const lvl of ['N', 'H', 'V', 'C']) {
                        const quantity = Number(levels[lvl]) || 0;
                        if (quantity > 0) {
                            allRequirements.push({
                                qType,
                                cls: Number(cls),
                                sub: String(sub || 'D').toUpperCase(),
                                chap: Number(chap),
                                unit: Number(unit),
                                count: Number(count),
                                lvl,
                                quantity
                            });
                        }
                    }
                }
            } else if (typeof requests === 'object') {
                for (const [key, counts] of Object.entries(requests)) {
                    if (!counts || typeof counts !== 'object') continue;
                    const parts = key.split('-');
                    if (parts.length >= 5) {
                        const cls = parseInt(parts[0], 10);
                        const sub = String(parts[1] || 'D').toUpperCase();
                        const chap = parseInt(parts[2], 10);
                        const unit = parseInt(parts[3], 10);
                        const count = parseInt(parts[4], 10);
                        for (const lvl of ['N', 'H', 'V', 'C']) {
                            const quantity = Number(counts[lvl]) || 0;
                            if (quantity > 0) {
                                allRequirements.push({
                                    qType,
                                    cls,
                                    sub,
                                    chap,
                                    unit,
                                    count,
                                    lvl,
                                    quantity
                                });
                            }
                        }
                    }
                }
            }
        }

        if (allRequirements.length === 0) {
            return res.json({
                success: true,
                data: finalQuestions,
                tex: "",
                total_questions: 0,
                message: "Ma trận chưa có câu hỏi nào được cấu hình."
            });
        }

        // 4. Query question headers for matching (fast in-memory matching)
        const allIds = await query(`
            SELECT q.id, q.legacy_full_id as id_full, qt.code as type_code 
            FROM questions q 
            LEFT JOIN question_types qt ON q.type_id = qt.id 
            WHERE q.legacy_full_id IS NOT NULL
        `);

        const pickedIds = new Set();
        const reqMapping = {};

        // Randomly iterate through requirements
        for (const req of allRequirements) {
            const { qType, cls, sub, chap, unit, count, lvl, quantity } = req;

            const classes = [String(cls)];
            if (cls === 2) classes.push('12');
            else if (cls === 12) classes.push('2');
            else if (cls === 1) classes.push('11');
            else if (cls === 11) classes.push('1');
            else if (cls === 0) classes.push('10');
            else if (cls === 10) classes.push('0');

            const unitStr = unit < 10 ? `0${unit}` : `${unit}`;
            const countStr = count < 10 ? `0${count}` : `${count}`;

            const exactPatterns = [];
            for (const c of classes) {
                exactPatterns.push(
                    `${c}${sub}${chap}${lvl}${unit}-${count}`,
                    `${c}${sub}${chap}${lvl}${unitStr}-${count}`,
                    `${c}${sub}${chap}${lvl}${unit}-${countStr}`,
                    `${c}${sub}${chap}${lvl}${unitStr}-${countStr}`
                );
            }

            let pool = allIds.filter(q => {
                if (pickedIds.has(q.id)) return false;
                if (q.type_code && q.type_code !== qType) return false;
                const full = (q.id_full || "").replace(/[\[\]]/g, '').trim();
                return exactPatterns.some(p => full === p || full.includes(p));
            });

            // Fallback 1: match same unit & level
            if (pool.length < quantity) {
                const unitPrefixes = [];
                for (const c of classes) {
                    unitPrefixes.push(`${c}${sub}${chap}${lvl}${unit}-`, `${c}${sub}${chap}${lvl}${unitStr}-`);
                }
                const fallbackPool = allIds.filter(q => {
                    if (pickedIds.has(q.id)) return false;
                    if (pool.some(p => p.id === q.id)) return false;
                    if (q.type_code && q.type_code !== qType) return false;
                    const full = (q.id_full || "").replace(/[\[\]]/g, '').trim();
                    return unitPrefixes.some(p => full.startsWith(p));
                });
                pool = [...pool, ...fallbackPool];
            }

            // Fallback 2: match same chapter & level
            if (pool.length < quantity) {
                const chapPrefixes = classes.map(c => `${c}${sub}${chap}${lvl}`);
                const fallbackChap = allIds.filter(q => {
                    if (pickedIds.has(q.id)) return false;
                    if (pool.some(p => p.id === q.id)) return false;
                    if (q.type_code && q.type_code !== qType) return false;
                    const full = (q.id_full || "").replace(/[\[\]]/g, '').trim();
                    return chapPrefixes.some(p => full.startsWith(p));
                });
                pool = [...pool, ...fallbackChap];
            }

            // Random shuffle to ensure fresh questions every time
            pool.sort(() => 0.5 - Math.random());
            const selected = pool.slice(0, quantity);
            for (const row of selected) {
                pickedIds.add(row.id);
                reqMapping[row.id] = qType;
            }
        }

        const pickedArray = Array.from(pickedIds);
        if (pickedArray.length > 0) {
            const rowDatas = await query(
                `SELECT id, legacy_full_id as id_full, content_latex as raw_latex, content_latex_original AS original_latex 
                 FROM questions 
                 WHERE id IN (?)`,
                [pickedArray]
            );

            // Retain requirement type mapping
            for (const row of rowDatas) {
                const qType = reqMapping[row.id];
                if (finalQuestions[qType]) {
                    finalQuestions[qType].push(row);
                }
            }

            // Update question used_count asynchronously
            query(`UPDATE questions SET used_count = used_count + 1 WHERE id IN (?)`, [pickedArray]).catch(() => {});
        }

        // 5. Generate complete TeX document according to latest Ministry standards
        const tex = buildLatexDocument({
            questionsByType: finalQuestions,
            title: exam_title || "ĐỀ KIỂM TRA ĐỊNH KỲ",
            grade: grade_id ?? 12,
            duration: duration || 90,
            mode: mode || 'EXAM',
            schoolName: school_name || 'TRƯỜNG THPT CHUYÊN'
        });

        const total_questions = Object.values(finalQuestions).reduce((sum, list) => sum + list.length, 0);

        res.json({
            success: true,
            data: finalQuestions,
            tex,
            total_questions
        });
    } catch(e) {
        console.error("Exam Gen Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
