export const LESSON_BLOCK_TYPES = ['TEXT', 'FORMULA', 'EXAMPLE', 'NOTE', 'VIDEO', 'PRACTICE'];
export const LESSON_BLOCK_LABELS = { TEXT: 'Nội dung', FORMULA: 'Công thức', EXAMPLE: 'Ví dụ có lời giải', NOTE: 'Lỗi thường gặp / Ghi nhớ', VIDEO: 'Video', PRACTICE: 'Luyện tập' };
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
export function youtubeEmbed(value) {
    if (!value) return '';
    let url;
    try { url = new URL(value); } catch { return fail('Nhập liên kết YouTube hợp lệ.'); }
    if (url.protocol !== 'https:') return fail('Liên kết video phải dùng HTTPS.');
    const host = url.hostname.toLowerCase();
    const id = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com'].includes(host)
        ? (url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1]) : '';
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return fail('Chỉ hỗ trợ liên kết video YouTube có mã video hợp lệ.');
    return `https://www.youtube-nocookie.com/embed/${id}`;
}
export function validateLessonDraft(input, publishing = false) {
    if (!input || typeof input !== 'object') return fail('Bản nháp không hợp lệ.');
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title || title.length > 200) return fail('Tên bài soạn cần từ 1 đến 200 ký tự.');
    if (!Array.isArray(input.blocks) || !input.blocks.length || input.blocks.length > 30) return fail('Bài soạn cần từ 1 đến 30 khối nội dung.');
    const blocks = input.blocks.map((block, i) => {
        if (!block || !LESSON_BLOCK_TYPES.includes(block.type)) return fail('Loại khối nội dung không hợp lệ.');
        const title = typeof block.title === 'string' ? block.title.trim() : '';
        const content = typeof block.content === 'string' ? block.content : '';
        if (!title || title.length > 200 || content.length > 20000) return fail(`Kiểm tra tên và độ dài nội dung khối ${i + 1}.`);
        if (publishing && !['VIDEO', 'PRACTICE'].includes(block.type) && !content.trim()) return fail(`Khối ${i + 1} chưa có nội dung.`);
        const video_url = block.type === 'VIDEO' ? youtubeEmbed(String(block.video_url || '').trim()) : '';
        if (publishing && block.type === 'VIDEO' && !video_url) return fail(`Khối video ${i + 1} chưa có liên kết.`);
        const matrix_id = block.type === 'PRACTICE' && block.matrix_id != null && block.matrix_id !== '' ? Number(block.matrix_id) : null;
        if (matrix_id !== null && (!Number.isSafeInteger(matrix_id) || matrix_id < 1)) return fail('Mã ma trận không hợp lệ.');
        if (publishing && block.type === 'PRACTICE' && !matrix_id) return fail('Chọn ma trận cho khối luyện tập hoặc xóa khối này; bài luôn có luyện tập theo bài ở cuối.');
        return { type: block.type, title, content, video_url, matrix_id };
    });
    if (JSON.stringify(blocks).length > 180000) return fail('Bản nháp quá dài, hãy chia thành các bài nhỏ hơn.');
    return { title, blocks };
}
export function lessonBlockContent(block) {
    if (block.type === 'FORMULA') return block.content.trim().startsWith('$') ? block.content : `$$${block.content.trim()}$$`;
    return block.content;
}
export const lessonDraftSchema = {
    type: 'object', required: ['title', 'blocks'], properties: {
        title: { type: 'string' },
        blocks: { type: 'array', items: { type: 'object', required: ['type', 'title', 'content'], properties: {
            type: { type: 'string', enum: ['TEXT', 'FORMULA', 'EXAMPLE', 'NOTE'] }, title: { type: 'string' }, content: { type: 'string' }
        } } }
    }
};
