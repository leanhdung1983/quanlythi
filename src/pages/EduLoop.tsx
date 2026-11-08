import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LessonSection } from '../types';
import { LessonMatrixProposal } from '../components/LessonMatrixProposal';
import { LessonResource } from '../components/LessonResource';
import { PracticeCatalog } from '../components/PracticeCatalog';
const AdaptivePractice = lazy(() => import('./AdaptiveTest').then(m => ({ default: m.AdaptiveTest })));
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { 
    ArrowRight, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, 
    GraduationCap, Layers3, Loader2, RefreshCw, Search, ShieldCheck, 
    Sparkles, Target, TrendingUp, Users, X, ArrowLeft,
    Check, Award
} from 'lucide-react';

type Skill = {
    key: string;
    label: string;
    chapter_name: string;
    unit_name: string;
    unit_id?: number;
    chapter_id?: number;
    level: string;
    rate: number;
    attempts: number;
    students: number;
    weak_students: number;
    confidence: string;
    before: { rate: number | null; n: number };
    after: { rate: number | null; n: number };
    delta: number | null;
    evidence: { result_id: number; question_id: number; date: string; credit: number }[];
};

type Plan = {
    id: number;
    student_id: number;
    status: string;
    decision_note?: string;
    reviewed_at?: string;
    payload: { question_id: number; skill: string; reason: string }[];
};

