import { describe, expect, it } from 'vitest';
import { normalizeAiTikzFix } from './tikzAiFix.js';

describe('AI TikZ repair guard', () => {
    it('extracts one repaired TikZ environment from a fenced answer', () => {
        expect(normalizeAiTikzFix('```latex\n\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}\n```'))
            .toBe('\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}');
    });
    it('rejects unsafe or structurally incomplete TeX', () => {
        expect(normalizeAiTikzFix('\\input{secret}\\begin{tikzpicture}x\\end{tikzpicture}')).toBe('');
        expect(normalizeAiTikzFix('\\begin{tikzpicture}x')).toBe('');
    });
});
