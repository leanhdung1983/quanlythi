import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { 
    query, 
    requireTeacherOrAdmin, 
    getGeminiApiKey,
    getGeminiApiKeys,
    generateWithFallback, 
    parseGeminiError 
} from '../core.js';
import { normalizeId6, extractSourceId, parseId6 } from '../id6.js';
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
        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys || apiKeys.length === 0) return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });
        const ai = new GoogleGenAI({ apiKey: apiKeys[0] });
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
        const response = await generateWithFallback(apiKeys, `Chuyển TOÀN BỘ tài liệu theo đúng thứ tự sang mã nguồn ex_test. Mỗi câu đặt trong \\begin{ex}...\\end{ex}. Câu trắc nghiệm dùng \\choice{...}{...}{...}{...}; câu đúng/sai dùng \\choiceTF{...}{...}{...}{...}; câu trả lời ngắn dùng \\shortans{...}; lời giải dùng \\loigiai{...}. Chỉ đặt \\True trước đáp án khi tài liệu gốc xác định chắc chắn. Giữ nguyên công thức trong $...$ hoặc môi trường toán, ký hiệu, hình/bảng, đánh số và thứ tự. Không đoán nội dung bị mờ, không tóm tắt, không thêm markdown hay phần mở đầu tài liệu. Nếu hình không thể tái tạo, thêm chú thích LaTeX % CAN_KIEM_TRA_HINH tại đúng vị trí.`, {
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

// In-memory cache for ID6 catalog to avoid repetitive heavy queries and token bloat
let cachedCatalogData = null;
let cachedCatalogExpiry = 0;
const CATALOG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getCachedId6Catalog() {
    const now = Date.now();
    if (cachedCatalogData && now < cachedCatalogExpiry) {
        return cachedCatalogData;
    }

    // Fetch all metadata rows (covering all grades 6-12 without truncation)
    const metadata = await query(`SELECT m.id_full, m.description, g.code AS grade, s.code AS subject,
        c.chapter_number AS chapter, u.unit_number AS unit, l.code AS level
        FROM id6_metadata m LEFT JOIN grades g ON m.grade_id=g.id LEFT JOIN subjects s ON m.subject_id=s.id
        LEFT JOIN chapters c ON m.chapter_id=c.id LEFT JOIN units u ON m.unit_id=u.id LEFT JOIN levels l ON m.level_id=l.id
        ORDER BY m.id`);

    const validIds = new Set(metadata.map(item => normalizeId6(item.id_full)).filter(Boolean));

    // Compress 4,600+ rows into ~1,150 base dạng lines using '*' for level (N/H/V/C)
    // Structure: <Khối><Môn><Chương>*<Bài>-<Dạng>: <Mô tả>
    const baseMap = new Map();
    const byGradeMap = new Map();

    for (const item of metadata) {
        const norm = normalizeId6(item.id_full);
        if (!norm) continue;
        const base = norm.replace(/[NHVC](?=\d+-)/, '*');
        if (!baseMap.has(base)) {
            const desc = item.description || '';
            baseMap.set(base, desc);
            const grade = norm[0];
            if (!byGradeMap.has(grade)) byGradeMap.set(grade, []);
            byGradeMap.get(grade).push(`${base}: ${desc}`);
        }
    }

    const compactCatalog = Array.from(baseMap.entries())
        .map(([id, desc]) => `${id}: ${desc}`)
        .join('\n');

    cachedCatalogData = {
        compactCatalog,
        byGradeMap,
        validIds,
        rawCount: metadata.length,
        compressedCount: baseMap.size
    };
    cachedCatalogExpiry = now + CATALOG_CACHE_TTL_MS;
    return cachedCatalogData;
}

// Strip unnecessary solution text to save 60-70% of prompt tokens
function stripSolutionAndClean(latex) {
    if (typeof latex !== 'string') return '';
    let text = latex;
    // Strip \loigiai{...}
    text = text.replace(/\\loigiai\s*\{[\s\S]*?\}(?=\s*\\end\{ex\}|\s*$)/gi, '');
    // Strip LaTeX line comments
    text = text.replace(/%.*$/gm, '');
    // Condense whitespace
    text = text.replace(/\s+/g, ' ');
    // Limit length to 600 chars (sufficient for question classification)
    if (text.length > 600) {
        text = text.substring(0, 600) + '...';
    }
    return text.trim();
}

// Detect dominant grade from question cues or existing IDs
function detectGradesFromQuestions(questions) {
    const gradeVotes = new Map();
    const addVote = (g, weight = 1) => {
        if (!g) return;
        gradeVotes.set(g, (gradeVotes.get(g) || 0) + weight);
    };

    for (const q of questions) {
        const id = q.current_id || '';
        const match = id.match(/^(10|11|12|[0126789])/);
        if (match) {
            const g = match[1] === '10' ? '0' : match[1] === '11' ? '1' : match[1] === '12' ? '2' : match[1];
            addVote(g, 3);
        }

        const latex = (q.latex || '').toLowerCase();
        // Grade 12 (Giải tích 12, Hình không gian Oxyz, Số phức)
        if (/nguyên hàm|tích phân|\\int|tiệm cận|cực trị|đồng biến|nghịch biến|oxyz|mặt phẳng|mặt cầu|số phức|tọa độ không gian/.test(latex)) {
            addVote('2', 2);
        }
        // Grade 11 (Lượng giác, Đạo hàm, Cấp số, Xác suất)
        if (/cấp số cộng|cấp số nhân|đạo hàm|lượng giác|\\sin|\\cos|\\tan|xác suất|nhị thức|dãy số|\\lim|giới hạn/.test(latex)) {
            addVote('1', 2);
        }
        // Grade 10 (Mệnh đề, Tập hợp, Véc tơ, Tam thức bậc hai, Parabol, Elip)
        if (/mệnh đề|tập hợp|véc tơ|bất đẳng thức|tam thức bậc hai|parabol|elip|hệ phương trình/.test(latex)) {
            addVote('0', 2);
        }
    }

    if (gradeVotes.size === 0) return null;

    const sorted = Array.from(gradeVotes.entries()).sort((a, b) => b[1] - a[1]);
    const topGrade = sorted[0][0];
    const topScore = sorted[0][1];

    const relevant = [topGrade];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i][1] >= topScore * 0.5) {
            relevant.push(sorted[i][0]);
        }
    }
    return relevant;
}

