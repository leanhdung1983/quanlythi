import express from 'express';
import bcrypt from 'bcryptjs';
import { 
    query, 
    loginAttempts, 
    signSession, 
    isSelfOrAdmin, 
    requireAdmin,
    isAdmin, 
    SESSION_DURATION_MS 
} from '../core.js';
import { sendPasswordResetEmail } from '../emailService.js';

const router = express.Router();

function maskEmail(email) {
    if (!email || typeof email !== 'string') return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name.slice(-1)}@${domain}`;
}

// 1. Đăng nhập: Hỗ trợ linh hoạt cả Username hoặc Email
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const normalized = String(username || '').trim().toLowerCase();
        if (!normalized || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu.' });
        }

        const attemptKey = `${req.ip}:${normalized}`;
        const attempt = loginAttempts.get(attemptKey);
        if (attempt && attempt.count >= 5 && attempt.until > Date.now()) {
            const minutesLeft = Math.ceil((attempt.until - Date.now()) / (60 * 1000));
            return res.status(429).json({ 
                success: false, 
                message: `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.` 
            });
        }

        // Tìm user theo username HOẶC email
        const users = await query(
            "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", 
            [normalized, normalized]
        );

        const valid = users.length > 0 && await bcrypt.compare(password || '', users[0].password_hash);
        if (!valid) {
            const count = (attempt?.count || 0) + 1;
            loginAttempts.set(attemptKey, { count, until: Date.now() + 15 * 60 * 1000 });
            return res.status(401).json({ success: false, message: "Tên đăng nhập, email hoặc mật khẩu không đúng." });
        }

        loginAttempts.delete(attemptKey);
        const user = { ...users[0] };
        delete user.password_hash;
        delete user.reset_password_otp;
        delete user.reset_password_expires;

        const secure = process.env.NODE_ENV === 'production';
        res.cookie('id6_session', signSession(user), { 
            httpOnly: true, 
            sameSite: 'strict', 
            secure, 
            maxAge: SESSION_DURATION_MS, 
            path: '/' 
        });
        res.json({ success: true, user });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2. Đăng xuất
router.post('/logout', (req, res) => {
    res.clearCookie('id6_session', { 
        httpOnly: true, 
        sameSite: 'strict', 
        secure: process.env.NODE_ENV === 'production', 
        path: '/' 
    });
    res.json({ success: true });
});

// 3. Lấy thông tin tài khoản hiện tại (bao gồm mở rộng thông tin học sinh)
router.get('/me', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }
        const users = await query(`
            SELECT id, username, full_name, email, school, role, is_pro, expiry_date, 
                   grade_id, api_key, phone, parent_phone, date_of_birth, gender, 
                   class_name, student_code, address, avatar_url, bio, created_at
            FROM users WHERE id = ?
        `, [req.user.id]);

        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại hoặc đã bị xoá.' });
        }
        res.json({ success: true, user: users[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Đăng ký tài khoản (hỗ trợ đầy đủ thông tin Học sinh / Giáo viên)
router.post('/register', async (req, res) => {
    try {
        const { 
            username, 
            password, 
            full_name, 
            email, 
            school, 
            role,
            phone,
            parent_phone,
            date_of_birth,
            gender,
            class_name,
            grade_id,
            student_code,
            address
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Tên đăng nhập và mật khẩu là bắt buộc." });
        }
        const cleanUsername = String(username).trim();
        if (!/^[A-Za-z0-9_.-]{3,50}$/.test(cleanUsername)) {
            return res.status(400).json({ error: "Tên đăng nhập phải có 3-50 ký tự và chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới." });
        }
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
            return res.status(400).json({ error: "Mật khẩu phải có từ 8 đến 128 ký tự." });
        }
        
        let cleanEmail = email ? String(email).trim().toLowerCase() : null;
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ error: "Địa chỉ email không hợp lệ." });
        }

        const assignedRole = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
        
        // Kiểm tra trùng username
        const exists = await query("SELECT id FROM users WHERE LOWER(username) = ?", [cleanUsername.toLowerCase()]);
        if (exists.length > 0) return res.status(400).json({ error: "Tên đăng nhập này đã được sử dụng." });

        // Kiểm tra trùng email (nếu có cung cấp email)
        if (cleanEmail) {
            const emailExists = await query("SELECT id FROM users WHERE LOWER(email) = ?", [cleanEmail]);
            if (emailExists.length > 0) return res.status(400).json({ error: "Địa chỉ email này đã được liên kết với một tài khoản khác." });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await query(`
            INSERT INTO users (
                username, password_hash, full_name, email, school, role,
                phone, parent_phone, date_of_birth, gender, class_name, 
                grade_id, student_code, address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            cleanUsername,
            hash,
            full_name ? String(full_name).trim() : null,
            cleanEmail,
            school ? String(school).trim() : null,
            assignedRole,
            phone ? String(phone).trim() : null,
            parent_phone ? String(parent_phone).trim() : null,
            date_of_birth || null,
            gender || null,
            class_name ? String(class_name).trim() : null,
            grade_id ? parseInt(grade_id) : null,
            student_code ? String(student_code).trim() : null,
            address ? String(address).trim() : null
        ]);

        res.json({ success: true, userId: result.insertId, role: assignedRole });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// 5. Quên mật khẩu: Gửi mã OTP xác nhận tới email của học sinh/người dùng
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const normalized = String(email || '').trim().toLowerCase();
        if (!normalized) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email hoặc tên đăng nhập của bạn.' });
        }

        // Tìm kiếm theo email HOẶC username
        const users = await query(
            "SELECT id, username, full_name, email FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?", 
            [normalized, normalized]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy tài khoản tương ứng với thông tin bạn cung cấp.' 
            });
        }

        const user = users[0];
        if (!user.email || !user.email.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tài khoản này chưa cập nhật email khôi phục. Vui lòng liên hệ Giáo viên hoặc Quản trị viên để được cấp lại mật khẩu.' 
            });
        }

        // Tạo mã OTP 6 chữ số ngẫu nhiên an toàn
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Thời hạn 15 phút
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await query(
            "UPDATE users SET reset_password_otp = ?, reset_password_expires = ? WHERE id = ?",
            [otp, expires, user.id]
        );

        // Gửi email
        const mailResult = await sendPasswordResetEmail({
            to: user.email,
            fullName: user.full_name || user.username,
            otp,
            expiresMinutes: 15
        });

        const masked = maskEmail(user.email);
        res.json({ 
            success: true, 
            message: `Mã xác nhận 6 số đã được gửi đến email ${masked}. Vui lòng kiểm tra hộp thư (cả mục Spam/Rác) và nhập mã để đặt mật khẩu mới.`,
            email: user.email,
            masked_email: masked,
            // Chỉ trả về debug_otp khi KHÔNG ở production và email chưa được cấu hình
            debug_otp: (process.env.NODE_ENV !== 'production' && (mailResult.simulated || mailResult.delivered === false)) ? otp : undefined
        });
    } catch (e) { 
        res.status(500).json({ success: false, message: e.message }); 
    }
});

