import { Unit, LessonSection, UserLessonProgress } from "../types";
export type LearningUnit = Unit & {
  chapter_number: number;
  chapter_name: string;
  grade_code: string;
  subject_code: string;
  subject_name: string;
  section_count: number;
  video_count: number;
  question_count: number;
  completed_count: number;
  draft_count: number;
  accessible: boolean;
};
export type LearningSection = LessonSection & { editable?: boolean };
export const searchLearningText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export const lessonCompletion = (unit: LearningUnit) =>
  Number(unit.section_count) > 0
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (Number(unit.completed_count) / Number(unit.section_count)) * 100,
          ),
        ),
      )
    : 0;
export function initialLearningSection(
  sections: LearningSection[],
  progress: UserLessonProgress[],
  requested?: number | null,
) {
  if (requested && sections.some((s) => s.id === requested)) return requested;
  const completed = new Set(
    progress.filter((p) => p.is_completed).map((p) => Number(p.section_id)),
  );
  return (
    sections.find((s) => !completed.has(Number(s.id)))?.id ??
    sections[0]?.id ??
    null
  );
}
export function adjacentLearningUnit(
  catalog: LearningUnit[],
  current: LearningUnit,
) {
  const sorted = catalog
    .filter(
      (u) =>
        u.grade_code === current.grade_code &&
        u.subject_code === current.subject_code,
    )
    .sort(
      (a, b) =>
        a.chapter_number - b.chapter_number ||
        a.unit_number - b.unit_number ||
        a.id - b.id,
    );
  const index = sorted.findIndex((u) => u.id === current.id);
  return sorted[index + 1] || null;
}