// Return only the relevant catalog lines instead of all 1,150 lines (Saves ~80% prompt tokens)
function getFilteredCatalog(catalogData, grades) {
    if (!grades || grades.length === 0) {
        // High school grades (0, 1, 2) cover the vast majority of questions
        const hsGrades = ['0', '1', '2'];
        const lines = [];
        for (const g of hsGrades) {
            const items = catalogData.byGradeMap?.get(g) || [];
            lines.push(...items);
        }
        return lines.length > 0 ? lines.join('\n') : catalogData.compactCatalog;
    }

    const lines = [];
    for (const g of grades) {
        const items = catalogData.byGradeMap?.get(g) || [];
        lines.push(...items);
    }
    return lines.length > 0 ? lines.join('\n') : catalogData.compactCatalog;
}

router.post('/ai/validate-question', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { latex, current_id } = req.body;
        if (typeof latex !== 'string' || latex.length === 0 || latex.length > 100000) return res.status(400).json({ error: 'Nội dung câu hỏi không hợp lệ.' });
        
        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys || apiKeys.length === 0) return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });

        const catalogData = await getCachedId6Catalog();
        const { validIds } = catalogData;

        // Zero-token local check if question already has source ID
        const srcId = extractSourceId(latex);
        if (srcId && validIds.has(srcId)) {
            return res.json({
                success: true,
                data: {
                    isValid: true,
                    suggestedId: srcId,
                    confidence: 1,
                    reason: 'Mã ID hợp lệ được nhận diện trực tiếp từ câu hỏi (0 token).',
                    alternatives: []
                }
            });
        }

        const detectedGrades = detectGradesFromQuestions([{ latex, current_id }]);
        const promptCatalog = getFilteredCatalog(catalogData, detectedGrades);
        const cleanLatex = stripSolutionAndClean(latex);

        const prompt = `Câu hỏi LaTeX: ${cleanLatex}\nID hiện tại: ${current_id || ''}\n\nDanh mục dạng toán chuẩn ID6:\n${promptCatalog}\n\nQuy tắc: Ký hiệu '*' là vị trí của mức độ N (Nhận biết), H (Thông hiểu), V (Vận dụng), C (Vận dụng cao). Hãy kiểm tra ID và chỉ đề xuất mã ID6 đầy đủ hợp lệ.`;
        const response = await generateWithFallback(apiKeys, prompt, {
            systemInstruction: 'Trả về JSON gồm isValid, reason, suggestedId, confidence từ 0 đến 1, alternatives (tối đa 3 ID), competencies, chapter, unit và detectedQuestionType. Không thêm markdown. Thay thế * bằng N, H, V hoặc C để tạo mã ID6 chuẩn.',
            responseMimeType: 'application/json'
        });
        const data = JSON.parse((response.text || '{}').replace(/^```json\s*|\s*```$/g, ''));
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

