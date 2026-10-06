import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { 
    query, 
    requireTeacherOrAdmin, 
    getGeminiApiKeys,
    generateWithFallback, 
    parseGeminiError 
} from '../core.js';
import { normalizeId6, extractSourceId, injectCanonicalId, requiresAiIdReview, validateId6Candidate } from '../id6.js';
import { normalizeExTestOutput } from '../exTest.js';
import { convertPdfToExTest } from '../pdfToExTest.js';

import { approvedPractice } from './eduloop.routes.js';
import { correctness, buildGapMap } from '../eduloop.js';

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

router.post('/adaptive/generate', async (req, res) => {
    try {
        const limit = Math.min(30, Math.max(1, Number.parseInt(req.body.limit, 10) || 10));
        if (req.body.recommendation_id) return res.json(await approvedPractice(req));
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
        
        if (req.body.skill_key) {
            const skill = normalizeId6(req.body.skill_key);
            if (!skill) return res.status(400).json({ error: 'Kỹ năng không hợp lệ.' });
            const questions = await query(`SELECT q.id, q.legacy_full_id AS id_full, q.content_latex,
                q.content_latex_original AS original_latex, q.content_latex AS raw_latex, qt.code AS type
                FROM questions q JOIN question_types qt ON qt.id = q.type_id
                WHERE q.legacy_full_id = ? AND qt.code IN ('TN','TF','KQ')
                AND (q.is_public = 1 OR q.created_by = ?) ORDER BY RAND() LIMIT ?`, [skill, user_id, limit]);
            if (!questions.length) return res.status(422).json({ error: 'Chưa có câu hỏi được phép sử dụng cho kỹ năng này.' });
            return res.json({ success: true, data: questions, ai_analysis: `Luyện tập tập trung kỹ năng ${skill}.`,
                evidence: [], approval: { status: 'SELF_PRACTICE' } });
        }

        // 1. Find questions user has failed
        const results = await query("SELECT id, user_id, status, created_at, result_detail FROM exam_results WHERE user_id = ? AND status = 'COMPLETED'", [user_id]);
        const failedIds = new Set();
        
        results.forEach(r => {
            try {
                const detail = typeof r.result_detail === 'string' ? JSON.parse(r.result_detail) : r.result_detail;
                const { questions, answers } = detail;
                if (questions && answers) {
                    questions.forEach(q => {
                        const value = correctness(q, answers[q.id]);
                        const isCorrect = value === null || value === 1;
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

        const historyMap = buildGapMap(results);
        const evidence = questions.map(q => {
            const skill = historyMap.skills.find(s => s.key === normalizeId6(q.id_full));
            return { question_id: q.id, skill: normalizeId6(q.id_full) || null,
                reason: skill ? 'Cùng ID6 đã làm: mức đúng ' + skill.rate + '% trên ' + skill.attempts + ' lượt.' : 'Câu luyện tập bổ sung ngẫu nhiên; chưa có bằng chứng lỗ hổng cho dạng này.',
                evidence: skill?.evidence || [], confidence: skill?.confidence || 'INSUFFICIENT' };
        });
        res.json({ success: true, data: questions, ai_analysis, evidence, approval: { status: 'SELF_PRACTICE' } });
    } catch (e) { res.status(e.status || (e.code === 'ER_NO_SUCH_TABLE' ? 503 : 500)).json({ error: e.code === 'ER_NO_SUCH_TABLE' ? 'Chưa chạy migration EduLoop.' : parseGeminiError(e) }); }
});

export default router;
