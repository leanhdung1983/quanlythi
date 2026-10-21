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
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  ExternalLink,
  GraduationCap,
  History,
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
  GRADE_6_CHAPTERS,
  GRADE_6_LESSONS,
  Grade6Lesson,
} from "../data/grade6Lessons";
import {
  GRADE_10_CHAPTERS,
  GRADE_10_LESSONS,
  Grade10Lesson,
} from "../data/grade10Lessons";
import {
  GRADE_11_CHAPTERS,
  GRADE_11_LESSONS,
  Grade11Lesson,
} from "../data/grade11Lessons";
import {
  GRADE_12_CHAPTERS,
  GRADE_12_LESSONS,
  Grade12Lesson,
} from "../data/grade12Lessons";

type Resume = { unitId?: number; lessonId?: string; sectionId?: number | null; updatedAt: number };
type Panel = "STUDY" | "PRACTICE";
type LessonSubTab = "all" | "theory" | "labs" | "arena" | "badges";

type InteractiveLesson = Grade6Lesson | Grade10Lesson | Grade11Lesson | Grade12Lesson;

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

interface LearningHistoryItem {
  lessonId: string;
  lessonTitle: string;
  grade: string;
  chapterNumber?: number;
  score?: number;
  completed?: boolean;
  timestamp: number;
}

