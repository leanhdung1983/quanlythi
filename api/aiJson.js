/**
 * Utility functions for safely parsing JSON returned by AI models.
 * Handles common LLM JSON formatting issues including:
 * - Unescaped or improperly escaped LaTeX backslashes (\sqrt, \alpha, \frac, \left, \right, etc.)
 * - Markdown code fences (```json ... ```) and leading/trailing chatter
 * - Raw unescaped newlines and tabs inside string literals
 * - Trailing commas before closing braces/brackets
 * - False control escapes (\begin -> backspace, \text -> tab, etc.)
 */

export function repairJsonString(raw) {
    if (typeof raw !== 'string') return raw;
    let str = raw.trim();

    // 1. Strip markdown code fences if present
    const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
        str = markdownMatch[1].trim();
    } else {
        // Strip text chatter before first { or [ and after last } or ]
        const firstObj = str.indexOf('{');
        const lastObj = str.lastIndexOf('}');
        const firstArr = str.indexOf('[');
        const lastArr = str.lastIndexOf(']');

        let start = -1;
        let end = -1;
        if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
            start = firstObj;
            end = lastObj;
        } else if (firstArr !== -1) {
            start = firstArr;
            end = lastArr;
        }

        if (start !== -1 && end > start) {
            str = str.substring(start, end + 1);
        }
    }

    // Fast-path: try standard JSON.parse first
    try {
        return JSON.parse(str);
    } catch {
        // Failed standard parse; proceed with repair state machine
    }

    // 2. State machine repair for string literals
    let result = '';
    let inString = false;
    let i = 0;
    const len = str.length;

    while (i < len) {
        const char = str[i];

        if (!inString) {
            if (char === '"') {
                inString = true;
                result += char;
                i++;
            } else {
                result += char;
                i++;
            }
        } else {
            // Inside a JSON string literal
            if (char === '"') {
                inString = false;
                result += char;
                i++;
            } else if (char === '\\') {
                const nextChar = str[i + 1];
                if (nextChar === undefined) {
                    result += '\\\\';
                    i++;
                } else if (nextChar === '"' || nextChar === '\\' || nextChar === '/') {
                    result += char + nextChar;
                    i += 2;
                } else if (nextChar === 'u') {
                    // Check for valid 4-hex unicode escape (\uXXXX)
                    const hexPart = str.slice(i + 2, i + 6);
                    if (/^[0-9a-fA-F]{4}$/.test(hexPart)) {
                        result += char + nextChar + hexPart;
                        i += 6;
                    } else {
                        // LaTeX commands like \underline, \unit
                        result += '\\\\u';
                        i += 2;
                    }
                } else if (nextChar === 'b' || nextChar === 'f' || nextChar === 'r' || nextChar === 't' || nextChar === 'n') {
                    // In JSON, \b, \f, \r, \t, \n are control escapes.
                    // But in LaTeX: \begin, \beta, \frac, \right, \text, \tan, \theta, \times, \neq, etc.
                    // If followed immediately by an ASCII letter (a-zA-Z), it is a LaTeX command.
                    const thirdChar = str[i + 2];
                    if (thirdChar && /[a-zA-Z]/.test(thirdChar)) {
                        result += '\\\\' + nextChar;
                        i += 2;
                    } else {
                        result += char + nextChar;
                        i += 2;
                    }
                } else {
                    // Invalid JSON escape (e.g. \s in \sqrt, \a in \alpha, \l in \left, \{, \}, \ , etc.)
                    result += '\\\\' + nextChar;
                    i += 2;
                }
            } else if (char === '\n') {
                // Raw newline inside string
                result += '\\n';
                i++;
            } else if (char === '\r') {
                // Skip raw carriage return inside string
                i++;
            } else if (char === '\t') {
                result += '\\t';
                i++;
            } else {
                result += char;
                i++;
            }
        }
    }

    // Remove trailing commas before closing braces/brackets
    result = result.replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(result);
}

/**
 * Parses JSON from AI response safely, falling back to a default value if fallback is provided.
 * If fallback is undefined and parsing fails, throws a descriptive Error.
 */
export function parseAiJson(raw, fallback) {
    if (raw == null && fallback !== undefined) return fallback;
    try {
        return repairJsonString(raw);
    } catch (err) {
        if (fallback !== undefined) return fallback;
        throw new Error(`Không thể phân tích dữ liệu JSON từ AI: ${err.message}`);
    }
}
