import { query } from './core.js';
import { scoringSettingsSignature } from './scoring.js';
import { synchronizeExamDetail } from './examRegrade.js';
import { parseMatrixData } from '../shared/matrixCatalog.js';

// Repair older submissions that missed the rubric-change regrade.
export async function refreshHistoryScores(rows) {
    const settingsByMatrix = new Map();
    const questionIds = [...new Set(rows.flatMap(row => {
        try {
            const detail = typeof row.result_detail === 'string' ? JSON.parse(row.result_detail) : row.result_detail;
            return row.status === 'COMPLETED' ? (detail?.questions || []).map(q => Number(q.id)).filter(Number.isSafeInteger) : [];
        } catch { return []; }
    }))];
    const bankRows = questionIds.length ? await query('SELECT id,content_latex,content_latex_original FROM questions WHERE id IN (?)', [questionIds]) : [];
    const bank = new Map(bankRows.map(q => [Number(q.id), q]));
    for (const row of rows) {
        if (row.status !== 'COMPLETED') continue;
        if (row.matrix_id && !settingsByMatrix.has(row.matrix_id)) {
            const [matrix] = await query('SELECT matrix_data FROM matrix_templates WHERE id = ?', [row.matrix_id]);
            settingsByMatrix.set(row.matrix_id, matrix ? parseMatrixData(matrix.matrix_data).settings || {} : null);
        }
        const settings = settingsByMatrix.get(row.matrix_id);
        let detail;
        try {
            detail = typeof row.result_detail === 'string' ? JSON.parse(row.result_detail) : row.result_detail;
        } catch { continue; }
        const updated = synchronizeExamDetail(detail, settings || detail?.scoring_settings, bank);
        if (!updated) continue;
        if (scoringSettingsSignature(detail?.scoring_settings) === scoringSettingsSignature(updated.detail.scoring_settings)
            && JSON.stringify(detail.questions) === JSON.stringify(updated.detail.questions)) continue;
        const serialized = JSON.stringify(updated.detail);
        // Do not overwrite a result changed concurrently by a teacher or submission.
        const changed = await query(
            "UPDATE exam_results SET score = ?, result_detail = ?, last_updated = NOW() WHERE id = ? AND status = 'COMPLETED' AND score = ? AND result_detail = JSON_EXTRACT(?, '$')",
            [updated.score, serialized, row.id, row.score, typeof row.result_detail === 'string' ? row.result_detail : JSON.stringify(row.result_detail)]
        );
        if (changed.affectedRows) {
            row.score = updated.score;
            row.result_detail = serialized;
        } else {
            const [current] = await query('SELECT score, result_detail FROM exam_results WHERE id = ?', [row.id]);
            if (current) Object.assign(row, current);
        }
    }
}
