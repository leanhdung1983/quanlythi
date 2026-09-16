import crypto from 'crypto';
import { pool, initDbPromise } from './core.js';

const PAGE_ID = process.env.FACEBOOK_PAGE_ID || '100105564680397';
const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || 'v26.0';

export function publisherConfig() {
    return { pageId: PAGE_ID, configured: Boolean(TOKEN), graphVersion: GRAPH_VERSION };
}

export async function verifyPageAccess(fetcher = fetch, token = TOKEN, pageId = PAGE_ID) {
    if (!token) throw new Error('Chưa cấu hình Page Access Token.');
    const response = await fetcher(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}?fields=id,name`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || String(data.id) !== pageId) throw new Error(data.error?.message || 'Token không truy cập được đúng Facebook Page.');
    return { id: String(data.id), name: String(data.name || '') };
}

export async function publishPhoto({ image, mime, caption }, fetcher = fetch, token = TOKEN, pageId = PAGE_ID) {
    if (!token || !/^\d{5,30}$/.test(pageId)) throw new Error('Chưa cấu hình Facebook Page ID hoặc Page Access Token.');
    const form = new FormData();
    form.append('source', new Blob([image], { type: mime }), 'question.' + (mime === 'image/png' ? 'png' : 'jpg'));
    form.append('caption', caption);
    form.append('published', 'true');
    const response = await fetcher(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
        signal: AbortSignal.timeout(60_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id) {
        const error = new Error(data.error?.message || `Meta API trả về HTTP ${response.status}`);
        error.metaResponse = response.status < 500;
        throw error;
    }
    return { photoId: String(data.id), postId: data.post_id ? String(data.post_id) : null };
}

async function claimDuePost() {
    const claim = crypto.randomUUID();
    const [result] = await pool.query(`UPDATE social_post_queue SET status='PUBLISHING', claim_token=?,
        publish_started_at=UTC_TIMESTAMP(), attempt_count=attempt_count+1
        WHERE status='APPROVED' AND scheduled_at<=UTC_TIMESTAMP() ORDER BY scheduled_at,id LIMIT 1`, [claim]);
    if (!result.affectedRows) return null;
    const [rows] = await pool.query(`SELECT id,question_id,caption,image_mime,image_blob
        FROM social_post_queue WHERE claim_token=? LIMIT 1`, [claim]);
    return { ...rows[0], claim };
}

async function finishPost(item, result) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [updated] = await conn.query(`UPDATE social_post_queue SET status='POSTED',
            fb_photo_id=?,fb_post_id=?,posted_at=UTC_TIMESTAMP(),claim_token=NULL,last_error=NULL
            WHERE id=? AND status='PUBLISHING' AND claim_token=?`,
            [result.photoId, result.postId, item.id, item.claim]);
        if (updated.affectedRows) await conn.query('UPDATE questions SET used_count=used_count+1 WHERE id=?', [item.question_id]);
        await conn.commit();
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
}

export async function publishDuePosts() {
    if (!TOKEN) return 0;
    await initDbPromise;
    if (!pool) return 0;
    await pool.query(`UPDATE social_post_queue SET status='UNCERTAIN',claim_token=NULL,
        last_error='Tiến trình đăng bị ngắt; cần kiểm tra bài trên Page trước khi thử lại.'
        WHERE status='PUBLISHING' AND publish_started_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE`);
    let processed = 0;
    for (let i = 0; i < 5; i++) {
        const item = await claimDuePost();
        if (!item) break;
        processed++;
        let metaResult = null;
        try {
            metaResult = await publishPhoto({ image: item.image_blob, mime: item.image_mime, caption: item.caption });
            await finishPost(item, metaResult);
        } catch (error) {
            // A lost network response might mean Meta published the photo. Never retry blindly.
            const status = !metaResult && error.metaResponse ? 'FAILED' : 'UNCERTAIN';
            await pool.query(`UPDATE social_post_queue SET status=?,last_error=?,claim_token=NULL,
                fb_photo_id=COALESCE(fb_photo_id,?),fb_post_id=COALESCE(fb_post_id,?)
                WHERE id=? AND status='PUBLISHING' AND claim_token=?`,
                [status, String(error.message).slice(0, 1000), metaResult?.photoId || null,
                    metaResult?.postId || null, item.id, item.claim]);
            console.error(`[SOCIAL] Post ${item.id} ${status}: ${error.message}`);
        }
    }
    return processed;
}

export function startSocialPublisher() {
    if (!TOKEN) { console.log('[SOCIAL] Auto-post paused: FACEBOOK_PAGE_ACCESS_TOKEN is not configured.'); return; }
    let busy = false;
    const run = async () => {
        if (busy) return;
        busy = true;
        try { await publishDuePosts(); }
        catch (error) { console.error('[SOCIAL] Publisher error:', error.message); }
        finally { busy = false; }
    };
    setTimeout(run, 5000).unref();
    setInterval(run, 30_000).unref();
}
