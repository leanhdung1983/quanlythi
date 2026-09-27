import { describe, expect, it } from 'vitest';
import { extractSourceId, injectCanonicalId, normalizeId6, normalizeQuestionSource, parseId6, validateId6Candidate } from './id6.js';

describe('ID6 canonical rules', () => {
    it.each([['12d01b03_04', '2D1H3-4'], ['2H2K5-7', '2H2V5-7'], ['10C3G2-1', '0C3C2-1']])('normalizes %s', (input, expected) => {
        expect(normalizeId6(input)).toBe(expected);
    });
    it('rejects unsupported grades and subjects', () => {
        expect(parseId6('5D1H1-1')).toBeNull();
        expect(parseId6('2X1H1-1')).toBeNull();
    });
    it('keeps exactly one canonical source marker', () => {
        const result = injectCanonicalId('\\begin{bt}\n%[12D1B3-4]\nNội dung\n\\end{bt}', '2D1H3-4');
        expect(result.match(/%\[2D1H3-4\]/g)).toHaveLength(1);
        expect(extractSourceId(result)).toBe('2D1H3-4');
        expect(result).toContain('\\begin{ex}');
    });
    it('extracts and replaces the legacy $[ID] source marker', () => {
        const source = '\\begin{ex}\n$[12D1B3-4]\nNội dung\\end{ex}';
        expect(extractSourceId(source)).toBe('2D1H3-4');
        const result = injectCanonicalId(source, '2D1H3-4');
        expect(result).toContain('%[2D1H3-4]');
        expect(result).not.toContain('$[');
    });
    it('normalizes line endings without changing math content', () => {
        const result = normalizeQuestionSource('```latex\r\n\\begin{ex}\r\n$x + 1$   \r\n\\end{ex}\r\n```', '2D1H3-4');
        expect(result.source).toContain('$x + 1$');
        expect(result.changed).toBe(true);
    });
    it('uses scanner rules for an AI candidate instead of declaring a catalog ID valid', () => {
        const metadata = new Map([['2D1H3-4', { id_full: '2D1H3-4', unit_id: 3, level_id: 2 }]]);
        const result = validateId6Candidate({ content_latex: '\\begin{ex}\nNội dung\\end{ex}', unit_id: 3, level_id: 2 }, '2D1H3-4', metadata);
        expect(result.isValid).toBe(false);
        expect(result.reasonCodes).toContain('ID_NOT_IN_SOURCE');
    });
    it('accepts a candidate only when catalog, source, unit and level agree', () => {
        const metadata = new Map([['2D1H3-4', { id_full: '2D1H3-4', unit_id: 3, level_id: 2 }]]);
        const result = validateId6Candidate({ content_latex: '\\begin{ex}\n%[2D1H3-4]\nNội dung\\end{ex}', unit_id: 3, level_id: 2 }, '2D1H3-4', metadata);
        expect(result.isValid).toBe(true);
        expect(result.reasonCodes).toEqual([]);
    });
});
