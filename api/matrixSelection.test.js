import { describe, it, expect } from 'vitest';
import { selectLessonQuestions } from './matrixSelection.js';
import { lessonMatrixInventory } from './lessonMatrix.js';

const req = { cls: 12, sub: 'D', chap: 1, unit: 1, lvl: 'N', qType: 'TN', quantity: 3 };
const rows = [1, 1, 1, 2, 3].map((form, i) => ({ id: i + 1, id_full: `2D1N1-${form}`, type_code: 'TN' }));
describe('random lesson matrices', () => {
    it('takes distinct forms before repeating and never repeats question IDs', () => {
        const selected = selectLessonQuestions(rows, req, new Set(), () => 0.5);
        expect(new Set(selected.map(r => r.id_full)).size).toBe(3);
        expect(new Set(selectLessonQuestions(rows, { ...req, quantity: 5 }).map(r => r.id)).size).toBe(5);
    });
    it('keeps lesson, level, subject, grade and question type boundaries', () => {
        const unrelated = ['2D1N2-4', '2D1H1-4', '2H1N1-4', '1D1N1-4', '2D2N1-4'].map((id_full, i) => ({ id: 100+i, id_full, type_code: 'TN' }));
        const selected = selectLessonQuestions([...rows, ...unrelated, { id: 200, id_full: '2D1N1-5', type_code: 'TF' }], { ...req, quantity: 5 });
        expect(selected.every(r => r.id < 100)).toBe(true);
        expect(() => selectLessonQuestions(rows, { ...req, quantity: 6 })).toThrow('không lấy câu từ bài khác');
    });
    it('excludes already used questions and supports padded legacy ID6', () => {
        expect(selectLessonQuestions([{ id: 9, id_full: '12D01N01-04', type_code: 'TN' }], { ...req, quantity: 1 })[0].id).toBe(9);
        expect(() => selectLessonQuestions(rows, { ...req, quantity: 5 }, new Set([1]))).toThrow();
    });
    it('aggregates AI inventory by lesson without fixing forms', () => {
        expect(lessonMatrixInventory(rows.map(r => ({ legacy_full_id: r.id_full, type: r.type_code })), true)).toEqual([{ key: '2-D-1-1-*', type: 'TN', available: { N: 5, H: 0, V: 0, C: 0 } }]);
    });
    it('generates distinct questions across multiple exams when pool is sufficient', () => {
        const pool = [1, 2, 3, 4, 5, 6].map((form, i) => ({ id: i + 1, id_full: `2D1N1-${form}`, type_code: 'TN' }));
        const batchUsed = new Set();
        const exam1 = selectLessonQuestions(pool, { ...req, quantity: 3 }, batchUsed);
        exam1.forEach(q => batchUsed.add(q.id));
        const exam2 = selectLessonQuestions(pool, { ...req, quantity: 3 }, batchUsed);
        
        expect(exam1.length).toBe(3);
        expect(exam2.length).toBe(3);
        // Ensure no overlap between exam 1 and exam 2
        const exam1Ids = new Set(exam1.map(q => q.id));
        const exam2Ids = new Set(exam2.map(q => q.id));
        expect([...exam1Ids].some(id => exam2Ids.has(id))).toBe(false);
    });
    it('supports allowReuse with least used fallback across batch when pool is smaller than total needed', () => {
        // Pool has 4 questions, each exam needs 3 questions (total 6 needed for 2 exams)
        const pool = [1, 2, 3, 4].map((form, i) => ({ id: i + 1, id_full: `2D1N1-${form}`, type_code: 'TN' }));
        const batchUsed = new Set();
        const batchUsageMap = new Map();
        
        const exam1 = selectLessonQuestions(pool, { ...req, quantity: 3 }, batchUsed, Math.random, { allowReuse: true, batchUsageMap });
        exam1.forEach(q => { batchUsed.add(q.id); batchUsageMap.set(q.id, 1); });
        
        const exam2 = selectLessonQuestions(pool, { ...req, quantity: 3 }, batchUsed, Math.random, { allowReuse: true, batchUsageMap });
        
        expect(exam1.length).toBe(3);
        expect(exam2.length).toBe(3);
        // Within exam2, no duplicates
        expect(new Set(exam2.map(q => q.id)).size).toBe(3);
    });
});

