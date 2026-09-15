import crypto from 'crypto';
import express from 'express';
import { pool, requireAdmin } from '../core.js';

const router = express.Router();
const workerIdValid = value => /^[a-f0-9-]{36}$/i.test(String(value || ''));
const tokenValid = value => /^[a-f0-9]{64}$/i.test(String(value || ''));
const jobId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const publicColumns = 'id, status, after_id AS afterId, scanned, synced, failed, heartbeat_at AS heartbeatAt, error_message AS errorMessage, created_at AS createdAt, updated_at AS updatedAt';

async function withTransaction(work) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await work(conn);
        await conn.commit();
        return result;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

function fail(res, error, message) {
    console.error('[TIKZ JOB]', error);
    return res.status(500).json({ error: message });
}

router.get('/admin/tikz-jobs/status', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const [jobs] = await pool.query(`SELECT ${publicColumns} FROM tikz_render_jobs ORDER BY id DESC LIMIT 1`);
        const [workers] = await pool.query('SELECT worker_id AS workerId, last_seen AS lastSeen FROM tikz_worker_presence WHERE last_seen > NOW() - INTERVAL 30 SECOND ORDER BY last_seen DESC LIMIT 1');
        res.json({ success: true, job: jobs[0] || null, worker: workers[0] || null });
    } catch (error) { fail(res, error, 'Không thể đọc trạng thái biên dịch.'); }
});

router.get('/admin/tikz-jobs/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!jobId(req.params.id)) return res.status(400).json({ error: 'ID công việc không hợp lệ.' });
    try {
        const [jobs] = await pool.query(`SELECT ${publicColumns} FROM tikz_render_jobs WHERE id = ?`, [req.params.id]);
        if (!jobs.length) return res.status(404).json({ error: 'Công việc không tồn tại.' });
        res.json({ success: true, job: jobs[0] });
    } catch (error) { fail(res, error, 'Không thể đọc công việc.'); }
});

router.post('/admin/tikz-jobs', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const result = await withTransaction(async conn => {
            const [control] = await conn.query('SELECT active_job_id FROM tikz_render_control WHERE id = 1 FOR UPDATE');
            if (!control.length) throw new Error('TikZ job control missing');
            if (control[0].active_job_id) {
                const [active] = await conn.query(`SELECT ${publicColumns} FROM tikz_render_jobs WHERE id = ? FOR UPDATE`, [control[0].active_job_id]);
                const cancelledStale = active.length && active[0].status === 'CANCEL_REQUESTED'
                    && (!active[0].heartbeatAt || Date.now() - new Date(active[0].heartbeatAt).getTime() > 10 * 60 * 1000);
                if (cancelledStale) {
                    await conn.query("UPDATE tikz_render_jobs SET status = 'CANCELLED', lease_token = NULL WHERE id = ?", [active[0].id]);
                } else if (active.length && ['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(active[0].status)) {
                    return { job: active[0], existing: true };
                }
            }
            const [created] = await conn.query('INSERT INTO tikz_render_jobs (requested_by) VALUES (?)', [req.user.id]);
            await conn.query('UPDATE tikz_render_control SET active_job_id = ? WHERE id = 1', [created.insertId]);
            const [jobs] = await conn.query(`SELECT ${publicColumns} FROM tikz_render_jobs WHERE id = ?`, [created.insertId]);
            return { job: jobs[0], existing: false };
        });
        res.status(result.existing ? 200 : 201).json({ success: true, ...result });
    } catch (error) { fail(res, error, 'Không thể tạo công việc TikZ.'); }
});

router.post('/admin/tikz-jobs/:id/cancel', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (!jobId(req.params.id)) return res.status(400).json({ error: 'ID công việc không hợp lệ.' });
    try {
        const job = await withTransaction(async conn => {
            const [rows] = await conn.query(`SELECT ${publicColumns} FROM tikz_render_jobs WHERE id = ? FOR UPDATE`, [req.params.id]);
            if (!rows.length) return null;
            if (rows[0].status === 'QUEUED') {
                await conn.query("UPDATE tikz_render_jobs SET status = 'CANCELLED' WHERE id = ?", [req.params.id]);
                await conn.query('UPDATE tikz_render_control SET active_job_id = NULL WHERE id = 1 AND active_job_id = ?', [req.params.id]);
            } else if (rows[0].status === 'RUNNING') {
                await conn.query("UPDATE tikz_render_jobs SET status = 'CANCEL_REQUESTED' WHERE id = ?", [req.params.id]);
            }
            const [updated] = await conn.query(`SELECT ${publicColumns} FROM tikz_render_jobs WHERE id = ?`, [req.params.id]);
            return updated[0];
        });
        if (!job) return res.status(404).json({ error: 'Công việc không tồn tại.' });
        res.json({ success: true, job });
    } catch (error) { fail(res, error, 'Không thể dừng công việc TikZ.'); }
});

router.post('/admin/tikz-worker/heartbeat', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const workerId = req.body.workerId;
    if (!workerIdValid(workerId)) return res.status(400).json({ error: 'ID worker không hợp lệ.' });
    try {
        await pool.query('INSERT INTO tikz_worker_presence (worker_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen = NOW()', [workerId]);
        res.json({ success: true });
    } catch (error) { fail(res, error, 'Không thể cập nhật trạng thái worker.'); }
});

