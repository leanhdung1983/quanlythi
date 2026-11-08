import mysql from 'mysql2/promise';
import { seedDatabase as runSeedDatabase } from './dbSchema.js';
import { processBackgroundJobs as runBackgroundJobs } from './backgroundJobs.js';
import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";
import { sanitizeCompiledSvg } from './svgImage.js';
import { classifyGeminiFailure, cooldownForFailure, orderAvailableAttempts } from './geminiResilience.js';
import { resolveGeminiModels } from './geminiModels.js';
import { cacheMiddleware, clearCache } from '../redis.js';

// Re-export cache helpers
export { cacheMiddleware, clearCache };

// --- DATABASE CONFIGURATION ---
const isCloudDB = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1');

export const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'id6_question_bank',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: isCloudDB ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : undefined
};

console.log(`[DB] Connecting to ${dbConfig.host}:${dbConfig.port} (SSL: ${isCloudDB ? 'Enabled' : 'Disabled'})`);

export let pool = null;
export let initDbPromise = null;

// --- INITIALIZE DATABASE ---
export async function initializeDatabase() {
    // 1. Ensure Database Exists
    const { database, ...configWithoutDB } = dbConfig;
    try {
        const tempConn = await mysql.createConnection(configWithoutDB);
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await tempConn.end();
        console.log(`âœ… [DB] Database \`${database}\` ensured.`);
    } catch (err) {
        console.warn("âš ï¸ [DB] Could not ensure database exists (might already exist or no permission):", err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.error("âŒ [DB] CRITICAL: MySQL server is not reachable at " + dbConfig.host + ":" + dbConfig.port);
            console.error("   Please ensure MySQL is running and DB_HOST/DB_PORT are correct in your environment.");
        }
    }

    // 2. Create Pool
    pool = mysql.createPool(dbConfig);

    try {
        const conn = await pool.getConnection();
        console.log("âœ… [DB] Database connected successfully!");
        conn.release();
        if (process.env.SOCIAL_CRON_ONLY !== '1') await seedDatabase();
    } catch (err) {
        console.error("âŒ [DB] Connection Failed:", err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.error("   TIP: Check if your database server is running.");
        }
    }
}

// Auto-initialize connection pool
initDbPromise = initializeDatabase();

// --- HELPER QUERIES ---
export async function query(sql, params) {
    try {
        if (!pool && initDbPromise) await initDbPromise;
        if (!pool) throw new Error("Database pool not initialized");
        const [results] = await pool.query(sql, params);
        return results;
    } catch (error) {
        console.error("âŒ DB Query Error:", error.message, "\nSQL:", sql);
        throw error;
    }
}

// --- AUTH & SESSION CONFIGURATION ---
const authSecret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.AUTH_SECRET) console.warn('âš ï¸ [AUTH] AUTH_SECRET chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh; phiÃªn Ä‘Äƒng nháº­p sáº½ háº¿t háº¡n khi server khá»Ÿi Ä‘á»™ng láº¡i.');
export const loginAttempts = new Map();
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 giá»

export function signSession(user) {
    const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + SESSION_DURATION_MS })).toString('base64url');
    const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

export function readSession(req) {
    const cookie = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('id6_session='));
    const token = cookie ? decodeURIComponent(cookie.slice('id6_session='.length)) : null;
    if (!token) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.exp > Date.now() ? session : null;
}

// Middleware xÃ¡c thá»±c phiÃªn ngÆ°á»i dÃ¹ng cho API
export async function sessionMiddleware(req, res, next) {
    // Only protect /api/*
    if (!req.path.startsWith('/api/')) return next();
    const publicPaths = ['/api/login', '/api/logout', '/api/register', '/api/forgot-password', '/api/reset-password', '/api/ping'];
    if (publicPaths.includes(req.path) || (req.method === 'POST' && req.path === '/api/payments/sepay/webhook') || (req.method === 'GET' && /^\/api\/images\/[a-f0-9]{64}$/i.test(req.path))) return next();
    try {
        const session = readSession(req);
        if (!session) return res.status(401).json({ error: 'PhiÃªn Ä‘Äƒng nháº­p khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.' });
        const [currentUser] = await query('SELECT id, role FROM users WHERE id = ?', [session.id]);
        if (!currentUser) return res.status(401).json({ error: 'TÃ i khoáº£n khÃ´ng cÃ²n hoáº¡t Ä‘á»™ng.' });
        req.user = { ...session, role: currentUser.role };

        // Sliding session: Tá»± Ä‘á»™ng gia háº¡n cookie khi phiÃªn cÃ²n dÆ°á»›i 12 giá»
        if (session.exp - Date.now() < 12 * 60 * 60 * 1000) {
            const secure = process.env.NODE_ENV === 'production';
            res.cookie('id6_session', signSession(currentUser), { 
                httpOnly: true, 
                sameSite: 'strict', 
                secure, 
                maxAge: SESSION_DURATION_MS, 
                path: '/' 
            });
        }

        if ((req.path.startsWith('/api/admin') || req.path === '/api/users' || /^\/api\/users\/\d+\/(toggle-pro|renew-pro|reset-password)$/.test(req.path)) && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n thao tÃ¡c nÃ y.' });
        }
        next();
    } catch {
        return res.status(401).json({ error: 'PhiÃªn Ä‘Äƒng nháº­p khÃ´ng há»£p lá»‡.' });
    }
}

