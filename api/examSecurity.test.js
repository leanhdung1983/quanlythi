import { describe, it, expect } from 'vitest';
import { stripLoigiai, stripShortans, stripTrueMarkers, sanitizeQuestionForStudent, rehydrateTrustedQuestions, validateTrustedQuestions } from './examSecurity.js';

describe('Exam Security & Answer Sanitization', () => {
    it('strips \\loigiai with nested braces cleanly without breaking math', () => {
        const latex = `
\\begin{ex}
Tìm tập xác định của $f(x) = \\sqrt{x - 1}$.
\\choice
{\\True $D = [1; +\\infty)$}
{$D = (1; +\\infty)$}
{$D = \\mathbb{R}$}
{$D = \\{1\\}$}
\\loigiai{
Điều kiện xác định: $x - 1 \\ge 0 \\Leftrightarrow x \\ge 1$.
Do đó $D = [1; +\\infty)$.
Tập nghiệm $\{x \\in \\mathbb{R} \\mid x \\ge 1\}$.
}
\\end{ex}
        `.trim();

        const { cleaned, solution } = stripLoigiai(latex);
        expect(cleaned).not.toContain('\\loigiai');
        expect(cleaned).not.toContain('Điều kiện xác định');
        expect(solution).toContain('Điều kiện xác định: $x - 1 \\ge 0');
        expect(solution).toContain('Tập nghiệm');
        expect(solution).toContain('x \\ge 1');
    });

    it('strips \\shortans and extracts the correct value', () => {
        const latex = 'Cho hàm số $y = x^2$. Tính $y\'(2)$. \\shortans{4} \\loigiai{Ta có $y\'(2) = 4$.}';
        const { cleaned, shortAnswer } = stripShortans(latex);
        expect(cleaned).not.toContain('\\shortans');
        expect(cleaned).not.toContain('{4}');
        expect(shortAnswer).toBe('4');
    });

    it('strips \\True from \\choice while recording the correct index', () => {
        const latex = 'Câu 1: \\choice {Phương án A} {\\True Phương án B đúng} {Phương án C} {Phương án D}';
        const { cleaned, correctIndices } = stripTrueMarkers(latex);
        expect(cleaned).not.toContain('\\True');
        expect(cleaned).toContain('Phương án B đúng');
        expect(correctIndices).toEqual([1]);
    });

    it('strips \\True from \\choiceTF while recording the True/False map', () => {
        const latex = 'Câu 2: \\choiceTF {\\True Mệnh đề 1 đúng} {Mệnh đề 2 sai} {\\True Mệnh đề 3 đúng} {Mệnh đề 4 sai}';
        const { cleaned, tfMap } = stripTrueMarkers(latex);
        expect(cleaned).not.toContain('\\True');
        expect(tfMap['1']).toBe(true);
        expect(tfMap['2']).toBe(false);
        expect(tfMap['3']).toBe(true);
        expect(tfMap['4']).toBe(false);
    });

    it('sanitizes complete question for student without exposing answers', () => {
        const question = {
            id: 101,
            type: 'TN',
            content_latex: '\\begin{ex} Câu hỏi $1+1=?$ \\choice {$1$} {\\True $2$} {$3$} {$4$} \\loigiai{Vì $1+1=2$.} \\end{ex}',
            options: [
                { id: 'A', content: '$1$', isCorrect: false },
                { id: 'B', content: '$2$', isCorrect: true },
                { id: 'C', content: '$3$', isCorrect: false },
                { id: 'D', content: '$4$', isCorrect: false }
            ]
        };

        const { sanitizedQuestion, answerKey } = sanitizeQuestionForStudent(question);
        expect(sanitizedQuestion.content_latex).not.toContain('\\True');
        expect(sanitizedQuestion.content_latex).not.toContain('\\loigiai');
        expect(sanitizedQuestion.content_latex).not.toContain('Vì $1+1=2$');
        expect(sanitizedQuestion.solution).toBeUndefined();
        expect(sanitizedQuestion.options.every(opt => opt.isCorrect === false)).toBe(true);

        expect(answerKey.id).toBe(101);
        expect(answerKey.solution).toContain('Vì $1+1=2$');
        expect(answerKey.correctIndices).toEqual([1]);
    });

    it('rehydrates trusted answer keys from DB records and prevents client tampering', () => {
        const clientQuestions = [
            {
                id: 101,
                type: 'TN',
                options: [
                    // Client malicious attempt: claiming A is correct
                    { id: 'A', originalIndex: 0, isCorrect: true },
                    { id: 'B', originalIndex: 1, isCorrect: false },
                    { id: 'C', originalIndex: 2, isCorrect: false },
                    { id: 'D', originalIndex: 3, isCorrect: false }
                ]
            }
        ];

        const dbMap = new Map([
            [101, {
                id: 101,
                content_latex: '\\begin{ex} $1+1=?$ \\choice {$1$} {\\True $2$} {$3$} {$4$} \\loigiai{Lời giải 1+1=2} \\end{ex}'
            }]
        ]);

        const rehydrated = rehydrateTrustedQuestions(clientQuestions, dbMap);
        expect(rehydrated[0].options.find(o => o.id === 'A').isCorrect).toBe(false);
        expect(rehydrated[0].options.find(o => o.id === 'B').isCorrect).toBe(true);
        expect(rehydrated[0].solution).toContain('Lời giải 1+1=2');
    });
    it('refuses to start an exam when an authoritative answer key is missing', () => {
        expect(validateTrustedQuestions([{ id: 1, type: 'TN', options: [{ isCorrect: false }] }])).toContain('đáp án');
        expect(validateTrustedQuestions([{ id: 2, type: 'KQ', correctAnswer: '' }])).toContain('đáp án');
        expect(validateTrustedQuestions([{ id: 3, type: 'TF', options: Array.from({ length: 4 }, () => ({ isCorrect: false })) }])).toBeNull();
    });
    it('recovers answer keys from original LaTeX when current display source lost its markers', () => {
        const client = [{ id: 8, type: 'TN', options: ['A','B','C','D'].map((id, originalIndex) => ({ id, originalIndex, isCorrect: false })) }];
        const rows = new Map([[8, { content_latex: '\\choice{$1$}{$2$}{$3$}{$4$}', content_latex_original: '\\choice{$1$}{\\True $2$}{$3$}{$4$}' }]]);
        expect(rehydrateTrustedQuestions(client, rows)[0].options.find(option => option.id === 'B').isCorrect).toBe(true);
    });
});
