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
    onChunkResults?: (chunkResults: BatchSuggestResult[]) => void
): Promise<BatchSuggestResult[]> => {
    // Configuration
    const CHUNK_SIZE = 4; // smaller chunk size reduces token usage
    const PAUSE_MS = 1200; // pause between API calls to respect rate limits
    const MAX_RETRIES = 2; // retry on quota errors

    const allResults: BatchSuggestResult[] = [];
    const total = questions.length;

    // Helper to pause
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Process each chunk sequentially
    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = questions.slice(i, i + CHUNK_SIZE);
        const chunkIds = chunk.map(q => q.id);
        const chunkLatex = chunk.map(q => q.latex).join('\n\n');
        const currentIds = chunk.map(q => q.current_id).filter(Boolean).join(',');

        // Local pre‑check: avoid sending empty prompts
        if (!chunkLatex.trim()) {
            // mark as skipped
            chunk.forEach(q => {
                allResults.push({ id: q.id, suggestedId: q.current_id ?? '', confidence: 1, reason: 'Skipped – empty LaTeX' });
            });
            onProgress?.(Math.min(i + CHUNK_SIZE, total), total);
            await delay(PAUSE_MS);
            continue;
        }

        let attempt = 0;
        while (attempt <= MAX_RETRIES) {
            try {
                const response = await fetch('/api/ai/batch-suggest-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_list: chunkIds,
                        filtered_catalog: chunkLatex,
                        current_ids: currentIds
                    })
                });
                const payload = await response.json();

                if (!payload.success) {
                    // API indicated a problem – treat as quota if status 429
                    if (response.status === 429 || isQuotaOrRateLimitError(new Error(payload.error || ''))) {
                        throw new Error('Quota');
                    }
                    // Other error – surface
                    throw new Error(payload.error || 'Unknown error from AI endpoint');
                }

                // Successful response
                const results: BatchSuggestResult[] = payload.data?.results || [];
                allResults.push(...results);
                onChunkResults?.(results);
                break; // exit retry loop
            } catch (e) {
                if (isQuotaOrRateLimitError(e)) {
                    if (attempt < MAX_RETRIES) {
                        // exponential back‑off
                        const backoff = PAUSE_MS * Math.pow(2, attempt);
                        await delay(backoff);
                        attempt++;
                    } else {
                        // give up – mark remaining questions as failed
                        chunk.forEach(q => {
                            allResults.push({
                                id: q.id,
                                suggestedId: '',
                                confidence: 0,
                                reason: 'Quota exceeded – unable to obtain suggestion'
                            });
                        });
                        break;
                    }
                } else {
                    // Non‑quota error – report and stop retrying this chunk
                    console.error('Batch suggest error', e);
                    chunk.forEach(q => {
                        allResults.push({
                            id: q.id,
                            suggestedId: '',
                            confidence: 0,
                            reason: 'Error: ' + (e as any).message
                        });
                    });
                    break;
                }
            }
        }

        // Report progress after each chunk
        onProgress?.(Math.min(i + CHUNK_SIZE, total), total);
        // Small pause to avoid hitting rate limits
        await delay(PAUSE_MS);
    }

    return allResults;
};
