import { describe, expect, it, vi } from 'vitest';

vi.mock('./core.js', () => ({ pool: null, initDbPromise: Promise.resolve() }));
import { publishPhoto, verifyPageAccess } from './socialPublisher.js';

describe('Facebook Page publisher', () => {
    it('uses the specified Page token and uploads a photo with caption', async () => {
        const fetcher = vi.fn(async (_url, options) => {
            expect(options.method).toBe('POST');
            expect(options.headers.Authorization).toBe('Bearer private-test-token');
            expect(options.body.get('caption')).toBe('Bài toán hôm nay');
            expect(options.body.get('source').type).toBe('image/png');
            return { ok: true, json: async () => ({ id: 'photo-1', post_id: 'post-1' }) };
        });
        const result = await publishPhoto({ image: Buffer.from('image'), mime: 'image/png', caption: 'Bài toán hôm nay' },
            fetcher, 'private-test-token', '100105564680397');
        expect(fetcher.mock.calls[0][0]).toContain('/100105564680397/photos');
        expect(result).toEqual({ photoId: 'photo-1', postId: 'post-1' });
    });

    it('rejects a token that points to a different Page', async () => {
        const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ id: 'another-page', name: 'Other' }) }));
        await expect(verifyPageAccess(fetcher, 'private-test-token', '100105564680397'))
            .rejects.toThrow('Token không truy cập được đúng Facebook Page');
    });

    it('marks a definite Meta rejection separately from an uncertain network error', async () => {
        const fetcher = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'Denied' } }) }));
        await expect(publishPhoto({ image: Buffer.from('x'), mime: 'image/jpeg', caption: 'Hi' },
            fetcher, 'private-test-token', '100105564680397'))
            .rejects.toMatchObject({ message: 'Denied', metaResponse: true });
    });
});
