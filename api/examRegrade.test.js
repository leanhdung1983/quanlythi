import { describe, expect, it, vi } from 'vitest';
import { answerKeySignature, regradeQuestionResults, synchronizeExamDetail, updateStoredAnswerKey } from './examRegrade.js';

const oldSource = '\\choice{one}{\\True two}{three}{four}';
const newSource = '\\choice{\\True one}{two}{three}{four}';
const question = {
    id: 42, type: 'TN', content: 'Submitted question', original_latex: oldSource,
    options: [
        { id: 'A', content: 'two', originalIndex: 1, isCorrect: true },
        { id: 'B', content: 'four', originalIndex: 3, isCorrect: false },
        { id: 'C', content: 'one', originalIndex: 0, isCorrect: false },
        { id: 'D', content: 'three', originalIndex: 2, isCorrect: false },
    ],
};
const bank = new Map([[42, { id: 42, content_latex: newSource }]]);

describe('synchronized grading preserves the exam the student actually saw', () => {
    it('maps a changed key to shuffled labels and keeps the original submission for audit', () => {
        const detail = { questions: [question], answers: { 42: 'C' }, scoring_settings: { total_points_tn: 4 } };
        const updated = synchronizeExamDetail(detail, { total_points_tn: 10 }, bank);
        expect(updated.score).toBe(10);
        expect(updated.detail.questions[0].options.find(o => o.id === 'C').isCorrect).toBe(true);
        expect(updated.detail.answers).toEqual(detail.answers);
        expect(updated.detail.submitted_questions).toEqual(detail.questions);
        expect(updated.detail.questions[0].content).toBe('Submitted question');
        expect(detail.questions[0].options[0].isCorrect).toBe(true);
        const repeated = synchronizeExamDetail(updated.detail, { total_points_tn: 8 }, bank);
        expect(repeated.score).toBe(8);
        expect(repeated.detail.submitted_questions).toEqual(detail.questions);
    });
    it('regrades using actual submitted counts when the matrix now specifies a different question count', () => {
        const updated = synchronizeExamDetail({ questions: [question], answers: { 42: 'A' } },
            { total_points_tn: 6, total_points_tf: 4, matrix: { TN: 20 } });
        expect(updated.score).toBe(6);
        expect(updated.detail.questions).toHaveLength(1);
    });
    it('matches option identities even if the bank options were reordered', () => {
        const latest = { content_latex: '\\choice{four}{three}{two}{\\True one}' };
        expect(updateStoredAnswerKey(question, latest).options.find(o => o.id === 'C').isCorrect).toBe(true);
    });
    it('supports legacy snapshots with option text but no originalIndex', () => {
        const legacy = { ...question, options: question.options.map(({ originalIndex, ...o }) => o) };
        expect(updateStoredAnswerKey(legacy, bank.get(42)).options.find(o => o.id === 'C').isCorrect).toBe(true);
    });
    it('does not guess when a bank edit replaced an option', () => {
        expect(updateStoredAnswerKey(question, { content_latex: '\\choice{\\True replacement}{two}{three}{four}' })).toBe(question);
    });
    it('respects an all-false TF correction and partial-credit mode changes', () => {
        const source = '\\choiceTF{\\True one}{two}{three}{four}';
        const q = { id: 5, type: 'TF', original_latex: source,
            options: ['one', 'two', 'three', 'four'].map((content, i) => ({ id: String(i + 1), content, isCorrect: i === 0 })) };
        const detail = { questions: [q], answers: { 5: { 1: false, 2: false, 3: false, 4: true } } };
        const map = new Map([[5, { content_latex: '\\choiceTF{one}{two}{three}{four}' }]]);
        const updated = synchronizeExamDetail(detail, { total_points_tf: 10, tf_scoring_mode: 'linear' }, map);
        expect(updated.score).toBe(7.5);
        expect(updated.detail.questions[0].options.every(o => o.isCorrect === false)).toBe(true);
        expect(synchronizeExamDetail(updated.detail, { total_points_tf: 10, tf_scoring_mode: '0-0-0-100' }, map).score).toBe(0);
    });
    it('updates short answers and uses the original source after image rendering stripped markers', () => {
        const q = { id: 3, type: 'KQ', correctAnswer: '1' };
        expect(synchronizeExamDetail({ questions: [q], answers: { 3: '2,5' } }, {},
            new Map([[3, { content_latex: '\\shortans{2.5}' }]])).score).toBe(10);
        const rendered = { content_latex: '\\choice{one}{two}{three}{four}', content_latex_original: newSource };
        expect(updateStoredAnswerKey(question, rendered).options.find(o => o.id === 'C').isCorrect).toBe(true);
    });
    it('ignores solution-only edits when deciding whether to regrade', () => {
        expect(answerKeySignature(oldSource + '\\loigiai{old}')).toBe(answerKeySignature(oldSource + '\\loigiai{new}'));
        expect(answerKeySignature(oldSource)).not.toBe(answerKeySignature(newSource));
    });
    it('updates completed and active sessions in the same question-edit transaction', async () => {
        const detail = JSON.stringify({ questions: [question], answers: { 42: 'C' }, scoring_settings: { total_points_tn: 10 } });
        const conn = { query: vi.fn(async sql => sql.startsWith('SELECT')
            ? [[{ id: 1, status: 'COMPLETED', score: 0, result_detail: detail },
                { id: 2, status: 'IN_PROGRESS', score: 0, result_detail: detail }]] : [{ affectedRows: 1 }]) };
        expect(await regradeQuestionResults(conn, bank.get(42))).toEqual({ regraded: 1, skipped: 0 });
        const updates = conn.query.mock.calls.filter(([sql]) => sql.startsWith('UPDATE'));
        expect(updates.map(([, values]) => values[0])).toEqual([10, 0]);
        expect(conn.query.mock.calls[0][0]).toContain('FOR UPDATE');
    });
});