router.post('/ai/batch-suggest-ids', async (req, res) => {
    let localResults = [];
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { questions } = req.body;
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'Danh sách câu hỏi không hợp lệ.' });
        }
        const batch = questions.slice(0, 10);
        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys || apiKeys.length === 0) {
            return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key. Thầy/cô vui lòng vào mục Cài đặt tài khoản để nhập API Key từ Google AI Studio.' });
        }

        const catalogData = await getCachedId6Catalog();
        const { validIds } = catalogData;

        // 1. FAST LOCAL PRE-CHECK (Zero Tokens!)
        localResults = [];
        const needAiQuestions = [];

        for (const q of batch) {
            const rawLatex = typeof q.latex === 'string' ? q.latex : '';
            // Check if question already has source ID in comment or \begin{ex}[...]
            const srcId = extractSourceId(rawLatex);
            if (srcId && validIds.has(srcId)) {
                localResults.push({
                    id: q.id,
                    suggestedId: srcId,
                    confidence: 1.0,
                    reason: 'Nhận diện tự động từ mã có sẵn trong câu hỏi (0 token)'
                });
                continue;
            }

            // Check if current_id can be normalized (e.g. legacy level Y, B, K, G -> N, H, V, C)
            const normCurrent = normalizeId6(q.current_id || '');
            if (normCurrent && validIds.has(normCurrent)) {
                localResults.push({
                    id: q.id,
                    suggestedId: normCurrent,
                    confidence: 0.95,
                    reason: 'Chuẩn hóa tự động từ mã hiện tại (0 token)'
                });
                continue;
            }

            needAiQuestions.push(q);
        }

        // If all questions resolved locally, return immediately!
        if (needAiQuestions.length === 0) {
            return res.json({ success: true, results: localResults });
        }

        // 2. SMART FILTERED CATALOG & CLEANED QUESTIONS (Saves 80-85% tokens!)
        const detectedGrades = detectGradesFromQuestions(needAiQuestions);
        const promptCatalog = getFilteredCatalog(catalogData, detectedGrades);

        const questionsText = needAiQuestions.map((q, idx) => {
            const clean = stripSolutionAndClean(q.latex);
            return `--- CÂU ${idx + 1} (REF_ID: ${q.id}) ---\n${clean}`;
        }).join('\n\n');

        const prompt = `Dưới đây là danh sách ${needAiQuestions.length} câu hỏi Toán dạng LaTeX cần đề xuất mã ID6 chuẩn:
${questionsText}

Danh mục dạng toán chuẩn ID6:
${promptCatalog}

QUY TẮC MÃ ID6:
Cấu trúc mã: <Khối><Môn><Chương><Mức_độ><Bài>-<Dạng>
Ký hiệu '*' trong danh mục là vị trí của Mức độ nhận thức:
- 'N': Nhận biết
- 'H': Thông hiểu
- 'V': Vận dụng
- 'C': Vận dụng cao
Ví dụ: Từ dạng "2D1*1-1", nếu câu ở mức Nhận biết thì thay '*' thành 'N' -> mã là "2D1N1-1".

YÊU CẦU:
1. Phân tích nội dung và mức độ nhận thức (N, H, V, C) của từng câu.
2. Chọn đúng dạng toán phù hợp từ Danh mục và thay thế '*' bằng chữ cái mức độ tương ứng.
3. Trả về đúng JSON Array theo mẫu (không thêm văn bản ngoài JSON):
[
  {
    "id": <REF_ID tương ứng>,
    "suggestedId": "<mã ID6 chuẩn, ví dụ 2D1N1-1>",
    "confidence": <số từ 0 đến 1>,
    "reason": "<mô tả ngắn dạng toán và mức độ>"
  }
]`;

        const response = await generateWithFallback(apiKeys, prompt, {
            systemInstruction: 'Bạn là chuyên gia phân loại câu hỏi Toán theo chuẩn ID6. Trả về đúng JSON Array, không thêm markdown hay giải thích ngoài JSON. Chỉ chọn suggestedId khớp dạng toán trong danh mục và thay * bằng N, H, V hoặc C.',
            responseMimeType: 'application/json'
        });

        let parsedResults = [];
        try {
            parsedResults = JSON.parse((response.text || '[]').replace(/^```json\s*|\s*```$/g, ''));
        } catch {
            parsedResults = [];
        }

        if (!Array.isArray(parsedResults)) parsedResults = [];

        // Map AI results back to original question IDs
        const aiResults = needAiQuestions.map((q, idx) => {
            const item = parsedResults.find(p => p && p.id != null && (p.id == q.id || String(p.id).trim() === String(q.id).trim())) || parsedResults[idx] || {};
            let rawSuggested = String(item.suggestedId || '').trim();
            if (rawSuggested.includes('*')) {
                rawSuggested = rawSuggested.replace(/\*/g, 'H');
            }
            const normId = normalizeId6(rawSuggested);
            const isValid = Boolean(normId && (validIds.size === 0 || validIds.has(normId)));
            return {
                id: q.id,
                suggestedId: isValid ? normId : '',
                confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
                reason: item.reason || (isValid ? 'Đề xuất bởi AI' : (normId ? `Mã ${normId} chưa có trong danh mục ID6` : 'AI không đề xuất được mã phù hợp'))
            };
        });

        const combinedResults = [...localResults, ...aiResults];
        res.json({ success: true, results: combinedResults });
    } catch (e) {
        if (localResults && localResults.length > 0) {
            return res.json({ success: true, results: localResults, warning: parseGeminiError(e) });
        }
        const errMsg = parseGeminiError(e);
        const isQuota = e?.status === 429 || String(e?.message || '').includes('429') || String(e?.message || '').includes('quota') || String(e?.message || '').includes('RESOURCE_EXHAUSTED');
        res.status(isQuota ? 429 : 500).json({ error: errMsg, isQuota });
    }
});

