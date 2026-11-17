import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { 
    query, 
    requireTeacherOrAdmin, 
    getGeminiApiKeys,
    generateWithFallback, 
    parseGeminiError,
    generateHash 
} from '../core.js';
import { normalizeId6, extractSourceId, injectCanonicalId, requiresAiIdReview, validateId6Candidate } from '../id6.js';
import { normalizeExTestOutput } from '../exTest.js';
import { convertPdfToExTest } from '../pdfToExTest.js';

import adaptivePracticeRoutes from './adaptivePractice.routes.js';

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
        ai._keys = apiKeys;
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
    const metadata = await query(`SELECT m.id_full, m.description, m.unit_id, m.level_id, g.code AS grade, s.code AS subject,
        c.chapter_number AS chapter, c.name AS chapter_name, u.unit_number AS unit, u.name AS unit_name, l.code AS level
        FROM id6_metadata m LEFT JOIN grades g ON m.grade_id=g.id LEFT JOIN subjects s ON m.subject_id=s.id
        LEFT JOIN chapters c ON m.chapter_id=c.id LEFT JOIN units u ON m.unit_id=u.id LEFT JOIN levels l ON m.level_id=l.id
        ORDER BY m.id`);

    const metadataById = new Map(metadata
        .map(item => [normalizeId6(item.id_full), item])
        .filter(([id]) => id));
    const validIds = new Set(metadataById.keys());

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
        metadataById,
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

const MAX_ID_BATCH_SIZE = 6;
const MAX_ID_PROMPT_CHARS = 30000;

function toValidatedSuggestion(question, suggestedId, catalogData, ai = {}) {
    const normalized = normalizeId6(suggestedId || '');
    const candidateMetadata = normalized ? catalogData.metadataById.get(normalized) : null;
    // Validate the exact state that review/confirm will persist: canonical source
    // marker plus the catalog unit and level belonging to the proposed ID.
    const validation = validateId6Candidate({
        content_latex: candidateMetadata ? injectCanonicalId(question.latex || '', normalized) : (question.latex || ''),
        unit_id: candidateMetadata?.unit_id ?? question.unit_id,
        level_id: candidateMetadata?.level_id ?? question.level_id
    }, normalized, catalogData.metadataById);
    const aiReason = String(ai.reason || '').trim();
    return {
        id: question.id,
        suggestedId: validation.metadata ? normalized : '',
        isValid: validation.isValid,
        reasonCodes: validation.reasonCodes,
        confidence: Math.max(0, Math.min(1, Number(ai.confidence) || 0)),
        reason: validation.isValid
            ? (aiReason || 'Mã đề xuất đã được validator ID6 xác nhận.')
            : [aiReason, validation.reason].filter(Boolean).join(' ')
    };
}