// 6. Đặt lại mật khẩu bằng mã OTP (Reset Password)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, new_password } = req.body;
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanOtp = String(otp || '').trim();
        const cleanPass = String(new_password || '').trim();

        if (!cleanEmail || !cleanOtp || !cleanPass) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới.' });
        }
        if (cleanPass.length < 8 || cleanPass.length > 128) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có từ 8 đến 128 ký tự.' });
        }

        const users = await query(
            "SELECT id, username, reset_password_otp, reset_password_expires FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND reset_password_otp IS NOT NULL",
            [cleanEmail, cleanEmail]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hoàn tất.' });
        }

        const user = users[0];
        if (user.reset_password_otp !== cleanOtp) {
            return res.status(400).json({ success: false, message: 'Mã OTP xác thực không chính xác.' });
        }

        if (new Date(user.reset_password_expires).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: 'Mã OTP đã hết hiệu lực (quá 15 phút). Vui lòng yêu cầu mã mới.' });
        }

        const hash = await bcrypt.hash(cleanPass, 10);
        await query(
            "UPDATE users SET password_hash = ?, reset_password_otp = NULL, reset_password_expires = NULL WHERE id = ?",
            [hash, user.id]
        );

        // Xóa bộ đếm đăng nhập sai nếu có
        for (const [key] of loginAttempts.entries()) {
            if (key.includes(user.username.toLowerCase())) {
                loginAttempts.delete(key);
            }
        }

        res.json({ success: true, message: 'Mật khẩu đã được thay đổi thành công! Bạn có thể đăng nhập ngay bây giờ.' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 7. Đổi mật khẩu cho người dùng đang đăng nhập (Change Password)
router.post('/change-password', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Bạn cần đăng nhập để đổi mật khẩu.' });
        }
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
        }
        if (typeof new_password !== 'string' || new_password.length < 8 || new_password.length > 128) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có từ 8 đến 128 ký tự.' });
        }
        if (current_password === new_password) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
        }

        const users = await query("SELECT id, password_hash FROM users WHERE id = ?", [req.user.id]);
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
        }

        const valid = await bcrypt.compare(current_password, users[0].password_hash);
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
        }

        const hash = await bcrypt.hash(new_password, 10);
        await query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.user.id]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Hỗ trợ alias route /users/:id/change-password
