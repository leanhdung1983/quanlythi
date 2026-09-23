import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let calls = [];
vi.mock('./core.js', () => ({
    pool: { query: vi.fn(async (sql, params) => { calls.push({ sql, params }); return [[]]; }) },
    requireAdmin: () => true, sanitizeSvg: value => value, generateHash: () => 'hash', clearCache: vi.fn(),
}));

let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/tikz.routes.js');
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { id: 1, role: 'ADMIN' }; next(); }); app.use('/api', router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}/api/admin/tikz-audit`;
});
beforeEach(() => { calls = []; });
afterAll(() => server?.close());

describe('TikZ audit candidate filtering', () => {
    it('filters ordinary ID6 questions at database level', async () => {
        expect((await fetch(base)).status).toBe(200);
        expect(calls[0].sql).toContain("LOCATE('tikzpicture'");
        expect(calls[0].sql).toContain("LOCATE('[TIKZ_HASH:'");
        expect(calls[0].sql).not.toContain('is_tikz_rendered <> 1');
    });
    it('worker mode requests only drawings that still need rendering', async () => {
        expect((await fetch(`${base}?actionable=1&afterId=10&limit=25`)).status).toBe(200);
        expect(calls[0].sql).toContain('is_tikz_rendered <> 1');
        expect(calls[0].params).toEqual([10, 26]);
    });
});
