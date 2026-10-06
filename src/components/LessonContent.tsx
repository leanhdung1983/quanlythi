import React from 'react';
import { MathRenderer } from './MathRenderer';
import { splitLatexSegments } from '../utils/mathLatex';

// Render lesson Markdown with React layout, leaving math and legacy LaTeX to
// the established sanitized renderer. Never render AI-authored HTML directly.
export const LessonContent: React.FC<{ content: string }> = ({ content }) => {
    if (/\\begin\s*\{/.test(content)) return <MathRenderer content={content} hideToolbar/>;
    const blocks: { kind: 'text' | 'heading' | 'item'; text: string; level?: number }[] = [];
    let buffer: string[] = []; let display = false;
    const flush = () => { if (buffer.length) { blocks.push({ kind: 'text', text: buffer.join('\n') }); buffer = []; } };
    for (const line of content.split(/\r?\n/)) {
        const delimiters = line.match(/(?<!\\)\$\$/g)?.length || 0;
        const wasDisplay = display;
        if (delimiters % 2) display = !display;
        if (wasDisplay || display || delimiters) { buffer.push(line); continue; }
        if (!line.trim()) { flush(); continue; }
        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
        if (heading || item) { flush(); blocks.push(heading ? { kind: 'heading', text: heading[2], level: heading[1].length } : { kind: 'item', text: item![1] }); }
        else buffer.push(line);
    }
    flush();
    const formatted = (text: string) => splitLatexSegments(text).map(segment => {
        if (segment.startsWith('$') || segment.startsWith('\\(') || segment.startsWith('\\[')) return segment;
        return segment.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>').replace(/\n/g, '<br/>');
    }).join('');
    return <div className="space-y-3 text-slate-700 leading-7">{blocks.map((b, i) => b.kind === 'heading'
        ? <div key={i} role="heading" aria-level={b.level} className={`${b.level === 1 ? 'text-xl' : 'text-lg'} font-bold text-slate-900`}><MathRenderer content={formatted(b.text)} hideToolbar/></div>
        : b.kind === 'item' ? <div key={i} className="flex items-start gap-2"><span aria-hidden="true" className="text-indigo-500">•</span><div className="min-w-0 flex-1"><MathRenderer content={formatted(b.text)} hideToolbar/></div></div>
        : <MathRenderer key={i} content={formatted(b.text)} hideToolbar/>)}</div>;
};
