import { describe, it, expect, vi } from 'vitest';
import { assignmentInput, assignClasses } from './classAssignments.js';
const body = { class_ids: [2, 1, 2], matrix_id: 7, max_attempts: 3, allow_review: false };
function database({ foreign = false, missing = false, privateMatrix = false, crash = false } = {}) {
    const pending = [], committed = [];
    const conn = { beginTransaction: vi.fn(), commit: vi.fn(async () => committed.push(...pending)), rollback: vi.fn(async () => { pending.length = 0; }), release: vi.fn(), query: vi.fn(async (sql, values) => {
        if (sql.includes('FROM classes')) return [[{ id: 1, teacher_id: foreign ? 9 : 4 }, ...missing ? [] : [{ id: 2, teacher_id: 4 }]]];
        if (sql.includes('FROM matrix_templates')) return [[{ created_by: privateMatrix ? 9 : 4, is_public: 0 }]];
        if (sql.includes('FROM class_assignments')) return [values[0] === 2 ? [{ id: 10 }] : []];
        if (crash) throw new Error('database unavailable');
        pending.push(values); return [{}];
    }) };
    return { pool: { getConnection: async () => conn }, conn, committed };
}
describe('multi-class assignments', () => {
    it('deduplicates and sorts targets', () => expect(assignmentInput(body).ids).toEqual([1, 2]));
    it.each([{ class_ids: [] }, { class_ids: [0] }, { matrix_id: -1 }, { max_attempts: 1.5 }, { max_attempts: -1 }, { open_time: 'invalid' }, { open_time: '2026-10-02', deadline: '2026-10-01' }, { allow_review: 'false' }])('rejects invalid input %j', patch => expect(() => assignmentInput({ ...body, ...patch })).toThrow());
    it('assigns new targets and preserves existing assignment settings', async () => {
        const db = database();
        expect(await assignClasses(db.pool, { id: 4, role: 'TEACHER' }, body)).toEqual({ assigned: [1], skipped: [2] });
        expect(db.committed).toEqual([[1, 7, null, null, 3, 0]]);
        expect(db.conn.query.mock.calls[0][0]).toContain('ORDER BY id FOR UPDATE');
        expect(db.conn.release).toHaveBeenCalled();
    });
    it.each([{ foreign: true }, { missing: true }, { privateMatrix: true }, { crash: true }])('rolls back whole batch on failure %j', async options => {
        const db = database(options);
        await expect(assignClasses(db.pool, { id: 4, role: 'TEACHER' }, body)).rejects.toThrow();
        expect(db.committed).toEqual([]); expect(db.conn.rollback).toHaveBeenCalled(); expect(db.conn.release).toHaveBeenCalled();
    });
    it('rejects student accounts before acquiring a connection', async () => {
        const pool = { getConnection: vi.fn() };
        await expect(assignClasses(pool, { id: 4, role: 'STUDENT' }, body)).rejects.toThrow();
        expect(pool.getConnection).not.toHaveBeenCalled();
    });
});
