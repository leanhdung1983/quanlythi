import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";
import { sanitizeCompiledSvg } from './svgImage.js';
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
        console.log(`✅ [DB] Database \`${database}\` ensured.`);
    } catch (err) {
        console.warn("⚠️ [DB] Could not ensure database exists (might already exist or no permission):", err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.error("❌ [DB] CRITICAL: MySQL server is not reachable at " + dbConfig.host + ":" + dbConfig.port);
            console.error("   Please ensure MySQL is running and DB_HOST/DB_PORT are correct in your environment.");
        }
    }

    // 2. Create Pool
    pool = mysql.createPool(dbConfig);

    try {
        const conn = await pool.getConnection();
        console.log("✅ [DB] Database connected successfully!");
        conn.release();
        if (process.env.SOCIAL_CRON_ONLY !== '1') await seedDatabase();
    } catch (err) {
        console.error("❌ [DB] Connection Failed:", err.message);
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
        console.error("❌ DB Query Error:", error.message, "\nSQL:", sql);
        throw error;
    }
}

// --- AUTH & SESSION CONFIGURATION ---
const authSecret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.AUTH_SECRET) console.warn('⚠️ [AUTH] AUTH_SECRET chưa được cấu hình; phiên đăng nhập sẽ hết hạn khi server khởi động lại.');
export const loginAttempts = new Map();
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 giờ

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

// Middleware xác thực phiên người dùng cho API
export async function sessionMiddleware(req, res, next) {
    // Only protect /api/*
    if (!req.path.startsWith('/api/')) return next();
    const publicPaths = ['/api/login', '/api/logout', '/api/register', '/api/forgot-password', '/api/ping'];
    if (publicPaths.includes(req.path) || (req.method === 'GET' && /^\/api\/images\/[a-f0-9]{64}$/i.test(req.path))) return next();
    try {
        const session = readSession(req);
        if (!session) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        const [currentUser] = await query('SELECT id, role FROM users WHERE id = ?', [session.id]);
        if (!currentUser) return res.status(401).json({ error: 'Tài khoản không còn hoạt động.' });
        req.user = { ...session, role: currentUser.role };

        // Sliding session: Tự động gia hạn cookie khi phiên còn dưới 12 giờ
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
            return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
        }
        next();
    } catch {
        return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.' });
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
        res.status(403).json({ error: 'Chỉ Quản trị viên mới được phép thực hiện thao tác này.' });
        return false;
    }
    return true;
}

export function requireTeacherOrAdmin(req, res) {
    if (!['ADMIN', 'TEACHER'].includes(req.user?.role)) {
        res.status(403).json({ error: 'Chỉ Giáo viên hoặc Quản trị viên mới được phép thực hiện thao tác này.' });
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
            const parts = raw.split(/[\n,;]+/).map(k => k.trim()).filter(k => k.length > 10);
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
    if (e?.status === 429 || msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        return "Lỗi: Đã vượt quá giới hạn lượt dùng hoặc hạn mức API (Quota Exceeded). Thầy/cô có thể thêm nhiều API Key miễn phí (cách nhau bởi dấu phẩy) trong Cài đặt tài khoản để hệ thống tự động xoay vòng.";
    }
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
        return "Lỗi: API Key không hợp lệ. Vui lòng thiết lập API Key đúng từ Google AI Studio.";
    }
    try {
        if (typeof e.message === 'string' && e.message.startsWith('{')) {
            const parsed = JSON.parse(e.message);
            if (parsed.error && parsed.error.message) {
                if (parsed.error.code === 429) {
                    return "Lỗi: Quota Exceeded. API Key của bạn đã hết hạn mức. Vui lòng thêm thêm key dự phòng hoặc đợi ít phút.";
                }
                return "Lỗi từ Gemini: " + parsed.error.message;
            }
        }
    } catch {}
    return "Lỗi trong quá trình tạo: " + (e.message || String(e));
}