// --- PERMISSIONS ---
export function isAdmin(req) {
    return req.user?.role === 'ADMIN';
}

export function isSelfOrAdmin(req, userId) {
    return isAdmin(req) || Number(req.user?.id) === Number(userId);
}

export function requireAdmin(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({ error: 'Chá»‰ Quáº£n trá»‹ viÃªn má»›i Ä‘Æ°á»£c phÃ©p thá»±c hiá»‡n thao tÃ¡c nÃ y.' });
        return false;
    }
    return true;
}

export function requireTeacherOrAdmin(req, res) {
    if (!['ADMIN', 'TEACHER'].includes(req.user?.role)) {
        res.status(403).json({ error: 'Chá»‰ GiÃ¡o viÃªn hoáº·c Quáº£n trá»‹ viÃªn má»›i Ä‘Æ°á»£c phÃ©p thá»±c hiá»‡n thao tÃ¡c nÃ y.' });
        return false;
    }
    return true;
}

export async function canManageQuestion(req, questionId) {
    if (isAdmin(req)) return true;
    if (req.user?.role !== 'TEACHER') return false;
    const [question] = await query('SELECT created_by FROM questions WHERE id = ?', [questionId]);
    return Boolean(question && Number(question.created_by) === Number(req.user.id));
}

export async function canManageClass(req, classId) {
    if (isAdmin(req)) return true;
    const [classroom] = await query('SELECT teacher_id FROM classes WHERE id = ?', [classId]);
    return Boolean(classroom && Number(classroom.teacher_id) === Number(req.user?.id));
}

export async function canAccessClass(req, classId) {
    if (await canManageClass(req, classId)) return true;
    const [classroom] = await query('SELECT code, name FROM classes WHERE id = ?', [classId]);
    if (classroom && (['THY6TO', 'WWHXNV', 'W0DBUX'].includes(classroom.code) || (classroom.name && classroom.name.includes('Tá»± do')))) {
        return true;
    }
    const [membership] = await query('SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ?', [classId, req.user?.id]);
    return Boolean(membership);
}

export async function canAccessExamResult(req, resultId) {
    if (isAdmin(req)) return true;
    const [result] = await query('SELECT user_id, matrix_id FROM exam_results WHERE id = ?', [resultId]);
    if (!result) return false;
    if (Number(result.user_id) === Number(req.user?.id)) return true;
    if (req.user?.role === 'TEACHER' && result.matrix_id) {
        const [teaching] = await query(`
            SELECT 1 FROM class_assignments ca
            JOIN classes c ON ca.class_id = c.id
            JOIN class_students cs ON ca.class_id = cs.class_id
            WHERE ca.matrix_id = ? AND cs.student_id = ? AND c.teacher_id = ?
            LIMIT 1
        `, [result.matrix_id, result.user_id, req.user.id]);
        return Boolean(teaching);
    }
    return false;
}

export async function canManageMatrix(req, matrixId) {
    if (isAdmin(req)) return true;
    const [matrix] = await query('SELECT created_by FROM matrix_templates WHERE id = ?', [matrixId]);
    return Boolean(matrix && Number(matrix.created_by) === Number(req.user?.id));
}

