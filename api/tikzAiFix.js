const FORBIDDEN_TEX = /\\(?:write18|input|include|openin|openout|read|usepackage|documentclass|immediate|csname)\b/i;

export function normalizeAiTikzFix(value) {
    let source = String(value || '').trim()
        .replace(/^```(?:latex|tex)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    if (FORBIDDEN_TEX.test(source)) return '';
    const environment = source.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/i)?.[0];
    if (environment) source = environment.trim();
    if (!source || source.length > 50000) return '';
    if (!/\\begin\{tikzpicture\}|\\tkzTab(?:Init|Line|Var)|\\begin\{axis\}/i.test(source)) return '';
    if ((source.match(/\\begin\{/g) || []).length !== (source.match(/\\end\{/g) || []).length) return '';
    return source;
}
