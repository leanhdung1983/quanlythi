import { createHash } from 'node:crypto';
import { checkShortAnswer } from './scoring.js';
import { parseId6 } from './id6.js';

export function json(value, fallback = {}) {
    try { return typeof value === 'string' ? JSON.parse(value) : value ?? fallback; } catch { return fallback; }
}

// Rates describe observed answers, not a psychometric mastery estimate.
export function correctness(q, answer) {
    if (q.type === 'TN') {
        const correct = q.options?.find(o => o.isCorrect === true);
        return correct ? Number(answer !== undefined && String(answer) === String(correct.id)) : null;
    }
    if (q.type === 'KQ') return q.correctAnswer ? Number(checkShortAnswer(answer, q.correctAnswer)) : null;
    if (q.type === 'TF') {
        const options = q.options?.filter(o => typeof o.isCorrect === 'boolean') || [];
        return options.length ? options.filter(o => answer?.[o.id] === o.isCorrect).length / options.length : null;
    }
    return null; // Unmarked essays and missing answer keys provide no evidence.
}

export function buildGapMap(results, bank = [], splitAt = null) {
    const metadata = new Map(bank.map(q => [Number(q.id), q]));
    const groups = new Map();
    let skipped = 0;
    for (const result of results) {
        if (result.status !== 'COMPLETED') continue;
        const detail = json(result.result_detail);
        if (!Array.isArray(detail.questions) || !detail.answers || typeof detail.answers !== 'object') continue;
        const seen = new Set();
        for (const q of detail.questions) {
            if (!q || seen.has(String(q.id))) continue;
            seen.add(String(q.id));
            const meta = metadata.get(Number(q.id)) || {};
            const id = parseId6(q.id_full || q.legacy_full_id || meta.legacy_full_id);
            const value = correctness(q, detail.answers[q.id]);
            if (!id || value === null) { skipped++; continue; }
            const key = id.normalized;
            if (!groups.has(key)) groups.set(key, { key, ...id,
                label: meta.description || `Dạng ${id.count}`, chapter_name: meta.chapter_name || `Chương ${id.chapter}`,
                unit_name: meta.unit_name || `Bài ${id.unit}`, competencies: json(meta.competencies, []),
                attempts: 0, credit: 0, students: new Set(), weakStudents: new Map(), evidence: [], before: [], after: [] });
            const g = groups.get(key);
            g.attempts++; g.credit += value; g.students.add(result.user_id);
            const student = g.weakStudents.get(result.user_id) || { n: 0, credit: 0 };
            student.n++; student.credit += value; g.weakStudents.set(result.user_id, student);
            g.evidence.push({ result_id: result.id, question_id: q.id, user_id: result.user_id,
                date: result.created_at, credit: value });
            if (splitAt) {
                const date = new Date(result.created_at).getTime();
                if (Number.isFinite(date)) g[date >= new Date(splitAt).getTime() ? 'after' : 'before'].push(value);
            }
        }
    }
    const average = values => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) : null;
    return { skipped, skills: [...groups.values()].map(g => {
        const rate = Math.round(g.credit / g.attempts * 100);
        const before = average(g.before), after = average(g.after);
        return { ...g, credit: undefined, students: g.students.size, weakStudents: undefined,
            weak_students: [...g.weakStudents.values()].filter(s => s.n >= 3 && s.credit / s.n < .7).length,
            rate, confidence: g.attempts < 3 ? 'INSUFFICIENT' : 'OBSERVED', gap: g.attempts >= 3 && rate < 70,
            evidence: g.evidence.slice(-20), before: { rate: before, n: g.before.length }, after: { rate: after, n: g.after.length },
            delta: g.before.length >= 3 && g.after.length >= 3 ? after - before : null };
    }).sort((a, b) => a.rate - b.rate || b.attempts - a.attempts) };
}

export function questionSignature(q) {
    return createHash('sha256').update(JSON.stringify([q.content_latex || '', q.content_latex_original || '', q.type || q.type_id || ''])).digest('hex');
}

export function planPractice(map, candidates, limit = 10) {
    const gaps = map.skills.filter(s => s.gap).slice(0, 4);
    const selected = [];
    for (let round = 0; selected.length < limit; round++) {
        let added = false;
        for (const skill of gaps) {
            const qs = candidates.filter(q => parseId6(q.legacy_full_id)?.normalized === skill.key)
                .sort((a, b) => Number(a.used_count || 0) - Number(b.used_count || 0) || Number(a.id) - Number(b.id));
            if (qs[round] && selected.length < limit) {
                selected.push({ question_id: qs[round].id, skill: skill.key, signature: questionSignature(qs[round]),
                    reason: `${skill.label} (${skill.key}): mức đúng ${skill.rate}% trên ${skill.attempts} lượt; ưu tiên dạng dưới 70% có ít nhất 3 minh chứng.`,
                    evidence: skill.evidence, difficulty_index: qs[round].difficulty_index ?? null });
                added = true;
            }
        }
        if (!added) break;
    }
    return selected;
}
