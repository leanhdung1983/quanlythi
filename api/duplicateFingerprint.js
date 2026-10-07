import { createHash } from 'node:crypto';
import { formatQuestionLayout } from './id6.js';

export const DUPLICATE_HASH_VERSION = 1;
export const pendingDuplicateSql = '(is_duplicate_checked = FALSE OR content_hash IS NULL OR COALESCE(duplicate_hash_version, 0) <> 1)';

// Preserve case, grouping and answer markers. Only discard comments and layout.
export function canonicalDuplicateSource(source = '') {
    const uncommented = String(source).split(/\r?\n/).map(line => {
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== '%') continue;
            let slashes = 0;
            for (let j = i - 1; j >= 0 && line[j] === '\\'; j--) slashes++;
            if (slashes % 2 === 0) return line.slice(0, i);
        }
        return line;
    }).join('\n');
    return formatQuestionLayout(uncommented, { fillEmptySolution: false })
        .replace(/\\(?:begin|end)\s*\{ex\}/g, '')
        .replace(/\s+/g, ' ').trim();
}

export const duplicateFingerprint = source => createHash('sha256').update(canonicalDuplicateSource(source)).digest('hex');

export async function updateDuplicateFingerprint(runner, row) {
    const hash = duplicateFingerprint(row.content_latex_original || row.content_latex || '');
    const result = await runner(`UPDATE questions SET content_hash = ?, is_duplicate_checked = TRUE, duplicate_hash_version = ?
        WHERE id = ? AND content_latex <=> ? AND content_latex_original <=> ?`,
        [hash, DUPLICATE_HASH_VERSION, row.id, row.content_latex, row.content_latex_original ?? null]);
    return Number(result.affectedRows || 0);
}

export function groupExactDuplicates(rows) {
    const groups = new Map();
    for (const row of rows) {
        const source = row.original_latex || row.raw_latex || '';
        if (!canonicalDuplicateSource(source)) continue;
        const hash = duplicateFingerprint(source);
        if (!groups.has(hash)) groups.set(hash, []);
        groups.get(hash).push(row);
    }
    return [...groups.values()].filter(group => group.length > 1);
}

export async function resolveDuplicateGroups(conn, groups) {
    if (!Array.isArray(groups) || groups.length < 1 || groups.length > 500) {
        const error = new Error('Danh sách nhóm trùng lặp không hợp lệ.'); error.status = 400; throw error;
    }
    const seen = new Set(), deleteIds = [];
    for (const group of groups) {
        if (!group || !Array.isArray(group.ids) || group.ids.length < 2 || !group.ids.includes(group.keepId)
            || group.ids.some(id => !Number.isSafeInteger(id) || id <= 0 || seen.has(id))) {
            const error = new Error('Mỗi nhóm cần một câu giữ lại và các ID riêng biệt.'); error.status = 400; throw error;
        }
        for (const id of group.ids) {
            if (seen.has(id)) { const error = new Error('ID câu hỏi bị lặp.'); error.status = 400; throw error; }
            seen.add(id);
            if (id !== group.keepId) deleteIds.push(id);
        }
    }
    const [rows] = await conn.query('SELECT id, content_latex, content_latex_original FROM questions WHERE id IN (?) FOR UPDATE', [[...seen]]);
    const byId = new Map(rows.map(row => [row.id, row]));
    for (const group of groups) {
        const signatures = group.ids.map(id => {
            const row = byId.get(id);
            return row ? canonicalDuplicateSource(row.content_latex_original || row.content_latex || '') : null;
        });
        if (!signatures[0] || signatures.some(value => value !== signatures[0])) {
            const error = new Error('Câu hỏi đã thay đổi hoặc không còn trùng nhau. Hãy quét lại trước khi xử lý.');
            error.status = 409; throw error;
        }
    }
    const [result] = await conn.query('DELETE FROM questions WHERE id IN (?)', [deleteIds]);
    return Number(result.affectedRows || 0);
}
