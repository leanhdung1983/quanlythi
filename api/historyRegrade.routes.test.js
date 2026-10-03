import express from 'express';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('./core.js', () => ({
    query, pool: {}, isAdmin: () => true, isSelfOrAdmin: () => true,
    requireAdmin: () => true, requireTeacherOrAdmin: () => true,
    canManageMatrix: async () => true, canAccessExamResult: async () => true,
}));
let server, base, result, settings;
beforeAll(async () => {
    const { default: router } = await import('./routes/exams.routes.js');
    const app = express();
    app.use((req, _res, next) => { req.user = { id: 1, role: 'ADMIN' }; next(); });
    app.use(router);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());
beforeEach(() => {
    settings = { total_points_tn: 10 };
    result = { id: 9, matrix_id: 5, status: 'COMPLETED', score: 4.94,
        result_detail: JSON.stringify({
            questions: [{ id: 42, type: 'TN', options: [{ id: 'B', isCorrect: true }] }],
            answers: { 42: 'B' }, scoring_settings: { total_points_tn: 4.94 },
        }),
    };
    query.mockReset();
    query.mockImplementation(async sql => {
        if (sql.startsWith('SELECT matrix_data')) return [{ matrix_data: JSON.stringify({ settings }) }];
        if (sql.startsWith('UPDATE exam_results')) return { affectedRows: 1 };
        return [{ ...result }];
    });
});
it.each(['/exam-results/history/1', '/exam-results/all-history', '/exam-results/9'])(
    'repairs stale stored scores when loading %s', async path => {
        const response = await fetch(base + path);
        expect(response.status).toBe(200);
        const { data } = await response.json();
        const row = Array.isArray(data) ? data[0] : data;
        expect(row.score).toBe(10);
        expect(JSON.parse(row.result_detail).scoring_settings).toEqual(settings);
        expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE exam_results'))).toBe(true);
    }
);
it('preserves teacher score overrides when the rubric has not changed', async () => {
    settings = { total_points_tn: 4.94 };
    result.score = 7;
    const { data } = await (await fetch(base + '/exam-results/9')).json();
    expect(data.score).toBe(7);
    expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE exam_results'))).toBe(false);
});
