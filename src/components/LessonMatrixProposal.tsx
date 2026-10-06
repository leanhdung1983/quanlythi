import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Loader2, Save, Sparkles, X } from 'lucide-react';
type Row = { key: string; type: 'TN' | 'TF' | 'KQ'; counts: Record<string, number>; available: Record<string, number> };
export const LessonMatrixProposal: React.FC<{ unitId: number; onClose: () => void; onSaved?: () => void }> = ({ unitId, onClose, onSaved }) => {
    const [rows, setRows] = useState<Row[]>([]);
    const [name, setName] = useState('');
    const [rationale, setRationale] = useState('');
    const [duration, setDuration] = useState(30);
    const [points, setPoints] = useState({ TN: 6, TF: 2, KQ: 2 });
    const [grade, setGrade] = useState(12);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [savedId, setSavedId] = useState<number | null>(null);
    useEffect(() => {
        let active = true;
        apiService.proposeLessonMatrix(unitId).then(r => {
            if (!active) return;
            const data = r.data;
            setRows(data.inventory.map((i: Row) => ({ ...i, counts: data.rows.find((r: Row) => r.key === i.key && r.type === i.type)?.counts || { N: 0, H: 0, V: 0, C: 0 } })));
            setName(data.name); setRationale(data.rationale); setGrade(Number(data.unit.grade_code) || 12);
            const totals: Record<string, number> = { TN: 0, TF: 0, KQ: 0 };
            data.rows.forEach((r: Row) => { totals[r.type] += Object.values(r.counts).reduce((a, b) => a + b, 0); });
            const total = Object.values(totals).reduce((a, b) => a + b, 0);
            const tn = Math.round(totals.TN / total * 100) / 10;
            const tf = Math.round(totals.TF / total * 100) / 10;
            setPoints({ TN: tn, TF: tf, KQ: Math.round((10 - tn - tf) * 10) / 10 });
        }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
        return () => { active = false; };
    }, [unitId]);
    const save = async () => {
        const matrix: Record<string, Record<string, Record<string, number>>> = { TN: {}, TF: {}, KQ: {}, TL: {} };
        const totals = { TN: 0, TF: 0, KQ: 0 };
        for (const row of rows) {
            for (const level of ['N','H','V','C']) if (!Number.isInteger(row.counts[level]) || row.counts[level] < 0 || row.counts[level] > row.available[level]) return setError('Số câu phải là số nguyên và không vượt số câu sẵn có.');
            const count = Object.values(row.counts).reduce((a, b) => a + b, 0);
            if (count) matrix[row.type][row.key] = row.counts;
            totals[row.type] += count;
        }
        const total = Object.values(totals).reduce((a,b) => a+b,0);
        if (!name.trim() || total < 1 || total > 100 || !Number.isFinite(duration) || duration < 1 || duration > 1440) return setError('Nhập tên, thời gian 1–1440 phút và tổng số câu 1–100.');
        if (Object.values(points).some(p => !Number.isFinite(p) || p < 0) || Math.abs(points.TN + points.TF + points.KQ - 10) > 0.001 || Object.entries(totals).some(([t,n]) => n === 0 ? points[t as keyof typeof points] !== 0 : points[t as keyof typeof points] <= 0)) return setError('Tổng điểm phải bằng 10; phần có câu cần có điểm, phần không có câu phải là 0 điểm.');
        setBusy(true); setError('');
        try {
            const r = await apiService.saveMatrix(name.trim(), { matrix, catalog: { target_grade: grade, purpose: 'PRACTICE', status: 'READY' }, settings: { grade_id: grade, duration, mode: 'PRACTICE', total_points_tn: points.TN, total_points_tf: points.TF, total_points_kq: points.KQ, tf_scoring_mode: '10-25-50-100' }, source: { unit_id: unitId, ai_proposed: true, teacher_reviewed: true } });
            setSavedId(r.id); onSaved?.();
        } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được ma trận.'); }
        finally { setBusy(false); }
    };
    return <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="AI đề xuất ma trận bài học" className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6 space-y-4"><div className="flex items-center justify-between"><h2 className="font-bold text-xl flex items-center gap-2"><Sparkles className="text-indigo-600"/>AI đề xuất ma trận</h2><button aria-label="Đóng" disabled={busy && rows.length > 0} onClick={onClose}><X/></button></div><p className="text-sm text-slate-500">Kiểm tra số câu theo mức độ, thời gian và điểm trước khi lưu. N: Nhận biết · H: Thông hiểu · V: Vận dụng · C: Vận dụng cao.</p>{error && <p role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">{error}</p>}{busy && !rows.length ? <div role="status" className="py-12 flex justify-center gap-3"><Loader2 className="animate-spin"/>AI đang phân tích bài học và ngân hàng câu hỏi…</div> : savedId ? <div className="p-6 bg-emerald-50 rounded-xl text-emerald-800">Đã lưu ma trận #{savedId}. Bạn có thể mở trong thư viện ma trận để tạo đề hoặc giao cho lớp.<button onClick={onClose} className="block mt-4 underline">Hoàn tất</button></div> : rows.length > 0 && <><p className="p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800">{rationale}</p><label className="block text-sm">Tên ma trận<input className="block w-full border rounded-xl p-3 mt-1" value={name} onChange={e => setName(e.target.value)}/></label><div className="overflow-auto"><table className="w-full text-sm"><thead><tr><th className="text-left p-2">Dạng / Loại câu</th>{['N','H','V','C'].map(l => <th key={l}>{l}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={`${r.type}-${r.key}`} className="border-t"><td className="p-3 font-mono text-xs">{r.key} · {r.type}</td>{['N','H','V','C'].map(l => <td key={l} className="p-2"><input aria-label={`${r.type} ${r.key} ${l}`} disabled={busy} type="number" min="0" max={r.available[l]} className="w-16 border rounded-lg p-2" value={r.counts[l]} onChange={e => setRows(old => old.map((row,j) => j === i ? { ...row, counts: { ...row.counts, [l]: Number(e.target.value) } } : row))}/><p className="text-[10px] text-slate-400 mt-1">Có {r.available[l]} câu</p></td>)}</tr>)}</tbody></table></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><label className="text-xs">Thời gian (phút)<input type="number" min="1" max="1440" className="w-full border rounded-lg p-2 mt-1" value={duration} onChange={e => setDuration(Number(e.target.value))}/></label>{(['TN','TF','KQ'] as const).map(t => <label key={t} className="text-xs">Tổng điểm {t}<input type="number" min="0" step="0.1" className="w-full border rounded-lg p-2 mt-1" value={points[t]} onChange={e => setPoints(p => ({ ...p, [t]: Number(e.target.value) }))}/></label>)}</div><button disabled={busy} onClick={() => void save()} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold flex gap-2 items-center disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}Đã kiểm tra · Lưu ma trận</button></>}</section></div>;
};
