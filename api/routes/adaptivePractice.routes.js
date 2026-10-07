import express from 'express';
import { query } from '../core.js';
import { approvedPractice } from './eduloop.routes.js';
import { buildGapMap } from '../eduloop.js';
import { normalizeId6, parseId6 } from '../id6.js';
import { practiceScope, practicePattern, matchesPracticeScope } from '../eduLoopPractice.js';

const router = express.Router();
const quotaMessage = 'Bạn đã hết lượt ôn tập trong ngày (tối đa 2 lần). Các lần tạo đề thất bại không bị trừ lượt.';
router.post('/adaptive/generate', async (req, res) => {
    try {
        if (req.body.recommendation_id) return res.json(await approvedPractice(req));
        const limit = Math.min(30, Math.max(1, Number.parseInt(req.body.limit, 10) || 10));
        const userId = req.user.id;
        let scopes;
        let historyMap;
        if (req.body.skill_key) {
            const scope = practiceScope(req.body.skill_key);
            if (!scope) return res.status(400).json({ error: 'Dạng bài hoặc kỹ năng không hợp lệ.' });
            scopes = [scope];
        } else {
            const results = await query("SELECT id,user_id,status,created_at,result_detail FROM exam_results WHERE user_id=? AND status='COMPLETED'", [userId]);
            historyMap = buildGapMap(results);
            if (!historyMap.skills.length) return res.json({ success: true, needs_selection: true, data: [],
                ai_analysis: 'Hãy chọn từng dạng của bài để ôn tập trước. Kết quả sẽ giúp hệ thống đề xuất ôn tập cá nhân hóa.' });
            scopes = historyMap.skills.slice(0, 4).map(s => practiceScope(s.key)).filter(Boolean);
        }
        const [user] = await query('SELECT role,is_pro FROM users WHERE id=?', [userId]);
        const limited = user?.role === 'STUDENT' && !Number(user.is_pro);
        const today = new Date().toISOString().slice(0, 10);
        if (limited) {
            const [usage] = await query('SELECT review_count FROM activity_limits WHERE user_id=? AND activity_date=?', [userId, today]);
            if (Number(usage?.review_count) >= 2) return res.status(403).json({ error: quotaMessage });
        }
        // Reuse the authenticated shared bank, including imported ID6 questions.
        // SQL accepts legacy spelling; JS confirms scope before sending any item.
        const candidates = await query(`SELECT q.id,q.legacy_full_id AS id_full,q.content_latex,
            q.content_latex_original AS original_latex,q.content_latex AS raw_latex,qt.code AS type
            FROM questions q JOIN question_types qt ON qt.id=q.type_id
            WHERE qt.code IN ('TN','TF','KQ') AND TRIM(COALESCE(q.content_latex,''))<>''
            AND (${scopes.map(() => 'UPPER(q.legacy_full_id) REGEXP ?').join(' OR ')})
            ORDER BY RAND() LIMIT ?`, [...scopes.map(practicePattern), Math.max(200, limit)]);
        const seen = new Set();
        const eligible = candidates.filter(q => {
            if (seen.has(q.id) || !['TN','TF','KQ'].includes(q.type) || !scopes.some(s => matchesPracticeScope(q, s))) return false;
            seen.add(q.id); return true;
        });
        const buckets = ['N','H','V','C'].map(level => eligible.filter(q => parseId6(q.id_full)?.level === level));
        const questions = [];
        while (questions.length < limit && buckets.some(b => b.length)) {
            for (const bucket of buckets) if (bucket.length && questions.length < limit) questions.push(bucket.shift());
        }
        if (!questions.length) return res.status(422).json({ error: 'Dạng này hiện chưa có câu hỏi phù hợp. Hãy chọn dạng khác trong danh sách hoặc báo giáo viên bổ sung.' });
        // Reserve only once a valid test exists. Conditional UPDATE prevents
        // simultaneous requests from exceeding the daily limit.
        if (limited) {
            await query('INSERT INTO activity_limits (user_id,activity_date) VALUES (?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)', [userId, today]);
            const saved = await query('UPDATE activity_limits SET review_count=review_count+1 WHERE user_id=? AND activity_date=? AND review_count<2', [userId, today]);
            if (!saved.affectedRows) return res.status(403).json({ error: quotaMessage });
        }
        const data = questions.map(q => ({ ...q, id_full: normalizeId6(q.id_full) }));
        const evidence = data.map(q => {
            const skill = historyMap?.skills.find(s => s.key === q.id_full);
            return { question_id: q.id, skill: q.id_full,
                reason: skill ? `Cùng dạng đã làm: đúng ${skill.rate}% trên ${skill.attempts} lượt.` : 'Ôn tập dạng đã chọn; chưa đánh giá năng lực khi chưa có bài làm.' };
        });
        res.json({ success: true, data, evidence, approval: { status: 'SELF_PRACTICE' },
            ai_analysis: req.body.skill_key ? `Bài ôn có ${data.length} câu đúng phạm vi đã chọn; không lấy câu từ dạng khác.` : 'Ưu tiên các dạng có tỷ lệ đúng thấp trong lịch sử. Đây là minh chứng bài làm, chưa phải kết luận về năng lực.' });
    } catch (e) { res.status(e.status || 500).json({ error: e.code === 'ER_NO_SUCH_TABLE' ? 'Chưa đủ bảng dữ liệu ôn tập. Giáo viên cần kiểm tra cấu hình hệ thống.' : 'Không tải được câu hỏi ôn tập. Vui lòng thử lại.', }); }
});
export default router;
