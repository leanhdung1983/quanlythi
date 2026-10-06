import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
let rows, inserts, commitCount, rollbackCount, aiCalls, role, failInsert, aiResult, publicMatrix, holdAI, aiSignal, notifyAIStarted;
const initial = { title: 'Đạo hàm', blocks: [{ type: 'TEXT', title: 'Mục tiêu', content: 'Hiểu đạo hàm.' }, { type: 'EXAMPLE', title: 'Ví dụ', content: '$f(x)=x^2$' }] };
const unitRow = { id: 2, name: 'Đạo hàm', chapter_name: 'Hàm số', grade_code: '12', subject_name: 'Toán' };
const conn = {
    beginTransaction: async () => {}, release: vi.fn(),
    commit: async () => { commitCount++; }, rollback: async () => { rollbackCount++; inserts = []; },
    query: async (sql, params) => {
        if (sql.includes('FROM lesson_authoring_drafts')) return [[...rows.filter(r => r.id === Number(params[0]) && r.created_by === params[1])]];
        if (sql.includes('FROM units')) return [[unitRow]];
        if (sql.includes('MAX(order_index)')) return [[{ last_order: 7 }]];
        if (sql.includes('FROM matrix_templates')) return [[{ id: 6, is_public: publicMatrix, created_by: 1 }]];
        if (sql.startsWith('INSERT INTO lesson_sections')) { if (failInsert && inserts.length) throw new Error('simulated failure'); inserts.push(params); return [{ insertId: 100 + inserts.length }]; }
        if (sql.startsWith('UPDATE lesson_authoring_drafts')) { rows[0].published_at = 'now'; return [{ affectedRows: 1 }]; }
        throw new Error(`Unexpected SQL ${sql}`);
    }
};
vi.mock('./core.js', () => ({
    pool: { getConnection: async () => conn },
    requireTeacherOrAdmin: (req, res) => { if (req.user.role === 'STUDENT') { res.status(403).json({ error: 'Forbidden' }); return false; } return true; },
    getGeminiApiKeys: async () => ['test-key'], parseGeminiError: e => e.message,
    generateWithFallback: async (_keys, _prompt, config) => {
        aiCalls++; aiSignal = config.abortSignal;
        if (holdAI) {
            notifyAIStarted?.();
            return new Promise((_resolve, reject) => config.abortSignal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
        }
        return { text: JSON.stringify(aiResult) };
    },
    query: async (sql, params) => {
        if (sql.includes('FROM units')) return Number(params[0]) === 2 ? [unitRow] : [];
        if (sql.startsWith('SELECT * FROM lesson_authoring_drafts')) return rows.filter(r => r.created_by === params[0] && r.unit_id === Number(params[1]));
        if (sql.startsWith('INSERT')) { rows.push({ id: 3, created_by: params[1], unit_id: params[0], title: params[2], draft_json: params[3], revision: 1 }); return { insertId: 3 }; }
        if (sql.startsWith('UPDATE')) { const row = rows.find(r => r.id === Number(params[2]) && r.created_by === params[3] && r.revision === params[4] && !r.published_at); if (!row) return { affectedRows: 0 }; row.draft_json = params[1]; row.revision++; return { affectedRows: 1 }; }
        throw new Error(`Unexpected SQL ${sql}`);
    }
}));
let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/lessonAuthoring.routes.js');
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { id: 1, role }; next(); }); app.use(router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}/lesson-authoring`;
});
afterAll(() => server?.close());
beforeEach(() => { rows = [{ id: 1, unit_id: 2, created_by: 1, title: initial.title, revision: 1, draft_json: JSON.stringify(initial), published_at: null }]; inserts = []; commitCount = rollbackCount = aiCalls = 0; role = 'TEACHER'; failInsert = false; aiResult = initial; publicMatrix = 1; holdAI = false; aiSignal = null; notifyAIStarted = null; });
const request = (path, body, method = 'POST') => fetch(base + path, body ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
describe('teacher draft workflow', () => {
    it('stops waiting for AI when the editor cancels without saving or publishing', async () => {
        holdAI = true;
        const started = new Promise(resolve => { notifyAIStarted = resolve; });
        const controller = new AbortController();
        const response = fetch(base + '/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unit_id: 2 }), signal: controller.signal });
        await started;
        const stopped = new Promise(resolve => aiSignal.addEventListener('abort', resolve, { once: true }));
        controller.abort();
        await expect(response).rejects.toThrow(); await stopped;
        expect(aiSignal.aborted).toBe(true); expect(inserts).toHaveLength(0); expect(rows).toHaveLength(1);
    });
    it('keeps generation read-only and rejects student requests', async () => {
        expect((await request('/ai', { unit_id: 2 })).status).toBe(200);
        expect(aiCalls).toBe(1); expect(rows).toHaveLength(1); expect(inserts).toHaveLength(0);
        role = 'STUDENT'; expect((await request('/ai', { unit_id: 2 })).status).toBe(403);
        expect((await request('/drafts?unit_id=2')).status).toBe(403);
    });
    it('requires valid AI output and preserves rewrite block type', async () => {
        aiResult = { title: 'Bad', blocks: [{ type: 'HTML', title: 'Script' }] };
        expect((await request('/ai', { unit_id: 2 })).status).toBe(502);
        aiResult = initial;
        expect((await request('/ai', { unit_id: 2, action: 'REWRITE', draft: { title: initial.title, blocks: [initial.blocks[0]] } })).status).toBe(502);
        expect(inserts).toHaveLength(0);
    });
    it('stores private drafts and prevents stale revisions or other owners overwriting them', async () => {
        expect((await request('/drafts', { unit_id: 2, draft: initial })).status).toBe(200);
        expect((await request('/drafts/1', { revision: 1, draft: initial }, 'PUT')).status).toBe(200);
        expect((await request('/drafts/1', { revision: 1, draft: initial }, 'PUT')).status).toBe(409);
        rows[0].created_by = 9;
        expect((await request('/drafts/1', { revision: 2, draft: initial }, 'PUT')).status).toBe(409);
        expect((await (await request('/drafts?unit_id=2')).json()).data.every(r => r.created_by === 1)).toBe(true);
    });
    it('requires review and publishes once, preserving existing content order', async () => {
        expect((await request('/drafts/1/publish', { revision: 1 })).status).toBe(400);
        expect((await request('/drafts/1/publish', { revision: 2, reviewed: true })).status).toBe(409);
        expect((await request('/drafts/1/publish', { revision: 1, reviewed: true })).status).toBe(200);
        expect(inserts.map(p => p[5])).toEqual([8, 9]); expect(inserts.every(p => p[4] === '')).toBe(true);
        expect((await (await request('/drafts/1/publish', { revision: 1, reviewed: true })).json()).alreadyPublished).toBe(true);
        expect(inserts).toHaveLength(2);
    });
    it('rolls back publication on partial failure and rejects private practice matrices', async () => {
        failInsert = true;
        expect((await request('/drafts/1/publish', { revision: 1, reviewed: true })).status).toBe(500);
        expect(rollbackCount).toBe(1); expect(commitCount).toBe(0); expect(rows[0].published_at).toBeNull(); expect(inserts).toEqual([]);
        rows[0].draft_json = JSON.stringify({ ...initial, blocks: [{ type: 'PRACTICE', title: 'Ôn tập', matrix_id: 6 }] }); publicMatrix = 0;
        expect((await request('/drafts/1/publish', { revision: 1, reviewed: true })).status).toBe(400);
        rows[0].created_by = 9;
        expect((await request('/drafts/1/publish', { revision: 1, reviewed: true })).status).toBe(404);
    });
});
