import { parseId6 } from './id6.js';

// Shuffle buckets, then take one question per ID6 form before cycling again.
// This maximizes form diversity while preserving the lesson/type/level scope.
export function selectLessonQuestions(rows, requirement, used = new Set(), random = Math.random) {
    const grade = Number(requirement.cls) >= 10 ? Number(requirement.cls) - 10 : Number(requirement.cls);
    const buckets = new Map();
    const shuffle = list => {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    };
    const seen = new Set();
    for (const row of rows) {
        if (used.has(row.id) || seen.has(row.id)) continue;
        seen.add(row.id);
        const id = parseId6(row.id_full);
        if (!id || Number(id.grade) !== grade || id.subject !== requirement.sub
            || id.chapter !== Number(requirement.chap) || id.unit !== Number(requirement.unit)
            || id.level !== requirement.lvl || row.type_code !== requirement.qType) continue;
        if (!buckets.has(id.count)) buckets.set(id.count, []);
        buckets.get(id.count).push(row);
    }
    const groups = shuffle([...buckets.values()].map(group => shuffle(group.sort((a, b) => a.id - b.id))));
    const result = [];
    while (result.length < requirement.quantity && groups.some(g => g.length)) {
        for (const group of groups) {
            if (group.length && result.length < requirement.quantity) result.push(group.pop());
        }
    }
    if (result.length < requirement.quantity) throw new Error(`Bài ${requirement.unit}, mức ${requirement.lvl}, loại ${requirement.qType}: cần ${requirement.quantity} câu nhưng chỉ có ${result.length} câu phù hợp. Hãy giảm số câu; hệ thống không lấy câu từ bài khác.`);
    return result;
}
