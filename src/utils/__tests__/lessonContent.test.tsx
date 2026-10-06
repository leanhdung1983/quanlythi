import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
vi.mock('../../components/MathRenderer', () => ({ MathRenderer: ({ content }: { content: string }) => <span>{content}</span> }));
import { LessonContent } from '../../components/LessonContent';
describe('lesson Markdown layout', () => {
    it('lays out headings, lists and paragraph breaks with React rather than arbitrary HTML', () => {
        const html = renderToStaticMarkup(<LessonContent content={'## Mục tiêu\n- **Hiểu** đạo hàm\n- Vận dụng\n\nVí dụ:\nGiải từng bước.'}/>);
        expect(html).toContain('role="heading"'); expect(html).toContain('aria-level="2"');
        expect(html).toContain('&lt;strong&gt;Hiểu&lt;/strong&gt;'); expect(html).toContain('&lt;br/&gt;');
        expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
    });
    it('keeps multiline display math intact, including asterisks in math', () => {
        const html = renderToStaticMarkup(<LessonContent content={'Công thức:\n\n$$\n\\text{**ký hiệu**}\n\nx^2\n$$\n\nKết luận.'}/>);
        expect(html).toContain('$$\n'); expect(html).toContain('**ký hiệu**'); expect(html).not.toContain('&lt;strong&gt;');
    });
    it('delegates legacy LaTeX environments intact to the existing renderer', () => {
        const html = renderToStaticMarkup(<LessonContent content={'\\begin{ex}\nBài tập\n\\loigiai{Giải}\n\\end{ex}'}/>);
        expect(html).toContain('\\begin{ex}'); expect(html).toContain('\\loigiai{Giải}');
    });
});
