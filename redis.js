import { createClient } from 'redis';
import 'dotenv/config';

let redisClient = null;
let isRedisConnected = false;

let redisUrl = process.env.REDIS_URL?.trim().replace(/^['"]|['"]$/g, '');
if (redisUrl) {
    // If the user pasted the full Upstash redis-cli command, extract just the URL
    if (redisUrl.startsWith('redis-cli')) {
        const match = redisUrl.match(/-u\s+['"]?(redis[s]?:\/\/[^\s'"]+)/);
        if (match && match[1]) {
            redisUrl = match[1];
            // If it uses --tls, Upstash requires rediss:// instead of redis://
            if (process.env.REDIS_URL.includes('--tls') && redisUrl.startsWith('redis://')) {
                redisUrl = redisUrl.replace('redis://', 'rediss://');
            }
        }
    }

    if (!/^rediss?:\/\//i.test(redisUrl)) {
        console.warn('⚠️ [REDIS] REDIS_URL không hợp lệ. Chạy không có Redis cache.');
        redisUrl = '';
    }

    if (redisUrl) redisClient = createClient({ url: redisUrl });

    redisClient?.on('error', (err) => {
        console.error('❌ [REDIS] Error:', err.message);
        isRedisConnected = false;
    });

    redisClient?.on('connect', () => {
        console.log('✅ [REDIS] Connected successfully to', new URL(redisUrl).host);
        isRedisConnected = true;
    });

    redisClient?.connect().catch(err => {
        console.error('❌ [REDIS] Connection Failed:', err.message);
    });
} else {
    console.log('⚠️ [REDIS] REDIS_URL not provided. Running without Redis cache.');
}

/**
 * Express middleware for caching responses in Redis
 * @param {number} duration Cache duration in seconds
 */
export const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        if (!isRedisConnected || req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;
        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                // If found, send it directly and skip hitting the database/downstream logic
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedData));
            }
        } catch (err) {
            console.error('⚠️ [REDIS] Get Error:', err.message);
        }

        res.setHeader('X-Cache', 'MISS');

        // Intercept res.json to cache the response before sending it
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (isRedisConnected && res.statusCode === 200) {
                try {
                    redisClient.setEx(key, duration, JSON.stringify(body)).catch(err => {
                        console.error('⚠️ [REDIS] Set Error:', err.message);
                    });
                } catch (e) {
                    console.error('⚠️ [REDIS] JSON Stringify Error:', e.message);
                }
            }
            return originalJson(body);
        };

        next();
    };
};

export const clearCache = async (pattern) => {
    if (!isRedisConnected) return;
    try {
        const keysToDelete = [];
        if (typeof redisClient.scanIterator === 'function') {
            for await (const batch of redisClient.scanIterator({ MATCH: `cache:${pattern}`, COUNT: 100 })) {
                const keys = Array.isArray(batch) ? batch : [batch];
                keysToDelete.push(...keys);
                if (keysToDelete.length >= 500) {
                    await redisClient.del(...keysToDelete);
                    keysToDelete.length = 0;
                }
            }
        } else {
            console.warn('⚠️ [REDIS] Máy chủ Redis không hỗ trợ SCAN; bỏ qua thao tác xóa cache theo mẫu để tránh khóa hệ thống.');
            return;
        }

        if (keysToDelete.length > 0) {
            await redisClient.del(...keysToDelete);
        }
        console.log(`🧹 [REDIS] Cleared cache matching ${pattern}`);
    } catch (err) {
        console.error('⚠️ [REDIS] Clear Cache Error:', err.message);
    }
};

export default redisClient;
