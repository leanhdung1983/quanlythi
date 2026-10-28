import crypto from 'crypto';
import { pool, initDbPromise } from './core.js';

const DEFAULT_PAGE_ID = '100105564680397';
const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || 'v26.0';

let cachedConfig = null;

export async function getSocialConfig() {
    let dbSettings = {};
    try {
        if (pool) {
            const [rows] = await pool.query(
                "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('facebook_page_id', 'facebook_page_access_token', 'facebook_auto_enabled', 'facebook_page_name', 'facebook_graph_version')"
            );
            if (Array.isArray(rows)) {
                rows.forEach(r => { dbSettings[r.setting_key] = r.setting_value; });
            }
        }
    } catch (_) {}

    const pageId = dbSettings.facebook_page_id || process.env.FACEBOOK_PAGE_ID || DEFAULT_PAGE_ID;
    const token = dbSettings.facebook_page_access_token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
    const autoEnabled = dbSettings.facebook_auto_enabled !== undefined
        ? (dbSettings.facebook_auto_enabled === '1' || dbSettings.facebook_auto_enabled === 'true')
        : (process.env.FACEBOOK_AUTO_POST_ENABLED === '1');
    const version = dbSettings.facebook_graph_version || process.env.FACEBOOK_GRAPH_VERSION || GRAPH_VERSION;
    const pageName = dbSettings.facebook_page_name || '';

    const config = { pageId, token, autoEnabled, graphVersion: version, pageName, configured: Boolean(token) };
    cachedConfig = config;
    return config;
}

export function setCachedSocialConfig(config) {
    cachedConfig = config;
}

export function publisherConfig() {
    const pageId = cachedConfig?.pageId || process.env.FACEBOOK_PAGE_ID || DEFAULT_PAGE_ID;
    const token = cachedConfig?.token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
    const autoEnabled = cachedConfig?.autoEnabled !== undefined
        ? cachedConfig.autoEnabled
        : (process.env.FACEBOOK_AUTO_POST_ENABLED === '1');
    const version = cachedConfig?.graphVersion || process.env.FACEBOOK_GRAPH_VERSION || GRAPH_VERSION;
    const pageName = cachedConfig?.pageName || '';
    return { pageId, configured: Boolean(token), autoEnabled, graphVersion: version, pageName };
}

