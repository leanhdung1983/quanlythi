import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let checks = [];
let questions = [];
let aiCalls = [];

vi.mock('./core.js', () => ({
    query: async (sql, params = []) => {
        if (sql.includes('SELECT * FROM question_quality_checks')) {
            return checks.filter(c => {
                if (sql.includes('question_id = ?')) {
                    return c.question_id === params[0];
                }
                if (sql.includes('content_hash = ?')) {
                    return c.content_hash === params[0];
                }
                return true;
            });
        }
        if (sql.includes('FROM question_quality_checks') && sql.includes('SELECT id')) {
            const found = checks.find(c => {
                if (sql.includes('question_id = ?')) {
                    return c.question_id === params[0];
                }
                if (sql.includes('content_hash = ?')) {
                    return c.content_hash === params[0];
                }
                return false;
            });
            return found ? [{ id: found.id, step_details: found.step_details }] : [];
        }
        if (sql.includes('INSERT INTO question_quality_checks')) {
            const newId = checks.length + 1;
            checks.push({
                id: newId,
                question_id: params[0],
                content_hash: params[1],
                assigned_id: params[2],
                suggested_id: params[3],
                is_standard: params[4],
                score: params[5],
                step1_purpose: params[6],
                step2_clarity: params[7],
                step3_scope: params[8],
                step4_answerability: params[9],
                step5_neutrality: params[10],
                step6_structure: params[11],
                step7_rewrite: params[12],
                step_details: params[13],
                overall_comment: params[14]
            });
            return { insertId: newId };
        }
        if (sql.includes('UPDATE question_quality_checks')) {
            if (sql.includes('WHERE id = ?')) {
                const targetId = params[params.length - 1];
                const item = checks.find(c => c.id === targetId);
                if (item) {
                    if (sql.includes('is_standard = 1')) item.is_standard = 1;
                    if (sql.includes('score = 7')) item.score = 7;
                }
            }
            return { affectedRows: 1 };
        }
        if (sql.includes('SELECT COUNT(DISTINCT q.id) AS total')) {
            if (sql.includes('qc.is_standard = 0')) {
                const count = checks.filter(c => c.is_standard === 0 || c.is_standard === false).length;
                return [{ total: count }];
            }
            if (sql.includes('qc.is_standard = 1')) {
                const count = checks.filter(c => c.is_standard === 1 || c.is_standard === true).length;
                return [{ total: count }];
            }
            return [{ total: checks.length }];
        }
        if (sql.includes('FROM questions q') && sql.includes('INNER JOIN question_quality_checks qc') && !sql.includes('SUM(CASE')) {
            const isSub = sql.includes('qc.is_standard = 0');
            const isStd = sql.includes('qc.is_standard = 1');
            const filteredChecks = checks.filter(c => {
                if (isSub) return c.is_standard === 0 || c.is_standard === false;
                if (isStd) return c.is_standard === 1 || c.is_standard === true;
                return true;
            });
            return filteredChecks.map(c => {
                const q = questions.find(item => item.id === c.question_id) || { id: c.question_id, legacy_full_id: c.assigned_id, content_latex: 'test latex' };
                return {
                    id: q.id,
                    legacy_full_id: q.legacy_full_id || c.assigned_id,
                    content_latex: q.content_latex,
                    quality_check_id: c.id,
                    assigned_id: c.assigned_id,
                    suggested_id: c.suggested_id,
                    is_standard: c.is_standard,
                    score: c.score,
                    step_details: c.step_details,
                    overall_comment: c.overall_comment,
                    updated_at: new Date()
                };
            });
        }
        if (sql.includes('SELECT COUNT(*) AS total FROM questions')) {
            return [{ total: questions.length }];
        }
        if (sql.includes('SUM(CASE WHEN qc.is_standard = 1 THEN 1 ELSE 0 END) AS standard')) {
            const std = checks.filter(c => c.is_standard === 1 || c.is_standard === true).length;
            const sub = checks.filter(c => c.is_standard === 0 || c.is_standard === false).length;
            return [{ checked: checks.length, standard: std, substandard: sub }];
        }
        if (sql.includes('SELECT q.id, q.legacy_full_id, q.content_latex')) {
            return questions.slice(0, params[0] || 4);
        }
        if (sql.includes('SELECT m.id_full')) {
            return [
                { id_full: '12D1H1-1', description: 'Đơn điệu hàm số', grade: '2', subject: 'D', chapter: 1, unit: 1, level: 'H' },
                { id_full: '10H1N1-1', description: 'Véc tơ', grade: '0', subject: 'H', chapter: 1, unit: 1, level: 'N' }
            ];
        }
        return [];
    },
    requireTeacherOrAdmin: (req, res) => true,
    getGeminiApiKeys: async () => ['fake-api-key'],
    generateWithFallback: async (keys, prompt, options) => {
        aiCalls.push({ prompt, options });
        return {
            text: JSON.stringify({
                is_standard: true,
                score: 7,
                steps: {
                    step1_purpose: { passed: true, name: 'Xác định mục đích', evaluation: 'Mục đích rõ ràng', advice: '' },
                    step2_clarity: { passed: true, name: 'Kiểm tra độ rõ', evaluation: 'Diễn đạt rõ ràng', advice: '' },
                    step3_scope: { passed: true, name: 'Kiểm tra phạm vi', evaluation: 'Phạm vi xác định', advice: '' },
                    step4_answerability: { passed: true, name: 'Kiểm tra tính trả lời được', evaluation: 'Đủ dữ kiện', advice: '' },
                    step5_neutrality: { passed: true, name: 'Kiểm tra tính trung lập', evaluation: 'Khách quan', advice: '' },
                    step6_structure: { passed: true, name: 'Kiểm tra cấu trúc', evaluation: 'Đơn mục tiêu', advice: '' },
                    step7_rewrite: { passed: true, name: 'Viết lại và thử đọc', rewritten_latex: '\\begin{ex} Rõ ràng \\end{ex}', trial_reading_feedback: 'Dễ hiểu' }
                },
                current_id: '12D1H1-1',
                suggested_id: '12D1H1-1',
                id_assessment: 'Khớp mã ID',
                overall_comment: 'Câu hỏi đạt chuẩn xuất sắc.'
            })
        };
    },
    parseGeminiError: e => e.message,
    generateHash: content => 'mockedhash_' + Buffer.from(content).toString('hex').slice(0, 16)
}));

