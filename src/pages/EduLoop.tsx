import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MathRenderer } from '../components/MathRenderer';
import { LessonSection } from '../types';
import { LessonMatrixProposal } from '../components/LessonMatrixProposal';
const AdaptivePractice = lazy(() => import('./AdaptiveTest').then(m => ({ default: m.AdaptiveTest })));
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, GraduationCap, Layers3, Loader2, RefreshCw, Search, ShieldCheck, Sparkles, Target, TrendingUp, Users, X } from 'lucide-react';

type Skill = { key: string; label: string; chapter_name: string; unit_name: string; unit_id?: number; chapter_id?: number; level: string;
    rate: number; attempts: number; students: number; weak_students: number; confidence: string;
    before: { rate: number | null; n: number }; after: { rate: number | null; n: number }; delta: number | null;
    evidence: { result_id: number; question_id: number; date: string; credit: number }[] };
type Plan = { id: number; student_id: number; status: string; decision_note?: string; reviewed_at?: string;
    payload: { question_id: number; skill: string; reason: string }[] };

export const EduLoop: React.FC = () => {
    const { user } = useAuthStore();
    const [params, setParams] = useSearchParams();
    const [practice, setPractice] = useState<{ recommendationId?: string; skillKey?: string } | null>(() => params.get('recommendation_id') ? { recommendationId: params.get('recommendation_id')! } : window.location.hash.startsWith('#/adaptive') ? {} : null);
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
    const [skillFilter, setSkillFilter] = useState('ALL');
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const filters = teacher ? { class_id: classId, student_id: studentId } : {};
    const load = useCallback(async () => {
        if (teacher && !classId) return;
        setBusy(true); setMessage(''); setError(false); setProgress(null);
        try {
            const map = await apiService.eduLoop('/map', teacher ? { class_id: classId, student_id: studentId } : {});
            setSkills(map.data.skills);
            const list = await apiService.eduLoop('/recommendations', teacher ? { class_id: classId, student_id: studentId } : {});
            setPlans(list.data);
            setLoaded(true);
            setMessage(`${map.result_count} bài đã hoàn thành; ${map.data.skipped} câu thiếu ID6/đáp án hoặc chưa chấm được bỏ qua.`);
        } catch (e) { setError(true); setSkills([]); setPlans([]); setMessage(e instanceof Error ? e.message : 'Không tải được dữ liệu.'); }
        finally { setBusy(false); }
    }, [teacher, classId, studentId]);
    useEffect(() => {
        if (teacher) apiService.eduLoopClasses().then(r => setClasses(r.data)).catch(e => setMessage(e.message));
    }, [teacher]);
    useEffect(() => {
        let active = true;
        setStudentId(''); setStudents([]); setSkills([]); setPlans([]); setProgress(null); setLoaded(false); setMessage('');
        if (classId) apiService.eduLoopStudents(classId).then(r => {
            if (active) setStudents(r.data.filter((s: { status: string }) => s.status === 'APPROVED'));
        }).catch(e => { if (active) setMessage(e.message); });
        return () => { active = false; };
    }, [classId]);
    useEffect(() => { if (!teacher) void load(); }, [teacher, load]);
    const mutate = async (path: string, body: Record<string, unknown>) => {
        setBusy(true);
        try { await apiService.eduLoop(path, body, 'POST'); await load(); }
        catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Không lưu được.'); }
        finally { setBusy(false); }
    };
    const showProgress = async (id: number) => {
        setBusy(true);
        try { const r = await apiService.eduLoop(`/recommendations/${id}/progress`); setProgress(r.data.skills); setMessage(r.note); }
        catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Không tải được tiến độ.'); }
        finally { setBusy(false); }
    };
    const openLearning = async (skill: Skill) => {
        const requestId = ++lessonRequestRef.current;
        setLearningSkill(skill); setLessons([]); setLessonError('');
        if (!skill.unit_id) { setLessonBusy(false); setLessonError('Kỹ năng chưa được liên kết với bài học trong chương trình. Bạn vẫn có thể ôn đúng dạng này bằng nút phía trên.'); return; }
        setLessonBusy(true);
        try { const data = await apiService.fetchLessonSections(skill.unit_id); if (requestId === lessonRequestRef.current) setLessons(data); }
        catch (e) { if (requestId === lessonRequestRef.current) setLessonError(e instanceof Error ? e.message : 'Không tải được bài học.'); }
        finally { if (requestId === lessonRequestRef.current) setLessonBusy(false); }
    };
    const returnToMap = () => {
        setPractice(null); setParams({}); void load();
    };
    const weakSkills = skills.filter(s => s.confidence !== 'INSUFFICIENT' && s.rate < 70);
    const readySkills = skills.filter(s => s.confidence !== 'INSUFFICIENT' && s.rate >= 70);
    const visibleSkills = skills.filter(s => (skillFilter === 'ALL' || (skillFilter === 'WEAK' ? s.confidence !== 'INSUFFICIENT' && s.rate < 70 : s.confidence === 'INSUFFICIENT'))
        && `${s.label} ${s.chapter_name} ${s.unit_name} ${s.key}`.toLowerCase().includes(search.toLowerCase()));
    const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-40';
    if (practice) return <div className="h-full flex flex-col min-h-0"><div className="shrink-0 flex items-center gap-3 bg-white border-b p-3"><button className={buttonClass} onClick={() => { if (window.confirm('Trở về bản đồ? Bài đang làm được lưu để tiếp tục sau.')) returnToMap(); }}>← EduLoop</button><span className="text-sm font-semibold text-indigo-600">{practice.recommendationId ? `Kế hoạch đã duyệt #${practice.recommendationId}` : practice.skillKey ? `Ôn kỹ năng ${practice.skillKey}` : 'Ôn tập Adaptive cá nhân hóa'}</span></div><div className="flex-1 min-h-0"><Suspense fallback={<p className="p-8">Đang mở bài ôn tập…</p>}><AdaptivePractice key={`${user?.id}-${practice.recommendationId || practice.skillKey || 'self'}`} {...practice} onReturn={returnToMap}/></Suspense></div></div>;
    const table = (rows: Skill[], compare = false) => <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm text-left"><thead><tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-6 py-4 font-semibold">Kỹ năng & phạm vi kiến thức</th><th className="px-5 py-4 font-semibold">Minh chứng</th>
            <th className="px-5 py-4 font-semibold">{compare ? 'Trước → Sau' : 'Tỷ lệ đúng'}</th><th className="px-5 py-4 font-semibold">{compare ? 'Thay đổi' : 'Cần ôn tập'}</th>
        </tr></thead><tbody>{rows.map(s => <tr key={s.key} className="border-t">
            <td className="px-6 py-5"><p className="text-xs text-slate-500 mb-1">{s.chapter_name} · {s.unit_name}</p><p className="font-semibold text-slate-800">{s.label}</p><div className="flex gap-2 mt-2"><span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">Mức {s.level}</span><span className="py-1 text-[10px] font-mono text-slate-400">{s.key}</span></div><div className="flex gap-3 mt-3"><button onClick={() => void openLearning(s)} className="text-xs font-semibold text-indigo-600">Học lại & liên hệ kiến thức</button>{!teacher && <button onClick={() => setPractice({ skillKey: s.key })} className="text-xs font-semibold text-emerald-600">Ôn kỹ năng này →</button>}</div></td>
            <td className="px-5 py-5 text-slate-600"><span className="font-semibold">{s.attempts}</span> lượt
                <details className="mt-2 max-w-xs"><summary className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800">Xem minh chứng</summary><div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">{s.evidence.map((e, i) =>
                    <div className="text-xs leading-relaxed" key={i}>Bài #{e.result_id} · Câu #{e.question_id}<br/><span className="text-slate-400">{new Date(e.date).toLocaleDateString('vi-VN')} · Đúng {Math.round(e.credit * 100)}%</span></div>)}</div></details>
            </td><td className="px-5 py-5">{compare ? <div className="font-semibold text-slate-700">{s.before.rate ?? '—'}% → {s.after.rate ?? '—'}%<p className="text-xs text-slate-400 font-normal mt-1">{s.before.n} lượt trước · {s.after.n} lượt sau</p></div> :
                <div className="min-w-[110px]"><div className="flex justify-between text-sm font-bold mb-2"><span className={s.confidence === 'INSUFFICIENT' ? 'text-slate-500' : s.rate < 70 ? 'text-amber-600' : 'text-emerald-600'}>{s.rate}%</span></div><div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${s.confidence === 'INSUFFICIENT' ? 'bg-slate-300' : s.rate < 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, Math.min(100, s.rate))}%` }}/></div>{s.confidence === 'INSUFFICIENT' && <p className="text-[10px] mt-2 text-slate-400">Chưa đủ mẫu</p>}</div>}</td>
            <td className="px-5 py-5">{compare ? s.delta === null ? <span className="text-xs text-slate-400">Cần 3 lượt mỗi phía</span> : <span className={`font-bold ${s.delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{s.delta > 0 ? '+' : ''}{s.delta} điểm %</span> : <span className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${s.weak_students > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{s.weak_students}/{s.students} học sinh</span>}</td>
        </tr>)}</tbody></table>{!rows.length && <div className="flex flex-col items-center py-16 px-6 text-center"><div className="rounded-2xl bg-slate-50 p-4 mb-4"><Search className="text-slate-300" size={28}/></div><p className="font-semibold text-slate-700">{loaded ? 'Chưa có kỹ năng phù hợp' : 'Bản đồ kỹ năng đang chờ bạn'}</p><p className="text-sm text-slate-400 mt-2 max-w-sm">{loaded ? 'Thử thay đổi bộ lọc hoặc bổ sung bài làm đã hoàn thành.' : teacher ? 'Chọn lớp và tải dữ liệu để khám phá những kỹ năng học sinh cần ôn tập.' : 'Hoàn thành bài thi để bắt đầu xây dựng bản đồ kỹ năng của bạn.'}</p></div>}
    </div>;
    return <div className="h-full overflow-auto bg-[#f6f8fc] text-slate-800"><div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <header className="relative overflow-hidden rounded-[28px] bg-[#172554] p-6 sm:p-8 text-white"><div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border-[50px] border-white/5"/><div className="pointer-events-none absolute right-48 -bottom-32 h-64 w-64 rounded-full bg-indigo-400/10"/><div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8"><div><div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-indigo-200"><Sparkles size={13}/> KHÔNG GIAN HỌC TẬP THÍCH ỨNG</div><h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">EduLoop <span className="text-cyan-300">AI</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100/75">Hiểu từng kỹ năng. Ôn tập đúng trọng tâm.<br/>Một vòng học tập tốt hơn, bắt đầu từ minh chứng thực tế.</p></div><div className="grid grid-cols-3 gap-3 lg:gap-6">{[{ icon: Search, label: 'Phân tích', text: 'Từ bài làm' }, { icon: ShieldCheck, label: 'Định hướng', text: 'Giáo viên duyệt' }, { icon: TrendingUp, label: 'Tiến bộ', text: 'Theo kỹ năng' }].map((step, i) => <div key={step.label} className="relative rounded-2xl bg-white/5 border border-white/10 px-3 py-4 sm:px-5"><step.icon size={20} className="text-cyan-300 mb-3"/><p className="font-semibold text-sm">{step.label}</p><p className="text-[11px] text-indigo-200/65 mt-1">{step.text}</p>{i < 2 && <ChevronRight size={14} className="absolute -right-3 top-1/2 text-indigo-300/50"/>}</div>)}</div></div></header>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between"><div><h2 className="text-xl font-bold tracking-tight">{teacher ? 'Tổng quan học tập' : 'Hành trình học tập của bạn'}</h2><p className="text-sm text-slate-500 mt-1">{teacher ? 'Theo dõi lớp học và cá nhân hóa kế hoạch cho từng học sinh.' : 'Khám phá điểm mạnh và những kỹ năng cần luyện tập thêm.'}</p></div><span className="inline-flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-400"/>Dữ liệu từ bài đã hoàn thành</span></div>
        <div className="rounded-2xl bg-white border border-slate-200/70 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end gap-4 shadow-sm">
        {teacher && <div className="flex flex-wrap gap-3">
            <label className="flex-1 min-w-[180px] text-xs font-semibold text-slate-500">Lớp học<select aria-label="Lớp" className="mt-2 block w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-3 text-sm text-slate-700" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Chọn lớp</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label className="flex-1 min-w-[180px] text-xs font-semibold text-slate-500">Học sinh<select aria-label="Học sinh" disabled={!classId || busy} className="mt-2 block w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-3 text-sm text-slate-700 disabled:opacity-50" value={studentId} onChange={e => { setStudentId(e.target.value); setSkills([]); setPlans([]); setProgress(null); setLoaded(false); setMessage(''); }}>
                <option value="">Toàn lớp</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select></label>
        </div>}
        {!teacher && <div className="flex-1 flex items-center gap-3"><div className="bg-indigo-50 rounded-xl p-3 text-indigo-600"><GraduationCap size={22}/></div><div><p className="text-sm font-semibold">{user?.full_name || 'Không gian cá nhân'}</p><p className="text-xs text-slate-400 mt-1">Bản đồ được xây dựng từ kết quả của bạn</p></div></div>}
        <button className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 lg:ml-auto shadow-sm`} disabled={busy || (teacher && !classId)} onClick={load}>{busy ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} {busy ? 'Đang xử lý...' : 'Cập nhật bản đồ'}</button></div>
        {message && <div role={error ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-xs leading-5 flex items-start gap-2 ${error ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-indigo-50/70 text-indigo-700'}`}><ShieldCheck size={16} className="shrink-0 mt-0.5"/>{message}</div>}
        {!teacher && <section className="bg-white rounded-2xl border border-indigo-100 p-5 flex flex-col sm:flex-row gap-4 sm:items-center"><div className="flex-1"><h2 className="font-bold">Ôn tập Adaptive trong EduLoop</h2><p className="text-sm text-slate-500 mt-1">Tự luyện từ lịch sử làm bài, hoặc chọn kế hoạch giáo viên đã duyệt bên dưới.</p></div><button onClick={() => setPractice({})} className={`${buttonClass} bg-indigo-600 text-white`}>Bắt đầu tự ôn tập<ArrowRight size={16}/></button></section>}
        {learningSkill && <div ref={learningActionsRef} tabIndex={-1} className="scroll-mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex-1"><p className="font-bold text-emerald-900">Ôn đúng dạng: {learningSkill.label}</p><p className="mt-1 text-sm text-emerald-700">Mã {learningSkill.key} · Mức {learningSkill.level}. Bài ôn chỉ lấy câu thuộc mã dạng này, không trộn dạng khác.</p>{teacher && <p className="mt-1 text-xs text-emerald-700">Giáo viên làm thử trên tài khoản của mình; không ghi bài làm cho học sinh đang xem.</p>}</div>
            <button onClick={() => setPractice({ skillKey: learningSkill.key })} className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700 shrink-0`}><BookOpen size={17}/>{teacher ? 'Làm thử đúng dạng này' : 'Bắt đầu ôn đúng dạng này'}<ArrowRight size={16}/></button>
        </div>}
        {learningSkill && <section className="rounded-2xl border border-indigo-100 bg-white p-5 space-y-4"><div className="flex items-start gap-3"><BookOpen className="text-indigo-600"/><div className="flex-1"><h2 className="font-bold">{learningSkill.unit_name} · {learningSkill.label}</h2><p className="text-xs text-slate-500 mt-2">{learningSkill.chapter_name} → {learningSkill.unit_name} → {learningSkill.label}</p></div><button aria-label="Đóng bài học" onClick={() => setLearningSkill(null)}><X size={20}/></button></div><div className="flex flex-wrap gap-2">{skills.filter(s => s.key !== learningSkill.key && s.unit_id && s.unit_id === learningSkill.unit_id).map(s => <button key={s.key} className="rounded-xl bg-indigo-50 text-indigo-700 px-3 py-2 text-xs" onClick={() => void openLearning(s)}>{s.label} · Mức {s.level}</button>)}</div><p className="text-xs text-slate-400">Các kỹ năng liên quan cùng bài học; đây là quan hệ trong chương trình, chưa phải quan hệ tiên quyết.</p>{lessonBusy ? <p role="status">Đang tải bài học…</p> : lessonError ? <p role="alert" className="text-sm text-rose-600">{lessonError}</p> : lessons.length ? lessons.map(l => <article key={l.id} className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold mb-3">{l.title}</h3>{l.content && <MathRenderer content={l.content} hideToolbar/>}{l.video_url && /^https:\/\//i.test(l.video_url) && <a className="inline-block mt-3 text-sm text-indigo-600" href={l.video_url} target="_blank" rel="noopener noreferrer">Xem video bài học ↗</a>}{l.interactive_html && <iframe title={l.title} sandbox="allow-scripts" srcDoc={l.interactive_html} className="mt-3 w-full min-h-[400px] border rounded-xl"/>}<button className="mt-3 text-xs text-indigo-600" onClick={async () => { try { await apiService.updateUserLessonProgress({ user_id: user!.id, section_id: l.id, is_completed: true, score: 0 }); setMessage(`Đã ghi nhận học xong: ${l.title}`); } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Không lưu được tiến độ.'); } }}>Đánh dấu đã học</button></article>) : <p className="text-sm text-slate-500">Bài này chưa có nội dung học. Bạn vẫn có thể luyện câu hỏi cùng kỹ năng.</p>}{!teacher && <button className={`${buttonClass} bg-emerald-600 text-white`} onClick={() => setPractice({ skillKey: learningSkill.key })}>Ôn tập sau khi học<ArrowRight size={16}/></button>}</section>}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">{[{ label: 'Kỹ năng đã ghi nhận', value: skills.length, icon: Layers3, color: 'bg-indigo-50 text-indigo-600', caption: 'Từ minh chứng bài làm' }, { label: 'Kỹ năng cần củng cố', value: weakSkills.length, icon: Target, color: 'bg-amber-50 text-amber-600', caption: 'Tỷ lệ đúng dưới 70%' }, { label: 'Kỹ năng đạt từ 70%', value: readySkills.length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', caption: 'Có ít nhất 3 lượt làm' }, { label: 'Kế hoạch chờ duyệt', value: plans.filter(p => p.status === 'PENDING').length, icon: ClipboardCheck, color: 'bg-sky-50 text-sky-600', caption: 'Đang chờ giáo viên xem xét' }].map(stat => <div key={stat.label} className="rounded-2xl bg-white border border-slate-200/70 p-4 sm:p-5"><div className="flex justify-between items-center gap-2"><span className="text-xs font-medium text-slate-500">{stat.label}</span><div className={`p-2 rounded-xl ${stat.color}`}><stat.icon size={17}/></div></div><p className="mt-3 text-3xl font-bold tracking-tight">{loaded ? stat.value : '—'}</p><p className="mt-2 text-[11px] text-slate-400">{stat.caption}</p></div>)}</div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start"><section className="min-w-0 rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm"><div className="px-6 pt-6 pb-4"><div className="flex gap-3 items-center"><div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Target size={20}/></div><div><h2 className="font-bold text-lg">Bản đồ kỹ năng</h2><p className="text-xs text-slate-400 mt-1">Learning Gap Map · Nhìn rõ từng khoảng trống</p></div></div><div className="mt-5 flex flex-col sm:flex-row gap-3 justify-between"><div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1">{[{ id: 'ALL', label: 'Tất cả' }, { id: 'WEAK', label: 'Cần củng cố' }, { id: 'INSUFFICIENT', label: 'Chưa đủ mẫu' }].map(f => <button key={f.id} onClick={() => setSkillFilter(f.id)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${skillFilter === f.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{f.label}</button>)}</div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Tìm kỹ năng" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kỹ năng…" className="w-full sm:w-44 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs"/></div></div></div>{table(visibleSkills)}<div className="px-6 py-4 border-t border-slate-100 text-[11px] leading-5 text-slate-400">Kỹ năng được nhóm theo dạng ID6. Tỷ lệ đúng phản ánh bài làm quan sát, không phải điểm năng lực IRT.</div></section>
        <aside className="space-y-4">{teacher && <section className="rounded-2xl bg-white border border-slate-200/70 p-5"><div className="flex gap-3 items-center"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Sparkles size={20}/></div><h2 className="font-bold">Kế hoạch cá nhân hóa</h2></div><p className="mt-4 text-sm text-slate-500 leading-6">Chọn một học sinh để tạo kế hoạch ôn tập từ những kỹ năng cần củng cố.</p><div className="my-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 leading-5">Ưu tiên kỹ năng dưới 70%, có ít nhất 3 lượt làm. Mỗi câu ôn tập đi kèm lý do và minh chứng.</div><button disabled={busy || !studentId || !classId} className={`${buttonClass} w-full bg-indigo-600 text-white hover:bg-indigo-700`} onClick={() => mutate('/recommendations', filters)}><Sparkles size={16}/>Tạo đề xuất chờ duyệt</button><label className="block mt-5 text-xs font-semibold text-slate-600">Ghi chú của giáo viên<textarea aria-label="Ghi chú quyết định" className="mt-2 border border-slate-200 bg-slate-50 rounded-xl p-3 w-full min-h-[100px] resize-y text-xs font-normal leading-5" placeholder="Nhận xét khi duyệt hoặc từ chối kế hoạch…" value={note} maxLength={2000} onChange={e => setNote(e.target.value)}/></label></section>}<section className="rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100/60 p-5"><BookOpen size={24} className="text-indigo-500"/><h3 className="font-bold mt-3">Mỗi đề xuất đều có căn cứ</h3><p className="text-xs leading-6 text-slate-500 mt-2">Giáo viên xem xét minh chứng trước khi duyệt. Học sinh luyện tập theo kế hoạch và theo dõi sự thay đổi qua từng kỹ năng.</p><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600"><ShieldCheck size={15}/>Giáo viên luôn quyết định</div></section></aside></div>
        <section><div className="flex justify-between items-center mb-4"><div><h2 className="text-xl font-bold">{teacher ? 'Đề xuất & phê duyệt' : 'Kế hoạch ôn tập'}</h2><p className="mt-1 text-sm text-slate-500">{teacher ? 'Xem minh chứng, lựa chọn hướng ôn tập phù hợp.' : 'Bắt đầu từ kế hoạch giáo viên đã duyệt cho bạn.'}</p></div><span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-500">{plans.length} kế hoạch</span></div><div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {!plans.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center"><ClipboardCheck size={28} className="mx-auto text-slate-300 mb-3"/><p className="font-semibold text-slate-600">Chưa có kế hoạch ôn tập</p><p className="text-sm text-slate-400 mt-2">{teacher ? 'Chọn học sinh và tạo đề xuất để bắt đầu vòng học tập mới.' : 'Kế hoạch sẽ xuất hiện khi giáo viên tạo đề xuất cho bạn.'}</p></div>}
        {plans.map(p => <article key={p.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-400 tracking-wide">KẾ HOẠCH #{p.id}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : p.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>{({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối' } as Record<string, string>)[p.status]}</span></div><div><h3 className="font-bold flex items-center gap-2"><Users size={16} className="text-indigo-400"/>{students.find(s => s.id === p.student_id)?.full_name || (teacher ? `Học sinh #${p.student_id}` : 'Kế hoạch dành cho bạn')}</h3><p className="text-xs text-slate-400 mt-2">{p.payload.length} câu hỏi · Ôn tập theo minh chứng</p></div>
            <div className="space-y-3 max-h-60 overflow-auto pr-1">{p.payload.map((item, i) => <div key={item.question_id} className="flex gap-3"><span className="shrink-0 h-6 w-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">{i + 1}</span><div><p className="text-xs font-semibold text-slate-700">Câu #{item.question_id}</p><p className="text-xs leading-5 text-slate-500 mt-1">{item.reason}</p></div></div>)}</div>
            {p.decision_note && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 leading-5"><span className="font-semibold">Giáo viên: </span>{p.decision_note}</p>}
            {teacher && p.status === 'PENDING' && <div className="flex gap-3">
                <button disabled={busy} className={`${buttonClass} flex-1 bg-emerald-600 text-white hover:bg-emerald-700`} onClick={() => mutate(`/recommendations/${p.id}/decision`, { status: 'APPROVED', note })}><CheckCircle2 size={15}/>Duyệt kế hoạch</button>
                <button disabled={busy} className={`${buttonClass} bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600`} onClick={() => mutate(`/recommendations/${p.id}/decision`, { status: 'REJECTED', note })}><X size={15}/>Từ chối</button>
            </div>}
            {!teacher && p.status === 'APPROVED' && <button className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`} onClick={() => setPractice({ recommendationId: String(p.id) })}>Bắt đầu ôn tập<ArrowRight size={16}/></button>}
            {p.status === 'APPROVED' && <button disabled={busy} className="mt-auto inline-flex gap-2 items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-3 border-t border-slate-100" onClick={() => showProgress(p.id)}><TrendingUp size={16}/>Xem tiến độ trước – sau<ArrowRight size={14} className="ml-auto"/></button>}
        </article>)}</div></section>
        {progress && <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden"><div className="p-6 flex gap-3 items-center"><TrendingUp size={22} className="text-emerald-500"/><div><h2 className="font-bold text-lg">Tiến độ theo kỹ năng</h2><p className="text-xs text-slate-400 mt-1">So sánh trước và sau khi kế hoạch được duyệt</p></div><button aria-label="Đóng tiến độ" onClick={() => setProgress(null)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X size={18}/></button></div>{table(progress, true)}</section>}
        {teacher && learningSkill?.unit_id && <button className={`${buttonClass} bg-indigo-600 text-white`} onClick={() => setProposalUnitId(learningSkill.unit_id!)}><Sparkles size={16}/>AI đề xuất ma trận cho bài {learningSkill.unit_name}</button>}
        {teacher && proposalUnitId && <LessonMatrixProposal unitId={proposalUnitId} onClose={() => setProposalUnitId(null)}/>}
        <footer className="text-center text-[11px] text-slate-400 py-2">EduLoop AI · Minh chứng dẫn đường, giáo viên định hướng, học sinh tiến bộ.</footer>
    </div></div>;
};
