import 'dotenv/config';

// Cron runs need a pool, not the web app's full schema/seed workflow every minute.
process.env.SOCIAL_CRON_ONLY = '1';
const core = await import('../api/core.js');
const { publishDuePosts } = await import('../api/socialPublisher.js');

try {
    await core.initDbPromise;
    const count = await publishDuePosts();
    console.log(`[SOCIAL] Processed ${count} due post(s).`);
} catch (error) {
    console.error('[SOCIAL] Cron run failed:', error.message);
    process.exitCode = 1;
} finally {
    if (core.pool) await core.pool.end();
}
