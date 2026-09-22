import { describe, expect, it, vi } from 'vitest';
import { ensureExamSessionId, resolveResumedSession, remainingExamSeconds, examProgressSnapshot } from './examSession';
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

describe('resume across logins and retakes', () => {
    it('keeps ownership and server session when a page-hide snapshot overwrites local storage', () => {
        expect(examProgressSnapshot({ currentExamSessionId: 77, answers: { 1: 'A' } }, 9)).toMatchObject({ userId: 9, currentExamSessionId: 77 });
    });
    it('deducts offline time for real exams and submits expired exams without granting extra time', () => {
        expect(remainingExamSeconds({ timeLeft: 60, isRealExam: true, startTime: 1000 }, 31000)).toBe(30);
        expect(remainingExamSeconds({ timeLeft: 60, isRealExam: true, startTime: 1000 }, 91000)).toBe(0);
        expect(remainingExamSeconds({ timeLeft: 60, isRealExam: false, startTime: 1000 }, 91000)).toBe(60);
        expect(remainingExamSeconds({ timeLeft: 60, isRealExam: true, startTime: 100000 }, 31000)).toBe(60);
    });
    const saved = { userId: 1, currentExamSessionId: 7 };
    it('checks and reuses only an owned active session', async () => {
        const start = vi.fn(); const lookup = vi.fn(async () => ({ user_id: 1, status: 'IN_PROGRESS' }));
        expect(await resolveResumedSession(saved, 1, lookup, start)).toBe(7);
        expect(lookup).toHaveBeenCalledWith(7); expect(start).not.toHaveBeenCalled();
    });
    it('retake always requests a fresh session regardless of the old session', async () => {
        const start = vi.fn(async () => ({ success: true, id: 8 }));
        expect(await ensureExamSessionId(null, start)).toBe(8);
        expect(start).toHaveBeenCalledOnce();
    });
    it('recovers missing, deleted and expired owned sessions', async () => {
        for (const candidate of [undefined, 0, 7]) {
            const start = vi.fn(async () => ({ success: true, id: 8 }));
            const lookup = async () => { throw Object.assign(new Error('missing'), { status: 404 }); };
            expect(await resolveResumedSession({ userId: 1, currentExamSessionId: candidate }, 1, lookup, start)).toBe(8);
            expect(start).toHaveBeenCalledOnce();
        }
        expect(await resolveResumedSession(saved, 1, async () => ({ user_id: 1, status: 'EXPIRED' }), async () => ({ success: true, id: 9 }))).toBe(9);
    });
    it('migrates a legacy draft whose deleted server session predates saved ownership', async () => {
        const start = vi.fn(async () => ({ success: true, id: 12 }));
        const lookup = async () => { throw Object.assign(new Error('Exam result not found'), { status: 404 }); };
        expect(await resolveResumedSession({ currentExamSessionId: 7 }, 1, lookup, start)).toBe(12);
        expect(start).toHaveBeenCalledOnce();
    });
    it('rejects a different account and legacy sessions belonging to others', async () => {
        const start = vi.fn(); const lookup = vi.fn(async () => ({ user_id: 2, status: 'IN_PROGRESS' }));
        await expect(resolveResumedSession(saved, 2, lookup, start)).rejects.toThrow('tài khoản khác');
        expect(lookup).not.toHaveBeenCalled();
        await expect(resolveResumedSession({ currentExamSessionId: 7 }, 1, lookup, start)).rejects.toThrow('tài khoản khác');
        expect(start).not.toHaveBeenCalled();
    });
    it('never clones answers from a completed submission as a new attempt', async () => {
        const start = vi.fn();
        await expect(resolveResumedSession(saved, 1, async () => ({ user_id: 1, status: 'COMPLETED' }), start)).rejects.toThrow('đã nộp');
        expect(start).not.toHaveBeenCalled();
    });
    it('does not create sessions on network/auth/permission errors', async () => {
        for (const status of [undefined, 401, 403, 429, 500]) {
            const start = vi.fn();
            await expect(resolveResumedSession(saved, 1, async () => { throw Object.assign(new Error('lookup failed'), { status }); }, start)).rejects.toThrow('lookup failed');
            expect(start).not.toHaveBeenCalled();
        }
    });
    it('checks legacy ownership and rejects ambiguous legacy drafts', async () => {
        expect(await resolveResumedSession({ currentExamSessionId: 7 }, 1, async () => ({ user_id: 1, status: 'IN_PROGRESS' }), vi.fn())).toBe(7);
        expect(await resolveResumedSession({}, 1, vi.fn(), async () => ({ success: true, id: 11 }))).toBe(11);
    });
    it('propagates attempt/deadline restrictions when a replacement is required', async () => {
        await expect(resolveResumedSession({ userId: 1 }, 1, vi.fn(), async () => { throw new Error('Quá hạn hoặc hết lượt'); })).rejects.toThrow('Quá hạn');
    });
});
