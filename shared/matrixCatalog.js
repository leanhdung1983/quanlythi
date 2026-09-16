export const MATRIX_PURPOSES = { PRACTICE: 'Luyện tập / chuyên đề', CHAPTER: 'Kiểm tra chương', MIDTERM: 'Giữa học kỳ', FINAL: 'Cuối học kỳ', GRADUATION: 'Ôn thi tốt nghiệp', OTHER: 'Khác', UNCLASSIFIED: 'Chưa phân loại' };
export const MATRIX_STATUSES = { DRAFT: 'Bản nháp', READY: 'Sẵn sàng sử dụng', ARCHIVED: 'Lưu trữ' };
export function parseMatrixData(value) {
    let result = value;
    for (let i = 0; i < 4 && typeof result === 'string'; i++) result = JSON.parse(result);
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Dữ liệu ma trận không hợp lệ.');
    return result;
}
export function normalizeGrade(value) {
    if (value === null || value === undefined || value === '') return null;
    const grade = Number(value);
    if ([0, 1, 2].includes(grade)) return grade + 10;
    return [6, 7, 8, 9, 10, 11, 12].includes(grade) ? grade : null;
}
export function editableMatrixSections(data) {
    const raw = data.matrix || data, result = { TN: {}, TF: {}, KQ: {}, TL: {} };
    for (const type of ['TN','TF','KQ','TL']) {
        const section = raw[type] || {};
        if (!Array.isArray(section)) { result[type] = { ...section }; continue; }
        result[type] = {};
        for (const item of section) {
            const grade = normalizeGrade(item.cls);
            if (grade === null || !item.sub || item.chap === undefined || item.unit === undefined) throw new Error('Một dòng ma trận cũ thiếu phạm vi kiến thức.');
            const key = `${grade >= 10 ? grade - 10 : grade}-${item.sub}-${item.chap}-${item.unit}-${item.count ?? 0}`;
            const levels = result[type][key] || { N: 0, H: 0, V: 0, C: 0 };
            for (const level of ['N','H','V','C']) levels[level] += Number(item.levels?.[level]) || 0;
            result[type][key] = levels;
        }
    }
    return result;
}
export function describeMatrix(row) {
    let data;
    try { data = parseMatrixData(row.matrix_data); } catch { return { grade: 'UNKNOWN', purpose: 'UNCLASSIFIED', status: 'DRAFT', term: '', year: '', grades: [], subjects: [], counts: { TN: 0, TF: 0, KQ: 0, TL: 0 }, total: 0, chapters: [], valid: false, duration: 0 }; }
    const grades = new Set(), subjects = new Set(), chapters = new Set();
    const counts = { TN: 0, TF: 0, KQ: 0, TL: 0 };
    const matrix = data.matrix || data;
    for (const type of Object.keys(counts)) {
        const section = matrix[type] || {};
        const items = Array.isArray(section) ? section : Object.entries(section).map(([key, levels]) => {
            const [cls, sub, chap, unit] = key.split('-'); return { cls, sub, chap, unit, levels };
        });
        for (const item of items) {
            const levels = item.levels || {};
            const count = ['N', 'H', 'V', 'C'].reduce((sum, level) => sum + Math.max(0, Number(levels[level]) || 0), 0);
            if (!count) continue;
            counts[type] += count;
            const grade = normalizeGrade(item.cls);
            if (grade !== null) grades.add(grade);
            if (item.sub) subjects.add(String(item.sub));
            if (item.chap !== undefined) chapters.add(`${grade ?? '?'}-${item.sub}-${item.chap}`);
        }
    }
    const catalog = data.catalog || {}, settings = data.settings || {};
    const explicit = normalizeGrade(catalog.target_grade ?? settings.grade_id);
    const grade = catalog.target_grade === 'MULTI' ? 'MULTI' : explicit !== null ? String(explicit) : grades.size > 1 ? 'MULTI' : grades.size === 1 ? String([...grades][0]) : String(normalizeGrade(row.grade_id) ?? 'UNKNOWN');
    return { grade, purpose: Object.hasOwn(MATRIX_PURPOSES, catalog.purpose) ? catalog.purpose : 'UNCLASSIFIED', status: Object.hasOwn(MATRIX_STATUSES, catalog.status) ? catalog.status : 'DRAFT',
        term: String(catalog.term || ''), year: String(catalog.year || ''), grades: [...grades].sort(), subjects: [...subjects].sort(), chapters: [...chapters].sort(), counts, total: Object.values(counts).reduce((a, b) => a + b, 0), valid: true, duration: Number(settings.duration) || 90 };
}
export function validateCatalog(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Thông tin phân loại không hợp lệ.');
    const result = {};
    if (input.target_grade !== undefined) {
        if (input.target_grade === 'MULTI') result.target_grade = 'MULTI';
        else { const g = normalizeGrade(input.target_grade); if (g === null) throw new Error('Khối lớp không hợp lệ.'); result.target_grade = g; }
    }
    if (input.purpose !== undefined) { if (!Object.hasOwn(MATRIX_PURPOSES, input.purpose)) throw new Error('Mục đích đề không hợp lệ.'); result.purpose = input.purpose; }
    if (input.status !== undefined) { if (!Object.hasOwn(MATRIX_STATUSES, input.status)) throw new Error('Trạng thái không hợp lệ.'); result.status = input.status; }
    if (input.term !== undefined) { if (!['', '1', '2', 'YEAR'].includes(input.term)) throw new Error('Học kỳ không hợp lệ.'); result.term = input.term; }
    if (input.year !== undefined) { if (input.year !== '' && !/^\d{4}-\d{4}$/.test(input.year)) throw new Error('Năm học cần dạng 2026-2027.'); if (input.year && Number(input.year.slice(5)) !== Number(input.year.slice(0, 4)) + 1) throw new Error('Năm học phải là hai năm liên tiếp.'); result.year = input.year; }
    return result;
}
