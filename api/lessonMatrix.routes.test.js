import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
let role, keys, aiResult, aiCalls, holdAI, aiSignal, notifyStarted;
vi.mock('./core.js', () => ({
    pool: {}, isAdmin: () => false, requireAdmin: () => false,
    requireTeacherOrAdmin: (req, res) => { if (req.user.role === 'STUDENT') { res.status(403).json({ error: 'Forbidden' }); return false; } return true; },
    getGeminiApiKey: vi.fn(), getGeminiApiKeys: async () => keys,
    generateWithFallback: async (_keys, _prompt, config) => {
        aiCalls++; aiSignal = config.abortSignal;
        if (holdAI) { notifyStarted?.(); return new Promise(() => {}); }
        return { text: JSON.stringify(aiResult) };
    },
    parseGeminiError: e => e.message, seedDatabase: vi.fn(), clearCache: vi.fn(),
    query: async sql => {
        if (sql.includes('FROM units')) return [{ id: 1, name: 'Đạo hàm', grade_code: '2' }];
        if (sql.includes('FROM questions')) return [
            { legacy_full_id: '2D1N1-1', type: 'TN' },
            { legacy_full_id: '2D1H1-2', type: 'TN' },
            { legacy_full_id: '2D1V1-3', type: 'KQ' },
        ];
        if (sql.includes('FROM lesson_sections')) return [];
        if (sql.includes('FROM id6_metadata')) return [{ count_id: 1, description: 'Xét tính đơn điệu' }];
        throw new Error('Unexpected SQL');
    },
}));
let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/admin.routes.js');
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { id: 1, role }; next(); }); app.use('/api', router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}/api/admin/ai/lesson-matrix`;
});
afterAll(() => server?.close());
beforeEach(() => { role = 'TEACHER'; keys = ['test']; aiCalls = 0; holdAI = false; aiSignal = null; notifyStarted = null; aiResult = { rows: [{ key: '2-D-1-1-1', type: 'TN', counts: { N: 1 } }, { key: '2-D-1-1-2', type: 'TN', counts: { H: 1 } }], rationale: 'Cân đối' }; });
const request = body => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit_id: 1, total_questions: 2, ...body }) });
describe('lesson matrix proposals', () => {
    it('returns validated AI form rows', async () => {
        const response = await request({});
        const result = await response.json();
        expect(response.status).toBe(200); expect(result.data.engine).toBe('AI'); expect(result.data.rows).toHaveLength(2);
        expect(result.data.inventory[0].description).toBe('Xét tính đơn điệu');
    });
    it('returns a bank draft with an explanation when there is no API key', async () => {
        keys = [];
        const result = await (await request({})).json();
        expect(result.data.engine).toBe('BANK'); expect(result.data.warning).toContain('API Key'); expect(aiCalls).toBe(0);
    });
    it('rejects invalid AI allocation in favor of a capacity-safe draft', async () => {
        aiResult.rows[0].counts.N = 99;
        const result = await (await request({})).json();
        expect(result.data.engine).toBe('BANK'); expect(result.data.rows.every(r => Object.keys(r.counts).every(l => r.counts[l] <= r.available[l]))).toBe(true);
    });
    it('supports manual lesson allocation without contacting AI', async () => {
        const result = await (await request({ use_ai: false, scope: 'LESSON' })).json();
        expect(result.data.engine).toBe('BANK'); expect(result.data.rows[0].key).toContain('-*'); expect(aiCalls).toBe(0);
    });
    it('rejects students and invalid totals', async () => {
        expect((await request({ total_questions: 101 })).status).toBe(400);
        role = 'STUDENT'; expect((await request({})).status).toBe(403); expect(aiCalls).toBe(0);
    });
    it('cancels the provider when the teacher closes the request', async () => {
        holdAI = true;
        const started = new Promise(resolve => { notifyStarted = resolve; });
        const controller = new AbortController();
        const pending = fetch(base, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit_id: 1 }) });
        await started;
        const stopped = new Promise(resolve => aiSignal.addEventListener('abort', resolve, { once: true }));
        controller.abort(); await expect(pending).rejects.toThrow(); await stopped;
        expect(aiSignal.aborted).toBe(true);
    });
});
