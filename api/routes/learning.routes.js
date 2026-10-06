import express from 'express';
import { query, isSelfOrAdmin, requireAdmin } from '../core.js';
import { requireLearningUnit, learningError } from '../learningAccess.js';

const router = express.Router();

router.get('/lesson-sections', async (req, res) => {
    try {
        const { unit_id } = req.query;
        if (unit_id) await requireLearningUnit(req, unit_id);
        else if (req.user.role === 'STUDENT') throw learningError(400, 'Chọn bài học trước khi tải nội dung.');
        
        let sql = "SELECT * FROM lesson_sections";
        const params = [];
        if (unit_id) {
            sql += " WHERE unit_id = ?";
            params.push(unit_id);
        }
        sql += " ORDER BY order_index ASC";
        const rows = await query(sql, params);
        res.json({ success: true, data: rows });
    } catch(e) { res.status(e.status || 500).json({ error: e.message }); }
});

router.post('/admin/lesson-sections', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const { unit_id, title, content, video_url, interactive_html, order_index, matrix_id } = req.body;
        await query("INSERT INTO lesson_sections (unit_id, title, content, video_url, interactive_html, order_index, matrix_id) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                    [unit_id, title, content, video_url, interactive_html, order_index || 0, matrix_id || null]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/admin/lesson-sections/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const { title, content, video_url, interactive_html, order_index, matrix_id } = req.body;
        await query("UPDATE lesson_sections SET title = ?, content = ?, video_url = ?, interactive_html = ?, order_index = ?, matrix_id = ? WHERE id = ?", 
                    [title, content, video_url, interactive_html, order_index || 0, matrix_id || null, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/lesson-sections/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        await query("DELETE FROM user_lesson_progress WHERE section_id = ?", [req.params.id]);
        await query("DELETE FROM lesson_sections WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/user/lesson-progress/:userId', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.userId)) return res.status(403).json({ error: 'Bạn không có quyền xem tiến độ này.' });
        const rows = await query("SELECT section_id, is_completed, score FROM user_lesson_progress WHERE user_id = ?", [req.params.userId]);
        res.json({ success: true, data: rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/user/lesson-progress', async (req, res) => {
    try {
        const { section_id, is_completed, score } = req.body;
        const user_id = req.user.id;
        if (!Number.isSafeInteger(Number(section_id)) || Number(section_id) < 1 || ![true,false,0,1].includes(is_completed) || !Number.isFinite(Number(score ?? 0)) || Number(score ?? 0) < 0 || Number(score ?? 0) > 10) throw learningError(400, 'Tiến độ hoặc điểm học không hợp lệ.');
        const [section] = await query('SELECT unit_id FROM lesson_sections WHERE id=?', [section_id]);
        if (!section) throw learningError(404, 'Mục học không tồn tại.');
        await requireLearningUnit(req, section.unit_id);
        await query(`
            INSERT INTO user_lesson_progress (user_id, section_id, is_completed, score) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed), score = VALUES(score)
        `, [user_id, section_id, is_completed, Number(score ?? 0)]);
        res.json({ success: true });
    } catch(e) { res.status(e.status || 500).json({ error: e.message }); }
});

export default router;
