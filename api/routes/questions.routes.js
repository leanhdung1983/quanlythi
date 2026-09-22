import express from 'express';
import crypto from 'crypto';
import { 
    pool,
    query, 
    isAdmin, 
    requireAdmin, 
    requireTeacherOrAdmin, 
    canManageQuestion,
    generateHash,
    normalizeLatex,
    sanitizeSvg,
    resolveHierarchyIds,
    getGradeDigitSQL,
    cacheMiddleware, 
    clearCache 
} from '../core.js';
import { inspectQuestionId, normalizeId6, normalizeQuestionSource } from '../id6.js';

const router = express.Router();

// 1. Image cache endpoints
router.get('/images/:hash', async (req, res) => {
    try {
        if (!/^[a-f0-9]{64}$/i.test(req.params.hash)) return res.status(400).json({ error: 'Hash ảnh không hợp lệ.' });
        const [rows] = await pool.query("SELECT svg_content FROM question_images WHERE tikz_hash = ?", [req.params.hash]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Image not found" });
        }
        const cleanSvg = sanitizeSvg(rows[0].svg_content);
        if (!cleanSvg) return res.status(422).json({ error: 'Ảnh lưu trữ không đạt yêu cầu an toàn.' });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: true, svg: cleanSvg });
    } catch (e) { 
        console.error("Error fetching image:", e);
        res.status(500).json({ error: e.message }); 
    }
});

