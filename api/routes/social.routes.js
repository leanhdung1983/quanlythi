import express from 'express';
import { pool, requireAdmin, query } from '../core.js';
import { inspectQuestionId, normalizeId6 } from '../id6.js';
import { publisherConfig, verifyPageAccess } from '../socialPublisher.js';
import { buildSocialCaption, DEFAULT_SOCIAL_TEMPLATE } from '../socialContent.js';

const router = express.Router();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function parseImage(dataUrl) {
    const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new Error('Chỉ nhận ảnh PNG hoặc JPEG.');
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('Ảnh phải nhỏ hơn 5 MB.');
    if (match[1] === 'image/png' && bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Ảnh PNG không hợp lệ.');
    if (match[1] === 'image/jpeg' && bytes.subarray(0, 3).toString('hex') !== 'ffd8ff') throw new Error('Ảnh JPEG không hợp lệ.');
    return { mime: match[1], bytes };
}

function parseSchedule(value) {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 60_000) throw new Error('Giờ đăng phải sau hiện tại ít nhất 1 phút.');
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

router.get('/admin/social/config', (req, res) => {
    if (!requireAdmin(req, res)) return;
    res.json({ success: true, data: publisherConfig() });
});

router.get('/admin/social/questions', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const search = String(req.query.search || '').trim().slice(0, 100);
        const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 100);
        const params = [];
        const filter = search ? 'AND (q.legacy_full_id LIKE ? OR q.content_latex LIKE ?)' : '';
        if (search) params.push(`%${search}%`, `%${search}%`);
        params.push(limit);
        const rows = await query(`SELECT q.id,q.legacy_full_id AS id_full,q.content_latex AS raw_latex,
            q.used_count,m.description
            FROM questions q JOIN id6_metadata m ON m.id_full=q.legacy_full_id
            WHERE q.legacy_full_id IS NOT NULL ${filter}
            ORDER BY q.used_count ASC,q.id DESC LIMIT ?`, params);
        res.json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/admin/social/check', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try { res.json({ success: true, data: await verifyPageAccess() }); }
    catch (error) { res.status(502).json({ error: error.message }); }
});

router.get('/admin/social/queue', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const rows = await query(`SELECT s.id,s.question_id,s.caption,s.scheduled_at,s.status,s.attempt_count,
            s.last_error,s.fb_photo_id,s.fb_post_id,s.posted_at,s.created_at,s.updated_at,
            (s.image_blob IS NOT NULL) AS has_image,
            q.legacy_full_id AS id_full,q.content_latex AS raw_latex
            FROM social_post_queue s LEFT JOIN questions q ON q.id=s.question_id
            ORDER BY s.id DESC LIMIT 200`);
        res.json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/social/queue/:id/update', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const caption = String(req.body.caption || '').trim();
        if (!caption || caption.length > 2000) return res.status(400).json({ error: 'Caption cần có nội dung và không quá 2.000 ký tự.' });
        const scheduled = req.body.scheduled_at ? parseSchedule(req.body.scheduled_at) : null;
        const image = req.body.image_data_url ? parseImage(req.body.image_data_url) : null;
        const [result] = await pool.query(`UPDATE social_post_queue SET caption=?,
            scheduled_at=COALESCE(?,scheduled_at),image_mime=COALESCE(?,image_mime),
            image_blob=COALESCE(?,image_blob) WHERE id=? AND status='DRAFT'`,
            [caption, scheduled, image?.mime || null, image?.bytes || null, req.params.id]);
        if (!result.affectedRows) return res.status(409).json({ error: 'Chỉ bài chưa đăng mới được sửa.' });
        res.json({ success: true });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/admin/social/queue/:id/mark-posted', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const [[row]] = await conn.query('SELECT id,question_id,status FROM social_post_queue WHERE id=? FOR UPDATE', [req.params.id]);
        if (!row) { await conn.rollback(); return res.status(404).json({ error: 'Không tìm thấy bài.' }); }
        if (row.status === 'POSTED') { await conn.rollback(); return res.json({ success: true, alreadyPosted: true }); }
        if (row.status !== 'DRAFT') { await conn.rollback(); return res.status(409).json({ error: 'Bài đang tự đăng hoặc đã hủy không thể đánh dấu thủ công.' }); }
        await conn.query(`UPDATE social_post_queue SET status='POSTED',posted_at=UTC_TIMESTAMP(),
            last_error=NULL WHERE id=?`, [row.id]);
        await conn.query('UPDATE questions SET used_count=used_count+1 WHERE id=?', [row.question_id]);
        await conn.commit();
        res.json({ success: true });
    } catch (error) { if (conn) await conn.rollback(); res.status(500).json({ error: error.message }); }
    finally { conn?.release(); }
});

