export async function ensureExamSessionId(candidate: number | null, start: () => Promise<{ success?: boolean; id?: number }>): Promise<number> {
    if (Number.isSafeInteger(candidate) && Number(candidate) > 0) return Number(candidate);
    const result = await start();
    const id = Number(result?.id);
    if (!result?.success || !Number.isSafeInteger(id) || id < 1) throw new Error('Máy chủ chưa tạo được phiên thi. Vui lòng thử lại.');
    return id;
}