export async function verifyPageAccess(fetcher = fetch, token, pageId) {
    const t = token ?? (cachedConfig?.token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '');
    const p = pageId ?? (cachedConfig?.pageId || process.env.FACEBOOK_PAGE_ID || DEFAULT_PAGE_ID);
    const v = cachedConfig?.graphVersion || process.env.FACEBOOK_GRAPH_VERSION || GRAPH_VERSION;

    if (!t) throw new Error('Chưa cấu hình Page Access Token.');
    const response = await fetcher(`https://graph.facebook.com/${v}/${p}?fields=id,name`, {
        headers: { Authorization: `Bearer ${t}` }, signal: AbortSignal.timeout(15_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || String(data.id) !== p) {
        throw new Error(data.error?.message || 'Token không truy cập được đúng Facebook Page.');
    }
    return { id: String(data.id), name: String(data.name || '') };
}

export async function publishPhoto({ image, mime, caption }, fetcher = fetch, token, pageId) {
    const t = token ?? (cachedConfig?.token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '');
    const p = pageId ?? (cachedConfig?.pageId || process.env.FACEBOOK_PAGE_ID || DEFAULT_PAGE_ID);
    const v = cachedConfig?.graphVersion || process.env.FACEBOOK_GRAPH_VERSION || GRAPH_VERSION;

    if (!t || !/^\d{5,30}$/.test(p)) throw new Error('Chưa cấu hình Facebook Page ID hoặc Page Access Token.');
    const form = new FormData();
    form.append('source', new Blob([image], { type: mime }), 'question.' + (mime === 'image/png' ? 'png' : 'jpg'));
    form.append('caption', caption);
    form.append('published', 'true');
    const response = await fetcher(`https://graph.facebook.com/${v}/${p}/photos`, {
        method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form,
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

export async function publishFeedPost({ caption }, fetcher = fetch, token, pageId) {
    const t = token ?? (cachedConfig?.token || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '');
    const p = pageId ?? (cachedConfig?.pageId || process.env.FACEBOOK_PAGE_ID || DEFAULT_PAGE_ID);
    const v = cachedConfig?.graphVersion || process.env.FACEBOOK_GRAPH_VERSION || GRAPH_VERSION;

    if (!t || !/^\d{5,30}$/.test(p)) throw new Error('Chưa cấu hình Facebook Page ID hoặc Page Access Token.');
    const response = await fetcher(`https://graph.facebook.com/${v}/${p}/feed`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${t}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: caption }),
        signal: AbortSignal.timeout(60_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id) {
        const error = new Error(data.error?.message || `Meta API trả về HTTP ${response.status}`);
        error.metaResponse = response.status < 500;
        throw error;
    }
    return { photoId: null, postId: String(data.id) };
}

export async function publishItem(item, fetcher = fetch, token, pageId) {
    if (item.image && item.image.length > 0) {
        return publishPhoto(item, fetcher, token, pageId);
    }
    return publishFeedPost(item, fetcher, token, pageId);
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

async function claimSpecificPost(postId) {
    const claim = crypto.randomUUID();
    const [result] = await pool.query(`UPDATE social_post_queue SET status='PUBLISHING', claim_token=?,
        publish_started_at=UTC_TIMESTAMP(), attempt_count=attempt_count+1
        WHERE id=? AND status IN ('DRAFT','APPROVED','FAILED','UNCERTAIN')`, [claim, postId]);
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

export async function publishSinglePost(postId, fetcher = fetch) {
    await initDbPromise;
    if (!pool) throw new Error('Cơ sở dữ liệu chưa sẵn sàng.');
    const config = await getSocialConfig();
    if (!config.token) throw new Error('Chưa cấu hình Facebook Page Access Token.');

    const item = await claimSpecificPost(postId);
    if (!item) throw new Error('Không tìm thấy bài viết hoặc bài viết đang trong quá trình đăng.');

    let metaResult = null;
    try {
        metaResult = await publishItem(
            { image: item.image_blob, mime: item.image_mime, caption: item.caption },
            fetcher, config.token, config.pageId
        );
        await finishPost(item, metaResult);
        return { success: true, photoId: metaResult.photoId, postId: metaResult.postId };
    } catch (error) {
        const status = !metaResult && error.metaResponse ? 'FAILED' : 'UNCERTAIN';
        await pool.query(`UPDATE social_post_queue SET status=?,last_error=?,claim_token=NULL,
            fb_photo_id=COALESCE(fb_photo_id,?),fb_post_id=COALESCE(fb_post_id,?)
            WHERE id=? AND status='PUBLISHING' AND claim_token=?`,
            [status, String(error.message).slice(0, 1000), metaResult?.photoId || null,
                metaResult?.postId || null, item.id, item.claim]);
        throw error;
    }
}

export async function publishDuePosts(fetcher = fetch) {
    const config = await getSocialConfig();
    if (!config.token || !config.autoEnabled) return 0;
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
            metaResult = await publishItem(
                { image: item.image_blob, mime: item.image_mime, caption: item.caption },
                fetcher, config.token, config.pageId
            );
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
    let busy = false;
    const run = async () => {
        if (busy) return;
        busy = true;
        try {
            const config = await getSocialConfig();
            if (config.autoEnabled && config.token) {
                await publishDuePosts();
            }
        } catch (error) {
            console.error('[SOCIAL] Publisher error:', error.message);
        } finally {
            busy = false;
        }
    };
    setTimeout(run, 5000).unref();
    setInterval(run, 30_000).unref();
}