// --- GEMINI AI HELPERS ---
export async function getGeminiApiKeys(userId) {
    const rawKeys = [];
    try {
        if (userId) {
            const users = await query('SELECT api_key FROM users WHERE id = ?', [userId]);
            if (users?.[0]?.api_key) rawKeys.push(users[0].api_key);
        }
        const rows = await query("SELECT setting_value FROM system_settings WHERE setting_key = 'gemini_api_key'");
        if (rows && rows.length > 0 && rows[0].setting_value) {
            rawKeys.push(rows[0].setting_value);
        }
    } catch(e) {
        console.error("Helper getGeminiApiKeys error:", e.message);
    }
    if (process.env.GEMINI_API_KEY) {
        rawKeys.push(process.env.GEMINI_API_KEY);
    }

    const keys = [];
    for (const raw of rawKeys) {
        if (typeof raw === 'string') {
            const parts = raw.split(/[\r\n,;\s]+/)
                .map(k => k.trim().replace(/^["']|["']$/g, ''))
                .filter(k => k.length >= 20);
            for (const p of parts) {
                if (!keys.includes(p)) keys.push(p);
            }
        }
    }
    return keys;
}

export async function getGeminiApiKey(userId) {
    const keys = await getGeminiApiKeys(userId);
    return keys[0] || '';
}

export function parseGeminiError(e) {
    const msg = String(e?.message || e || '');
    if (e?.status === 503 || msg.includes("503") || msg.includes("high demand") || msg.includes("spikes in demand")) {
        return "MÃ¡y chá»§ AI cá»§a Google Ä‘ang cÃ³ lÆ°á»£ng truy cáº­p Ä‘á»™t biáº¿n (503 High Demand). Há»‡ thá»‘ng Ä‘Ã£ tá»± Ä‘á»™ng thá»­ cÃ¡c key vÃ  model dá»± phÃ²ng; vui lÃ²ng thá»­ láº¡i sau giÃ¢y lÃ¡t.";
    }
    if (e?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        return "Gemini Ä‘ang giá»›i háº¡n lÆ°á»£t dÃ¹ng cá»§a project. Há»‡ thá»‘ng Ä‘Ã£ tá»± chuyá»ƒn model/key vÃ  lÃ m nguá»™i lá»±a chá»n bá»‹ 429; vui lÃ²ng giá»¯ cá»­a sá»• má»Ÿ Ä‘á»ƒ tá»± thá»­ láº¡i. Nhiá»u key chá»‰ tÄƒng quota khi chÃºng thuá»™c cÃ¡c Google Cloud project khÃ¡c nhau.";
    }
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
        return "Lá»—i: API Key khÃ´ng há»£p lá»‡. Vui lÃ²ng thiáº¿t láº­p API Key Ä‘Ãºng tá»« Google AI Studio.";
    }
    try {
        if (typeof e.message === 'string' && e.message.startsWith('{')) {
            const parsed = JSON.parse(e.message);
            if (parsed.error && parsed.error.message) {
                if (parsed.error.code === 429) {
                    return "Gemini Ä‘Ã£ háº¿t quota cá»§a project. Há»‡ thá»‘ng sáº½ tá»± thá»­ láº¡i sau thá»i gian lÃ m nguá»™i; key dá»± phÃ²ng chá»‰ há»¯u Ã­ch náº¿u thuá»™c project khÃ¡c.";
                }
                return "Lá»—i tá»« Gemini: " + parsed.error.message;
            }
        }
    } catch {}
    return "Lá»—i trong quÃ¡ trÃ¬nh táº¡o: " + (e.message || String(e));
}

const geminiCooldowns = new Map();

export async function generateWithFallback(aiOrKeys, prompt, config, additionalParts = []) {
    const requestedModels = Array.isArray(config?.modelCandidates) ? config.modelCandidates.filter(Boolean) : [];
    const modelPreference = config?.modelPreference === 'lite' ? 'lite' : 'flash';
    const { modelCandidates: _modelCandidates, modelPreference: _modelPreference, ...requestConfig } = config || {};
    const contents = additionalParts.length ? { parts: [...additionalParts, { text: prompt }] } : prompt;

    let aiInstances = [];
    if (Array.isArray(aiOrKeys)) {
        aiInstances = aiOrKeys.map(k => (typeof k === 'string' ? new GoogleGenAI({ apiKey: k }) : k));
    } else if (aiOrKeys?._keys && Array.isArray(aiOrKeys._keys)) {
        aiInstances = aiOrKeys._keys.map(k => (typeof k === 'string' ? new GoogleGenAI({ apiKey: k }) : k));
    } else if (typeof aiOrKeys === 'string') {
        aiInstances = [new GoogleGenAI({ apiKey: aiOrKeys })];
    } else if (aiOrKeys) {
        aiInstances = [aiOrKeys];
    }

    if (aiInstances.length === 0) {
        throw new Error('ChÆ°a cáº¥u hÃ¬nh Gemini API Key.');
    }

    const candidateModels = await resolveGeminiModels(aiInstances[0], requestedModels, modelPreference);

    const keys = Array.isArray(aiOrKeys) ? aiOrKeys : (aiOrKeys?._keys || []);
    const keyValues = keys.length
        ? keys.map((key, index) => typeof key === 'string' ? key : `client-${index}`)
        : aiInstances.map((_, index) => `client-${index}`);
    const ordered = orderAvailableAttempts(keyValues, candidateModels, geminiCooldowns);
    if (!ordered.attempts.length) {
        const seconds = Number.isFinite(ordered.earliestRetryAt)
            ? Math.max(1, Math.ceil((ordered.earliestRetryAt - Date.now()) / 1000)) : 60;
        const error = new Error(`CÃ¡c model/API key Ä‘ang táº¡m nghá»‰ sau lá»—i quota. Há»‡ thá»‘ng sáº½ thá»­ láº¡i sau khoáº£ng ${seconds} giÃ¢y.`);
        error.status = 429;
        error.retryAfterMs = seconds * 1000;
        throw error;
    }

    let lastError = null;
    let quotaError = null;
    const disabledKeys = new Set();
    const disabledModels = new Set();
    const quotaFailuresByKey = new Map();
    const exhaustedKeys = new Set();
    for (const attempt of ordered.attempts) {
        if (requestConfig.abortSignal?.aborted) throw Object.assign(new Error('ÄÃ£ dá»«ng yÃªu cáº§u AI.'), { status: 504 });
        if (disabledKeys.has(attempt.keyIndex) || disabledModels.has(attempt.model)) continue;
        const client = aiInstances[attempt.keyIndex];
        try {
            return await client.models.generateContent({ model: attempt.model, contents, config: requestConfig });
        } catch (error) {
            if (requestConfig.abortSignal?.aborted) throw Object.assign(new Error('ÄÃ£ dá»«ng yÃªu cáº§u AI.'), { status: 504 });
            lastError = error;
            const failure = classifyGeminiFailure(error);
            const cooldown = cooldownForFailure(failure);
            if (cooldown) geminiCooldowns.set(attempt.id, Date.now() + cooldown + Math.floor(Math.random() * 3000));
            if (failure.quota) quotaError = error;
            console.warn(`[AI] Model ${attempt.model} (Key ${attempt.keyIndex + 1}/${aiInstances.length}) failed: ${String(error?.message || error).slice(0, 140)}`);
            if (failure.invalidKey) {
                disabledKeys.add(attempt.keyIndex);
                for (const model of candidateModels) geminiCooldowns.set(`${attempt.key}\u0000${model}`, Date.now() + cooldown);
            }
            if (failure.unavailableModel) {
                disabledModels.add(attempt.model);
                for (const key of keyValues) geminiCooldowns.set(`${attempt.key}\u0000${attempt.model}`, Date.now() + cooldown);
            }
            if (failure.highDemand) {
                // Khi Google bÃ¡o model quÃ¡ táº£i (503), lÃ m nguá»™i model nÃ y trÃªn Táº¤T Cáº¢ cÃ¡c keys Ä‘á»ƒ cÃ¡c key sau chuyá»ƒn sang model khÃ¡c ngay láº­p tá»©c
                for (const key of keyValues) {
                    geminiCooldowns.set(`${key}\u0000${attempt.model}`, Date.now() + Math.max(20_000, cooldown));
                }
            }
            if (failure.quota) {
                const failures = (quotaFailuresByKey.get(attempt.keyIndex) || 0) + 1;
                quotaFailuresByKey.set(attempt.keyIndex, failures);
                if (failures >= candidateModels.length) exhaustedKeys.add(attempt.keyIndex);
                if (exhaustedKeys.size >= 2) break;
            }
            if (!failure.transient && !failure.invalidKey && !failure.unavailableModel) throw error;
        }
    }
    throw quotaError || lastError || new Error('Táº¥t cáº£ cÃ¡c mÃ´ hÃ¬nh Gemini vÃ  API Key dá»± phÃ²ng Ä‘á»u khÃ´ng thá»ƒ pháº£n há»“i.');
}

// --- LATEX, SVG, CRYPTO & HIERARCHY HELPERS ---
export function normalizeLatex(content) {
    if (!content) return '';
    return content
        .replace(/%.*$/gm, '') // Remove comments
        .replace(/\\begin\{ex\}/g, '')
        .replace(/\\end\{ex\}/g, '')
        .replace(/\\choice/g, '')
        .replace(/\\loigiai/g, '')
        .replace(/\{/g, '')
        .replace(/\}/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\s+/g, '')  // Remove ALL whitespace for maximum collision
        .toLowerCase()
        .trim();
}

export function generateHash(content) {
    return crypto.createHash('sha256').update(normalizeLatex(content)).digest('hex');
}

export const sanitizeSvg = sanitizeCompiledSvg;

export function getGradeDigitSQL() {
    return `CAST(g.code AS UNSIGNED)`;
}

export function mapGradeToCode(val) {
    if (val === 10) return '0';
    if (val === 11) return '1';
    if (val === 12) return '2';
    return String(val); 
}

export async function resolveHierarchyIds(conn, id_class, id_subject, id_chapter, id_unit, chapter_name_hint, unit_name_hint) {
    const gradeCode = mapGradeToCode(id_class);
    let [gRows] = await conn.query("SELECT id FROM grades WHERE code = ?", [gradeCode]);
    let gradeId = gRows.length > 0 ? gRows[0].id : null;
    if (!gradeId) {
        [gRows] = await conn.query("SELECT id FROM grades LIMIT 1");
        gradeId = gRows[0]?.id || 1; 
    }

    let [sRows] = await conn.query("SELECT id FROM subjects WHERE code = ?", [id_subject]);
    let subjectId = sRows.length > 0 ? sRows[0].id : null;
    if (!subjectId) {
        [sRows] = await conn.query("SELECT id FROM subjects LIMIT 1");
        subjectId = sRows[0]?.id || 1;
    }

    let chapterId = null;
    const [cRows] = await conn.query(
        "SELECT id FROM chapters WHERE grade_id = ? AND subject_id = ? AND chapter_number = ?", 
        [gradeId, subjectId, id_chapter]
    );
    
    if (cRows.length > 0) {
        chapterId = cRows[0].id;
        const genericName = `ChÆ°Æ¡ng ${id_chapter}`;
        if (chapter_name_hint && chapter_name_hint.trim() !== '' && chapter_name_hint !== genericName) {
             await conn.query("UPDATE chapters SET name = ? WHERE id = ?", [chapter_name_hint, chapterId]);
        }
    } else {
        const cName = chapter_name_hint || `ChÆ°Æ¡ng ${id_chapter}`;
        const [res] = await conn.query(
            "INSERT INTO chapters (grade_id, subject_id, chapter_number, name) VALUES (?, ?, ?, ?)",
            [gradeId, subjectId, id_chapter, cName]
        );
        await clearCache('/api/questions*');
        chapterId = res.insertId;
    }

    let unitId = null;
    const [uRows] = await conn.query(
        "SELECT id FROM units WHERE chapter_id = ? AND unit_number = ?", 
        [chapterId, id_unit]
    );

    if (uRows.length > 0) {
        unitId = uRows[0].id;
        const genericUName = `BÃ i ${id_unit}`;
        if (unit_name_hint && unit_name_hint.trim() !== '' && unit_name_hint !== genericUName) {
             await conn.query("UPDATE units SET name = ? WHERE id = ?", [unit_name_hint, unitId]);
        }
    } else {
        const uName = unit_name_hint || `BÃ i ${id_unit}`;
        const [res] = await conn.query(
            "INSERT INTO units (chapter_id, unit_number, name) VALUES (?, ?, ?)",
            [chapterId, id_unit, uName]
        );
        await clearCache('/api/questions*');
        unitId = res.insertId;
    }
    
    return { gradeId, subjectId, chapterId, unitId };
}

// --- DATABASE SCHEMA & SEED ---
export async function seedDatabase(targetPool = pool) {
    return runSeedDatabase(targetPool);
}

// --- BACKGROUND JOBS PROCESSOR ---
export async function processBackgroundJobs(targetPool = pool, targetQuery = query) {
    return runBackgroundJobs(targetPool, targetQuery, sanitizeSvg);
}

// Start Background Jobs interval
setInterval(() => processBackgroundJobs(pool, query), 10000);

