import express from 'express';
import bcrypt from 'bcryptjs';
import { 
    query, 
    loginAttempts, 
    signSession, 
    isSelfOrAdmin, 
    requireAdmin,
    SESSION_DURATION_MS 
} from '../core.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const attemptKey = `${req.ip}:${String(username || '').toLowerCase()}`;
        const attempt = loginAttempts.get(attemptKey);
        if (attempt && attempt.count >= 5 && attempt.until > Date.now()) {
            return res.status(429).json({ success: false, message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.' });
        }
        const users = await query("SELECT * FROM users WHERE username = ?", [username]);
        const valid = users.length > 0 && await bcrypt.compare(password || '', users[0].password_hash);
        if (!valid) {
            const count = (attempt?.count || 0) + 1;
            loginAttempts.set(attemptKey, { count, until: Date.now() + 15 * 60 * 1000 });
            return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }
        loginAttempts.delete(attemptKey);
        const user = { ...users[0] };
        delete user.password_hash;
        const secure = process.env.NODE_ENV === 'production';
        res.cookie('id6_session', signSession(user), { httpOnly: true, sameSite: 'strict', secure, maxAge: SESSION_DURATION_MS, path: '/' });
        res.json({ success: true, user });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/logout', (req, res) => {
    res.clearCookie('id6_session', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
    res.json({ success: true });
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, full_name, email, school } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Tên đăng nhập và mật khẩu là bắt buộc." });
        if (typeof username !== 'string' || !/^[A-Za-z0-9_.-]{3,50}$/.test(username)) {
            return res.status(400).json({ error: "Tên đăng nhập phải có 3-50 ký tự và chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới." });
        }
        if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
            return res.status(400).json({ error: "Mật khẩu phải có từ 10 đến 128 ký tự." });
        }
        if (email && (typeof email !== 'string' || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            return res.status(400).json({ error: "Email không hợp lệ." });
        }

        // Đăng ký công khai luôn tạo học sinh. Giáo viên/Quản trị viên chỉ do quản trị viên cấp.
        const assignedRole = 'STUDENT';
        
        const exists = await query("SELECT id FROM users WHERE username = ?", [username]);
        if (exists.length > 0) return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });

        const hash = await bcrypt.hash(password, 10);
        const result = await query(
            "INSERT INTO users (username, password_hash, full_name, email, school, role) VALUES (?, ?, ?, ?, ?, ?)", 
            [username, hash, full_name || null, email || null, school || null, assignedRole]
        );
        res.json({ success: true, userId: result.insertId, role: assignedRole });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== 'string' || !email.includes('@')) return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
        res.json({ success: true, message: "Nếu email tồn tại, hướng dẫn khôi phục sẽ được gửi tới bạn." });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/users', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return;
        const rows = await query("SELECT id, username, full_name, email, school, role, is_pro, expiry_date, grade_id, created_at FROM users"); 
        res.json({ success: true, data: rows }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

router.put('/users/:id/profile', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'Bạn không có quyền sửa hồ sơ này.' });
        const { full_name, email, school, grade_id } = req.body;
        await query("UPDATE users SET full_name = ?, email = ?, school = ?, grade_id = ? WHERE id = ?", [full_name, email, school, grade_id, req.params.id]);
        res.json({ success: true, message: "Updated profile" });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/api-key', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'Bạn không có quyền thay đổi khóa API này.' });
        const { api_key } = req.body;
        await query("UPDATE users SET api_key = ? WHERE id = ?", [api_key, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/toggle-pro', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { is_pro } = req.body;
        const expiry = is_pro ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
        await query("UPDATE users SET is_pro = ?, expiry_date = ? WHERE id = ?", [is_pro, expiry, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/renew-pro', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const expiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        await query("UPDATE users SET is_pro = 1, expiry_date = ? WHERE id = ?", [expiry, req.params.id]);
        res.json({ success: true, new_expiry: expiry });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return; 
        await query("DELETE FROM users WHERE id = ?", [req.params.id]); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

router.get('/users/:id/dashboard-stats', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'Bạn không có quyền xem thống kê của người dùng này.' });
        const results = await query("SELECT result_detail, score FROM exam_results WHERE user_id = ? AND status = 'COMPLETED'", [req.params.id]);
        
        const totalExams = results.length;
        let totalScore = 0;
        const topicStats = {};

        results.forEach(r => {
            totalScore += parseFloat(r.score) || 0;
            try {
                const detail = typeof r.result_detail === 'string' ? JSON.parse(r.result_detail) : r.result_detail;
                const { questions, answers } = detail;
                if (questions && answers) {
                    questions.forEach(q => {
                        let isCorrect = false;
                        const userAns = answers[q.id];
                        if (q.type === 'TN') {
                            const correctOpt = q.options?.find(o => o.isCorrect);
                            if (correctOpt && userAns === correctOpt.id) isCorrect = true;
                        } else if (q.type === 'KQ') {
                            if (userAns && q.correctAnswer && userAns.toString().trim() === q.correctAnswer.toString().trim()) isCorrect = true;
                        }
                        
                        const idParts = (q.id_full || '').split('-');
                        const topic = idParts.length >= 2 ? idParts.slice(0, 2).join('-') : (q.id_full || 'Khác');
                        
                        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
                        topicStats[topic].total++;
                        if (isCorrect) topicStats[topic].correct++;
                    });
                }
            } catch {}
        });

        const weakTopics = Object.entries(topicStats)
            .map(([topic, stat]) => ({ topic, accuracy: Math.round((stat.correct / stat.total) * 100), total: stat.total }))
            .filter(t => t.total >= 1)
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 8);

        res.json({ success: true, data: { totalExams, averageScore: totalExams ? (totalScore/totalExams).toFixed(1) : 0, weakTopics } });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
