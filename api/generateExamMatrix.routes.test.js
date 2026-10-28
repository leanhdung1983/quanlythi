import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const sampleQuestions = [
    { id: 1, legacy_full_id: '2D1N1-1', type_code: 'TN', content_latex: 'Câu 1 TN', content_latex_original: 'Câu 1 TN' },
    { id: 2, legacy_full_id: '2D1N1-2', type_code: 'TN', content_latex: 'Câu 2 TN', content_latex_original: 'Câu 2 TN' },
    { id: 3, legacy_full_id: '2D1N1-3', type_code: 'TN', content_latex: 'Câu 3 TN', content_latex_original: 'Câu 3 TN' },
    { id: 4, legacy_full_id: '2D1N1-4', type_code: 'TN', content_latex: 'Câu 4 TN', content_latex_original: 'Câu 4 TN' },
    { id: 5, legacy_full_id: '2D1N1-5', type_code: 'TN', content_latex: 'Câu 5 TN', content_latex_original: 'Câu 5 TN' },
    { id: 6, legacy_full_id: '2D1N1-6', type_code: 'TN', content_latex: 'Câu 6 TN', content_latex_original: 'Câu 6 TN' },
    { id: 7, legacy_full_id: '2D1H1-1', type_code: 'TN', content_latex: 'Câu 7 TN', content_latex_original: 'Câu 7 TN' },
    { id: 8, legacy_full_id: '2D1H1-2', type_code: 'TN', content_latex: 'Câu 8 TN', content_latex_original: 'Câu 8 TN' },
];

vi.mock('./core.js', () => ({
    pool: {},
    isAdmin: () => true,
    isSelfOrAdmin: () => true,
    requireAdmin: () => true,
    requireTeacherOrAdmin: () => true,
    canManageMatrix: () => true,
    canAccessExamResult: () => true,
    query: async (sql, params) => {
        if (sql.includes('SELECT q.id, q.legacy_full_id')) {
            return sampleQuestions.map(q => ({ id: q.id, id_full: q.legacy_full_id, type_code: q.type_code }));
        }
        if (sql.includes('SELECT id, legacy_full_id as id_full')) {
            const ids = params[0] || [];
            return sampleQuestions.filter(q => ids.includes(q.id));
        }
        if (sql.startsWith('UPDATE questions SET used_count')) {
            return [{ affectedRows: params[0]?.length || 0 }];
        }
        return [];
    }
}));

let server, base;

beforeAll(async () => {
    const { default: router } = await import('./routes/exams.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        req.user = { id: 1, role: 'TEACHER' };
        next();
    });
    app.use('/api', router);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}/api/generate-exam-matrix`;
});

afterAll(() => server?.close());

describe('POST /generate-exam-matrix multi-exam capability', () => {
    it('generates a single exam by default with backward compatible format', async () => {
        const matrix = {
            TN: {
                '2-D-1-1-*': { N: 2, H: 0, V: 0, C: 0 }
            }
        };

        const res = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matrix, exam_count: 1 })
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.total_questions).toBe(2);
        expect(json.tex).toContain('\\begin{ex}');
        expect(json.exams).toHaveLength(1);
        expect(json.exams[0].total_questions).toBe(2);
        expect(json.distinct_status).toBe('FULL_DISTINCT');
        expect(json.overlap_count).toBe(0);
    });

    it('generates multiple exams with completely distinct questions when question bank is sufficient', async () => {
        // We have 6 questions for 2D1N1. Request 3 exams with 2 questions each (total 6 needed).
        const matrix = {
            TN: {
                '2-D-1-1-*': { N: 2, H: 0, V: 0, C: 0 }
            }
        };

        const res = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matrix, exam_count: 3, start_code: '101', exam_title: 'Kiểm tra 1 tiết' })
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.exam_count).toBe(3);
        expect(json.exams).toHaveLength(3);

        const exam1Ids = json.exams[0].data.TN.map(q => q.id);
        const exam2Ids = json.exams[1].data.TN.map(q => q.id);
        const exam3Ids = json.exams[2].data.TN.map(q => q.id);

        expect(exam1Ids).toHaveLength(2);
        expect(exam2Ids).toHaveLength(2);
        expect(exam3Ids).toHaveLength(2);

        // Verify distinct codes
        expect(json.exams[0].code).toBe('101');
        expect(json.exams[1].code).toBe('102');
        expect(json.exams[2].code).toBe('103');

        // Verify that question IDs across all 3 exams are strictly disjoint (no duplicate questions)
        const allIds = [...exam1Ids, ...exam2Ids, ...exam3Ids];
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(6);
        expect(json.distinct_status).toBe('FULL_DISTINCT');
        expect(json.overlap_count).toBe(0);

        // Check combined_tex
        expect(json.combined_tex).toContain('MÃ ĐỀ: 101');
        expect(json.combined_tex).toContain('MÃ ĐỀ: 102');
        expect(json.combined_tex).toContain('MÃ ĐỀ: 103');
        expect(json.combined_tex).toContain('\\newpage');
    });

    it('gracefully handles bank shortage for large number of exams and provides warnings', async () => {
        // Pool only has 2 questions for 2D1H1, but request 3 exams with 1 question each (needs 3)
        const matrix = {
            TN: {
                '2-D-1-1-*': { N: 0, H: 1, V: 0, C: 0 }
            }
        };

        const res = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matrix, exam_count: 3, start_code: '201' })
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.exams).toHaveLength(3);
        expect(json.distinct_status).toBe('PARTIAL_DISTINCT');
        expect(json.overlap_count).toBeGreaterThan(0);
        // Each exam must not have duplicate questions within itself
        json.exams.forEach(ex => {
            const ids = ex.data.TN.map(q => q.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });
});
