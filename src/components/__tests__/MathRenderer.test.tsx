import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

vi.mock('dompurify', () => ({
    default: {
        sanitize: (html: string) => html
    }
}));

import { MathRenderer } from '../MathRenderer';

describe('MathRenderer delimiter rendering', () => {
    it('preserves stretchy \\left| and \\right| delimiter SVGs for vector norms', () => {
        const html = renderToStaticMarkup(
            <MathRenderer content={'$\\left|\\overrightarrow{AB}\\right| = \\left|\\overrightarrow{CD}\\right|$'} />
        );

        const delimMatches = html.match(/class="delimsizing mult"/g) || [];
        expect(delimMatches).toHaveLength(4);
        expect(html).toContain('<svg');
        expect(html).toContain('<path');
    });

    it('does not force height: 100% on generic .katex svg elements in index.css', () => {
        const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
        const katexSvgBlock = css.match(/\.katex\s+svg\s*\{[\s\S]*?\}/);
        expect(katexSvgBlock).not.toBeNull();
        expect(katexSvgBlock![0]).toContain('height: inherit');
        expect(katexSvgBlock![0]).not.toContain('height: 100%');
    });
});
