import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { 
    query, 
    requireTeacherOrAdmin, 
    getGeminiApiKey, 
    generateWithFallback, 
    parseGeminiError 
} from '../core.js';
import { normalizeId6 } from '../id6.js';
import { normalizeExTestOutput } from '../exTest.js';
import { convertPdfToExTest } from '../pdfToExTest.js';

const router = express.Router();

router.post('/ai/convert-document', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { base64_data, mime_type, stream } = req.body;
        const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedMimeTypes.includes(mime_type) || typeof base64_data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(base64_data)) {
            return res.status(400).json({ error: 'Tệp PDF hoặc DOCX không hợp lệ.' });
        }
        if (Buffer.byteLength(base64_data, 'base64') > 20 * 1024 * 1024) return res.status(413).json({ error: 'Tệp vượt quá giới hạn 20 MB.' });
        const apiKey = await getGeminiApiKey(req.user.id);
        if (!apiKey) return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });
        const ai = new GoogleGenAI({ apiKey });
        if (mime_type === 'application/pdf') {
            const bytes = Buffer.from(base64_data, 'base64');
            const emit = event => res.write(`${JSON.stringify(event)}\n`);
            if (stream) {
                res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache, no-transform');
                res.setHeader('X-Accel-Buffering', 'no');
                res.flushHeaders();
            }
            try {
                const result = await convertPdfToExTest(bytes, ai, stream ? event => emit({ type: 'progress', ...event }) : undefined, generateWithFallback);
                if (stream) { emit({ type: 'result', ...result }); return res.end(); }
                return res.json({ success: true, ...result });
            } catch (error) {
                if (stream) { emit({ type: 'error', error: parseGeminiError(error) }); return res.end(); }
                throw error;
            }
        }
        const response = await generateWithFallback(ai, `Chuyển TOÀN BỘ tài liệu theo đúng thứ tự sang mã nguồn ex_test. Mỗi câu đặt trong \\begin{ex}...\\end{ex}. Câu trắc nghiệm dùng \\choice{...}{...}{...}{...}; câu đúng/sai dùng \\choiceTF{...}{...}{...}{...}; câu trả lời ngắn dùng \\shortans{...}; lời giải dùng \\loigiai{...}. Chỉ đặt \\True trước đáp án khi tài liệu gốc xác định chắc chắn. Giữ nguyên công thức trong $...$ hoặc môi trường toán, ký hiệu, hình/bảng, đánh số và thứ tự. Không đoán nội dung bị mờ, không tóm tắt, không thêm markdown hay phần mở đầu tài liệu. Nếu hình không thể tái tạo, thêm chú thích LaTeX % CAN_KIEM_TRA_HINH tại đúng vị trí.`, {
            systemInstruction: 'Bạn là chuyên gia Toán học và LaTeX ex_test. Xuất duy nhất mã LaTeX phần thân gồm các môi trường ex. Không bịa đáp án, lời giải hoặc hình không có trong tài liệu. Ưu tiên TikZ khi có thể tái tạo chính xác.',
            maxOutputTokens: 16384,
            responseMimeType: 'text/plain'
        }, [{ inlineData: { mimeType: mime_type, data: base64_data } }]);
        const result = normalizeExTestOutput(response.text || '', response.candidates?.[0]?.finishReason || '');
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
    }
});

