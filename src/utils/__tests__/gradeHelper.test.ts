import { describe, it, expect } from 'vitest';
import { checkKQAnswer, calculateExamScore } from '../gradeHelper';

describe('gradeHelper', () => {
    describe('checkKQAnswer', () => {
        it('should match exact numeric answers', () => {
            expect(checkKQAnswer('3.14', '3.14')).toBe(true);
            expect(checkKQAnswer('3,14', '3.14')).toBe(true);
            expect(checkKQAnswer(' 42 ', '42')).toBe(true);
            expect(checkKQAnswer('-5.5', '-5,5')).toBe(true);
        });

        it('should reject incorrect numeric answers', () => {
            expect(checkKQAnswer('3.15', '3.14')).toBe(false);
            expect(checkKQAnswer('0', '1')).toBe(false);
        });

        it('should match non-numeric or text answers', () => {
            expect(checkKQAnswer('x = 2', 'x = 2')).toBe(true);
            expect(checkKQAnswer('pi/2', 'pi/2')).toBe(true);
        });

        it('should handle multiple acceptable answers separated by semicolon', () => {
            expect(checkKQAnswer('1/2', '{1/2};{0.5}')).toBe(true);
            expect(checkKQAnswer('0.5', '{1/2};{0.5}')).toBe(true);
            expect(checkKQAnswer('0,5', '{1/2};{0.5}')).toBe(true);
            expect(checkKQAnswer('0.75', '{1/2};{0.5}')).toBe(false);
        });

        it('should return false on empty inputs', () => {
            expect(checkKQAnswer('', '5')).toBe(false);
            expect(checkKQAnswer('5', '')).toBe(false);
            expect(checkKQAnswer(null, '5')).toBe(false);
            expect(checkKQAnswer('5', null)).toBe(false);
        });
    });

    describe('calculateExamScore', () => {
        const sampleQuestions = [
            {
                id: 'q1',
                type: 'TN',
                options: [
                    { id: 'A', content: 'Opt A', isCorrect: false },
                    { id: 'B', content: 'Opt B', isCorrect: true },
                    { id: 'C', content: 'Opt C', isCorrect: false },
                    { id: 'D', content: 'Opt D', isCorrect: false }
                ]
            },
            {
                id: 'q2',
                type: 'TF',
                options: [
                    { id: '1', content: 'St 1', isCorrect: true },
                    { id: '2', content: 'St 2', isCorrect: false },
                    { id: '3', content: 'St 3', isCorrect: true },
                    { id: '4', content: 'St 4', isCorrect: false }
                ]
            },
            {
                id: 'q3',
                type: 'KQ',
                correctAnswer: '42'
            }
        ];

        it('should calculate score with default distribution (total 10)', () => {
            // User answers all correctly
            const fullAnswers = {
                q1: 'B',
                q2: { '1': true, '2': false, '3': true, '4': false },
                q3: '42'
            };
            const score = calculateExamScore(sampleQuestions, fullAnswers);
            expect(score).toBe(10);
        });

        it('should calculate 0 for completely wrong answers', () => {
            const wrongAnswers = {
                q1: 'A',
                q2: { '1': false, '2': true, '3': false, '4': true },
                q3: '999'
            };
            const score = calculateExamScore(sampleQuestions, wrongAnswers);
            expect(score).toBe(0);
        });

        it('should handle partial scoring for TF questions in 10-25-50-100 mode', () => {
            // Question 2 has pTF = 10/3 = 3.333
            // 2 correct out of 4 -> 25% of pTF
            const partialAnswers = {
                q2: { '1': true, '2': false, '3': false, '4': true } // only 1 and 2 correct
            };
            const score = calculateExamScore(sampleQuestions, partialAnswers, {
                total_points_tf: 4,
                tf_scoring_mode: '10-25-50-100'
            });
            // 4 points * 0.25 = 1.0 point
            expect(score).toBe(1);
        });

        it('should handle 0-0-0-100 mode where only full 4/4 gives points', () => {
            const partialAnswers = {
                q2: { '1': true, '2': false, '3': true, '4': true } // 3 correct out of 4
            };
            const score = calculateExamScore(sampleQuestions, partialAnswers, {
                total_points_tf: 4,
                tf_scoring_mode: '0-0-0-100'
            });
            expect(score).toBe(0);
        });

        it('should use explicit configured category point totals', () => {
            const answers = {
                q1: 'B', // TN: 3 points
                q3: '42' // KQ: 3 points
            };
            const settings = {
                total_points_tn: 3,
                total_points_tf: 4,
                total_points_kq: 3
            };
            const score = calculateExamScore(sampleQuestions, answers, settings);
            expect(score).toBe(6);
        });
    });
});
