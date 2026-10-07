import { describe, expect, it, vi } from 'vitest';
import { normalizeQuestionBatch, sourceLayoutHash, SOURCE_LAYOUT_VERSION } from './questionNormalization.js';
import { normalizeQuestionSource } from './id6.js';

const source = '\\begin{ex}%[2H5V3-3]%Câu 3\nQuestion \\choiceTF{\\True one}{two}{\\True three}{four} \\loigiai{ }\\end{ex}';
const canonical = normalizeQuestionSource(source, '2H5V3-3', { formatLayout: true }).source;

function database(size = 125) {
    const rows = Array.from({ length: size }, (_, i) => ({ id: i + 1, created_by: i % 2 + 1,
        legacy_full_id: '2H5V3-3', content_latex: source, content_latex_original: null,
        layout_normalization_version: 0, layout_normalization_hash: null }));
    const pending = (r, cursor, owner) => r.id > cursor && (!owner || r.created_by === owner)
        && (r.layout_normalization_version !== SOURCE_LAYOUT_VERSION || r.layout_normalization_hash !== sourceLayoutHash(r.content_latex_original || r.content_latex));
    const conn = { query: vi.fn(async (sql, args) => {
        const owner = sql.includes('AND created_by = ?') ? args[1] : null;
        if (sql.startsWith('SELECT id,')) return [rows.filter(r => pending(r, args[0], owner)).slice(0, args.at(-1)).map(r => ({ ...r }))];
        if (sql.startsWith('SELECT COUNT')) return [[{ count: rows.filter(r => pending(r, args[0], owner)).length }]];
        if (sql.startsWith('INSERT')) return [{ affectedRows: 1 }];
        const row = rows.find(r => r.id === args.at(-1));
        if (sql.includes('SET content_latex =')) {
            row.content_latex = args[0]; row.content_latex_original = args[1];
            row.layout_normalization_version = args[4]; row.layout_normalization_hash = args[5];
        } else { row.layout_normalization_version = args[0]; row.layout_normalization_hash = args[1]; }
        return [{ affectedRows: 1 }];
    }) };
    return { conn, rows };
}

describe('database-wide source normalization', () => {
    it('processes all database rows across batches, independently of loaded UI questions', async () => {
        const { conn, rows } = database();
        let cursor = 0, changed = 0, batches = 0, done = false;
        while (!done) {
            const result = await normalizeQuestionBatch(conn, { cursor, userId: 1, isAdmin: true });
            changed += result.changed; cursor = result.cursor; done = result.done; batches++;
        }
        expect(changed).toBe(125);
        expect(batches).toBe(3);
        expect(rows.every(r => r.content_latex === canonical)).toBe(true);
        expect(rows.every(r => r.layout_normalization_hash === sourceLayoutHash(canonical))).toBe(true);
        expect(rows[0].content_latex).toContain('\\True one');
    });
    it('skips completed rows and revisits only sources edited later', async () => {
        const { conn, rows } = database(3);
        await normalizeQuestionBatch(conn, { userId: 1, isAdmin: true });
        expect((await normalizeQuestionBatch(conn, { userId: 1, isAdmin: true })).scanned).toBe(0);
        rows[1].content_latex_original = source + ' ';
        const result = await normalizeQuestionBatch(conn, { userId: 1, isAdmin: true });
        expect(result.scanned).toBe(1);
        expect(result.changed).toBe(1);
    });
    it('marks already canonical sources without rewriting or adding revisions', async () => {
        const { conn, rows } = database(1);
        rows[0].content_latex = canonical;
        const result = await normalizeQuestionBatch(conn, { userId: 1, isAdmin: true });
        expect(result.unchanged).toBe(1);
        expect(conn.query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(false);
    });
    it('restricts teachers to their own questions and resumes safely after a partial run', async () => {
        const { conn, rows } = database(125);
        await normalizeQuestionBatch(conn, { userId: 1 });
        const result = await normalizeQuestionBatch(conn, { userId: 1 });
        expect(result.scanned).toBe(13);
        expect(result.done).toBe(true);
        expect(rows.filter(r => r.created_by === 2).every(r => r.layout_normalization_version === 0)).toBe(true);
    });
    it('reports empty sources without falsely marking them normalized', async () => {
        const { conn, rows } = database(1);
        rows[0].content_latex = '';
        const result = await normalizeQuestionBatch(conn, { userId: 1, isAdmin: true });
        expect(result.failures).toEqual([{ id: 1, reason: 'Câu hỏi chưa có mã nguồn.' }]);
        expect(rows[0].layout_normalization_version).toBe(0);
        expect(result.done).toBe(true);
    });
});
