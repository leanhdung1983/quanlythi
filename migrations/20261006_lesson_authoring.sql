CREATE TABLE IF NOT EXISTS lesson_authoring_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    draft_json LONGTEXT NOT NULL,
    revision INT NOT NULL DEFAULT 1,
    published_at DATETIME NULL,
    published_section_ids TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_authoring_owner_unit (created_by, unit_id),
    CONSTRAINT fk_authoring_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    CONSTRAINT fk_authoring_owner FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
