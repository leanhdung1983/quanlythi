import { stripLoigiai, stripShortans } from './examSecurity.js';
import { regradeStoredExamDetail } from './scoring.js';

const normalize = text => String(text || '').replace(/\\True\b/g, '').replace(/\s+/g, '').trim();

// Extract the original option identities, independently of shuffled A/B/C/D labels.
function choices(source, type) {
    const text = stripLoigiai(source).cleaned;
    const match = text.match(type === 'TF' ? /\\choiceTF\s*\{/ : /\\choice\s*\{/);
    if (!match) return [];
    const options = [];
    let i = match.index + match[0].length - 1;
    while (options.length < 4) {
        while (/\s/.test(text[i] || '') && i < text.length) i++;
        if (text[i] !== '{') break;
        const start = ++i;
        let depth = 1;
        while (i < text.length && depth) {
            if (text[i] === '\\') { i += 2; continue; }
            if (text[i] === '{') depth++;
            if (text[i] === '}') depth--;
            i++;
        }
        if (depth) return [];
        const content = text.slice(start, i - 1);
        options.push({ content, isCorrect: /\\True\b/.test(content) });
    }
    return options;
}

export function updateStoredAnswerKey(question, bankQuestion) {
    if (!bankQuestion) return question;
    // Rendering may strip markers from display LaTeX; bank edits update both sources.
    const sources = [bankQuestion.content_latex_original, bankQuestion.content_latex].filter(Boolean);
    const solution = stripLoigiai(sources[0] || '').solution;
    if (question.type === 'KQ') {
        const answer = sources.map(source => stripShortans(stripLoigiai(source).cleaned).shortAnswer).find(Boolean);
        return answer ? { ...question, correctAnswer: answer,
            ...(answer !== question.correctAnswer ? { solution } : {}) } : question;
    }
    if (!['TN', 'TF'].includes(question.type)) return question;
    const latest = sources.map(source => choices(source, question.type)).find(options => options.length === 4);
    if (!latest || (question.type === 'TN' && latest.filter(o => o.isCorrect).length !== 1)) return question;
    const original = choices(question.original_latex || question.content_latex || '', question.type);
    const options = (question.options || []).map(option => {
        const index = Number.isInteger(option.originalIndex) ? option.originalIndex : Number(option.id) - 1;
        const identity = original[index]?.content || option.content;
        const matches = latest.filter(candidate => normalize(candidate.content) === normalize(identity));
        if (!identity || matches.length !== 1) return null;
        return { ...option, isCorrect: matches[0].isCorrect };
    });
    // Never guess after an option was replaced or a legacy shuffle is ambiguous.
    if (options.length !== 4 || options.some(option => !option)) return question;
    const keyChanged = options.some((option, i) => option.isCorrect !== question.options[i].isCorrect);
    return { ...question, options, ...(keyChanged ? { solution } : {}) };
}

export function answerKeySignature(source) {
    const text = stripLoigiai(source || '').cleaned;
    return JSON.stringify({
        TN: choices(text, 'TN').map(o => [normalize(o.content), o.isCorrect]).sort(),
        TF: choices(text, 'TF').map(o => [normalize(o.content), o.isCorrect]).sort(),
        KQ: stripShortans(text).shortAnswer,
    });
}

export async function synchronizeQuestionEdit(conn, previous, source) {
    if (answerKeySignature(previous.content_latex_original || previous.content_latex) === answerKeySignature(source)) {
        return { regraded: 0, skipped: 0 };
    }
    await conn.query('UPDATE questions SET content_latex_original = ?, is_tikz_rendered = 0 WHERE id = ?', [source, previous.id]);
    return regradeQuestionResults(conn, { id: previous.id, content_latex: source, content_latex_original: source });
}

export function synchronizeExamDetail(rawDetail, settings, bank = new Map()) {
    const detail = typeof rawDetail === 'string' ? JSON.parse(rawDetail) : rawDetail;
    if (!Array.isArray(detail?.questions)) return null;
    const questions = detail.questions.map(question => updateStoredAnswerKey(question, bank.get(Number(question.id))));
    const updated = regradeStoredExamDetail({ ...detail, questions }, settings ?? detail.scoring_settings ?? {});
    if (updated) updated.detail.submitted_questions = detail.submitted_questions || detail.questions;
    return updated;
}

export async function regradeQuestionResults(conn, bankQuestion) {
    // JSON_CONTAINS supports both numeric and string IDs in legacy snapshots.
    const [results] = await conn.query(
        `SELECT id,matrix_id,status,score,result_detail FROM exam_results
         WHERE status IN ('COMPLETED','IN_PROGRESS') AND JSON_VALID(result_detail)
         AND (JSON_CONTAINS(IF(JSON_VALID(result_detail), result_detail, '{}'), ?, '$.questions')
              OR JSON_CONTAINS(IF(JSON_VALID(result_detail), result_detail, '{}'), ?, '$.questions'))
         ORDER BY id FOR UPDATE`,
        [JSON.stringify({ id: Number(bankQuestion.id) }), JSON.stringify({ id: String(bankQuestion.id) })]
    );
    let regraded = 0;
    let skipped = 0;
    for (const row of results) {
        const detail = typeof row.result_detail === 'string' ? JSON.parse(row.result_detail) : row.result_detail;
        // Keep the current rubric snapshot. Matrix edits update it transactionally.
        const updated = synchronizeExamDetail(detail, undefined, new Map([[Number(bankQuestion.id), bankQuestion]]));
        if (!updated) { skipped++; continue; }
        const affected = detail.questions.filter(q => Number(q.id) === Number(bankQuestion.id));
        if (affected.some(q => updateStoredAnswerKey(q, bankQuestion) === q)) { skipped++; continue; }
        await conn.query('UPDATE exam_results SET score = ?, result_detail = ?, last_updated = NOW() WHERE id = ?',
            [row.status === 'COMPLETED' ? updated.score : row.score, JSON.stringify(updated.detail), row.id]);
        if (row.status === 'COMPLETED') regraded++;
    }
    return { regraded, skipped };
}
