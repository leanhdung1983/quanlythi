import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';

type Skill = { key: string; label: string; chapter_name: string; unit_name: string; level: string;
    rate: number; attempts: number; students: number; weak_students: number; confidence: string;
    before: { rate: number | null; n: number }; after: { rate: number | null; n: number }; delta: number | null;
    evidence: { result_id: number; question_id: number; date: string; credit: number }[] };
type Plan = { id: number; student_id: number; status: string; decision_note?: string; reviewed_at?: string;
    payload: { question_id: number; skill: string; reason: string }[] };

export const EduLoop: React.FC = () => {
    const { user } = useAuthStore();
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
    const filters = teacher ? { class_id: classId, student_id: studentId } : {};
    const load = useCallback(async () => {
        if (teacher && !classId) return;
        setBusy(true); setMessage(''); setProgress(null);
        try {
            const map = await apiService.eduLoop('/map', teacher ? { class_id: classId, student_id: studentId } : {});
            setSkills(map.data.skills);
            const list = await apiService.eduLoop('/recommendations', teacher ? { class_id: classId, student_id: studentId } : {});
            setPlans(list.data);
            setMessage(`${map.result_count} bài đã hoàn thành; ${map.data.skipped} câu thiếu ID6/đáp án hoặc chưa chấm được bỏ qua.`);
        } catch (e) { setSkills([]); setPlans([]); setMessage(e instanceof Error ? e.message : 'Không tải được dữ liệu.'); }
        finally { setBusy(false); }
    }, [teacher, classId, studentId]);
    useEffect(() => {
        if (teacher) apiService.eduLoopClasses().then(r => setClasses(r.data)).catch(e => setMessage(e.message));
    }, [teacher]);
    useEffect(() => {
        let active = true;
        setStudentId(''); setStudents([]); setSkills([]); setPlans([]); setProgress(null);
        if (classId) apiService.eduLoopStudents(classId).then(r => {
            if (active) setStudents(r.data.filter((s: { status: string }) => s.status === 'APPROVED'));
        }).catch(e => { if (active) setMessage(e.message); });
        return () => { active = false; };
    }, [classId]);
    useEffect(() => { if (!teacher) void load(); }, [teacher, load]);
    const mutate = async (path: string, body: Record<string, unknown>) => {
        setBusy(true);
        try { await apiService.eduLoop(path, body, 'POST'); await load(); }
        catch (e) { setMessage(e instanceof Error ? e.message : 'Không lưu được.'); }
        finally { setBusy(false); }
    };
    const showProgress = async (id: number) => {
        setBusy(true);
        try { const r = await apiService.eduLoop(`/recommendations/${id}/progress`); setProgress(r.data.skills); setMessage(r.note); }
        catch (e) { setMessage(e instanceof Error ? e.message : 'Không tải được tiến độ.'); }
        finally { setBusy(false); }
    };
    const table = (rows: Skill[], compare = false) => <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="w-full text-sm text-left"><thead><tr className="bg-indigo-50">
            <th className="p-3">Chương / Bài / Kỹ năng / Mức độ</th><th className="p-3">Minh chứng</th>
            <th className="p-3">{compare ? 'Trước → Sau' : 'Mức đúng'}</th><th className="p-3">{compare ? 'Thay đổi' : 'Học sinh'}</th>
        </tr></thead><tbody>{rows.map(s => <tr key={s.key} className="border-t">
            <td className="p-3">{s.chapter_name} / {s.unit_name}<br/><b>{s.label}</b> · {s.level}<br/>{s.key}</td>
            <td className="p-3">{s.attempts} lượt
                <details><summary className="cursor-pointer">Xem bằng chứng</summary>{s.evidence.map((e, i) =>
                    <div key={i}>Bài #{e.result_id} · Câu #{e.question_id} · {new Date(e.date).toLocaleDateString('vi-VN')} · {Math.round(e.credit * 100)}%</div>)}</details>
            </td><td className="p-3">{compare ? `${s.before.rate ?? '—'}% (${s.before.n}) → ${s.after.rate ?? '—'}% (${s.after.n})` :
                <>{s.rate}% {s.confidence === 'INSUFFICIENT' && <span>· Chưa đủ mẫu</span>}</>}</td>
            <td className="p-3">{compare ? s.delta === null ? 'Chưa đủ 3 lượt mỗi phía' : `${s.delta > 0 ? '+' : ''}${s.delta} điểm %` : `${s.weak_students}/${s.students} cần ôn`}</td>
        </tr>)}</tbody></table>{!rows.length && <p className="p-4">Chưa có minh chứng phù hợp.</p>}
    </div>;
    return <div className="p-6 space-y-5 overflow-auto h-full">
        <h1 className="text-2xl font-bold">EduLoop AI / QuanLyThi Adaptive</h1>
        <p>AI đề xuất – Giáo viên quyết định – Học sinh tiến bộ. Kỹ năng hiện được biểu diễn bằng dạng ID6; tỷ lệ đúng không phải điểm năng lực IRT.</p>
        {teacher && <div className="flex flex-wrap gap-3">
            <select aria-label="Lớp" className="border rounded p-2" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Chọn lớp</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select aria-label="Học sinh" className="border rounded p-2" value={studentId} onChange={e => { setStudentId(e.target.value); setSkills([]); setPlans([]); setProgress(null); }}>
                <option value="">Toàn lớp</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
        </div>}
        <button className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50" disabled={busy || (teacher && !classId)} onClick={load}>{busy ? 'Đang xử lý...' : 'Tải bản đồ & đề xuất'}</button>
        <p role="status">{message}</p>
        <h2 className="text-lg font-bold">Learning Gap Map</h2>{table(skills)}
        {teacher && <div className="space-y-2">
            <button disabled={busy || !studentId || !classId} className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50" onClick={() => mutate('/recommendations', filters)}>Tạo đề xuất chờ duyệt</button>
            <p>Ưu tiên dạng có ít nhất 3 lượt và mức đúng dưới 70%. Không bổ sung câu ngẫu nhiên vào kế hoạch giáo viên duyệt.</p>
            <textarea aria-label="Ghi chú quyết định" className="border rounded p-2 w-full" placeholder="Ghi chú của giáo viên khi duyệt / từ chối" value={note} maxLength={2000} onChange={e => setNote(e.target.value)} />
        </div>}
        <h2 className="text-lg font-bold">Đề xuất & phê duyệt</h2>
        {!plans.length && <p>Chưa có đề xuất.</p>}
        {plans.map(p => <article key={p.id} className="border rounded-xl bg-white p-4 space-y-3">
            <h3 className="font-bold">#{p.id} · Học sinh #{p.student_id} · {({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối' } as Record<string, string>)[p.status]}</h3>
            {p.payload.map(item => <p key={item.question_id}>Câu #{item.question_id}: {item.reason}</p>)}
            {p.decision_note && <p>Giáo viên: {p.decision_note}</p>}
            {teacher && p.status === 'PENDING' && <div className="flex gap-3">
                <button disabled={busy} className="text-green-700 underline" onClick={() => mutate(`/recommendations/${p.id}/decision`, { status: 'APPROVED', note })}>Duyệt kế hoạch</button>
                <button disabled={busy} className="text-red-700 underline" onClick={() => mutate(`/recommendations/${p.id}/decision`, { status: 'REJECTED', note })}>Từ chối</button>
            </div>}
            {!teacher && p.status === 'APPROVED' && <Link className="text-indigo-700 underline" to={`/adaptive?recommendation_id=${p.id}`}>Ôn tập kế hoạch đã duyệt</Link>}
            {p.status === 'APPROVED' && <button disabled={busy} className="text-indigo-700 underline block" onClick={() => showProgress(p.id)}>Xem tiến độ trước – sau</button>}
        </article>)}
        {progress && <section className="space-y-3"><h2 className="font-bold">Tiến độ theo kỹ năng</h2>{table(progress, true)}</section>}
    </div>;
};
