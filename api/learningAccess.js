import { query } from "./core.js";
export const learningError = (status, message) =>
  Object.assign(new Error(message), { status });
export async function requireLearningUnit(req, unitId, run = query) {
  if (!Number.isSafeInteger(Number(unitId)) || Number(unitId) < 1)
    throw learningError(400, "Chọn bài học hợp lệ.");
  const [unit] = await run(
    "SELECT id,chapter_id,unit_number FROM units WHERE id=?",
    [unitId],
  );
  if (!unit) throw learningError(404, "Bài học không tồn tại.");
  if (req.user.role === "STUDENT") {
    const [user] = await run("SELECT is_pro FROM users WHERE id=?", [
      req.user.id,
    ]);
    if (!user)
      throw learningError(403, "Không tìm thấy quyền học của tài khoản.");
    if (!Number(user.is_pro)) {
      const [first] = await run(
        "SELECT id FROM units WHERE chapter_id=? ORDER BY unit_number ASC,id ASC LIMIT 1",
        [unit.chapter_id],
      );
      if (Number(first?.id) !== Number(unitId))
        throw learningError(
          403,
          "Tài khoản miễn phí được học bài đầu tiên mỗi chương. Cần nâng cấp Pro để học bài này.",
        );
    }
  }
  return unit;
}
export async function canEditLearningSection(req, section, run = query) {
  if (req.user.role === "ADMIN") return true;
  if (req.user.role !== "TEACHER") return false;
  const drafts = await run(
    "SELECT published_section_ids FROM lesson_authoring_drafts WHERE unit_id=? AND created_by=? AND published_at IS NOT NULL",
    [section.unit_id, req.user.id],
  );
  return drafts.some((d) => {
    try {
      const ids =
        typeof d.published_section_ids === "string"
          ? JSON.parse(d.published_section_ids)
          : d.published_section_ids;
      return (
        Array.isArray(ids) &&
        ids.some((id) => Number(id) === Number(section.id))
      );
    } catch {
      return false;
    }
  });
}