router.post('/images', async (req, res) => {
    try {
        const { hash, svg } = req.body;
        if (!/^[a-f0-9]{64}$/i.test(hash || '') || !svg) return res.status(400).json({ error: "Hash hoặc SVG không hợp lệ." });
        const cleanSvg = sanitizeSvg(svg);
        if (!cleanSvg) return res.status(400).json({ error: "Nội dung SVG không hợp lệ hoặc chứa mã không an toàn." });
        await query("INSERT INTO question_images (tikz_hash, svg_content) VALUES (?, ?) ON DUPLICATE KEY UPDATE svg_content=VALUES(svg_content)", [hash, cleanSvg]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Metadata Endpoints
router.get('/metadata', cacheMiddleware(300), async (req, res) => {
    try {
        const rows = await query(`SELECT m.*, IFNULL(g.code,'12') as grade_code, IFNULL(s.code,'D') as subject_code, c.chapter_number as chapter_num, u.unit_number as unit_num, u.name as unit_name, c.name as chapter_name, IFNULL(l.code,'H') as level_code, IFNULL(${getGradeDigitSQL()},2) as id_class, IFNULL(s.code,'D') as id_subject, c.chapter_number as id_chapter, u.unit_number as id_unit, IFNULL(l.code,'H') as id_level, m.count_id as id_count FROM id6_metadata m LEFT JOIN grades g ON m.grade_id=g.id LEFT JOIN subjects s ON m.subject_id=s.id LEFT JOIN chapters c ON m.chapter_id=c.id LEFT JOIN units u ON m.unit_id=u.id LEFT JOIN levels l ON m.level_id=l.id ORDER BY m.id_full ASC`);
        res.json({ success: true, data: rows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/metadata', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const m = req.body;
        const normalizedMetaId = normalizeId6(m.id_full || '');
        if (!normalizedMetaId) return res.status(400).json({ error: 'Mã ID6 không đúng định dạng chuẩn.' });
        const conn = await pool.getConnection();
        try {
            const [levels] = await conn.query("SELECT id, code FROM levels");
            const levelMap = levels.reduce((acc, l) => ({...acc, [l.code]: l.id}), {});
            
            const { gradeId, subjectId, chapterId, unitId } = await resolveHierarchyIds(
                conn, 
                m.id_class, m.id_subject, m.id_chapter, m.id_unit, 
                m.chapter_name, m.unit_name
            );
            await clearCache('/api/questions*');
            
            const levelId = levelMap[m.id_level || 'H'] || 1;
            await conn.query(`INSERT INTO id6_metadata (id_full, description, count_id, grade_id, subject_id, chapter_id, unit_id, level_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [normalizedMetaId, m.description, m.count_id, gradeId, subjectId, chapterId, unitId, levelId]);
            await clearCache('/api/metadata*');
            await clearCache('/api/tree-data*');
            res.json({ success: true });
        } catch(e) { throw e; } finally { conn.release(); }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/metadata/:id_full', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return; 
        await query("UPDATE id6_metadata SET description = ? WHERE id_full = ?", [req.body.description, normalizeId6(req.params.id_full) || req.params.id_full]); 
        await clearCache('/api/metadata*'); 
        await clearCache('/api/tree-data*'); 
        res.json({ success: true }); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

router.delete('/metadata/:id_full', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return; 
        await query("DELETE FROM id6_metadata WHERE id_full = ?", [normalizeId6(req.params.id_full) || req.params.id_full]); 
        await clearCache('/api/metadata*'); 
        await clearCache('/api/tree-data*'); 
        res.json({ success: true }); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

router.post('/metadata/bulk-delete', async (req, res) => { 
    try { 
        if (!requireAdmin(req, res)) return;
        const { ids } = req.body;
        await query("DELETE FROM id6_metadata WHERE id IN (?)", [ids]); 
        await clearCache('/api/metadata*'); 
        await clearCache('/api/tree-data*'); 
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({error: e.message}); } 
});

router.post('/import-metadata', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { metadata } = req.body; 
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            let count = 0;
            const [levels] = await conn.query("SELECT id, code FROM levels");
            const levelMap = levels.reduce((acc, l) => ({...acc, [l.code]: l.id}), {});

            for(const m of metadata) {
                const normalizedMetaId = normalizeId6(m.id_full || '');
                if (!normalizedMetaId) continue;
                if (m.id_class !== undefined && m.id_subject && m.id_chapter !== undefined && m.id_unit !== undefined) {
                    const { gradeId, subjectId, chapterId, unitId } = await resolveHierarchyIds(conn, m.id_class, m.id_subject, m.id_chapter, m.id_unit, m.chapter_name, m.unit_name);
                    const lvlCode = m.id_level || 'H';
                    const levelId = levelMap[lvlCode] || 1;
                    await conn.query(`INSERT INTO id6_metadata (id_full, description, count_id, grade_id, subject_id, chapter_id, unit_id, level_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description), chapter_id=VALUES(chapter_id), unit_id=VALUES(unit_id), grade_id=VALUES(grade_id), subject_id=VALUES(subject_id), level_id=VALUES(level_id)`, [normalizedMetaId, m.description, m.count_id, gradeId, subjectId, chapterId, unitId, levelId]);
                    count++;
                } else {
                    await conn.query("INSERT IGNORE INTO id6_metadata (id_full, description, count_id) VALUES (?, ?, ?)", [normalizedMetaId, m.description, m.count_id]);
                }
            }
            await conn.commit();
            await clearCache('/api/metadata*');
            await clearCache('/api/tree-data*');
            res.json({ success: true, count });
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Chapters & Units
router.get('/chapters', cacheMiddleware(300), async (req, res) => {
    try { 
        const rows = await query(`SELECT c.id, c.chapter_number, c.name as chapter_name, ${getGradeDigitSQL()} as id_class, IFNULL(s.code, 'D') as id_subject, c.chapter_number as id_chapter FROM chapters c LEFT JOIN grades g ON c.grade_id = g.id LEFT JOIN subjects s ON c.subject_id = s.id ORDER BY c.grade_id, c.subject_id, c.chapter_number`); 
        res.json({ success: true, data: rows }); 
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/units', cacheMiddleware(300), async (req, res) => {
    try { 
        const rows = await query(`SELECT u.id, u.unit_number, u.name as unit_name, u.unit_number as id_unit, c.id as chapter_id FROM units u LEFT JOIN chapters c ON u.chapter_id = c.id ORDER BY c.id, u.unit_number`); 
        res.json({ success: true, data: rows }); 
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/units/:unit_id/practice', async (req, res) => {
    try {
        const { unit_id } = req.params;
        const questions = await query(`
            SELECT q.*, l.code as level_code, qt.code as type_code
            FROM questions q
            JOIN levels l ON q.level_id = l.id
            JOIN question_types qt ON q.type_id = qt.id
            WHERE q.unit_id = ?
        `, [unit_id]);
        
        const pool_N_H_TN = questions.filter(q => q.type_code === 'TN' && ['N', 'H'].includes(q.level_code));
        const pool_V_C_TN = questions.filter(q => q.type_code === 'TN' && ['V', 'C'].includes(q.level_code));
        
        const pool_N_H_TF = questions.filter(q => q.type_code === 'TF' && ['N', 'H'].includes(q.level_code));
        const pool_N_H_KQ = questions.filter(q => q.type_code === 'KQ' && ['N', 'H'].includes(q.level_code));
        const pool_V_C_KQ = questions.filter(q => q.type_code === 'KQ' && ['V', 'C'].includes(q.level_code));
        
        const pickRandom = (arr, count) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };
        
        let selected = [];
        
        // 6 TN: 4 N/H, 2 V/C
        const chosen_TN_NH = pickRandom(pool_N_H_TN, 4);
        const chosen_TN_VC = pickRandom(pool_V_C_TN, 2);
        const tnDiff = 6 - (chosen_TN_NH.length + chosen_TN_VC.length);
        if (tnDiff > 0) {
            const usedIds = [...chosen_TN_NH, ...chosen_TN_VC].map(q => q.id);
            const remainingTN = questions.filter(q => q.type_code === 'TN' && !usedIds.includes(q.id));
            selected.push(...pickRandom(remainingTN, tnDiff));
        }
        selected.push(...chosen_TN_NH, ...chosen_TN_VC);
        
        // 2 TF: 2 N/H
        const chosen_TF_NH = pickRandom(pool_N_H_TF, 2);
        const tfDiff = 2 - chosen_TF_NH.length;
        if (tfDiff > 0) {
            const usedIds = chosen_TF_NH.map(q => q.id);
            const remainingTF = questions.filter(q => q.type_code === 'TF' && !usedIds.includes(q.id));
            selected.push(...pickRandom(remainingTF, tfDiff));
        }
        selected.push(...chosen_TF_NH);
        
        // 2 KQ: 1 N/H, 1 V/C
        const chosen_KQ_NH = pickRandom(pool_N_H_KQ, 1);
        const chosen_KQ_VC = pickRandom(pool_V_C_KQ, 1);
        const kqDiff = 2 - (chosen_KQ_NH.length + chosen_KQ_VC.length);
        if (kqDiff > 0) {
            const usedIds = [...chosen_KQ_NH, ...chosen_KQ_VC].map(q => q.id);
            const remainingKQ = questions.filter(q => ['KQ', 'TL'].includes(q.type_code) && !usedIds.includes(q.id));
            selected.push(...pickRandom(remainingKQ, kqDiff));
        }
        selected.push(...chosen_KQ_NH, ...chosen_KQ_VC);
        
        selected = selected.sort(() => 0.5 - Math.random());
        res.json({ success: true, data: selected });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Questions Management
router.get('/questions/shared', async (req, res) => {
    try {
        const rows = await query("SELECT * FROM questions WHERE is_public = 1 LIMIT 100");
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/questions/:id/competencies', async (req, res) => {
    try {
        if (!(await canManageQuestion(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền sửa câu hỏi này.' });
        const { competencies } = req.body;
        await query("UPDATE questions SET competencies = ? WHERE id = ?", [JSON.stringify(competencies), req.params.id]);
        await clearCache('/api/questions*');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/questions/:id/public', async (req, res) => {
    try {
        if (!(await canManageQuestion(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền thay đổi câu hỏi này.' });
        const { is_public } = req.body;
        await query("UPDATE questions SET is_public = ? WHERE id = ?", [is_public, req.params.id]);
        await clearCache('/api/questions*');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions/by-ids', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return res.json({ success: true, data: [] });
        const rows = await query(`
            SELECT q.id, q.unit_id, q.legacy_full_id as id_full, q.content_latex as raw_latex, q.content_latex_original as original_latex, q.used_count, q.is_tikz_rendered, qt.code as type 
            FROM questions q 
            LEFT JOIN question_types qt ON q.type_id = qt.id 
            WHERE q.id IN (?)
        `, [ids]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/questions', cacheMiddleware(180), async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
        let sql = `SELECT id, unit_id, level_id, type_id, legacy_full_id as id_full, content_latex as raw_latex, content_latex_original, used_count, created_at, updated_at, created_by, created_by_name, difficulty_index, discrimination_index, competencies, choices, is_tikz_rendered, id_status, id_review_status, normalization_version FROM questions`;
        const params = [];
        const whereClauses = [];

        if (req.query.unclassified === 'true') {
            whereClauses.push("(id_status = 0 OR legacy_full_id IS NULL OR TRIM(legacy_full_id) = '' OR legacy_full_id = 'UNKNOWN')");
        } else if (req.query.search) {
            whereClauses.push("(legacy_full_id LIKE ? OR content_latex LIKE ?)");
            params.push(`%${req.query.search}%`, `%${req.query.search}%`);
        }

        if (req.query.grade && req.query.grade !== 'ALL') {
            whereClauses.push("legacy_full_id REGEXP ?");
            params.push(`^\\[?${req.query.grade}`);
        }
        if (req.query.subject && req.query.subject !== 'ALL') {
            whereClauses.push("legacy_full_id REGEXP ?");
            params.push(`^\\[?\\d+${req.query.subject}`);
        }
        if (req.query.chapter && req.query.chapter !== 'ALL') {
            whereClauses.push("legacy_full_id REGEXP ?");
            params.push(`^\\[?\\d+[A-Z]+${req.query.chapter}[A-Z]`);
        }
        if (req.query.unit && req.query.unit !== 'ALL') {
            whereClauses.push("legacy_full_id REGEXP ?");
            const chapPart = (req.query.chapter && req.query.chapter !== 'ALL') ? req.query.chapter : '\\d+';
            params.push(`^\\[?\\d+[A-Z]+${chapPart}[A-Z]${req.query.unit}-`);
        }
        if (req.query.level && req.query.level !== 'ALL') {
            whereClauses.push("legacy_full_id LIKE ?");
            params.push(`%${req.query.level}%`);
        }
        if (req.query.type && req.query.type !== 'ALL') {
            whereClauses.push("legacy_full_id LIKE ?");
            params.push(`%-${req.query.type}`);
        }
        if (req.query.q_type && req.query.q_type !== 'ALL') {
            whereClauses.push("type_id IN (SELECT id FROM question_types WHERE code = ?)");
            params.push(req.query.q_type);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(limit);

        const rows = await query(sql, params);
        const processedRows = rows.map(r => ({
            ...r,
            competencies: typeof r.competencies === 'string' ? JSON.parse(r.competencies) : (r.competencies || []),
            choices: typeof r.choices === 'string' ? JSON.parse(r.choices) : (r.choices || [])
        }));
        res.json({ success: true, data: processedRows });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const { questions } = req.body;
        const created_by = req.user.id;
        const [creator] = await query('SELECT full_name, username FROM users WHERE id = ?', [created_by]);
        const created_by_name = creator?.full_name || creator?.username || 'Người dùng';
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [levels] = await conn.query("SELECT id, code FROM levels");
            const defaultLevel = levels.length > 0 ? levels[0].id : 1;

            const [types] = await conn.query("SELECT id, code FROM question_types");
            const typeMap = types.reduce((acc, t) => ({...acc, [t.code]: t.id}), {});
            const defaultType = types.length > 0 ? types[0].id : 1;

            for (const q of questions) {
                let unitId = null;
                let levelId = defaultLevel;
                let typeId = defaultType;
                const normalizedId = normalizeId6(q.id_full || '');
                const canonicalSource = normalizedId
                    ? normalizeQuestionSource(q.raw_latex, normalizedId).source
                    : normalizeQuestionSource(q.raw_latex, '').source;

                if (q.q_type && typeMap[q.q_type]) {
                    typeId = typeMap[q.q_type];
                }

                let idStatus = 0;
                if (normalizedId) {
                    const [metaRows] = await conn.query('SELECT unit_id, level_id FROM id6_metadata WHERE id_full = ? LIMIT 1', [normalizedId]);
                    if (metaRows.length > 0) {
                        unitId = metaRows[0].unit_id;
                        levelId = metaRows[0].level_id || levelId;
                        idStatus = 1;
                    }
                }

                const contentHash = generateHash(canonicalSource);
                const choicesJson = q.choices ? JSON.stringify(q.choices) : null;
                
                const hasTikZ = canonicalSource.includes('tikzpicture') || canonicalSource.includes('tkz-tab') || canonicalSource.includes('tkz-euclide');
                const isTikzRendered = hasTikZ ? 0 : 2;

                await conn.query(
                    "INSERT INTO questions (legacy_full_id, content_latex, content_latex_original, unit_id, level_id, type_id, created_by, created_by_name, content_hash, choices, is_tikz_rendered, id_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                    [normalizedId || null, canonicalSource, q.raw_latex, unitId, levelId, typeId, created_by, created_by_name, contentHash, choicesJson, isTikzRendered, idStatus]
                );
            }
            await conn.commit();
            await clearCache('/api/questions*');
            await clearCache('/api/tree-data*');
            res.json({ success: true });
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/questions/:id', async (req, res) => { 
    if (!(await canManageQuestion(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền sửa câu hỏi này.' });
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query('SELECT * FROM questions WHERE id = ? FOR UPDATE', [req.params.id]);
        const existing = rows[0];
        if (!existing) { await conn.rollback(); return res.status(404).json({ error: 'Câu hỏi không tồn tại.' }); }
        const requestedId = req.body.id_full === undefined ? existing.legacy_full_id : req.body.id_full;
        const normalizedId = normalizeId6(requestedId || '');
        let metadata = null;
        if (normalizedId) {
            const [metaRows] = await conn.query('SELECT unit_id, level_id FROM id6_metadata WHERE id_full = ? LIMIT 1', [normalizedId]);
            metadata = metaRows[0] || null;
            if (!metadata) { await conn.rollback(); return res.status(422).json({ error: 'ID không tồn tại trong danh mục ID6.' }); }
        }
        const sourceInput = req.body.raw_latex === undefined ? existing.content_latex : req.body.raw_latex;
        const source = normalizeQuestionSource(sourceInput, normalizedId).source;
        const sourceWasEdited = req.body.raw_latex !== undefined;
        const originalSource = sourceWasEdited ? source : existing.content_latex_original;
        const renderStatus = sourceWasEdited
            ? (/\\begin\s*\{\s*(?:tikzpicture|tkz-tab|tkz-euclide)\s*\}/i.test(source) ? 0 : 2)
            : existing.is_tikz_rendered;
        await conn.query(`INSERT INTO question_revisions (question_id, content_latex, legacy_full_id, unit_id, level_id, type_id, change_type, changed_by)
            VALUES (?, ?, ?, ?, ?, ?, 'QUESTION_BANK_EDIT', ?)`,
            [existing.id, existing.content_latex, existing.legacy_full_id, existing.unit_id, existing.level_id, existing.type_id, req.user.id]);
        const difficulty = req.body.difficulty_index === undefined ? existing.difficulty_index : (Number.isFinite(Number(req.body.difficulty_index)) ? Number(req.body.difficulty_index) : null);
        const discrimination = req.body.discrimination_index === undefined ? existing.discrimination_index : (Number.isFinite(Number(req.body.discrimination_index)) ? Number(req.body.discrimination_index) : null);
        const competencies = req.body.competencies === undefined ? existing.competencies : JSON.stringify(req.body.competencies);
        await conn.query(`UPDATE questions SET legacy_full_id = ?, content_latex = ?, content_latex_original = ?, is_tikz_rendered = ?, unit_id = COALESCE(?, unit_id),
            level_id = COALESCE(?, level_id), id_status = ?, id_review_status = ?, normalization_version = 1,
            normalized_at = NOW(), content_hash = ?, is_duplicate_checked = FALSE, difficulty_index = ?,
            discrimination_index = ?, competencies = ? WHERE id = ?`,
            [normalizedId || null, source, originalSource, renderStatus, metadata?.unit_id, metadata?.level_id, metadata ? 1 : 0,
                metadata ? 'CONFIRMED' : 'PENDING', generateHash(source), difficulty, discrimination, competencies, existing.id]);
        if (sourceWasEdited) await conn.query('DELETE FROM tikz_render_failures WHERE question_id = ?', [existing.id]);
        await conn.commit();
        await clearCache('/api/questions*');
        await clearCache('/api/tree-data*');
        res.json({ success: true, id_full: normalizedId || null });
    } catch(e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally { conn.release(); }
});

router.delete('/questions/:id', async (req, res) => { 
    try { 
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const [user] = await query("SELECT role, is_pro FROM users WHERE id = ?", [userId]);
        if (!user) return res.status(401).json({ error: "User not found" });

        if (user.role === 'ADMIN') {
            await query("DELETE FROM questions WHERE id = ?", [req.params.id]);
            await clearCache('/api/questions*');
        } else if (user.role === 'TEACHER') {
            if (!user.is_pro) {
                return res.status(403).json({ error: "Giáo viên chưa kích hoạt Pro không được phép xoá câu hỏi." });
            }
            const [question] = await query("SELECT created_by FROM questions WHERE id = ?", [req.params.id]);
            if (question && question.created_by == userId) {
                await query("DELETE FROM questions WHERE id = ?", [req.params.id]);
                await clearCache('/api/questions*');
            } else {
                return res.status(403).json({ error: "Bạn chỉ có thể xoá câu hỏi do chính mình tạo lên." });
            }
        } else {
            return res.status(403).json({ error: "Học sinh không có quyền xoá câu hỏi." });
        }
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({ error: e.message }); } 
});

router.post('/questions/bulk-delete', async (req, res) => { 
    try { 
        const { ids } = req.body; 
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const [user] = await query("SELECT role, is_pro FROM users WHERE id = ?", [userId]);
        if (!user) return res.status(401).json({ error: "User not found" });

        if (user.role === 'ADMIN') {
            await query("DELETE FROM questions WHERE id IN (?)", [ids]);
            await clearCache('/api/questions*');
        } else if (user.role === 'TEACHER') {
            if (!user.is_pro) {
                return res.status(403).json({ error: "Giáo viên chưa kích hoạt Pro không được phép xoá câu hỏi." });
            }
            const rows = await query("SELECT id FROM questions WHERE id IN (?) AND created_by = ?", [ids, userId]);
            const ownIds = rows.map(r => r.id);
            if (ownIds.length === 0) {
                return res.status(403).json({ error: "Bạn không sở hữu bất kỳ câu hỏi nào trong danh sách chọn." });
            }
            await query("DELETE FROM questions WHERE id IN (?)", [ownIds]);
            await clearCache('/api/questions*');
            if (ownIds.length < ids.length) {
                return res.json({ success: true, message: `Đã xoá ${ownIds.length} câu hỏi của bạn. Một số câu hỏi khác không bị xoá do bạn không phải người tạo.` });
            }
        } else {
            return res.status(403).json({ error: "Học sinh không có quyền xoá câu hỏi." });
        }
        res.json({ success: true }); 
    } catch(e) { res.status(500).json({error: e.message}); } 
});

router.post('/questions/batch-update', async (req, res) => {
    try {
        const { updates } = req.body; 
        if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ error: 'Danh sách cập nhật không hợp lệ.' });
        if (!isAdmin(req)) {
            if (req.user?.role !== 'TEACHER') return res.status(403).json({ error: 'Bạn không có quyền cập nhật câu hỏi.' });
            const ids = updates.map(item => Number(item.id)).filter(Number.isInteger);
            const owned = await query('SELECT id FROM questions WHERE id IN (?) AND created_by = ?', [ids, req.user.id]);
            if (owned.length !== ids.length) return res.status(403).json({ error: 'Danh sách có câu hỏi không thuộc quyền sở hữu của bạn.' });
        }
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            for (const item of updates) {
                if (item.id_full) {
                    const normalizedId = normalizeId6(item.id_full);
                    if (!normalizedId) {
                        const error = new Error(`ID của câu #${item.id} sai định dạng.`);
                        error.status = 422;
                        throw error;
                    }
                    const [metaRows] = await conn.query("SELECT unit_id, level_id FROM id6_metadata WHERE id_full = ? LIMIT 1", [normalizedId]);
                    const meta = metaRows[0];
                    if (!meta) {
                        const error = new Error(`ID ${normalizedId} không tồn tại trong danh mục ID6.`);
                        error.status = 422;
                        throw error;
                    }
                    const normalizedSource = normalizeQuestionSource(item.raw_latex, normalizedId).source;
                    await conn.query(`UPDATE questions SET content_latex = ?, legacy_full_id = ?, unit_id = ?, level_id = ?,
                        id_status = 1, id_review_status = 'CONFIRMED', normalization_version = 1, normalized_at = NOW(),
                        content_hash = ?, is_duplicate_checked = FALSE, is_tikz_rendered = 0 WHERE id = ?`,
                        [normalizedSource, normalizedId, meta.unit_id, meta.level_id, generateHash(normalizedSource), item.id]);
                } else {
                    const normalizedSource = normalizeQuestionSource(item.raw_latex, '').source;
                    await conn.query("UPDATE questions SET content_latex = ?, content_hash = ?, is_duplicate_checked = FALSE, is_tikz_rendered = 0 WHERE id = ?", [normalizedSource, generateHash(normalizedSource), item.id]);
                }
            }
            await conn.commit();
            await clearCache('/api/questions*');
            res.json({ success: true });
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    } catch(e) { res.status(e.status || 500).json({ error: e.message }); }
});

// 5. Tree data & Duplicates & ID Validation
router.get('/tree-data', cacheMiddleware(300), async (req, res) => {
    try {
        const chapters = await query(`SELECT c.*, ${getGradeDigitSQL()} as g_code, IFNULL(s.code, 'D') as s_code FROM chapters c LEFT JOIN grades g ON c.grade_id = g.id LEFT JOIN subjects s ON c.subject_id = s.id ORDER BY c.grade_id, c.subject_id, c.chapter_number ASC`);
        const units = await query(`SELECT u.*, c.id as chapter_id FROM units u JOIN chapters c ON u.chapter_id = c.id ORDER BY u.unit_number ASC`);
        const types = await query(`SELECT m.*, l.code as level_code FROM id6_metadata m LEFT JOIN levels l ON m.level_id = l.id ORDER BY m.count_id ASC`);
        
        const qs = await query(`
            SELECT 
                TRIM(q.legacy_full_id) as legacy_full_id, 
                IFNULL(l.code, 'N') as level_code, 
                IFNULL(qt.code, 'TN') as type_code,
                COUNT(*) as count 
            FROM questions q 
            LEFT JOIN levels l ON q.level_id = l.id 
            LEFT JOIN question_types qt ON q.type_id = qt.id
            WHERE q.legacy_full_id IS NOT NULL AND q.legacy_full_id != '' AND q.legacy_full_id != 'UNKNOWN'
            GROUP BY legacy_full_id, qt.code, l.code
        `);
        
        const countMap = {};
        qs.forEach(q => {
            const id = q.legacy_full_id;
            if(!countMap[id]) {
                countMap[id] = {
                    TN: {N:0,H:0,V:0,C:0},
                    TF: {N:0,H:0,V:0,C:0},
                    KQ: {N:0,H:0,V:0,C:0},
                    TL: {N:0,H:0,V:0,C:0}
                };
            }
            
            const type = q.type_code || 'TN';
            const lvl = q.level_code || 'N';
            
            if (countMap[id][type] && countMap[id][type].hasOwnProperty(lvl)) {
                countMap[id][type][lvl] = q.count;
            }
        });

        const grades = [6, 7, 8, 9, 0, 1, 2]; 
        const subjects = ['D', 'H', 'C'];
        
        const tree = grades.map((gDigit) => ({
            grade: gDigit,
            subjects: subjects.map(sCode => ({
                subject: sCode,
                chapters: chapters.filter(c => c.g_code === gDigit && c.s_code === sCode).map(chap => ({
                    id: chap.id, num: chap.chapter_number, name: chap.name,
                    units: units.filter(u => u.chapter_id === chap.id).map(unit => ({
                        id: unit.id, num: unit.unit_number, name: unit.name,
                        types: types.filter(t => t.unit_id === unit.id).map(t => ({
                            count_id: t.count_id,
                            description: t.description,
                            competencies: t.competencies,
                            id_full: t.id_full, 
                            stats: countMap[t.id_full] || {TN:{N:0,H:0,V:0,C:0},TF:{N:0,H:0,V:0,C:0},KQ:{N:0,H:0,V:0,C:0},TL:{N:0,H:0,V:0,C:0}}
                        }))
                    }))
                }))
            }))
        }));
        res.json({ success: true, data: tree });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/duplicates/find', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const dupQuestions = await query(`
            SELECT q.id, q.legacy_full_id as id_full, q.content_latex as raw_latex, q.content_latex_original as original_latex, q.used_count, q.content_hash
            FROM questions q
            JOIN (
                SELECT content_hash 
                FROM questions 
                WHERE content_hash IS NOT NULL 
                GROUP BY content_hash 
                HAVING COUNT(*) > 1
                LIMIT 500
            ) dup ON q.content_hash = dup.content_hash
            ORDER BY q.content_hash, q.id ASC
        `);

        const groupsMap = {};
        dupQuestions.forEach(q => {
            if (!groupsMap[q.content_hash]) {
                groupsMap[q.content_hash] = [];
            }
            groupsMap[q.content_hash].push({
                id: q.id,
                id_full: q.id_full,
                raw_latex: q.raw_latex,
                used_count: q.used_count,
                q_type: 'TN'
            });
        });

        res.json({ success: true, groups: Object.values(groupsMap) });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/duplicates/rehash', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const rows = await query("SELECT id, content_latex FROM questions WHERE is_duplicate_checked = FALSE OR content_hash IS NULL");
        let count = 0;
        for (const row of rows) {
            const normalized = normalizeLatex(row.content_latex);
            const hash = crypto.createHash('sha256').update(normalized).digest('hex');
            await query("UPDATE questions SET content_hash = ?, is_duplicate_checked = TRUE WHERE id = ?", [hash, row.id]);
            count++;
        }
        res.json({ success: true, count });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/validate-ids', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return res.json({ success: true, validIds: [] });
        const normalizedIds = [...new Set(ids.map(normalizeId6).filter(Boolean))];
        if (!normalizedIds.length) return res.json({ success: true, validIds: [] });
        const placeholders = normalizedIds.map(() => '?').join(',');
        const rows = await query(`SELECT id_full FROM id6_metadata WHERE id_full IN (${placeholders})`, normalizedIds);
        res.json({ success: true, validIds: rows.map(r => r.id_full) });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

async function loadMetadataMap(conn = null) {
    const runner = conn || pool;
    const [rows] = await runner.query(`
        SELECT m.id_full, m.unit_id, m.level_id, m.description, c.chapter_number, u.unit_number,
               g.code AS grade_code, s.code AS subject_code, l.code AS level_code
        FROM id6_metadata m
        LEFT JOIN grades g ON m.grade_id = g.id
        LEFT JOIN subjects s ON m.subject_id = s.id
        LEFT JOIN chapters c ON m.chapter_id = c.id
        LEFT JOIN units u ON m.unit_id = u.id
        LEFT JOIN levels l ON m.level_id = l.id
    `);
    return new Map(rows.map(row => [normalizeId6(row.id_full), row]).filter(([id]) => id));
}

function canReviewRow(req, row) {
    return isAdmin(req) || (req.user?.role === 'TEACHER' && Number(row.created_by) === Number(req.user.id));
}

router.get('/questions/review-summary', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const ownership = isAdmin(req) ? '' : 'WHERE created_by = ?';
        const params = isAdmin(req) ? [] : [req.user.id];
        const rows = await query(`SELECT id, created_by, legacy_full_id, content_latex, unit_id, level_id, normalization_version FROM questions ${ownership}`, params);
        const metadata = await loadMetadataMap();
        let missing = 0, invalid = 0, sourceMismatch = 0, normalizationPending = 0;
        for (const row of rows) {
            const review = inspectQuestionId(row, metadata);
            if (review.issues.includes('ID_MISSING')) missing++;
            if (review.issues.some(code => !['ID_MISSING', 'ID_NOT_IN_SOURCE'].includes(code))) invalid++;
            if (review.issues.includes('ID_SOURCE_MISMATCH')) sourceMismatch++;
            if (normalizeQuestionSource(row.content_latex, review.normalized).changed) normalizationPending++;
        }
        res.json({ success: true, data: { total: rows.length, missing, invalid, sourceMismatch, normalizationPending } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/questions/id-review', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const issueCode = typeof req.query.issue_code === 'string' ? req.query.issue_code : '';
        const includeAll = req.query.all === 'true';
        const start = (page - 1) * limit;
        const metadata = await loadMetadataMap();
        const data = [];
        let total = 0;
        let cursor = Number.MAX_SAFE_INTEGER;
        let hasRows = true;
        while (hasRows) {
            const conditions = ['q.id < ?'];
            const params = [cursor];
            if (!isAdmin(req)) { conditions.push('q.created_by = ?'); params.push(req.user.id); }
            params.push(1000);
            const rows = await query(`
                SELECT q.id, q.created_by, q.created_by_name, q.legacy_full_id, q.content_latex,
                       q.unit_id, q.level_id, q.type_id, q.updated_at, q.normalization_version, qt.code AS question_type
                FROM questions q LEFT JOIN question_types qt ON q.type_id = qt.id
                WHERE ${conditions.join(' AND ')} ORDER BY q.id DESC LIMIT ?
            `, params);
            hasRows = rows.length === 1000;
            if (!rows.length) break;
            cursor = rows[rows.length - 1].id;
            for (const row of rows) {
                const review = inspectQuestionId(row, metadata);
                const needsReview = review.issues.length > 0;
                if (!includeAll && !needsReview) continue;
                if (issueCode && !review.issues.includes(issueCode)) continue;
                if (total >= start && data.length < limit) data.push({ ...row, ...review, metadata: review.metadata || null, needsReview });
                total++;
            }
        }
        res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit), hasMore: start + data.length < total });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions/normalize/preview', async (req, res) => {
    try {
        if (!requireTeacherOrAdmin(req, res)) return;
        const requestedIds = Array.isArray(req.body.ids) ? [...new Set(req.body.ids.map(Number).filter(Number.isInteger))] : [];
        if (requestedIds.length > 200) return res.status(413).json({ error: 'Mỗi lần chỉ được chuẩn hóa tối đa 200 câu hỏi.' });
        const ids = requestedIds;
        if (!ids.length) return res.status(400).json({ error: 'Danh sách câu hỏi không hợp lệ.' });
        const rows = await query('SELECT id, created_by, legacy_full_id, content_latex, updated_at FROM questions WHERE id IN (?)', [ids]);
        if (rows.length !== ids.length || rows.some(row => !canReviewRow(req, row))) return res.status(403).json({ error: 'Có câu hỏi không thuộc quyền quản lý của bạn.' });
        const data = rows.map(row => {
            const normalizedId = normalizeId6(row.legacy_full_id);
            const normalized = normalizeQuestionSource(row.content_latex, normalizedId);
            return { id: row.id, id_full: normalizedId, before: row.content_latex, after: normalized.source, changed: normalized.changed, updated_at: row.updated_at };
        });
        res.json({ success: true, data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions/review/confirm', async (req, res) => {
    const changes = Array.isArray(req.body.changes) ? req.body.changes : [];
    if (changes.length > 200) return res.status(413).json({ error: 'Mỗi lần chỉ được xác nhận tối đa 200 câu hỏi.' });
    if (!changes.length) return res.status(400).json({ error: 'Không có thay đổi để xác nhận.' });
    if (!requireTeacherOrAdmin(req, res)) return;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const metadata = await loadMetadataMap(conn);
        for (const change of changes) {
            const [rows] = await conn.query('SELECT * FROM questions WHERE id = ? FOR UPDATE', [Number(change.id)]);
            const row = rows[0];
            if (!row) throw new Error(`Không tìm thấy câu hỏi #${change.id}.`);
            if (!canReviewRow(req, row)) {
                const error = new Error('Bạn không sở hữu toàn bộ câu hỏi được chọn.');
                error.status = 403;
                throw error;
            }
            if (change.expected_updated_at && row.updated_at && new Date(change.expected_updated_at).getTime() !== new Date(row.updated_at).getTime()) {
                const error = new Error(`Câu hỏi #${row.id} vừa được người khác cập nhật. Vui lòng tải lại.`);
                error.status = 409;
                throw error;
            }
            const id = normalizeId6(change.id_full || row.legacy_full_id);
            const meta = metadata.get(id);
            if (!id || !meta) {
                const error = new Error(`ID đề xuất cho câu #${row.id} không tồn tại trong danh mục.`);
                error.status = 422;
                throw error;
            }
            const normalized = normalizeQuestionSource(change.content_latex ?? row.content_latex, id);
            await conn.query(`INSERT INTO question_revisions
                (question_id, content_latex, legacy_full_id, unit_id, level_id, type_id, change_type, changed_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [row.id, row.content_latex, row.legacy_full_id, row.unit_id, row.level_id, row.type_id, change.change_type || 'ID_REVIEW', req.user.id]);
            const hash = generateHash(normalized.source);
            await conn.query(`UPDATE questions SET legacy_full_id = ?, content_latex = ?, unit_id = ?, level_id = ?,
                id_status = 1, id_review_status = 'CONFIRMED', normalization_version = 1, normalized_at = NOW(),
                content_hash = ?, is_duplicate_checked = FALSE WHERE id = ?`,
                [id, normalized.source, meta.unit_id, meta.level_id, hash, row.id]);
        }
        await conn.commit();
        await clearCache('/api/questions*');
        await clearCache('/api/tree-data*');
        res.json({ success: true, updated: changes.length });
    } catch (e) {
        await conn.rollback();
        res.status(e.status || 500).json({ error: e.message });
    } finally { conn.release(); }
});

router.get('/questions/:id/revisions', async (req, res) => {
    try {
        if (!(await canManageQuestion(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử câu hỏi này.' });
        const rows = await query(`SELECT r.id, r.question_id, r.legacy_full_id, r.change_type, r.changed_by, r.created_at,
            u.full_name AS changed_by_name FROM question_revisions r LEFT JOIN users u ON r.changed_by = u.id
            WHERE r.question_id = ? ORDER BY r.created_at DESC LIMIT 100`, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/questions/:id/revisions/:revisionId/restore', async (req, res) => {
    if (!(await canManageQuestion(req, req.params.id))) return res.status(403).json({ error: 'Bạn không có quyền phục hồi câu hỏi này.' });
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [currentRows] = await conn.query('SELECT * FROM questions WHERE id = ? FOR UPDATE', [req.params.id]);
        const [revisionRows] = await conn.query('SELECT * FROM question_revisions WHERE id = ? AND question_id = ?', [req.params.revisionId, req.params.id]);
        const current = currentRows[0], revision = revisionRows[0];
        if (!current || !revision) { await conn.rollback(); return res.status(404).json({ error: 'Không tìm thấy phiên bản cần phục hồi.' }); }
        const restoredId = normalizeId6(revision.legacy_full_id || '');
        const [metaRows] = restoredId ? await conn.query('SELECT unit_id, level_id FROM id6_metadata WHERE id_full = ? LIMIT 1', [restoredId]) : [[]];
        const restoredMeta = metaRows[0] || null;
        await conn.query(`INSERT INTO question_revisions (question_id, content_latex, legacy_full_id, unit_id, level_id, type_id, change_type, changed_by)
            VALUES (?, ?, ?, ?, ?, ?, 'BEFORE_RESTORE', ?)`, [current.id, current.content_latex, current.legacy_full_id, current.unit_id, current.level_id, current.type_id, req.user.id]);
        await conn.query(`UPDATE questions SET content_latex = ?, legacy_full_id = ?, unit_id = ?, level_id = ?, type_id = ?,
            content_hash = ?, is_duplicate_checked = FALSE, id_status = ?, id_review_status = 'PENDING', normalization_version = 0 WHERE id = ?`,
            [revision.content_latex, restoredId || null, restoredMeta?.unit_id ?? revision.unit_id, restoredMeta?.level_id ?? revision.level_id,
                revision.type_id, generateHash(revision.content_latex), restoredMeta ? 1 : 0, current.id]);
        await conn.commit();
        await clearCache('/api/questions*');
        res.json({ success: true });
    } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); } finally { conn.release(); }
});

export default router;
