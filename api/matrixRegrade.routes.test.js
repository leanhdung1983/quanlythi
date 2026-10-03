import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const question = { id: 42, type: 'TN', options: [{ id: 'A', isCorrect: false }, { id: 'B', isCorrect: true }] };
let matrix;
let result;
let committed;
let failRegrade;
const conn = {
    beginTransaction: vi.fn(async () => {}),
    rollback: vi.fn(async () => {}),
    commit: vi.fn(async () => { committed = true; }),
    release: vi.fn(),
    query: vi.fn(async (sql, params) => {
        if (sql.startsWith('SELECT created_by')) return [[matrix]];
        if (sql.startsWith('UPDATE matrix_templates')) return [{ affectedRows: 1 }];
        if (sql.startsWith('SELECT id,result_detail')) return [[result]];
        if (sql.startsWith('UPDATE exam_results')) {
            if (failRegrade) throw new Error('Regrade update failed');
            result.score = params[0]; result.result_detail = params[1]; return [{ affectedRows: 1 }];
        }
        throw new Error(`Unexpected SQL: ${sql}`);
    }),
};

vi.mock('./core.js', () => ({
    pool: { getConnection: async () => conn }, query: vi.fn(),
    isAdmin: () => false, isSelfOrAdmin: () => true, requireAdmin: () => false,
    requireTeacherOrAdmin: () => true, canManageMatrix: async () => true, canAccessExamResult: async () => true,
}));

let server;
let base;
beforeAll(async () => {
    const { default: router } = await import('./routes/exams.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, role: 'TEACHER' }; next(); });
    app.use('/api', router);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}/api/saved-matrices/5`;
});
afterAll(() => server?.close());
beforeEach(() => {
    matrix = { created_by: 1, is_public: 0, grade_id: 12, matrix_data: JSON.stringify({ matrix: { TN: {} }, settings: { total_points_tn: 10 } }) };
    result = {
        id: 9, score: 10,
        result_detail: JSON.stringify({ questions: [question], answers: { 42: 'B' }, scoring_settings: { total_points_tn: 10 } }),
    };
    committed = false;
    failRegrade = false;
    vi.clearAllMocks();
});

describe('matrix score changes', () => {
    it('atomically regrades completed submissions and stores the new rubric snapshot', async () => {
        const matrixData = { matrix: { TN: {} }, settings: { total_points_tn: 4, total_points_tf: 3, total_points_kq: 3 } };
        const response = await fetch(base, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Ma trận mới', matrix_data: matrixData }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ success: true, regraded: 1, skipped: 0 });
        expect(result.score).toBe(4);
        expect(JSON.parse(result.result_detail).answers).toEqual({ 42: 'B' });
        expect(JSON.parse(result.result_detail).scoring_settings).toEqual(matrixData.settings);
        expect(committed).toBe(true);
    });
    it('repairs a stale submission when resaving an unchanged rubric', async () => {
        const detail = JSON.parse(result.result_detail);
        detail.scoring_settings = { total_points_tn: 4 };
        result.result_detail = JSON.stringify(detail);
        result.score = 4;
        const response = await fetch(base, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Ma trận', matrix_data: JSON.parse(matrix.matrix_data) }),
        });
        expect(await response.json()).toMatchObject({ success: true, regraded: 1 });
        expect(result.score).toBe(10);
    });
    it('rolls back a rubric edit when saving a regraded score fails', async () => {
        failRegrade = true;
        const response = await fetch(base, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Ma trận', matrix_data: { settings: { total_points_tn: 4 } } }),
        });
        expect(response.status).toBe(500);
        expect(committed).toBe(false);
        expect(conn.rollback).toHaveBeenCalledOnce();
    });
});
