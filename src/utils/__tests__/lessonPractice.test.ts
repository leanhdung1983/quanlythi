import { describe, it, expect } from 'vitest';
import { parseLessonPracticeQuestion, lessonPracticeCorrect } from '../lessonPractice';
import { QuestionType } from '../../types';
describe('lesson self-check', () => {
    it('extracts choices and hides solution until submission', () => {
        const q = parseLessonPracticeQuestion({ id: 1, type_code: 'TN', content_latex: '\\begin{ex}Tính $1+1$.\\choice{1}{\\True 2}{3}{4}\\loigiai{Cộng được $2$.}\\end{ex}' });
        expect(q.content).not.toContain('loigiai'); expect(q.content).not.toContain('True');
        expect(q.options).toHaveLength(4); expect(q.solution).toContain('Cộng');
        expect(lessonPracticeCorrect(q, q.options.find(o => o.isCorrect)!.id)).toBe(true);
        expect(lessonPracticeCorrect(q, undefined)).toBe(false);
    });
    it('grades short answers with the existing numeric normalization', () => {
        const q = parseLessonPracticeQuestion({ id: 2, type_code: 'KQ', content_latex: 'Tính một nửa.\\shortans{0,5}\\loigiai{Chia cho hai.}' });
        expect(q.correctAnswer).toBe('0,5'); expect(lessonPracticeCorrect(q, '0.5')).toBe(true);
        expect(lessonPracticeCorrect(q, '1')).toBe(false);
    });
    it('does not invent marks for essay questions or missing TN answer keys', () => {
        const essay = parseLessonPracticeQuestion({ id: 3, type_code: 'TL', content_latex: 'Giải thích kết quả.' });
        expect(lessonPracticeCorrect(essay, 'bất kỳ')).toBeNull();
        expect(lessonPracticeCorrect({ ...essay, type: QuestionType.TN, options: [] }, 'A')).toBeNull();
    });
    it('requires all TF statements to be answered with correct truth values', () => {
        const q = parseLessonPracticeQuestion({ id: 4, type_code: 'TF', content_latex: 'Xét các phát biểu.\\choiceTF{\\True Một}{Hai}{\\True Ba}{Bốn}' });
        const answers = Object.fromEntries(q.options.map(o => [o.id, o.isCorrect]));
        expect(lessonPracticeCorrect(q, answers)).toBe(true);
        delete answers[q.options[0].id]; expect(lessonPracticeCorrect(q, answers)).toBe(false);
    });
});
