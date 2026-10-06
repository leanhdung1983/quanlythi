import express from "express";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
let role, pro, ledger, writes, calls;
vi.mock("./core.js", () => ({
  pool: {}, isAdmin: req => req.user.role === 'ADMIN',
  requireTeacherOrAdmin: () => true, canManageQuestion: () => false,
  generateHash: vi.fn(), normalizeLatex: vi.fn(), sanitizeSvg: vi.fn(), resolveHierarchyIds: vi.fn(),
  getGradeDigitSQL: () => '0', clearCache: vi.fn(),
  cacheMiddleware: () => (_req, _res, next) => next(),
  requireAdmin: (req, res) =>
    req.user.role === "ADMIN" ||
    (res.status(403).json({ error: "Forbidden" }), false),
  isSelfOrAdmin: (req, id) =>
    req.user.role === "ADMIN" || Number(id) === req.user.id,
  query: async (sql, params = []) => {
    calls.push({ sql, params });
    if (sql.includes('FROM questions q')) return [{ id: 31, type_code: 'TN', level_code: 'N' }];
    if (sql.includes("FROM users")) return [{ is_pro: pro }];
    if (sql.includes("COALESCE(content.section_count"))
      return [
        { id: 1, first_in_chapter: 1 },
        { id: 2, first_in_chapter: 0 },
      ];
    if (sql.startsWith("SELECT id,chapter_id"))
      return Number(params[0]) === 99
        ? []
        : [
            {
              id: Number(params[0]),
              chapter_id: 5,
              unit_number: Number(params[0]),
            },
          ];
    if (sql.startsWith("SELECT id FROM units")) return [{ id: 1 }];
    if (sql.includes("FROM lesson_authoring_drafts")) return ledger;
    if (sql.startsWith("SELECT unit_id FROM lesson_sections"))
      return Number(params[0]) === 99
        ? []
        : [{ unit_id: Number(params[0]) === 12 ? 2 : 1 }];
    if (sql.startsWith("SELECT * FROM lesson_sections WHERE id="))
      return Number(params[0]) === 99
        ? []
        : [{ id: 11, unit_id: 1, title: "Cũ", content: "Cũ", matrix_id: 6 }];
    if (sql.startsWith("SELECT * FROM lesson_sections"))
      return [{ id: 11, unit_id: 1, title: "Mục tiêu" }];
    if (sql.includes("FROM user_lesson_progress"))
      return [{ section_id: 11, is_completed: 1, score: 0 }];
    if (sql.startsWith("UPDATE") || sql.trim().startsWith("INSERT")) {
      writes.push({ sql, params });
      return { affectedRows: 1 };
    }
    throw new Error("Unexpected SQL: " + sql);
  },
}));
let server, base;
beforeAll(async () => {
  const { default: hub } = await import("./routes/learningHub.routes.js");
    const { default: legacy } = await import("./routes/learning.routes.js");
    const { default: questions } = await import('./routes/questions.routes.js');
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 7, role };
    next();
  });
    app.use(hub);
    app.use(legacy);
    app.use(questions);
  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());