router.post('/admin/tikz-worker/claim', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const workerId = req.body.workerId;
    if (!workerIdValid(workerId)) return res.status(400).json({ error: 'ID worker không hợp lệ.' });
    try {
        const claimed = await withTransaction(async conn => {
            const [control] = await conn.query('SELECT active_job_id FROM tikz_render_control WHERE id = 1 FOR UPDATE');
            if (!control[0]?.active_job_id) return null;
            const [rows] = await conn.query('SELECT id, status, after_id AS afterId, heartbeat_at AS heartbeatAt FROM tikz_render_jobs WHERE id = ? FOR UPDATE', [control[0].active_job_id]);
            const job = rows[0];
            if (!job) return null;
            const stale = ['RUNNING', 'CANCEL_REQUESTED'].includes(job.status)
                && (!job.heartbeatAt || Date.now() - new Date(job.heartbeatAt).getTime() > 10 * 60 * 1000);
            if (job.status === 'CANCEL_REQUESTED') {
                if (stale) {
                    await conn.query("UPDATE tikz_render_jobs SET status = 'CANCELLED', lease_token = NULL WHERE id = ?", [job.id]);
                    await conn.query('UPDATE tikz_render_control SET active_job_id = NULL WHERE id = 1 AND active_job_id = ?', [job.id]);
                }
                return null;
            }
            if (job.status !== 'QUEUED' && !stale) return null;
            const token = crypto.randomBytes(32).toString('hex');
            await conn.query("UPDATE tikz_render_jobs SET status = 'RUNNING', worker_id = ?, lease_token = ?, heartbeat_at = NOW() WHERE id = ?", [workerId, token, job.id]);
            return { id: job.id, afterId: job.afterId, token };
        });
        res.json({ success: true, job: claimed });
    } catch (error) { fail(res, error, 'Worker không thể nhận công việc.'); }
});

router.post('/admin/tikz-jobs/:id/progress', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = jobId(req.params.id);
    const { token, afterId, synced = 0, failed = 0 } = req.body;
    if (!id || !tokenValid(token) || !Number.isSafeInteger(afterId) || afterId < 0
        || !Number.isSafeInteger(synced) || synced < 0 || synced > 100
        || !Number.isSafeInteger(failed) || failed < 0 || failed > 100) {
        return res.status(400).json({ error: 'Tiến độ không hợp lệ.' });
    }
    try {
        const [result] = await pool.query(
            `UPDATE tikz_render_jobs SET after_id = ?, scanned = scanned + 1, synced = synced + ?, failed = failed + ?, heartbeat_at = NOW()
             WHERE id = ? AND lease_token = ? AND status IN ('RUNNING', 'CANCEL_REQUESTED') AND after_id < ?`,
            [afterId, synced, failed, id, token, afterId],
        );
        if (!result.affectedRows) {
            const [rows] = await pool.query('SELECT after_id AS afterId, lease_token AS token, status FROM tikz_render_jobs WHERE id = ?', [id]);
            if (rows.length && rows[0].token === token && rows[0].afterId >= afterId
                && ['RUNNING', 'CANCEL_REQUESTED'].includes(rows[0].status)) {
                return res.json({ success: true, duplicate: true });
            }
            return res.status(409).json({ error: 'Tiến độ đã ghi hoặc quyền worker đã hết hạn.' });
        }
        res.json({ success: true });
    } catch (error) { fail(res, error, 'Không thể lưu tiến độ.'); }
});

router.post('/admin/tikz-jobs/:id/heartbeat', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = jobId(req.params.id);
    const token = req.body.token;
    if (!id || !tokenValid(token)) return res.status(400).json({ error: 'Worker không hợp lệ.' });
    try {
        await pool.query(
            "UPDATE tikz_render_jobs SET heartbeat_at = NOW() WHERE id = ? AND lease_token = ? AND status IN ('RUNNING', 'CANCEL_REQUESTED')",
            [id, token],
        );
        const [rows] = await pool.query(
            "SELECT status FROM tikz_render_jobs WHERE id = ? AND lease_token = ? AND status IN ('RUNNING', 'CANCEL_REQUESTED')",
            [id, token],
        );
        if (!rows.length) return res.status(409).json({ error: 'Worker đã hết quyền xử lý.' });
        res.json({ success: true, status: rows[0].status });
    } catch (error) { fail(res, error, 'Không thể cập nhật nhịp worker.'); }
});

router.post('/admin/tikz-jobs/:id/finish', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = jobId(req.params.id);
    const { token, status, error = '' } = req.body;
    if (!id || !tokenValid(token) || !['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: 'Kết quả công việc không hợp lệ.' });
    }
    try {
        const finished = await withTransaction(async conn => {
            const [rows] = await conn.query('SELECT status, lease_token FROM tikz_render_jobs WHERE id = ? FOR UPDATE', [id]);
            if (!rows.length || rows[0].lease_token !== token || !['RUNNING', 'CANCEL_REQUESTED'].includes(rows[0].status)) return false;
            if (rows[0].status === 'CANCEL_REQUESTED' && status === 'COMPLETED') return false;
            await conn.query('UPDATE tikz_render_jobs SET status = ?, error_message = ?, heartbeat_at = NOW(), lease_token = NULL WHERE id = ?', [status, String(error).slice(0, 1000) || null, id]);
            await conn.query('UPDATE tikz_render_control SET active_job_id = NULL WHERE id = 1 AND active_job_id = ?', [id]);
            return true;
        });
        if (!finished) return res.status(409).json({ error: 'Công việc đã thay đổi hoặc worker không còn quyền.' });
        res.json({ success: true });
    } catch (error) { fail(res, error, 'Không thể hoàn tất công việc.'); }
});

export default router;
