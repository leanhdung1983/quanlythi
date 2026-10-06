import { describe, it, expect } from 'vitest';
import { LEARNING_GRADES, learningStorageGrade, normalizeLearningCatalog } from './learningGrades.js';
describe('school grades 6–12', () => {
    it('always offers exactly grades 6 through 12, even without lessons', () => {
        expect(LEARNING_GRADES).toEqual([6, 7, 8, 9, 10, 11, 12]);
    });
    it('maps old codes 0/1/2 to 10/11/12 without changing lesson IDs', () => {
        const rows = normalizeLearningCatalog([{ id: 7, grade_code: '0' }, { id: 8, grade_code: '1' }, { id: 9, grade_code: '2' }, { id: 10, grade_code: '11' }]);
        expect(rows.map(r => [r.id, r.grade_code])).toEqual([[7, '10'], [8, '11'], [10, '11'], [9, '12']]);
    });
    it('excludes grades outside the school range without mutating input', () => {
        const rows = [{ grade_code: '5' }, { grade_code: '6' }, { grade_code: '9' }, { grade_code: '13' }];
        expect(normalizeLearningCatalog(rows).map(r => r.grade_code)).toEqual(['6', '9']);
        expect(rows).toHaveLength(4);
    });
    it('reuses ID6 grade storage codes to avoid duplicate grade records', () => {
        expect([6, 7, 8, 9, 10, 11, 12, '1', '11'].map(learningStorageGrade)).toEqual(['6', '7', '8', '9', '0', '1', '2', '1', '1']);
        expect([5, 13, '', null, undefined].map(learningStorageGrade)).toEqual([null, null, null, null, null]);
    });
});
