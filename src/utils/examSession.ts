export async function ensureExamSessionId(candidate: number | null, start: () => Promise<{ success?: boolean; id?: number }>): Promise<number> {
    if (Number.isSafeInteger(candidate) && Number(candidate) > 0) return Number(candidate);
    const result = await start();
    const id = Number(result?.id);
    if (!result?.success || !Number.isSafeInteger(id) || id < 1) throw new Error('Máy chủ chưa tạo được phiên thi. Vui lòng thử lại.');
    return id;
}

export function remainingExamSeconds(saved: { timeLeft: number; isRealExam?: boolean; startTime?: number }, now = Date.now()): number {
    const elapsed = saved.isRealExam && Number.isFinite(saved.startTime) ? Math.max(0, Math.floor((now - Number(saved.startTime)) / 1000)) : 0;
    return Math.max(0, Number(saved.timeLeft) - elapsed);
}

export function examProgressSnapshot(input: any, userId: number) {
    return { ...input, userId, currentExamSessionId: input.currentExamSessionId ?? null };
}

export async function resolveResumedSession(saved: { userId?: number; currentExamSessionId?: number }, userId: number,
    lookup: (id: number) => Promise<{ user_id: number; status: string }>, start: () => Promise<{ success?: boolean; id?: number }>): Promise<number> {
    if (saved.userId !== undefined && Number(saved.userId) !== userId) throw new Error('Bài làm thuộc tài khoản khác. Hãy chọn làm mới.');
    const id = Number(saved.currentExamSessionId);
    if (Number.isSafeInteger(id) && id > 0) {
        let session;
        try { session = await lookup(id); }
        catch (error: any) {
            // A 404 proves the referenced server session no longer exists. Legacy
            // local drafts did not store userId, so they may safely be rebound to
            // the currently authenticated user through the normal start endpoint.
            // Explicitly owned drafts from another account were rejected above.
            if (error.status === 404) return ensureExamSessionId(null, start);
            throw error;
        }
        if (Number(session.user_id) !== userId) throw new Error('Phiên thi thuộc tài khoản khác. Hãy chọn làm mới.');
        if (session.status === 'COMPLETED') throw new Error('Bài thi đã nộp. Hãy xem lịch sử hoặc chọn làm mới.');
        if (session.status !== 'IN_PROGRESS') return ensureExamSessionId(null, start);
        return id;
    }
    if (saved.userId !== undefined && Number(saved.userId) !== userId) throw new Error('Bài cũ thuộc tài khoản khác. Hãy chọn làm mới; dữ liệu cũ vẫn được giữ.');
    return ensureExamSessionId(null, start);
}
