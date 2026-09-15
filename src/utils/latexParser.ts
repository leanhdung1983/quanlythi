import { OnlineQuestion, QuestionType } from '../types';
import { unwrapImmini, stripComments, findClosingBrace } from './fileUtils';

/**
 * Fisher-Yates array shuffle.
 * Clones the array to prevent unexpected mutations.
 */
export function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Strips \loigiai{...} block from LaTeX text.
 */
export const stripExTestSolution = (text: string): string => {
    let res = text;
    const loigiaiIndex = res.indexOf('\\loigiai');
    if (loigiaiIndex !== -1) {
        const openBrace = res.indexOf('{', loigiaiIndex);
        if (openBrace !== -1) {
            const closeBrace = findClosingBrace(res, openBrace);
            if (closeBrace !== -1) {
                res = res.substring(0, loigiaiIndex) + res.substring(closeBrace + 1);
            }
        }
    }
    return res;
};

/**
 * Strips multiple choice commands (\choice, \choiceTF, \shortans) from LaTeX text.
 */
export const stripExTestChoices = (text: string): string => {
    let res = text;
    const commands = ['\\choice', '\\choiceTF', '\\shortans'];
    commands.forEach(cmd => {
        let idx = res.indexOf(cmd);
        while (idx !== -1) {
            const openBrace = res.indexOf('{', idx);
            if (openBrace !== -1) {
                const closeBrace = findClosingBrace(res, openBrace);
                if (closeBrace !== -1) {
                    if (cmd === '\\choice' || cmd === '\\choiceTF') {
                        let lastBrace = closeBrace;
                        for (let i = 0; i < 3; i++) {
                            const nextOpen = res.indexOf('{', lastBrace + 1);
                            if (nextOpen !== -1) {
                                const between = res.substring(lastBrace + 1, nextOpen);
                                if (/^\s*$/.test(between)) {
                                    const nextClose = findClosingBrace(res, nextOpen);
                                    if (nextClose !== -1) lastBrace = nextClose;
                                    else break;
                                } else break;
                            } else break;
                        }
                        res = res.substring(0, idx) + res.substring(lastBrace + 1);
                    } else if (cmd === '\\shortans') {
                        res = res.substring(0, idx) + ' \\dots ' + res.substring(closeBrace + 1);
                    } else {
                        res = res.substring(0, idx) + res.substring(closeBrace + 1);
                    }
                } else break;
            } else break;
            idx = res.indexOf(cmd, idx + 1);
        }
    });
    return res;
};

/**
 * Extracts solution string from \loigiai{...} or \begin{loigiai}...\end{loigiai}.
 */
export const extractExTestSolution = (text: string): string => {
    const loigiaiIndex = text.indexOf('\\loigiai');
    if (loigiaiIndex !== -1) {
        let currentPos = loigiaiIndex + 8;
        while (currentPos < text.length && /\s/.test(text[currentPos])) currentPos++;
        if (text[currentPos] === '[') {
            const closeOpt = text.indexOf(']', currentPos);
            if (closeOpt !== -1) currentPos = closeOpt + 1;
            while (currentPos < text.length && /\s/.test(text[currentPos])) currentPos++;
        }
        
        if (text[currentPos] === '{') {
            const openBrace = currentPos;
            const closeBrace = findClosingBrace(text, openBrace);
            if (closeBrace !== -1) {
                return text.substring(openBrace + 1, closeBrace);
            }
        }
    }
    
    const envMatch = text.match(/\\begin\s*\{loigiai\}(?:\[.*?\])?([\s\S]*?)\\end\s*\{loigiai\}/i);
    if (envMatch) return envMatch[1];

    return text;
};

/**
 * Standardized question content parser for OnlineExam, AdaptiveTest, and QuestionBank.
 * Handles extracting solution, shortans, choices, unwrapping environments, and building option lists.
 */
