import { describe, it, expect } from 'vitest';
import { lessonMatrixInventory, validateLessonMatrixProposal } from './lessonMatrix.js';
describe('AI lesson matrix guardrails', () => {
    const inventory = lessonMatrixInventory([{ legacy_full_id: '2D1N1-1', type: 'TN' }, { legacy_full_id: '2D1H1-1', type: 'TN' }]);
    it('groups real questions into editable matrix dimensions', () => {
        expect(inventory).toEqual([{ key: '2-D-1-1-1', type: 'TN', available: { N: 1, H: 1, V: 0, C: 0 } }]);
    });
    it('accepts only available counts and rejects invented rows or duplicate demand', () => {
        const row = { key: '2-D-1-1-1', type: 'TN', counts: { N: 1, H: 1, V: 0, C: 0 } };
        expect(validateLessonMatrixProposal({ rows: [row] }, inventory).rows[0].counts.H).toBe(1);
        expect(() => validateLessonMatrixProposal({ rows: [{ ...row, counts: { N: 2 } }] }, inventory)).toThrow();
        expect(() => validateLessonMatrixProposal({ rows: [{ ...row, key: 'invented' }] }, inventory)).toThrow();
        expect(() => validateLessonMatrixProposal({ rows: [row, row] }, inventory)).toThrow();
    });
});