router.post('/ai/validate-question', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { latex, current_id, unit_id, level_id } = req.body;
        const issueCodes = Array.isArray(req.body.issue_codes) ? req.body.issue_codes.filter(code => typeof code === 'string') : [];
        const forceAiReview = requiresAiIdReview(issueCodes);
        if (typeof latex !== 'string' || latex.length === 0 || latex.length > 100000) return res.status(400).json({ error: 'Nội dung câu hỏi không hợp lệ.' });
        
        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys || apiKeys.length === 0) return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });

        const catalogData = await getCachedId6Catalog();
        const { validIds } = catalogData;

        // Zero-token local check if question already has source ID
        const srcId = extractSourceId(latex);
        if (!forceAiReview && srcId && validIds.has(srcId)) {
            const result = toValidatedSuggestion({ id: 0, latex, unit_id, level_id }, srcId, catalogData, { confidence: 1 });
            return res.json({
                success: true,
                data: {
                    ...result,
                    reason: result.isValid
                        ? 'Mã trong nguồn LaTeX đã được validator ID6 xác nhận (0 token).'
                        : result.reason,
                    alternatives: []
                }
            });
        }

        const detectedGrades = detectGradesFromQuestions([{ latex, current_id }]);
        const promptCatalog = getFilteredCatalog(catalogData, detectedGrades);
        const cleanLatex = stripSolutionAndClean(latex);

        const prompt = `Câu hỏi LaTeX: ${cleanLatex}\nID hiện tại: ${current_id || ''}\nCác lỗi scanner đã phát hiện: ${issueCodes.join(', ') || 'Không có'}\n\nDanh mục dạng toán chuẩn ID6:\n${promptCatalog}\n\nQuy tắc: Ký hiệu '*' là vị trí của mức độ N (Nhận biết), H (Thông hiểu), V (Vận dụng), C (Vận dụng cao). Nếu scanner báo ID_LEVEL_MISMATCH, bắt buộc phân tích lại mức độ nhận thức. Nếu báo ID_CONTENT_MISMATCH, bắt buộc chọn lại chương/bài/dạng theo nội dung (ví dụ tích phân không thể dùng ID thống kê). Không được kết luận ID hiện tại hợp lệ chỉ vì mã tồn tại trong danh mục. Hãy đề xuất mã ID6 đầy đủ phù hợp nhất.`;
        const response = await generateWithFallback(apiKeys, prompt, {
            systemInstruction: 'Trả về JSON gồm isValid, reason, suggestedId, confidence từ 0 đến 1, alternatives (tối đa 3 ID), competencies, chapter, unit và detectedQuestionType. Không thêm markdown. Thay thế * bằng N, H, V hoặc C để tạo mã ID6 chuẩn.',
            responseMimeType: 'application/json'
        });
        const data = JSON.parse((response.text || '{}').replace(/^```json\s*|\s*```$/g, ''));
        const suggestedId = normalizeId6(data.suggestedId || '');
        const validated = toValidatedSuggestion({ id: 0, latex, unit_id, level_id }, suggestedId, catalogData, data);
        data.suggestedId = validated.suggestedId;
        data.isValid = validated.isValid;
        data.reasonCodes = validated.reasonCodes;
        data.alternatives = (Array.isArray(data.alternatives) ? data.alternatives : [])
            .map(item => normalizeId6(typeof item === 'string' ? item : item?.id))
            .filter((id, index, values) => id && validIds.has(id) && values.indexOf(id) === index)
            .slice(0, 3);
        data.confidence = Math.max(0, Math.min(1, Number(data.confidence) || 0));
        data.reason = validated.reason || (data.suggestedId ? 'Mã đề xuất đã được validator ID6 xác nhận.' : 'Đề xuất AI không khớp danh mục ID6 nên chưa thể áp dụng.');
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
        const batch = questions.slice(0, MAX_ID_BATCH_SIZE);
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
            const forceAiReview = requiresAiIdReview(Array.isArray(q.issue_codes) ? q.issue_codes : []);
            // Check if question already has source ID in comment or \begin{ex}[...]
            const srcId = extractSourceId(rawLatex);
            if (!forceAiReview && srcId && validIds.has(srcId)) {
                localResults.push(toValidatedSuggestion(q, srcId, catalogData, {
                    confidence: 1,
                    reason: 'Nhận diện tự động từ mã có sẵn trong câu hỏi (0 token).'
                }));
                continue;
            }

            // Check if current_id can be normalized (e.g. legacy level Y, B, K, G -> N, H, V, C)
            const normCurrent = normalizeId6(q.current_id || '');
            if (!forceAiReview && normCurrent && validIds.has(normCurrent)) {
                localResults.push(toValidatedSuggestion(q, normCurrent, catalogData, {
                    confidence: 0.95,
                    reason: 'Chuẩn hóa tự động từ mã hiện tại (0 token).'
                }));
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
        const promptCatalog = getFilteredCatalog(catalogData, detectedGrades).slice(0, MAX_ID_PROMPT_CHARS);

        const questionsText = needAiQuestions.map((q, idx) => {
            const clean = stripSolutionAndClean(q.latex);
            const issues = Array.isArray(q.issue_codes) ? q.issue_codes.join(', ') : '';
            return `--- CÂU ${idx + 1} (REF_ID: ${q.id}) ---\nID hiện tại: ${q.current_id || 'chưa có'}\nLỗi scanner: ${issues || 'không có'}\n${clean}`;
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
1. Phân tích nội dung, chương/bài/dạng và mức độ nhận thức (N, H, V, C) của từng câu. Nếu lỗi scanner có ID_LEVEL_MISMATCH hoặc ID_CONTENT_MISMATCH, không được giữ nguyên phân loại chỉ vì ID hiện tại có trong danh mục.
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
            responseMimeType: 'application/json',
            maxOutputTokens: 2048,
            modelPreference: 'lite',
            modelCandidates: ['gemini-3.5-flash-lite', 'gemini-3.8-flash']
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
            return toValidatedSuggestion(q, rawSuggested, catalogData, item);
        });

        const combinedResults = [...localResults, ...aiResults];
        res.json({ success: true, results: combinedResults });
    } catch (e) {
        if (localResults && localResults.length > 0) {
            return res.json({ success: true, results: localResults, warning: parseGeminiError(e) });
        }
        const errMsg = parseGeminiError(e);
        const isQuota = e?.status === 429 || String(e?.message || '').includes('429') || String(e?.message || '').includes('quota') || String(e?.message || '').includes('RESOURCE_EXHAUSTED');
        res.status(isQuota ? 429 : 500).json({
            error: errMsg,
            isQuota,
            retryAfterMs: isQuota ? Math.max(5000, Math.min(Number(e?.retryAfterMs) || 60000, 10 * 60 * 1000)) : undefined
        });
    }
});

