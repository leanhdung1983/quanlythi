import { UploadedFile } from '../types';

async function readApiResponse(response: Response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || `Lỗi AI (${response.status})`);
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
