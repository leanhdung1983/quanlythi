
-- CREATE DATABASE IF NOT EXISTS id6_question_bank;
-- USE id6_question_bank;

-- ==========================================
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- ==========================================
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
    grade_id INT,
    expiry_date DATETIME,
    api_key VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. CÁC BẢNG DANH MỤC (LOOKUP TABLES)
-- Dữ liệu tĩnh, ít khi thay đổi/xoá
-- ==========================================

CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- '6', '7', '8', '9', '0', '1', '2'
    name VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code CHAR(1) NOT NULL UNIQUE,     -- 'D', 'H', 'C'
    name VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code CHAR(1) NOT NULL UNIQUE,     -- 'N', 'H', 'V', 'C'
    name VARCHAR(50) NOT NULL,
    weight INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- 'TN', 'TL', 'TF', 'KQ'
    name VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. CẤU TRÚC CHƯƠNG TRÌNH HỌC (STRUCTURE)
-- Liên kết chặt chẽ: Grade -> Subject -> Chapter -> Unit
-- ==========================================

CREATE TABLE IF NOT EXISTS chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id INT NOT NULL,
    subject_id INT NOT NULL,
    chapter_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Ràng buộc: Không thể có 2 chương cùng số trong cùng 1 môn của 1 lớp
    UNIQUE KEY unique_chap_structure (grade_id, subject_id, chapter_number),
    
    -- Khoá ngoại
    CONSTRAINT fk_chapters_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_chapters_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_chapters_grade_subject_num (grade_id, subject_id, chapter_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    unit_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Ràng buộc: Không thể có 2 bài cùng số trong 1 chương
    UNIQUE KEY unique_unit_structure (chapter_id, unit_number),
    
    -- Khoá ngoại: Xoá Chương -> Xoá luôn các Bài con (CASCADE)
    CONSTRAINT fk_units_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_units_chapter_num (chapter_id, unit_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. BẢNG METADATA (ĐỊNH NGHĨA ID6)
-- Quy định cấu trúc ma trận
-- ==========================================
CREATE TABLE IF NOT EXISTS id6_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_full VARCHAR(50) UNIQUE NOT NULL, -- e.g., '2D1H1-1'
    description TEXT,
    
    -- Phân loại
    grade_id INT, 
    subject_id INT,
    chapter_id INT,
    unit_id INT,
    level_id INT,
    count_id INT, -- STT dạng
    competencies JSON, -- Danh sách năng lực
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Khoá ngoại: Nếu xoá Unit/Chapter thì Metadata vẫn giữ lại nhưng link thành NULL để tránh mất định nghĩa ID
    CONSTRAINT fk_meta_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL,
    CONSTRAINT fk_meta_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_meta_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
    CONSTRAINT fk_meta_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
    CONSTRAINT fk_meta_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT,
    
    INDEX idx_id6_metadata_id_full (id_full)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. BẢNG CÂU HỎI (CORE DATA)
-- ==========================================
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
    
    -- Indexing cho tìm kiếm nhanh
    INDEX idx_legacy_id (legacy_full_id),
    INDEX idx_content_fulltext (content_latex(255)),

    -- Hỗ trợ IRT và Năng lực
    difficulty_index DECIMAL(5,2) DEFAULT 0.5, -- Độ khó thực tế (0-1)
    discrimination_index DECIMAL(5,2) DEFAULT 0.3, -- Độ phân loại
    competencies JSON, -- Danh sách năng lực (e.g., ["Mô hình hóa", "Tư duy"])
    choices JSON, -- Các lựa chọn (cho trắc nghiệm)
    is_public BOOLEAN DEFAULT FALSE, -- Chế độ chia sẻ cộng đồng
    is_tikz_rendered TINYINT DEFAULT 0, -- 0: pending, 1: success, 2: none
    id_status TINYINT DEFAULT 0,
    
    -- Tối ưu tìm trùng lặp
    content_hash VARCHAR(64), -- MD5/SHA256 hash của nội dung đã chuẩn hóa
    is_duplicate_checked BOOLEAN DEFAULT FALSE,
    
    -- Khoá ngoại
    -- Xoá Unit -> Câu hỏi trở thành "Chưa phân loại" (SET NULL) chứ không bị xoá
    CONSTRAINT fk_questions_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Không cho phép xoá Level/Type nếu đang có câu hỏi sử dụng
    CONSTRAINT fk_questions_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_questions_type FOREIGN KEY (type_id) REFERENCES question_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Xoá User -> Câu hỏi vẫn tồn tại (SET NULL)
    CONSTRAINT fk_questions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_questions_legacy_full_id (legacy_full_id),
    INDEX idx_questions_struct (unit_id, level_id, type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. HỆ THỐNG THI CỬ (EXAM SYSTEM)
-- ==========================================

-- Ma trận đề thi đã lưu
CREATE TABLE IF NOT EXISTS matrix_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    matrix_data JSON, 
    created_by INT,
    grade_id INT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Xoá User -> Xoá luôn các ma trận nháp của họ (CASCADE) để dọn rác
    CONSTRAINT fk_matrix_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_matrix_grade_pub (grade_id, is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kết quả thi
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
    
    -- Xoá User -> Xoá hết kết quả thi của họ (CASCADE)
    CONSTRAINT fk_result_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Xoá Ma trận gốc -> Kết quả vẫn giữ, nhưng link matrix_id thành NULL
    CONSTRAINT fk_result_matrix FOREIGN KEY (matrix_id) REFERENCES matrix_templates(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Báo cáo lỗi
CREATE TABLE IF NOT EXISTS question_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_id INT NOT NULL,
    report_reason TEXT,
    status ENUM('PENDING', 'RESOLVED', 'IGNORED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Xoá Câu hỏi -> Xoá luôn báo cáo liên quan (CASCADE)
    CONSTRAINT fk_report_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Xoá User -> Xoá báo cáo của họ (CASCADE)
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quản lý tác vụ nền (Background Jobs)
CREATE TABLE IF NOT EXISTS background_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- 'DUPLICATE_SCAN', 'LATEX_NORM', 'AI_GEN'
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    progress INT DEFAULT 0,
    result_data JSON,
    error_message TEXT,
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu các cặp câu hỏi trùng lặp
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng phản hồi người dùng
CREATE TABLE IF NOT EXISTS user_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng báo cáo lỗi câu hỏi
CREATE TABLE IF NOT EXISTS question_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_id INT NOT NULL,
    report_reason TEXT,
    status ENUM('PENDING', 'RESOLVED', 'IGNORED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_report_question (question_id),
    INDEX idx_report_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu ảnh TikZ đã render
CREATE TABLE IF NOT EXISTS question_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tikz_hash VARCHAR(64) UNIQUE NOT NULL,
    svg_content LONGTEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6.1. HỆ THỐNG LỚP HỌC (CLASS MANAGEMENT)
-- ==========================================
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_classes_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_students (
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'APPROVED',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, student_id),
    CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cs_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    matrix_id INT NOT NULL,
    open_time DATETIME NULL,
    deadline DATETIME NULL,
    max_attempts INT DEFAULT 0,
    allow_review BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ca_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_matrix FOREIGN KEY (matrix_id) REFERENCES matrix_templates(id) ON DELETE CASCADE,
    INDEX idx_ca_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6.2. HỆ THỐNG HỌC TẬP TƯƠNG TÁC (LEARNING)
-- ==========================================
CREATE TABLE IF NOT EXISTS lesson_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    video_url VARCHAR(255),
    interactive_html LONGTEXT,
    matrix_id INT NULL,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lesson_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_matrix FOREIGN KEY (matrix_id) REFERENCES matrix_templates(id) ON DELETE SET NULL,
    INDEX idx_lesson_unit (unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6.3. CÀI ĐẶT HỆ THỐNG & GIỚI HẠN
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_limits (
    user_id INT NOT NULL,
    activity_date DATE NOT NULL,
    exam_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    PRIMARY KEY (user_id, activity_date),
    CONSTRAINT fk_limit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 7. SEED DATA (DỮ LIỆU KHỞI TẠO)
-- Dùng INSERT IGNORE để tránh lỗi nếu chạy lại script
-- ==========================================

INSERT IGNORE INTO grades (code, name) VALUES 
('6', 'Lớp 6'), ('7', 'Lớp 7'), ('8', 'Lớp 8'), ('9', 'Lớp 9'),
('0', 'Lớp 10'), ('1', 'Lớp 11'), ('2', 'Lớp 12');

INSERT IGNORE INTO subjects (code, name) VALUES 
('D', 'Đại số / Giải tích'), 
('H', 'Hình học'), 
('C', 'Chuyên đề');

INSERT IGNORE INTO levels (code, name, weight) VALUES 
('N', 'Nhận biết', 1), 
('H', 'Thông hiểu', 2), 
('V', 'Vận dụng', 3), 
('C', 'Vận dụng cao', 4);

INSERT IGNORE INTO question_types (code, name) VALUES 
('TN', 'Trắc nghiệm'), 
('TF', 'Đúng Sai'), 
('KQ', 'Trả lời ngắn'), 
('TL', 'Tự luận');

-- Admin mặc định (Mật khẩu: DungQuyen@2014)
INSERT IGNORE INTO users (username, password_hash, full_name, email, role, is_pro) VALUES 
('admin', '$2a$10$7Z6qS6qS6qS6qS6qS6qS6uX7eY6qS6qS6qS6qS6qS6qS6qS6qS6qS', 'Lê Anh Dũng', 'thienhoang15122007@gmail.com', 'ADMIN', 1);