export async function generateWithFallback(aiOrKeys, prompt, config, additionalParts = []) {
    const candidateModels = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash-lite'
    ];
    const contents = additionalParts.length ? { parts: [...additionalParts, { text: prompt }] } : prompt;

    let aiInstances = [];
    if (Array.isArray(aiOrKeys)) {
        aiInstances = aiOrKeys.map(k => (typeof k === 'string' ? new GoogleGenAI({ apiKey: k }) : k));
    } else if (aiOrKeys?._keys && Array.isArray(aiOrKeys._keys)) {
        aiInstances = aiOrKeys._keys.map(k => new GoogleGenAI({ apiKey: k }));
    } else if (typeof aiOrKeys === 'string') {
        aiInstances = [new GoogleGenAI({ apiKey: aiOrKeys })];
    } else if (aiOrKeys) {
        aiInstances = [aiOrKeys];
    }

    if (aiInstances.length === 0) {
        throw new Error('Chưa cấu hình Gemini API Key.');
    }

    let lastError = null;
    for (let kIdx = 0; kIdx < aiInstances.length; kIdx++) {
        const client = aiInstances[kIdx];
        for (const model of candidateModels) {
            try {
                const response = await client.models.generateContent({
                    model,
                    contents,
                    config
                });
                return response;
            } catch (e) {
                lastError = e;
                const errMsg = String(e?.message || e || '');
                const is429 = e?.status === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
                console.warn(`[AI] Model ${model} (Key ${kIdx + 1}/${aiInstances.length}) failed: ${errMsg.slice(0, 120)}`);

                // If quota exhausted and more keys exist, immediately rotate to next key
                if (is429 && kIdx < aiInstances.length - 1) {
                    console.warn(`[AI] Quota hit on Key ${kIdx + 1}. Rotating to next API key...`);
                    break;
                }
            }
        }
    }
    throw lastError || new Error('Tất cả các mô hình Gemini và API Key dự phòng đều không thể phản hồi.');
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
        const genericName = `Chương ${id_chapter}`;
        if (chapter_name_hint && chapter_name_hint.trim() !== '' && chapter_name_hint !== genericName) {
             await conn.query("UPDATE chapters SET name = ? WHERE id = ?", [chapter_name_hint, chapterId]);
        }
    } else {
        const cName = chapter_name_hint || `Chương ${id_chapter}`;
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
        const genericUName = `Bài ${id_unit}`;
        if (unit_name_hint && unit_name_hint.trim() !== '' && unit_name_hint !== genericUName) {
             await conn.query("UPDATE units SET name = ? WHERE id = ?", [unit_name_hint, unitId]);
        }
    } else {
        const uName = unit_name_hint || `Bài ${id_unit}`;
        const [res] = await conn.query(
            "INSERT INTO units (chapter_id, unit_number, name) VALUES (?, ?, ?)",
            [chapterId, id_unit, uName]
        );
        await clearCache('/api/questions*');
        unitId = res.insertId;
    }
    
    return { gradeId, subjectId, chapterId, unitId };
}

