import { describe, expect, it } from 'vitest';
import { sanitizeCompiledSvg as preserveSvgImage } from './svgImage.js';
describe('preserve compiled SVG images', () => {
    it('never serializes empty path attributes as invalid XML boolean attributes', () => {
        for (const path of ['<path id="space" d=""/>', '<path id="space" d></path>']) {
            const clean = preserveSvgImage(`<svg xmlns="http://www.w3.org/2000/svg"><defs>${path}</defs><text>x</text></svg>`);
            expect(clean).toContain('id="space"');
            expect(clean).not.toMatch(/\sd(?:\s|\/?>)/);
            expect(clean).toContain('<text>x</text>');
        }
    });
    it('preserves every glyph, use reference, symbol, style and mathematical label', () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style>.glyph{fill:black}</style><defs><symbol id="glyph0-1" overflow="visible"><path d="M0 0L2 3"/></symbol></defs><use xlink:href="#glyph0-1" x="30" y="20" class="glyph"/><text dx="1" dy="2">x y y′ −∞ +∞ + − 0</text></svg>`;
        const clean = preserveSvgImage(svg);
        for (const value of ['glyph0-1', 'xlink:href="#glyph0-1"', 'x="30"', 'y="20"', 'dx="1"', 'dy="2"', 'x y y′ −∞ +∞ + − 0']) expect(clean).toContain(value);
        expect(preserveSvgImage('<?xml version="1.0"?>\n' + svg)).toBe(clean);
    });
    it('still removes executable SVG markup', () => {
        const clean = preserveSvgImage('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><foreignObject><div>bad</div></foreignObject><use href="https://evil.example/x"/><text>x</text></svg>');
        expect(clean).not.toMatch(/onload|<script|foreignObject|https:\/\/evil/);
        expect(clean).toContain('<text>x</text>');
    });
    it('rejects non-SVG and oversized input without filtering drawing components', () => {
        expect(preserveSvgImage('<html>not an image</html>')).toBe('');
        expect(preserveSvgImage(null)).toBe('');
        expect(preserveSvgImage('<svg>' + 'x'.repeat(2_000_000) + '</svg>')).toBe('');
    });
});