export const EduLoop: React.FC = () => {
    const { user } = useAuthStore();
    const [params, setParams] = useSearchParams();
    const [practice, setPractice] = useState<{ recommendationId?: string; skillKey?: string } | null>(() => 
        params.get('recommendation_id') 
            ? { recommendationId: params.get('recommendation_id')! } 
            : window.location.hash.startsWith('#/adaptive') ? {} : null
    );
    const [learningSkill, setLearningSkill] = useState<Skill | null>(null);
    const [lessons, setLessons] = useState<LessonSection[]>([]);
    const [lessonBusy, setLessonBusy] = useState(false);
    const [lessonError, setLessonError] = useState('');
    const learningActionsRef = useRef<HTMLDivElement>(null);
    const lessonRequestRef = useRef(0);

    useEffect(() => {
        if (learningSkill && !practice) {
            learningActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            learningActionsRef.current?.focus({ preventScroll: true });
        }
    }, [learningSkill, practice]);

    const [proposalUnitId, setProposalUnitId] = useState<number | null>(null);
    const teacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [classId, setClassId] = useState('');
    const [students, setStudents] = useState<{ id: number; full_name: string; status: string }[]>([]);
    const [studentId, setStudentId] = useState('');
    const [skills, setSkills] = useState<Skill[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [progress, setProgress] = useState<Skill[] | null>(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState('');
    const [search, setSearch] = useState('');
    const [skillFilter, setSkillFilter] = useState<'ALL' | 'WEAK' | 'INSUFFICIENT'>('ALL');
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const filters = teacher ? { class_id: classId, student_id: studentId } : {};

    const load = useCallback(async () => {
        if (teacher && !classId) return;
        setBusy(true);
        setMessage('');
        setError(false);
        setProgress(null);
        try {
            const map = await apiService.eduLoop('/map', teacher ? { class_id: classId, student_id: studentId } : {});
            setSkills(map.data.skills);
            const list = await apiService.eduLoop('/recommendations', teacher ? { class_id: classId, student_id: studentId } : {});
            setPlans(list.data);
            setLoaded(true);
            setMessage(`${map.result_count} bài đã hoàn thành; ${map.data.skipped} câu thiếu ID6/đáp án hoặc chưa chấm được bỏ qua.`);
        } catch (e) {
            setError(true);
            setSkills([]);
            setPlans([]);
            setMessage(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
        } finally {
            setBusy(false);
        }
    }, [teacher, classId, studentId]);

    useEffect(() => {
        if (teacher) {
            apiService.eduLoopClasses()
                .then(r => setClasses(r.data))
                .catch(e => setMessage(e.message));
        }
    }, [teacher]);

    useEffect(() => {
        let active = true;
        setStudentId('');
        setStudents([]);
        setSkills([]);
        setPlans([]);
        setProgress(null);
        setLoaded(false);
        setMessage('');
        if (classId) {
            apiService.eduLoopStudents(classId)
                .then(r => {
                    if (active) setStudents(r.data.filter((s: { status: string }) => s.status === 'APPROVED'));
                })
                .catch(e => {
                    if (active) setMessage(e.message);
                });
        }
        return () => { active = false; };
    }, [classId]);

    useEffect(() => {
        if (!teacher) void load();
    }, [teacher, load]);

    const mutate = async (path: string, body: Record<string, unknown>) => {
        setBusy(true);
        try {
            await apiService.eduLoop(path, body, 'POST');
            await load();
        } catch (e) {
            setError(true);
            setMessage(e instanceof Error ? e.message : 'Không lưu được.');
        } finally {
            setBusy(false);
        }
    };

    const showProgress = async (id: number) => {
        setBusy(true);
        try {
            const r = await apiService.eduLoop(`/recommendations/${id}/progress`);
            setProgress(r.data.skills);
            setMessage(r.note);
        } catch (e) {
            setError(true);
            setMessage(e instanceof Error ? e.message : 'Không tải được tiến độ.');
        } finally {
            setBusy(false);
        }
    };

    const openLearning = async (skill: Skill) => {
        const requestId = ++lessonRequestRef.current;
        setLearningSkill(skill);
        setLessons([]);
        setLessonError('');
        if (!skill.unit_id) {
            setLessonBusy(false);
            setLessonError('Kỹ năng chưa được liên kết với bài học trong chương trình. Bạn vẫn có thể ôn đúng dạng này bằng nút phía trên.');
            return;
        }
        setLessonBusy(true);
        try {
            const data = await apiService.fetchLessonSections(skill.unit_id);
            if (requestId === lessonRequestRef.current) setLessons(data);
        } catch (e) {
            if (requestId === lessonRequestRef.current) setLessonError(e instanceof Error ? e.message : 'Không tải được bài học.');
        } finally {
            if (requestId === lessonRequestRef.current) setLessonBusy(false);
        }
    };

    const returnToMap = () => {
        setPractice(null);
        setParams({});
        void load();
    };

    const weakSkills = skills.filter(s => s.confidence !== 'INSUFFICIENT' && s.rate < 70);
    const readySkills = skills.filter(s => s.confidence !== 'INSUFFICIENT' && s.rate >= 70);
    const visibleSkills = skills.filter(s => 
        (skillFilter === 'ALL' || (skillFilter === 'WEAK' ? s.confidence !== 'INSUFFICIENT' && s.rate < 70 : s.confidence === 'INSUFFICIENT'))
        && `${s.label} ${s.chapter_name} ${s.unit_name} ${s.key}`.toLowerCase().includes(search.toLowerCase())
    );
    const beginner = !teacher && loaded && skills.length === 0;

    // View: Active Adaptive Practice Mode
    if (practice) {
        return (
            <div className="h-full flex flex-col min-h-0 bg-slate-50">
                <header className="shrink-0 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2.5 shadow-2xs z-10">
                    <button 
                        className="h-8.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs" 
                        onClick={() => { 
                            if (window.confirm('Trở về bản đồ kỹ năng? Bài đang làm được lưu để tiếp tục sau.')) returnToMap(); 
                        }}
                    >
                        <ArrowLeft size={15}/> Trở về EduLoop
                    </button>
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-600"/>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {practice.recommendationId ? `Kế hoạch đã duyệt #${practice.recommendationId}` : practice.skillKey ? `Ôn kỹ năng ${practice.skillKey}` : 'Ôn tập Adaptive cá nhân hóa'}
                        </span>
                    </div>
                    <div className="w-24 hidden sm:block"></div>
                </header>
                <div className="flex-1 min-h-0">
                    <Suspense fallback={
                        <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-600"/>
                            <p className="text-sm font-bold">Đang tải phòng thi thích ứng...</p>
                        </div>
                    }>
                        <AdaptivePractice 
                            key={`${user?.id}-${practice.recommendationId || practice.skillKey || 'self'}`} 
                            {...practice} 
                            onReturn={returnToMap}
                        />
                    </Suspense>
                </div>
            </div>
        );
    }

    // View: Table Render Helper
    const renderTable = (rows: Skill[], compare = false) => (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <th className="px-5 py-3">Kỹ năng & Phạm vi kiến thức</th>
                        <th className="px-4 py-3">Minh chứng bài làm</th>
                        <th className="px-4 py-3 text-center">{compare ? 'Trước → Sau' : 'Tỷ lệ đúng'}</th>
                        <th className="px-4 py-3 text-center">{compare ? 'Mức độ thay đổi' : 'Trạng thái học sinh'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map(s => {
                        const isWeak = s.confidence !== 'INSUFFICIENT' && s.rate < 70;
                        const isReady = s.confidence !== 'INSUFFICIENT' && s.rate >= 70;
                        const isLowConfidence = s.confidence === 'INSUFFICIENT';

                        return (
                            <tr key={s.key} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-5 py-3.5">
                                    <div className="text-[11px] font-medium text-slate-500 mb-0.5">
                                        {s.chapter_name} · {s.unit_name}
                                    </div>
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug">
                                        {s.label}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                        <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                            Mức {s.level}
                                        </span>
                                        <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                                            {s.key}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                        <button 
                                            onClick={() => void openLearning(s)} 
                                            className="h-7 px-2.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 shadow-2xs"
                                        >
                                            <BookOpen size={12}/> Học lại kiến thức
                                        </button>
                                        {!teacher && (
                                            <button 
                                                onClick={() => setPractice({ skillKey: s.key })} 
                                                className="h-7 px-2.5 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95"
                                            >
                                                Ôn kỹ năng này <ArrowRight size={12}/>
                                            </button>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-3.5 text-slate-700 text-xs align-top">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <span className="text-slate-900 font-black text-sm">{s.attempts}</span> lượt làm
                                    </div>
                                    <details className="mt-1.5 group/details max-w-xs">
                                        <summary className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800 list-none flex items-center gap-1 select-none">
                                            <span>Xem {s.evidence.length} minh chứng</span>
                                            <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform text-slate-400"/>
                                        </summary>
                                        <div className="mt-2 space-y-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-[11px] max-h-44 overflow-y-auto custom-scrollbar shadow-inner">
                                            {s.evidence.map((e, i) => (
                                                <div key={i} className="p-1.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs leading-relaxed">
                                                    <div className="flex justify-between font-bold text-slate-700">
                                                        <span>Bài #{e.result_id} · Câu #{e.question_id}</span>
                                                        <span className={e.credit >= 0.7 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {Math.round(e.credit * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        {new Date(e.date).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </td>

                                <td className="px-4 py-3.5 align-middle">
                                    {compare ? (
                                        <div className="text-center">
                                            <div className="font-black text-xs sm:text-sm text-slate-800">
                                                {s.before.rate ?? '—'}% <span className="text-slate-400">→</span> {s.after.rate ?? '—'}%
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                {s.before.n} lượt trước · {s.after.n} lượt sau
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="min-w-[120px] max-w-[160px] mx-auto text-center">
                                            <div className="flex justify-between items-center text-xs font-black mb-1">
                                                <span className={isLowConfidence ? 'text-slate-500' : isWeak ? 'text-amber-700' : 'text-emerald-700'}>
                                                    {s.rate}%
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isLowConfidence ? 'bg-slate-100 text-slate-500' : isWeak ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                    {isLowConfidence ? 'Chưa đủ mẫu' : isWeak ? 'Cần củng cố' : 'Đạt yêu cầu'}
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${isLowConfidence ? 'bg-slate-300' : isWeak ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                    style={{ width: `${Math.max(0, Math.min(100, s.rate))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </td>

                                <td className="px-4 py-3.5 text-center align-middle">
                                    {compare ? (
                                        s.delta === null ? (
                                            <span className="text-[11px] text-slate-400 font-medium">Cần 3 lượt mỗi phía</span>
                                        ) : (
                                            <span className={`rounded-lg px-2.5 py-1 text-xs font-black inline-flex items-center gap-1 ${s.delta >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                {s.delta > 0 ? '+' : ''}{s.delta}%
                                            </span>
                                        )
                                    ) : (
                                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 ${s.weak_students > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                                            <Users size={12}/> {s.weak_students}/{s.students} học sinh
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {!rows.length && (
                <div className="flex flex-col items-center py-12 px-4 text-center">
                    <div className="rounded-2xl bg-slate-100 p-3.5 mb-3 text-slate-400">
                        <Search size={24}/>
                    </div>
                    <p className="font-bold text-slate-700 text-sm">
                        {loaded ? 'Chưa có kỹ năng phù hợp' : 'Bản đồ kỹ năng đang chờ bạn'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                        {loaded 
                            ? (!teacher && !skills.length 
                                ? 'Chọn bài và dạng trong mục ôn tập phía trên để bắt đầu. Kết quả sẽ tự động đưa vào bản đồ sau khi nộp bài.' 
                                : 'Thử thay đổi bộ lọc tìm kiếm hoặc tích lũy thêm bài làm đã hoàn thành.')
                            : (teacher 
                                ? 'Chọn lớp học và bấm Cập nhật bản đồ để xem phân tích kỹ năng học sinh.' 
                                : 'Hoàn thành bài thi để bắt đầu xây dựng bản đồ kỹ năng của bạn.')
                        }
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full overflow-y-auto bg-[#f8fafc] text-slate-800 custom-scrollbar">
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 space-y-5">
                
                {/* 1. HERO HEADER */}
                <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-5 sm:p-7 text-white shadow-lg shadow-indigo-900/10 border border-indigo-500/20">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[40px] border-white/5" />
                    <div className="pointer-events-none absolute right-40 -bottom-28 h-56 w-56 rounded-full bg-cyan-400/10 blur-xl" />
                    
                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-[11px] font-bold tracking-wider text-cyan-200">
                                <Sparkles size={13} className="text-cyan-300"/> KHÔNG GIAN HỌC TẬP THÍCH ỨNG
                            </div>
                            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                                EduLoop <span className="text-cyan-300">AI</span>
                            </h1>
                            <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-indigo-100/85">
                                Vòng lặp học tập thích ứng · Lấp đầy khoảng trống kiến thức bằng minh chứng thực tế và định hướng sư phạm tin cậy.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
                            {[
                                { icon: Search, label: 'Phân tích', text: 'Từ bài thi thật' },
                                { icon: ShieldCheck, label: 'Định hướng', text: 'Giáo viên phê duyệt' },
                                { icon: TrendingUp, label: 'Tiến bộ', text: 'Minh chứng tăng trưởng' }
                            ].map((step, i) => (
                                <div key={step.label} className="relative rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-3 sm:p-4 text-center sm:text-left">
                                    <step.icon size={18} className="text-cyan-300 mx-auto sm:mx-0 mb-1.5"/>
                                    <p className="font-extrabold text-xs text-white">{step.label}</p>
                                    <p className="text-[10px] text-indigo-200/75 mt-0.5 leading-tight">{step.text}</p>
                                    {i < 2 && (
                                        <ChevronRight size={14} className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-cyan-300/50 z-10"/>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                {/* 2. CONTROLS & SCOPE SELECTOR */}
                <div className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-2xs">
                    {teacher ? (
                        <div className="flex flex-wrap items-center gap-2.5 flex-1">
                            <label className="flex-1 min-w-[160px] text-xs font-bold text-slate-600">
                                Lớp học
                                <select 
                                    aria-label="Lớp" 
                                    className="mt-1 block w-full border border-slate-300 bg-slate-50 hover:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer" 
                                    value={classId} 
                                    onChange={e => setClassId(e.target.value)}
                                >
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </label>
                            
                            <label className="flex-1 min-w-[160px] text-xs font-bold text-slate-600">
                                Học sinh
                                <select 
                                    aria-label="Học sinh" 
                                    disabled={!classId || busy} 
                                    className="mt-1 block w-full border border-slate-300 bg-slate-50 hover:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-40 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer" 
                                    value={studentId} 
                                    onChange={e => { 
                                        setStudentId(e.target.value); 
                                        setSkills([]); 
                                        setPlans([]); 
                                        setProgress(null); 
                                        setLoaded(false); 
                                        setMessage(''); 
                                    }}
                                >
                                    <option value="">Toàn lớp ({students.length} học sinh)</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                </select>
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-blue-600">
                                <GraduationCap size={22}/>
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">{user?.full_name || 'Học viên'}</p>
                                <p className="text-xs text-slate-500 font-medium">Bản đồ kỹ năng được trích xuất từ dữ liệu các bài thi đã làm</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                        <button 
                            className="h-8.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                            disabled={busy || (teacher && !classId)} 
                            onClick={load}
                        >
                            {busy ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                            <span>{busy ? 'Đang phân tích...' : 'Cập nhật bản đồ'}</span>
                        </button>
                    </div>
                </div>

                {/* System message alert */}
                {message && (
                    <div 
                        role={error ? 'alert' : 'status'} 
                        className={`rounded-xl px-4 py-2.5 text-xs font-semibold leading-relaxed flex items-center justify-between gap-2 border ${
                            error 
                                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                                : 'bg-blue-50/80 text-blue-800 border-blue-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className={`shrink-0 ${error ? 'text-rose-600' : 'text-blue-600'}`}/>
                            <span>{message}</span>
                        </div>
                        <button onClick={() => setMessage('')} className="p-1 hover:bg-black/5 rounded-md text-slate-400 hover:text-slate-600">
                            <X size={14}/>
                        </button>
                    </div>
                )}

                {/* 3. STUDENT CALLOUT: ADAPTIVE PRACTICE PROMPT */}
                {!teacher && (
                    <section className="bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-2xs">
                        <div className="flex-1">
                            <h2 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-blue-600"/> Ôn tập thích ứng Adaptive trong EduLoop
                            </h2>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Tự luyện từ lịch sử làm bài để hệ thống tự động sinh câu hỏi theo trình độ, hoặc chọn kế hoạch giáo viên đã phê duyệt bên dưới.
                            </p>
                        </div>
                        <button 
                            onClick={() => beginner ? document.getElementById('practice-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : setPractice({})} 
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <span>{beginner ? 'Chọn dạng bài để bắt đầu' : 'Bắt đầu tự ôn tập'}</span>
                            <ArrowRight size={15}/>
                        </button>
                    </section>
                )}

                {/* 4. ACTIVE LEARNING SKILL CALLOUT (IF SELECTED) */}
                {learningSkill && (
                    <div ref={learningActionsRef} tabIndex={-1} className="scroll-mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-3.5 sm:items-center justify-between shadow-2xs">
                        <div className="flex-1">
                            <p className="font-black text-sm text-emerald-900 flex items-center gap-2">
                                <Target size={16} className="text-emerald-600"/> Ôn đúng dạng: {learningSkill.label}
                            </p>
                            <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">
                                Mã ID6: <span className="font-mono font-bold">{learningSkill.key}</span> · Mức {learningSkill.level}. Bài ôn tập chỉ lấy câu hỏi thuộc đúng mã dạng này, không pha trộn dạng khác.
                            </p>
                            {teacher && (
                                <p className="mt-1 text-[11px] font-semibold text-emerald-800">
                                    Giáo viên đang trải nghiệm thử trên tài khoản của mình; không ghi nhận kết quả bài làm cho học sinh.
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                onClick={() => setPractice({ skillKey: learningSkill.key })} 
                                className="h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <BookOpen size={14}/>
                                <span>{teacher ? 'Làm thử đúng dạng này' : 'Bắt đầu ôn đúng dạng này'}</span>
                                <ArrowRight size={14}/>
                            </button>
                            <button 
                                onClick={() => setLearningSkill(null)}
                                className="h-8.5 w-8.5 flex items-center justify-center rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title="Đóng"
                            >
                                <X size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* 5. PRACTICE CATALOG (EXPLORE BY LESSON) */}
                {!teacher && (
                    <PracticeCatalog 
                        beginner={loaded && skills.length === 0} 
                        onSelect={key => setPractice({ skillKey: key })}
                    />
                )}

                {/* 6. EXPANDED LESSON RESOURCE VIEWER */}
                {learningSkill && (
                    <section className="rounded-2xl border border-blue-200 bg-white p-5 space-y-4 shadow-sm animate-in fade-in">
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <BookOpen size={18}/>
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm sm:text-base text-slate-900">
                                        {learningSkill.unit_name} · {learningSkill.label}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {learningSkill.chapter_name} → {learningSkill.unit_name} → {learningSkill.label}
                                    </p>
                                </div>
                            </div>
                            <button 
                                aria-label="Đóng bài học" 
                                onClick={() => setLearningSkill(null)} 
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18}/>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-500 mr-1">Các kỹ năng cùng bài:</span>
                            {skills
                                .filter(s => s.key !== learningSkill.key && s.unit_id && s.unit_id === learningSkill.unit_id)
                                .map(s => (
                                    <button 
                                        key={s.key} 
                                        className="rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-xs font-semibold transition-colors" 
                                        onClick={() => void openLearning(s)}
                                    >
                                        {s.label} · Mức {s.level}
                                    </button>
                                ))
                            }
                        </div>

                        {lessonBusy ? (
                            <div className="flex items-center justify-center p-8 gap-2 text-xs font-bold text-blue-600">
                                <Loader2 className="animate-spin" size={16}/> Đang tải học liệu bài giảng...
                            </div>
                        ) : lessonError ? (
                            <p role="alert" className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                                {lessonError}
                            </p>
                        ) : lessons.length ? (
                            lessons.map(l => (
                                <article key={l.id} className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
                                    <h3 className="font-bold text-sm text-slate-800">{l.title}</h3>
                                    <LessonResource lesson={l}/>
                                    {l.video_url && /^https:\/\//i.test(l.video_url) && (
                                        <a 
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800" 
                                            href={l.video_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            Xem video bài học trên YouTube ↗
                                        </a>
                                    )}
                                    {l.interactive_html && (
                                        <iframe 
                                            title={l.title} 
                                            sandbox="allow-scripts" 
                                            srcDoc={l.interactive_html} 
                                            className="mt-2 w-full min-h-[360px] border border-slate-200 rounded-xl bg-white shadow-2xs"
                                        />
                                    )}
                                    <div className="pt-2 flex justify-between items-center border-t border-slate-200">
                                        <button 
                                            className="h-8 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200" 
                                            onClick={async () => { 
                                                try { 
                                                    await apiService.updateUserLessonProgress({ user_id: user!.id, section_id: l.id, is_completed: true, score: 0 }); 
                                                    setMessage(`Đã ghi nhận học xong: ${l.title}`); 
                                                } catch (e) { 
                                                    setError(true); 
                                                    setMessage(e instanceof Error ? e.message : 'Không lưu được tiến độ.'); 
                                                } 
                                            }}
                                        >
                                            <Check size={14} className="inline mr-1"/> Đánh dấu đã học
                                        </button>
                                        {!teacher && (
                                            <button 
                                                className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5" 
                                                onClick={() => setPractice({ skillKey: learningSkill.key })}
                                            >
                                                Luyện tập câu hỏi <ArrowRight size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                                Bài này chưa có nội dung lý thuyết chi tiết. Bạn vẫn có thể luyện tập các câu hỏi cùng kỹ năng này.
                            </p>
                        )}
                    </section>
                )}

                {/* 7. KPI STATS CARDS (4-COLUMN GRID) */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { 
                            label: 'Kỹ năng ghi nhận', 
                            value: skills.length, 
                            icon: Layers3, 
                            color: 'bg-blue-50 text-blue-600 border-blue-100', 
                            caption: 'Trích xuất từ các bài thi thật' 
                        },
                        { 
                            label: 'Cần củng cố (< 70%)', 
                            value: weakSkills.length, 
                            icon: Target, 
                            color: 'bg-amber-50 text-amber-600 border-amber-100', 
                            caption: 'Khoảng trống cần bồi dưỡng' 
                        },
                        { 
                            label: 'Vững vàng (≥ 70%)', 
                            value: readySkills.length, 
                            icon: CheckCircle2, 
                            color: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
                            caption: 'Đã hoàn thành tối thiểu 3 lượt' 
                        },
                        { 
                            label: 'Kế hoạch chờ duyệt', 
                            value: plans.filter(p => p.status === 'PENDING').length, 
                            icon: ClipboardCheck, 
                            color: 'bg-sky-50 text-sky-600 border-sky-100', 
                            caption: 'Kế hoạch cá nhân hóa' 
                        }
                    ].map(stat => (
                        <div key={stat.label} className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4.5 shadow-2xs flex flex-col justify-between">
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">{stat.label}</span>
                                <div className={`p-2 rounded-xl border ${stat.color}`}>
                                    <stat.icon size={16}/>
                                </div>
                            </div>
                            <div className="mt-2.5">
                                <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                                    {loaded ? stat.value : '—'}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400 font-medium">{stat.caption}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 8. MAIN CONTENT: SKILL GAP MAP & TEACHER ASIDE */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
                    
                    {/* LEARNING GAP MAP TABLE */}
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        <div className="p-4 sm:p-5 border-b border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <Target size={18}/>
                                    </div>
                                    <div>
                                        <h2 className="font-black text-sm sm:text-base text-slate-900">Bản đồ kỹ năng (Learning Gap Map)</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Nhìn rõ từng lỗ hổng kiến thức để bồi dưỡng đúng mục tiêu</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                                    {visibleSkills.length} kỹ năng
                                </span>
                            </div>

                            {/* FILTERS & SEARCH */}
                            <div className="mt-3.5 flex flex-col sm:flex-row gap-2.5 justify-between">
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                                    {[
                                        { id: 'ALL', label: 'Tất cả' },
                                        { id: 'WEAK', label: 'Cần củng cố (<70%)' },
                                        { id: 'INSUFFICIENT', label: 'Chưa đủ mẫu' }
                                    ].map(f => (
                                        <button 
                                            key={f.id} 
                                            onClick={() => setSkillFilter(f.id as any)} 
                                            className={`px-3 py-1.5 rounded-md transition-all ${
                                                skillFilter === f.id 
                                                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold' 
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input 
                                        aria-label="Tìm kỹ năng" 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder="Tìm kỹ năng, mã ID6..." 
                                        className="w-full sm:w-56 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {renderTable(visibleSkills)}

                        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-[11px] leading-relaxed text-slate-500">
                            💡 Kỹ năng được nhóm chuẩn xác theo dạng ID6. Tỷ lệ đúng phản ánh bài làm thực tế quan sát được, không phải ước lượng phỏng đoán.
                        </div>
                    </section>

                    {/* SIDEBAR ASIDE: RECOMMENDATIONS CREATION & VALUE EXPLAINER */}
                    <aside className="space-y-4">
                        {teacher && (
                            <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
                                <div className="flex gap-2.5 items-center">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <Sparkles size={18}/>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-sm text-slate-900">Kế hoạch cá nhân hóa</h2>
                                        <p className="text-[11px] text-slate-500">Tạo đề xuất từ các kỹ năng yếu</p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Chọn một học sinh trong danh sách trên để hệ thống tự động lọc các câu hỏi thuộc dạng dưới 70% có minh chứng bài làm.
                                </p>

                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600 leading-relaxed font-medium">
                                    Mỗi câu hỏi ôn tập được đính kèm lý do cụ thể và minh chứng bài làm gần nhất để thầy cô thẩm định.
                                </div>

                                <button 
                                    disabled={busy || !studentId || !classId} 
                                    className="w-full h-8.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
                                    onClick={() => mutate('/recommendations', filters)}
                                >
                                    <Sparkles size={14}/> Tạo đề xuất chờ duyệt
                                </button>

                                <label className="block text-xs font-bold text-slate-700 pt-1">
                                    Ghi chú của giáo viên
                                    <textarea 
                                        aria-label="Ghi chú quyết định" 
                                        className="mt-1 border border-slate-300 bg-slate-50 hover:bg-white focus:bg-white rounded-xl p-2.5 w-full min-h-[80px] resize-y text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" 
                                        placeholder="Nhập nhận xét hoặc lưu ý sư phạm khi phê duyệt..." 
                                        value={note} 
                                        maxLength={2000} 
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </label>
                            </section>
                        )}

                        <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200/80 p-4 sm:p-5 space-y-2.5 shadow-2xs">
                            <div className="flex items-center gap-2 text-blue-700">
                                <Award size={18}/>
                                <h3 className="font-bold text-xs uppercase tracking-wider">Mỗi đề xuất đều có căn cứ</h3>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Giáo viên luôn là người kiểm duyệt minh chứng trước khi kích hoạt kế hoạch. Học sinh luyện tập đúng trọng tâm và quan sát rõ sự tiến bộ qua từng kỹ năng.
                            </p>
                            <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                                <ShieldCheck size={14} className="text-emerald-600"/>
                                <span>Giáo viên luôn nắm quyền quyết định</span>
                            </div>
                        </section>
                    </aside>
                </div>

                {/* 9. RECOMMENDATION PLANS SECTION */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900">
                                {teacher ? 'Đề xuất & Phê duyệt kế hoạch' : 'Kế hoạch ôn tập cá nhân hóa'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {teacher ? 'Xem xét minh chứng và quyết định lộ trình ôn tập thích ứng.' : 'Bắt đầu ôn tập từ các kế hoạch giáo viên đã phê duyệt cho bạn.'}
                            </p>
                        </div>
                        <span className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                            {plans.length} kế hoạch
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {!plans.length && (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                                <ClipboardCheck size={32} className="mx-auto text-slate-300 mb-2.5"/>
                                <p className="font-bold text-slate-700 text-sm">Chưa có kế hoạch ôn tập</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                    {teacher 
                                        ? 'Chọn học sinh cụ thể và nhấn "Tạo đề xuất chờ duyệt" để thiết lập lộ trình bồi dưỡng mới.' 
                                        : 'Kế hoạch ôn tập sẽ xuất hiện khi giáo viên phân tích và duyệt đề xuất cho bạn.'}
                                </p>
                            </div>
                        )}

                        {plans.map(p => {
                            const isApproved = p.status === 'APPROVED';
                            const isRejected = p.status === 'REJECTED';
                            const isPending = p.status === 'PENDING';

                            return (
                                <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                            <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                                KẾ HOẠCH #{p.id}
                                            </span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                                isApproved 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : isRejected 
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                            }`}>
                                                {({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối' } as Record<string, string>)[p.status]}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                <Users size={15} className="text-blue-600"/>
                                                <span>{students.find(s => s.id === p.student_id)?.full_name || (teacher ? `Học sinh #${p.student_id}` : 'Kế hoạch dành cho bạn')}</span>
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {p.payload.length} câu hỏi chọn lọc · Ôn tập theo minh chứng
                                            </p>
                                        </div>

                                        {/* QUESTION PAYLOAD LIST */}
                                        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                            {p.payload.map((item, i) => (
                                                <div key={item.question_id} className="flex gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                                                    <span className="shrink-0 h-5 w-5 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800">
                                                            Câu #{item.question_id}
                                                        </p>
                                                        <p className="text-[11px] leading-relaxed text-slate-500 mt-0.5">
                                                            {item.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {p.decision_note && (
                                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600 leading-relaxed">
                                                <span className="font-bold text-slate-800">Ghi chú giáo viên: </span>
                                                {p.decision_note}
                                            </div>
                                        )}
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                                        {teacher && isPending && (
                                            <div className="flex gap-2">
                                                <button 
                                                    disabled={busy} 
                                                    className="flex-1 h-8.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5" 
                                                    onClick={() => mutate(`/recommendations/${p.id}/decision`, { status: 'APPROVED', note })}
                                                >
                                                    <CheckCircle2 size={14}/> Phê duyệt
                                                </button>
                                                <button 
                                                    disabled={busy} 
                                                    className="h-8.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5" 
                                                    onClick={() => mutate(`/recommendations/${p.id}/decision`, { status: 'REJECTED', note })}
                                                >
                                                    <X size={14}/> Từ chối
                                                </button>
                                            </div>
                                        )}

                                        {!teacher && isApproved && (
                                            <button 
                                                className="w-full h-8.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5" 
                                                onClick={() => setPractice({ recommendationId: String(p.id) })}
                                            >
                                                <span>Bắt đầu ôn tập</span>
                                                <ArrowRight size={14}/>
                                            </button>
                                        )}

                                        {isApproved && (
                                            <button 
                                                disabled={busy} 
                                                className="inline-flex gap-1.5 items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800 pt-1" 
                                                onClick={() => showProgress(p.id)}
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    <TrendingUp size={14}/> Xem tiến độ trước – sau
                                                </span>
                                                <ArrowRight size={12}/>
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* 10. PROGRESS COMPARISON MODAL / SECTION */}
                {progress && (
                    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md animate-in fade-in">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <TrendingUp size={18}/>
                                </div>
                                <div>
                                    <h2 className="font-black text-sm sm:text-base text-slate-900">Tiến độ theo kỹ năng</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">So sánh kết quả làm bài trước và sau thời điểm kế hoạch được duyệt</p>
                                </div>
                            </div>
                            <button 
                                aria-label="Đóng tiến độ" 
                                onClick={() => setProgress(null)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <X size={18}/>
                            </button>
                        </div>
                        {renderTable(progress, true)}
                    </section>
                )}

                {/* 11. TEACHER AI LESSON MATRIX PROPOSAL MODAL */}
                {teacher && learningSkill?.unit_id && (
                    <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <Sparkles size={18} className="text-blue-600"/>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Ma trận đề thi tự động cho bài này</p>
                                <p className="text-[11px] text-slate-500">AI tự động phân bổ câu hỏi từ bài học {learningSkill.unit_name} theo chuẩn Bộ GD&ĐT</p>
                            </div>
                        </div>
                        <button 
                            className="h-8.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0" 
                            onClick={() => setProposalUnitId(learningSkill.unit_id!)}
                        >
                            <Sparkles size={14}/> AI đề xuất ma trận
                        </button>
                    </div>
                )}

                {teacher && proposalUnitId && (
                    <LessonMatrixProposal 
                        unitId={proposalUnitId} 
                        onClose={() => setProposalUnitId(null)}
                    />
                )}

                {/* FOOTER */}
                <footer className="text-center text-[11px] text-slate-400 py-3 font-medium">
                    EduLoop AI · Minh chứng dẫn đường, giáo viên định hướng, học sinh tiến bộ.
                </footer>
            </div>
        </div>
    );
};
