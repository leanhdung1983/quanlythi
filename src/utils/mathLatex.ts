const MATH_SEGMENT_PATTERN = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?:\$)(?:[^\$\\]|\\[\s\S])*?\$|\\begin\s*\{(?:align\*?|aligned\*?|eqnarray\*?|cases|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|array|tabular|longtable|tabular\*)\}[\s\S]*?\\end\s*\{(?:align\*?|aligned\*?|eqnarray\*?|cases|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|array|tabular|longtable|tabular\*)\})/g;

export const KATEX_MACROS: Record<string, string> = {
    '\\heva': '\\left\\{\\begin{aligned}#1\\end{aligned}\\right.',
    '\\hoac': '\\left[\\begin{aligned}#1\\end{aligned}\\right.',
    '\\True': '\\checkmark',
    '\\deg': '^{\\circ}',
    '\\degree': '^{\\circ}',
    '\\vct': '\\vec{#1}',
    '\\vv': '\\vec{#1}',
    '\\wideparen': '\\overset{\\frown}{#1}'
};

const NAKED_SYMBOLS = [
    'nparallel', 'parallel', 'perp', 'triangle', 'angle', 'wideangle',
    'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'rightarrow', 'leftarrow', 'mapsto', 'to',
    'alpha', 'beta', 'gamma', 'delta', 'Delta', 'epsilon', 'varepsilon', 'theta', 'Theta',
    'lambda', 'mu', 'pi', 'rho', 'sigma', 'Sigma', 'phi', 'varphi', 'omega', 'Omega',
    'sim', 'simeq', 'cong', 'equiv', 'approx', 'neq', 'ne', 'leq', 'le', 'geq', 'ge',
    'pm', 'mp', 'times', 'div', 'cdot', 'circ', 'cap', 'cup', 'in', 'notin', 'subset',
    'subseteq', 'supset', 'supseteq', 'infty', 'exists', 'forall', 'varnothing', 'emptyset'
];

const symbolPattern = new RegExp(`\\\\(?:${NAKED_SYMBOLS.join('|')})(?![A-Za-z])`, 'g');
const commandWithArgumentPattern = /\\(?:overrightarrow|overleftarrow|overline|underline|widehat|wideparen|vec|vct|sqrt|mathbb|mathcal|mathrm|mathbf|operatorname)\s*(?:\[[^\]]*\])?\s*\{(?:[^{}]|\{[^{}]*\})*\}/g;
const systemCommandPattern = /\\(?:heva|hoac)\s*\{(?:[^{}]|\{[^{}]*\})*\}/g;
const negatedRelationPattern = /\\not\s*\\(?:parallel|perp|sim|in|subset|supset|equiv)/g;
const nakedCommandPattern = new RegExp(
    `${negatedRelationPattern.source}|${commandWithArgumentPattern.source}|${systemCommandPattern.source}|${symbolPattern.source}`,
    'g'
);

const isMathSegment = (part: string) => part.startsWith('$') || part.startsWith('\\(') || part.startsWith('\\[') || /^\\begin\s*\{/.test(part);

/** Wraps supported LaTeX commands that occur in prose so KaTeX receives them in math mode. */
export const prepareLatexForRendering = (input: string): string => {
    const normalized = input
        .replace(/\\rq\s?/g, "'")
        .replace(/\\lq\s?/g, '`')
        .replace(/\\begin\s*\{eqnarray\*?\}/gi, '\\begin{aligned}')
        .replace(/\\end\s*\{eqnarray\*?\}/gi, '\\end{aligned}');

    return normalized.split(MATH_SEGMENT_PATTERN).map(part => {
        if (!part || isMathSegment(part)) return part;
        return part.replace(nakedCommandPattern, match => `\\(${match}\\)`);
    }).join('');
};

export const splitLatexSegments = (input: string): string[] => input.split(MATH_SEGMENT_PATTERN);
