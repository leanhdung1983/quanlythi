import express from "express";
import { query } from "../core.js";
import {
  requireLearningUnit,
  canEditLearningSection,
  learningError,
} from "../learningAccess.js";
const router = express.Router();
router.get("/learning/catalog", async (req, res) => {
  try {
    const [account] = await query("SELECT is_pro FROM users WHERE id=?", [
      req.user.id,
    ]);
    const rows = await query(
      `SELECT u.id,u.chapter_id,u.unit_number,u.name,c.chapter_number,c.name AS chapter_name,
            g.code AS grade_code,s.code AS subject_code,s.name AS subject_name,
            COALESCE(content.section_count,0) AS section_count,COALESCE(content.video_count,0) AS video_count,
            COALESCE(done.completed_count,0) AS completed_count,COALESCE(own.draft_count,0) AS draft_count,
            COALESCE(bank.question_count,0) AS question_count,
            NOT EXISTS (SELECT 1 FROM units earlier WHERE earlier.chapter_id=u.chapter_id AND
                (earlier.unit_number<u.unit_number OR (earlier.unit_number=u.unit_number AND earlier.id<u.id))) AS first_in_chapter
            FROM units u JOIN chapters c ON c.id=u.chapter_id JOIN grades g ON g.id=c.grade_id JOIN subjects s ON s.id=c.subject_id
            LEFT JOIN (SELECT unit_id,COUNT(*) AS section_count,SUM(CASE WHEN video_url IS NOT NULL AND video_url<>'' THEN 1 ELSE 0 END) AS video_count FROM lesson_sections GROUP BY unit_id) content ON content.unit_id=u.id
            LEFT JOIN (SELECT ls.unit_id,COUNT(*) AS completed_count FROM user_lesson_progress p JOIN lesson_sections ls ON ls.id=p.section_id WHERE p.user_id=? AND p.is_completed=1 GROUP BY ls.unit_id) done ON done.unit_id=u.id
            LEFT JOIN (SELECT unit_id,COUNT(*) AS draft_count FROM lesson_authoring_drafts WHERE created_by=? AND published_at IS NULL GROUP BY unit_id) own ON own.unit_id=u.id
            LEFT JOIN (SELECT unit_id,COUNT(*) AS question_count FROM questions WHERE is_public=1 OR created_by=? OR ?='ADMIN' GROUP BY unit_id) bank ON bank.unit_id=u.id
            ORDER BY g.code,s.code,c.chapter_number,u.unit_number,u.id`,
      [req.user.id, req.user.id, req.user.id, req.user.role],
    );
    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        accessible:
          req.user.role !== "STUDENT" ||
          !!Number(account?.is_pro) ||
          !!Number(row.first_in_chapter),
      })),
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});
router.get("/learning/units/:id", async (req, res) => {
  try {
    const unit = await requireLearningUnit(req, req.params.id);
    const sections = await query(
      "SELECT * FROM lesson_sections WHERE unit_id=? ORDER BY order_index ASC,id ASC",
      [unit.id],
    );
    // Fetch own publication ledger once, rather than one ownership query per block.
    const drafts =
      req.user.role === "TEACHER"
        ? await query(
            "SELECT published_section_ids FROM lesson_authoring_drafts WHERE unit_id=? AND created_by=? AND published_at IS NOT NULL",
            [unit.id, req.user.id],
          )
        : [];
    const owned = new Set(
      drafts.flatMap((d) => {
        try {
          const ids =
            typeof d.published_section_ids === "string"
              ? JSON.parse(d.published_section_ids || "[]")
              : d.published_section_ids;
          return Array.isArray(ids) ? ids.map(Number) : [];
        } catch {
          return [];
        }
      }),
    );
    const progress = await query(
      "SELECT p.section_id,p.is_completed,p.score FROM user_lesson_progress p JOIN lesson_sections s ON s.id=p.section_id WHERE p.user_id=? AND s.unit_id=?",
      [req.user.id, unit.id],
    );
    res.json({
      success: true,
      data: {
        sections: sections.map((s) => ({
          ...s,
          editable: req.user.role === "ADMIN" || owned.has(Number(s.id)),
        })),
        progress,
      },
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});
router.put("/learning/sections/:id", async (req, res) => {
  try {
    if (
      !Number.isSafeInteger(Number(req.params.id)) ||
      Number(req.params.id) < 1
    )
      throw learningError(400, "Mục học không hợp lệ.");
    const [section] = await query("SELECT * FROM lesson_sections WHERE id=?", [
      req.params.id,
    ]);
    if (!section) throw learningError(404, "Mục học không còn tồn tại.");
    if (!(await canEditLearningSection(req, section)))
      throw learningError(
        403,
        "Bạn chỉ được chỉnh các mục do mình xuất bản; quản trị viên quản lý nội dung dùng chung.",
      );
    const { title, content } = req.body || {};
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.length > 200 ||
      typeof content !== "string" ||
      content.length > 20000
    )
      throw learningError(
        400,
        "Nhập tiêu đề tối đa 200 ký tự và nội dung tối đa 20.000 ký tự.",
      );
    // Update text only: preserve media, matrices, IDs and existing progress.
    await query("UPDATE lesson_sections SET title=?,content=? WHERE id=?", [
      title.trim(),
      content,
      section.id,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});
export default router;
