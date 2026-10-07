import { parseId6 } from './id6.js';

export function lessonMatrixInventory(questions, byLesson = false) {
    const groups = new Map();
    for (const q of questions) {
        const id = parseId6(q.legacy_full_id);
        if (!id || !['TN', 'TF', 'KQ'].includes(q.type)) continue;
        const key = `${id.grade}-${id.subject}-${id.chapter}-${id.unit}-${byLesson ? '*' : id.count}`;
        const token = `${q.type}:${key}`;
        if (!groups.has(token)) groups.set(token, { key, type: q.type, available: { N: 0, H: 0, V: 0, C: 0 } });
        groups.get(token).available[id.level]++;
    }
    return [...groups.values()];
}

export function validateLessonMatrixProposal(proposal, inventory) {
    if (!Array.isArray(proposal?.rows) || proposal.rows.length > inventory.length) throw new Error('AI trả về cấu trúc ma trận không hợp lệ.');
    const seen = new Set();
    let total = 0;
    const rows = proposal.rows.map(row => {
        const token = `${row.type}:${row.key}`;
        const item = inventory.find(i => i.key === row.key && i.type === row.type);
        if (!item || seen.has(token)) throw new Error('AI đề xuất dạng câu hỏi ngoài bài học hoặc trùng lặp.');
        seen.add(token);
        const counts = {};
        for (const level of ['N','H','V','C']) {
            const count = row.counts?.[level] ?? 0;
            if (!Number.isInteger(count) || count < 0 || count > item.available[level]) throw new Error('Số câu AI đề xuất vượt số câu có trong ngân hàng.');
            counts[level] = count; total += count;
        }
        return { ...item, counts };
    });
    if (total < 1 || total > 100) throw new Error('Ma trận phải có từ 1 đến 100 câu.');
    return { rows, rationale: String(proposal.rationale || '').slice(0, 3000) };
}

// Build a usable, capacity-safe draft even when the AI service is unavailable.
export function buildLessonMatrixDraft(inventory, requested = 12, difficulty = 'BALANCED') {
    const levels = ['N', 'H', 'V', 'C'];
    const weights = difficulty === 'BASIC' ? [5, 4, 1, 0] : difficulty === 'ADVANCED' ? [1, 2, 5, 2] : [3, 4, 2, 1];
    const rows = inventory.map(row => ({ ...row, counts: { N: 0, H: 0, V: 0, C: 0 } }));
    const capacity = rows.reduce((sum, row) => sum + levels.reduce((n, l) => n + row.available[l], 0), 0);
    const target = Math.min(requested, capacity);
    const assigned = { N: 0, H: 0, V: 0, C: 0 };
    for (let i = 0; i < target; i++) {
        const candidates = levels.filter(l => rows.some(row => row.counts[l] < row.available[l]));
        candidates.sort((a, b) => (assigned[a] + 1) / Math.max(0.01, weights[levels.indexOf(a)]) - (assigned[b] + 1) / Math.max(0.01, weights[levels.indexOf(b)]));
        const level = candidates[0];
        const eligible = rows.filter(row => row.counts[level] < row.available[level]);
        eligible.sort((a, b) => Object.values(a.counts).reduce((n, c) => n + c, 0) - Object.values(b.counts).reduce((n, c) => n + c, 0) || a.key.localeCompare(b.key) || a.type.localeCompare(b.type));
        eligible[0].counts[level]++;
        assigned[level]++;
    }
    return validateLessonMatrixProposal({ rows: rows.filter(row => Object.values(row.counts).some(Boolean)), rationale: `Phân bổ ${target} câu theo số câu thực có, ưu tiên đa dạng các dạng và cân đối mức độ. ${target < requested ? `Ngân hàng hiện chỉ đủ ${target}/${requested} câu yêu cầu.` : ''}` }, inventory);
}

export async function proposeWithDeadline(generate, signal, timeoutMs = 35000) {
    const controller = new AbortController();
    let timer;
    let stop;
    const stopped = new Promise((_, reject) => {
        stop = () => { controller.abort(); reject(new Error('Đã dừng yêu cầu tạo ma trận.')); };
        if (signal?.aborted) stop();
        else signal?.addEventListener('abort', stop, { once: true });
        timer = setTimeout(() => { controller.abort(); reject(new Error('AI chưa phản hồi trong 35 giây.')); }, timeoutMs);
    });
    try {
        return await Promise.race([stopped, Promise.resolve().then(() => {
            if (controller.signal.aborted) throw new Error('Đã dừng yêu cầu tạo ma trận.');
            return generate(controller.signal);
        })]);
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', stop);
    }
}
