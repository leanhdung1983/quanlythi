import { createHash } from 'node:crypto';
import { normalizeId6, normalizeQuestionSource } from './id6.js';
import { answerKeySignature } from './examRegrade.js';

export const SOURCE_LAYOUT_VERSION = 1;
export const sourceLayoutHash = source => createHash('sha256').update(source || '', 'utf8').digest('hex');
export const pendingSourceLayoutSql = `(COALESCE(layout_normalization_version, 0) <> ${SOURCE_LAYOUT_VERSION}
    OR layout_normalization_hash IS NULL
    OR layout_normalization_hash <> SHA2(COALESCE(NULLIF(content_latex_original, ''), content_latex, ''), 256))`;

export async function normalizeQuestionBatch(conn, { cursor = 0, limit = 50, userId, isAdmin = false }) {
    const ownership = isAdmin ? '' : ' AND created_by = ?';
    const params = isAdmin ? [cursor, limit] : [cursor, userId, limit];
    const [rows] = await conn.query(`SELECT id,legacy_full_id,content_latex,content_latex_original,unit_id,level_id,type_id
        FROM questions WHERE id > ? AND ${pendingSourceLayoutSql}${ownership} ORDER BY id LIMIT ? FOR UPDATE`, params);
    let changed = 0, unchanged = 0;
    const failures = [];
    for (const row of rows) {
        const source = row.content_latex_original || row.content_latex || '';
        if (!source.trim()) { failures.push({ id: row.id, reason: 'Câu hỏi chưa có mã nguồn.' }); continue; }
        const normalized = normalizeQuestionSource(source, normalizeId6(row.legacy_full_id), { formatLayout: true }).source;
        if (answerKeySignature(source) !== answerKeySignature(normalized)) {
            failures.push({ id: row.id, reason: 'Không thể bảo toàn đáp án; cần kiểm tra câu hỏi.' });
            continue;
        }
        if (normalized !== source) {
            await conn.query(`INSERT INTO question_revisions
                (question_id,content_latex,legacy_full_id,unit_id,level_id,type_id,change_type,changed_by)
                VALUES (?,?,?,?,?,?,'SOURCE_NORMALIZATION',?)`,
                [row.id, source, row.legacy_full_id, row.unit_id, row.level_id, row.type_id, userId]);
            const renderStatus = /\\begin\s*\{\s*(?:tikzpicture|tkz-tab|tkz-euclide)\s*\}/i.test(normalized) ? 0 : 2;
            await conn.query(`UPDATE questions SET content_latex = ?, content_latex_original = ?, content_hash = ?,
                is_tikz_rendered = ?, is_duplicate_checked = FALSE, layout_normalization_version = ?, layout_normalization_hash = ? WHERE id = ?`,
                [normalized, normalized, sourceLayoutHash(normalized), renderStatus, SOURCE_LAYOUT_VERSION, sourceLayoutHash(normalized), row.id]);
            changed++;
        } else {
            await conn.query('UPDATE questions SET layout_normalization_version = ?, layout_normalization_hash = ? WHERE id = ?',
                [SOURCE_LAYOUT_VERSION, sourceLayoutHash(source), row.id]);
            unchanged++;
        }
    }
    const nextCursor = rows.length ? Number(rows[rows.length - 1].id) : cursor;
    const countParams = isAdmin ? [nextCursor] : [nextCursor, userId];
    const [[remaining]] = await conn.query(`SELECT COUNT(*) AS count FROM questions
        WHERE id > ? AND ${pendingSourceLayoutSql}${ownership}`, countParams);
    return { cursor: nextCursor, scanned: rows.length, changed, unchanged, failures,
        remaining: Number(remaining.count), done: Number(remaining.count) === 0 };
}
