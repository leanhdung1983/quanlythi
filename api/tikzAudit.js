import crypto from 'crypto';

const TIKZ_TAG = /\\(begin|end)\s*\{\s*(tikzpicture|tkz-tab|tkz-euclide)\s*\}/gi;
const SVG_REFERENCE = /\[TIKZ_HASH:([a-f0-9]{64})\]/gi;
const ANY_REFERENCE = /\[TIKZ_HASH:([^\]]*)\]/gi;
const OTHER_DRAWING = /\\includegraphics(?:\s*\[[^\]]*\])?\s*\{|\\begin\s*\{\s*(?:pspicture|asy|asydef)\s*\}/i;

export const tikzHash = source => crypto.createHash('sha256').update(source).digest('hex');

export function extractTikzBlocks(source = '') {
    return inspectTikzStructure(source).blocks;
}

export function inspectTikzStructure(source = '') {
    const text = String(source || '');
    const blocks = [];
    const stack = [];
    const tags = new RegExp(TIKZ_TAG.source, TIKZ_TAG.flags);
    let malformed = false;
    for (const match of text.matchAll(tags)) {
        const type = match[1].toLowerCase();
        const environment = match[2].toLowerCase();
        if (type === 'begin') {
            stack.push({ environment, start: match.index });
        } else if (!stack.length || stack.at(-1).environment !== environment) {
            malformed = true;
            // Do not turn an incomplete outer drawing into an apparently valid SVG.
        } else {
            const opened = stack.pop();
            if (!stack.length) {
                const block = text.slice(opened.start, match.index + match[0].length);
                blocks.push({ source: block, hash: tikzHash(block) });
            }
        }
    }
    return { blocks, malformed: malformed || stack.length > 0 };
}

export function extractSvgReferences(source = '') {
    return [...String(source || '').matchAll(SVG_REFERENCE)].map(match => match[1].toLowerCase());
}

export function inspectTikzQuestion(question, existingHashes = new Set()) {
    const current = String(question.content_latex || '');
    const original = String(question.content_latex_original || '');
    const currentStructure = inspectTikzStructure(current);
    const currentBlocks = currentStructure.blocks;
    const originalBlocks = extractTikzBlocks(original);
    const originalByHash = new Map(originalBlocks.map(block => [block.hash, block.source]));
    const items = new Map();

    for (const block of currentBlocks) {
        const item = items.get(block.hash) || { hash: block.hash, source: block.source, raw: false, placeholder: false };
        item.raw = true;
        items.set(block.hash, item);
    }
    for (const hash of extractSvgReferences(current)) {
        const item = items.get(hash) || { hash, source: originalByHash.get(hash) || null, raw: false, placeholder: false };
        item.placeholder = true;
        items.set(hash, item);
    }

    const images = [...items.values()].map(item => ({
        ...item,
        exists: existingHashes.has(item.hash),
        needsAction: item.raw || !existingHashes.has(item.hash)
            || (item.placeholder && Number(question.is_tikz_rendered) !== 1),
    }));
    const missingSource = images.some(item => !item.exists && !item.source);
    const pending = images.some(item => item.needsAction);
    const orphanOriginal = originalBlocks.some(block => !items.has(block.hash));
    const invalidReferences = [...current.matchAll(ANY_REFERENCE)]
        .filter(match => !/^[a-f0-9]{64}$/i.test(match[1])).length;
    const otherDrawing = OTHER_DRAWING.test(current);
    const malformed = currentStructure.malformed || invalidReferences > 0;
    return {
        id: question.id,
        id_full: question.legacy_full_id || null,
        storedStatus: Number(question.is_tikz_rendered),
        status: malformed ? 'MALFORMED_SOURCE'
            : images.length === 0 ? (orphanOriginal ? 'SOURCE_MISMATCH' : otherDrawing ? 'OTHER_IMAGE' : 'NO_TIKZ')
            : missingSource ? 'MISSING_SOURCE' : pending ? 'PENDING'
                : orphanOriginal ? 'SOURCE_MISMATCH' : otherDrawing ? 'OTHER_IMAGE' : 'READY',
        images,
        orphanOriginal,
        otherDrawing,
        malformed,
        invalidReferences,
    };
}

export function replaceRenderedBlock(content, hash) {
    let result = String(content || '');
    for (const block of extractTikzBlocks(result)) {
        if (block.hash === hash) result = result.split(block.source).join(`[TIKZ_HASH:${hash}]`);
    }
    return result;
}
