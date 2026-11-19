import { describe, it, expect } from 'vitest';
import { repairJsonString, parseAiJson } from './aiJson.js';

describe('repairJsonString & parseAiJson', () => {
    it('parses clean valid JSON without changes', () => {
        const input = '{"name": "test", "count": 42, "valid": true}';
        expect(repairJsonString(input)).toEqual({ name: 'test', count: 42, valid: true });
    });

    it('handles markdown code blocks with ```json and ```', () => {
        const input = '```json\n{"score": 10, "status": "ok"}\n```';
        expect(repairJsonString(input)).toEqual({ score: 10, status: 'ok' });
    });

    it('handles leading and trailing chatter text from AI', () => {
        const input = 'Dưới đây là kết quả kiểm định:\n{"is_standard": true}\nHy vọng giúp ích cho bạn!';
        expect(repairJsonString(input)).toEqual({ is_standard: true });
    });

    it('repairs LaTeX commands with invalid JSON escape characters (e.g. \\sqrt, \\alpha, \\left, \\vec)', () => {
        const input = '{"latex": "\\begin{ex}\\nCho hàm số $y = \\frac{1}{2}\\sqrt{x^2+1}$...\\alpha\\beta\\left(\\right)\\vec{u}\\end{ex}"}';
        const parsed = repairJsonString(input);
        expect(parsed.latex).toContain('\\frac{1}{2}');
        expect(parsed.latex).toContain('\\sqrt{x^2+1}');
        expect(parsed.latex).toContain('\\alpha');
        expect(parsed.latex).toContain('\\left(');
        expect(parsed.latex).toContain('\\right)');
        expect(parsed.latex).toContain('\\vec{u}');
        expect(parsed.latex).toContain('\\begin{ex}');
        expect(parsed.latex).toContain('\\end{ex}');
    });

    it('repairs LaTeX commands starting with control escape letters (\\text, \\theta, \\times, \\right, \\frac, \\begin, \\beta)', () => {
        const input = '{"step7": {"rewritten_latex": "\\text{Tìm } x \\text{ sao cho } \\tan\\theta = 1 \\times 2 \\right. \\begin{aligned} x=1 \\end{aligned}"}}';
        const parsed = repairJsonString(input);
        expect(parsed.step7.rewritten_latex).toContain('\\text{Tìm }');
        expect(parsed.step7.rewritten_latex).toContain('\\tan\\theta');
        expect(parsed.step7.rewritten_latex).toContain('\\times');
        expect(parsed.step7.rewritten_latex).toContain('\\right.');
        expect(parsed.step7.rewritten_latex).toContain('\\begin{aligned}');
    });

    it('handles LaTeX \\underline and other non-hex \\u prefixes without breaking unicode', () => {
        const input = '{"underline": "\\underline{AB}", "validUnicode": "\\u0041"}';
        const parsed = repairJsonString(input);
        expect(parsed.underline).toBe('\\underline{AB}');
        expect(parsed.validUnicode).toBe('A');
    });

    it('handles raw unescaped newlines inside strings', () => {
        const input = '{"solution": "Dòng 1\nDòng 2\nDòng 3"}';
        const parsed = repairJsonString(input);
        expect(parsed.solution).toContain('Dòng 1');
        expect(parsed.solution).toContain('Dòng 2');
    });

    it('removes trailing commas in objects and arrays', () => {
        const input = '{"items": [1, 2, 3,], "active": true,}';
        expect(repairJsonString(input)).toEqual({ items: [1, 2, 3], active: true });
    });

    it('parseAiJson returns fallback when parsing fails or input is null', () => {
        expect(parseAiJson(null, { default: true })).toEqual({ default: true });
        expect(parseAiJson('this is not json at all', [])).toEqual([]);
        expect(parseAiJson('', {})).toEqual({});
    });

    it('parseAiJson throws descriptive error when no fallback is given and parsing fails', () => {
        expect(() => parseAiJson('not valid')).toThrow('Không thể phân tích dữ liệu JSON từ AI');
    });
});