router.post('/admin/social/queue', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    let conn;
    try {
        const questionId = Number(req.body.question_id);
        if (!Number.isInteger(questionId) || questionId < 1) return res.status(400).json({ error: 'Câu hỏi không hợp lệ.' });
        const caption = String(req.body.caption || '').trim();
        if (!caption || caption.length > 2000) return res.status(400).json({ error: 'Caption cần có nội dung và không quá 2.000 ký tự.' });
        const scheduled = parseSchedule(req.body.scheduled_at);
        const image = req.body.image_data_url ? parseImage(req.body.image_data_url) : null;
        conn = await pool.getConnection();
        await conn.beginTransaction();
        // Lock the question so simultaneous clicks cannot create two active posts.
        const [[question]] = await conn.query('SELECT id FROM questions WHERE id=? FOR UPDATE', [questionId]);
        if (!question) { await conn.rollback(); return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' }); }
        const [[active]] = await conn.query(`SELECT id FROM social_post_queue WHERE question_id=?
            AND status IN ('DRAFT','APPROVED','PUBLISHING','UNCERTAIN') LIMIT 1`, [questionId]);
        if (active) { await conn.rollback(); return res.status(409).json({ error: 'Câu hỏi đã có trong hàng chờ hoặc cần đối soát.' }); }
        const [result] = await conn.query(`INSERT INTO social_post_queue
            (question_id,caption,scheduled_at,image_mime,image_blob,created_by)
            VALUES (?,?,?,?,?,?)`, [questionId, caption, scheduled, image?.mime || null, image?.bytes || null, req.user.id]);
        await conn.commit();
        res.json({ success: true, id: result.insertId });
    } catch (error) { if (conn) await conn.rollback(); res.status(400).json({ error: error.message }); }
    finally { conn?.release(); }
});

router.post('/admin/social/prepare', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    let conn;
    try {
        const ids = Array.isArray(req.body.question_ids) ? [...new Set(req.body.question_ids.map(Number))] : [];
        if (!ids.length || ids.length > 30 || ids.some(id => !Number.isInteger(id) || id < 1)) {
            return res.status(400).json({ error: 'Chọn từ 1 đến 30 câu hỏi hợp lệ.' });
        }
        const start = new Date(req.body.scheduled_start);
        if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now() - 60_000) {
            return res.status(400).json({ error: 'Ngày bắt đầu không hợp lệ.' });
        }
        const intervalDays = Number(req.body.interval_days ?? 1);
        if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 30) {
            return res.status(400).json({ error: 'Khoảng cách giữa các bài phải từ 1 đến 30 ngày.' });
        }
        const template = String(req.body.caption_template || DEFAULT_SOCIAL_TEMPLATE);
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const [questions] = await conn.query(`SELECT q.id,q.legacy_full_id AS id_full,m.description
            FROM questions q JOIN id6_metadata m ON m.id_full=q.legacy_full_id
            WHERE q.id IN (?) FOR UPDATE`, [ids]);
        if (questions.length !== ids.length) throw new Error('Có câu hỏi thiếu ID hợp lệ trong danh mục.');
        const byId = new Map(questions.map(q => [q.id, q]));
        const [active] = await conn.query(`SELECT question_id FROM social_post_queue WHERE question_id IN (?)
            AND status IN ('DRAFT','APPROVED','PUBLISHING','UNCERTAIN')`, [ids]);
        if (active.length) throw new Error(`${active.length} câu đã có trong danh sách hoặc cần đối soát.`);
        const created = [];
        for (let i = 0; i < ids.length; i++) {
            const question = byId.get(ids[i]);
            const date = new Date(start.getTime() + i * intervalDays * 86_400_000);
            const caption = buildSocialCaption(template, question, date);
            const scheduled = date.toISOString().slice(0, 19).replace('T', ' ');
            const [result] = await conn.query(`INSERT INTO social_post_queue
                (question_id,caption,scheduled_at,created_by) VALUES (?,?,?,?)`,
                [question.id, caption, scheduled, req.user.id]);
            created.push({ id: result.insertId, question_id: question.id, scheduled_at: scheduled });
        }
        await conn.commit();
        res.json({ success: true, data: created });
    } catch (error) { if (conn) await conn.rollback(); res.status(400).json({ error: error.message }); }
    finally { conn?.release(); }
});

