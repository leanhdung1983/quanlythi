import { UploadedFile } from '../types';
import { handleSessionExpired } from './authStore';

async function readApiResponse(response: Response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) {
            handleSessionExpired(payload.error || payload.message);
        }
        throw new Error(payload.error || payload.message || `Lỗi AI (${response.status})`);
    }
    return payload;
}

/** Route system AI requests through the authenticated backend so deployment
 * credentials never enter the browser bundle. */
export const convertDocToLatex = async (
    file: UploadedFile,
    onStatusUpdate?: (message: string) => void
): Promise<{ latex: string; questionCount: number; expectedQuestionCount: number; pageCount: number; missingQuestionNumbers: number[]; warnings: string[]; complete: boolean }> => {
    onStatusUpdate?.('Đang gửi tài liệu tới dịch vụ AI an toàn...');
    const isPdf = file.type === 'application/pdf';
    const response = await fetch('/api/ai/convert-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64_data: file.base64Data, mime_type: file.type, stream: isPdf })
    });
    if (isPdf) {
        if (!response.ok) await readApiResponse(response);
        if (!response.body) throw new Error('Không thể đọc tiến độ chuyển đổi PDF.');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = '';
        let result: Record<string, unknown> | null = null;
        const handleLine = (line: string) => {
            if (!line.trim()) return;
            const event = JSON.parse(line);
            if (event.type === 'error') throw new Error(event.error || 'Chuyển đổi PDF thất bại.');
            if (event.type === 'result') result = event;
            if (event.type === 'progress') {
                if (event.stage === 'inspected') onStatusUpdate?.(`Đã nhận diện ${event.expectedQuestionCount} câu trên ${event.pageCount} trang. Đang chuyển đổi...`);
                if (event.stage === 'page') onStatusUpdate?.(`Đã xử lý trang ${event.page}/${event.pageCount} · ${event.convertedQuestionCount}/${event.expectedQuestionCount} câu.`);
            }
        };
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                pending += decoder.decode(value, { stream: true });
                const lines = pending.split('\n');
                pending = lines.pop() || '';
                lines.forEach(handleLine);
            }
            pending += decoder.decode();
            handleLine(pending);
        } finally { reader.releaseLock(); }
        if (!result) throw new Error('Kết nối chuyển đổi PDF kết thúc trước khi có kết quả.');
        return {
            latex: String(result.latex || ''), questionCount: Number(result.questionCount || 0),
            expectedQuestionCount: Number(result.expectedQuestionCount || 0), pageCount: Number(result.pageCount || 0),
            missingQuestionNumbers: Array.isArray(result.missingQuestionNumbers) ? result.missingQuestionNumbers as number[] : [],
            warnings: Array.isArray(result.warnings) ? result.warnings as string[] : [], complete: Boolean(result.complete)
        };
    }
    const payload = await readApiResponse(response);
    onStatusUpdate?.('Đã chuyển đổi xong tài liệu.');
    return { latex: payload.latex || '', questionCount: payload.questionCount || 0, expectedQuestionCount: payload.questionCount || 0,
        pageCount: 0, missingQuestionNumbers: [], warnings: payload.warnings || [], complete: Boolean(payload.complete) };
};

export const validateAndTagQuestion = async (latex: string, currentId: string) => {
    const response = await fetch('/api/ai/validate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex, current_id: currentId })
    });
    const payload = await readApiResponse(response);
    return payload.data || null;
};

