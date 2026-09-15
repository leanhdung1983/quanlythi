import express from 'express';
import { query, isSelfOrAdmin, cacheMiddleware } from '../core.js';

const router = express.Router();

router.get('/lesson-sections', cacheMiddleware(300), async (req, res) => {
    try {
        const { unit_id } = req.query;
        const user_id = req.user.id;
        
        if (user_id && unit_id) {
            const [user] = await query("SELECT role, is_pro FROM users WHERE id = ?", [user_id]);
            if (user && user.role === 'STUDENT' && !user.is_pro) {
                // Check if this unit is the first unit in its chapter
                const [unit] = await query("SELECT chapter_id, unit_number FROM units WHERE id = ?", [unit_id]);
                if (unit) {
                    const [firstUnit] = await query("SELECT id FROM units WHERE chapter_id = ? ORDER BY unit_number ASC LIMIT 1", [unit.chapter_id]);
                    if (firstUnit && firstUnit.id != unit_id) {
                        return res.status(403).json({ error: "Tài khoản miễn phí chỉ được học bài đầu tiên của mỗi chương. Vui lòng nâng cấp Pro để học toàn bộ." });
                    }
                }
            }
        }
        
        let sql = "SELECT * FROM lesson_sections";
        const params = [];
        if (unit_id) {
            sql += " WHERE unit_id = ?";
            params.push(unit_id);
        }
        sql += " ORDER BY order_index ASC";
        const rows = await query(sql, params);
        res.json({ success: true, data: rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/admin/lesson-sections', async (req, res) => {
    try {
        const { unit_id, title, content, video_url, interactive_html, order_index, matrix_id } = req.body;
        await query("INSERT INTO lesson_sections (unit_id, title, content, video_url, interactive_html, order_index, matrix_id) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                    [unit_id, title, content, video_url, interactive_html, order_index || 0, matrix_id || null]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/admin/lesson-sections/:id', async (req, res) => {
    try {
        const { title, content, video_url, interactive_html, order_index, matrix_id } = req.body;
        await query("UPDATE lesson_sections SET title = ?, content = ?, video_url = ?, interactive_html = ?, order_index = ?, matrix_id = ? WHERE id = ?", 
                    [title, content, video_url, interactive_html, order_index || 0, matrix_id || null, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/lesson-sections/:id', async (req, res) => {
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
        await query(`
            INSERT INTO user_lesson_progress (user_id, section_id, is_completed, score) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed), score = VALUES(score)
        `, [user_id, section_id, is_completed, score]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
