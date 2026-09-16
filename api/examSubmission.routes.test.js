import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
const question = { id: 42, type: 'TN', content: 'Bài toán', solution: 'Lời giải từng câu', options: [{ id: 'A', isCorrect: false }, { id: 'B', isCorrect: true }] };
const row = { id: 7, user_id: 1, status: 'IN_PROGRESS', matrix_id: null, score: 0, result_detail: { questions: [question], answers: {} } };
let updates = 0;
vi.mock('./core.js', () => ({
    query: async (sql, params) => {
        if (sql.startsWith('SELECT')) return [{ ...row }];
        if (sql.startsWith('UPDATE exam_results')) { updates++; row.score = params[0]; row.result_detail = JSON.parse(params[2]); row.status = 'COMPLETED'; return { affectedRows: 1 }; }
        return [];
    },
    isAdmin: () => false, isSelfOrAdmin: () => true, requireAdmin: () => false,
    requireTeacherOrAdmin: () => false, canManageMatrix: async () => false, canAccessExamResult: async () => true
}));
let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/exams.routes.js');
    const app = express(); app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, role: 'STUDENT' }; next(); });
    app.use('/api', router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}/api`;
});
afterAll(() => server?.close());
describe('confirmed exam submission and immediate review', () => {
    it('returns server score, persists answers, immediately exposes completed snapshot and is idempotent', async () => {
        const submit = () => fetch(`${base}/exam-results`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 7, answers: { 42: 'B' }, duration_seconds: 60 }) });
        const first = await submit();
        expect(await first.json()).toMatchObject({ success: true, id: 7, score: 10 });
        expect(first.headers.get('cache-control')).toContain('no-store');
        const detail = (await (await fetch(`${base}/exam-results/7`)).json()).data;
        expect(detail.status).toBe('COMPLETED');
        expect(detail.result_detail.answers).toEqual({ 42: 'B' });
        expect(detail.result_detail.questions[0].solution).toBe('Lời giải từng câu');
        expect((await (await submit()).json()).alreadySubmitted).toBe(true);
        expect(updates).toBe(1);
    });
});