router.post('/users/:id/change-password', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.id)) {
            return res.status(403).json({ success: false, error: 'Bạn không có quyền đổi mật khẩu của tài khoản này.' });
        }
        const { current_password, new_password } = req.body;
        if (!new_password || typeof new_password !== 'string' || new_password.length < 8) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
        }

        // Nếu là Admin đổi mật khẩu cho user khác thì không bắt buộc nhập mật khẩu cũ
        if (!isAdmin(req) || Number(req.user?.id) === Number(req.params.id)) {
            if (!current_password) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại.' });
            }
            const users = await query("SELECT id, password_hash FROM users WHERE id = ?", [req.params.id]);
            const valid = users.length > 0 && await bcrypt.compare(current_password, users[0].password_hash);
            if (!valid) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
            }
        }

        const hash = await bcrypt.hash(new_password, 10);
        await query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.params.id]);
        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 8. Danh sách người dùng (dành cho Admin)
router.get('/users', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return;
        const rows = await query(`
            SELECT id, username, full_name, email, school, role, is_pro, expiry_date, 
                   grade_id, phone, parent_phone, date_of_birth, gender, class_name, 
                   student_code, address, created_at 
            FROM users 
            ORDER BY created_at DESC
        `); 
        res.json({ success: true, data: rows }); 
    } catch(e) { 
        res.status(500).json({ error: e.message }); 
    } 
});