// --- SEED DATABASE FUNCTION ---
export async function seedDatabase() {
    try {
        if (!pool) return;
        console.log("[SEED] Checking core tables...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                email VARCHAR(100),
                school VARCHAR(100),
                role ENUM('ADMIN', 'TEACHER', 'STUDENT') DEFAULT 'STUDENT',
                is_pro BOOLEAN DEFAULT FALSE,
                avatar_url TEXT,
                bio TEXT,
                expiry_date DATETIME,
                api_key VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS grades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(10) NOT NULL UNIQUE,
                name VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code CHAR(1) NOT NULL UNIQUE,
                name VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS levels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code CHAR(1) NOT NULL UNIQUE,
                name VARCHAR(50) NOT NULL,
                weight INT DEFAULT 1
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS question_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(10) NOT NULL UNIQUE,
                name VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS chapters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                grade_id INT NOT NULL,
                subject_id INT NOT NULL,
                chapter_number INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                UNIQUE KEY unique_chap_structure (grade_id, subject_id, chapter_number),
                CONSTRAINT fk_chapters_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT fk_chapters_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS units (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chapter_id INT NOT NULL,
                unit_number INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                UNIQUE KEY unique_unit_structure (chapter_id, unit_number),
                CONSTRAINT fk_units_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS id6_metadata (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_full VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                grade_id INT, 
                subject_id INT,
                chapter_id INT,
                unit_id INT,
                level_id INT,
                count_id INT,
                competencies JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_meta_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL,
                CONSTRAINT fk_meta_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
                CONSTRAINT fk_meta_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
                CONSTRAINT fk_meta_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
                CONSTRAINT fk_meta_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unit_id INT,                      
                level_id INT NOT NULL,            
                type_id INT NOT NULL,             
                content_latex LONGTEXT NOT NULL,
                content_latex_original LONGTEXT,
                legacy_full_id VARCHAR(50),       
                used_count INT DEFAULT 0,
                created_by INT,
                created_by_name VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                difficulty_index DECIMAL(5,2) DEFAULT 0.5,
                discrimination_index DECIMAL(5,2) DEFAULT 0.3,
                competencies JSON,
                choices JSON,
                is_public BOOLEAN DEFAULT FALSE,
                content_hash VARCHAR(64),
                is_duplicate_checked BOOLEAN DEFAULT FALSE,
                is_tikz_rendered TINYINT DEFAULT 0,
                id_status TINYINT DEFAULT 0,
                CONSTRAINT fk_questions_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE,
                CONSTRAINT fk_questions_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT fk_questions_type FOREIGN KEY (type_id) REFERENCES question_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT fk_questions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        try {
            await pool.query("ALTER TABLE questions DROP COLUMN IF EXISTS normalized_latex");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS content_latex_original LONGTEXT");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100)");
            
            const [cols] = await pool.query("SHOW COLUMNS FROM questions LIKE 'original_latex'");
            if (cols.length > 0) {
                await pool.query("UPDATE questions SET content_latex_original = original_latex WHERE content_latex_original IS NULL AND original_latex IS NOT NULL");
                await pool.query("ALTER TABLE questions DROP COLUMN original_latex");
            }
            
            await pool.query("ALTER TABLE questions MODIFY COLUMN is_tikz_rendered TINYINT DEFAULT 0");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS id_status TINYINT DEFAULT 0");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS normalization_version INT DEFAULT 0");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS normalized_at DATETIME NULL");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS id_review_status VARCHAR(20) DEFAULT 'PENDING'");
            await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            try { await pool.query("CREATE INDEX idx_questions_id_status ON questions(id_status)"); } catch {}
        } catch (e) {
            console.log("Migration notice (questions refactor):", e.message);
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS question_revisions (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                content_latex LONGTEXT NOT NULL,
                legacy_full_id VARCHAR(50),
                unit_id INT,
                level_id INT,
                type_id INT,
                change_type VARCHAR(40) NOT NULL,
                changed_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_revision_question (question_id, created_at),
                CONSTRAINT fk_revision_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
                CONSTRAINT fk_revision_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS question_id_suggestions (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                current_id VARCHAR(50),
                suggested_id VARCHAR(50),
                issue_codes JSON,
                confidence DECIMAL(5,4) DEFAULT 0,
                reason TEXT,
                source VARCHAR(10) DEFAULT 'RULE',
                status VARCHAR(20) DEFAULT 'PENDING',
                reviewed_by INT,
                reviewed_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_suggestion_question (question_id, status),
                CONSTRAINT fk_suggestion_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
                CONSTRAINT fk_suggestion_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS matrix_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                matrix_data JSON, 
                created_by INT,
                is_public BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_matrix_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS exam_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                matrix_id INT,
                exam_title VARCHAR(255),
                score DECIMAL(5, 2) DEFAULT 0,
                duration_seconds INT DEFAULT 0,
                result_detail JSON,
                status ENUM('IN_PROGRESS', 'COMPLETED') DEFAULT 'COMPLETED',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_result_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_result_matrix FOREIGN KEY (matrix_id) REFERENCES matrix_templates(id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS question_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                user_id INT NOT NULL,
                report_reason TEXT,
                status ENUM('PENDING', 'RESOLVED', 'IGNORED') DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_report_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS background_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_type VARCHAR(50) NOT NULL,
                status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
                progress INT DEFAULT 0,
                result_data JSON,
                error_message TEXT,
                user_id INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (background_jobs):", e.message));

        await pool.query(`
            ALTER TABLE id6_metadata 
            ADD COLUMN IF NOT EXISTS competencies JSON
        `).catch(e => console.log("Migration notice (id6_metadata competencies):", e.message));

        await pool.query(`
            ALTER TABLE matrix_templates 
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS grade_id INT
        `).catch(e => console.log("Migration notice (matrix_templates):", e.message));

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS grade_id INT
        `).catch(e => console.log("Migration notice (users):", e.message));

        await pool.query(`
            ALTER TABLE questions 
            ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
            ADD COLUMN IF NOT EXISTS is_duplicate_checked BOOLEAN DEFAULT FALSE
        `).catch(e => console.log("Migration notice (questions hashing):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS duplicate_pairs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id_1 INT NOT NULL,
                question_id_2 INT NOT NULL,
                similarity_score DECIMAL(5,4) DEFAULT 1.0000,
                status ENUM('PENDING', 'RESOLVED', 'IGNORED') DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_pair (question_id_1, question_id_2),
                CONSTRAINT fk_dup_q1 FOREIGN KEY (question_id_1) REFERENCES questions(id) ON DELETE CASCADE,
                CONSTRAINT fk_dup_q2 FOREIGN KEY (question_id_2) REFERENCES questions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (duplicate_pairs):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (user_feedback):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS question_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tikz_hash VARCHAR(64) UNIQUE NOT NULL,
                svg_content LONGTEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (question_images):", e.message));

        await pool.query(`CREATE TABLE IF NOT EXISTS social_post_queue (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            caption TEXT NOT NULL,
            scheduled_at DATETIME NOT NULL,
            image_mime VARCHAR(20) NULL,
            image_blob LONGBLOB NULL,
            status ENUM('DRAFT','APPROVED','PUBLISHING','POSTED','FAILED','UNCERTAIN','CANCELLED') NOT NULL DEFAULT 'DRAFT',
            created_by INT NOT NULL,
            approved_by INT NULL,
            attempt_count INT NOT NULL DEFAULT 0,
            claim_token CHAR(36) NULL,
            publish_started_at DATETIME NULL,
            posted_at DATETIME NULL,
            fb_photo_id VARCHAR(100) NULL,
            fb_post_id VARCHAR(100) NULL,
            last_error VARCHAR(1000) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_social_due(status,scheduled_at,id),
            UNIQUE KEY uq_social_claim(claim_token),
            INDEX idx_social_question(question_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        // CREATE TABLE IF NOT EXISTS does not upgrade an older table. Keep every
        // column used by both manual planning and the optional publisher in sync.
        await pool.query(`ALTER TABLE social_post_queue
            ADD COLUMN IF NOT EXISTS image_mime VARCHAR(20) NULL,
            ADD COLUMN IF NOT EXISTS image_blob LONGBLOB NULL,
            ADD COLUMN IF NOT EXISTS approved_by INT NULL,
            ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS claim_token CHAR(36) NULL,
            ADD COLUMN IF NOT EXISTS publish_started_at DATETIME NULL,
            ADD COLUMN IF NOT EXISTS posted_at DATETIME NULL,
            ADD COLUMN IF NOT EXISTS fb_photo_id VARCHAR(100) NULL,
            ADD COLUMN IF NOT EXISTS fb_post_id VARCHAR(100) NULL,
            ADD COLUMN IF NOT EXISTS last_error VARCHAR(1000) NULL,
            ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await pool.query(`ALTER TABLE social_post_queue
            MODIFY COLUMN status ENUM('DRAFT','READY','APPROVED','PUBLISHING','POSTED','FAILED','UNCERTAIN','CANCELLED') NOT NULL DEFAULT 'DRAFT'`);
        // Old manual queues used READY. Preserve those rows before normalizing.
        await pool.query("UPDATE social_post_queue SET status='DRAFT' WHERE status='READY'");
        const [socialImageColumns] = await pool.query("SHOW COLUMNS FROM social_post_queue WHERE Field IN ('image_mime','image_blob')");
        if (socialImageColumns.some(column => column.Null === 'NO')) {
            await pool.query('ALTER TABLE social_post_queue MODIFY COLUMN image_mime VARCHAR(20) NULL, MODIFY COLUMN image_blob LONGBLOB NULL');
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tikz_render_failures (
                question_id INT NOT NULL,
                tikz_hash VARCHAR(64) NOT NULL,
                error_message VARCHAR(1000) NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (question_id, tikz_hash),
                CONSTRAINT fk_tikz_failure_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (tikz_render_failures):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tikz_render_jobs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                status VARCHAR(24) NOT NULL DEFAULT 'QUEUED',
                requested_by INT NOT NULL,
                after_id INT NOT NULL DEFAULT 0,
                scanned INT NOT NULL DEFAULT 0,
                synced INT NOT NULL DEFAULT 0,
                failed INT NOT NULL DEFAULT 0,
                worker_id VARCHAR(64) NULL,
                lease_token CHAR(64) NULL,
                heartbeat_at DATETIME NULL,
                error_message VARCHAR(1000) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (tikz_render_jobs):", e.message));
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tikz_render_control (
                id TINYINT PRIMARY KEY,
                active_job_id BIGINT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (tikz_render_control):", e.message));
        await pool.query('INSERT IGNORE INTO tikz_render_control (id, active_job_id) VALUES (1, NULL)')
            .catch(e => console.log("Migration notice (tikz_render_control row):", e.message));
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tikz_worker_presence (
                worker_id VARCHAR(64) PRIMARY KEY,
                last_seen DATETIME NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (tikz_worker_presence):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_sections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unit_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content LONGTEXT,
                video_url VARCHAR(255),
                interactive_html LONGTEXT,
                order_index INT DEFAULT 0,
                matrix_id INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_lesson_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (lesson_sections):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_lesson_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                section_id INT NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                score DECIMAL(5,2) DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_section (user_id, section_id),
                CONSTRAINT fk_ulp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_ulp_section FOREIGN KEY (section_id) REFERENCES lesson_sections(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (user_lesson_progress):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (system_settings):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_limits (
                user_id INT NOT NULL,
                activity_date DATE NOT NULL,
                exam_count INT DEFAULT 0,
                review_count INT DEFAULT 0,
                PRIMARY KEY (user_id, activity_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `).catch(e => console.log("Migration notice (activity_limits):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `).catch(e => console.log("Migration notice (classes):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS class_students (
                class_id INT NOT NULL,
                student_id INT NOT NULL,
                status VARCHAR(20) DEFAULT 'APPROVED',
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (class_id, student_id),
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `).catch(e => console.log("Migration notice (class_students):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS class_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                matrix_id INT NOT NULL,
                open_time DATETIME NULL,
                deadline DATETIME NULL,
                max_attempts INT DEFAULT 0,
                allow_review BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (matrix_id) REFERENCES matrix_templates(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `).catch(e => console.log("Migration notice (class_assignments):", e.message));

        await pool.query(`
            ALTER TABLE class_assignments
            ADD COLUMN IF NOT EXISTS open_time DATETIME NULL,
            ADD COLUMN IF NOT EXISTS deadline DATETIME NULL,
            ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT TRUE
        `).catch(e => console.log("Migration notice (class_assignments columns):", e.message));

        // Create initial Admin User if empty
        const [users] = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
        const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;
        if (users.length === 0 && initialAdminPassword?.length >= 12) {
            console.log("[SEED] Creating initial Admin User from environment configuration...");
            const bcryptMod = await import('bcryptjs');
            const hash = await bcryptMod.default.hash(initialAdminPassword, 12);
            await pool.query("INSERT IGNORE INTO users (username, password_hash, full_name, role, is_pro) VALUES (?, ?, ?, ?, ?)", ['admin', hash, 'Quản trị viên', 'ADMIN', 1]);
        } else if (users.length === 0) {
            console.warn('[SEED] Chưa có quản trị viên. Hãy đặt ADMIN_INITIAL_PASSWORD (ít nhất 12 ký tự) rồi khởi động lại một lần.');
        }
        
        const grades = [
            {code: '6', name: 'Lớp 6'}, {code: '7', name: 'Lớp 7'}, {code: '8', name: 'Lớp 8'}, {code: '9', name: 'Lớp 9'},
            {code: '0', name: 'Lớp 10'}, {code: '1', name: 'Lớp 11'}, {code: '2', name: 'Lớp 12'}
        ];
        for (const g of grades) await pool.query("INSERT IGNORE INTO grades (code, name) VALUES (?, ?)", [g.code, g.name]);

        const subjects = [{code: 'D', name: 'Đại số / Giải tích'}, {code: 'H', name: 'Hình học'}, {code: 'C', name: 'Chuyên đề'}];
        for (const s of subjects) await pool.query("INSERT IGNORE INTO subjects (code, name) VALUES (?, ?)", [s.code, s.name]);

        const levels = [{code: 'N', name: 'Nhận biết', w: 1}, {code: 'H', name: 'Thông hiểu', w: 2}, {code: 'V', name: 'Vận dụng', w: 3}, {code: 'C', name: 'Vận dụng cao', w: 4}];
        for (const l of levels) await pool.query("INSERT IGNORE INTO levels (code, name, weight) VALUES (?, ?, ?)", [l.code, l.name, l.w]);

        const types = [{code: 'TN', name: 'Trắc nghiệm'}, {code: 'TF', name: 'Đúng Sai'}, {code: 'KQ', name: 'Trả lời ngắn'}, {code: 'TL', name: 'Tự luận'}];
        for (const t of types) await pool.query("INSERT IGNORE INTO question_types (code, name) VALUES (?, ?)", [t.code, t.name]);

        // Indexes for faster queries
        try { await pool.query("CREATE INDEX idx_questions_legacy_full_id ON questions(legacy_full_id)"); } catch {}
        try { await pool.query("CREATE INDEX idx_id6_metadata_id_full ON id6_metadata(id_full)"); } catch {}
        try { await pool.query("CREATE INDEX idx_chapters_grade_subject_num ON chapters(grade_id, subject_id, chapter_number)"); } catch {}
        try { await pool.query("CREATE INDEX idx_units_chapter_num ON units(chapter_id, unit_number)"); } catch {}

    } catch (err) { if (err.code !== 'ER_NO_SUCH_TABLE') console.error("[SEED ERROR]", err.message); }
}

// --- BACKGROUND JOBS PROCESSOR ---
export async function processBackgroundJobs() {
    try {
        if (!pool) return;
        
        try {
            const conn = await pool.getConnection();
            conn.release();
        } catch (connErr) {
            if (Math.random() < 0.1) { 
                console.warn("[JOB] Skipping background jobs: Database unreachable.", connErr.message);
            }
            return;
        }

        const [jobs] = await pool.query("SELECT * FROM background_jobs WHERE status = 'PENDING' LIMIT 1");
        if (jobs.length === 0) return;

        const job = jobs[0];
        await pool.query("UPDATE background_jobs SET status = 'PROCESSING', updated_at = NOW() WHERE id = ?", [job.id]);

        console.log(`[JOB] Processing job ${job.id} (${job.job_type})...`);

        try {
            if (job.job_type === 'DUPLICATE_SCAN') {
                const [{ total }] = await query("SELECT COUNT(*) as total FROM questions WHERE is_duplicate_checked = FALSE OR content_hash IS NULL");
                const totalUnchecked = total || 0;
                let processed = 0;
                let hasMore = true;

                if (totalUnchecked === 0) {
                    await query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100, result_data = ? WHERE id = ?", [
                        JSON.stringify({ 
                            message: `Dữ liệu đã được băm. Không có câu hỏi mới cần quét.`, 
                            processed_new: 0
                        }), 
                        job.id
                    ]);
                    return;
                }

                while (hasMore) {
                    const unchecked = await query("SELECT id, content_latex FROM questions WHERE is_duplicate_checked = FALSE OR content_hash IS NULL LIMIT 2000");
                    if (unchecked.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const q of unchecked) {
                        const normalized = normalizeLatex(q.content_latex);
                        const hash = crypto.createHash('sha256').update(normalized).digest('hex');
                        await query("UPDATE questions SET content_hash = ?, is_duplicate_checked = TRUE WHERE id = ?", [hash, q.id]);
                        processed++;
                    }

                    const progress = Math.min(99, Math.floor((processed / totalUnchecked) * 100));
                    await query("UPDATE background_jobs SET progress = ? WHERE id = ?", [progress, job.id]);
                }

                await query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100, result_data = ? WHERE id = ?", [
                    JSON.stringify({ 
                        message: `Hoàn tất kiểm tra băm. Đã quét ${processed} câu hỏi mới.`, 
                        processed_new: processed
                    }), 
                    job.id
                ]);
            } else if (job.job_type === 'TIKZ_RENDER_DISABLED') {
                const questions = await query("SELECT id, content_latex, content_latex_original FROM questions WHERE (content_latex LIKE '%tikzpicture%' OR content_latex LIKE '%tkz-tab%' OR content_latex LIKE '%tkz-euclide%') AND is_tikz_rendered = 0");
                let processed = 0;
                let rendered = 0;
                let skipped = 0;
                let failed = 0;

                const tikzRegex = /(\\begin\s*\{\s*(tikzpicture|tkz-tab|tkz-euclide)\s*\}(?:\[[\s\S]*?\])?(?:\{[\s\S]*?\})?[\s\S]*?\\end\s*\{\s*(tikzpicture|tkz-tab|tkz-euclide)\s*\})/gi;
                const HF_SERVER = 'https://leanhdung1983-tikz-renderer.hf.space/render';

                if (HF_SERVER.includes('hf.space')) {
                    const baseUrl = HF_SERVER.replace(/\/render\/?$/, '');
                    fetch(baseUrl).catch(() => {});
                }

                for (const q of questions) {
                    if (!q.content_latex_original) {
                        await pool.query("UPDATE questions SET content_latex_original = ? WHERE id = ?", [q.content_latex, q.id]);
                    }

                    let updatedContent = q.content_latex;
                    const matches = q.content_latex.match(tikzRegex);
                    
                    if (matches) {
                        for (const tikzCode of matches) {
                            const hash = crypto.createHash('sha256').update(tikzCode).digest('hex');
                            const [existing] = await pool.query("SELECT id FROM question_images WHERE tikz_hash = ?", [hash]);
                            
                            let success = false;
                            if (existing.length > 0) {
                                skipped++;
                                success = true;
                            } else {
                                let payload = tikzCode;
                                if (!tikzCode.trim().startsWith('\\documentclass')) {
                                    const isTextMode = tikzCode.includes('\\begin{ex}') || 
                                                     tikzCode.includes('\\begin{bt}') || 
                                                     tikzCode.includes('\\begin{vd}') ||
                                                     tikzCode.includes('\\loigiai') ||
                                                     tikzCode.includes('\\choice');
                                    
                                    const preamble = `\\usepackage[utf8]{vietnam}
\\usepackage{amsmath,amssymb,mathrsfs,fancyhdr,enumerate,multirow,makecell,currfile,fontawesome,twemojis}
\\usepackage{tikz,tkz-tab,tkz-euclide,tikz-3dplot}
\\usetikzlibrary{arrows,calc,intersections,angles,snakes,quotes,backgrounds,shapes.geometric,patterns,shadings,positioning}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.9}
\\usepgfplotslibrary{fillbetween}

% Custom commands for VN Math
\\providecommand{\\hoac}[1]{\\left[\\begin{aligned}#1\\end{aligned}\\right.}
\\providecommand{\\heva}[1]{\\left\\{\\begin{aligned}#1\\end{aligned}\\right.}
\\providecommand{\\shortans}[1]{\\textbf{Đáp số: }#1}
\\providecommand{\\immini}[3][]{%
  \\noindent\\begin{minipage}[t]{0.65\\linewidth}%
    #2
  \\end{minipage}%
  \\hfill%
  \\begin{minipage}[t]{0.30\\linewidth}%
    \\centering
    #3
  \\end{minipage}%
}
`;
                                    if (isTextMode) {
                                        const fullPreamble = `${preamble}\\usepackage[dethi]{ex_test}\n`;
                                        payload = `\\documentclass[14pt,border=5pt,varwidth=600pt]{standalone}\n${fullPreamble}\n\\begin{document}\n${tikzCode}\n\\end{document}`;
                                    } else {
                                        const adjustedCode = tikzCode.replace(/scale=\.8/g, 'scale=1');
                                        payload = `\\documentclass[14pt,tikz,border=5pt]{standalone}\n${preamble}\n\\begin{document}\n${adjustedCode}\n\\end{document}`;
                                    }
                                }

                                let attempts = 0;
                                const maxAttempts = 3;
                                
                                while (!success && attempts < maxAttempts) {
                                    try {
                                        const response = await fetch(HF_SERVER, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'text/plain' },
                                            body: payload
                                        });

                                        if (response.ok) {
                                            let svg = await response.text();
                                            if (svg && svg.includes('<svg')) {
                                                svg = svg.replace(/width="[\d\.]+(pt|px|cm|in)"/i, 'width="100%"');
                                                svg = svg.replace(/height="[\d\.]+(pt|px|cm|in)"/i, 'height="auto"');
                                                const cleanSvg = sanitizeSvg(svg);
                                                if (!cleanSvg) throw new Error('SVG renderer trả về nội dung không an toàn.');

                                                await pool.query("INSERT IGNORE INTO question_images (tikz_hash, svg_content) VALUES (?, ?)", [hash, cleanSvg]);
                                                rendered++;
                                                success = true;
                                            }
                                        } else if (response.status === 503 || response.status === 504) {
                                            await new Promise(r => setTimeout(r, 5000));
                                        }
                                    } catch (err) {
                                        console.error(`[JOB] Render attempt ${attempts + 1} failed:`, err.message);
                                    }
                                    attempts++;
                                    if (!success && attempts < maxAttempts) {
                                        await new Promise(r => setTimeout(r, 2000));
                                    }
                                }
                            }

                            if (success) {
                                updatedContent = updatedContent.split(tikzCode).join(`[TIKZ_HASH:${hash}]`);
                            } else {
                                failed++;
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                        
                        await pool.query("UPDATE questions SET content_latex = ?, is_tikz_rendered = 1 WHERE id = ?", [updatedContent, q.id]);
                    } else {
                        await pool.query("UPDATE questions SET is_tikz_rendered = 2 WHERE id = ?", [q.id]);
                    }
                    
                    processed++;
                    if (processed % 5 === 0 || processed === questions.length) {
                        const progress = Math.floor((processed / questions.length) * 100);
                        await query("UPDATE background_jobs SET progress = ? WHERE id = ?", [progress, job.id]);
                    }
                }

                await query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100, result_data = ? WHERE id = ?", [
                    JSON.stringify({ 
                        message: `Render hoàn tất. Đã xử lý ${processed} câu. Render mới: ${rendered}. Bỏ qua (đã có): ${skipped}. Lỗi: ${failed}.`,
                        processed,
                        rendered,
                        skipped,
                        failed
                    }), 
                    job.id
                ]);
            } else {
                await pool.query("UPDATE background_jobs SET status = 'COMPLETED', progress = 100 WHERE id = ?", [job.id]);
            }
        } catch (err) {
            await pool.query("UPDATE background_jobs SET status = 'FAILED', error_message = ? WHERE id = ?", [err.message, job.id]);
        }
    } catch (e) {
        console.error("Job Processor Error:", e.message);
    }
}

// Start Background Jobs interval
setInterval(processBackgroundJobs, 10000);