export const parseQuestionContent = (q: OnlineQuestion, skipShuffle: boolean = false): OnlineQuestion => {
    let text = q.original_latex || q.content || q['raw_latex'] || ''; 
    let solution = q.solution || '';
    let correctAnswer = q.correctAnswer || '';

    // Extract Solution (\loigiai)
    const loigiaiRegex = /\\loigiai\s*(?:\[[^\]]*\])?\s*\{/g;
    let match;
    while ((match = loigiaiRegex.exec(text)) !== null) {
        let depth = 1;
        const startIndex = match.index;
        const contentStartIndex = startIndex + match[0].length;
        let endIndex = -1;
        for (let i = contentStartIndex; i < text.length; i++) {
            if (text[i] === '{') depth++; else if (text[i] === '}') depth--;
            if (depth === 0) { endIndex = i; break; }
        }
        if (endIndex !== -1) {
            const fullBlock = text.substring(startIndex, endIndex + 1);
            const contentInside = text.substring(contentStartIndex, endIndex);
            solution += (solution ? '\n\n' : '') + contentInside;
            text = text.replace(fullBlock, '');
            loigiaiRegex.lastIndex = 0; 
        }
    }

    // Extract Short Answer (\shortans)
    const shortAnsRegex = /\\shortans\s*(?:\[[^\]]*\])?\s*\{/g;
    while ((match = shortAnsRegex.exec(text)) !== null) {
        let depth = 1;
        const startIndex = match.index;
        const contentStartIndex = startIndex + match[0].length;
        let endIndex = -1;
        for (let i = contentStartIndex; i < text.length; i++) {
            if (text[i] === '{') depth++; else if (text[i] === '}') depth--;
            if (depth === 0) { endIndex = i; break; }
        }
        if (endIndex !== -1) {
            const fullBlock = text.substring(startIndex, endIndex + 1);
            const contentInside = text.substring(contentStartIndex, endIndex);
            correctAnswer = contentInside.replace(/\$/g, '').trim();
            text = text.replace(fullBlock, '');
            shortAnsRegex.lastIndex = 0;
        }
    }

    text = text.replace(/\\begin\{ex\}/g, '').replace(/\\end\{ex\}/g, '');
    text = unwrapImmini(stripComments(text));

    // Remove unwanted strings and redundant "Câu X" prefixes
    const unwantedRegex = /(?:\\textcolor\{red\}\{)?\s*Câu (?:dưới\s+)?(?:đây|này) dùng môi trường \{?chc\}? mới đúng\.?!\s*;?\s*\}?|Câu \d+[\.:\s]*/gi;
    text = text.replace(unwantedRegex, "").trim();
    
    let type = q.type;
    if (!type) {
        if (text.includes('\\choiceTF')) type = QuestionType.TF;
        else if (text.includes('\\choice')) type = QuestionType.TN;
        else if (correctAnswer) type = QuestionType.KQ; 
    }

    // Parse Multiple Choice (TN)
    if (type === QuestionType.TN) {
        const choiceIdx = text.search(/\\choice/i);
        let stem = text;
        let options: { content: string, isCorrect: boolean, id?: string, originalIndex?: number }[] = [];

        if (choiceIdx !== -1) {
            stem = text.substring(0, choiceIdx).trim();
            const choicePart = text.substring(choiceIdx);
            
            const openBraceIdx = choicePart.indexOf('{');
            if (openBraceIdx !== -1) {
                const afterChoice = choicePart.substring(openBraceIdx);
                let currentOption = '';
                let depth = 0;
                let lastParsedIndex = 0;
                let optIndex = 0;
                for (let i = 0; i < afterChoice.length; i++) {
                    const char = afterChoice[i];
                    if (char === '{') { 
                        if (depth === 0) currentOption = ''; 
                        else currentOption += char; 
                        depth++; 
                    } else if (char === '}') {
                        depth--;
                        if (depth === 0) {
                            let content = currentOption;
                            let isCorrect = false;
                            if (/\\True/i.test(content)) { 
                                isCorrect = true; 
                                content = content.replace(/\\True\s*/gi, ''); 
                            }
                            options.push({ content: content.trim(), isCorrect, originalIndex: optIndex++ });
                            lastParsedIndex = i + 1;
                            if (options.length >= 4) break;
                        } else { 
                            currentOption += char; 
                        }
                    } else if (depth > 0) { 
                        currentOption += char; 
                    }
                }
                const remaining = afterChoice.substring(lastParsedIndex).trim();
                if (remaining) stem += '\n\n' + remaining;
            }
        }

        if (options.length > 0) {
            if (!skipShuffle) {
                options = shuffleArray(options);
            }
            const labels = ['A', 'B', 'C', 'D'];
            const finalOptions = options.map((opt, idx) => ({ ...opt, id: labels[idx] || '?' }));
            return { ...q, type, content: stem, options: finalOptions as OnlineQuestion['options'], solution, correctAnswer };
        }
    } else if (type === QuestionType.TF) {
        // Parse True/False (TF)
        const choiceIdx = text.search(/\\choiceTF/i);
        let stem = text;
        const options: { id: string, content: string, isCorrect: boolean }[] = [];

        if (choiceIdx !== -1) {
            stem = text.substring(0, choiceIdx).trim();
            const choicePart = text.substring(choiceIdx);

            const openBraceIdx = choicePart.indexOf('{');
            if (openBraceIdx !== -1) {
                const afterChoice = choicePart.substring(openBraceIdx);
                let currentBlock = '';
                let depth = 0;
                const blocks: string[] = [];
                let lastParsedIndex = 0;
                
                for (let i = 0; i < afterChoice.length; i++) {
                    const char = afterChoice[i];
                    if (char === '{') { 
                        if (depth === 0) currentBlock = ''; 
                        else currentBlock += char; 
                        depth++; 
                    } else if (char === '}') {
                        depth--;
                        if (depth === 0) {
                            blocks.push(currentBlock.trim());
                            lastParsedIndex = i + 1;
                            if (blocks.length >= 4) break;
                        } else { 
                            currentBlock += char; 
                        }
                    } else if (depth > 0) { 
                        currentBlock += char; 
                    }
                }
                
                for (let i = 0; i < blocks.length; i++) {
                    const content = blocks[i];
                    const isTrue = /\\True/i.test(content);
                    options.push({ id: String(i + 1), content: content.replace(/\\True\s*/gi, '').trim(), isCorrect: isTrue });
                }
                
                const remaining = afterChoice.substring(lastParsedIndex).trim();
                if (remaining) stem += '\n\n' + remaining;
            }
        }
        if (options.length > 0) return { ...q, type, content: stem, options, solution, correctAnswer };
    }

    return { ...q, type, content: text, solution, correctAnswer, options: q.options || [] };
};
