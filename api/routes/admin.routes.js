import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";
import { 
    pool,
    query, 
    isAdmin, 
    requireAdmin, 
    requireTeacherOrAdmin,
    getGeminiApiKey,
    generateWithFallback,
    parseGeminiError,
    seedDatabase
} from '../core.js';

const router = express.Router();

// 1. Settings Endpoints
router.get('/admin/settings', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const rows = await query("SELECT setting_key, setting_value FROM system_settings");
        const settings = {};
        rows.forEach(r => settings[r.setting_key] = r.setting_value);
        res.json({ success: true, data: settings });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/admin/settings', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { setting_key, setting_value } = req.body;
        await query(`
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [setting_key, setting_value]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// 2. Question Images & TikZ Management
router.get('/admin/question-images', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const rows = await query("SELECT id, tikz_hash, created_at FROM question_images ORDER BY created_at DESC");
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/question-images/:hash', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM question_images WHERE tikz_hash = ?", [req.params.hash]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/questions/full', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const limit = req.query.limit ? parseInt(req.query.limit) : 500;
        const filterType = req.query.filterType || 'ALL';
        
        let targetFilter = "";
        const args = [];
        if (filterType === 'RENDERED') {
            targetFilter = "WHERE is_tikz_rendered = 1";
        } else if (filterType === 'NOT_RENDERED') {
            targetFilter = "WHERE is_tikz_rendered = 0";
        } else if (filterType === 'NONE') {
            targetFilter = "WHERE is_tikz_rendered = 2";
        }
        
        args.push(limit);
        const rows = await query(`SELECT id, legacy_full_id, content_latex, content_latex_original AS original_latex, is_tikz_rendered FROM questions ${targetFilter} ORDER BY created_at DESC LIMIT ?`, args);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. AI Curriculum & Lesson Sections Generation
router.post('/admin/ai/generate-curriculum', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { gradeCode, subjectCode } = req.body;
        
        const gRows = await query("SELECT id FROM grades WHERE code = ?", [gradeCode]);
        let grade_id = gRows?.[0]?.id;
        if (!grade_id) {
            const resG = await query("INSERT INTO grades (code, name) VALUES (?, ?)", [gradeCode, `Lớp ${gradeCode}`]);
            grade_id = resG.insertId;
        }

        const sRows = await query("SELECT id FROM subjects WHERE code = ?", [subjectCode]);
        let subject_id = sRows?.[0]?.id;
        if (!subject_id) {
            const subjectName = subjectCode === 'T' ? 'Toán' : subjectCode === 'V' ? 'Văn' : subjectCode;
            const resS = await query("INSERT INTO subjects (code, name) VALUES (?, ?)", [subjectCode, subjectName]);
            subject_id = resS.insertId;
        }

        const apiKey = await getGeminiApiKey(req.user?.id);
        const ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        
        const subjectName = subjectCode === 'T' ? 'Toán' : subjectCode === 'V' ? 'Văn' : subjectCode;
        const prompt = `Tạo danh mục chương và bài học cho môn ${subjectName} lớp ${gradeCode} theo sách giáo khoa "Kết nối tri thức với cuộc sống". Mảng JSON hợp lệ gồm danh sách các Object: [{ "chapter_number": 1, "name": "Tên chương", "units": [{ "unit_number": 1, "name": "Tên bài" }] }]`;

        const response = await generateWithFallback(ai, prompt, {
            responseMimeType: "application/json"
        });

        let responseText = typeof response.text === 'function' ? response.text() : String(response.text || "[]");
        responseText = responseText.replace(/^```json\n?|```$/g, '').trim();
        const structure = JSON.parse(responseText);

        for (const chapter of structure) {
            let chapter_id;
            const cRows = await query("SELECT id FROM chapters WHERE grade_id = ? AND subject_id = ? AND chapter_number = ?", [grade_id, subject_id, chapter.chapter_number]);
            if (cRows && cRows.length > 0) {
                chapter_id = cRows[0].id;
                await query("UPDATE chapters SET name = ? WHERE id = ?", [chapter.name, chapter_id]);
            } else {
                const insertC = await query("INSERT INTO chapters (grade_id, subject_id, chapter_number, name) VALUES (?, ?, ?, ?)", [grade_id, subject_id, chapter.chapter_number, chapter.name]);
                chapter_id = insertC.insertId;
            }

            for (const unit of chapter.units) {
                const uRows = await query("SELECT id FROM units WHERE chapter_id = ? AND unit_number = ?", [chapter_id, unit.unit_number]);
                if (uRows && uRows.length > 0) {
                    await query("UPDATE units SET name = ? WHERE id = ?", [unit.name, uRows[0].id]);
                } else {
                    await query("INSERT INTO units (chapter_id, unit_number, name) VALUES (?, ?, ?)", [chapter_id, unit.unit_number, unit.name]);
                }
            }
        }

        res.json({ success: true, count: structure.length });
    } catch(e) { 
        console.error("AI Gen Curriculum Error:", e);
        res.status(500).json({ error: parseGeminiError(e) }); 
    }
});

router.post('/admin/ai/generate-lesson-sections', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { unit_id, unit_name, chapter_name, gradeCode, subjectCode } = req.body;
        
        const apiKey = await getGeminiApiKey(req.user?.id);
        const ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const subjectName = subjectCode === 'T' ? 'Toán' : subjectCode === 'V' ? 'Văn' : subjectCode;
        
        const prompt = `Viết nội dung bài học chi tiết và CHÍNH XÁC TUYỆT ĐỐI cho bài học: "${unit_name}" nằm trong chương "${chapter_name}" của môn ${subjectName} lớp ${gradeCode}.
LƯU Ý QUAN TRỌNG: Nội dung bắt buộc phải đúng trọng tâm của bài "${unit_name}". Không viết lan man sang bài khác (ví dụ: nếu là bài tập hợp thì chỉ viết về tập hợp, không viết về mệnh đề).

Yêu cầu tạo 2 phần (sections) theo thứ tự:
1. Lý thuyết: 
   - Giải thích cặn kẽ Lý thuyết cho TRÚNG bài "${unit_name}".
   - Quy tắc định dạng (RẤT QUAN TRỌNG):
     + CHỈ sử dụng Markdown tiêu chuẩn để định dạng bố cục (dùng #, ##, **đậm**, *nghiêng*).
     + TUYỆT ĐỐI KHÔNG SỬ DỤNG các lệnh định dạng LaTeX như \\Large, \\huge, \\vspace, \\section, \\textbf, \\textit, v.v.
     + CHỈ sử dụng LaTeX cho biểu thức, công thức toán học và đặt giữa 2 dấu $ (ví dụ: $x^2 + y^2 = r^2$) hoặc $$ cho biểu thức block.
2. Luyện tập tương tác cơ bản: 
   - Một đoạn mã HTML sinh động, có Tailwind (qua cdn: https://cdn.tailwindcss.com) và JS chạy luyện tập TƯƠNG TÁC liên quan trực tiếp đến bài "${unit_name}".
   - Trả về đúng chuỗi mã HTML (full code <!DOCTYPE html...), ứng dụng chạy độc lập. Khi người dùng làm đúng 1 câu thì gọi: window.parent.postMessage({ type: 'LESSON_COMPLETE', score: 1 }, '*');

Đối với mỗi phần, cần có title, nội dung dạng Markdown. (Interactive html chỉ dành cho phần 2). Không cần điền video_url.
Yêu cầu trả về mảng JSON hợp lệ gồm danh sách các Object: [{ "order_index": 1, "title": "Tiêu đề", "content": "Nội dung markdown (KHÔNG CHỨA LỆNH vspace, Large, section...)", "interactive_html": "Mã HTML (nếu có)" }]`;

        const response = await generateWithFallback(ai, prompt, {
            responseMimeType: "application/json"
        });

        let responseText = typeof response.text === 'function' ? response.text() : String(response.text || "[]");
        responseText = responseText.replace(/^```json\n?|```$/g, '').trim();
        const sections = JSON.parse(responseText);

        for (const sec of sections) {
            await query("INSERT INTO lesson_sections (unit_id, title, content, video_url, interactive_html, order_index) VALUES (?, ?, ?, ?, ?, ?)", [
                unit_id,
                sec.title,
                sec.content || '',
                '',
                sec.interactive_html || '',
                sec.order_index
            ]);
        }

        res.json({ success: true, count: sections.length });
    } catch(e) { 
        console.error("AI Gen Section Error:", e);
        res.status(500).json({ error: parseGeminiError(e) }); 
    }
});

// 4. Admin Chapter, Unit & Lesson Section CRUD
router.post('/admin/chapters', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { gradeCode, subjectCode, chapter_number, name } = req.body;
        
        const gRows = await query("SELECT id FROM grades WHERE code = ?", [gradeCode]);
        let grade_id = gRows?.[0]?.id;
        if (!grade_id) {
            const resG = await query("INSERT INTO grades (code, name) VALUES (?, ?)", [gradeCode, `Lớp ${gradeCode}`]);
            grade_id = resG.insertId;
        }

        const sRows = await query("SELECT id FROM subjects WHERE code = ?", [subjectCode]);
        let subject_id = sRows?.[0]?.id;
        if (!subject_id) {
            const subjectName = subjectCode === 'T' ? 'Toán' : subjectCode === 'V' ? 'Văn' : subjectCode;
            const resS = await query("INSERT INTO subjects (code, name) VALUES (?, ?)", [subjectCode, subjectName]);
            subject_id = resS.insertId;
        }

        await query("INSERT INTO chapters (grade_id, subject_id, chapter_number, name) VALUES (?, ?, ?, ?)", [grade_id, subject_id, chapter_number, name]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/chapters/:id', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const units = await query("SELECT id FROM units WHERE chapter_id = ?", [req.params.id]);
        for (const u of units) {
            await query("DELETE FROM user_lesson_progress WHERE section_id IN (SELECT id FROM lesson_sections WHERE unit_id = ?)", [u.id]);
            await query("DELETE FROM lesson_sections WHERE unit_id = ?", [u.id]);
        }
        await query("DELETE FROM units WHERE chapter_id = ?", [req.params.id]);
        await query("DELETE FROM chapters WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/admin/units', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { chapter_id, unit_number, name } = req.body;
        await query("INSERT INTO units (chapter_id, unit_number, name) VALUES (?, ?, ?)", [chapter_id, unit_number, name]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/units/:id', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM user_lesson_progress WHERE section_id IN (SELECT id FROM lesson_sections WHERE unit_id = ?)", [req.params.id]);
        await query("DELETE FROM lesson_sections WHERE unit_id = ?", [req.params.id]);
        await query("DELETE FROM units WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/admin/lesson-sections', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { unit_id, title, content, video_url, interactive_html, order_index, matrix_id } = req.body;
        await query("INSERT INTO lesson_sections (unit_id, title, content, video_url, interactive_html, order_index, matrix_id) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                    [unit_id, title, content, video_url, interactive_html, order_index || 0, matrix_id || null]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/admin/lesson-sections/:id', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { title, content, video_url, interactive_html, order_index, matrix_id } = req.body;
        await query("UPDATE lesson_sections SET title = ?, content = ?, video_url = ?, interactive_html = ?, order_index = ?, matrix_id = ? WHERE id = ?", 
                    [title, content, video_url, interactive_html, order_index || 0, matrix_id || null, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/admin/lesson-sections/:id', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM user_lesson_progress WHERE section_id = ?", [req.params.id]);
        await query("DELETE FROM lesson_sections WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// 5. Data Cleanup & Nuclear Reset
router.post('/admin/nuclear-reset', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM questions");
        await query("DELETE FROM id6_metadata");
        await query("DELETE FROM units");
        await query("DELETE FROM chapters");
        await query("DELETE FROM exam_results");
        await query("DELETE FROM matrix_templates");
        res.json({ success: true, message: "Toàn bộ dữ liệu ID6 đã được xoá sạch." });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/admin/clear-chapters', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM chapters");
        res.json({ success: true, message: "Đã xoá toàn bộ danh sách Chương." });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/admin/clear-units', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("DELETE FROM units");
        res.json({ success: true, message: "Đã xoá toàn bộ danh sách Bài." });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// 6. User Management (Pro toggling, renewing, deleting)
const handleTogglePro = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { is_pro } = req.body;
        const expiry = is_pro ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null;
        await query("UPDATE users SET is_pro = ?, expiry_date = ? WHERE id = ?", [is_pro, expiry, req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
};

const handleRenewPro = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const expiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        await query("UPDATE users SET is_pro = 1, expiry_date = ? WHERE id = ?", [expiry, req.params.id]);
        res.json({ success: true, new_expiry: expiry });
    } catch(e) { res.status(500).json({ error: e.message }); }
};

const handleDeleteUser = async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return; 
        await query("DELETE FROM users WHERE id = ?", [req.params.id]); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
};

router.post('/users/:id/toggle-pro', handleTogglePro);
router.post('/admin/users/:id/toggle-pro', handleTogglePro);
router.post('/users/:id/renew-pro', handleRenewPro);
router.post('/admin/users/:id/renew-pro', handleRenewPro);
router.delete('/users/:id', handleDeleteUser);
router.delete('/admin/users/:id', handleDeleteUser);

router.post(['/users/:id/reset-password', '/admin/users/:id/reset-password'], async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { new_password } = req.body;
        const pass = (typeof new_password === 'string' && new_password.length >= 8) 
            ? new_password 
            : crypto.randomBytes(6).toString('hex');
        const hash = await bcrypt.hash(pass, 10);
        await query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.params.id]);
        res.json({ success: true, new_password: pass });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 7. System Stats, Jobs, Seed & Feedback
router.get('/stats', async (req, res) => {
    try {
        const [q] = await query("SELECT COUNT(*) as c FROM questions");
        const [m] = await query("SELECT COUNT(*) as c FROM id6_metadata");
        const [c] = await query("SELECT COUNT(*) as c FROM chapters");
        const [u] = await query("SELECT COUNT(*) as c FROM units");
        const lDist = await query(`SELECT IFNULL(l.code, 'Unknown') as id_level, COUNT(q.id) as count FROM questions q LEFT JOIN levels l ON q.level_id = l.id GROUP BY l.code`);
        const cDist = await query(`SELECT IFNULL(g.name, 'Khác') as name, COUNT(q.id) as count FROM questions q LEFT JOIN units u ON q.unit_id = u.id LEFT JOIN chapters c ON u.chapter_id = c.id LEFT JOIN grades g ON c.grade_id = g.id GROUP BY g.name`);
        const recent = await query(`SELECT id, legacy_full_id as id_full, created_at FROM questions ORDER BY created_at DESC LIMIT 5`);
        res.json({ 
            success: true, 
            data: { 
                totalQuestions: q.c, 
                totalMetadata: m.c, 
                totalChapters: c.c, 
                totalUnits: u.c, 
                levelDistribution: lDist, 
                classDistribution: cDist, 
                recentQuestions: recent
            } 
        });
    } catch { res.status(500).json({ error: "Internal Server Error" }); }
});

router.get('/jobs/:id', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM background_jobs WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Job not found" });
        if (!isAdmin(req) && Number(rows[0].user_id) !== Number(req.user?.id)) return res.status(403).json({ error: 'Bạn không có quyền xem tác vụ này.' });
        res.json({ success: true, data: rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/jobs', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { job_type } = req.body;
        const user_id = req.user.id;
        if (!['DUPLICATE_SCAN', 'LATEX_NORM', 'AI_GEN'].includes(job_type)) return res.status(400).json({ error: 'Loại tác vụ không hợp lệ.' });
        
        const [active] = await pool.query("SELECT id FROM background_jobs WHERE job_type = ? AND (status = 'PENDING' OR status = 'PROCESSING') LIMIT 1", [job_type]);
        if (active.length > 0) {
            return res.json({ success: true, jobId: active[0].id, alreadyRunning: true });
        }

        const [result] = await pool.query("INSERT INTO background_jobs (job_type, user_id) VALUES (?, ?)", [job_type, user_id]);
        res.json({ success: true, jobId: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/seed-db', async (req, res) => { 
    try {
        if (!requireAdmin(req, res)) return; 
        await seedDatabase(); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/seed-lesson', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const [units] = await pool.query(`
            SELECT u.id, u.name 
            FROM units u
            JOIN chapters c ON u.chapter_id = c.id
            JOIN grades g ON c.grade_id = g.id
            WHERE g.code = '10' OR g.name LIKE '%10%' LIMIT 1
        `);
        
        if (units.length === 0) return res.send('No units found');
        const unitId = units[0].id;
        
        await query("INSERT INTO lesson_sections (unit_id, title, content, video_url, interactive_html, order_index) VALUES (?, ?, ?, ?, ?, ?)", [
            unitId,
            "1. Lý thuyết và Luyện tập Tương tác Số Thập Phân",
            "**Số thập phân** là... \n\nHãy xem video bài giảng và thực hiện bài tập tương tác phía dưới để ghi nhớ kiến thức tốt nhất.",
            "https://www.youtube.com/embed/dQw4w9WgXcQ", 
            "<p>Luyện tập tương tác demo</p>",
            1
        ]);
        res.send("Seeded");
    } catch(e) {
        res.status(500).send(e.message);
    }
});

// Feedback Endpoints
router.post('/feedback', async (req, res) => {
    try {
        const { content } = req.body;
        const user_id = req.user.id;
        if (typeof content !== 'string' || !content.trim() || content.length > 5000) return res.status(400).json({ error: 'Nội dung phản hồi không hợp lệ.' });
        await query("INSERT INTO user_feedback (user_id, content) VALUES (?, ?)", [user_id, content]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/feedback', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const rows = await query(`
            SELECT f.*, u.username, u.full_name, u.email 
            FROM user_feedback f 
            JOIN users u ON f.user_id = u.id 
            ORDER BY f.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/feedback/:id/read', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        await query("UPDATE user_feedback SET is_read = TRUE WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