router.post('/ai/validate-question', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { latex, current_id } = req.body;
        if (typeof latex !== 'string' || latex.length === 0 || latex.length > 100000) return res.status(400).json({ error: 'Nội dung câu hỏi không hợp lệ.' });
        const apiKey = await getGeminiApiKey(req.user.id);
        if (!apiKey) return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });
        const ai = new GoogleGenAI({ apiKey });
        const metadata = await query(`SELECT m.id_full, m.description, g.code AS grade, s.code AS subject,
            c.chapter_number AS chapter, u.unit_number AS unit, l.code AS level
            FROM id6_metadata m LEFT JOIN grades g ON m.grade_id=g.id LEFT JOIN subjects s ON m.subject_id=s.id
            LEFT JOIN chapters c ON m.chapter_id=c.id LEFT JOIN units u ON m.unit_id=u.id LEFT JOIN levels l ON m.level_id=l.id
            ORDER BY m.id LIMIT 3000`);
        const catalog = metadata.map(item => `${item.id_full}: ${item.description || ''}`).join('\n');
        const response = await generateWithFallback(ai, `Câu hỏi LaTeX: ${latex}\nID hiện tại: ${current_id || ''}\n\nDanh mục ID hợp lệ:\n${catalog}\n\nHãy kiểm tra ID và chỉ đề xuất ID có trong danh mục.`, {
            systemInstruction: 'Trả về JSON gồm isValid, reason, suggestedId, confidence từ 0 đến 1, alternatives (tối đa 3 ID), competencies, chapter, unit và detectedQuestionType. Không thêm markdown. Không được tạo ID ngoài danh mục.',
            responseMimeType: 'application/json'
        });
        const data = JSON.parse((response.text || '{}').replace(/^```json\s*|\s*```$/g, ''));
        const validIds = new Set(metadata.map(item => normalizeId6(item.id_full)).filter(Boolean));
        const suggestedId = normalizeId6(data.suggestedId || '');
        data.suggestedId = validIds.has(suggestedId) ? suggestedId : '';
        data.alternatives = (Array.isArray(data.alternatives) ? data.alternatives : [])
            .map(item => normalizeId6(typeof item === 'string' ? item : item?.id))
            .filter((id, index, values) => id && validIds.has(id) && values.indexOf(id) === index)
            .slice(0, 3);
        data.confidence = Math.max(0, Math.min(1, Number(data.confidence) || 0));
        if (!data.suggestedId) data.reason = `${data.reason || ''} Đề xuất AI không khớp danh mục ID6 nên chưa thể áp dụng.`.trim();
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
    }
});

