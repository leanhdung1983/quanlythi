import express from 'express';
import { pool } from '../core.js';
import { assignClasses } from '../classAssignments.js';
import { 
    query, 
    isAdmin, 
    isSelfOrAdmin, 
    canManageClass, 
    canAccessClass 
} from '../core.js';

const router = express.Router();

// 1. Lấy danh sách lớp của một giáo viên
router.get('/classes', async (req, res) => {
    try {
        const teacher_id = (req.user?.role === 'ADMIN' && req.query.teacher_id) ? req.query.teacher_id : req.user?.id;
        if (!teacher_id) return res.status(400).json({ error: "teacher_id is required" });
        const rows = await query("SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC", [teacher_id]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Giáo viên tạo lớp mới
router.post('/classes', async (req, res) => {
    try {
        if (req.user?.role === 'STUDENT') return res.status(403).json({ error: "Chỉ giáo viên hoặc quản trị viên mới có quyền tạo lớp học." });
        const teacher_id = req.user?.id;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: "Tên lớp không được để trống" });
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const result = await query("INSERT INTO classes (teacher_id, name, code) VALUES (?, ?, ?)", [teacher_id, name.trim(), code]);
        res.json({ success: true, class_id: result.insertId, code });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Xoá lớp học (Chỉ Giáo viên sở hữu hoặc Admin)
router.delete('/classes/:id', async (req, res) => {
    try {
        const [cls] = await query("SELECT teacher_id FROM classes WHERE id = ?", [req.params.id]);
        if (!cls) return res.status(404).json({ error: "Lớp học không tồn tại" });
        if (req.user?.role !== 'ADMIN' && cls.teacher_id !== req.user?.id) {
            return res.status(403).json({ error: "Bạn không có quyền xoá lớp học này." });
        }
        await query("DELETE FROM classes WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Lấy danh sách học sinh trong lớp
router.get('/classes/:class_id/students', async (req, res) => {
    try {
        if (!(await canManageClass(req, req.params.class_id))) return res.status(403).json({ error: 'Bạn không có quyền xem danh sách học sinh của lớp này.' });
        const rows = await query(`
            SELECT u.id, u.username, u.full_name, u.email, u.school, cs.status, cs.joined_at
            FROM class_students cs
            JOIN users u ON cs.student_id = u.id
            WHERE cs.class_id = ?
            ORDER BY u.full_name ASC
        `, [req.params.class_id]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Học sinh tham gia lớp bằng mã
router.post('/classes/join', async (req, res) => {
    try {
        if (req.user?.role !== 'STUDENT') return res.status(403).json({ error: 'Chỉ tài khoản học sinh mới được tham gia lớp.' });
        const student_id = req.user?.id;
        const { code } = req.body;
        if (!code || !code.trim()) return res.status(400).json({ error: "Vui lòng nhập mã lớp" });
        const [cls] = await query("SELECT id FROM classes WHERE code = ?", [code.trim().toUpperCase()]);
        if (!cls) return res.status(404).json({ error: "Mã lớp không hợp lệ" });
        
        const [existing] = await query("SELECT * FROM class_students WHERE class_id = ? AND student_id = ?", [cls.id, student_id]);
        if (existing) return res.status(400).json({ error: "Bạn đã ở trong lớp này" });

        await query("INSERT INTO class_students (class_id, student_id) VALUES (?, ?)", [cls.id, student_id]);
        res.json({ success: true, class_id: cls.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5.5. Giáo viên tự thêm học sinh vào lớp bằng email hoặc username
router.post('/classes/:class_id/add-student', async (req, res) => {
    try {
        const [cls] = await query("SELECT teacher_id FROM classes WHERE id = ?", [req.params.class_id]);
        if (!cls) return res.status(404).json({ error: "Lớp học không tồn tại" });
        if (req.user?.role !== 'ADMIN' && cls.teacher_id !== req.user?.id) {
            return res.status(403).json({ error: "Bạn không có quyền quản lý học sinh trong lớp này." });
        }

        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ error: "Vui lòng nhập Email hoặc Tài khoản" });
        
        const [student] = await query("SELECT id, role FROM users WHERE email = ? OR username = ?", [identifier, identifier]);
        if (!student) return res.status(404).json({ error: "Không tìm thấy học sinh với thông tin này" });
        if (student.role !== 'STUDENT') return res.status(400).json({ error: "Tài khoản này không phải là Học sinh" });
        
        const [existing] = await query("SELECT * FROM class_students WHERE class_id = ? AND student_id = ?", [req.params.class_id, student.id]);
        if (existing) return res.status(400).json({ error: "Học sinh này đã ở trong lớp" });

        await query("INSERT INTO class_students (class_id, student_id) VALUES (?, ?)", [req.params.class_id, student.id]);
        res.json({ success: true, message: "Thêm học sinh thành công" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Xoá học sinh khỏi lớp
router.delete('/classes/:class_id/students/:student_id', async (req, res) => {
    try {
        const [cls] = await query("SELECT teacher_id FROM classes WHERE id = ?", [req.params.class_id]);
        if (!cls) return res.status(404).json({ error: "Lớp học không tồn tại" });
        if (req.user?.role !== 'ADMIN' && cls.teacher_id !== req.user?.id && req.user?.id != req.params.student_id) {
            return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này." });
        }

        await query("DELETE FROM class_students WHERE class_id = ? AND student_id = ?", [req.params.class_id, req.params.student_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. Lấy danh sách bài tập (ma trận) của lớp
router.get('/classes/:class_id/assignments', async (req, res) => {
    try {
        if (!(await canAccessClass(req, req.params.class_id))) return res.status(403).json({ error: 'Bạn không có quyền xem bài tập của lớp này.' });
        const rows = await query(`
            SELECT m.*, 
                   ca.id as assignment_id, 
                   ca.created_at as assigned_at,
                   ca.open_time,
                   ca.deadline,
                   ca.max_attempts,
                   ca.allow_review
            FROM class_assignments ca
            JOIN matrix_templates m ON ca.matrix_id = m.id
            WHERE ca.class_id = ?
            ORDER BY ca.created_at DESC
        `, [req.params.class_id]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Single and multi-class assignments share atomic validation and duplicate protection.
router.post('/classes/assignments/bulk', async (req, res) => {
    try { res.json({ success: true, ...await assignClasses(pool, req.user, req.body) }); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
router.post('/classes/:class_id/assignments', async (req, res) => {
    try {
        const result = await assignClasses(pool, req.user, { ...req.body, class_ids: [req.params.class_id] });
        if (result.skipped.length) return res.status(400).json({ error: 'Bài tập này đã được giao cho lớp' });
        res.json({ success: true, ...result });
    } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// 8.5. Cập nhật thông số LMS của bài tập đã giao
router.put('/classes/assignments/:assignment_id', async (req, res) => {
    try {
        const [assignment] = await query(`
            SELECT ca.id, c.teacher_id 
            FROM class_assignments ca 
            JOIN classes c ON ca.class_id = c.id 
            WHERE ca.id = ?
        `, [req.params.assignment_id]);
        if (!assignment) return res.status(404).json({ error: "Bài tập không tồn tại" });
        if (req.user?.role !== 'ADMIN' && assignment.teacher_id !== req.user?.id) {
            return res.status(403).json({ error: "Bạn không có quyền sửa thông số bài tập này." });
        }

        const { open_time, deadline, max_attempts, allow_review } = req.body;
        const parsedOpenTime = open_time ? new Date(open_time) : null;
        const parsedDeadline = deadline ? new Date(deadline) : null;
        if (parsedOpenTime && isNaN(parsedOpenTime.getTime())) return res.status(400).json({ error: 'Thời gian mở đề không hợp lệ.' });
        if (parsedDeadline && isNaN(parsedDeadline.getTime())) return res.status(400).json({ error: 'Hạn nộp bài không hợp lệ.' });
        if (parsedOpenTime && parsedDeadline && parsedOpenTime >= parsedDeadline) {
            return res.status(400).json({ error: 'Hạn nộp bài phải diễn ra sau thời gian mở đề.' });
        }
        const safeMaxAttempts = Math.max(0, parseInt(max_attempts, 10) || 0);
        const safeAllowReview = allow_review !== false ? 1 : 0;

        await query(
            "UPDATE class_assignments SET open_time = ?, deadline = ?, max_attempts = ?, allow_review = ? WHERE id = ?",
            [parsedOpenTime, parsedDeadline, safeMaxAttempts, safeAllowReview, req.params.assignment_id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9. Xoá bài tập khỏi lớp
router.delete('/classes/assignments/:assignment_id', async (req, res) => {
    try {
        const [assignment] = await query(`
            SELECT ca.id, c.teacher_id 
            FROM class_assignments ca 
            JOIN classes c ON ca.class_id = c.id 
            WHERE ca.id = ?
        `, [req.params.assignment_id]);
        if (!assignment) return res.status(404).json({ error: "Bài tập không tồn tại" });
        if (req.user?.role !== 'ADMIN' && assignment.teacher_id !== req.user?.id) {
            return res.status(403).json({ error: "Bạn không có quyền xoá bài tập này." });
        }

        await query("DELETE FROM class_assignments WHERE id = ?", [req.params.assignment_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 10. Lấy danh sách bài tập học sinh được giao kèm thông số LMS và trạng thái
router.get('/students/:student_id/assignments', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.student_id)) return res.status(403).json({ error: 'Bạn không có quyền xem bài tập của học sinh này.' });
        const studentId = req.params.student_id;
        const sql = `
            SELECT 
                ca.id as assignment_id, 
                ca.created_at as assigned_at, 
                ca.class_id, 
                ca.open_time,
                ca.deadline,
                ca.max_attempts,
                ca.allow_review,
                mt.*, 
                c.name as class_name,
                (SELECT COUNT(*) FROM exam_results er 
                 WHERE er.user_id = ? AND er.matrix_id = ca.matrix_id AND er.status = 'COMPLETED') as completed_attempts
            FROM class_assignments ca
            JOIN class_students cs ON ca.class_id = cs.class_id
            JOIN matrix_templates mt ON ca.matrix_id = mt.id
            JOIN classes c ON ca.class_id = c.id
            WHERE cs.student_id = ?
            ORDER BY ca.created_at DESC
        `;
        const rows = await query(sql, [studentId, studentId]);
        const now = new Date();
        const data = rows.map(r => {
            let status = 'ACTIVE';
            if (r.open_time && new Date(r.open_time) > now) {
                status = 'UPCOMING';
            } else if (r.deadline && new Date(r.deadline) < now) {
                status = 'EXPIRED';
            } else if (r.max_attempts > 0 && r.completed_attempts >= r.max_attempts) {
                status = 'ATTEMPTS_EXHAUSTED';
            }
            return { ...r, status };
        });
        res.json({ success: true, data });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// 10.5. Lấy danh sách lớp mà học sinh đang tham gia
router.get('/students/:student_id/classes', async (req, res) => {
    try {
        if (!isSelfOrAdmin(req, req.params.student_id)) return res.status(403).json({ error: 'Bạn không có quyền xem lớp của học sinh này.' });
        const rows = await query(`
            SELECT c.*, u.full_name as teacher_name, cs.status, cs.joined_at
            FROM class_students cs
            JOIN classes c ON cs.class_id = c.id
            JOIN users u ON c.teacher_id = u.id
            WHERE cs.student_id = ?
            ORDER BY cs.joined_at DESC
        `, [req.params.student_id]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 11. Thống kê điểm của lớp
router.get('/classes/:class_id/scores', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
        if (!(await canManageClass(req, req.params.class_id))) return res.status(403).json({ error: 'Bạn không có quyền xem điểm của lớp này.' });
        const rows = await query(`
            SELECT 
                u.id as student_id, u.full_name, u.username,
                m.id as matrix_id, m.name as assignment_name,
                er.id as attempt_id,
                er.score as score,
                er.last_updated as submit_time
            FROM class_students cs
            JOIN users u ON cs.student_id = u.id
            JOIN class_assignments ca ON cs.class_id = ca.class_id
            JOIN matrix_templates m ON ca.matrix_id = m.id
            LEFT JOIN exam_results er ON er.user_id = cs.student_id AND er.matrix_id = ca.matrix_id AND er.status = 'COMPLETED'
            WHERE cs.class_id = ?
            ORDER BY u.full_name ASC, m.id ASC, er.created_at ASC
        `, [req.params.class_id]);

        const attemptCounts = {};
        const formattedRows = rows.map(r => {
            if (!r.attempt_id) return { ...r, attempt_index: null };
            const key = `${r.student_id}_${r.matrix_id}`;
            attemptCounts[key] = (attemptCounts[key] || 0) + 1;
            return { ...r, attempt_index: attemptCounts[key] };
        });

        res.json({ success: true, data: formattedRows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
