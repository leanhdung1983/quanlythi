import { describe, expect, it } from 'vitest';
import { assessQuestionCoverage, extractNumberedBlocks, findQuestionNumbers, hasRequiredElements } from './pdfToExTest.js';

describe('PDF ex_test coverage', () => {
    it('finds unique printed question numbers', () => {
        expect(findQuestionNumbers('Câu 1. A Câu 2: B Câu 2.')).toEqual([1, 2]);
    });
    it('accepts exactly one complete ex block per numbered marker', () => {
        const blocks = extractNumberedBlocks('% PDF_CAU:1\n\\begin{ex}A\\choice{a}{b}{c}{d}\\end{ex}\n% PDF_CAU:2\n\\begin{ex}B\\end{ex}');
        expect(assessQuestionCoverage([1, 2], blocks).complete).toBe(true);
    });
    it('detects a truncated last question', () => {
        const blocks = extractNumberedBlocks('% PDF_CAU:1\n\\begin{ex}A\\end{ex}\n% PDF_CAU:2\n\\begin{ex}B');
        expect(assessQuestionCoverage([1, 2], blocks).missing).toEqual([2]);
    });
    it('rejects a multiple-choice question with the wrong choice command or missing printed solution', () => {
        const inspection = { multipleChoiceNumbers: [7, 11], solutionNumbers: [7] };
        expect(hasRequiredElements(11, '\\begin{ex}Q\\choiceTF{a}{b}{c}{d}\\end{ex}', inspection)).toBe(false);
        expect(hasRequiredElements(7, '\\begin{ex}Q\\choice{a}{b}{c}{d}\\end{ex}', inspection)).toBe(false);
        expect(hasRequiredElements(7, '\\begin{ex}Q\\choice{a}{b}{c}{d}\\loigiai{Lời giải}\\end{ex}', inspection)).toBe(true);
    });
});