router.get('/admin/social/queue/:id/image', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const [row] = await query('SELECT image_mime,image_blob FROM social_post_queue WHERE id=?', [req.params.id]);
        if (!row || !row.image_blob) return res.status(404).json({ error: 'Bài này chưa có ảnh tải lên.' });
        res.set('Cache-Control', 'private, no-store');
        res.type(row.image_mime).send(row.image_blob);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/social/queue/:id/approve', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!publisherConfig().autoEnabled) return res.status(409).json({ error: 'Tự đăng đã tắt; hãy dùng danh sách đăng thủ công.' });
    try { await verifyPageAccess(); }
    catch (error) { return res.status(502).json({ error: `Kết nối Page chưa hợp lệ: ${error.message}` }); }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const reject = async (status, message) => { await conn.rollback(); return res.status(status).json({ error: message }); };
        const [[row]] = await conn.query(`SELECT s.id,s.status,s.scheduled_at,s.caption,
            OCTET_LENGTH(s.image_blob) AS image_size,q.legacy_full_id,q.content_latex,q.unit_id,q.level_id
            FROM social_post_queue s JOIN questions q ON q.id=s.question_id WHERE s.id=? FOR UPDATE`, [req.params.id]);
        if (!row) return await reject(404, 'Không tìm thấy bài đăng.');
        if (row.status !== 'DRAFT') return await reject(409, 'Chỉ bản nháp mới có thể duyệt. Bài thất bại cần tạo lịch mới sau khi sửa lỗi.');
        if (!publisherConfig().configured) return await reject(503, 'Chưa cấu hình Page Access Token trên Render.');
        const id = normalizeId6(row.legacy_full_id || '');
        const [[metadata]] = id ? await conn.query('SELECT id_full,unit_id,level_id FROM id6_metadata WHERE id_full=? LIMIT 1', [id]) : [[]];
        if (!id || !metadata) return await reject(422, 'Câu hỏi chưa có ID hợp lệ trong danh mục.');
        const review = inspectQuestionId(row, new Map([[id, metadata]]));
        if (review.issues.length) return await reject(422, `Cần sửa ID câu hỏi trước khi đăng: ${review.issues.join(', ')}.`);
        if (!row.image_size || !row.caption) return await reject(422, 'Bài đăng thiếu ảnh hoặc caption.');
        if (new Date(row.scheduled_at).getTime() < Date.now() + 60_000) return await reject(422, 'Hãy đặt lại lịch sau hiện tại ít nhất 1 phút.');
        await conn.query(`UPDATE social_post_queue SET status='APPROVED',approved_by=?,last_error=NULL WHERE id=?`, [req.user.id, row.id]);
        await conn.commit();
        res.json({ success: true });
    } catch (error) { await conn.rollback(); res.status(500).json({ error: error.message }); }
    finally { conn.release(); }
});

router.post('/admin/social/queue/:id/cancel', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const [result] = await pool.query(`UPDATE social_post_queue SET status='CANCELLED'
            WHERE id=? AND status IN ('DRAFT','APPROVED','FAILED')`, [req.params.id]);
        if (!result.affectedRows) return res.status(409).json({ error: 'Không thể hủy bài đang đăng hoặc đã đăng.' });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