let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/ai.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, role: 'TEACHER' }; next(); });
    app.use('/api', router);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    base = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(() => server?.close());

beforeEach(() => {
    checks = [];
    questions = [];
    aiCalls = [];
});

describe('7-Step Question Quality Check & Bank Audit API', () => {
    it('rejects empty question latex with 400', async () => {
        const res = await fetch(`${base}/ai/quality-check-7steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latex: '' })
        });
        expect(res.status).toBe(400);
    });

    it('runs 7-step quality check via AI and saves to database', async () => {
        const res = await fetch(`${base}/ai/quality-check-7steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latex: '\\begin{ex} Cho hàm số $y=x^3-3x$. Mệnh đề nào đúng? \\choice{\\True Đồng biến}{(1;2)}{B}{C} \\end{ex}',
                current_id: '12D1H1-1',
                question_id: 101
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.is_standard).toBe(true);
        expect(data.data.score).toBe(7);
        expect(data.data.steps.step1_purpose.passed).toBe(true);
        expect(data.data.steps.step7_rewrite.rewritten_latex).toContain('\\begin{ex}');
        expect(data.data.cached).toBe(false);
        expect(checks).toHaveLength(1);
        expect(checks[0].question_id).toBe(101);
    });

    it('returns cached result immediately on subsequent call to avoid repeating AI tokens', async () => {
        const latex = '\\begin{ex} Câu hỏi mẫu đã kiểm tra \\end{ex}';
        // 1st call
        await fetch(`${base}/ai/quality-check-7steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latex, current_id: '12D1H1-1', question_id: 202 })
        });
        expect(aiCalls).toHaveLength(1);

        // 2nd call with same question
        const res2 = await fetch(`${base}/ai/quality-check-7steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latex, current_id: '12D1H1-1', question_id: 202 })
        });
        const data2 = await res2.json();
        expect(data2.data.cached).toBe(true);
        // AI calls count remains 1!
        expect(aiCalls).toHaveLength(1);
    });

    it('returns quality summary statistics correctly', async () => {
        questions = [{ id: 1 }, { id: 2 }, { id: 3 }];
        checks = [
            { id: 1, question_id: 1, is_standard: 1 },
            { id: 2, question_id: 2, is_standard: 0 }
        ];

        const res = await fetch(`${base}/ai/quality-summary`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.total_questions).toBe(3);
        expect(data.data.checked_count).toBe(2);
        expect(data.data.standard_count).toBe(1);
        expect(data.data.substandard_count).toBe(1);
        expect(data.data.unchecked_count).toBe(1);
        expect(data.data.standard_rate).toBe(50);
    });

    it('fetches list of questions needing improvement (substandard)', async () => {
        questions = [
            { id: 1, legacy_full_id: '12D1H1-1', content_latex: 'Câu 1' },
            { id: 2, legacy_full_id: '12D1H1-2', content_latex: 'Câu 2' }
        ];
        checks = [
            { id: 1, question_id: 1, assigned_id: '12D1H1-1', is_standard: 1, score: 7 },
            { id: 2, question_id: 2, assigned_id: '12D1H1-2', is_standard: 0, score: 4, overall_comment: 'Cần sửa cấu trúc' }
        ];

        const res = await fetch(`${base}/ai/quality-check-questions?status=substandard`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.total).toBe(1);
        expect(data.data.items).toHaveLength(1);
        expect(data.data.items[0].question_id).toBe(2);
        expect(data.data.items[0].is_standard).toBe(false);
    });

    it('confirms question has been edited and marks as standard', async () => {
        checks = [
            { id: 2, question_id: 2, is_standard: 0, score: 4 }
        ];

        const res = await fetch(`${base}/ai/quality-check/confirm-resolved`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: 2, note: 'Đã hoàn tất chỉnh sửa câu hỏi' })
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.is_standard).toBe(true);
        expect(data.data.score).toBe(7);
        expect(checks.find(c => c.question_id === 2)?.is_standard).toBe(1);
    });
});