router.post('/ai/explain', async (req, res) => {
    try {
        const { question_latex, user_answer_latex, correct_answer_latex } = req.body;
        const apiKeys = await getGeminiApiKeys(req.user?.id);
        if (!apiKeys || apiKeys.length === 0) return res.status(400).json({ error: "Chưa cấu hình Gemini API Key" });
        
        const prompt = `Bạn là một gia sư Toán. Học sinh vừa làm sai câu hỏi sau:
Đề bài:
${question_latex}

Câu trả lời của học sinh: ${user_answer_latex || 'Không rõ'}
Đáp án đúng: ${correct_answer_latex || 'Không rõ'}

Hãy giải thích ngắn gọn, dễ hiểu (dưới 150 chữ) lý do tại sao học sinh sai, chỉ ra lỗi sai phổ biến ở dạng này và hướng dẫn cách giải đúng. Sử dụng LaTeX kẹp giữa $...$ hoặc $$...$$ cho biểu thức toán học.`;
        
        const response = await generateWithFallback(apiKeys, prompt);
        res.json({ success: true, explanation: response.text });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
    }
});

router.post('/ai/similar', async (req, res) => {
    try {
        const { question_latex, type } = req.body;
        const apiKeys = await getGeminiApiKeys(req.user?.id);
        if (!apiKeys || apiKeys.length === 0) return res.status(400).json({ error: "Chưa cấu hình Gemini API Key" });
        
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

        const response = await generateWithFallback(apiKeys, prompt);
        
        let latex = response.text || '';
        latex = latex.replace(/```latex\n?/g, '').replace(/```\n?/g, '').trim();
        
        res.json({ success: true, latex });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
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
                    const apiKeys = await getGeminiApiKeys(req.user?.id);
                    if (apiKeys && apiKeys.length > 0) {
                        const prompt = `Bạn là một gia sư AI chuyên Toán. Học sinh vừa làm sai các câu hỏi thuộc các mã dạng bài (ID6) sau: ${formats.join(', ')}.
Một vài nội dung đề bài làm sai:
${failedQs.slice(0, 3).map(q => q.original_latex).join('\n---\n')}

Dựa vào nội dung trên, hãy phân tích ngắn gọn (tối đa 4 câu) về lỗi sai hoặc lỗ hổng kiến thức của học sinh, và đưa ra lời khuyên ôn tập cụ thể, dễ hiểu, động viên học sinh. Trả lời trực tiếp bằng tiếng Việt.`;
                        
                        const response = await generateWithFallback(apiKeys, prompt);
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
    } catch (e) { res.status(500).json({ error: parseGeminiError(e) }); }
});

export default router;
