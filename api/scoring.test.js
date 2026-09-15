import { describe, expect, it } from 'vitest';
import { calculateServerScore, checkShortAnswer } from './scoring.js';

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
});
