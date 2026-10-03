import { describe, expect, it } from 'vitest';
import { extractSourceId, injectCanonicalId, inspectQuestionId, normalizeId6, normalizeQuestionSource, parseId6, questionTimestampChanged, requiresAiIdReview, validateId6Candidate } from './id6.js';

describe('ID6 canonical rules', () => {
    it.each([['12d01b03_04', '2D1H3-4'], ['2H2K5-7', '2H2V5-7'], ['10C3G2-1', '0C3C2-1']])('normalizes %s', (input, expected) => {
        expect(normalizeId6(input)).toBe(expected);
    });
    it('rejects unsupported grades and subjects', () => {
        expect(parseId6('5D1H1-1')).toBeNull();
        expect(parseId6('2X1H1-1')).toBeNull();
    });
    it('keeps exactly one canonical source marker', () => {
        const result = injectCanonicalId('\\begin{bt}\n%[12D1B3-4]\nNội dung\n\\end{bt}', '2D1H3-4');
        expect(result.match(/%\[2D1H3-4\]/g)).toHaveLength(1);
        expect(extractSourceId(result)).toBe('2D1H3-4');
        expect(result).toContain('\\begin{ex}');
    });
    it('extracts and replaces the legacy $[ID] source marker', () => {
        const source = '\\begin{ex}\n$[12D1B3-4]\nNội dung\\end{ex}';
        expect(extractSourceId(source)).toBe('2D1H3-4');
        const result = injectCanonicalId(source, '2D1H3-4');
        expect(result).toContain('%[2D1H3-4]');
        expect(result).not.toContain('$[');
    });
    it('keeps an inline question body outside the ID comment', () => {
        const result = injectCanonicalId('\\begin{ex}%[2D4V2-2]Biểu đồ sau mô tả kết quả điều tra.\n\\end{ex}', '2D4V2-2');
        expect(result).toContain('%[2D4V2-2]\nBiểu đồ sau mô tả kết quả điều tra.');
        expect(result).not.toContain('%[2D4V2-2]Biểu đồ');
    });
    it('removes non-ID6 bracket comments without removing the inline question body', () => {
        const source = "\\begin{ex}%[1H4H5-3]\n%[Nguyễn Văn Nay]\tCho hình lăng trụ tam giác đều $ABC.A'B'C'$.\n\\end{ex}";
        const result = injectCanonicalId(source, '1H4H5-3');
        expect(result.match(/%\[[^\]]+\]/g)).toEqual(['%[1H4H5-3]']);
        expect(result).toContain("Cho hình lăng trụ tam giác đều $ABC.A'B'C'$.");
        expect(result).not.toContain('Nguyễn Văn Nay');
    });
    it('removes all legacy header comment lines except the canonical ID6 marker', () => {
        const source = '\\begin{ex}%[1H4H5-3]\n%Câu 1\n% Nguồn: đề minh họa\nNội dung thật của câu hỏi.\n% comment trong thân cần giữ\n\\end{ex}';
        const result = injectCanonicalId(source, '1H4H5-3');
        expect(result).toContain('\\begin{ex}\n%[1H4H5-3]\nNội dung thật của câu hỏi.');
        expect(result).not.toContain('%Câu 1');
        expect(result).not.toContain('% Nguồn: đề minh họa');
        expect(result).toContain('% comment trong thân cần giữ');
    });
    it('normalizes line endings without changing math content', () => {
        const result = normalizeQuestionSource('```latex\r\n\\begin{ex}\r\n$x + 1$   \r\n\\end{ex}\r\n```', '2D1H3-4');
        expect(result.source).toContain('$x + 1$');
        expect(result.changed).toBe(true);
    });
    it('formats the supplied true/false example with one structural block per line', () => {
        const body = String.raw`Trong không gian với hệ trục tọa độ $Oxyz$, cho hai mặt cầu $(S)\colon (x-3)^2+y^2+z^2=9$; $(S')\colon x^2+y^2+z^2-12y+12=0$ và mặt phẳng $(P)\colon z-m=0$.`;
        const options = [
            String.raw`\True Mặt cầu $(S)$ có tâm là $I(3;0;0)$ và mặt cầu $(S')$ có bán kính là $\sqrt{24}$`,
            String.raw`Mặt phẳng $(P)$ có một vectơ pháp tuyến là $\overrightarrow{n}=(1;0;0)$`,
            String.raw`\True Khoảng cách giữa hai tâm của hai mặt cầu ($S$) và ($S'$) bằng $3\sqrt{5}$`,
            String.raw`Biết rằng hai mặt cầu $(S)$ và $(S')$ cắt nhau theo giao tuyến là đường tròn $(C)$. Gọi $T$ là tập hợp các giá trị của $m$ để trên mặt phẳng $(P)$ dựng được một tiếp tuyến đến đường tròn $(C)$. Tổng bình phương các phần tử của tập hợp $T$ là $2$`,
        ];
        const source = `\\begin{ex} %[2H5V3-3]%Câu 3\t\n${body}\t\\choiceTF\t${options.map(o => `{${o}}`).join('\t')}\t\\loigiai{\t} \\end{ex}`;
        const expected = `\\begin{ex} %[2H5V3-3]\n${body}\n\\choiceTF\n${options.map(o => `{${o}}`).join('\n')}\n\\loigiai{\nnội dung lời giải\n}\n\\end{ex}`;
        const result = normalizeQuestionSource(source, '2H5V3-3', { formatLayout: true });
        expect(result.source).toBe(expected);
        expect(normalizeQuestionSource(result.source, '2H5V3-3', { formatLayout: true }).changed).toBe(false);
    });
    it('preserves nested math groups, answer markers and an existing solution', () => {
        const source = String.raw`\begin{ex}
%[2D1H3-4]
Tính $\frac{1}{2}$. \choice {\True $\frac{1}{2}$} {$2$} {$3$} {$4$} \loigiai{Dòng 1 $\frac{a}{b}$.

Dòng 2 có \{ngoặc\}.
% \choice không phải một lệnh cần định dạng
} \end{ex}`;
        const result = normalizeQuestionSource(source, '2D1H3-4', { formatLayout: true }).source;
        expect(result).toContain('\\choice\n{\\True $\\frac{1}{2}$}\n{$2$}\n{$3$}\n{$4$}');
        expect(result).toContain('Dòng 1 $\\frac{a}{b}$.\n\nDòng 2 có \\{ngoặc\\}.');
        expect(result).toContain('% \\choice không phải một lệnh cần định dạng');
        expect(result).not.toContain('nội dung lời giải');
    });
    it('uses scanner rules for an AI candidate instead of declaring a catalog ID valid', () => {
        const metadata = new Map([['2D1H3-4', { id_full: '2D1H3-4', unit_id: 3, level_id: 2 }]]);
        const result = validateId6Candidate({ content_latex: '\\begin{ex}\nNội dung\\end{ex}', unit_id: 3, level_id: 2 }, '2D1H3-4', metadata);
        expect(result.isValid).toBe(false);
        expect(result.reasonCodes).toContain('ID_NOT_IN_SOURCE');
    });
    it('accepts a candidate only when catalog, source, unit and level agree', () => {
        const metadata = new Map([['2D1H3-4', { id_full: '2D1H3-4', unit_id: 3, level_id: 2 }]]);
        const result = validateId6Candidate({ content_latex: '\\begin{ex}\n%[2D1H3-4]\nNội dung\\end{ex}', unit_id: 3, level_id: 2 }, '2D1H3-4', metadata);
        expect(result.isValid).toBe(true);
        expect(result.reasonCodes).toEqual([]);
    });
    it('forces AI review for a scanner level mismatch but not source normalization alone', () => {
        expect(requiresAiIdReview(['ID_LEVEL_MISMATCH'])).toBe(true);
        expect(requiresAiIdReview(['ID_NOT_IN_SOURCE', 'ID_LEGACY'])).toBe(false);
    });
    it('compares review timestamps at database precision without false invalid-date conflicts', () => {
        expect(questionTimestampChanged('2026-09-27T03:00:00.900Z', '2026-09-27T03:00:00.000Z')).toBe(false);
        expect(questionTimestampChanged('2026-09-27T03:00:00Z', '2026-09-27T03:00:01Z')).toBe(true);
        expect(questionTimestampChanged('not-a-date', '2026-09-27T03:00:00Z')).toBe(false);
    });
    it('flags an integral question that was assigned to a statistics catalog ID', () => {
        const metadata = new Map([['2D3H1-1', {
            id_full: '2D3H1-1', unit_id: 1, level_id: 2,
            chapter_name: 'Các số đặc trưng đo xu thế trung tâm cho mẫu số liệu ghép nhóm',
            description: 'Tính phương sai và độ lệch chuẩn'
        }]]);
        const review = inspectQuestionId({
            legacy_full_id: '2D3H1-1', unit_id: 1, level_id: 2,
            content_latex: '\\begin{ex}\n%[2D3H1-1]\nTính tích phân $\\int_0^1 x^2 dx$.\\end{ex}'
        }, metadata);
        expect(review.issues).toContain('ID_CONTENT_MISMATCH');
        expect(requiresAiIdReview(review.issues)).toBe(true);
    });
});
