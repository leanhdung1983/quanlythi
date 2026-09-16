import { describe, expect, it, vi } from 'vitest';
import { ensureExamSessionId } from './examSession';
describe('legacy exam session recovery', () => {
    it('creates a session for legacy progress missing its ID', async () => {
        const start = vi.fn(async () => ({ success: true, id: 9 }));
        expect(await ensureExamSessionId(null, start)).toBe(9);
        expect(start).toHaveBeenCalledOnce();
    });
    it('reuses an existing session without consuming another attempt', async () => {
        const start = vi.fn();
        expect(await ensureExamSessionId(7, start)).toBe(7);
        expect(start).not.toHaveBeenCalled();
    });
    it('propagates LMS restrictions and never accepts an unconfirmed ID', async () => {
        await expect(ensureExamSessionId(null, async () => { throw new Error('Hết lượt thi'); })).rejects.toThrow('Hết lượt thi');
        await expect(ensureExamSessionId(null, async () => ({ success: true }))).rejects.toThrow('chưa tạo');
    });
});
