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
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Sword,
  Target,
  TestTube,
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
import { LEARNING_GRADES, normalizeLearningCatalog } from "../../shared/learningGrades";
import {
  GRADE_12_CHAPTERS,
  GRADE_12_LESSONS,
  Grade12Lesson,
} from "../data/grade12Lessons";
import {
  GRADE_10_CHAPTERS,
  GRADE_10_LESSONS,
  Grade10Lesson,
} from "../data/grade10Lessons";

type Resume = { unitId?: number; lessonId?: string; sectionId?: number | null; updatedAt: number };
type Panel = "STUDY" | "PRACTICE";
type LessonSubTab = "all" | "theory" | "labs" | "arena" | "badges";

type InteractiveLesson = Grade10Lesson | Grade12Lesson;

interface GradeProgress {
  completed: boolean;
  score: number;
  updatedAt: number;
}

const readResume = (key: string): Resume | null => {
  try {
    const r = JSON.parse(localStorage.getItem(key) || "null");
    return r && (r.unitId || r.lessonId) ? r : null;
  } catch {
    return null;
  }
};

const chip =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-300";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40 transition-colors shadow-sm";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 shadow-sm";

export const Learning: React.FC = () => {
  const { user } = useAuthStore();
  const teacher = user?.role === "ADMIN" || user?.role === "TEACHER";
  const admin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Route parameters
  const unitId = Number(params.get("unit_id") || params.get("unit")) || null;
  const lessonParam = params.get("lesson") || params.get("lesson12") || params.get("lesson10") || null;
  
  const [grade, setGrade] = useState(() => {
    const g = params.get("grade");
    if (g) return g;
    if (params.get("lesson12")) return "12";
    if (params.get("lesson10")) return "10";
    return "10";
  });
  const [subject, setSubject] = useState("ALL");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [workspace, setWorkspace] = useState<"LIBRARY" | "STUDIO">("LIBRARY");

  // Catalog state
  const [catalog, setCatalog] = useState<LearningUnit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [matrices, setMatrices] = useState<SavedMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  // In-app interactive state
  const [activeSubTab, setActiveSubTab] = useState<LessonSubTab>("all");
  const [interactiveExpanded, setInteractiveExpanded] = useState(false);

  // Storage keys for progress
  const g10StorageKey = "learning_hub:grade10:" + (user?.id || "guest");
  const [g10Progress, setG10Progress] = useState<Record<string, GradeProgress>>(() => {
    try {
      return JSON.parse(localStorage.getItem(g10StorageKey) || "{}");
    } catch {
      return {};
    }
  });

  const g12StorageKey = "learning_hub:grade12:" + (user?.id || "guest");
  const [g12Progress, setG12Progress] = useState<Record<string, GradeProgress>>(() => {
    try {
      return JSON.parse(localStorage.getItem(g12StorageKey) || "{}");
    } catch {
      return {};
    }
  });

  // Active Standard Unit state
  const [sections, setSections] = useState<LearningSection[]>([]);
  const [progress, setProgress] = useState<UserLessonProgress[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>("STUDY");
  const [unitBusy, setUnitBusy] = useState(false);
  const [unitError, setUnitError] = useState("");
  const [notice, setNotice] = useState("");
  const [authoring, setAuthoring] = useState(false);
  const [proposalUnit, setProposalUnit] = useState<number | null>(null);
  const [editing, setEditing] = useState<LearningSection | null>(null);
  const [manage, setManage] = useState<"CHAPTER" | "UNIT" | null>(null);
  const [manageName, setManageName] = useState("");
  const [manageChapter, setManageChapter] = useState("");
  const [manageGrade, setManageGrade] = useState("10");
  const [manageSubject, setManageSubject] = useState("D");
  const [manageBusy, setManageBusy] = useState(false);
  const [manageError, setManageError] = useState("");

  const resumeKey = "learning-hub:v2:" + (user?.id || "guest");
  const [resume, setResume] = useState<Resume | null>(() => readResume(resumeKey));

  const requestToken = useRef(0);
  const catalogToken = useRef(0);
  const [loadedUnitId, setLoadedUnitId] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const article = useRef<HTMLElement>(null);

  const current = catalog.find((u) => Number(u.id) === unitId);

  // Determine current interactive lesson (Grade 10 or 12)
  const currentInteractiveLesson = useMemo(() => {
    if (!lessonParam) return null;
    if (grade === "10") {
      return GRADE_10_LESSONS.find((l) => l.id === lessonParam) || GRADE_12_LESSONS.find((l) => l.id === lessonParam) || null;
    }
    if (grade === "12") {
      return GRADE_12_LESSONS.find((l) => l.id === lessonParam) || GRADE_10_LESSONS.find((l) => l.id === lessonParam) || null;
    }
    return GRADE_10_LESSONS.find((l) => l.id === lessonParam) || GRADE_12_LESSONS.find((l) => l.id === lessonParam) || null;
  }, [lessonParam, grade]);

  const currentLessonGrade = useMemo(() => {
    if (!currentInteractiveLesson) return grade === "12" ? "12" : "10";
    if (GRADE_10_LESSONS.some((l) => l.id === currentInteractiveLesson.id)) return "10";
    return "12";
  }, [currentInteractiveLesson, grade]);

  const activeProgress = currentLessonGrade === "10" ? g10Progress : g12Progress;

  const active = sections.find((s) => s.id === activeId);
  const completeIds = useMemo(
    () => new Set(progress.filter((p) => p.is_completed).map((p) => Number(p.section_id))),
    [progress]
  );

  // Load catalog
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
      setCatalog(normalizeLearningCatalog(data.data));
      setChapters(
        hierarchy.map((c) => ({
          ...c,
          id_class: normalizeGrade(c.id_class ?? c.grade_code) ?? undefined,
        }))
      );
    } catch (e) {
      if (token === catalogToken.current)
        setCatalogError(e instanceof Error ? e.message : "Không tải được thư viện bài học.");
    } finally {
      if (token === catalogToken.current) setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog, resumeKey]);

  useEffect(() => {
    let alive = true;
    setMatrices([]);
    if (teacher) {
      apiService
        .fetchSavedMatrices()
        .then((data) => {
          if (alive) setMatrices(data);
        })
        .catch(() => {
          if (alive) setNotice("Chưa tải được ma trận. Có thể soạn nội dung trước và gắn luyện tập sau.");
        });
    }
    return () => {
      alive = false;
    };
  }, [teacher, resumeKey]);

  // Load Unit if unitId is present
  const loadUnit = useCallback(async (id: number, requested?: number | null) => {
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
      setActiveId(initialLearningSection(result.data.sections, result.data.progress, requested));
    } catch (e) {
      if (token === requestToken.current)
        setUnitError(e instanceof Error ? e.message : "Không tải được bài học.");
    } finally {
      if (token === requestToken.current) setUnitBusy(false);
    }
  }, []);

  useEffect(() => {
    setPanel("STUDY");
    setAuthoring(teacher && workspace === "STUDIO");
    setEditing(null);
    setNotice("");
    if (unitId) {
      const last = readResume(resumeKey);
      void loadUnit(unitId, last?.unitId === unitId ? last.sectionId : null);
    } else {
      setSections([]);
      setProgress([]);
      setActiveId(null);
      setUnitError("");
      setUnitBusy(false);
    }
  }, [unitId, loadUnit, resumeKey, teacher, workspace]);

  // Handle in-app completion & message events
  useEffect(() => {
    const handlePlatformMessage = (event: MessageEvent) => {
      if (event.data?.type === "LESSON_COMPLETE") {
        const score = Number(event.data.score);
        const resolvedScore = Number.isFinite(score) ? Math.max(0, Math.min(10, score)) : 10;
        
        // If learning interactive lesson (Grade 10 or 12)
        if (currentInteractiveLesson) {
          const isG10 = currentLessonGrade === "10";
          const storageKey = isG10 ? g10StorageKey : g12StorageKey;
          const setProgressFn = isG10 ? setG10Progress : setG12Progress;

          setProgressFn((prev) => {
            const next = {
              ...prev,
              [currentInteractiveLesson.id]: {
                completed: true,
                score: Math.max(resolvedScore, prev[currentInteractiveLesson.id]?.score || 0),
                updatedAt: Date.now(),
              },
            };
            try {
              localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
              /* ignore */
            }
            return next;
          });
          setNotice(`🎉 Chúc mừng bạn đã hoàn thành Đấu trường với ${resolvedScore * 10}% điểm số! Tiến độ đã được lưu vào hệ thống.`);
        }

        // Also mark DB section complete if activeId is set
        if (activeId && panel === "STUDY") {
          void markComplete(activeId, false, resolvedScore);
        }
      }
    };

    window.addEventListener("message", handlePlatformMessage);
    return () => window.removeEventListener("message", handlePlatformMessage);
  }, [currentInteractiveLesson, currentLessonGrade, activeId, panel, g10StorageKey, g12StorageKey]);

  // Navigation handlers
  const openInteractiveLesson = (lesson: InteractiveLesson, targetGrade: string) => {
    setParams({ grade: targetGrade, lesson: lesson.id });
    setActiveSubTab("all");
    setInteractiveExpanded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openUnit = (u: LearningUnit, compose = false) => {
    if (!u.accessible) {
      setNotice("Bài học này cần tài khoản Pro. Bạn có thể học bài đầu tiên của mỗi chương.");
      return;
    }
    if (unitId === u.id) {
      setAuthoring(compose);
      return;
    }
    setParams({ unit_id: String(u.id), grade });
  };

  const backToLibrary = () => {
    setParams({ grade });
    setAuthoring(false);
    setInteractiveExpanded(false);
  };

  const refreshUnit = async () => {
    if (unitId) await loadUnit(unitId, activeId);
    await loadCatalog();
  };

  const markComplete = useCallback(
    async (sectionId: number, next = false, suppliedScore?: number) => {
      if (!unitId || !sections.some((s) => s.id === sectionId)) return;
      const score =
        suppliedScore ??
        Number(progress.find((p) => Number(p.section_id) === sectionId)?.score ?? 0);
      try {
        await apiService.updateUserLessonProgress({
          section_id: sectionId,
          is_completed: true,
          score,
        });
        setProgress((old) => [
          ...old.filter((p) => Number(p.section_id) !== sectionId),
          { section_id: sectionId, is_completed: true, score } as UserLessonProgress,
        ]);
        if (next) {
          const index = sections.findIndex((s) => s.id === sectionId);
          if (sections[index + 1]) setActiveId(sections[index + 1].id);
          else setPanel("PRACTICE");
        }
      } catch (e) {
        console.warn("Could not save progress to server:", e);
      }
    },
    [unitId, sections, progress]
  );

  // Switch subtab inside in-app lesson
  const handleSwitchSubTab = (tab: LessonSubTab) => {
    setActiveSubTab(tab);
    if (frame.current?.contentWindow) {
      const tabTarget = tab === "all" ? "theory" : tab;
      frame.current.contentWindow.postMessage({ type: "SWITCH_TAB", tab: tabTarget }, "*");
    }
  };

  // Adjacent interactive lesson navigation
  const currentGradeLessons = currentLessonGrade === "10" ? GRADE_10_LESSONS : GRADE_12_LESSONS;
  const currentInteractiveIndex = currentInteractiveLesson
    ? currentGradeLessons.findIndex((l) => l.id === currentInteractiveLesson.id)
    : -1;
  const prevInteractiveLesson =
    currentInteractiveIndex > 0 ? currentGradeLessons[currentInteractiveIndex - 1] : null;
  const nextInteractiveLesson =
    currentInteractiveIndex >= 0 && currentInteractiveIndex < currentGradeLessons.length - 1
      ? currentGradeLessons[currentInteractiveIndex + 1]
      : null;

  // Grade 10 Catalog calculations
  const g10CompletedCount = useMemo(() => {
    return GRADE_10_LESSONS.filter((l) => g10Progress[l.id]?.completed).length;
  }, [g10Progress]);

  const g10FilteredLessons = useMemo(() => {
    return GRADE_10_LESSONS.filter((l) => {
      if (search) {
        const query = searchLearningText(search);
        const text = searchLearningText(l.title + " " + l.chapterName + " " + l.tag + " " + l.desc);
        if (!text.includes(query)) return false;
      }
      if (filter === "COMPLETE") return !!g10Progress[l.id]?.completed;
      if (filter === "IN_PROGRESS") return !g10Progress[l.id]?.completed;
      return true;
    });
  }, [search, filter, g10Progress]);

  // Grade 12 Catalog calculations
  const g12CompletedCount = useMemo(() => {
    return GRADE_12_LESSONS.filter((l) => g12Progress[l.id]?.completed).length;
  }, [g12Progress]);

  const g12FilteredLessons = useMemo(() => {
    return GRADE_12_LESSONS.filter((l) => {
      if (search) {
        const query = searchLearningText(search);
        const text = searchLearningText(l.title + " " + l.chapterName + " " + l.tag + " " + l.desc);
        if (!text.includes(query)) return false;
      }
      if (filter === "COMPLETE") return !!g12Progress[l.id]?.completed;
      if (filter === "IN_PROGRESS") return !g12Progress[l.id]?.completed;
      return true;
    });
  }, [search, filter, g12Progress]);

  // Standard Catalog filtering (for other grades or all)
  const grades = LEARNING_GRADES.map(String);
  const subjects = [
    ...new Map(
      catalog
        .filter((u) => grade === "ALL" || String(u.grade_code) === grade)
        .map((u) => [u.subject_code, u.subject_name])
    ).entries(),
  ];

  const visibleStandardCatalog = catalog.filter((u) => {
    if (grade !== "ALL" && String(u.grade_code) !== grade) return false;
    if (subject !== "ALL" && u.subject_code !== subject) return false;
    if (
      search &&
      !searchLearningText(u.name + " " + u.chapter_name + " " + u.subject_name).includes(
        searchLearningText(search)
      )
    )
      return false;
    if (filter === "IN_PROGRESS") return Number(u.completed_count) > 0 && lessonCompletion(u) < 100;
    if (filter === "COMPLETE") return lessonCompletion(u) === 100;
    if (filter === "DRAFT") return Number(u.draft_count) > 0;
    if (filter === "EMPTY") return Number(u.section_count) === 0;
    return true;
  });

  const groupedStandardCatalog = [
    ...new Map(
      visibleStandardCatalog.map((u) => [
        u.chapter_id,
        {
          name: u.chapter_name,
          num: u.chapter_number,
          grade: u.grade_code,
          subject: u.subject_name,
        },
      ])
    ).entries(),
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#f8faf9] text-slate-800">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 space-y-5">
        {/* Header Navigation */}
        <header className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-800/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Không gian học tập trực tuyến
              </h1>
              <p className="text-xs text-slate-500">
                Học rõ ràng · Thí nghiệm trực quan · Đấu trường thông minh · Tiến bộ mỗi ngày
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {teacher && (
              <div className="bg-slate-100 rounded-xl p-1 flex">
                {(["LIBRARY", "STUDIO"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setWorkspace(tab);
                      if (unitId || lessonParam) backToLibrary();
                      setFilter("ALL");
                    }}
                    className={
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all " +
                      (workspace === tab
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800")
                    }
                  >
                    {tab === "LIBRARY" ? "Thư viện bài học" : "Studio giáo viên"}
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
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-sm flex justify-between items-center gap-3 shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2 font-medium">
              <Sparkles size={16} className="text-emerald-600" />
              <span>{notice}</span>
            </div>
            <button
              aria-label="Ẩn thông báo"
              onClick={() => setNotice("")}
              className="p-1 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================================================================
            CHẾ ĐỘ 1: XEM BÀI HỌC TƯƠNG TÁC (LỚP 10 & 12) TRỰC TIẾP TRONG HỆ THỐNG
        ========================================================================= */}
        {currentInteractiveLesson ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Top Bar for In-App Lesson */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  onClick={backToLibrary}
                >
                  <ArrowLeft size={14} />
                  Thư viện bài học
                </button>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 ml-2">
                  <span className="font-semibold text-emerald-700">Lớp {currentLessonGrade}</span>
                  <ChevronRight size={13} className="text-slate-400" />
                  <span className="truncate max-w-[200px] text-slate-600">
                    Chương {currentInteractiveLesson.chapterNumber}
                  </span>
                  <ChevronRight size={13} className="text-slate-400" />
                  <span className="font-bold text-slate-900 truncate max-w-[280px]">
                    {currentInteractiveLesson.title}
                  </span>
                </div>
              </div>

              {/* Prev / Next Lesson Navigation */}
              <div className="flex items-center gap-2 ml-auto">
                {prevInteractiveLesson && (
                  <button
                    onClick={() => openInteractiveLesson(prevInteractiveLesson, currentLessonGrade)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    title={`Bài trước: ${prevInteractiveLesson.title}`}
                  >
                    <ArrowLeft size={13} />
                    <span className="hidden md:inline">Bài trước</span>
                  </button>
                )}
                {nextInteractiveLesson && (
                  <button
                    onClick={() => openInteractiveLesson(nextInteractiveLesson, currentLessonGrade)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                    title={`Bài kế tiếp: ${nextInteractiveLesson.title}`}
                  >
                    <span className="hidden md:inline">Bài tiếp theo</span>
                    <ArrowRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => setInteractiveExpanded((prev) => !prev)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title={interactiveExpanded ? "Thu nhỏ khung học" : "Phóng to toàn khung"}
                >
                  {interactiveExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>

            {/* In-App Lesson Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 md:p-6 border border-indigo-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
              <div className="relative flex flex-wrap gap-4 justify-between items-center">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      {currentInteractiveLesson.chapterBadge}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300">
                      Chủ đề: {currentInteractiveLesson.tag}
                    </span>
                    {activeProgress[currentInteractiveLesson.id]?.completed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 size={12} />
                        Đã hoàn thành ({activeProgress[currentInteractiveLesson.id]?.score * 10}%)
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                    {currentInteractiveLesson.title}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {currentInteractiveLesson.desc}
                  </p>
                </div>

                {/* Sub-Tabs Control Strip */}
                <div className="flex flex-wrap gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                  {[
                    { key: "all", label: "🌟 Trọn Bộ", icon: Sparkles },
                    { key: "theory", label: "📖 Lý Thuyết", icon: BookOpen },
                    { key: "labs", label: "🧪 Thí Nghiệm", icon: TestTube },
                    { key: "arena", label: "⚔️ Đấu Trường", icon: Sword },
                    { key: "badges", label: "🏆 Bằng Khen", icon: Award },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleSwitchSubTab(tab.key as LessonSubTab)}
                      className={
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all " +
                        (activeSubTab === tab.key
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "text-slate-300 hover:text-white hover:bg-white/5")
                      }
                    >
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* In-App Live Frame */}
            <div
              className={`rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-md transition-all flex flex-col ${
                interactiveExpanded
                  ? "fixed inset-2 z-50 rounded-2xl shadow-2xl h-[calc(100vh-16px)]"
                  : "min-h-[780px]"
              }`}
            >
              <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Phòng học tương tác trực tuyến chuẩn mực Toán {currentLessonGrade} (SGK KNTT)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Điểm số & Tiến độ tự động ghi nhận khi làm Đấu trường
                  </span>
                  <button
                    onClick={() => setInteractiveExpanded((prev) => !prev)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                    title={interactiveExpanded ? "Thu nhỏ" : "Phóng to"}
                  >
                    {interactiveExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              </div>
              <iframe
                ref={frame}
                key={currentInteractiveLesson.id + (interactiveExpanded ? "-exp" : "")}
                title={`Bài học: ${currentInteractiveLesson.title}`}
                src={`${currentInteractiveLesson.url}${
                  activeSubTab === "all" ? "" : `#${activeSubTab}`
                }`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
                className={`w-full border-0 transition-all ${
                  interactiveExpanded ? "flex-1 h-full" : "h-[calc(100vh-220px)] min-h-[750px]"
                }`}
              />
            </div>
          </div>
        ) : unitId && current ? (
          /* =========================================================================
              CHẾ ĐỘ 2: XEM BÀI HỌC TỪ DATABASE CATALOG (CÁC KHỐI KHÁC / ID6 UNITS)
          ========================================================================= */
          <div className="space-y-5 animate-fadeIn">
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <button className={secondary} onClick={backToLibrary}>
                <ArrowLeft size={15} />
                Thư viện bài học
              </button>
              <div className="flex gap-2 items-center text-xs text-slate-500">
                <span>Lớp {current.grade_code}</span>
                <ChevronRight size={12} />
                <span>{current.subject_name}</span>
                <ChevronRight size={12} />
                <span className="font-bold text-slate-800 truncate max-w-[240px]">
                  {current.chapter_name}
                </span>
              </div>
            </div>

            {unitBusy ? (
              <div role="status" className="py-24 flex justify-center items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin text-emerald-700" size={24} />
                Đang mở bài học…
              </div>
            ) : unitError ? (
              <div role="alert" className="bg-white rounded-3xl border p-8 text-center shadow-sm">
                <Lock className="mx-auto text-amber-600" size={30} />
                <h2 className="font-bold text-lg mt-4">Chưa mở được bài học</h2>
                <p className="text-sm text-slate-500 mt-2">{unitError}</p>
                <button className={secondary + " mt-4"} onClick={() => unitId && void loadUnit(unitId)}>
                  Thử lại
                </button>
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
                <section className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 flex flex-wrap gap-5 justify-between items-center shadow-sm">
                  <div>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                      Bài {current.unit_number} · {current.subject_name}
                    </p>
                    <h2 className="text-2xl font-black mt-1 text-slate-900">{current.name}</h2>
                    <p className="text-xs text-slate-400 mt-2">
                      {sections.length} mục học · {current.question_count} câu trong ngân hàng
                    </p>
                  </div>
                  {teacher ? (
                    <div className="flex flex-wrap gap-2">
                      <button className={primary} onClick={() => setAuthoring(true)}>
                        <Sparkles size={16} />
                        {Number(current.draft_count) > 0 ? "Tiếp tục soạn bài" : "Soạn bài trong Studio"}
                      </button>
                      <button className={secondary} onClick={() => setProposalUnit(current.id)}>
                        <Target size={15} />
                        AI ma trận luyện tập
                      </button>
                    </div>
                  ) : (
                    <button className={primary} onClick={() => setPanel("PRACTICE")}>
                      <Target size={16} />
                      Luyện tập ngay
                    </button>
                  )}
                </section>

                <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
                  <aside className="bg-white border border-slate-200 rounded-2xl overflow-hidden lg:sticky lg:top-4 shadow-sm">
                    <div className="p-4 border-b">
                      <h3 className="font-bold text-sm text-slate-900">Mục lục bài học</h3>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {sections.filter((s) => completeIds.has(s.id)).length}/{sections.length} mục đã hoàn thành
                      </p>
                    </div>
                    <nav className="p-2 space-y-1">
                      {sections.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveId(s.id);
                            setPanel("STUDY");
                          }}
                          className={
                            "w-full flex items-start gap-2.5 text-left p-3 rounded-xl text-xs font-semibold transition-all " +
                            (s.id === activeId && panel === "STUDY"
                              ? "bg-emerald-50 text-emerald-900 shadow-sm"
                              : "text-slate-600 hover:bg-slate-50")
                          }
                        >
                          <span
                            className={
                              "w-5 h-5 shrink-0 flex items-center justify-center rounded-lg text-[10px] " +
                              (completeIds.has(s.id)
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-500")
                            }
                          >
                            {completeIds.has(s.id) ? <Check size={11} /> : i + 1}
                          </span>
                          <span className="leading-5">{s.title}</span>
                        </button>
                      ))}
                    </nav>
                  </aside>

                  <main ref={article} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm min-w-0">
                    <div className="flex gap-1 border-b px-4 pt-2">
                      {(["STUDY", "PRACTICE"] as Panel[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPanel(p)}
                          className={
                            "px-4 py-3 text-xs font-bold border-b-2 transition-all " +
                            (panel === p
                              ? "border-emerald-600 text-emerald-800"
                              : "border-transparent text-slate-400 hover:text-slate-600")
                          }
                        >
                          {p === "STUDY" ? "Bài học" : "Luyện tập ngân hàng"}
                        </button>
                      ))}
                    </div>

                    {panel === "PRACTICE" ? (
                      <div className="p-5 md:p-6 space-y-4">
                        <LessonPractice
                          key={current.id + "-" + (active?.matrix_id || "unit")}
                          unitId={current.id}
                          matrixId={active?.matrix_id}
                        />
                      </div>
                    ) : active ? (
                      <div className="p-6 md:p-8 space-y-6">
                        <h3 className="text-xl font-bold text-slate-900">{active.title}</h3>
                        {active.content && <LessonContent content={active.content} />}
                        {active.video_url && (
                          <iframe
                            src={youtubeEmbed(active.video_url)}
                            title={active.title}
                            className="w-full aspect-video rounded-2xl border"
                            allowFullScreen
                          />
                        )}
                        {active.interactive_html && (
                          <iframe
                            ref={frame}
                            srcDoc={active.interactive_html}
                            title={active.title}
                            sandbox="allow-scripts allow-same-origin allow-forms"
                            className="w-full h-[600px] border rounded-2xl"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="p-10 text-center text-slate-400">Chọn một mục để bắt đầu học.</div>
                    )}
                  </main>
                </div>
              </>
            )}
          </div>
        ) : (
          /* =========================================================================
              CHẾ ĐỘ 3: THƯ VIỆN BÀI HỌC (CATALOG VIEW)
          ========================================================================= */
          <div className="space-y-5 animate-fadeIn">
            {/* Top Toolbar / Filters */}
            <section className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-wrap gap-3 items-center shadow-sm">
              <label className="flex-1 min-w-[220px] flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  aria-label="Tìm bài học"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm bài học, chủ đề, công thức (parabol, elip, vectơ, đạo hàm, Oxyz…)"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <select
                aria-label="Lọc khối lớp"
                className={chip}
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setSubject("ALL");
                  setParams({ grade: e.target.value });
                }}
              >
                <option value="10">Lớp 10 (Toàn khóa 37 bài KNTT)</option>
                <option value="12">Lớp 12 (Toàn khóa 26 bài KNTT)</option>
                <option value="ALL">Tất cả khối lớp</option>
                {grades
                  .filter((g) => g !== "10" && g !== "12")
                  .map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
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
                <option value="IN_PROGRESS">Chưa hoàn thành</option>
                <option value="COMPLETE">Đã hoàn thành</option>
              </select>
              <button
                aria-label="Tải lại thư viện"
                className={secondary}
                onClick={() => void loadCatalog()}
              >
                <RefreshCw size={15} />
              </button>
            </section>

            {/* Khi chọn xem LỚP 10: Hiển thị trọn bộ 37 Bài học KNTT tương tác trực tiếp */}
            {grade === "10" ? (
              <div className="space-y-6">
                {/* Hero Banner Khối 10 */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 border border-indigo-500/30 shadow-xl">
                  <div className="absolute right-0 top-0 h-64 w-64 rounded-full border-[40px] border-indigo-500/10 translate-x-12 -translate-y-12 pointer-events-none" />
                  <div className="relative grid md:grid-cols-[1.6fr_1fr] gap-6 items-center">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider border border-indigo-400/30">
                        <Sparkles size={13} className="text-amber-400 animate-pulse" />
                        Trọn Bộ Toán 10 Kết Nối Tri Thức Với Cuộc Sống
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        Không Gian Học Liệu Số Hóa Toàn Khóa Lớp 10
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
                        Tích hợp liền mạch toàn bộ 37 bài học hoàn chỉnh ngay trong hệ thống: KaTeX offline sắc nét, 74 Phòng thí nghiệm Canvas 2D/3D mô phỏng động, Đấu trường 10 câu trắc nghiệm với âm thanh Web Audio và Bằng chứng nhận chuẩn in A4.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          🎯 Đã hoàn thành: {g10CompletedCount}/37 bài học ({Math.round((g10CompletedCount / 37) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { n: "37/37", label: "Bài học SGK KNTT" },
                        { n: "74", label: "Labs Canvas 2D" },
                        { n: "370", label: "Câu hỏi Đấu trường" },
                        { n: "185", label: "Huy hiệu & Bằng khen" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-center backdrop-blur-sm"
                        >
                          <p className="text-xl font-black text-white">{stat.n}</p>
                          <p className="text-[11px] text-slate-300 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Danh sách 10 Chương và 37 Bài học Lớp 10 */}
                {GRADE_10_CHAPTERS.map((ch) => {
                  const chLessons = g10FilteredLessons.filter((l) => l.chapterNumber === ch.num);
                  if (!chLessons.length) return null;
                  return (
                    <section key={ch.num} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${ch.badgeColor}`}>
                            {ch.badge}
                          </span>
                          <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                            Chương {ch.num}. {ch.name}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {chLessons.length} bài học
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {chLessons.map((l) => {
                          const isDone = !!g10Progress[l.id]?.completed;
                          const score = g10Progress[l.id]?.score;
                          return (
                            <article
                              key={l.id}
                              className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3.5 hover:shadow-xl hover:shadow-indigo-950/5 hover:border-indigo-300 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1 border border-indigo-100">
                                  {l.tag.toUpperCase()}
                                </span>
                                {isDone ? (
                                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    {score ? `${score * 10}%` : "Đã học"}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">Chưa học</span>
                                )}
                              </div>

                              <div>
                                <h4 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                                  {l.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                  {l.desc}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-auto">
                                <span className="font-semibold text-indigo-700">🧪 2 Labs</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-emerald-700">⚔️ 10 Quiz</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-amber-700">🏆 5 Badges</span>
                              </div>

                              <button
                                onClick={() => openInteractiveLesson(l, "10")}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm group-hover:shadow"
                              >
                                <span>{isDone ? "Học lại bài học" : "Vào học ngay"}</span>
                                <ArrowRight size={14} />
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : grade === "12" ? (
              /* Khi chọn xem LỚP 12: Hiển thị trọn bộ 26 Bài học KNTT tương tác trực tiếp */
              <div className="space-y-6">
                {/* Hero Banner Khối 12 */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 border border-indigo-500/30 shadow-xl">
                  <div className="absolute right-0 top-0 h-64 w-64 rounded-full border-[40px] border-indigo-500/10 translate-x-12 -translate-y-12 pointer-events-none" />
                  <div className="relative grid md:grid-cols-[1.6fr_1fr] gap-6 items-center">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider border border-indigo-400/30">
                        <Sparkles size={13} className="text-amber-400 animate-pulse" />
                        Trọn Bộ Toán 12 Kết Nối Tri Thức Với Cuộc Sống
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        Không Gian Học Liệu Số Hóa Toàn Khóa Lớp 12
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
                        Tích hợp liền mạch toàn bộ 26 bài học hoàn chỉnh ngay trong hệ thống: KaTeX offline sắc nét, 52 Phòng thí nghiệm Canvas 2D/3D mô phỏng động, Đấu trường 10 câu trắc nghiệm với âm thanh Web Audio và Bằng chứng nhận chuẩn in A4.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          🎯 Đã hoàn thành: {g12CompletedCount}/26 bài học ({Math.round((g12CompletedCount / 26) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { n: "26/26", label: "Bài học SGK KNTT" },
                        { n: "52", label: "Labs Canvas 2D/3D" },
                        { n: "260", label: "Câu hỏi Đấu trường" },
                        { n: "130", label: "Huy hiệu & Bằng khen" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-center backdrop-blur-sm"
                        >
                          <p className="text-xl font-black text-white">{stat.n}</p>
                          <p className="text-[11px] text-slate-300 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Danh sách 7 Chương và 26 Bài học Lớp 12 */}
                {GRADE_12_CHAPTERS.map((ch) => {
                  const chLessons = g12FilteredLessons.filter((l) => l.chapterNumber === ch.num);
                  if (!chLessons.length) return null;
                  return (
                    <section key={ch.num} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${ch.badgeColor}`}>
                            {ch.badge}
                          </span>
                          <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                            Chương {ch.num}. {ch.name}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {chLessons.length} bài học
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {chLessons.map((l) => {
                          const isDone = !!g12Progress[l.id]?.completed;
                          const score = g12Progress[l.id]?.score;
                          return (
                            <article
                              key={l.id}
                              className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3.5 hover:shadow-xl hover:shadow-indigo-950/5 hover:border-indigo-300 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1 border border-indigo-100">
                                  BÀI {l.unitNumber}
                                </span>
                                {isDone ? (
                                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    {score ? `${score * 10}%` : "Đã học"}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">Chưa học</span>
                                )}
                              </div>

                              <div>
                                <h4 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                                  {l.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                  {l.desc}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-auto">
                                <span className="font-semibold text-indigo-700">🧪 2 Labs</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-emerald-700">⚔️ 10 Quiz</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-amber-700">🏆 5 Badges</span>
                              </div>

                              <button
                                onClick={() => openInteractiveLesson(l, "12")}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm group-hover:shadow"
                              >
                                <span>{isDone ? "Học lại bài học" : "Vào học ngay"}</span>
                                <ArrowRight size={14} />
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              /* Danh sách các khối khác từ Database Catalog */
              <div className="space-y-6">
                {loading ? (
                  <div role="status" className="py-20 flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="animate-spin text-emerald-700" />
                    Đang tải thư viện…
                  </div>
                ) : catalogError ? (
                  <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-700">
                    {catalogError}
                  </div>
                ) : !visibleStandardCatalog.length ? (
                  <div className="text-center bg-white rounded-3xl border py-16">
                    <BookOpen className="mx-auto text-slate-300" size={36} />
                    <h3 className="font-bold mt-4">Chưa có bài học phù hợp</h3>
                    <p className="text-sm text-slate-500 mt-2">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </div>
                ) : (
                  groupedStandardCatalog.map(([id, group]) => (
                    <section key={id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Lớp {group.grade} · {group.subject}
                          </p>
                          <h3 className="font-bold text-lg mt-1 text-slate-900">
                            Chương {group.num}. {group.name}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {visibleStandardCatalog.filter((u) => u.chapter_id === id).length} bài
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {visibleStandardCatalog
                          .filter((u) => u.chapter_id === id)
                          .map((u) => {
                            const completion = lessonCompletion(u);
                            return (
                              <article
                                key={u.id}
                                className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-lg transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 px-2 py-1">
                                    BÀI {u.unit_number}
                                  </span>
                                  {completion === 100 && (
                                    <span className="text-xs text-emerald-600 flex gap-1 items-center font-bold">
                                      <CheckCircle2 size={13} />
                                      Đã học
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-base text-slate-900 min-h-[44px]">
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
                                </div>
                                <button
                                  onClick={() => openUnit(u)}
                                  className={primary + " w-full mt-auto"}
                                >
                                  <span>Mở bài học</span>
                                  <ArrowRight size={14} />
                                </button>
                              </article>
                            );
                          })}
                      </div>
                    </section>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Learning;
