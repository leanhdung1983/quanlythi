/**
 * Exam Security Module
 * 
 * Provides server-side answer extraction and LaTeX sanitization.
 * Strips \loigiai, \True, and \shortans before exam questions are sent to client browsers.
 */

/**
 * Strips \loigiai{...} from LaTeX content using proper brace depth matching.
 */
export function stripLoigiai(latex) {
    if (typeof latex !== 'string') return { cleaned: '', solution: '' };
    let text = latex;
    let solution = '';
    const loigiaiRegex = /\\loigiai\s*(?:\[[^\]]*\])?\s*\{/g;
    let match;

    while ((match = loigiaiRegex.exec(text)) !== null) {
        let depth = 1;
        const startIndex = match.index;
        const contentStartIndex = startIndex + match[0].length;
        let endIndex = -1;
        for (let i = contentStartIndex; i < text.length; i++) {
            if (text[i] === '\\') {
                i++; // Skip escaped characters like \{ or \}
                continue;
            }
            if (text[i] === '{') depth++;
            else if (text[i] === '}') depth--;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
        if (endIndex !== -1) {
            const fullBlock = text.substring(startIndex, endIndex + 1);
            const contentInside = text.substring(contentStartIndex, endIndex);
            solution += (solution ? '\n\n' : '') + contentInside.trim();
            text = text.substring(0, startIndex) + text.substring(endIndex + 1);
            loigiaiRegex.lastIndex = startIndex; // Continue from where the block was removed
        } else {
            break;
        }
    }
    return { cleaned: text.trim(), solution: solution.trim() };
}

/**
 * Strips \shortans{...} answers from LaTeX content and returns extracted answer.
 */
export function stripShortans(latex) {
    if (typeof latex !== 'string') return { cleaned: '', shortAnswer: '' };
    let text = latex;
    let shortAnswer = '';
    const shortAnsRegex = /\\shortans\s*(?:\[[^\]]*\])?\s*\{/g;
    let match;

    while ((match = shortAnsRegex.exec(text)) !== null) {
        let depth = 1;
        const startIndex = match.index;
        const contentStartIndex = startIndex + match[0].length;
        let endIndex = -1;
        for (let i = contentStartIndex; i < text.length; i++) {
            if (text[i] === '\\') {
                i++;
                continue;
            }
            if (text[i] === '{') depth++;
            else if (text[i] === '}') depth--;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
        if (endIndex !== -1) {
            const contentInside = text.substring(contentStartIndex, endIndex);
            shortAnswer = contentInside.replace(/\$/g, '').trim();
            text = text.substring(0, startIndex) + text.substring(endIndex + 1);
            shortAnsRegex.lastIndex = startIndex;
        } else {
            break;
        }
    }
    return { cleaned: text.trim(), shortAnswer };
}

/**
 * Extracts \True positions and strips \True markers from \choice or \choiceTF.
 */
export function stripTrueMarkers(latex) {
    if (typeof latex !== 'string') return { cleaned: '', correctIndices: [], tfMap: {} };
    let text = latex;
    const correctIndices = [];
    const tfMap = {};

    // 1. Process \choice for Multiple Choice (TN)
    const choiceMatch = text.match(/\\choice\s*\{/i);
    if (choiceMatch) {
        const choiceIdx = choiceMatch.index;
        const beforeChoice = text.substring(0, choiceIdx);
        const choicePart = text.substring(choiceIdx);
        const openBraceIdx = choicePart.indexOf('{');
        const afterChoice = choicePart.substring(openBraceIdx);

        let depth = 0;
        let currentOption = '';
        let optIndex = 0;
        let newChoicePart = '\\choice';

        for (let i = 0; i < afterChoice.length; i++) {
            const char = afterChoice[i];
            if (char === '\\') {
                // Check if this is \True
                const rest = afterChoice.substring(i);
                const trueMatch = rest.match(/^\\True\b/i);
                if (trueMatch && depth === 1) {
                    correctIndices.push(optIndex);
                    i += trueMatch[0].length - 1;
                    continue;
                }
                currentOption += char;
                if (i + 1 < afterChoice.length) {
                    currentOption += afterChoice[i + 1];
                    i++;
                }
                continue;
            }
            if (char === '{') {
                if (depth === 0) currentOption = '';
                else currentOption += char;
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    newChoicePart += '{' + currentOption.replace(/\\True\s*/gi, '').trim() + '}';
                    optIndex++;
                    if (optIndex >= 4) {
                        newChoicePart += afterChoice.substring(i + 1);
                        break;
                    }
                } else {
                    currentOption += char;
                }
            } else if (depth > 0) {
                currentOption += char;
            }
        }
        text = beforeChoice + newChoicePart;
    }

    // 2. Process \choiceTF for True/False (TF)
    const choiceTFMatch = text.match(/\\choiceTF\s*\{/i);
    if (choiceTFMatch) {
        const choiceIdx = choiceTFMatch.index;
        const beforeChoice = text.substring(0, choiceIdx);
        const choicePart = text.substring(choiceIdx);
        const openBraceIdx = choicePart.indexOf('{');
        const afterChoice = choicePart.substring(openBraceIdx);

        let depth = 0;
        let currentOption = '';
        let optIndex = 0;
        let newChoicePart = '\\choiceTF';

        for (let i = 0; i < afterChoice.length; i++) {
            const char = afterChoice[i];
            if (char === '\\') {
                const rest = afterChoice.substring(i);
                const trueMatch = rest.match(/^\\True\b/i);
                if (trueMatch && depth === 1) {
                    tfMap[String(optIndex + 1)] = true;
                    i += trueMatch[0].length - 1;
                    continue;
                }
                currentOption += char;
                if (i + 1 < afterChoice.length) {
                    currentOption += afterChoice[i + 1];
                    i++;
                }
                continue;
            }
            if (char === '{') {
                if (depth === 0) currentOption = '';
                else currentOption += char;
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    if (tfMap[String(optIndex + 1)] === undefined) {
                        tfMap[String(optIndex + 1)] = false;
                    }
                    newChoicePart += '{' + currentOption.replace(/\\True\s*/gi, '').trim() + '}';
                    optIndex++;
                    if (optIndex >= 4) {
                        newChoicePart += afterChoice.substring(i + 1);
                        break;
                    }
                } else {
                    currentOption += char;
                }
            } else if (depth > 0) {
                currentOption += char;
            }
        }
        text = beforeChoice + newChoicePart;
    }

    // Secondary pass: ensure any remaining \True tokens are sanitized
    text = text.replace(/\\True\s*/gi, '');

    return { cleaned: text, correctIndices, tfMap };
}

/**
 * Sanitizes a question for delivery to an active exam student.
 * Returns { sanitizedQuestion, answerKey }
 */
export function sanitizeQuestionForStudent(q) {
    const rawLatex = q.content_latex || q.content || q.raw_latex || '';
    
    // 1. Strip solution (\loigiai)
    const { cleaned: noLoigiai, solution } = stripLoigiai(rawLatex);
    
    // 2. Strip short answer (\shortans)
    const { cleaned: noShortans, shortAnswer } = stripShortans(noLoigiai);
    
    // 3. Strip \True markers from choices
    const { cleaned: sanitizedLatex, correctIndices, tfMap } = stripTrueMarkers(noShortans);

    const answerKey = {
        id: q.id,
        type: q.type,
        solution,
        shortAnswer: shortAnswer || q.correctAnswer || '',
        correctIndices,
        tfMap
    };

    // Construct student-safe question without answers or solution
    const sanitizedQuestion = {
        ...q,
        content: sanitizedLatex,
        content_latex: sanitizedLatex,
        original_latex: undefined,
        solution: undefined,
        correctAnswer: undefined,
        options: Array.isArray(q.options) 
            ? q.options.map(opt => ({ ...opt, isCorrect: false }))
            : []
    };

    return { sanitizedQuestion, answerKey };
}

/**
 * Rehydrates trusted answer keys onto question objects on the server
 * by matching against authoritative database records.
 * Prevents any client-side tampering of answer keys.
 */
export function rehydrateTrustedQuestions(clientQuestions, dbQuestionsMap) {
    if (!Array.isArray(clientQuestions)) return [];
    
    return clientQuestions.map(clientQ => {
        const dbQ = dbQuestionsMap.get(Number(clientQ.id));
        if (!dbQ) {
            return clientQ;
        }

        const rawLatex = dbQ.content_latex || dbQ.content_latex_original || '';
        const { solution } = stripLoigiai(rawLatex);
        const { shortAnswer } = stripShortans(rawLatex);
        const { correctIndices, tfMap } = stripTrueMarkers(rawLatex);

        const type = clientQ.type || 'TN';
        let options = Array.isArray(clientQ.options) ? [...clientQ.options] : [];

        if (type === 'TN') {
            options = options.map(opt => {
                const isCorrect = typeof opt.originalIndex === 'number'
                    ? correctIndices.includes(opt.originalIndex)
                    : false;
                return { ...opt, isCorrect };
            });
        } else if (type === 'TF') {
            options = options.map((opt, idx) => {
                const optKey = String(opt.id || idx + 1);
                return { ...opt, isCorrect: !!tfMap[optKey] };
            });
        }

        return {
            ...clientQ,
            content_latex: dbQ.content_latex,
            original_latex: dbQ.content_latex_original,
            solution,
            correctAnswer: shortAnswer,
            options
        };
    });
}

