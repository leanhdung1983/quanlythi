import { describe, expect, it } from 'vitest';
import { svgImageSource } from './svgImageSource';

describe('isolated LaTeX SVG images', () => {
    it('repairs old inline SVG namespaces and invalid intrinsic dimensions', () => {
        const result = decodeURIComponent(svgImageSource('<svg width="100%" height="auto" viewBox="0 0 120 60"><use xlink:href="#g0"/></svg>').split(',')[1]);
        expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(result).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
        expect(result).toContain('viewBox="0 0 120 60"');
        expect(result).not.toContain('height="auto"');
        expect(result).not.toContain('width="100%"');
    });
    it('keeps glyph definitions and fragment references inside each document', () => {
        const figure = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50"><defs><path id="g0-0" d="${path}"/></defs><use xlink:href="#g0-0"/><text>x y y′ −∞ +</text></svg>`;
        const first = figure('M0 0L1 1');
        const second = figure('M2 2L3 3');
        expect(svgImageSource(first)).not.toBe(svgImageSource(second));
        for (const svg of [first, second]) {
            const source = svgImageSource(svg);
            expect(source).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
            expect(decodeURIComponent(source.split(',')[1])).toBe(svg);
            expect(source).not.toContain('#g0-0');
        }
    });
});
