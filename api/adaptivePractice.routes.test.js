import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
let candidates, results, calls, usage, limited, reserved, race;
vi.mock('./core.js', () => ({
    canManageClass: async () => false,
    query: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('FROM users')) return [{ role: 'STUDENT', is_pro: limited ? 0 : 1 }];
        if (sql.includes('FROM exam_results')) return results;
        if (sql.includes('SELECT review_count')) return [{ review_count: usage }];
        if (sql.startsWith('INSERT INTO activity_limits')) return {};
        if (sql.startsWith('UPDATE activity_limits')) { if (race || usage >= 2) return { affectedRows: 0 }; reserved++; usage++; return { affectedRows: 1 }; }
        if (sql.includes('FROM questions q JOIN question_types')) return candidates;
        return [];
    },
}));
let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/adaptivePractice.routes.js');
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { id: 7, role: 'STUDENT' }; next(); }); app.use(router);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    base = `http://127.0.0.1:${server.address().port}/adaptive/generate`;
});
afterAll(() => server?.close());
beforeEach(() => { candidates = [{ id: 1, id_full: '[12D1B1-1]', type: 'TN', is_public: 0, raw_latex: 'Question' }]; results = []; calls = []; usage = 0; limited = true; reserved = 0; race = false; });
const request = body => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
describe('student practice generation', () => {
    it('loads imported questions from the existing shared bank and canonicalizes legacy ID6', async () => {
        const response = await request({ skill_key: '2D1H1-1' });
        expect(response.status).toBe(200);
        const data = await response.json(); expect(data.data[0].id_full).toBe('2D1H1-1'); expect(data.data).toHaveLength(1); expect(reserved).toBe(1);
        expect(calls.find(c => c.sql.includes('ORDER BY RAND')).sql).not.toContain('is_public');
    });
    it('keeps exact skill scope and never fills with other forms or unmarked essays', async () => {
        candidates.push({ id: 2, id_full: '2D1V1-1', type: 'TN' }, { id: 3, id_full: '2D1H1-2', type: 'TN' }, { id: 4, id_full: '2D1H1-1', type: 'TL' });
        const result = await (await request({ skill_key: '2D1H1-1', limit: 10 })).json(); expect(result.data.map(q => q.id)).toEqual([1]);
        const form = await (await request({ skill_key: '2-D-1-1-1' })).json(); expect(form.data.map(q => q.id)).toEqual([1, 2]);
    });
    it('offers form selection to a new student without spending a review', async () => {
        const response = await request({}); const result = await response.json();
        expect(response.status).toBe(200); expect(result.needs_selection).toBe(true); expect(result.data).toEqual([]); expect(reserved).toBe(0);
    });
    it('does not charge invalid or empty requests', async () => {
        expect((await request({ skill_key: 'invalid' })).status).toBe(400);
        candidates = []; expect((await request({ skill_key: '2D1H1-1' })).status).toBe(422); expect(reserved).toBe(0);
    });
    it('enforces the same daily cap atomically and allows Pro accounts', async () => {
        usage = 2; expect((await request({ skill_key: '2D1H1-1' })).status).toBe(403);
        usage = 0; race = true; expect((await request({ skill_key: '2D1H1-1' })).status).toBe(403);
        limited = false; expect((await request({ skill_key: '2D1H1-1' })).status).toBe(200); expect(reserved).toBe(0);
    });
    it('uses only the signed-in student history for personal practice', async () => {
        results = [{ id: 1, user_id: 7, status: 'COMPLETED', created_at: '2026-10-07', result_detail: { questions: [{ id: 1, id_full: '2D1H1-1', type: 'TN', options: [{ id: 'A', isCorrect: true }] }], answers: { 1: 'B' } } }];
        const response = await request({ user_id: 999 }); expect(response.status).toBe(200);
        expect(calls.find(c => c.sql.includes('FROM exam_results')).params).toEqual([7]);
    });
});
