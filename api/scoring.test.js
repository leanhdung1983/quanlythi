import { describe, expect, it } from 'vitest';
import { calculateServerScore, checkShortAnswer, regradeStoredExamDetail, scoringSettingsSignature } from './scoring.js';

describe('server-side exam scoring', () => {
    const questions = [
        { id: 1, type: 'TN', options: [{ id: 'a', isCorrect: false }, { id: 'b', isCorrect: true }] },
        { id: 2, type: 'TF', options: [
            { id: 'x', isCorrect: true }, { id: 'y', isCorrect: false },
            { id: 'z', isCorrect: true }, { id: 't', isCorrect: false }
        ] },
        { id: 3, type: 'KQ', correctAnswer: '{1,5;3/2}' }
    ];

    it('calculates a perfect score from trusted questions', () => {
        const answers = { 1: 'b', 2: { x: true, y: false, z: true, t: false }, 3: '1.5' };
        expect(calculateServerScore(questions, answers)).toBe(10);
    });

    it('does not award points for incorrect answers', () => {
        expect(calculateServerScore(questions, { 1: 'a', 3: '2' })).toBe(0);
    });

    it('normalizes Vietnamese decimal separators and accepted answers', () => {
        expect(checkShortAnswer(' 1,50 ', '{1.5;3/2}')).toBe(true);
    });

    it('caps configured scores at ten', () => {
        expect(calculateServerScore([questions[0]], { 1: 'b' }, { points_tn: 50 })).toBe(10);
    });

    it('regrades a completed snapshot with new matrix settings and preserves its answers', () => {
        const detail = { questions, answers: { 1: 'b', 3: '2' }, scoring_settings: { total_points_tn: 10 } };
        const result = regradeStoredExamDetail(JSON.stringify(detail), {
            total_points_tn: 4, total_points_tf: 3, total_points_kq: 3,
        });
        expect(result.score).toBe(4);
        expect(result.detail.answers).toEqual(detail.answers);
        expect(result.detail.scoring_settings.total_points_tn).toBe(4);
    });

    it('skips legacy rows that do not retain enough data to grade safely', () => {
        expect(regradeStoredExamDetail({ questions: [], answers: {} }, {})).toBeNull();
        expect(regradeStoredExamDetail('{"broken":true}', {})).toBeNull();
    });

    it('only treats grading fields as scoring changes', () => {
        expect(scoringSettingsSignature({ duration: 45, points_tn: 1 }))
            .toBe(scoringSettingsSignature({ duration: 90, points_tn: 1 }));
        expect(scoringSettingsSignature({ points_tn: 1 }))
            .not.toBe(scoringSettingsSignature({ points_tn: 2 }));
    });
});
