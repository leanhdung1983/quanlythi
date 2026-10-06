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
