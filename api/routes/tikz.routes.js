import express from 'express';
import {
    pool, requireAdmin, sanitizeSvg, generateHash, clearCache,
} from '../core.js';
import {
    extractTikzBlocks, extractSvgReferences, inspectTikzQuestion, inspectTikzStructure, replaceRenderedBlock,
} from '../tikzAudit.js';

const router = express.Router();
const validHash = value => /^[a-f0-9]{64}$/i.test(String(value || ''));
const placeholders = hashes => hashes.map(() => '?').join(',');

router.get('/admin/tikz-audit', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const afterId = Math.max(0, Number.parseInt(req.query.afterId || '0', 10) || 0);
        const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '50', 10) || 50));
        const [rows] = await pool.query(
            'SELECT id, legacy_full_id, content_latex, content_latex_original, is_tikz_rendered FROM questions WHERE id > ? ORDER BY id ASC LIMIT ?',
            [afterId, limit + 1],
        );
        const page = rows.slice(0, limit);
        const hashes = [...new Set(page.flatMap(row => [
            ...extractTikzBlocks(row.content_latex).map(block => block.hash),
            ...extractSvgReferences(row.content_latex),
        ]))];
        const existing = new Set();
        if (hashes.length) {
            const [images] = await pool.query(
                `SELECT tikz_hash FROM question_images WHERE tikz_hash IN (${placeholders(hashes)})`, hashes,
            );
            for (const image of images) existing.add(image.tikz_hash.toLowerCase());
        }
        const failures = new Map();
        if (page.length) {
            const [errors] = await pool.query(
                `SELECT question_id, tikz_hash, error_message FROM tikz_render_failures WHERE question_id IN (${placeholders(page)})`,
                page.map(row => row.id),
            );
            for (const error of errors) failures.set(`${error.question_id}:${error.tikz_hash}`, error.error_message);
        }
        const data = page.map(row => {
            const audit = inspectTikzQuestion(row, existing);
            audit.images = audit.images.map(image => ({
                ...image, error: failures.get(`${row.id}:${image.hash}`) || null,
            }));
            return audit;
        });
        res.json({
            success: true, data, afterId: page.at(-1)?.id || afterId,
            hasMore: rows.length > limit,
        });
    } catch (error) {
        console.error('[TIKZ AUDIT] Scan failed:', error);
        res.status(500).json({ error: 'Không thể quét dữ liệu TikZ.' });
    }
});

