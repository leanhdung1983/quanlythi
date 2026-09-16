import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let status = 'DRAFT';
let usageUpdates = 0;
const conn = {
    beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(),
    query: vi.fn(async sql => {
        if (sql.includes('SELECT id,question_id,status')) return [[{ id: 1, question_id: 42, status }]];
        if (sql.includes("status='POSTED'")) { status = 'POSTED'; return [{ affectedRows: 1 }]; }
        if (sql.includes('used_count=used_count+1')) { usageUpdates++; return [{ affectedRows: 1 }]; }
        return [[]];
    })
};
vi.mock('./core.js', () => ({ pool: { getConnection: async () => conn },
    query: vi.fn(), requireAdmin: () => true, initDbPromise: Promise.resolve() }));

let server;
let baseUrl;
beforeAll(async () => {
    const { default: router } = await import('./routes/social.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, role: 'ADMIN' }; next(); });
    app.use('/api', router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());

describe('manual post confirmation', () => {
    it('increments the usage count only once after repeated confirmation', async () => {
        const first = await fetch(`${baseUrl}/api/admin/social/queue/1/mark-posted`, { method: 'POST' });
        expect(first.status).toBe(200);
        const second = await fetch(`${baseUrl}/api/admin/social/queue/1/mark-posted`, { method: 'POST' });
        expect((await second.json()).alreadyPosted).toBe(true);
        expect(usageUpdates).toBe(1);
    });
});
