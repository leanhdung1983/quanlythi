import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { ArrowRight, BookOpen, Loader2, RefreshCw } from 'lucide-react';

type PracticeForm = { key: string; grade: number; subject: string; chapter: number; unit: number; count: number;
    label: string; unit_name: string; chapter_name: string; available: number; levels: Record<string, number>; types: Record<string, number> };
const unitKey = (form: PracticeForm) => form.key.slice(0, form.key.lastIndexOf('-'));
export function PracticeCatalog({ onSelect, beginner = false }: { onSelect: (key: string) => void; beginner?: boolean }) {
    const [forms, setForms] = useState<PracticeForm[]>([]);
    const [grade, setGrade] = useState('12');
    const [unit, setUnit] = useState('');
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(24);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError('');
        apiService.eduLoop('/practice-catalog').then(result => {
            if (!active) return;
            const data = result.data || [];
            setForms(data);
            setGrade(current => data.some((form: PracticeForm) => String(form.grade) === current) ? current : String(data[0]?.grade || 12));
        }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không tải được danh sách dạng bài.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [revision]);
    const grades = [...new Set(forms.map(form => form.grade))].sort((a, b) => b - a);
    const inGrade = forms.filter(form => String(form.grade) === grade);
    const units = [...new Map(inGrade.map(form => [unitKey(form), form])).values()];
    const filtered = inGrade.filter(form => (!unit || unitKey(form) === unit) && `${form.label} ${form.unit_name} ${form.key}`.toLowerCase().includes(search.toLowerCase()));
    return <section id="practice-catalog" className="rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex gap-3 items-start"><BookOpen className="text-indigo-600 shrink-0"/><div><h2 className="font-bold text-lg">{beginner ? 'Bắt đầu ôn từng dạng của bài' : 'Ôn tập theo bài và dạng'}</h2><p className="text-sm text-slate-500 mt-1">{beginner ? 'Chưa có lịch sử? Chọn bài học rồi ôn từng dạng, bắt đầu với câu cơ bản. Sau khi nộp bài, hệ thống sẽ dùng kết quả để gợi ý ôn tập phù hợp.' : 'Chọn đúng dạng muốn củng cố. Chỉ hiển thị các dạng hiện có câu hỏi trong ngân hàng.'}</p></div></div>
        {loading ? <p role="status" className="flex gap-2 text-sm text-indigo-600"><Loader2 className="animate-spin" size={18}/>Đang tải các dạng có thể ôn…</p> : error ? <div role="alert" className="text-sm text-rose-600"><p>{error}</p><button onClick={() => setRevision(n => n + 1)} className="inline-flex items-center gap-2 mt-2 font-semibold"><RefreshCw size={15}/>Thử tải lại</button></div> : <>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr]">
                <label className="text-xs text-slate-600">Khối lớp<select className="block mt-1 w-full rounded-xl border p-2.5 text-sm" value={grade} onChange={e => { setGrade(e.target.value); setUnit(''); setLimit(24); }}>{grades.map(g => <option key={g} value={g}>Lớp {g}</option>)}</select></label>
                <label className="text-xs text-slate-600">Bài học<select className="block mt-1 w-full rounded-xl border p-2.5 text-sm" value={unit} onChange={e => { setUnit(e.target.value); setLimit(24); }}><option value="">Tất cả bài học</option>{units.map(u => <option key={unitKey(u)} value={unitKey(u)}>{u.chapter_name} · {u.unit_name}</option>)}</select></label>
                <label className="text-xs text-slate-600">Tìm dạng bài<input className="block mt-1 w-full rounded-xl border p-2.5 text-sm" value={search} placeholder="Tên dạng, bài học hoặc ID6…" onChange={e => { setSearch(e.target.value); setLimit(24); }}/></label>
            </div>
            <p className="text-xs text-slate-400">{filtered.length} dạng có câu hỏi · Gợi ý theo chương trình, chưa phải đánh giá năng lực.</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.slice(0, limit).map(form => <article key={form.key} className="rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
                <div><p className="text-xs text-slate-500">{form.chapter_name} · {form.unit_name}</p><h3 className="font-semibold mt-2 text-slate-800">Dạng {form.count}: {form.label}</h3></div>
                <p className="text-xs text-slate-500">{form.available} câu · {['N','H','V','C'].filter(l => form.levels[l]).map(l => `${l}: ${form.levels[l]}`).join(' · ')}</p>
                <button onClick={() => onSelect(form.key)} className="mt-auto inline-flex items-center justify-between gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 font-semibold text-sm text-indigo-700 hover:bg-indigo-100">Ôn dạng này<ArrowRight size={16}/></button>
            </article>)}</div>
            {!filtered.length && <p className="text-sm text-slate-500 rounded-xl bg-slate-50 p-4">Chưa có dạng phù hợp. Chọn bài khác hoặc nhờ giáo viên bổ sung câu hỏi.</p>}
            {filtered.length > limit && <button onClick={() => setLimit(n => n + 24)} className="text-sm font-semibold text-indigo-600">Xem thêm dạng bài</button>}
        </>}
    </section>;
}
