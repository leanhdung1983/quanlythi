import { describe, it, expect } from 'vitest';
import { buildGapMap, correctness, planPractice } from './eduloop.js';
const q = { id: 1, id_full: '2D1H1-1', type: 'TN', options: [{ id: 'A', isCorrect: true }] };
const result = (id, answer, date = '2026-10-01T00:00:00Z') => ({ id, user_id: 7, status: 'COMPLETED', created_at: date,
    result_detail: { questions: [q], answers: { 1: answer } } });
describe('EduLoop evidence', () => {
    it('uses normalized KQ and partial TF; does not mark ungraded essays wrong', () => {
        expect(correctness({ type: 'KQ', correctAnswer: '1.5;2' }, '1,5')).toBe(1);
        expect(correctness({ type: 'TF', options: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] }, { a: true })).toBe(.5);
        expect(correctness({ type: 'TL' }, '')).toBe(null);
        expect(correctness({ type: 'TN', options: [] }, '')).toBe(null);
    });
    it('excludes incomplete/corrupt results, duplicate questions and missing IDs', () => {
        const r = result(1, 'A'); r.result_detail.questions.push(q, { ...q, id: 2, id_full: 'bad' });
        const map = buildGapMap([r, { ...result(2, 'B'), status: 'IN_PROGRESS' }, { ...result(3, 'B'), result_detail: '{broken' }]);
        expect(map.skills[0].attempts).toBe(1); expect(map.skipped).toBe(1);
    });
    it('requires sufficient samples, includes evidence and computes measured progress', () => {
        const rows = [result(1, 'B'), result(2, 'B'), result(3, 'A'), ...[4, 5, 6].map(id => result(id, 'A', '2026-10-03T00:00:00Z'))];
        const skill = buildGapMap(rows, [], '2026-10-02T00:00:00Z').skills[0];
        expect(skill.before).toEqual({ n: 3, rate: 33 }); expect(skill.after.rate).toBe(100); expect(skill.delta).toBe(67);
        expect(buildGapMap([result(1, 'B')]).skills[0].gap).toBe(false);
    });
    it('balances ID6 gaps and never fills with unrelated questions', () => {
        const map = buildGapMap([1, 2, 3].map(id => result(id, 'B')));
        const items = planPractice(map, [{ id: 10, legacy_full_id: '12D1B1-1' }, { id: 11, legacy_full_id: '2D1V1-2' }]);
        expect(items.map(i => i.question_id)).toEqual([10]); expect(items[0].evidence).toHaveLength(3);
        expect(items[0].reason).toContain('0%');
    });
});
