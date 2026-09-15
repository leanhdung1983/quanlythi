import { describe, expect, it } from 'vitest';
import { extractTikzBlocks, inspectTikzQuestion, inspectTikzStructure, replaceRenderedBlock, tikzHash } from './tikzAudit.js';

const block = '\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}';
const hash = tikzHash(block);
const question = (content, original = null, status = 0) => ({
    id: 1, legacy_full_id: 'X', content_latex: content, content_latex_original: original, is_tikz_rendered: status,
});

describe('TikZ audit', () => {
    it('hashes exact source and extracts matching environment', () => {
        expect(extractTikzBlocks(block)).toEqual([{ source: block, hash }]);
        expect(extractTikzBlocks('\\begin{tikzpicture}x\\end{tkz-tab}')).toEqual([]);
    });
    it('detects raw blocks regardless of stored status', () => {
        expect(inspectTikzQuestion(question(block, null, 1)).status).toBe('PENDING');
    });
    it('detects missing SVG behind a placeholder and recovers original source', () => {
        const audit = inspectTikzQuestion(question(`[TIKZ_HASH:${hash}]`, block, 1));
        expect(audit.status).toBe('PENDING');
        expect(audit.images[0].source).toBe(block);
    });
    it('flags unrecoverable placeholder without source', () => {
        expect(inspectTikzQuestion(question(`[TIKZ_HASH:${hash}]`)).status).toBe('MISSING_SOURCE');
    });
    it('checks SVG existence instead of trusting status', () => {
        expect(inspectTikzQuestion(question(`[TIKZ_HASH:${hash}]`, block, 1), new Set([hash])).status).toBe('READY');
    });
    it('only replaces the intended block', () => {
        const other = '\\begin{tikzpicture}\\draw (2,2);\\end{tikzpicture}';
        expect(replaceRenderedBlock(block + other, hash)).toBe(`[TIKZ_HASH:${hash}]` + other);
    });
    it('flags original TikZ not linked in current content', () => {
        expect(inspectTikzQuestion(question('Câu hỏi', block)).status).toBe('SOURCE_MISMATCH');
    });
    it('keeps nested drawing environments together as one drawing', () => {
        const nested = '\\begin{tikzpicture}\\begin{tkz-tab}x\\end{tkz-tab}\\end{tikzpicture}';
        expect(extractTikzBlocks(nested)).toEqual([{ source: nested, hash: tikzHash(nested) }]);
    });
    it('flags unfinished drawings and malformed placeholders instead of marking complete', () => {
        expect(inspectTikzStructure('\\begin{tikzpicture}x').malformed).toBe(true);
        expect(inspectTikzQuestion(question('\\begin{tikzpicture}x', null, 1)).status).toBe('MALFORMED_SOURCE');
        expect(inspectTikzQuestion(question('[TIKZ_HASH:broken]', null, 1)).status).toBe('MALFORMED_SOURCE');
    });
    it('distinguishes other image formats from questions without drawings', () => {
        expect(inspectTikzQuestion(question('\\includegraphics{a.pdf}', null, 2)).status).toBe('OTHER_IMAGE');
    });
    it('reconciles a placeholder with an existing SVG when the stored state is stale', () => {
        expect(inspectTikzQuestion(question(`[TIKZ_HASH:${hash}]`, block, 0), new Set([hash])).status).toBe('PENDING');
    });
    it('does not call a multi-image question complete while one drawing is raw or its SVG is absent', () => {
        const second = '\\begin{tikzpicture}\\draw (2,2);\\end{tikzpicture}';
        const secondHash = tikzHash(second);
        const current = `[TIKZ_HASH:${hash}]` + second;
        expect(inspectTikzQuestion(question(current, block + second, 0), new Set([hash])).status).toBe('PENDING');
        expect(inspectTikzQuestion(question(replaceRenderedBlock(current, secondHash), block + second, 1), new Set([hash])).status).toBe('PENDING');
        expect(inspectTikzQuestion(question(replaceRenderedBlock(current, secondHash), block + second, 1), new Set([hash, secondHash])).status).toBe('READY');
    });
});
