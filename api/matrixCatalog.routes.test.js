import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
let rows, pending, writes;
const original = { matrix: { TN: { '2-D-1-1-0': { N: 2 } } }, settings: { grade_id: 2, total_points_tn: 10, tf_scoring_mode: '10-25-50-100' } };
const conn = {
    beginTransaction: async () => { pending = []; }, rollback: vi.fn(async () => { pending = []; }),
    commit: async () => { for (const p of pending) { const row = rows.find(r => r.id === p[2]); row.matrix_data = p[0]; row.grade_id = p[1]; } }, release: vi.fn(),
    query: async (sql, params) => {
        if (sql.startsWith('SELECT')) return [rows.filter(r => params[0].includes(r.id))];
        pending.push(params); return [{ affectedRows: 1 }];
    }
};
vi.mock('./core.js', () => ({
    pool: { getConnection: async () => conn },
    query: async (sql, params) => { if (sql.startsWith('SELECT')) return rows; writes.push(params); return { insertId: 3 }; },
    isAdmin: req => req.user.role === 'ADMIN', isSelfOrAdmin: () => true, requireAdmin: () => false,
    requireTeacherOrAdmin: () => true, canManageMatrix: async () => true, canAccessExamResult: async () => true
}));
let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/exams.routes.js');
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { id: 1, role: 'TEACHER' }; next(); }); app.use('/api', router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}/api/saved-matrices`;
});
beforeEach(() => { rows = [{ id: 1, created_by: 1, grade_id: null, matrix_data: JSON.stringify(JSON.stringify(original)) }, { id: 2, created_by: 1, grade_id: null, matrix_data: { matrix: { TF: { '1-H-2-1-0': { H: 1 } } } } }]; writes = []; pending = []; conn.rollback.mockClear(); });
afterAll(() => server?.close());
const bulk = body => fetch(`${base}/catalog/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
describe('matrix library persistence and atomic classification', () => {
    it('filters legacy matrices by actual class without requiring a filled database grade column', async () => {
        const response = await fetch(`${base}?grade_id=12`);
        expect((await response.json()).data.map(r => r.id)).toEqual([1]);
    });
    it('normalizes double encoded data on save and persists audience class', async () => {
        const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Đề mẫu', matrix_data: JSON.stringify(JSON.stringify(original)) }) });
        expect(response.status).toBe(200); expect(JSON.parse(writes[0][1])).toEqual(original); expect(writes[0][2]).toBe(12);
    });
    it('classifies together while preserving IDs, matrix contents and scoring settings', async () => {
        expect((await bulk({ ids: [1,2], catalog: { purpose: 'FINAL', target_grade: 12 } })).status).toBe(200);
        const stored = JSON.parse(rows[0].matrix_data);
        expect(stored.matrix).toEqual(original.matrix); expect(stored.settings).toEqual(original.settings);
        expect(stored.catalog).toEqual({ purpose: 'FINAL', target_grade: 12 }); expect(rows.map(r => r.id)).toEqual([1,2]);
    });
    it('rejects other owners, missing rows and invalid classifications without updating any row', async () => {
        rows[1].created_by = 2; const before = JSON.stringify(rows);
        expect((await bulk({ ids: [1,2], catalog: { purpose: 'FINAL' } })).status).toBe(403);
        expect(JSON.stringify(rows)).toBe(before); expect(pending).toEqual([]);
        expect((await bulk({ ids: [99], catalog: { purpose: 'FINAL' } })).status).toBe(400);
        expect((await bulk({ ids: [1], catalog: { year: '2026-2028' } })).status).toBe(400);
    });
    it('rolls back earlier updates if a later legacy matrix cannot be parsed', async () => {
        rows[1].matrix_data = 'corrupt'; const before = JSON.stringify(rows);
        expect((await bulk({ ids: [1,2], catalog: { purpose: 'CHAPTER' } })).status).toBe(400);
        expect(JSON.stringify(rows)).toBe(before); expect(conn.rollback).toHaveBeenCalled();
    });
});
