import { paymentSchema } from './payments.js';
import { readFile } from 'node:fs/promises';

/**
 * Schema initialization and migration runner for ID6 Question Bank & EduLoop AI.
 * @param {import('mysql2/promise').Pool} pool
 */
export async function seedDatabase(pool) {
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
                api_key TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        for (const sql of paymentSchema) await pool.query(sql);

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
            try { await pool.query("ALTER TABLE users MODIFY COLUMN api_key TEXT"); } catch {}
        } catch (e) {
            console.log("Migration notice (questions refactor):", e.message);
        }

        for (const column of ['layout_normalization_version INT NOT NULL DEFAULT 0', 'layout_normalization_hash CHAR(64) NULL', 'duplicate_hash_version INT NOT NULL DEFAULT 0']) {
            try { await pool.query(`ALTER TABLE questions ADD COLUMN ${column}`); }
            catch (error) { if (error.code !== 'ER_DUP_FIELDNAME' && error.errno !== 1060) throw error; }
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
        await pool.query("ALTER TABLE question_id_suggestions ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64)")
            .catch(e => console.log('Migration notice (suggestion content hash):', e.message));
        try { await pool.query("CREATE INDEX idx_suggestion_fingerprint ON question_id_suggestions(question_id, content_hash, current_id, status)"); } catch {}

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

        try {
            const [uCols] = await pool.query('DESCRIBE users');
            const colNames = (uCols || []).map(c => c.Field);
            const userMigrations = [
                { name: 'is_pro', def: 'BOOLEAN DEFAULT FALSE' },
                { name: 'avatar_url', def: 'TEXT' },
                { name: 'bio', def: 'TEXT' },
                { name: 'grade_id', def: 'INT' },
                { name: 'phone', def: 'VARCHAR(20)' },
                { name: 'parent_phone', def: 'VARCHAR(20)' },
                { name: 'date_of_birth', def: 'DATE' },
                { name: 'gender', def: 'VARCHAR(10)' },
                { name: 'class_name', def: 'VARCHAR(50)' },
                { name: 'student_code', def: 'VARCHAR(50)' },
                { name: 'address', def: 'VARCHAR(255)' },
                { name: 'reset_password_otp', def: 'VARCHAR(255)' },
                { name: 'reset_password_expires', def: 'DATETIME' }
            ];
            for (const col of userMigrations) {
                if (!colNames.includes(col.name)) {
                    await pool.query('ALTER TABLE users ADD COLUMN ' + col.name + ' ' + col.def).catch(() => undefined);
                }
            }
        } catch (e) {
            console.log("Migration notice (users):", e.message);
        };

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
        await pool.query(await readFile(new URL('../migrations/20261006_lesson_authoring.sql', import.meta.url), 'utf8'));

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
            CREATE TABLE IF NOT EXISTS student_lesson_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                username VARCHAR(50) NOT NULL,
                lesson_id VARCHAR(100) NOT NULL,
                lesson_title VARCHAR(255) NOT NULL,
                grade VARCHAR(10) NOT NULL,
                score DECIMAL(5,2) DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                attempts INT DEFAULT 1,
                last_studied_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_lesson (username, lesson_id),
                INDEX idx_slh_user (user_id),
                INDEX idx_slh_username (username),
                INDEX idx_slh_grade (grade),
                CONSTRAINT fk_slh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (student_lesson_history):", e.message));

        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_learning_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                username VARCHAR(50) NOT NULL,
                lesson_id VARCHAR(100) NOT NULL,
                lesson_title VARCHAR(255) NOT NULL,
                grade VARCHAR(10) NOT NULL,
                score DECIMAL(5,2) DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sll_username (username),
                INDEX idx_sll_lesson (lesson_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `).catch(e => console.log("Migration notice (student_learning_logs):", e.message));

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
            await pool.query("INSERT IGNORE INTO users (username, password_hash, full_name, role, is_pro) VALUES (?, ?, ?, ?, ?)", ['admin', hash, 'Quáº£n trá»‹ viÃªn', 'ADMIN', 1]);
        } else if (users.length === 0) {
            console.warn('[SEED] ChÆ°a cÃ³ quáº£n trá»‹ viÃªn. HÃ£y Ä‘áº·t ADMIN_INITIAL_PASSWORD (Ã­t nháº¥t 12 kÃ½ tá»±) rá»“i khá»Ÿi Ä‘á»™ng láº¡i má»™t láº§n.');
        }
        
        const grades = [
            {code: '6', name: 'Lá»›p 6'}, {code: '7', name: 'Lá»›p 7'}, {code: '8', name: 'Lá»›p 8'}, {code: '9', name: 'Lá»›p 9'},
            {code: '0', name: 'Lá»›p 10'}, {code: '1', name: 'Lá»›p 11'}, {code: '2', name: 'Lá»›p 12'}
        ];
        for (const g of grades) await pool.query("INSERT IGNORE INTO grades (code, name) VALUES (?, ?)", [g.code, g.name]);

        const subjects = [{code: 'D', name: 'Äáº¡i sá»‘ / Giáº£i tÃ­ch'}, {code: 'H', name: 'HÃ¬nh há»c'}, {code: 'C', name: 'ChuyÃªn Ä‘á»'}];
        for (const s of subjects) await pool.query("INSERT IGNORE INTO subjects (code, name) VALUES (?, ?)", [s.code, s.name]);

        const levels = [{code: 'N', name: 'Nháº­n biáº¿t', w: 1}, {code: 'H', name: 'ThÃ´ng hiá»ƒu', w: 2}, {code: 'V', name: 'Váº­n dá»¥ng', w: 3}, {code: 'C', name: 'Váº­n dá»¥ng cao', w: 4}];
        for (const l of levels) await pool.query("INSERT IGNORE INTO levels (code, name, weight) VALUES (?, ?, ?)", [l.code, l.name, l.w]);

        const types = [{code: 'TN', name: 'Tráº¯c nghiá»‡m'}, {code: 'TF', name: 'ÄÃºng Sai'}, {code: 'KQ', name: 'Tráº£ lá»i ngáº¯n'}, {code: 'TL', name: 'Tá»± luáº­n'}];
        for (const t of types) await pool.query("INSERT IGNORE INTO question_types (code, name) VALUES (?, ?)", [t.code, t.name]);

        // Indexes for faster queries
        try { await pool.query("CREATE INDEX idx_questions_legacy_full_id ON questions(legacy_full_id)"); } catch {}
        try { await pool.query("CREATE INDEX idx_id6_metadata_id_full ON id6_metadata(id_full)"); } catch {}
        try { await pool.query("CREATE INDEX idx_chapters_grade_subject_num ON chapters(grade_id, subject_id, chapter_number)"); } catch {}
        try { await pool.query("CREATE INDEX idx_units_chapter_num ON units(chapter_id, unit_number)"); } catch {}

        // Repair stale flags created by older automatic ID assignment flows.
        // Do not mark semantic review as confirmed here; only acknowledge that
        // the stored canonical ID exists in the current ID6 catalog.
        await pool.query(`
            UPDATE questions q
            INNER JOIN id6_metadata m ON m.id_full = TRIM(q.legacy_full_id)
            SET q.id_status = 1
            WHERE COALESCE(q.id_status, 0) = 0
        `).catch(e => console.log('Migration notice (ID status reconciliation):', e.message));

    } catch (err) { if (err.code !== 'ER_NO_SUCH_TABLE') console.error("[SEED ERROR]", err.message); }
}
