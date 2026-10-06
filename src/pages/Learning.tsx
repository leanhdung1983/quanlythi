import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAuthStore } from "../services/authStore";
import { Chapter, SavedMatrix, UserLessonProgress } from "../types";
import {
  LearningSection,
  LearningUnit,
  adjacentLearningUnit,
  initialLearningSection,
  lessonCompletion,
  searchLearningText,
} from "../utils/learningHub";
import { LessonContent } from "../components/LessonContent";
import { LessonPractice } from "../components/LessonPractice";
import { LessonQuickComposer } from "../components/LessonQuickComposer";
import { LessonMatrixProposal } from "../components/LessonMatrixProposal";
import { LearningSectionEditor } from "../components/LearningSectionEditor";
import { youtubeEmbed } from "../../shared/lessonAuthoring";
import { normalizeGrade } from "../../shared/matrixCatalog";

type Resume = { unitId: number; sectionId: number | null; updatedAt: number };
type Panel = "STUDY" | "PRACTICE";
const readResume = (key: string): Resume | null => {
  try {
    const r = JSON.parse(localStorage.getItem(key) || "null");
    return Number.isSafeInteger(r?.unitId) && r.unitId > 0 ? r : null;
  } catch {
    return null;
  }
};
const chip =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-300";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40 transition-colors";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40";

