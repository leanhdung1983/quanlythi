

export const cleanLatexOutput = (text: string): string => {
  if (!text) return "";
  const codeBlockMatch = text.match(/```(?:latex)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();
  return text.trim();
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

export const findClosingBrace = (text: string, openBraceIndex: number): number => {
    let depth = 1;
    for (let i = openBraceIndex + 1; i < text.length; i++) {
        if (text[i] === '\\') { i++; continue; }
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        if (depth === 0) return i;
    }
    return -1;
};

export const stripComments = (text: string): string => {
    if (!text) return "";
    return text.replace(/^\s*%.*$/gm, '').replace(/([^\\])%.*$/gm, '$1');
};

const wrapNakedMathCommands = (text: string): string => {
    // Regex này tìm các lệnh math common (mathscr, mathcal, mathbb, vec) 
    // KHÔNG nằm sau dấu $ hoặc \[
    const commands = ['mathscr', 'mathcal', 'mathbb', 'vec', 'hoac', 'heva'];
    let result = text;

    commands.forEach(cmd => {
        const regex = new RegExp(`(?<![\\$\\s\\\\])\\\\\\b${cmd}\\b\\s*\\{`, 'g');
        result = result.replace(regex, (match, offset) => {
            const before = result.substring(0, offset);
            const dollarCount = (before.match(/\$/g) || []).length;
            if (dollarCount % 2 === 0) { // Đang ở văn bản thường
                const openIdx = offset + match.length - 1;
                const closeIdx = findClosingBrace(result, openIdx);
                if (closeIdx !== -1) {
                    const content = result.substring(offset, closeIdx + 1);
                    return `$${content}$`;
                }
            }
            return match;
        });
    });
    return result;
};

export const unwrapImmini = (text: string): string => {
    let result = text;
    let loopCount = 0;
    while (loopCount < 200) {
        loopCount++;
        const idx = result.indexOf('\\immini');
        if (idx === -1) break;
        let currentPos = idx + 7;
        while (currentPos < result.length && /\s/.test(result[currentPos])) currentPos++;
        if (result[currentPos] === '[') {
            const closeOpt = result.indexOf(']', currentPos);
            if (closeOpt !== -1) currentPos = closeOpt + 1;
            while (currentPos < result.length && /\s/.test(result[currentPos])) currentPos++;
        }
        if (result[currentPos] !== '{') { result = result.substring(0, idx) + result.substring(currentPos); continue; }
        const open1 = currentPos;
        const close1 = findClosingBrace(result, open1);
        if (close1 === -1) break;
        let open2 = close1 + 1;
        while (open2 < result.length && /\s/.test(result[open2])) open2++;
        if (result[open2] !== '{') {
             const textPart = result.substring(open1 + 1, close1);
             result = result.substring(0, idx) + textPart + result.substring(close1 + 1);
             continue;
        }
        const close2 = findClosingBrace(result, open2);
        if (close2 === -1) break;
        result = result.substring(0, idx) + `${result.substring(open1 + 1, close1).trim()}\n\n${result.substring(open2 + 1, close2).trim()}` + result.substring(close2 + 1);
    }
    return result;
};

export const normalizeLatexString = (latex: string): string => {
    let s = latex;
    s = wrapNakedMathCommands(s);
    
    const envs = ['ex', 'bt', 'vd', 'enumerate', 'itemize', 'align', 'tikzpicture', 'cases', 'aligned'];
    envs.forEach(env => {
        const regex = new RegExp(`\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`, 'g');
        s = s.replace(regex, (match, content) => `\\begin{${env}}\n${content.trim()}\n\\end{${env}}`);
    });

    s = unwrapImmini(s);
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
};

export const splitContentAndImage = (text: string): { textPart: string, imagePart: string | null } => {
    // 1. Detect TikZ
    const tikzRegex = /(\\begin\s*\{\s*tikzpicture\s*\}[\s\S]*?\\end\s*\{\s*tikzpicture\s*\})/i;
    const tikzMatch = text.match(tikzRegex);
    if (tikzMatch) {
        return { textPart: text.replace(tikzMatch[0], '').trim(), imagePart: tikzMatch[0] };
    }
    
    // 2. Detect \includegraphics
    // Matches \includegraphics[...]{filename} or \includegraphics{filename}
    // Simple naive regex, assumes no nested braces in options
    const imgRegex = /\\includegraphics(?:\[.*?\])?\{.*?\}/i;
    const imgMatch = text.match(imgRegex);
    if (imgMatch) {
        // Not currently supported by renderer, but extracting it separates layout
        // For now, treat it as text since we can't render local images without URL
        // BUT if it's TikZ, above caught it.
    }

    return { textPart: text, imagePart: null };
};
