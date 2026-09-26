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
    onProgress?: (processed: number, total: number) => void
): Promise<BatchSuggestResult[]> => {
    // 6 questions per chunk with filtered catalog consumes ~2,500 tokens per request, safely within 32k TPM
    const CHUNK_SIZE = 6;
    const allResults: BatchSuggestResult[] = [];
    let lastError: Error | null = null;

    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
        const chunk = questions.slice(i, i + CHUNK_SIZE);

        // Pacing: add pause between chunks to allow token bucket refill
        if (i > 0) {
            await sleep(1200);
        }

        let chunkSuccess = false;
        let attempt = 0;
        const maxAttempts = 2;

        while (attempt < maxAttempts && !chunkSuccess) {
            attempt++;
            try {
                const response = await fetch('/api/ai/batch-suggest-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questions: chunk })
                });
                const payload = await readApiResponse(response);
                if (payload.results && Array.isArray(payload.results)) {
                    allResults.push(...payload.results);
                    chunkSuccess = true;
                    lastError = null;
                }
            } catch (e: any) {
                lastError = e instanceof Error ? e : new Error(String(e));
                console.warn(`Batch suggest chunk attempt ${attempt}/${maxAttempts} failed:`, e.message);

                if (isQuotaOrRateLimitError(e)) {
                    if (attempt < maxAttempts) {
                        // Backoff delay before retrying
                        await sleep(3500);
                        continue;
                    }
                    console.error('Gemini quota or rate limit exceeded. Stopping further requests.', e);
                    break;
                }

                if (attempt < maxAttempts) {
                    await sleep(1500);
                }
            }
        }

        // If batch chunk failed after retries and wasn't a quota exhaustion, try individual fallback
        if (!chunkSuccess && lastError && !isQuotaOrRateLimitError(lastError)) {
            console.warn('Batch chunk failed with non-quota error, trying individual fallback...');
            for (const q of chunk) {
                try {
                    await sleep(500);
                    const single = await validateAndTagQuestion(q.latex, q.current_id || '');
                    if (single && single.suggestedId) {
                        allResults.push({
                            id: q.id,
                            suggestedId: single.suggestedId,
                            confidence: single.confidence || 0.8,
                            reason: single.reason || 'Đề xuất bởi AI'
                        });
                    }
                } catch (singleErr: any) {
                    console.error('Single validation error:', singleErr.message);
                    if (isQuotaOrRateLimitError(singleErr)) {
                        lastError = singleErr instanceof Error ? singleErr : new Error(String(singleErr));
                        break;
                    }
                }
            }
        }

        onProgress?.(Math.min(i + CHUNK_SIZE, questions.length), questions.length);

        // If a fatal quota error occurred, break the outer loop so we don't spam further chunks
        if (lastError && isQuotaOrRateLimitError(lastError)) {
            break;
        }
    }

    // If 0 results were produced and an error occurred, throw it so UI receives the exact failure cause
    if (allResults.length === 0 && lastError) {
        throw lastError;
    }

    return allResults;
};

