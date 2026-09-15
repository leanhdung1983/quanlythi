import { describe, it, expect } from 'vitest';
import { 
    stripExTestSolution, 
    stripExTestChoices, 
    extractExTestSolution, 
    shuffleArray, 
    parseQuestionContent 
} from '../latexParser';
import { OnlineQuestion, QuestionType } from '../../types';

describe('latexParser', () => {
    describe('stripExTestSolution', () => {
        it('should strip \\loigiai{...} from text', () => {
            const input = 'Câu hỏi ở đây.\\loigiai{Lời giải chi tiết ở đây.}Phần kết thúc.';
            const result = stripExTestSolution(input);
            expect(result).toBe('Câu hỏi ở đây.Phần kết thúc.');
        });

        it('should handle nested braces inside \\loigiai', () => {
            const input = 'Đề bài.\\loigiai{Ta có $f(x) = \\frac{1}{2}$ và $\{x | x > 0\}$.}Hết.';
            const result = stripExTestSolution(input);
            expect(result).toBe('Đề bài.Hết.');
        });

        it('should return original text if no \\loigiai', () => {
            const input = 'Đề bài không có lời giải.';
            expect(stripExTestSolution(input)).toBe(input);
        });
    });

    describe('stripExTestChoices', () => {
        it('should strip \\choice block', () => {
            const input = 'Tìm x.\\choice{A}{B}{C}{D}Chúc may mắn.';
            const result = stripExTestChoices(input);
            expect(result).toBe('Tìm x.Chúc may mắn.');
        });

        it('should replace \\shortans with dots', () => {
            const input = 'Giá trị là \\shortans{42}.';
            const result = stripExTestChoices(input);
            expect(result).toBe('Giá trị là  \\dots .');
        });
    });

    describe('extractExTestSolution', () => {
        it('should extract content from \\loigiai{...}', () => {
            const input = 'Đề bài.\\loigiai{Nghiệm là $x = 1$.}';
            const result = extractExTestSolution(input);
            expect(result).toBe('Nghiệm là $x = 1$.');
        });

        it('should extract content from \\begin{loigiai}...\\end{loigiai}', () => {
            const input = 'Đề bài.\\begin{loigiai}Hướng dẫn giải theo môi trường.\\end{loigiai}';
            const result = extractExTestSolution(input);
            expect(result).toBe('Hướng dẫn giải theo môi trường.');
        });
    });

    describe('shuffleArray', () => {
        it('should preserve all elements after shuffle', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(original);
            expect(shuffled).toHaveLength(5);
            expect(shuffled.sort()).toEqual(original.sort());
        });

        it('should not mutate original array', () => {
            const original = [1, 2, 3, 4];
            const originalCopy = [...original];
            shuffleArray(original);
            expect(original).toEqual(originalCopy);
        });
    });

    describe('parseQuestionContent', () => {
        it('should parse Multiple Choice (TN) question correctly', () => {
            const q: OnlineQuestion = {
                id: 1,
                id_full: 'TEST_TN',
                content: 'Tính tích phân.\\choice{\\True $A = 1$}{$B = 2$}{$C = 3$}{$D = 4$}\\loigiai{Lời giải chi tiết.}',
                type: QuestionType.TN,
                options: []
            };

            const parsed = parseQuestionContent(q, true); // skipShuffle = true for deterministic testing
            expect(parsed.content.trim()).toBe('Tính tích phân.');
            expect(parsed.solution).toBe('Lời giải chi tiết.');
            expect(parsed.options).toHaveLength(4);
            expect(parsed.options?.[0].isCorrect).toBe(true);
            expect(parsed.options?.[0].content).toBe('$A = 1$');
            expect(parsed.options?.[1].isCorrect).toBe(false);
            expect(parsed.options?.[1].content).toBe('$B = 2$');
        });

        it('should parse True/False (TF) question correctly', () => {
            const q: OnlineQuestion = {
                id: 2,
                id_full: 'TEST_TF',
                content: 'Cho hàm số $y=f(x)$.\\choiceTF{\\True Khẳng định 1}{Khẳng định 2}{\\True Khẳng định 3}{Khẳng định 4}',
                type: QuestionType.TF,
                options: []
            };

            const parsed = parseQuestionContent(q);
            expect(parsed.options).toHaveLength(4);
            expect(parsed.options?.[0].isCorrect).toBe(true);
            expect(parsed.options?.[0].content).toBe('Khẳng định 1');
            expect(parsed.options?.[1].isCorrect).toBe(false);
            expect(parsed.options?.[2].isCorrect).toBe(true);
            expect(parsed.options?.[3].isCorrect).toBe(false);
        });

        it('should parse Short Answer (KQ) with \\shortans', () => {
            const q: OnlineQuestion = {
                id: 3,
                id_full: 'TEST_KQ',
                content: 'Giá trị nhỏ nhất của hàm số là \\shortans{3.5}.\\loigiai{Vì đạo hàm dương.}',
                type: QuestionType.KQ,
                options: []
            };

            const parsed = parseQuestionContent(q);
            expect(parsed.type).toBe(QuestionType.KQ);
            expect(parsed.correctAnswer).toBe('3.5');
            expect(parsed.solution).toBe('Vì đạo hàm dương.');
        });
    });
});
