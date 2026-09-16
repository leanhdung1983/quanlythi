import { describe, expect, it } from 'vitest';
import { svgImageSource } from './svgImageSource';

describe('isolated LaTeX SVG images', () => {
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