router.post('/admin/tikz-audit/sync', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const questionId = Number.parseInt(req.body.questionId, 10);
    const hash = String(req.body.hash || '').toLowerCase();
    const svg = req.body.svg;
    if (!Number.isSafeInteger(questionId) || questionId < 1 || !validHash(hash)) {
        return res.status(400).json({ error: 'ID câu hỏi hoặc hash không hợp lệ.' });
    }
    if (svg !== null && svg !== undefined && typeof svg !== 'string') {
        return res.status(400).json({ error: 'SVG phải là chuỗi XML.' });
    }
    if (svg && Buffer.byteLength(svg, 'utf8') > 2_000_000) {
        return res.status(413).json({ error: 'SVG vượt giới hạn 2 MB.' });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const [rows] = await conn.query(
            'SELECT id, legacy_full_id, unit_id, level_id, type_id, content_latex, content_latex_original FROM questions WHERE id = ? FOR UPDATE',
            [questionId],
        );
        const row = rows[0];
        if (!row) { await conn.rollback(); return res.status(404).json({ error: 'Câu hỏi không tồn tại.' }); }
        const currentBlocks = extractTikzBlocks(row.content_latex);
        const references = extractSvgReferences(row.content_latex);
        if (!currentBlocks.some(block => block.hash === hash) && !references.includes(hash)) {
            await conn.rollback();
            return res.status(409).json({ error: 'Câu hỏi đã thay đổi; hash không còn liên kết.' });
        }
        const source = currentBlocks.find(block => block.hash === hash)?.source
            || extractTikzBlocks(row.content_latex_original).find(block => block.hash === hash)?.source;
        const [existing] = await conn.query('SELECT id FROM question_images WHERE tikz_hash = ? LIMIT 1', [hash]);
        if (!existing.length) {
            if (!source) {
                await conn.rollback();
                return res.status(422).json({ error: 'Không còn mã TikZ gốc để xác minh hình.' });
            }
            const safeSvg = typeof svg === 'string' ? sanitizeSvg(svg) : '';
            if (!safeSvg) {
                await conn.rollback();
                return res.status(422).json({ error: 'SVG không hợp lệ hoặc chứa nội dung không an toàn.' });
            }
            await conn.query('INSERT IGNORE INTO question_images (tikz_hash, svg_content) VALUES (?, ?)', [hash, safeSvg]);
        }
        const updated = replaceRenderedBlock(row.content_latex, hash);
        const structure = inspectTikzStructure(updated);
        const rawRemaining = structure.blocks;
        const linked = extractSvgReferences(updated);
        const allHashes = [...new Set(linked)];
        let stored = new Set();
        if (allHashes.length) {
            const [images] = await conn.query(
                `SELECT tikz_hash FROM question_images WHERE tikz_hash IN (${placeholders(allHashes)})`, allHashes,
            );
            stored = new Set(images.map(image => image.tikz_hash.toLowerCase()));
        }
        const invalidReferences = /\[TIKZ_HASH:(?![a-f0-9]{64}\])[^\]]*\]/i.test(updated);
        const complete = !structure.malformed && !invalidReferences
            && rawRemaining.length === 0 && allHashes.every(item => stored.has(item));
        const status = complete ? (allHashes.length ? 1 : 2) : 0;
        if (updated !== row.content_latex) {
            await conn.query(
                `INSERT INTO question_revisions (question_id, content_latex, legacy_full_id, unit_id, level_id, type_id, change_type, changed_by)
                 VALUES (?, ?, ?, ?, ?, ?, 'TIKZ_SVG_SYNC', ?)`,
                [row.id, row.content_latex, row.legacy_full_id, row.unit_id, row.level_id, row.type_id, req.user.id],
            );
        }
        await conn.query(
            `UPDATE questions SET content_latex = ?, content_latex_original = COALESCE(content_latex_original, ?),
             is_tikz_rendered = ?, content_hash = ?, is_duplicate_checked = FALSE WHERE id = ?`,
            [updated, row.content_latex, status, generateHash(updated), questionId],
        );
        await conn.query('DELETE FROM tikz_render_failures WHERE question_id = ? AND tikz_hash = ?', [questionId, hash]);
        await conn.commit();
        await clearCache('/api/questions*');
        res.json({ success: true, status, complete, changed: updated !== row.content_latex });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('[TIKZ AUDIT] Sync failed:', error);
        res.status(500).json({ error: 'Không thể lưu SVG và cập nhật câu hỏi.' });
    } finally {
        if (conn) conn.release();
    }
});

router.post('/admin/tikz-audit/failure', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const questionId = Number.parseInt(req.body.questionId, 10);
        const hash = String(req.body.hash || '').toLowerCase();
        const message = String(req.body.error || '').slice(0, 1000);
        if (!Number.isSafeInteger(questionId) || questionId < 1 || !validHash(hash) || !message) {
            return res.status(400).json({ error: 'Báo cáo lỗi không hợp lệ.' });
        }
        const [rows] = await pool.query('SELECT content_latex FROM questions WHERE id = ?', [questionId]);
        if (!rows.length || ![
            ...extractTikzBlocks(rows[0].content_latex).map(block => block.hash),
            ...extractSvgReferences(rows[0].content_latex),
        ].includes(hash)) return res.status(409).json({ error: 'Hash không còn liên kết với câu hỏi.' });
        await pool.query(
            `INSERT INTO tikz_render_failures (question_id, tikz_hash, error_message)
             VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE error_message = VALUES(error_message), updated_at = NOW()`,
            [questionId, hash, message],
        );
        res.json({ success: true });
    } catch (error) {
        console.error('[TIKZ AUDIT] Failure report failed:', error);
        res.status(500).json({ error: 'Không thể lưu báo cáo lỗi.' });
    }
});

export default router;
