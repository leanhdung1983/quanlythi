/** Normalize the AI response without inventing missing mathematical content. */
export function normalizeExTestOutput(value, finishReason = '') {
    const source = String(value || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
    const latex = source.replace(/^```(?:latex|tex)?\s*\n/i, '').replace(/\n?```\s*$/i, '').trim()
        .replace(/\\begin\{(?:bt|vd|cau|bai|tuluan|tl)\}/gi, '\\begin{ex}')
        .replace(/\\end\{(?:bt|vd|cau|bai|tuluan|tl)\}/gi, '\\end{ex}');
    const warnings = [];
    const starts = (latex.match(/\\begin\{ex\}/g) || []).length;
    const ends = (latex.match(/\\end\{ex\}/g) || []).length;
    if (!starts) warnings.push('Không tìm thấy môi trường \\begin{ex}...\\end{ex}; cần kiểm tra tài liệu gốc.');
    if (starts !== ends) warnings.push('Số môi trường câu hỏi mở/đóng không khớp.');
    if (finishReason === 'MAX_TOKENS') warnings.push('AI đã dừng do hết giới hạn token; tài liệu chưa được chuyển đổi hết.');
    if (starts && !/\\(?:choiceTF|choice|shortans|loigiai)\b/.test(latex)) {
        warnings.push('Chưa thấy lệnh đáp án/lời giải ex_test; cần kiểm tra từng câu.');
    }
    if (/\[(?:hình|figure|image|không rõ|không đọc được)[^\]]*\]/i.test(latex)) {
        warnings.push('Có hình hoặc nội dung AI chưa tái tạo được; cần đối chiếu PDF.');
    }
    return { latex, questionCount: starts, warnings, complete: starts > 0 && starts === ends && finishReason !== 'MAX_TOKENS' };
}
