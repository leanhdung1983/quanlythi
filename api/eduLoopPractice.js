import { parseId6 } from './id6.js';

export function practiceScope(key) {
    const id = parseId6(key);
    if (id) return id;
    const form = typeof key === 'string' && key.match(/^(10|11|12|[0126789])-([DHC])-(\d+)-(\d+)-(\d+)$/i);
    if (!form) return null;
    const parsed = parseId6(`${form[1]}${form[2]}${form[3]}N${form[4]}-${form[5]}`);
    return parsed ? { ...parsed, level: null } : null;
}

export function practicePattern(scope) {
    const grade = Number(scope.grade) < 3 ? `(${scope.grade}|${Number(scope.grade) + 10})` : scope.grade;
    const levels = { N: '(N|Y)', H: '(H|B)', V: '(V|K)', C: '(C|G|T)' };
    return `(^|[^A-Z0-9])${grade}[[:space:]]*${scope.subject}[[:space:]]*0*${scope.chapter}[[:space:]]*${scope.level ? levels[scope.level] : '[NHVCYBKGT]'}[[:space:]]*0*${scope.unit}[[:space:]]*[-_][[:space:]]*0*${scope.count}($|[^A-Z0-9])`;
}

export function matchesPracticeScope(question, scope) {
    const id = parseId6(question.id_full || question.legacy_full_id);
    return !!id && id.grade === scope.grade && id.subject === scope.subject && id.chapter === scope.chapter
        && id.unit === scope.unit && id.count === scope.count && (!scope.level || id.level === scope.level);
}

export function buildPracticeCatalog(rows) {
    const forms = new Map();
    for (const row of rows) {
        const id = parseId6(row.id_full || row.legacy_full_id);
        if (!id || !['TN', 'TF', 'KQ'].includes(row.type)) continue;
        const key = `${id.grade}-${id.subject}-${id.chapter}-${id.unit}-${id.count}`;
        if (!forms.has(key)) forms.set(key, { key, grade: Number(id.grade) < 3 ? Number(id.grade) + 10 : Number(id.grade),
            subject: id.subject, chapter: id.chapter, unit: id.unit, count: id.count,
            unit_id: row.unit_id, chapter_name: row.chapter_name || `Chương ${id.chapter}`,
            unit_name: row.unit_name || `Bài ${id.unit}`, label: row.description || `Dạng ${id.count}`,
            available: 0, levels: {}, types: {} });
        const item = forms.get(key);
        const count = Number(row.question_count ?? 1);
        item.available += count;
        item.levels[id.level] = (item.levels[id.level] || 0) + count;
        item.types[row.type] = (item.types[row.type] || 0) + count;
    }
    return [...forms.values()].sort((a, b) => b.grade - a.grade || a.subject.localeCompare(b.subject) || a.chapter - b.chapter || a.unit - b.unit || a.count - b.count);
}

export const practiceCatalogSql = `SELECT q.legacy_full_id AS id_full, qt.code AS type, q.unit_id,
    MAX(m.description) AS description, MAX(u.name) AS unit_name, MAX(c.name) AS chapter_name,
    COUNT(*) AS question_count
    FROM questions q JOIN question_types qt ON qt.id = q.type_id
    LEFT JOIN id6_metadata m ON m.id_full = q.legacy_full_id
    LEFT JOIN units u ON u.id = q.unit_id LEFT JOIN chapters c ON c.id = u.chapter_id
    WHERE qt.code IN ('TN','TF','KQ') AND TRIM(COALESCE(q.content_latex,'')) <> ''
    GROUP BY q.legacy_full_id, qt.code, q.unit_id`;
