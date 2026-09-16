export const DEFAULT_SOCIAL_TEMPLATE = `📘 Bài toán ngày {NGAY}\n\nChủ đề: {CHUDE}\nMã ID6: {ID}\n\nBạn hãy thử giải và chia sẻ đáp án ở bình luận nhé!\n\n#LuyenToanThongMinh #ID6`;

export function buildSocialCaption(template, question, day) {
    const date = new Date(day);
    const values = {
        NGAY: new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date),
        ID: String(question.id_full || ''),
        CHUDE: String(question.description || 'Luyện tập Toán')
    };
    const output = String(template || DEFAULT_SOCIAL_TEMPLATE).replace(/\{(NGAY|ID|CHUDE)\}/g, (_, key) => values[key]).trim();
    if (!output || output.length > 2000) throw new Error('Caption trống hoặc dài hơn 2.000 ký tự.');
    return output;
}
