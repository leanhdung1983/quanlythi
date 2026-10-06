import { describe, expect, it } from "vitest";
import {
  adjacentLearningUnit,
  initialLearningSection,
  lessonCompletion,
  searchLearningText,
  LearningUnit,
  LearningSection,
} from "../learningHub";
import { UserLessonProgress } from "../../types";
const unit = (
  id: number,
  chapter: number,
  number: number,
  grade = "12",
  subject = "D",
) =>
  ({
    id,
    chapter_number: chapter,
    unit_number: number,
    grade_code: grade,
    subject_code: subject,
    section_count: 4,
    completed_count: 2,
  }) as LearningUnit;
const sections = [{ id: 11 }, { id: 12 }, { id: 13 }] as LearningSection[];
describe("learning navigation", () => {
  it("searches Vietnamese names without requiring accents", () =>
    expect(searchLearningText("Đạo hàm HÀM SỐ")).toBe("dao ham ham so"));
  it("reports empty lessons as not completed and clamps completion", () => {
    expect(lessonCompletion(unit(1, 1, 1))).toBe(50);
    expect(lessonCompletion({ ...unit(1, 1, 1), section_count: 0 })).toBe(0);
    expect(lessonCompletion({ ...unit(1, 1, 1), completed_count: 10 })).toBe(
      100,
    );
  });
  it("resumes a valid saved section or selects the first unfinished section", () => {
    const progress = [
      { section_id: 11, is_completed: true },
    ] as UserLessonProgress[];
    expect(initialLearningSection(sections, progress, 13)).toBe(13);
    expect(initialLearningSection(sections, progress, 999)).toBe(12);
    expect(initialLearningSection([], progress)).toBe(null);
    expect(
      initialLearningSection(
        sections,
        sections.map((s) => ({
          section_id: s.id,
          is_completed: true,
        })) as UserLessonProgress[],
      ),
    ).toBe(11);
  });
  it("keeps next lessons in the same subject and grade across chapters", () => {
    const current = unit(1, 1, 1);
    const catalog = [
      unit(5, 2, 1),
      unit(3, 1, 2, "11"),
      unit(4, 1, 2, "12", "H"),
      unit(2, 1, 2),
      current,
    ];
    expect(adjacentLearningUnit(catalog, current)?.id).toBe(2);
    expect(adjacentLearningUnit(catalog, catalog[3])?.id).toBe(5);
    expect(adjacentLearningUnit(catalog, catalog[0])).toBe(null);
    expect(catalog[0].id).toBe(5);
  });
});
