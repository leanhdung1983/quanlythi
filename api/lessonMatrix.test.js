import { describe, it, expect, vi } from 'vitest';
import { lessonMatrixInventory, validateLessonMatrixProposal, buildLessonMatrixDraft, proposeWithDeadline } from './lessonMatrix.js';
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
    it('falls back to real capacity and distributes across forms', () => {
        const bank = [...inventory, { key: '2-D-1-1-2', type: 'TN', available: { N: 2, H: 2, V: 2, C: 2 } }];
        const draft = buildLessonMatrixDraft(bank, 100);
        expect(draft.rows.reduce((n, r) => n + Object.values(r.counts).reduce((a, b) => a + b, 0), 0)).toBe(10);
        expect(draft.rationale).toContain('10/100');
        expect(validateLessonMatrixProposal(draft, bank).rows).toHaveLength(2);
    });
    it('follows the selected difficulty without inventing missing questions', () => {
        const bank = [{ key: '2-D-1-1-1', type: 'TN', available: { N: 20, H: 20, V: 20, C: 20 } }];
        const basic = buildLessonMatrixDraft(bank, 10, 'BASIC').rows[0].counts;
        const advanced = buildLessonMatrixDraft(bank, 10, 'ADVANCED').rows[0].counts;
        expect(basic.N + basic.H).toBeGreaterThan(advanced.N + advanced.H);
        expect(advanced.V + advanced.C).toBeGreaterThan(basic.V + basic.C);
    });
    it('stops a hung provider at the deadline even if it ignores cancellation', async () => {
        vi.useFakeTimers();
        try {
            let signal;
            const pending = proposeWithDeadline(s => { signal = s; return new Promise(() => {}); }, undefined, 35);
            const assertion = expect(pending).rejects.toThrow('35 giây');
            await vi.advanceTimersByTimeAsync(35);
            await assertion;
            expect(signal.aborted).toBe(true);
        } finally { vi.useRealTimers(); }
    });
    it('propagates a teacher cancellation immediately', async () => {
        const controller = new AbortController();
        const pending = proposeWithDeadline(() => new Promise(() => {}), controller.signal);
        controller.abort();
        await expect(pending).rejects.toThrow('Đã dừng');
    });
});