beforeEach(() => {
  role = "STUDENT";
  pro = "0";
  ledger = [];
  writes = [];
  calls = [];
});
const request = (path, body, method = "POST") =>
  fetch(
    base + path,
    body
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
describe("rebuilt learning hub", () => {
  it('gates direct practice access and keeps the public/owner question filter', async () => {
    expect((await request('/units/2/practice')).status).toBe(403);
    expect(calls.some(c => c.sql.includes('FROM questions q'))).toBe(false);
    const allowed = await request('/units/1/practice');
    expect(allowed.status).toBe(200);
    expect((await allowed.json()).data[0].id).toBe(31);
    const bank = calls.find(c => c.sql.includes('FROM questions q'));
    expect(bank.sql).toContain('q.is_public=1 OR q.created_by=?');
    expect(bank.params).toEqual(['1', 7, 'STUDENT']);
  });
  it("marks only the first lesson free even with a string-valued Pro flag", async () => {
    const free = await (await request("/learning/catalog")).json();
    expect(free.data.map((u) => u.accessible)).toEqual([true, false]);
    pro = 1;
    expect(
      (await (await request("/learning/catalog")).json()).data.every(
        (u) => u.accessible,
      ),
    ).toBe(true);
    pro = 0;
    role = "TEACHER";
    expect(
      (await (await request("/learning/catalog")).json()).data.every(
        (u) => u.accessible,
      ),
    ).toBe(true);
  });
  it("blocks direct URLs and legacy bulk content bypasses", async () => {
    expect((await request("/learning/units/2")).status).toBe(403);
    expect((await request("/lesson-sections?unit_id=2")).status).toBe(403);
    expect((await request("/lesson-sections")).status).toBe(400);
    expect((await request("/learning/units/99")).status).toBe(404);
    expect((await request("/learning/units/not-an-id")).status).toBe(400);
    expect(writes).toHaveLength(0);
  });
  it("returns personal progress and teacher-owned editability only", async () => {
    role = "TEACHER";
    ledger = [{ published_section_ids: "[11]" }];
    const body = await (await request("/learning/units/1")).json();
    expect(body.data.sections[0].editable).toBe(true);
    expect(calls.find((c) => c.sql.includes("p.user_id=?")).params).toEqual([
      7, 1,
    ]);
    ledger = [{ published_section_ids: "[12]" }];
    expect(
      (await (await request("/learning/units/1")).json()).data.sections[0]
        .editable,
    ).toBe(false);
    role = "STUDENT";
    expect(
      (await (await request("/learning/units/1")).json()).data.sections[0]
        .editable,
    ).toBe(false);
  });
  it("saves progress for the authenticated user, not the posted user", async () => {
    expect(
      (
        await request("/user/lesson-progress", {
          user_id: 999,
          section_id: 11,
          is_completed: true,
          score: 4,
        })
      ).status,
    ).toBe(200);
    expect(writes[0].params).toEqual([7, 11, true, 4]);
  });
  it("rejects invalid, missing or locked progress without writing", async () => {
    for (const body of [
      { section_id: -1, is_completed: true },
      { section_id: 11, is_completed: true, score: 11 },
      { section_id: 11, is_completed: "yes" },
    ]) {
      expect((await request("/user/lesson-progress", body)).status).toBe(400);
    }
    expect(
      (
        await request("/user/lesson-progress", {
          section_id: 99,
          is_completed: true,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request("/user/lesson-progress", {
          section_id: 12,
          is_completed: true,
        })
      ).status,
    ).toBe(403);
    expect(writes).toHaveLength(0);
  });
  it("preserves media, matrices and student progress when editing published text", async () => {
    role = "TEACHER";
    ledger = [{ published_section_ids: [11] }];
    expect(
      (
        await request(
          "/learning/sections/11",
          { title: " Mới ", content: "Nội dung mới", matrix_id: 99 },
          "PUT",
        )
      ).status,
    ).toBe(200);
    expect(writes).toEqual([
      {
        sql: "UPDATE lesson_sections SET title=?,content=? WHERE id=?",
        params: ["Mới", "Nội dung mới", 11],
      },
    ]);
  });
  it("denies student and non-owner edits and rejects blank titles", async () => {
    const edit = () =>
      request(
        "/learning/sections/11",
        { title: "Mới", content: "Nội dung" },
        "PUT",
      );
    expect((await edit()).status).toBe(403);
    role = "TEACHER";
    expect((await edit()).status).toBe(403);
    role = "ADMIN";
    expect(
      (
        await request(
          "/learning/sections/11",
          { title: " ", content: "" },
          "PUT",
        )
      ).status,
    ).toBe(400);
    expect(writes).toHaveLength(0);
  });
});