router.post('/ai/audit-question-ids', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const limit = Math.min(Math.max(Number(req.body?.limit) || 4, 1), 6);
        const ownershipSql = req.user.role === 'ADMIN' ? '' : 'AND q.created_by = ?';
        const params = req.user.role === 'ADMIN' ? [limit] : [req.user.id, limit];
        const questions = await query(`
            SELECT q.id, q.legacy_full_id, q.content_latex, q.unit_id, q.level_id, q.content_hash
            FROM questions q
            WHERE NOT EXISTS (
                SELECT 1 FROM question_id_suggestions s
                WHERE s.question_id = q.id
                  AND COALESCE(s.content_hash, '') = COALESCE(q.content_hash, '')
                  AND COALESCE(s.current_id, '') = COALESCE(q.legacy_full_id, '')
                  AND s.status IN ('VALID', 'PENDING', 'APPLIED')
            ) ${ownershipSql}
            ORDER BY q.id ASC LIMIT ?
        `, params);

        if (!questions.length) return res.json({ success: true, processed: 0, flagged: 0, remaining: 0, results: [] });
        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys.length) return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key để rà soát nội dung.' });
        const catalogData = await getCachedId6Catalog();
        const detectedGrades = detectGradesFromQuestions(questions.map(q => ({ latex: q.content_latex, current_id: q.legacy_full_id })));
        const promptCatalog = getFilteredCatalog(catalogData, detectedGrades).slice(0, MAX_ID_PROMPT_CHARS);
        const questionText = questions.map(q => `--- CÂU REF_ID ${q.id} ---\nID hiện tại: ${q.legacy_full_id || 'chưa có'}\n${stripSolutionAndClean(q.content_latex)}`).join('\n\n');
        const response = await generateWithFallback(apiKeys, `${questionText}\n\nDanh mục ID6:\n${promptCatalog}\n\nHãy rà soát độc lập từng câu. Kiểm tra nội dung có thực sự khớp chương, bài, dạng và mức độ N/H/V/C của ID hiện tại hay không. Nếu không khớp, đề xuất ID phù hợp nhất. Trả về JSON Array gồm id, suggestedId, confidence, reason.`, {
            systemInstruction: 'Bạn là chuyên gia kiểm định phân loại câu hỏi Toán theo ID6. Không mặc định ID hiện tại đúng chỉ vì nó tồn tại. Đọc nội dung, đối chiếu danh mục và trả về JSON Array duy nhất.',
            responseMimeType: 'application/json', maxOutputTokens: 2048, modelPreference: 'lite'
        });
        let parsed = JSON.parse((response.text || '[]').replace(/^```json\s*|\s*```$/g, ''));
        if (!Array.isArray(parsed)) parsed = [];
        const results = [];
        for (let index = 0; index < questions.length; index++) {
            const q = questions[index];
            const ai = parsed.find(item => String(item?.id) === String(q.id)) || parsed[index] || {};
            const currentId = normalizeId6(q.legacy_full_id || '');
            const suggestedId = normalizeId6(ai.suggestedId || '');
            const proposal = toValidatedSuggestion({ id: q.id, latex: q.content_latex, unit_id: q.unit_id, level_id: q.level_id }, suggestedId, catalogData, ai);
            const currentReview = validateId6Candidate({ content_latex: q.content_latex, unit_id: q.unit_id, level_id: q.level_id }, currentId, catalogData.metadataById);
            const sameId = Boolean(currentId && suggestedId === currentId);
            const isValid = sameId && currentReview.isValid;
            const issueCodes = isValid ? [] : [...new Set([
                ...currentReview.reasonCodes,
                ...(sameId ? [] : ['ID_CONTENT_MISMATCH'])
            ])];
            const status = isValid ? 'VALID' : 'PENDING';
            const reason = String(ai.reason || proposal.reason || currentReview.reason || '').slice(0, 2000);
            await query(`INSERT INTO question_id_suggestions
                (question_id, current_id, suggested_id, issue_codes, confidence, reason, source, status, content_hash)
                VALUES (?, ?, ?, ?, ?, ?, 'AI', ?, ?)`, [q.id, currentId || null, proposal.suggestedId || suggestedId || null,
                JSON.stringify(issueCodes), proposal.confidence, reason, status, q.content_hash || null]);
            await query('UPDATE questions SET id_review_status = ? WHERE id = ?', [isValid ? 'AI_VALID' : 'NEEDS_REVIEW', q.id]);
            results.push({ id: q.id, isValid, suggestedId: proposal.suggestedId || suggestedId, reason, reasonCodes: issueCodes, confidence: proposal.confidence });
        }
        const remainingRows = await query(`SELECT COUNT(*) AS total FROM questions q WHERE NOT EXISTS (
            SELECT 1 FROM question_id_suggestions s WHERE s.question_id=q.id
              AND COALESCE(s.content_hash,'')=COALESCE(q.content_hash,'')
              AND COALESCE(s.current_id,'')=COALESCE(q.legacy_full_id,'')
              AND s.status IN ('VALID','PENDING','APPLIED')
        ) ${ownershipSql}`, req.user.role === 'ADMIN' ? [] : [req.user.id]);
        res.json({ success: true, processed: results.length, flagged: results.filter(r => !r.isValid).length, remaining: Number(remainingRows[0]?.total || 0), results });
    } catch (e) {
        res.status(e?.status === 429 ? 429 : 500).json({ error: parseGeminiError(e), retryAfterMs: e?.retryAfterMs });
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

// ==========================================
// 7-STEP QUESTION QUALITY ASSURANCE & AUDIT
// ==========================================

export async function runSingleQualityCheck({ latex, currentId, questionId, forceRefresh, userId, catalogData, apiKeys }) {
    const rawLatex = typeof latex === 'string' ? latex : '';
    if (!rawLatex.trim()) {
        throw new Error('Nội dung câu hỏi không được để trống.');
    }
    const contentHash = generateHash(rawLatex);
    const normCurrentId = normalizeId6(currentId || '') || (currentId || '');

    // 1. Kiểm tra cache / CSDL đã kiểm tra chưa (nếu không forceRefresh)
    if (!forceRefresh) {
        let cached = null;
        if (questionId) {
            const rows = await query(`
                SELECT * FROM question_quality_checks
                WHERE question_id = ? AND content_hash = ?
                ORDER BY id DESC LIMIT 1
            `, [questionId, contentHash]);
            if (rows.length > 0) cached = rows[0];
        }
        if (!cached && contentHash) {
            const rows = await query(`
                SELECT * FROM question_quality_checks
                WHERE content_hash = ?
                ORDER BY id DESC LIMIT 1
            `, [contentHash]);
            if (rows.length > 0) cached = rows[0];
        }

        if (cached) {
            let stepDetails = {};
            try {
                stepDetails = typeof cached.step_details === 'string' 
                    ? JSON.parse(cached.step_details) 
                    : (cached.step_details || {});
            } catch {}

            return {
                id: cached.id,
                question_id: cached.question_id || questionId || null,
                content_hash: contentHash,
                is_standard: Boolean(cached.is_standard),
                score: cached.score || 0,
                steps: stepDetails.steps || {
                    step1_purpose: { passed: true, name: 'Xác định mục đích', evaluation: cached.step1_purpose },
                    step2_clarity: { passed: true, name: 'Kiểm tra độ rõ', evaluation: cached.step2_clarity },
                    step3_scope: { passed: true, name: 'Kiểm tra phạm vi', evaluation: cached.step3_scope },
                    step4_answerability: { passed: true, name: 'Kiểm tra tính trả lời được', evaluation: cached.step4_answerability },
                    step5_neutrality: { passed: true, name: 'Kiểm tra tính trung lập', evaluation: cached.step5_neutrality },
                    step6_structure: { passed: true, name: 'Kiểm tra cấu trúc', evaluation: cached.step6_structure },
                    step7_rewrite: { passed: true, name: 'Viết lại và thử đọc', rewritten_latex: cached.step7_rewrite }
                },
                current_id: cached.assigned_id || normCurrentId,
                suggested_id: cached.suggested_id || normCurrentId,
                id_assessment: stepDetails.id_assessment || 'Kết quả kiểm tra lấy từ bản lưu CSDL.',
                overall_comment: cached.overall_comment,
                checked_at: cached.updated_at || cached.created_at,
                cached: true
            };
        }
    }

    // 2. Chưa có kết quả hoặc forceRefresh -> Gọi Gemini AI phân tích 7 bước
    const { validIds } = catalogData;
    const detectedGrades = detectGradesFromQuestions([{ latex: rawLatex, current_id: normCurrentId }]);
    const promptCatalog = getFilteredCatalog(catalogData, detectedGrades).slice(0, MAX_ID_PROMPT_CHARS);

    const systemInstruction = `Bạn là Chuyên gia Khảo thí và Kiểm định chất lượng câu hỏi, đề thi chuẩn quốc gia môn Toán.
Nhiệm vụ của bạn là thẩm định câu hỏi nghiêm ngặt theo QUY TRÌNH 7 BƯỚC:
1. Xác định mục đích: Câu hỏi cần giúp người học tìm hiểu, quyết định hoặc làm rõ điều gì? Đo lường kiến thức, năng lực nào?
2. Kiểm tra độ rõ: Người đọc có hiểu câu hỏi đang hỏi về điều gì không? Có từ ngữ mơ hồ hoặc nhiều cách hiểu không? Ký hiệu toán học và thuật ngữ chuẩn xác chưa?
3. Kiểm tra phạm vi: Câu hỏi có quá rộng hoặc quá hẹp không? Đã nêu rõ đối tượng, thời gian, điều kiện xác định, miền tham số chưa?
4. Kiểm tra tính trả lời được: Người trả lời có đủ thông tin để trả lời không? Câu hỏi có đòi hỏi dữ liệu hoặc kiến thức ngoài tầm tiếp cận không? Có đáp án xác định duy nhất không?
5. Kiểm tra tính trung lập: Câu hỏi có vô tình gợi ý câu trả lời, áp đặt giả định hoặc mang tính dẫn dắt không?
6. Kiểm tra cấu trúc: Câu hỏi có đang hỏi nhiều việc cùng lúc không? Nếu có, hãy tách thành các câu riêng hoặc hướng dẫn tập trung một việc chính.
7. Viết lại và thử đọc: Viết câu hỏi ngắn gọn hơn, chuẩn cú pháp LaTeX, rồi thử xem một người không biết bối cảnh có hiểu đúng ý bạn không.

ĐẠT CHUẨN KHI: Câu hỏi có mục đích rõ, đủ bối cảnh, chỉ hỏi một việc chính, trung lập và có thể trả lời được (is_standard = true).
MÃ ID ĐỀ XUẤT:
- Dựa vào danh mục ID6 chuẩn.
- Nếu câu hỏi đã gắn ID và phù hợp, giữ nguyên.
- Nếu câu hỏi CHƯA GẮN ID hoặc ID hiện tại sai (sai chương/dạng/mức độ N-H-V-C), hãy đề xuất mã ID6 chuẩn đầy đủ phù hợp nhất (ví dụ: 12D1H1-1).`;

    const userPrompt = `ĐỀ BÀI CÂU HỎI (Mã LaTeX):
${rawLatex}

MÃ ID HIỆN TẠI: "${normCurrentId || 'CHƯA GẮN ID'}"

DANH MỤC ID6 THAM CHIẾU:
${promptCatalog}

HÃY ĐÁNH GIÁ ĐỦ 7 BƯỚC VÀ TRẢ VỀ DUY NHẤT ĐỐI TƯỢNG JSON THEO ĐỊNH DẠNG:
{
  "is_standard": boolean,
  "score": number,
  "steps": {
    "step1_purpose": {
      "name": "Xác định mục đích",
      "question": "Câu hỏi cần giúp bạn tìm hiểu, quyết định hoặc làm rõ điều gì?",
      "passed": boolean,
      "evaluation": string,
      "advice": string
    },
    "step2_clarity": {
      "name": "Kiểm tra độ rõ",
      "question": "Người đọc có hiểu câu hỏi đang hỏi về điều gì không? Có từ ngữ mơ hồ hoặc nhiều cách hiểu không?",
      "passed": boolean,
      "evaluation": string,
      "advice": string
    },
    "step3_scope": {
      "name": "Kiểm tra phạm vi",
      "question": "Câu hỏi có quá rộng hoặc quá hẹp không? Đã nêu rõ đối tượng, thời gian, bối cảnh cần thiết chưa?",
      "passed": boolean,
      "evaluation": string,
      "advice": string
    },
    "step4_answerability": {
      "name": "Kiểm tra tính trả lời được",
      "question": "Người trả lời có đủ thông tin để trả lời không? Câu hỏi có đòi hỏi dữ liệu hoặc kiến thức không thể tiếp cận không?",
      "passed": boolean,
      "evaluation": string,
      "advice": string
    },
    "step5_neutrality": {
      "name": "Kiểm tra tính trung lập",
      "question": "Câu hỏi có vô tình gợi ý câu trả lời, áp đặt giả định hoặc mang tính dẫn dắt không?",
      "passed": boolean,
      "evaluation": string,
      "advice": string
    },
    "step6_structure": {
      "name": "Kiểm tra cấu trúc",
      "question": "Câu hỏi có đang hỏi nhiều việc cùng lúc không? Nếu có, hãy tách thành các câu riêng.",
      "passed": boolean,
      "evaluation": string,
      "advice": string
    },
    "step7_rewrite": {
      "name": "Viết lại và thử đọc",
      "question": "Viết câu hỏi ngắn gọn hơn, rồi thử xem một người không biết bối cảnh có hiểu đúng ý bạn không.",
      "passed": boolean,
      "rewritten_latex": string,
      "evaluation": string,
      "trial_reading_feedback": string
    }
  },
  "current_id": string,
  "suggested_id": string,
  "id_assessment": string,
  "overall_comment": string
}`;

    const response = await generateWithFallback(apiKeys, userPrompt, {
        systemInstruction,
        responseMimeType: 'application/json',
        maxOutputTokens: 3072
    });

    const parsed = JSON.parse((response.text || '{}').replace(/^```json\s*|\s*```$/g, ''));
    
    // Chuẩn hóa và kiểm tra mã ID đề xuất
    let rawSuggestedId = normalizeId6(parsed.suggested_id || '');
    if (!rawSuggestedId && parsed.suggested_id) {
        rawSuggestedId = parsed.suggested_id;
    }
    if (!rawSuggestedId && normCurrentId && validIds.has(normCurrentId)) {
        rawSuggestedId = normCurrentId;
    }

    const steps = parsed.steps || {};
    const step1 = steps.step1_purpose || {};
    const step2 = steps.step2_clarity || {};
    const step3 = steps.step3_scope || {};
    const step4 = steps.step4_answerability || {};
    const step5 = steps.step5_neutrality || {};
    const step6 = steps.step6_structure || {};
    const step7 = steps.step7_rewrite || {};

    const passCount = [
        step1.passed, step2.passed, step3.passed, 
        step4.passed, step5.passed, step6.passed, step7.passed
    ].filter(Boolean).length;

    const isStandard = Boolean(parsed.is_standard ?? (passCount >= 6 && step1.passed && step3.passed && step4.passed && step5.passed && step6.passed));

    const result = {
        question_id: questionId || null,
        content_hash: contentHash,
        is_standard: isStandard,
        score: typeof parsed.score === 'number' ? parsed.score : passCount,
        steps,
        current_id: normCurrentId,
        suggested_id: rawSuggestedId || normCurrentId || '',
        id_assessment: parsed.id_assessment || 'Đã đối chiếu với danh mục ID6.',
        overall_comment: parsed.overall_comment || (isStandard ? 'Câu hỏi đạt tiêu chuẩn chất lượng.' : 'Câu hỏi cần cải thiện theo các tiêu chí chưa đạt.'),
        cached: false
    };

    // 3. Lưu hoặc cập nhật vào bảng question_quality_checks
    try {
        let existingId = null;
        if (questionId) {
            const ex = await query('SELECT id FROM question_quality_checks WHERE question_id = ? AND content_hash = ? ORDER BY id DESC LIMIT 1', [questionId, contentHash]);
            if (ex.length > 0) existingId = ex[0].id;
        }
        if (!existingId && contentHash) {
            const ex = await query('SELECT id FROM question_quality_checks WHERE content_hash = ? ORDER BY id DESC LIMIT 1', [contentHash]);
            if (ex.length > 0) existingId = ex[0].id;
        }

        const stepDetailsJson = JSON.stringify({ steps, id_assessment: result.id_assessment });

        if (existingId) {
            await query(`
                UPDATE question_quality_checks SET
                    question_id = COALESCE(?, question_id),
                    assigned_id = ?,
                    suggested_id = ?,
                    is_standard = ?,
                    score = ?,
                    step1_purpose = ?,
                    step2_clarity = ?,
                    step3_scope = ?,
                    step4_answerability = ?,
                    step5_neutrality = ?,
                    step6_structure = ?,
                    step7_rewrite = ?,
                    step_details = ?,
                    overall_comment = ?,
                    checked_by = COALESCE(?, checked_by),
                    updated_at = NOW()
                WHERE id = ?
            `, [
                questionId || null,
                normCurrentId || null,
                result.suggested_id || null,
                result.is_standard ? 1 : 0,
                result.score,
                step1.evaluation || '',
                step2.evaluation || '',
                step3.evaluation || '',
                step4.evaluation || '',
                step5.evaluation || '',
                step6.evaluation || '',
                step7.rewritten_latex || '',
                stepDetailsJson,
                result.overall_comment,
                userId || null,
                existingId
            ]);
            result.id = existingId;
        } else {
            const insertRes = await query(`
                INSERT INTO question_quality_checks 
                (question_id, content_hash, assigned_id, suggested_id, is_standard, score, 
                 step1_purpose, step2_clarity, step3_scope, step4_answerability, 
                 step5_neutrality, step6_structure, step7_rewrite, step_details, 
                 overall_comment, checked_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                questionId || null,
                contentHash,
                normCurrentId || null,
                result.suggested_id || null,
                result.is_standard ? 1 : 0,
                result.score,
                step1.evaluation || '',
                step2.evaluation || '',
                step3.evaluation || '',
                step4.evaluation || '',
                step5.evaluation || '',
                step6.evaluation || '',
                step7.rewritten_latex || '',
                stepDetailsJson,
                result.overall_comment,
                userId || null
            ]);
            result.id = insertRes?.insertId || null;
        }
    } catch (saveErr) {
        console.error('Error saving question_quality_checks:', saveErr.message);
    }

    return result;
}

// Endpoint: Kiểm tra chất lượng 7 bước cho 1 câu hỏi
router.post('/ai/quality-check-7steps', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { latex, current_id, question_id, force_refresh } = req.body;
        if (typeof latex !== 'string' || !latex.trim()) {
            return res.status(400).json({ error: 'Nội dung câu hỏi không hợp lệ.' });
        }
        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys || apiKeys.length === 0) {
            return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });
        }

        const catalogData = await getCachedId6Catalog();
        const result = await runSingleQualityCheck({
            latex,
            currentId: current_id,
            questionId: question_id ? Number(question_id) : null,
            forceRefresh: Boolean(force_refresh),
            userId: req.user.id,
            catalogData,
            apiKeys
        });

        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
    }
});

// Endpoint: Kiểm tra toàn diện hàng loạt ngân hàng câu hỏi (Tự động bỏ qua các câu đã kiểm tra)
router.post('/ai/batch-quality-check-bank', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const limit = Math.min(Math.max(Number(req.body?.limit) || 4, 1), 6);
        const forceRefresh = Boolean(req.body?.force_refresh);
        const ownershipSql = req.user.role === 'ADMIN' ? '' : 'AND q.created_by = ?';
        const params = req.user.role === 'ADMIN' ? [limit] : [req.user.id, limit];

        let questions = [];
        if (forceRefresh) {
            questions = await query(`
                SELECT q.id, q.legacy_full_id, q.content_latex, q.unit_id, q.level_id, q.content_hash
                FROM questions q
                WHERE 1=1 ${ownershipSql}
                ORDER BY q.id ASC LIMIT ?
            `, params);
        } else {
            questions = await query(`
                SELECT q.id, q.legacy_full_id, q.content_latex, q.unit_id, q.level_id, q.content_hash
                FROM questions q
                WHERE NOT EXISTS (
                    SELECT 1 FROM question_quality_checks qc
                    WHERE qc.question_id = q.id
                      AND COALESCE(qc.content_hash, '') = COALESCE(q.content_hash, '')
                ) ${ownershipSql}
                ORDER BY q.id ASC LIMIT ?
            `, params);
        }

        if (!questions.length) {
            return res.json({ success: true, processed: 0, remaining: 0, results: [] });
        }

        const apiKeys = await getGeminiApiKeys(req.user.id);
        if (!apiKeys || apiKeys.length === 0) {
            return res.status(400).json({ error: 'Chưa cấu hình Gemini API Key.' });
        }

        const catalogData = await getCachedId6Catalog();
        const results = [];

        for (const q of questions) {
            try {
                const checkRes = await runSingleQualityCheck({
                    latex: q.content_latex,
                    currentId: q.legacy_full_id,
                    questionId: q.id,
                    forceRefresh,
                    userId: req.user.id,
                    catalogData,
                    apiKeys
                });
                results.push({
                    id: q.id,
                    legacy_full_id: q.legacy_full_id,
                    content_latex: q.content_latex,
                    ...checkRes
                });
            } catch (err) {
                console.error(`Error checking question ${q.id}:`, err.message);
                results.push({
                    id: q.id,
                    legacy_full_id: q.legacy_full_id,
                    error: err.message,
                    is_standard: false,
                    score: 0
                });
            }
        }

        // Đếm số câu còn lại chưa kiểm tra
        const remainingRows = await query(`
            SELECT COUNT(*) AS total FROM questions q
            WHERE NOT EXISTS (
                SELECT 1 FROM question_quality_checks qc
                WHERE qc.question_id = q.id
                  AND COALESCE(qc.content_hash, '') = COALESCE(q.content_hash, '')
            ) ${ownershipSql}
        `, req.user.role === 'ADMIN' ? [] : [req.user.id]);

        const remaining = Number(remainingRows[0]?.total || 0);

        res.json({
            success: true,
            processed: results.length,
            remaining,
            results
        });
    } catch (e) {
        res.status(e?.status === 429 ? 429 : 500).json({ error: parseGeminiError(e) });
    }
});

// Endpoint: Thống kê tổng hợp kiểm định chất lượng ngân hàng
router.get('/ai/quality-summary', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const ownershipSql = req.user.role === 'ADMIN' ? '' : 'AND q.created_by = ?';
        const params = req.user.role === 'ADMIN' ? [] : [req.user.id];

        const [totRow] = await query(`SELECT COUNT(*) AS total FROM questions q WHERE 1=1 ${ownershipSql}`, params);
        const total = Number(totRow?.total || 0);

        const [checkedRow] = await query(`
            SELECT 
                COUNT(DISTINCT q.id) AS checked,
                SUM(CASE WHEN qc.is_standard = 1 THEN 1 ELSE 0 END) AS standard,
                SUM(CASE WHEN qc.is_standard = 0 THEN 1 ELSE 0 END) AS substandard
            FROM questions q
            INNER JOIN question_quality_checks qc ON q.id = qc.question_id AND COALESCE(q.content_hash, '') = COALESCE(qc.content_hash, '')
            WHERE 1=1 ${ownershipSql}
        `, params);

        const checked = Number(checkedRow?.checked || 0);
        const standard = Number(checkedRow?.standard || 0);
        const substandard = Number(checkedRow?.substandard || 0);
        const unchecked = Math.max(0, total - checked);

        res.json({
            success: true,
            data: {
                total_questions: total,
                checked_count: checked,
                standard_count: standard,
                substandard_count: substandard,
                unchecked_count: unchecked,
                standard_rate: checked > 0 ? Math.round((standard / checked) * 100) : 0
            }
        });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
    }
});

// Endpoint: Lấy chi tiết lịch sử kiểm định của 1 câu hỏi
router.get('/ai/quality-check/:questionId', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const questionId = Number(req.params.questionId);
        const rows = await query(`
            SELECT * FROM question_quality_checks
            WHERE question_id = ?
            ORDER BY id DESC LIMIT 1
        `, [questionId]);

        if (rows.length === 0) {
            return res.json({ success: true, data: null });
        }

        const cached = rows[0];
        let stepDetails = {};
        try {
            stepDetails = typeof cached.step_details === 'string' ? JSON.parse(cached.step_details) : (cached.step_details || {});
        } catch {}

        res.json({
            success: true,
            data: {
                id: cached.id,
                question_id: cached.question_id,
                content_hash: cached.content_hash,
                is_standard: Boolean(cached.is_standard),
                score: cached.score || 0,
                steps: stepDetails.steps || {},
                current_id: cached.assigned_id,
                suggested_id: cached.suggested_id,
                id_assessment: stepDetails.id_assessment || '',
                overall_comment: cached.overall_comment,
                checked_at: cached.updated_at || cached.created_at
            }
        });
    } catch (e) {
        res.status(500).json({ error: parseGeminiError(e) });
    }
});

router.use(adaptivePracticeRoutes);

export default router;
