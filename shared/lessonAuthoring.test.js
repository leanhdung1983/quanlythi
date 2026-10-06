import { describe, expect, it } from 'vitest';
import { validateLessonDraft, youtubeEmbed, lessonBlockContent } from './lessonAuthoring.js';
const draft = { title: 'Bài học', blocks: [{ type: 'TEXT', title: 'Lý thuyết', content: '$x^2$' }] };
describe('lesson authoring validation', () => {
    it('normalizes supported blocks and strips untrusted fields', () => {
        const result = validateLessonDraft({ ...draft, published_at: 'now', blocks: [{ ...draft.blocks[0], interactive_html: '<script/>', matrix_id: 999 }] });
        expect(result.blocks[0]).toEqual({ type: 'TEXT', title: 'Lý thuyết', content: '$x^2$', video_url: '', matrix_id: null });
        expect(result.published_at).toBeUndefined();
    });
    it('allows incomplete drafts but requires complete contents on publication', () => {
        const empty = { ...draft, blocks: [{ type: 'TEXT', title: 'Mục tiêu', content: '' }] };
        expect(validateLessonDraft(empty).blocks).toHaveLength(1);
        expect(() => validateLessonDraft(empty, true)).toThrow('chưa có nội dung');
        expect(() => validateLessonDraft({ ...draft, blocks: [{ type: 'VIDEO', title: 'Video' }] }, true)).toThrow('chưa có liên kết');
        expect(() => validateLessonDraft({ ...draft, blocks: [{ type: 'PRACTICE', title: 'Luyện tập' }] }, true)).toThrow('Chọn ma trận');
    });
    it('bounds all user and AI supplied structures', () => {
        for (const input of [null, {}, { ...draft, title: 'a'.repeat(201) }, { ...draft, blocks: [] }, { ...draft, blocks: Array(31).fill(draft.blocks[0]) }, { ...draft, blocks: [{ type: 'HTML', title: 'Unsafe' }] }, { ...draft, blocks: [{ ...draft.blocks[0], content: 'a'.repeat(20001) }] }]) expect(() => validateLessonDraft(input)).toThrow();
        expect(() => validateLessonDraft({ ...draft, blocks: [{ type: 'PRACTICE', title: 'Ôn tập', matrix_id: -1 }] })).toThrow();
    });
    it('accepts regular video URLs and rejects unsafe schemes, hosts and IDs', () => {
        expect(youtubeEmbed('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(youtubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toContain('/embed/dQw4w9WgXcQ');
        expect(youtubeEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toContain('/embed/dQw4w9WgXcQ');
        for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'http://youtu.be/dQw4w9WgXcQ', 'https://youtu.be/x']) expect(() => youtubeEmbed(url)).toThrow();
    });
    it('formats formulas without wrapping existing math twice', () => {
        expect(lessonBlockContent({ type: 'FORMULA', content: 'x^2' })).toBe('$$x^2$$');
        expect(lessonBlockContent({ type: 'FORMULA', content: '$$x^2$$' })).toBe('$$x^2$$');
    });
});
