import express from 'express';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

const { conn, clearCache, query } = vi.hoisted(() => ({
    conn: { query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
    clearCache: vi.fn(),
    query: vi.fn(),
}));
vi.mock('./core.js', () => ({
    pool: { getConnection: async () => conn }, query,
    isAdmin: () => true, requireAdmin: () => true, requireTeacherOrAdmin: () => true,
    canManageQuestion: async () => true, generateHash: () => 'hash', normalizeLatex: x => x,
    sanitizeSvg: x => x, resolveHierarchyIds: vi.fn(), getGradeDigitSQL: () => '0',
    cacheMiddleware: () => (_req, _res, next) => next(), clearCache,
}));
const old = '\\choice{\\True one}{two}{three}{four}';
const latest = '\\choice{one}{\\True two}{three}{four}';
let server, base, failUpdate;
beforeAll(async () => {
    const { default: router } = await import('./routes/questions.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, role: 'ADMIN' }; next(); });
    app.use(router);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());
beforeEach(() => {
    vi.clearAllMocks();
    failUpdate = false;
    conn.query.mockImplementation(async sql => {
        if (sql.startsWith('SELECT * FROM questions')) return [[{ id: 42, content_latex: old, content_latex_original: old }]];
        if (sql.startsWith('SELECT id,matrix_id')) return [[{
            id: 7, matrix_id: 5, status: 'COMPLETED', score: 0,
            result_detail: JSON.stringify({
                questions: [{ id: 42, type: 'TN', original_latex: old,
                    options: ['one', 'two', 'three', 'four'].map((content, i) => ({ id: 'ABCD'[i], content, originalIndex: i, isCorrect: i === 0 })) }],
                answers: { 42: 'B' }, scoring_settings: { total_points_tn: 10 },
            }),
        }]];
        if (sql.startsWith('UPDATE exam_results') && failUpdate) throw new Error('Failed to save regrade');
        return [{ affectedRows: 1 }];
    });
});
it.each([
    ['/questions/42', 'PUT', { raw_latex: latest }],
    ['/questions/batch-update', 'POST', { updates: [{ id: 42, raw_latex: latest }] }],
])('regrades before committing the question edit at %s', async (path, method, body) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect(await response.json()).toMatchObject({ success: true, regraded: 1, skipped: 0 });
    const update = conn.query.mock.calls.find(([sql]) => sql.startsWith('UPDATE exam_results'));
    expect(update[1][0]).toBe(10);
    expect(JSON.parse(update[1][1]).answers).toEqual({ 42: 'B' });
    expect(conn.commit).toHaveBeenCalledOnce();
    expect(conn.query.mock.invocationCallOrder[conn.query.mock.calls.indexOf(update)]).toBeLessThan(conn.commit.mock.invocationCallOrder[0]);
});
it('rolls back the question edit when saving a regraded result fails', async () => {
    failUpdate = true;
    const response = await fetch(base + '/questions/42', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ raw_latex: latest }) });
    expect(response.status).toBe(500);
    expect(conn.rollback).toHaveBeenCalledOnce();
    expect(conn.commit).not.toHaveBeenCalled();
    expect(clearCache).not.toHaveBeenCalled();
});
it('previews the original answer-bearing source and saves exactly that formatted layout', async () => {
    const source = '\\begin{ex}%[2D1H3-4]%Câu 3\nQuestion \\choice{\\True one}{two}{three}{four} \\loigiai{ }\\end{ex}';
    const row = { id: 42, created_by: 1, legacy_full_id: '2D1H3-4',
        content_latex: 'Rendered display without answer markers', content_latex_original: source };
    query.mockResolvedValue([row]);
    const previewResponse = await fetch(base + '/questions/normalize/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [42] }),
    });
    const { data } = await previewResponse.json();
    expect(data[0].before).toBe(source);
    expect(data[0].after).toContain('\\choice\n{\\True one}\n{two}\n{three}\n{four}');
    expect(data[0].after).toContain('\\loigiai{\nnội dung lời giải\n}');
    conn.query.mockImplementation(async sql => {
        if (sql.includes('FROM id6_metadata')) return [[{ id_full: '2D1H3-4', unit_id: 1, level_id: 2 }]];
        if (sql.startsWith('SELECT * FROM questions')) return [[row]];
        return [{ affectedRows: 1 }];
    });
    const saveResponse = await fetch(base + '/questions/review/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: [{ id: 42, id_full: data[0].id_full, content_latex: data[0].after, change_type: 'SOURCE_NORMALIZATION' }] }),
    });
    expect(saveResponse.status).toBe(200);
    expect(conn.query.mock.calls.find(([sql]) => sql.startsWith('UPDATE questions SET legacy_full_id'))[1][1]).toBe(data[0].after);
    expect(conn.query.mock.calls.find(([sql]) => sql.startsWith('UPDATE questions SET content_latex_original'))[1][0]).toBe(data[0].after);
});
