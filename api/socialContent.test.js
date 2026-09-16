import { describe, expect, it } from 'vitest';
import { buildSocialCaption } from './socialContent.js';

describe('manual social content', () => {
    it('fills daily caption fields without an AI call', () => {
        expect(buildSocialCaption('{NGAY} · {ID} · {CHUDE}',
            { id_full: '2D1H1-1', description: 'Hàm số' }, '2026-09-16T00:00:00Z'))
            .toBe('16/09/2026 · 2D1H1-1 · Hàm số');
    });
    it('rejects an oversized template', () => {
        expect(() => buildSocialCaption('x'.repeat(2001), {}, new Date())).toThrow();
    });
});