export interface BatchSuggestResult {
    id: number;
    suggestedId: string;
    confidence: number;
    reason: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isQuotaOrRateLimitError(err: unknown): boolean {
    const msg = String((err as any)?.message || err || '').toLowerCase();
    return msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('hạn mức') || msg.includes('vượt quá');
}



export const batchSuggestIds = async (
    questions: Array<{ id: number; latex: string; current_id?: string }>,
    onProgress?: (processed: number, total: number) => void,
    onChunkResults?: (chunkResults: BatchSuggestResult[]) => void,
    isCancelled?: () => boolean
): Promise<BatchSuggestResult[]> => {
    // Configuration
    const CHUNK_SIZE = 5; // 5 questions per chunk (balanced token usage and throughput)
    const PAUSE_MS = 1000; // pause between API calls to respect rate limits
    const MAX_RETRIES = 2; // retry on quota/rate limit errors

    const allResults: BatchSuggestResult[] = [];
    const total = questions.length;

    // Helper to pause
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    let fatalQuotaError: Error | null = null;
    let lastError: Error | null = null;

    // Process each chunk sequentially
    for (let i = 0; i < total; i += CHUNK_SIZE) {
        if (isCancelled?.()) {
            break;
        }

        const chunk = questions.slice(i, i + CHUNK_SIZE);
        const validLatexQuestions = chunk.filter(q => typeof q.latex === 'string' && q.latex.trim().length > 0);

        // Local check: skip questions with empty LaTeX
        if (validLatexQuestions.length === 0) {
            const skippedResults = chunk.map(q => ({
                id: q.id,
                suggestedId: q.current_id ?? '',
                confidence: 1,
                reason: 'Bỏ qua – nội dung LaTeX rỗng'
            }));
            allResults.push(...skippedResults);
            onChunkResults?.(skippedResults);
            onProgress?.(Math.min(i + CHUNK_SIZE, total), total);
            await delay(PAUSE_MS);
            continue;
        }

        let attempt = 0;
        let chunkSuccess = false;

        while (attempt <= MAX_RETRIES && !chunkSuccess) {
            if (isCancelled?.()) break;

            try {
                const response = await fetch('/api/ai/batch-suggest-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        questions: chunk.map(q => ({
                            id: q.id,
                            latex: q.latex,
                            current_id: q.current_id
                        }))
                    })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok || !payload.success) {
                    const errMsg = payload.error || payload.message || `Lỗi AI (${response.status})`;
                    if (response.status === 401) {
                        handleSessionExpired(errMsg);
                    }
                    const isQuota = response.status === 429 || payload.isQuota || isQuotaOrRateLimitError(errMsg);
                    if (isQuota) {
                        throw new Error(errMsg.includes('Quota') || errMsg.includes('hạn mức') ? errMsg : 'Quota Exceeded');
                    }
                    throw new Error(errMsg);
                }

                // Successful response: extract results
                const results: BatchSuggestResult[] = payload.results || payload.data?.results || [];
                allResults.push(...results);
                onChunkResults?.(results);
                chunkSuccess = true;
            } catch (e: any) {
                lastError = e instanceof Error ? e : new Error(String(e?.message || e));
                const isQuota = isQuotaOrRateLimitError(e);
                if (isQuota) {
                    if (attempt < MAX_RETRIES && !isCancelled?.()) {
                        // Exponential back-off before retrying
                        const backoff = PAUSE_MS * Math.pow(2, attempt + 1);
                        await delay(backoff);
                        attempt++;
                    } else {
                        // Mark fatal quota error to stop further chunks
                        fatalQuotaError = lastError;
                        console.warn('Gemini API quota/rate limit reached. Stopping further chunks to preserve existing results.');
                        break;
                    }
                } else {
                    // Non-quota error (auth, key missing, network, or server):
                    console.error('Batch suggest chunk error:', e);
                    // If no results have been obtained yet, immediately abort and throw so the user sees the real reason!
                    if (allResults.length === 0) {
                        throw lastError;
                    }
                    break;
                }
            }
        }

        // Report progress after each chunk
        onProgress?.(Math.min(i + CHUNK_SIZE, total), total);

        // If quota is exhausted, stop processing subsequent chunks immediately
        if (fatalQuotaError) {
            break;
        }

        // Small pause to avoid hitting rate limits between chunks
        if (i + CHUNK_SIZE < total && !isCancelled?.()) {
            await delay(PAUSE_MS);
        }
    }

    // If 0 questions were processed and ANY error occurred, throw it
    if (allResults.length === 0 && (fatalQuotaError || lastError)) {
        throw (fatalQuotaError || lastError);
    }

    return allResults;
};
