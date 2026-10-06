import { normalizeGrade } from './matrixCatalog.js';

// Display actual school grades; keep existing ID6/storage codes unchanged.
export const LEARNING_GRADES = Object.freeze([6, 7, 8, 9, 10, 11, 12]);
export const learningGrade = value => normalizeGrade(value);
export function learningStorageGrade(value) {
    const grade = learningGrade(value);
    return grade === null ? null : String(grade >= 10 ? grade - 10 : grade);
}
export function normalizeLearningCatalog(rows) {
    return rows.flatMap(row => {
        const grade = learningGrade(row.grade_code);
        return grade === null ? [] : [{ ...row, grade_code: String(grade) }];
    }).sort((a, b) => Number(a.grade_code) - Number(b.grade_code)
        || String(a.subject_code || '').localeCompare(String(b.subject_code || ''))
        || Number(a.chapter_number || 0) - Number(b.chapter_number || 0)
        || Number(a.unit_number || 0) - Number(b.unit_number || 0)
        || Number(a.id || 0) - Number(b.id || 0));
}