router.post('/ai/explain', async (req, res) => {
    try {
        const { question_latex, user_answer_latex, correct_answer_latex } = req.body;
        const apiKey = await getGeminiApiKey(req.user?.id);
        if (!apiKey) return res.status(400).json({ error: "Chưa cấu hình Gemini API Key" });
        
        const ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const prompt = `Bạn là một gia sư Toán. Học sinh vừa làm sai câu hỏi sau:
Đề bài:
${question_latex}

Câu trả lời của học sinh: ${user_answer_latex || 'Không rõ'}
Đáp án đúng: ${correct_answer_latex || 'Không rõ'}

Hãy giải thích ngắn gọn, dễ hiểu (dưới 150 chữ) lý do tại sao học sinh sai, chỉ ra lỗi sai phổ biến ở dạng này và hướng dẫn cách giải đúng. Sử dụng LaTeX kẹp giữa $...$ hoặc $$...$$ cho biểu thức toán học.`;
        
        const response = await generateWithFallback(ai, prompt);
        res.json({ success: true, explanation: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/ai/similar', async (req, res) => {
    try {
        const { question_latex, type } = req.body;
        const apiKey = await getGeminiApiKey(req.user?.id);
        if (!apiKey) return res.status(400).json({ error: "Chưa cấu hình Gemini API Key" });
        
        const ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const prompt = `Bạn là một giáo viên Toán. Hãy tạo ra MỘT câu hỏi MỚI hoàn toàn tương tự về mặt mức độ và phương pháp giải với câu hỏi sau (thay đổi số liệu, ngữ cảnh):
${question_latex}

Yêu cầu định dạng bắt buộc (chỉ trả về đoạn văn bản chứa mã LaTeX theo cấu trúc ID6, không thêm văn bản giải thích nào khác):
Dạng trắc nghiệm (TN):
\\begin{ex}
Nội dung đề bài
\\choice
{Phương án sai 1}
{\\True Phương án đúng}
{Phương án sai 2}
{Phương án sai 3}
\\loigiai{
Lời giải chi tiết ở đây
}
\\end{ex}

Dạng điền khuyết (KQ):
\\begin{ex}
Nội dung đề bài
\\loigiai{
Lời giải chi tiết
}
\\end{ex}
Nếu đề bài là dạng ${type}, hãy sinh câu hỏi theo đúng định dạng tương ứng.`;

        const response = await generateWithFallback(ai, prompt);
        
        let latex = response.text || '';
        latex = latex.replace(/```latex\n?/g, '').replace(/```\n?/g, '').trim();
        
        res.json({ success: true, latex });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/adaptive/generate', async (req, res) => {
    try {
        const { limit = 10 } = req.body;
        const user_id = req.user.id;
        
        // Check limit for non-pro student
        if (user_id) {
            const [user] = await query("SELECT role, is_pro FROM users WHERE id = ?", [user_id]);
            if (user && user.role === 'STUDENT' && !user.is_pro) {
                const today = new Date().toISOString().split('T')[0];
                let limitRow = (await query("SELECT * FROM activity_limits WHERE user_id = ? AND activity_date = ?", [user_id, today]))[0];
                if (!limitRow) {
                    await query("INSERT INTO activity_limits (user_id, activity_date) VALUES (?, ?)", [user_id, today]);
                    limitRow = { exam_count: 0, review_count: 0 };
                }
                if (limitRow.review_count >= 2) {
                    return res.status(403).json({ error: "Bạn đã hết lượt ôn tập (Adaptive Test) trong ngày (Tối đa 2 lần)." });
                }
                await query("UPDATE activity_limits SET review_count = review_count + 1 WHERE user_id = ? AND activity_date = ?", [user_id, today]);
            }
        }
        
        // 1. Find questions user has failed
        const results = await query("SELECT result_detail FROM exam_results WHERE user_id = ? AND status = 'COMPLETED'", [user_id]);
        const failedIds = new Set();
        
        results.forEach(r => {
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
                        if (!isCorrect) failedIds.add(q.id);
                    });
                }
            } catch {}
        });

        let questions = [];
        let ai_analysis = "Hệ thống chưa tìm thấy dữ liệu làm bài sai gần đây của bạn. Đề ôn tập dưới đây được chọn ngẫu nhiên để bạn luyện tập nhé!";

        if (failedIds.size > 0) {
            const failedArray = Array.from(failedIds);
            const placeholders = failedArray.map(() => '?').join(',');
            
            const failedQs = await query(`
                SELECT q.id, q.legacy_full_id as id_full, q.content_latex_original AS original_latex 
                FROM questions q 
                WHERE q.id IN (${placeholders})
            `, failedArray);
            
            const formats = [...new Set(failedQs.map(q => q.id_full).filter(Boolean))];
            
            if (formats.length > 0) {
                const formatPlaceholders = formats.map(() => '?').join(',');
                questions = await query(`
                    SELECT q.id, q.legacy_full_id as id_full, q.content_latex, q.content_latex_original AS original_latex, q.content_latex AS raw_latex, qt.code as type 
                    FROM questions q LEFT JOIN question_types qt ON q.type_id = qt.id 
                    WHERE q.legacy_full_id IN (${formatPlaceholders}) ORDER BY RAND() LIMIT ?
                `, [...formats, limit]);
                
                try {
                    const apiKey = await getGeminiApiKey(req.user?.id);
                    if (apiKey) {
                        const ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
                        const prompt = `Bạn là một gia sư AI chuyên Toán. Học sinh vừa làm sai các câu hỏi thuộc các mã dạng bài (ID6) sau: ${formats.join(', ')}.
Một vài nội dung đề bài làm sai:
${failedQs.slice(0, 3).map(q => q.original_latex).join('\n---\n')}

Dựa vào nội dung trên, hãy phân tích ngắn gọn (tối đa 4 câu) về lỗi sai hoặc lỗ hổng kiến thức của học sinh, và đưa ra lời khuyên ôn tập cụ thể, dễ hiểu, động viên học sinh. Trả lời trực tiếp bằng tiếng Việt.`;
                        
                        const response = await generateWithFallback(ai, prompt);
                        ai_analysis = response.text;
                    }
                } catch (aiErr) {
                    console.error("AI Analysis failed:", aiErr);
                    ai_analysis = "Hệ thống nhận thấy bạn cần ôn tập thêm một số dạng bài. Dưới đây là các câu hỏi cùng dạng để bạn luyện tập lại!";
                }
            } else {
                questions = await query(`
                    SELECT q.id, q.legacy_full_id as id_full, q.content_latex, q.content_latex_original AS original_latex, q.content_latex AS raw_latex, qt.code as type 
                    FROM questions q LEFT JOIN question_types qt ON q.type_id = qt.id 
                    WHERE q.id IN (${placeholders}) ORDER BY RAND() LIMIT ?
                `, [...failedArray, limit]);
            }
        }

        // 2. If not enough failed questions, fill with random ones
        if (questions.length < limit) {
            const remaining = limit - questions.length;
            const excludeIds = questions.map(q => q.id);
            const excludePlaceholders = excludeIds.length > 0 ? `WHERE q.id NOT IN (${excludeIds.map(() => '?').join(',')})` : '';
            const randomQs = await query(`
                SELECT q.id, q.legacy_full_id as id_full, q.content_latex, q.content_latex_original AS original_latex, q.content_latex AS raw_latex, qt.code as type 
                FROM questions q LEFT JOIN question_types qt ON q.type_id = qt.id 
                ${excludePlaceholders} ORDER BY RAND() LIMIT ?
            `, [...excludeIds, remaining]);
            questions = [...questions, ...randomQs];
        }

        res.json({ success: true, data: questions, ai_analysis });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
