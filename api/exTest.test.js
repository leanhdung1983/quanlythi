import { describe, expect, it } from 'vitest';
import { normalizeExTestOutput } from './exTest.js';

describe('ex_test conversion output', () => {
    it('removes markdown fences and normalizes legacy question environments', () => {
        const result = normalizeExTestOutput('```latex\r\n\\begin{bt}\r\nĐề\\choice{A}{B}{C}{D}\\end{bt}\r\n```');
        expect(result.latex).toContain('\\begin{ex}');
        expect(result.questionCount).toBe(1);
        expect(result.warnings).toEqual([]);
    });
    it('flags an incomplete response rather than filling it with invented content', () => {
        const result = normalizeExTestOutput('\\begin{ex} Nội dung', 'MAX_TOKENS');
        expect(result.warnings).toContain('Số môi trường câu hỏi mở/đóng không khớp.');
        expect(result.warnings).toContain('AI đã dừng do hết giới hạn token; tài liệu chưa được chuyển đổi hết.');
        expect(result.complete).toBe(false);
    });
});