export const Learning: React.FC = () => {
  const { user } = useAuthStore();
  const teacher = user?.role === "ADMIN" || user?.role === "TEACHER";
  const admin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Route parameters
  const unitId = Number(params.get("unit_id") || params.get("unit")) || null;
  const lessonParam =
    params.get("lesson") ||
    params.get("lesson6") ||
    params.get("lesson10") ||
    params.get("lesson11") ||
    params.get("lesson12") ||
    null;

  const [grade, setGrade] = useState(() => {
    const g = params.get("grade");
    if (g) return g;
    if (params.get("lesson6")) return "6";
    if (params.get("lesson11")) return "11";
    if (params.get("lesson12")) return "12";
    if (params.get("lesson10")) return "10";
    return "6";
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

  // Định danh tài khoản học sinh theo tên đăng nhập (username)
  const studentUsername = (user?.username || "").trim().toLowerCase();
  const accountKey = studentUsername || (user?.id ? String(user.id) : "guest");

  // Storage keys for progress & history lưu chính xác theo tên đăng nhập của học sinh
  const g6StorageKey = "learning_hub:grade6:" + accountKey;
  const [g6Progress, setG6Progress] = useState<Record<string, GradeProgress>>(() => {
    try {
      return JSON.parse(localStorage.getItem(g6StorageKey) || "{}");
    } catch {
      return {};
    }
  });

  const g10StorageKey = "learning_hub:grade10:" + accountKey;
  const [g10Progress, setG10Progress] = useState<Record<string, GradeProgress>>(() => {
    try {
      return JSON.parse(localStorage.getItem(g10StorageKey) || "{}");
    } catch {
      return {};
    }
  });

  const g11StorageKey = "learning_hub:grade11:" + accountKey;
  const [g11Progress, setG11Progress] = useState<Record<string, GradeProgress>>(() => {
    try {
      return JSON.parse(localStorage.getItem(g11StorageKey) || "{}");
    } catch {
      return {};
    }
  });

  const g12StorageKey = "learning_hub:grade12:" + accountKey;
  const [g12Progress, setG12Progress] = useState<Record<string, GradeProgress>>(() => {
    try {
      return JSON.parse(localStorage.getItem(g12StorageKey) || "{}");
    } catch {
      return {};
    }
  });

  // Quản lý Lịch sử học tập (Learning History)
  const historyStorageKey = "learning_hub:history:" + accountKey;
  const [historyItems, setHistoryItems] = useState<LearningHistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(historyStorageKey) || "[]");
    } catch {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Phân quyền Free vs Pro
  const isProUser = Boolean(
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    user?.is_pro
  );

  // Quy định tài khoản Free chỉ được học bài đầu tiên của mỗi chương
  const isLessonFree = useCallback((lesson: { tag?: string; unitNumber?: number; title?: string }): boolean => {
    const tag = (lesson.tag || "").trim().toLowerCase();
    if (tag === "bài 1" || tag.startsWith("bài 1 ") || tag.startsWith("bài 01")) return true;
    if (lesson.unitNumber === 1) return true;
    return false;
  }, []);

  const canAccessLesson = useCallback((lesson: { tag?: string; unitNumber?: number; title?: string }): boolean => {
    if (isProUser) return true;
    return isLessonFree(lesson);
  }, [isProUser, isLessonFree]);

  const [proModalLesson, setProModalLesson] = useState<InteractiveLesson | null>(null);

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

  const resumeKey = "learning-hub:v2:" + accountKey;
  const [resume, setResume] = useState<Resume | null>(() => readResume(resumeKey));

  // Tự động đồng bộ tiến độ & lịch sử khi thay đổi tài khoản học sinh
  useEffect(() => {
    try {
      setG6Progress(JSON.parse(localStorage.getItem(g6StorageKey) || "{}"));
      setG10Progress(JSON.parse(localStorage.getItem(g10StorageKey) || "{}"));
      setG11Progress(JSON.parse(localStorage.getItem(g11StorageKey) || "{}"));
      setG12Progress(JSON.parse(localStorage.getItem(g12StorageKey) || "{}"));
      setHistoryItems(JSON.parse(localStorage.getItem(historyStorageKey) || "[]"));
    } catch {
      /* ignore */
    }

    if (user?.id) {
      setHistoryLoading(true);
      apiService.fetchLessonHistory()
        .then((res: any) => {
          if (res?.data && Array.isArray(res.data)) {
            const serverHistory: LearningHistoryItem[] = res.data.map((row: any) => ({
              lessonId: row.lesson_id,
              lessonTitle: row.lesson_title,
              grade: row.grade,
              score: Number(row.score || 0),
              completed: Boolean(row.completed),
              timestamp: new Date(row.last_studied_at || Date.now()).getTime(),
            }));
            if (serverHistory.length > 0) {
              setHistoryItems(serverHistory);
              try {
                localStorage.setItem(historyStorageKey, JSON.stringify(serverHistory));
              } catch {}
            }
          }
        })
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  }, [accountKey, user?.id, g6StorageKey, g10StorageKey, g11StorageKey, g12StorageKey, historyStorageKey]);

  const requestToken = useRef(0);
  const catalogToken = useRef(0);
  const [loadedUnitId, setLoadedUnitId] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const article = useRef<HTMLElement>(null);

  const current = catalog.find((u) => Number(u.id) === unitId);

  // Determine current interactive lesson (Grade 6, 10, 11, or 12)
  const currentInteractiveLesson = useMemo(() => {
    if (!lessonParam) return null;
    if (grade === "6") {
      return GRADE_6_LESSONS.find((l) => l.id === lessonParam) || null;
    }
    if (grade === "10") {
      return GRADE_10_LESSONS.find((l) => l.id === lessonParam) || null;
    }
    if (grade === "11") {
      return GRADE_11_LESSONS.find((l) => l.id === lessonParam) || null;
    }
    if (grade === "12") {
      return GRADE_12_LESSONS.find((l) => l.id === lessonParam) || null;
    }
    return (
      GRADE_6_LESSONS.find((l) => l.id === lessonParam) ||
      GRADE_10_LESSONS.find((l) => l.id === lessonParam) ||
      GRADE_11_LESSONS.find((l) => l.id === lessonParam) ||
      GRADE_12_LESSONS.find((l) => l.id === lessonParam) ||
      null
    );
  }, [lessonParam, grade]);

  const currentLessonGrade = useMemo(() => {
    if (!currentInteractiveLesson) return grade;
    if (GRADE_6_LESSONS.some((l) => l.id === currentInteractiveLesson.id)) return "6";
    if (GRADE_10_LESSONS.some((l) => l.id === currentInteractiveLesson.id)) return "10";
    if (GRADE_11_LESSONS.some((l) => l.id === currentInteractiveLesson.id)) return "11";
    if (GRADE_12_LESSONS.some((l) => l.id === currentInteractiveLesson.id)) return "12";
    return grade;
  }, [currentInteractiveLesson, grade]);

  const activeProgress = useMemo(() => {
    switch (currentLessonGrade) {
      case "6":
        return g6Progress;
      case "11":
        return g11Progress;
      case "12":
        return g12Progress;
      default:
        return g10Progress;
    }
  }, [currentLessonGrade, g6Progress, g10Progress, g11Progress, g12Progress]);

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

  // Ghi nhận lịch sử học tập vào localStorage và DB máy chủ
  const recordLessonActivity = useCallback(
    (lesson: InteractiveLesson, targetGrade: string, score?: number, completed?: boolean) => {
      const now = Date.now();
      const item: LearningHistoryItem = {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        grade: targetGrade,
        chapterNumber: lesson.chapterNumber,
        score: score !== undefined ? score : undefined,
        completed: completed !== undefined ? completed : false,
        timestamp: now,
      };

      setHistoryItems((prev) => {
        const filtered = prev.filter((h) => h.lessonId !== lesson.id);
        const existing = prev.find((h) => h.lessonId === lesson.id);
        const resolvedScore = score !== undefined ? Math.max(score, existing?.score || 0) : existing?.score;
        const isCompleted = completed || existing?.completed || false;
        const updated: LearningHistoryItem = {
          ...item,
          score: resolvedScore,
          completed: isCompleted,
        };
        const next = [updated, ...filtered].slice(0, 100);
        try {
          localStorage.setItem(historyStorageKey, JSON.stringify(next));
        } catch {}
        return next;
      });

      // Gửi lên backend lưu vào DB nếu đã đăng nhập
      if (user?.id) {
        apiService.saveLessonHistory({
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          grade: targetGrade,
          score: score,
          completed: completed,
        }).catch((e) => console.warn("Lưu lịch sử bài học lên máy chủ thất bại:", e));
      }
    },
    [user?.id, historyStorageKey]
  );

  // Handle in-app completion & message events
  useEffect(() => {
    const handlePlatformMessage = (event: MessageEvent) => {
      if (event.data?.type === "LESSON_COMPLETE") {
        const score = Number(event.data.score);
        const resolvedScore = Number.isFinite(score) ? Math.max(0, Math.min(10, score)) : 10;

        // If learning interactive lesson (Grade 6, 10, 11, or 12)
        if (currentInteractiveLesson) {
          const targetGrade = currentLessonGrade;
          let storageKey = g10StorageKey;
          let setProgressFn = setG10Progress;
          if (targetGrade === "6") {
            storageKey = g6StorageKey;
            setProgressFn = setG6Progress;
          } else if (targetGrade === "11") {
            storageKey = g11StorageKey;
            setProgressFn = setG11Progress;
          } else if (targetGrade === "12") {
            storageKey = g12StorageKey;
            setProgressFn = setG12Progress;
          }

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

          // Ghi nhận lịch sử hoàn thành vào log & DB
          recordLessonActivity(currentInteractiveLesson, targetGrade, resolvedScore, true);

          setNotice(
            `🎉 Chúc mừng bạn đã hoàn thành Đấu trường với ${
              resolvedScore * 10
            }% điểm số! Tiến độ đã được lưu cho tài khoản ${user?.username || "học sinh"}.`
          );
        }

        // Also mark DB section complete if activeId is set
        if (activeId && panel === "STUDY") {
          void markComplete(activeId, false, resolvedScore);
        }
      }
    };

    window.addEventListener("message", handlePlatformMessage);
    return () => window.removeEventListener("message", handlePlatformMessage);
  }, [
    currentInteractiveLesson,
    currentLessonGrade,
    activeId,
    panel,
    g6StorageKey,
    g10StorageKey,
    g11StorageKey,
    g12StorageKey,
    recordLessonActivity,
    user?.username,
  ]);

  // Navigation handlers
  const openInteractiveLesson = (lesson: InteractiveLesson, targetGrade: string) => {
    setParams({ grade: targetGrade, lesson: lesson.id });
    setActiveSubTab("all");
    setInteractiveExpanded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenInteractiveLesson = (lesson: InteractiveLesson, targetGrade: string) => {
    if (!canAccessLesson(lesson)) {
      setProModalLesson(lesson);
      return;
    }
    recordLessonActivity(lesson, targetGrade);
    openInteractiveLesson(lesson, targetGrade);
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
  const currentGradeLessons = useMemo(() => {
    if (currentLessonGrade === "6") return GRADE_6_LESSONS;
    if (currentLessonGrade === "11") return GRADE_11_LESSONS;
    if (currentLessonGrade === "12") return GRADE_12_LESSONS;
    return GRADE_10_LESSONS;
  }, [currentLessonGrade]);

  const currentInteractiveIndex = currentInteractiveLesson
    ? currentGradeLessons.findIndex((l) => l.id === currentInteractiveLesson.id)
    : -1;
  const prevInteractiveLesson =
    currentInteractiveIndex > 0 ? currentGradeLessons[currentInteractiveIndex - 1] : null;
  const nextInteractiveLesson =
    currentInteractiveIndex >= 0 && currentInteractiveIndex < currentGradeLessons.length - 1
      ? currentGradeLessons[currentInteractiveIndex + 1]
      : null;

  // Grade 6 Catalog calculations
  const g6CompletedCount = useMemo(() => {
    return GRADE_6_LESSONS.filter((l) => g6Progress[l.id]?.completed).length;
  }, [g6Progress]);

  const g6FilteredLessons = useMemo(() => {
    return GRADE_6_LESSONS.filter((l) => {
      if (search) {
        const query = searchLearningText(search);
        const text = searchLearningText(l.title + " " + l.chapterName + " " + l.tag + " " + l.desc);
        if (!text.includes(query)) return false;
      }
      if (filter === "COMPLETE") return !!g6Progress[l.id]?.completed;
      if (filter === "IN_PROGRESS") return !g6Progress[l.id]?.completed;
      return true;
    });
  }, [search, filter, g6Progress]);

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

  // Grade 11 Catalog calculations
  const g11CompletedCount = useMemo(() => {
    return GRADE_11_LESSONS.filter((l) => g11Progress[l.id]?.completed).length;
  }, [g11Progress]);

  const g11FilteredLessons = useMemo(() => {
    return GRADE_11_LESSONS.filter((l) => {
      if (search) {
        const query = searchLearningText(search);
        const text = searchLearningText(l.title + " " + l.chapterName + " " + l.tag + " " + l.desc);
        if (!text.includes(query)) return false;
      }
      if (filter === "COMPLETE") return !!g11Progress[l.id]?.completed;
      if (filter === "IN_PROGRESS") return !g11Progress[l.id]?.completed;
      return true;
    });
  }, [search, filter, g11Progress]);

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
            <button
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/90 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-2xs transition-all"
              title="Lịch sử học tập của tài khoản này"
            >
              <History size={14} className="text-indigo-600" />
              <span>Lịch sử học</span>
              {historyItems.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-black">
                  {historyItems.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs text-xs font-bold">
              {isProUser ? (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300 font-black">
                  <Crown size={12} className="text-amber-600 fill-amber-500" />
                  PRO
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300">
                  FREE
                </span>
              )}
              {user?.username && (
                <span className="text-slate-600 font-mono text-[11px] font-semibold hidden md:inline">
                  @{user.username}
                </span>
              )}
            </div>
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

            {!canAccessLesson(currentInteractiveLesson) ? (
              <div className="rounded-3xl border border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 p-8 md:p-14 text-center shadow-lg space-y-6">
                <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Lock size={36} />
                </div>
                <div className="space-y-3 max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 uppercase tracking-wider">
                    <Crown size={14} className="text-amber-600 fill-amber-500" />
                    BÀI HỌC DÀNH CHO TÀI KHOẢN PRO
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900">
                    {currentInteractiveLesson.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    Tài khoản miễn phí (Free) chỉ được học bài đầu tiên của mỗi chương để trải nghiệm hệ thống.
                    Để xem và học toàn bộ 150+ bài học Toán SGK, 300+ phòng thí nghiệm Canvas mô phỏng động và tham gia Đấu trường trắc nghiệm không giới hạn, vui lòng nâng cấp tài khoản Pro.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => navigate("/profile")}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <Crown size={16} />
                    <span>Nâng cấp Pro mở khóa toàn bộ</span>
                  </button>
                  <button
                    onClick={backToLibrary}
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                  >
                    <ArrowLeft size={16} />
                    <span>Quay lại thư viện bài học</span>
                  </button>
                </div>
              </div>
            ) : (
              /* In-App Live Frame */
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
            )}
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
                <option value="6">Lớp 6 (Toàn khóa 53 bài KNTT)</option>
                <option value="10">Lớp 10 (Toàn khóa 37 bài KNTT)</option>
                <option value="11">Lớp 11 (Toàn khóa 46 bài KNTT)</option>
                <option value="12">Lớp 12 (Toàn khóa 26 bài KNTT)</option>
                <option value="ALL">Tất cả khối lớp</option>
                {grades
                  .filter((g) => !["6", "10", "11", "12"].includes(g))
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

            {/* Khi chọn xem LỚP 6: Hiển thị trọn bộ 53 Bài học KNTT tương tác trực tiếp */}
            {grade === "6" ? (
              <div className="space-y-6">
                {/* Hero Banner Khối 6 */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 md:p-8 border border-teal-500/30 shadow-xl">
                  <div className="absolute right-0 top-0 h-64 w-64 rounded-full border-[40px] border-teal-500/10 translate-x-12 -translate-y-12 pointer-events-none" />
                  <div className="relative grid md:grid-cols-[1.6fr_1fr] gap-6 items-center">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider border border-teal-400/30">
                        <Sparkles size={13} className="text-amber-400 animate-pulse" />
                        Trọn Bộ Toán 6 Kết Nối Tri Thức Với Cuộc Sống
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        Không Gian Học Liệu Số Hóa Toàn Khóa Lớp 6
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
                        Tích hợp liền mạch toàn bộ 53 bài học hoàn chỉnh ngay trong hệ thống: Thí nghiệm trực quan sinh động, 106+ Phòng thí nghiệm Canvas 2D mô phỏng động, Đấu trường 10 câu hỏi SGK với Web Audio API và Bằng chứng nhận chuẩn in A4.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          🎯 Đã hoàn thành: {g6CompletedCount}/53 bài học ({Math.round((g6CompletedCount / 53) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { n: "53/53", label: "Bài học SGK KNTT" },
                        { n: "106+", label: "Labs Canvas 2D" },
                        { n: "530+", label: "Câu hỏi Đấu trường" },
                        { n: "265", label: "Huy hiệu & Bằng khen" },
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

                {/* Danh sách 10 Chương và 53 Bài học Lớp 6 */}
                {GRADE_6_CHAPTERS.map((ch) => {
                  const chLessons = g6FilteredLessons.filter((l) => l.chapterNumber === ch.num);
                  if (!chLessons.length) return null;
                  return (
                    <section key={ch.num} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${ch.badgeColor}`}>
                            {ch.badge}
                          </span>
                          <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                            {ch.name.startsWith("Chương") ? ch.name : `Chương ${ch.num}. ${ch.name}`}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {chLessons.length} bài học
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {chLessons.map((l) => {
                          const isDone = !!g6Progress[l.id]?.completed;
                          const score = g6Progress[l.id]?.score;
                          const isAccessible = canAccessLesson(l);
                          return (
                            <article
                              key={l.id}
                              className={`group bg-white rounded-2xl border ${!isAccessible ? "border-amber-200/90 bg-amber-50/15" : "border-slate-200"} p-5 flex flex-col gap-3.5 hover:shadow-xl hover:shadow-teal-950/5 hover:border-teal-300 transition-all duration-200`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold rounded-lg bg-teal-50 text-teal-700 px-2.5 py-1 border border-teal-100">
                                    {l.tag.toUpperCase()}
                                  </span>
                                  {!isAccessible ? (
                                    <span className="text-[10px] font-black rounded-lg bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 flex items-center gap-1 shadow-2xs">
                                      <Lock size={11} className="text-amber-600" />
                                      PRO
                                    </span>
                                  ) : !isProUser ? (
                                    <span className="text-[10px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                                      MIỄN PHÍ
                                    </span>
                                  ) : null}
                                </div>
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
                                <h4 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                                  {l.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                  {l.desc}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-auto">
                                <span className="font-semibold text-teal-700">🧪 {l.labs ? (l.labs.length > 25 ? l.labs.substring(0, 25) + '…' : l.labs) : '2 Labs'}</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-emerald-700">⚔️ 10 Quiz</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-amber-700">🏆 Bằng A4</span>
                              </div>

                              {!isAccessible ? (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "6")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm"
                                >
                                  <Lock size={14} />
                                  <span>Mở khóa Pro</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "6")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-teal-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm group-hover:shadow"
                                >
                                  <span>{isDone ? "Học lại bài học" : "Vào học ngay"}</span>
                                  <ArrowRight size={14} />
                                </button>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : grade === "10" ? (
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
                          const isAccessible = canAccessLesson(l);
                          return (
                            <article
                              key={l.id}
                              className={`group bg-white rounded-2xl border ${!isAccessible ? "border-amber-200/90 bg-amber-50/15" : "border-slate-200"} p-5 flex flex-col gap-3.5 hover:shadow-xl hover:shadow-indigo-950/5 hover:border-indigo-300 transition-all duration-200`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1 border border-indigo-100">
                                    {l.tag.toUpperCase()}
                                  </span>
                                  {!isAccessible ? (
                                    <span className="text-[10px] font-black rounded-lg bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 flex items-center gap-1 shadow-2xs">
                                      <Lock size={11} className="text-amber-600" />
                                      PRO
                                    </span>
                                  ) : !isProUser ? (
                                    <span className="text-[10px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                                      MIỄN PHÍ
                                    </span>
                                  ) : null}
                                </div>
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

                              {!isAccessible ? (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "10")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm"
                                >
                                  <Lock size={14} />
                                  <span>Mở khóa Pro</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "10")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm group-hover:shadow"
                                >
                                  <span>{isDone ? "Học lại bài học" : "Vào học ngay"}</span>
                                  <ArrowRight size={14} />
                                </button>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : grade === "11" ? (
              /* Khi chọn xem LỚP 11: Hiển thị trọn bộ 46 Bài học KNTT tương tác trực tiếp */
              <div className="space-y-6">
                {/* Hero Banner Khối 11 */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 md:p-8 border border-sky-500/30 shadow-xl">
                  <div className="absolute right-0 top-0 h-64 w-64 rounded-full border-[40px] border-sky-500/10 translate-x-12 -translate-y-12 pointer-events-none" />
                  <div className="relative grid md:grid-cols-[1.6fr_1fr] gap-6 items-center">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-bold uppercase tracking-wider border border-sky-400/30">
                        <Sparkles size={13} className="text-amber-400 animate-pulse" />
                        Trọn Bộ Toán 11 Kết Nối Tri Thức Với Cuộc Sống
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        Không Gian Học Liệu Số Hóa Toàn Khóa Lớp 11
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
                        Tích hợp liền mạch toàn bộ 46 bài học hoàn chỉnh ngay trong hệ thống: KaTeX offline sắc nét, 92 Phòng thí nghiệm Canvas 2D/3D mô phỏng động, Đấu trường 10 câu trắc nghiệm với âm thanh Web Audio và Bằng chứng nhận chuẩn in A4.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          🎯 Đã hoàn thành: {g11CompletedCount}/46 bài học ({Math.round((g11CompletedCount / 46) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { n: "46/46", label: "Bài học SGK KNTT" },
                        { n: "92", label: "Labs Canvas 2D/3D" },
                        { n: "460", label: "Câu hỏi Đấu trường" },
                        { n: "230", label: "Huy hiệu & Bằng khen" },
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

                {/* Danh sách 11 Chương và 46 Bài học Lớp 11 */}
                {GRADE_11_CHAPTERS.map((ch) => {
                  const chLessons = g11FilteredLessons.filter((l) => l.chapterNumber === ch.num);
                  if (!chLessons.length) return null;
                  return (
                    <section key={ch.num} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${ch.badgeColor}`}>
                            {ch.badge}
                          </span>
                          <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                            {ch.name.startsWith("Chuyên Đề") ? ch.name : `Chương ${ch.num}. ${ch.name}`}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {chLessons.length} bài học
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {chLessons.map((l) => {
                          const isDone = !!g11Progress[l.id]?.completed;
                          const score = g11Progress[l.id]?.score;
                          const isAccessible = canAccessLesson(l);
                          return (
                            <article
                              key={l.id}
                              className={`group bg-white rounded-2xl border ${!isAccessible ? "border-amber-200/90 bg-amber-50/15" : "border-slate-200"} p-5 flex flex-col gap-3.5 hover:shadow-xl hover:shadow-sky-950/5 hover:border-sky-300 transition-all duration-200`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold rounded-lg bg-sky-50 text-sky-700 px-2.5 py-1 border border-sky-100">
                                    {l.tag.toUpperCase()}
                                  </span>
                                  {!isAccessible ? (
                                    <span className="text-[10px] font-black rounded-lg bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 flex items-center gap-1 shadow-2xs">
                                      <Lock size={11} className="text-amber-600" />
                                      PRO
                                    </span>
                                  ) : !isProUser ? (
                                    <span className="text-[10px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                                      MIỄN PHÍ
                                    </span>
                                  ) : null}
                                </div>
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
                                <h4 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
                                  {l.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                  {l.desc}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-auto">
                                <span className="font-semibold text-sky-700">🧪 {l.labs ? (l.labs.length > 25 ? l.labs.substring(0, 25) + '…' : l.labs) : '2 Labs'}</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-emerald-700">⚔️ 10 Quiz</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-amber-700">🏆 Bằng A4</span>
                              </div>

                              {!isAccessible ? (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "11")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm"
                                >
                                  <Lock size={14} />
                                  <span>Mở khóa Pro</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "11")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-sky-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm group-hover:shadow"
                                >
                                  <span>{isDone ? "Học lại bài học" : "Vào học ngay"}</span>
                                  <ArrowRight size={14} />
                                </button>
                              )}
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
                          const isAccessible = canAccessLesson(l);
                          return (
                            <article
                              key={l.id}
                              className={`group bg-white rounded-2xl border ${!isAccessible ? "border-amber-200/90 bg-amber-50/15" : "border-slate-200"} p-5 flex flex-col gap-3.5 hover:shadow-xl hover:shadow-indigo-950/5 hover:border-indigo-300 transition-all duration-200`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1 border border-indigo-100">
                                    BÀI {l.unitNumber}
                                  </span>
                                  {!isAccessible ? (
                                    <span className="text-[10px] font-black rounded-lg bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 flex items-center gap-1 shadow-2xs">
                                      <Lock size={11} className="text-amber-600" />
                                      PRO
                                    </span>
                                  ) : !isProUser ? (
                                    <span className="text-[10px] font-extrabold rounded-lg bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                                      MIỄN PHÍ
                                    </span>
                                  ) : null}
                                </div>
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

                              {!isAccessible ? (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "12")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm"
                                >
                                  <Lock size={14} />
                                  <span>Mở khóa Pro</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenInteractiveLesson(l, "12")}
                                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm group-hover:shadow"
                                >
                                  <span>{isDone ? "Học lại bài học" : "Vào học ngay"}</span>
                                  <ArrowRight size={14} />
                                </button>
                              )}
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

      {/* Modal Mở Khóa Gói Học Pro */}
      {proModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-200">
            {/* Header Modal */}
            <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-6 text-white text-center">
              <button
                onClick={() => setProModalLesson(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Đóng"
              >
                <X size={18} />
              </button>
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 mb-3 shadow-inner">
                <Crown size={32} className="text-amber-200" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-black/20 text-amber-200 border border-white/10">
                Gói Học Tập Toàn Diện
              </span>
              <h3 className="text-2xl font-black mt-2">Nâng Cấp Tài Khoản PRO</h3>
              <p className="text-xs text-amber-100 mt-1 max-w-sm mx-auto">
                Mở khóa không giới hạn toàn bộ bài học tương tác chuẩn SGK mới
              </p>
            </div>

            {/* Nội dung Modal */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 shrink-0 mt-0.5">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950 line-clamp-1">
                    {proModalLesson.title}
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Tài khoản <strong>Miễn phí (Free)</strong> được học bài đầu tiên của mỗi chương để trải nghiệm. Nâng cấp <strong>PRO</strong> để học toàn bộ bài học, phòng thí nghiệm Canvas và đấu trường không giới hạn!
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Đặc quyền tài khoản PRO:
                </p>
                <div className="grid gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Mở khóa toàn bộ <strong>150+ bài học</strong> Toán 6, 10, 11, 12</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Trải nghiệm <strong>300+ phòng thí nghiệm Canvas 2D/3D</strong> động</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Tham gia <strong>Đấu trường 10 câu</strong> & nhận <strong>Bằng khen in A4</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Lưu lịch sử học tập & phân tích điểm số theo tài khoản cá nhân</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setProModalLesson(null);
                    navigate("/profile");
                  }}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Nâng Cấp PRO Ngay</span>
                </button>
                <button
                  onClick={() => setProModalLesson(null)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lịch Sử Học Tập */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <History size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    Lịch Sử Học Tập
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      @{studentUsername || user?.id || "học sinh"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Tiến độ và kết quả Đấu trường được lưu trữ theo tài khoản của bạn
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (user?.id) {
                      setHistoryLoading(true);
                      apiService
                        .fetchLessonHistory()
                        .then((res: any) => {
                          if (res?.data && Array.isArray(res.data)) {
                            const serverHistory: LearningHistoryItem[] = res.data.map((row: any) => ({
                              lessonId: row.lesson_id,
                              lessonTitle: row.lesson_title,
                              grade: row.grade,
                              chapterNumber: row.chapter_number,
                              score: Number(row.score || 0),
                              completed: Boolean(row.completed),
                              timestamp: new Date(row.last_studied_at || Date.now()).getTime(),
                            }));
                            setHistoryItems(serverHistory);
                            try {
                              localStorage.setItem(historyStorageKey, JSON.stringify(serverHistory));
                            } catch {}
                          }
                        })
                        .catch(() => {})
                        .finally(() => setHistoryLoading(false));
                    }
                  }}
                  disabled={historyLoading}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 cursor-pointer"
                  title="Đồng bộ từ máy chủ"
                >
                  <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body Modal */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {historyLoading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin text-indigo-600" />
                  <p className="text-xs">Đang đồng bộ dữ liệu bài học...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <BookOpen size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Chưa có bài học nào được ghi nhận</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy bắt đầu học bài đầu tiên và vượt qua Đấu trường để lưu lại thành tích của bạn!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                    <span>Tổng số: {historyItems.length} bài học đã tham gia</span>
                    <span>Sắp xếp: Mới nhất</span>
                  </div>
                  {historyItems.map((item, index) => {
                    const gradeColor =
                      item.grade === "6"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.grade === "11"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200";

                    return (
                      <div
                        key={`${item.lessonId}-${index}`}
                        className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${gradeColor}`}>
                              Lớp {item.grade}
                            </span>
                            {item.completed ? (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 size={12} />
                                Đã hoàn thành
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                Đang học
                              </span>
                            )}
                            {item.score !== undefined && item.score > 0 && (
                              <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                🎯 {item.score * 10}%
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {item.lessonTitle}
                          </h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={11} />
                            Học gần nhất: {new Date(item.timestamp).toLocaleString("vi-VN")}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setShowHistoryModal(false);
                            const g = item.grade || "6";
                            setGrade(g);
                            let targetLesson: InteractiveLesson | undefined;
                            if (g === "6") targetLesson = GRADE_6_LESSONS.find((l) => l.id === item.lessonId);
                            else if (g === "10") targetLesson = GRADE_10_LESSONS.find((l) => l.id === item.lessonId);
                            else if (g === "11") targetLesson = GRADE_11_LESSONS.find((l) => l.id === item.lessonId);
                            else if (g === "12") targetLesson = GRADE_12_LESSONS.find((l) => l.id === item.lessonId);

                            if (targetLesson) {
                              handleOpenInteractiveLesson(targetLesson, g);
                            } else {
                              setParams({ grade: g, lesson: item.lessonId });
                            }
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          <span>Vào học tiếp</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Dữ liệu được lưu an toàn theo tên đăng nhập
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Learning;
