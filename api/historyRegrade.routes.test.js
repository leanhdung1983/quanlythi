import express from 'express';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('./core.js', () => ({
    query, pool: {}, isAdmin: () => true, isSelfOrAdmin: () => true,
    requireAdmin: () => true, requireTeacherOrAdmin: () => true,
    canManageMatrix: async () => true, canAccessExamResult: async () => true,
    canManageClass: async () => true, canAccessClass: async () => true,
}));
let server, base, result, settings, bankQuestion, role;
beforeAll(async () => {
    const { default: router } = await import('./routes/exams.routes.js');
    const { default: classes } = await import('./routes/classes.routes.js');
    const app = express();
    app.use((req, _res, next) => { req.user = { id: 1, role }; next(); });
    app.use(router);
    app.use(classes);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());
beforeEach(() => {
    settings = { total_points_tn: 10 };
    role = 'ADMIN';
    bankQuestion = null;
    result = { id: 9, matrix_id: 5, status: 'COMPLETED', score: 4.94,
        result_detail: JSON.stringify({
            questions: [{ id: 42, type: 'TN', options: [{ id: 'B', isCorrect: true }] }],
            answers: { 42: 'B' }, scoring_settings: { total_points_tn: 4.94 },
        }),
    };
    query.mockReset();
    query.mockImplementation(async sql => {
        if (sql.startsWith('SELECT id,content_latex')) return bankQuestion ? [bankQuestion] : [];
        if (sql.includes('SELECT ca.allow_review')) return [{ allow_review: 0 }];
        if (sql.startsWith('SELECT matrix_data')) return [{ matrix_data: JSON.stringify({ settings }) }];
        if (sql.startsWith('UPDATE exam_results')) return { affectedRows: 1 };
        if (sql.includes('er.last_updated as submit_time')) return [{ ...result, id: undefined, attempt_id: result.id, student_id: 1 }];
        return [{ ...result }];
    });
});
it.each(['/exam-results/history/1', '/exam-results/all-history', '/exam-results/9', '/online-exam/results/5'])(
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
it('returns synchronized class scores without exposing detailed answer keys', async () => {
    const { data } = await (await fetch(base + '/classes/1/scores')).json();
    expect(data[0].score).toBe(10);
    expect(data[0].attempt_index).toBe(1);
    expect(data[0].result_detail).toBeUndefined();
});
it('preserves teacher score overrides when the rubric has not changed', async () => {
    settings = { total_points_tn: 4.94 };
    result.score = 7;
    const { data } = await (await fetch(base + '/exam-results/9')).json();
    expect(data.score).toBe(7);
    expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE exam_results'))).toBe(false);
});
it('repairs an old answer-key snapshot even when the rubric did not change', async () => {
    settings = { total_points_tn: 10 };
    const old = '\\choice{\\True one}{two}{three}{four}';
    result.score = 0;
    result.result_detail = JSON.stringify({
        questions: [{ id: 42, type: 'TN', original_latex: old,
            options: ['one', 'two', 'three', 'four'].map((content, i) => ({ id: 'ABCD'[i], content, originalIndex: i, isCorrect: i === 0 })) }],
        answers: { 42: 'B' }, scoring_settings: settings,
    });
    bankQuestion = { id: 42, content_latex: '\\choice{one}{\\True two}{three}{four}' };
    const { data } = await (await fetch(base + '/exam-results/9')).json();
    expect(data.score).toBe(10);
    expect(JSON.parse(data.result_detail).questions[0].options[1].isCorrect).toBe(true);
});
it('does not expose audit answer keys in locked student review', async () => {
    role = 'STUDENT';
    const { data } = await (await fetch(base + '/exam-results/9')).json();
    expect(data.review_locked).toBe(true);
    expect(data.result_detail.submitted_questions).toBeUndefined();
    expect(data.result_detail.questions[0].options.every(o => o.isCorrect === false)).toBe(true);
});
it('serializes native JSON column values for the concurrent-update guard', async () => {
    result.result_detail = JSON.parse(result.result_detail);
    const response = await fetch(base + '/exam-results/9');
    expect(response.status).toBe(200);
    const update = query.mock.calls.find(([sql]) => sql.startsWith('UPDATE exam_results'));
    expect(update[0]).toContain("JSON_EXTRACT(?, '$')");
    expect(JSON.parse(update[1][4])).toEqual(result.result_detail);
});