export const Learning: React.FC = () => {
  const { user } = useAuthStore();
  const teacher = user?.role === "ADMIN" || user?.role === "TEACHER";
  const admin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const unitId = Number(params.get("unit_id") || params.get("unit")) || null;
  const [catalog, setCatalog] = useState<LearningUnit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [matrices, setMatrices] = useState<SavedMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [grade, setGrade] = useState("ALL");
  const [subject, setSubject] = useState("ALL");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [workspace, setWorkspace] = useState<"LIBRARY" | "STUDIO">("LIBRARY");
  const [sections, setSections] = useState<LearningSection[]>([]);
  const [progress, setProgress] = useState<UserLessonProgress[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>("STUDY");
  const [unitBusy, setUnitBusy] = useState(false);
  const [unitError, setUnitError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [authoring, setAuthoring] = useState(false);
  const [proposalUnit, setProposalUnit] = useState<number | null>(null);
  const [editing, setEditing] = useState<LearningSection | null>(null);
  const [manage, setManage] = useState<"CHAPTER" | "UNIT" | null>(null);
  const [manageName, setManageName] = useState("");
  const [manageChapter, setManageChapter] = useState("");
  const [manageGrade, setManageGrade] = useState("12");
  const [manageSubject, setManageSubject] = useState("D");
  const [manageBusy, setManageBusy] = useState(false);
  const [manageError, setManageError] = useState("");
  const resumeKey = "learning-hub:v2:" + (user?.id || "guest");
  const [resume, setResume] = useState<Resume | null>(() =>
    readResume(resumeKey),
  );
  const requestToken = useRef(0);
  const catalogToken = useRef(0);
  const progressSaving = useRef(false);
  const [loadedUnitId, setLoadedUnitId] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const article = useRef<HTMLElement>(null);
  const current = catalog.find((u) => Number(u.id) === unitId);
  const active = sections.find((s) => s.id === activeId);
  const completeIds = useMemo(
    () =>
      new Set(
        progress.filter((p) => p.is_completed).map((p) => Number(p.section_id)),
      ),
    [progress],
  );

  const loadCatalog = useCallback(async () => {
    const token = ++catalogToken.current;
    setLoading(true);
    setCatalogError("");
    try {
      const [data, hierarchy] = await Promise.all([
        apiService.learningHub("/catalog"),
        admin ? apiService.fetchChapters() : Promise.resolve([]),
      ]);
      if (token !== catalogToken.current) return;
      setCatalog(data.data);
      setChapters(
        hierarchy.map((c) => ({
          ...c,
          id_class: normalizeGrade(c.id_class ?? c.grade_code) ?? undefined,
        })),
      );
    } catch (e) {
      if (token === catalogToken.current)
        setCatalogError(
          e instanceof Error ? e.message : "Không tải được thư viện bài học.",
        );
    } finally {
      if (token === catalogToken.current) setLoading(false);
    }
  }, [admin]);
  useEffect(() => {
    const requests = catalogToken;
    void loadCatalog();
    return () => {
      requests.current++;
    };
  }, [loadCatalog, resumeKey]);
  useEffect(() => {
    let alive = true;
    setMatrices([]);
    if (teacher)
      apiService
        .fetchSavedMatrices()
        .then((data) => {
          if (alive) setMatrices(data);
        })
        .catch(() => {
          if (alive)
            setNotice(
              "Chưa tải được ma trận. Có thể soạn nội dung trước và gắn luyện tập sau.",
            );
        });
    return () => {
      alive = false;
    };
  }, [teacher, resumeKey]);
  useEffect(() => {
    setResume(readResume(resumeKey));
  }, [resumeKey]);

  const loadUnit = useCallback(
    async (id: number, requested?: number | null) => {
      const token = ++requestToken.current;
      setUnitBusy(true);
      setLoadedUnitId(null);
      setUnitError("");
      setSections([]);
      setProgress([]);
      setActiveId(null);
      try {
        const result = await apiService.learningHub("/units/" + id);
        if (token !== requestToken.current) return;
        setSections(result.data.sections);
        setProgress(result.data.progress);
        setLoadedUnitId(id);
        setActiveId(
          initialLearningSection(
            result.data.sections,
            result.data.progress,
            requested,
          ),
        );
      } catch (e) {
        if (token === requestToken.current)
          setUnitError(
            e instanceof Error ? e.message : "Không tải được bài học.",
          );
      } finally {
        if (token === requestToken.current) setUnitBusy(false);
      }
    },
    [],
  );
  useEffect(() => {
    const requests = requestToken;
    setPanel("STUDY");
    setAuthoring(teacher && workspace === "STUDIO");
    setEditing(null);
    setNotice("");
    if (unitId) {
      const last = readResume(resumeKey);
      void loadUnit(unitId, last?.unitId === unitId ? last.sectionId : null);
    } else {
      requestToken.current++;
      setSections([]);
      setProgress([]);
      setActiveId(null);
      setUnitError("");
      setUnitBusy(false);
    }
    return () => {
      requests.current++;
    };
  }, [unitId, loadUnit, resumeKey, teacher, workspace]);
  useEffect(() => {
    if (!unitId || loadedUnitId !== unitId || unitBusy || unitError) return;
    const value = { unitId, sectionId: activeId, updatedAt: Date.now() };
    try {
      localStorage.setItem(resumeKey, JSON.stringify(value));
      setResume(value);
    } catch {
      /* progress remains on server; resume is optional */
    }
  }, [unitId, loadedUnitId, activeId, unitBusy, unitError, resumeKey]);
  useEffect(() => {
    if (activeId && !unitBusy)
      article.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [activeId, unitBusy]);

  const open = (unit: LearningUnit, compose = false) => {
    if (!unit.accessible) {
      setNotice(
        "Bài học này cần tài khoản Pro. Bạn có thể học bài đầu tiên của mỗi chương.",
      );
      return;
    }
    if (unitId === unit.id) {
      setAuthoring(compose);
      return;
    }
    setParams({ unit_id: String(unit.id) });
  };
  const back = () => {
    setParams({});
    setAuthoring(false);
  };
  const refreshUnit = async () => {
    if (unitId) await loadUnit(unitId, activeId);
    await loadCatalog();
  };
  const markComplete = useCallback(
    async (sectionId: number, next = false, suppliedScore?: number) => {
      if (
        !unitId ||
        !sections.some((s) => s.id === sectionId) ||
        progressSaving.current
      )
        return;
      progressSaving.current = true;
      const token = requestToken.current;
      const score =
        suppliedScore ??
        Number(
          progress.find((p) => Number(p.section_id) === sectionId)?.score ?? 0,
        );
      setSavingProgress(true);
      setNotice("");
      try {
        await apiService.updateUserLessonProgress({
          section_id: sectionId,
          is_completed: true,
          score,
        });
        if (token !== requestToken.current) return;
        setProgress((old) => [
          ...old.filter((p) => Number(p.section_id) !== sectionId),
          {
            section_id: sectionId,
            is_completed: true,
            score,
          } as UserLessonProgress,
        ]);
        setCatalog((old) =>
          old.map((u) =>
            u.id !== unitId
              ? u
              : {
                  ...u,
                  completed_count: Math.min(
                    Number(u.section_count),
                    Number(u.completed_count) +
                      (completeIds.has(sectionId) ? 0 : 1),
                  ),
                },
          ),
        );
        if (next) {
          const index = sections.findIndex((s) => s.id === sectionId);
          if (sections[index + 1]) setActiveId(sections[index + 1].id);
          else setPanel("PRACTICE");
        }
        setNotice("Đã lưu tiến độ học của bạn.");
      } catch (e) {
        if (token === requestToken.current)
          setNotice(
            e instanceof Error
              ? e.message
              : "Chưa lưu được tiến độ. Hãy thử lại.",
          );
      } finally {
        progressSaving.current = false;
        setSavingProgress(false);
      }
    },
    [unitId, sections, completeIds, progress],
  );
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.data?.type === "LESSON_COMPLETE" &&
        frame.current &&
        event.source === frame.current.contentWindow &&
        activeId &&
        panel === "STUDY"
      ) {
        const score = Number(event.data.score);
        void markComplete(
          activeId,
          false,
          Number.isFinite(score) ? Math.max(0, Math.min(10, score)) : 0,
        );
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [activeId, panel, markComplete]);

  const grades = [...new Set(catalog.map((u) => String(u.grade_code)))].sort(
    (a, b) => Number(a) - Number(b),
  );
  const subjects = [
    ...new Map(
      catalog
        .filter((u) => grade === "ALL" || String(u.grade_code) === grade)
        .map((u) => [u.subject_code, u.subject_name]),
    ).entries(),
  ];
  const visible = catalog.filter((u) => {
    if (grade !== "ALL" && String(u.grade_code) !== grade) return false;
    if (subject !== "ALL" && u.subject_code !== subject) return false;
    if (
      search &&
      !searchLearningText(
        u.name + " " + u.chapter_name + " " + u.subject_name,
      ).includes(searchLearningText(search))
    )
      return false;
    if (filter === "IN_PROGRESS")
      return Number(u.completed_count) > 0 && lessonCompletion(u) < 100;
    if (filter === "COMPLETE") return lessonCompletion(u) === 100;
    if (filter === "DRAFT") return Number(u.draft_count) > 0;
    if (filter === "EMPTY") return Number(u.section_count) === 0;
    return true;
  });
  const grouped = [
    ...new Map(
      visible.map((u) => [
        u.chapter_id,
        {
          name: u.chapter_name,
          num: u.chapter_number,
          grade: u.grade_code,
          subject: u.subject_name,
        },
      ]),
    ).entries(),
  ];
  const resumeUnit =
    resume && catalog.find((u) => u.id === resume.unitId && u.accessible);
  const finished = catalog.filter((u) => lessonCompletion(u) === 100).length;
  const currentIndex = sections.findIndex((s) => s.id === activeId);
  const percent = sections.length
    ? Math.round(
        (sections.filter((s) => completeIds.has(s.id)).length /
          sections.length) *
          100,
      )
    : 0;
  const nextUnit = current && adjacentLearningUnit(catalog, current);
  let video = "";
  try {
    video = youtubeEmbed(active?.video_url || "");
  } catch {
    /* render a safe external link below for legacy videos */
  }

  const createHierarchy = async () => {
    setManageBusy(true);
    setManageError("");
    try {
      if (!manageName.trim()) throw new Error("Nhập tên chương hoặc bài học.");
      if (manage === "UNIT") {
        const ch = Number(manageChapter);
        if (!ch) throw new Error("Chọn chương cho bài học.");
        const max = Math.max(
          0,
          ...catalog
            .filter((u) => u.chapter_id === ch)
            .map((u) => Number(u.unit_number)),
        );
        await apiService.createUnit({
          chapter_id: ch,
          unit_number: max + 1,
          name: manageName.trim(),
        });
      } else {
        const list = chapters.filter(
          (c) =>
            String(normalizeGrade(c.id_class ?? c.grade_code)) ===
              manageGrade &&
            String(c.id_subject ?? c.subject_code) === manageSubject,
        );
        await apiService.createChapter({
          gradeCode: manageGrade,
          subjectCode: manageSubject,
          chapter_number:
            Math.max(
              0,
              ...list.map((c) => Number(c.chapter_number ?? c.id_chapter) || 0),
            ) + 1,
          name: manageName.trim(),
        });
      }
      await loadCatalog();
      setManage(null);
      setManageName("");
      setNotice("Đã thêm vào thư viện. Chọn bài để bắt đầu soạn nội dung.");
    } catch (e) {
      setManageError(
        e instanceof Error ? e.message : "Không tạo được cấu trúc bài học.",
      );
    } finally {
      setManageBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f4f7f5] text-slate-800">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 space-y-5">
        <header className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-800 text-white flex items-center justify-center">
              <GraduationCap size={23} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Không gian học tập
              </h1>
              <p className="text-xs text-slate-500">
                Học rõ ràng. Luyện đúng bài. Tiến bộ từng bước.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {teacher && (
              <div className="bg-white rounded-xl border p-1 flex">
                {(["LIBRARY", "STUDIO"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setWorkspace(tab);
                      if (unitId) back();
                      setFilter("ALL");
                    }}
                    className={
                      "px-4 py-2 rounded-lg text-xs font-bold " +
                      (workspace === tab
                        ? "bg-emerald-800 text-white"
                        : "text-slate-500")
                    }
                  >
                    {tab === "LIBRARY"
                      ? "Thư viện bài học"
                      : "Studio giáo viên"}
                  </button>
                ))}
              </div>
            )}
            <button className={secondary} onClick={() => navigate("/eduloop")}>
              <Target size={15} />
              EduLoop · Ôn tập cá nhân
            </button>
          </div>
        </header>
        {notice && (
          <div
            role="status"
            className="bg-white border border-emerald-200 text-emerald-800 p-3 rounded-xl text-sm flex justify-between gap-3"
          >
            {notice}
            <button aria-label="Ẩn thông báo" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {!unitId ? (
          <>
            <section className="relative overflow-hidden rounded-3xl bg-emerald-950 text-white p-6 md:p-8">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full border-[45px] border-white/5 translate-x-12 -translate-y-12 pointer-events-none" />
              <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-6 items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-bold">
                    {workspace === "STUDIO"
                      ? "Dành cho giáo viên"
                      : "Hành trình học của bạn"}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight mt-3">
                    {workspace === "STUDIO"
                      ? "Từ ý tưởng đến bài học hoàn chỉnh."
                      : "Mỗi bài học, một bước tiến mới."}
                  </h2>
                  <p className="text-sm text-emerald-100/70 mt-3 max-w-xl leading-6">
                    {workspace === "STUDIO"
                      ? "Soạn trong Studio, nhờ AI hỗ trợ từng mục, duyệt nội dung rồi xuất bản. Bài học và luyện tập nằm trong cùng một không gian."
                      : "Chọn bài, đọc kiến thức, xem ví dụ và luyện tập ngay. Vị trí đang học được ghi nhớ để bạn tiếp tục dễ dàng."}
                  </p>
                  {resumeUnit && (
                    <button
                      className="mt-5 inline-flex gap-2 items-center rounded-xl bg-lime-300 text-emerald-950 px-4 py-3 text-sm font-bold hover:bg-lime-200"
                      onClick={() => open(resumeUnit)}
                    >
                      <Play size={16} />
                      Tiếp tục: {resumeUnit.name}
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { n: catalog.length, label: "Bài học" },
                    {
                      n:
                        workspace === "STUDIO"
                          ? catalog.filter((u) => Number(u.draft_count) > 0)
                              .length
                          : finished,
                      label:
                        workspace === "STUDIO"
                          ? "Bài có bản nháp"
                          : "Đã hoàn thành",
                    },
                    {
                      n: catalog.reduce(
                        (n, u) => n + Number(u.section_count),
                        0,
                      ),
                      label: "Mục kiến thức",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl bg-white/5 border border-white/10 p-4"
                    >
                      <p className="text-2xl font-bold">{stat.n}</p>
                      <p className="text-[11px] text-emerald-100/70 mt-2">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-wrap gap-3 items-center">
              <label className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-50 rounded-xl border px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  aria-label="Tìm bài học"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm bài học, chương, môn…"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
              </label>
              <select
                aria-label="Lọc khối lớp"
                className={chip}
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setSubject("ALL");
                }}
              >
                <option value="ALL">Tất cả khối</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
              <select
                aria-label="Lọc môn học"
                className={chip}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="ALL">Tất cả môn</option>
                {subjects.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Lọc trạng thái bài"
                className={chip}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {teacher ? (
                  <>
                    <option value="DRAFT">Có bản nháp của tôi</option>
                    <option value="EMPTY">Chưa có nội dung</option>
                  </>
                ) : (
                  <>
                    <option value="IN_PROGRESS">Đang học</option>
                    <option value="COMPLETE">Đã hoàn thành</option>
                  </>
                )}
              </select>
              <button
                aria-label="Tải lại thư viện"
                className={secondary}
                onClick={() => void loadCatalog()}
              >
                <RefreshCw size={15} />
              </button>
              {admin && (
                <>
                  <button
                    className={secondary}
                    onClick={() => {
                      setManage("CHAPTER");
                      setManageError("");
                    }}
                  >
                    <Plus size={14} />
                    Chương
                  </button>
                  <button
                    className={primary}
                    onClick={() => {
                      setManage("UNIT");
                      setManageError("");
                    }}
                  >
                    <Plus size={14} />
                    Bài học
                  </button>
                </>
              )}
            </section>
            {loading ? (
              <div
                role="status"
                className="py-20 flex items-center justify-center gap-2 text-slate-500"
              >
                <Loader2 className="animate-spin" />
                Đang tải thư viện…
              </div>
            ) : catalogError ? (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-700"
              >
                {catalogError}
                <button
                  className={secondary + " mt-4 block"}
                  onClick={() => void loadCatalog()}
                >
                  Thử lại
                </button>
              </div>
            ) : !visible.length ? (
              <div className="text-center bg-white rounded-3xl border py-16">
                <BookOpen className="mx-auto text-slate-300" size={36} />
                <h3 className="font-bold mt-4">Chưa có bài học phù hợp</h3>
                <p className="text-sm text-slate-500 mt-2">
                  {catalog.length
                    ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm."
                    : admin
                      ? "Thêm chương, thêm bài rồi mở Studio để soạn nội dung."
                      : "Giáo viên sẽ bổ sung bài học tại đây."}
                </p>
              </div>
            ) : (
              grouped.map(([id, group]) => (
                <section key={id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Lớp {group.grade} · {group.subject}
                      </p>
                      <h3 className="font-bold text-lg mt-1">
                        Chương {group.num}. {group.name}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {visible.filter((u) => u.chapter_id === id).length} bài
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visible
                      .filter((u) => u.chapter_id === id)
                      .map((u) => {
                        const completion = lessonCompletion(u);
                        return (
                          <article
                            key={u.id}
                            className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-lg hover:shadow-emerald-950/5 hover:border-emerald-200 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 px-2 py-1">
                                BÀI {u.unit_number}
                              </span>
                              {!u.accessible ? (
                                <span className="text-xs text-amber-700 flex gap-1 items-center">
                                  <Lock size={12} />
                                  Pro
                                </span>
                              ) : completion === 100 && !teacher ? (
                                <span className="text-xs text-emerald-600 flex gap-1 items-center">
                                  <CheckCircle2 size={13} />
                                  Đã học
                                </span>
                              ) : teacher && Number(u.draft_count) > 0 ? (
                                <span className="text-xs text-amber-700">
                                  {u.draft_count} bản nháp
                                </span>
                              ) : null}
                            </div>
                            <h4 className="font-bold text-lg leading-snug min-h-[48px]">
                              {u.name}
                            </h4>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                              <span className="flex gap-1 items-center">
                                <Layers size={13} />
                                {u.section_count} mục học
                              </span>
                              <span className="flex gap-1 items-center">
                                <Target size={13} />
                                {u.question_count} câu luyện
                              </span>
                              {Number(u.video_count) > 0 && (
                                <span className="flex gap-1 items-center">
                                  <Play size={13} />
                                  {u.video_count} video
                                </span>
                              )}
                            </div>
                            {!teacher && (
                              <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                  <span>Tiến độ kiến thức</span>
                                  <span>{completion}%</span>
                                </div>
                                <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: completion + "%" }}
                                  />
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => open(u)}
                              className={
                                (u.accessible ? primary : secondary) +
                                " w-full mt-auto"
                              }
                            >
                              {!u.accessible ? (
                                <>
                                  <Lock size={15} />
                                  Xem điều kiện truy cập
                                </>
                              ) : teacher && workspace === "STUDIO" ? (
                                <>
                                  <Pencil size={15} />
                                  Mở Studio
                                </>
                              ) : (
                                <>
                                  <Play size={15} />
                                  {completion > 0 && completion < 100
                                    ? "Tiếp tục học"
                                    : "Mở bài học"}
                                  <ArrowRight size={15} />
                                </>
                              )}
                            </button>
                          </article>
                        );
                      })}
                  </div>
                </section>
              ))
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <button className={secondary} onClick={back}>
                <ArrowLeft size={15} />
                Thư viện bài học
              </button>
              {current && (
                <div className="flex gap-2 items-center text-xs text-slate-500">
                  <span>Lớp {current.grade_code}</span>
                  <ChevronRight size={12} />
                  <span>{current.subject_name}</span>
                  <ChevronRight size={12} />
                  <span className="truncate max-w-[240px]">
                    {current.chapter_name}
                  </span>
                </div>
              )}
            </div>
            {unitBusy ? (
              <div
                role="status"
                className="py-24 flex justify-center items-center gap-2 text-slate-500"
              >
                <Loader2 className="animate-spin" />
                Đang mở bài học…
              </div>
            ) : unitError ? (
              <div
                role="alert"
                className="bg-white rounded-3xl border p-8 text-center"
              >
                <Lock className="mx-auto text-amber-600" size={30} />
                <h2 className="font-bold text-lg mt-4">Chưa mở được bài học</h2>
                <p className="text-sm text-slate-500 mt-3">{unitError}</p>
                <button
                  className={secondary + " mt-5"}
                  onClick={() => unitId && void loadUnit(unitId)}
                >
                  Thử lại
                </button>
              </div>
            ) : !current ? (
              <div className="bg-white border rounded-2xl p-8 text-center text-slate-500">
                {loading
                  ? "Đang tìm thông tin bài học…"
                  : "Bài học không còn trong thư viện."}
              </div>
            ) : authoring && teacher && user ? (
              <div className="h-[calc(100vh-220px)] min-h-[620px]">
                <LessonQuickComposer
                  embedded
                  unit={current}
                  userId={user.id}
                  matrices={matrices}
                  onClose={() => setAuthoring(false)}
                  onPublished={refreshUnit}
                />
              </div>
            ) : (
              <>
                <section className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 flex flex-wrap gap-5 justify-between items-center">
                  <div>
                    <p className="text-xs text-emerald-600 font-bold">
                      Bài {current.unit_number} · {current.subject_name}
                    </p>
                    <h2 className="text-2xl font-extrabold mt-2">
                      {current.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-3">
                      {sections.length} mục học · {current.question_count} câu
                      trong ngân hàng · {percent}% kiến thức đã học
                    </p>
                  </div>
                  {teacher ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={primary}
                        onClick={() => setAuthoring(true)}
                      >
                        <Sparkles size={16} />
                        {Number(current.draft_count) > 0
                          ? "Tiếp tục soạn bài"
                          : "Soạn bài trong Studio"}
                      </button>
                      <button
                        className={secondary}
                        onClick={() => setProposalUnit(current.id)}
                      >
                        <Target size={15} />
                        AI ma trận luyện tập
                      </button>
                    </div>
                  ) : (
                    <button
                      className={primary}
                      onClick={() => setPanel("PRACTICE")}
                    >
                      <Target size={16} />
                      Luyện tập ngay
                    </button>
                  )}
                </section>
                <div className="grid lg:grid-cols-[290px_minmax(0,1fr)] gap-5 items-start">
                  <aside className="bg-white border rounded-2xl overflow-hidden lg:sticky lg:top-0">
                    <div className="p-4 border-b">
                      <h3 className="font-bold text-sm">Lộ trình bài học</h3>
                      <div className="bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full"
                          style={{ width: percent + "%" }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {sections.filter((s) => completeIds.has(s.id)).length}/
                        {sections.length} mục đã học
                      </p>
                    </div>
                    <nav
                      aria-label="Các mục trong bài học"
                      className="max-h-[45vh] lg:max-h-[60vh] overflow-auto p-2 space-y-1"
                    >
                      {sections.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveId(s.id);
                            setPanel("STUDY");
                          }}
                          className={
                            "w-full flex items-start gap-2 text-left p-3 rounded-xl text-xs " +
                            (s.id === activeId && panel === "STUDY"
                              ? "bg-emerald-50 text-emerald-900"
                              : "text-slate-500 hover:bg-slate-50")
                          }
                        >
                          <span
                            className={
                              "w-6 h-6 shrink-0 flex items-center justify-center rounded-lg " +
                              (completeIds.has(s.id)
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-500")
                            }
                          >
                            {completeIds.has(s.id) ? (
                              <Check size={12} />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span className="leading-5 font-semibold">
                            {s.title}
                            <span className="block font-normal text-[10px] opacity-60">
                              {s.video_url
                                ? "Video bài giảng"
                                : s.matrix_id
                                  ? "Luyện theo ma trận"
                                  : s.interactive_html
                                    ? "Hoạt động tương tác"
                                    : "Kiến thức & ví dụ"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </nav>
                    <div className="p-3 border-t">
                      <button
                        className={
                          (panel === "PRACTICE"
                            ? "bg-emerald-800 text-white"
                            : "bg-slate-50 text-slate-600") +
                          " p-3 rounded-xl w-full flex items-center justify-between text-xs font-bold"
                        }
                        onClick={() => setPanel("PRACTICE")}
                      >
                        <span className="flex gap-2 items-center">
                          <Target size={15} />
                          Luyện tập sau bài
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </aside>
                  <main
                    ref={article}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden min-w-0"
                  >
                    <div className="flex gap-1 border-b px-4 pt-2">
                      {(["STUDY", "PRACTICE"] as Panel[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPanel(p)}
                          className={
                            "px-4 py-3 text-xs font-bold border-b-2 " +
                            (panel === p
                              ? "border-emerald-600 text-emerald-700"
                              : "border-transparent text-slate-400")
                          }
                        >
                          {p === "STUDY" ? "Bài học" : "Luyện tập"}
                        </button>
                      ))}
                    </div>
                    {panel === "PRACTICE" ? (
                      <div className="p-4 md:p-6 space-y-4">
                        <LessonPractice
                          key={current.id + "-" + (active?.matrix_id || "unit")}
                          unitId={current.id}
                          matrixId={active?.matrix_id}
                        />
                        <div className="bg-emerald-50 rounded-2xl p-5 flex flex-wrap gap-3 items-center justify-between">
                          <div>
                            <h3 className="font-bold text-sm">
                              Muốn ôn theo điểm còn yếu?
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              EduLoop dùng kết quả kiểm tra để đề xuất lộ trình
                              cá nhân.
                            </p>
                          </div>
                          <button
                            className={secondary}
                            onClick={() => navigate("/eduloop")}
                          >
                            <Target size={14} />
                            Mở EduLoop
                          </button>
                        </div>
                        {nextUnit && (
                          <button
                            className={primary}
                            onClick={() => open(nextUnit)}
                          >
                            {nextUnit.accessible
                              ? "Bài tiếp theo: " + nextUnit.name
                              : "Bài tiếp theo cần Pro"}
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    ) : active ? (
                      <>
                        <div className="p-5 md:p-8 space-y-6">
                          <div className="flex gap-4 justify-between items-start">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                Mục {currentIndex + 1}/{sections.length}
                              </p>
                              <h3 className="text-2xl font-bold mt-2">
                                {active.title}
                              </h3>
                            </div>
                            {teacher && active.editable && (
                              <button
                                className={secondary}
                                onClick={() => setEditing(active)}
                              >
                                <Pencil size={14} />
                                Chỉnh sửa
                              </button>
                            )}
                          </div>
                          {active.content && (
                            <LessonContent content={active.content} />
                          )}{" "}
                          {video && (
                            <iframe
                              key={active.id}
                              title={active.title}
                              src={video}
                              className="w-full aspect-video rounded-2xl border"
                              sandbox="allow-scripts allow-same-origin allow-presentation"
                              allowFullScreen
                            />
                          )}
                          {!video &&
                            active.video_url &&
                            /^https:\/\//i.test(active.video_url) && (
                              <a
                                href={active.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-emerald-700 underline"
                              >
                                Mở video bài giảng ở tab mới
                              </a>
                            )}
                          {active.interactive_html && (
                            <div className="border rounded-2xl overflow-hidden">
                              <div className="p-3 bg-slate-50 text-xs font-bold">
                                Hoạt động tương tác của bài học
                              </div>
                              <iframe
                                ref={frame}
                                key={active.id}
                                title={"Hoạt động: " + active.title}
                                srcDoc={active.interactive_html}
                                sandbox="allow-scripts"
                                className="w-full h-[520px] border-0"
                              />
                            </div>
                          )}
                          {active.matrix_id && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex justify-between flex-wrap gap-3 items-center">
                              <p className="text-sm font-semibold">
                                Mục này có bài luyện tập theo ma trận.
                              </p>
                              <button
                                className={primary}
                                onClick={() => setPanel("PRACTICE")}
                              >
                                <Target size={15} />
                                Làm bài luyện tập
                              </button>
                            </div>
                          )}
                          {!active.content &&
                            !active.video_url &&
                            !active.interactive_html &&
                            !active.matrix_id && (
                              <p className="text-sm text-slate-400">
                                Mục này đang chờ giáo viên bổ sung nội dung.
                              </p>
                            )}
                        </div>
                        <footer className="border-t bg-slate-50/60 p-4 flex flex-wrap gap-3 justify-between">
                          <button
                            className={secondary}
                            disabled={currentIndex <= 0}
                            onClick={() =>
                              setActiveId(sections[currentIndex - 1].id)
                            }
                          >
                            <ArrowLeft size={14} />
                            Mục trước
                          </button>
                          {teacher ? (
                            <button
                              className={primary}
                              onClick={() =>
                                sections[currentIndex + 1]
                                  ? setActiveId(sections[currentIndex + 1].id)
                                  : setPanel("PRACTICE")
                              }
                            >
                              {sections[currentIndex + 1]
                                ? "Mục tiếp theo"
                                : "Xem bài luyện tập"}
                              <ArrowRight size={15} />
                            </button>
                          ) : (
                            <button
                              className={primary}
                              disabled={savingProgress}
                              onClick={() => void markComplete(active.id, true)}
                            >
                              {savingProgress ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}{" "}
                              {completeIds.has(active.id)
                                ? "Đã học · Tiếp tục"
                                : "Đánh dấu đã học & tiếp tục"}
                            </button>
                          )}
                        </footer>
                      </>
                    ) : (
                      <div className="text-center py-16 px-6">
                        <FileText
                          className="mx-auto text-slate-300"
                          size={36}
                        />
                        <h3 className="font-bold text-lg mt-4">
                          Bài này chưa có nội dung học
                        </h3>
                        <p className="text-sm text-slate-400 mt-2">
                          {teacher
                            ? "Mở Studio để soạn bài bằng mẫu hoặc AI."
                            : "Bạn có thể luyện các câu hỏi hiện có trong ngân hàng."}
                        </p>
                        <button
                          className={primary + " mt-5"}
                          onClick={() =>
                            teacher ? setAuthoring(true) : setPanel("PRACTICE")
                          }
                        >
                          {teacher ? "Bắt đầu soạn bài" : "Luyện tập ngay"}
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    )}
                  </main>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {proposalUnit && (
        <LessonMatrixProposal
          unitId={proposalUnit}
          onClose={() => setProposalUnit(null)}
          onSaved={() => {
            void apiService
              .fetchSavedMatrices()
              .then(setMatrices)
              .catch(() => setNotice("Chưa tải lại được ma trận mới."));
          }}
        />
      )}
      {editing && (
        <LearningSectionEditor
          key={editing.id}
          section={editing}
          onClose={() => setEditing(null)}
          onSaved={refreshUnit}
        />
      )}
      {manage && admin && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Thêm cấu trúc bài học"
            className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4"
          >
            <div className="flex justify-between">
              <h2 className="font-bold text-lg">
                {manage === "CHAPTER" ? "Thêm chương" : "Thêm bài học"}
              </h2>
              <button
                aria-label="Đóng thêm cấu trúc"
                disabled={manageBusy}
                onClick={() => setManage(null)}
              >
                <X size={20} />
              </button>
            </div>
            {manageError && (
              <p role="alert" className="text-rose-600 text-sm">
                {manageError}
              </p>
            )}
            {manage === "CHAPTER" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs">
                  Khối
                  <select
                    value={manageGrade}
                    onChange={(e) => setManageGrade(e.target.value)}
                    className={chip + " block w-full mt-1"}
                  >
                    {["6", "7", "8", "9", "10", "11", "12"].map((g) => (
                      <option key={g} value={g}>
                        Lớp {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  Môn
                  <select
                    value={manageSubject}
                    onChange={(e) => setManageSubject(e.target.value)}
                    className={chip + " block w-full mt-1"}
                  >
                    {[
                      ...new Map([
                        ...catalog.map(
                          (u) =>
                            [u.subject_code, u.subject_name] as [
                              string,
                              string,
                            ],
                        ),
                        ["D", "Đại số"],
                        ["H", "Hình học"],
                        ["C", "Chuyên đề"],
                      ] as [string, string][]).entries(),
                    ].map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <label className="text-xs block">
                Chương
                <select
                  value={manageChapter}
                  onChange={(e) => setManageChapter(e.target.value)}
                  className={chip + " block w-full mt-1"}
                >
                  <option value="">Chọn chương</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.id_class ?? c.grade_code} ·{" "}
                      {c.id_subject ?? c.subject_code} ·{" "}
                      {c.chapter_name || c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-xs">
              Tên {manage === "CHAPTER" ? "chương" : "bài học"}
              <input
                disabled={manageBusy}
                value={manageName}
                maxLength={200}
                onChange={(e) => setManageName(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1 text-sm"
              />
            </label>
            <button
              className={primary + " w-full"}
              disabled={manageBusy}
              onClick={() => void createHierarchy()}
            >
              {manageBusy ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <Plus size={15} />
              )}
              Thêm vào thư viện
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
