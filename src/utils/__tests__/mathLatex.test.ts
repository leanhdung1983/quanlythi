import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { KATEX_MACROS, prepareLatexForRendering, splitLatexSegments } from '../mathLatex';

describe('math LaTeX preparation', () => {
    it.each(['parallel', 'perp', 'nparallel', 'angle', 'triangle', 'Rightarrow', 'subseteq'])('wraps naked \\%s in math mode', command => {
        expect(prepareLatexForRendering(`AB \\${command} CD`)).toContain(`\\(\\${command}\\)`);
    });

    it('does not wrap commands already inside any supported math delimiter', () => {
        const input = '$a \\parallel b$; \\(c \\perp d\\); \\[x \\neq y\\]';
        expect(prepareLatexForRendering(input)).toBe(input);
    });

    it('wraps common geometry commands with arguments', () => {
        const result = prepareLatexForRendering('Vectơ \\overrightarrow{AB} và cung \\wideparen{MN}.');
        expect(result).toContain('\\(\\overrightarrow{AB}\\)');
        expect(result).toContain('\\(\\wideparen{MN}\\)');
    });

    it('wraps negated geometric relations as one expression', () => {
        expect(prepareLatexForRendering('a \\not\\parallel b')).toContain('\\(\\not\\parallel\\)');
    });

    it('keeps display environments as one segment', () => {
        expect(splitLatexSegments('A \\begin{aligned}x&=1\\end{aligned} B')).toHaveLength(3);
    });

    it.each([
        '\\parallel', '\\perp', '\\nparallel', '\\not\\parallel', '\\angle ABC',
        '\\triangle ABC', '\\overrightarrow{AB}', '\\wideparen{MN}', '\\subseteq', '\\Rightarrow'
    ])('is accepted by the real KaTeX renderer: %s', expression => {
        const html = katex.renderToString(expression, {
            macros: KATEX_MACROS,
            strict: false,
            throwOnError: true,
            trust: false
        });
        expect(html).toContain('katex');
        expect(html).not.toContain('katex-error');
    });
});
