const LEGACY_LEVELS = Object.freeze({ Y: 'N', B: 'H', K: 'V', G: 'C', T: 'C' });
const VALID_GRADES = new Set(['0', '1', '2', '6', '7', '8', '9']);
const VALID_SUBJECTS = new Set(['D', 'H', 'C']);
const VALID_LEVELS = new Set(['N', 'H', 'V', 'C']);
const ID_PATTERN = /(?:^|[^A-Z0-9])(10|11|12|[0126789])\s*([DHC])\s*(\d+)\s*([NHVCXYBKGT])\s*(\d+)\s*[-_]\s*(\d+)(?=$|[^A-Z0-9])/i;

export function parseId6(value) {
    if (typeof value !== 'string') return null;
    const match = ` ${value.trim()} `.match(ID_PATTERN);
    if (!match) return null;
    const grade = match[1] === '10' ? '0' : match[1] === '11' ? '1' : match[1] === '12' ? '2' : match[1];
    const subject = match[2].toUpperCase();
    const rawLevel = match[4].toUpperCase();
    const level = LEGACY_LEVELS[rawLevel] || rawLevel;
    if (!VALID_GRADES.has(grade) || !VALID_SUBJECTS.has(subject) || !VALID_LEVELS.has(level)) return null;
    return {
        grade,
        subject,
        chapter: Number(match[3]),
        level,
        unit: Number(match[5]),
        count: Number(match[6]),
        isLegacy: rawLevel !== level || ['10', '11', '12'].includes(match[1]),
        normalized: `${grade}${subject}${Number(match[3])}${level}${Number(match[5])}-${Number(match[6])}`
    };
}

export function normalizeId6(value) {
    return parseId6(value)?.normalized || '';
}

export function extractSourceId(source) {
    if (typeof source !== 'string') return '';
    const firstPart = source.slice(0, 500);
    const explicit = firstPart.match(/%\s*\[([^\]\r\n]+)\]|\$\s*\[([^\]\r\n]+)\]|\\begin\{(?:ex|bt|vd|cau|bai|tuluan|tl)\}\s*\[([^\]]+)\]/i);
    return normalizeId6(explicit?.[1] || explicit?.[2] || explicit?.[3] || '');
}

export function injectCanonicalId(source, id) {
    if (typeof source !== 'string') return '';
    const normalizedId = normalizeId6(id);
    if (!normalizedId) return source;
    let result = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    result = result.replace(/^\s*```(?:latex|tex)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '');
    result = result.replace(/\\begin\{(?:bt|vd|cau|bai|tuluan|tl)\}/gi, '\\begin{ex}')
        .replace(/\\end\{(?:bt|vd|cau|bai|tuluan|tl)\}/gi, '\\end{ex}');
    result = result.replace(/[%$]\s*\[\s*(?:10|11|12|[0126789])\s*[DHC]\s*\d+\s*[NHVCXYBKGT]\s*\d+\s*[-_]\s*\d+\s*\]\s*\n?/gi, '');
    result = result.replace(/(\\begin\{ex\})\s*\[\s*(?:10|11|12|[0126789])\s*[DHC]\s*\d+\s*[NHVCXYBKGT]\s*\d+\s*[-_]\s*\d+\s*\]/gi, '$1');
    return result.replace(/\\begin\{ex\}/i, `\\begin{ex}\n%[${normalizedId}]`).trim();
}

export function normalizeQuestionSource(source, id) {
    const before = typeof source === 'string' ? source : '';
    let after = before.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim();
    after = after.replace(/^```(?:latex|tex)?\s*\n?/i, '').replace(/\n?```$/i, '').trim();
    after = after.replace(/\\begin\{(?:bt|vd|cau|bai|tuluan|tl)\}/gi, '\\begin{ex}')
        .replace(/\\end\{(?:bt|vd|cau|bai|tuluan|tl)\}/gi, '\\end{ex}');
    if (normalizeId6(id)) after = injectCanonicalId(after, id);
    return { source: after, changed: after !== before };
}

export function inspectQuestionId(question, metadataById) {
    const rawId = String(question.legacy_full_id || '').trim();
    const parsed = parseId6(rawId);
    const normalized = parsed?.normalized || '';
    const sourceId = extractSourceId(question.content_latex || '');
    const metadata = normalized ? metadataById.get(normalized) : null;
    const issues = [];
    if (!rawId || /^(UNKNOWN|\?+)/i.test(rawId)) issues.push('ID_MISSING');
    else if (!parsed) issues.push('ID_MALFORMED');
    if (parsed?.isLegacy || (parsed && rawId.replace(/[\[\]\s]/g, '').toUpperCase() !== normalized)) issues.push('ID_LEGACY');
    if (normalized && !metadata) issues.push('ID_UNKNOWN');
    if (sourceId && normalized && sourceId !== normalized) issues.push('ID_SOURCE_MISMATCH');
    if (!sourceId && normalized) issues.push('ID_NOT_IN_SOURCE');
    if (metadata?.unit_id && question.unit_id && Number(metadata.unit_id) !== Number(question.unit_id)) issues.push('ID_UNIT_MISMATCH');
    if (metadata?.level_id && question.level_id && Number(metadata.level_id) !== Number(question.level_id)) issues.push('ID_LEVEL_MISMATCH');
    return { normalized, sourceId, metadata, issues, suggestedId: metadata ? normalized : (sourceId && metadataById.has(sourceId) ? sourceId : '') };
}