// 9. Tạo người dùng mới từ trang quản trị
router.post('/users', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { 
            username, 
            password, 
            full_name, 
            email, 
            school, 
            role, 
            phone, 
            parent_phone, 
            class_name, 
            grade_id, 
            student_code, 
            gender, 
            address 
        } = req.body;

        if (!username || !password) return res.status(400).json({ error: "Tên đăng nhập và mật khẩu là bắt buộc." });
        if (typeof username !== 'string' || !/^[A-Za-z0-9_.-]{3,50}$/.test(username)) {
            return res.status(400).json({ error: "Tên đăng nhập phải có 3-50 ký tự và chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới." });
        }
        if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return res.status(400).json({ error: "Mật khẩu phải có từ 6 đến 128 ký tự." });
        }
        if (email && (typeof email !== 'string' || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            return res.status(400).json({ error: "Email không hợp lệ." });
        }
        const assignedRole = ['ADMIN', 'TEACHER', 'STUDENT'].includes(role) ? role : 'TEACHER';
        const exists = await query("SELECT id FROM users WHERE username = ?", [username]);
        if (exists.length > 0) return res.status(400).json({ error: "Tên đăng nhập đã tồn tại." });

        const hash = await bcrypt.hash(password, 10);
        const result = await query(`
            INSERT INTO users (
                username, password_hash, full_name, email, school, role,
                phone, parent_phone, class_name, grade_id, student_code, gender, address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            username, 
            hash, 
            full_name || null, 
            email || null, 
            school || null, 
            assignedRole,
            phone || null,
            parent_phone || null,
            class_name || null,
            grade_id ? parseInt(grade_id) : null,
            student_code || null,
            gender || null,
            address || null
        ]);
        res.json({ success: true, userId: result.insertId, role: assignedRole });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// 10. Cập nhật hồ sơ người dùng (hỗ trợ đầy đủ trường thông tin học sinh)
router.put('/users/:id/profile', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'Bạn không có quyền sửa hồ sơ này.' });
        const { 
            full_name, 
            email, 
            school, 
            grade_id, 
            role,
            phone,
            parent_phone,
            date_of_birth,
            gender,
            class_name,
            student_code,
            address,
            bio,
            avatar_url
        } = req.body;

        const fields = [];
        const params = [];

        if (full_name !== undefined) { fields.push('full_name = ?'); params.push(full_name || null); }
        if (email !== undefined) { fields.push('email = ?'); params.push(email || null); }
        if (school !== undefined) { fields.push('school = ?'); params.push(school || null); }
        if (grade_id !== undefined) { fields.push('grade_id = ?'); params.push(grade_id ? parseInt(grade_id) : null); }
        if (phone !== undefined) { fields.push('phone = ?'); params.push(phone || null); }
        if (parent_phone !== undefined) { fields.push('parent_phone = ?'); params.push(parent_phone || null); }
        if (date_of_birth !== undefined) { fields.push('date_of_birth = ?'); params.push(date_of_birth || null); }
        if (gender !== undefined) { fields.push('gender = ?'); params.push(gender || null); }
        if (class_name !== undefined) { fields.push('class_name = ?'); params.push(class_name || null); }
        if (student_code !== undefined) { fields.push('student_code = ?'); params.push(student_code || null); }
        if (address !== undefined) { fields.push('address = ?'); params.push(address || null); }
        if (bio !== undefined) { fields.push('bio = ?'); params.push(bio || null); }
        if (avatar_url !== undefined) { fields.push('avatar_url = ?'); params.push(avatar_url || null); }

        if (isAdmin(req) && role && ['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
            fields.push('role = ?');
            params.push(role);
        }

        if (fields.length > 0) {
            params.push(req.params.id);
            await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
        }

        res.json({ success: true, message: "Cập nhật hồ sơ thành công" });
    } catch(e) { 
        res.status(500).json({ error: e.message }); 
    }
});

// 11. Cập nhật API Key cá nhân
router.post('/users/:id/api-key', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.id)) return res.status(403).json({ error: 'Bạn không có quyền thay đổi khóa API này.' });
        const { api_key } = req.body;
        await query("UPDATE users SET api_key = ? WHERE id = ?", [api_key, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// 12. Kích hoạt hoặc hủy Pro
router.post('/users/:id/toggle-pro', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { is_pro } = req.body;
        const expiry = is_pro ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
        await query("UPDATE users SET is_pro = ?, expiry_date = ? WHERE id = ?", [is_pro, expiry, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// 13. Gia hạn Pro
router.post('/users/:id/renew-pro', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const expiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        await query("UPDATE users SET is_pro = 1, expiry_date = ? WHERE id = ?", [expiry, req.params.id]);
        res.json({ success: true, new_expiry: expiry });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// 14. Xóa tài khoản
router.delete('/users/:id', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return; 
        await query("DELETE FROM users WHERE id = ?", [req.params.id]); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

// 15. Thống kê bài thi của người dùng
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
