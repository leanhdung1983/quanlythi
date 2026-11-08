import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { ArrowRight, BookOpen, Loader2, RefreshCw, Search } from 'lucide-react';

type PracticeForm = {
    key: string;
    grade: number;
    subject: string;
    chapter: number;
    unit: number;
    count: number;
    label: string;
    unit_name: string;
    chapter_name: string;
    available: number;
    levels: Record<string, number>;
    types: Record<string, number>;
};

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
        apiService.eduLoop('/practice-catalog').then(result => {
            if (!active) return;
            const data = result.data || [];
            setForms(data);
            setGrade(current => data.some((form: PracticeForm) => String(form.grade) === current) ? current : String(data[0]?.grade || 12));
        }).catch(e => {
            if (active) setError(e instanceof Error ? e.message : 'Không tải được danh sách dạng bài.');
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [revision]);

    const grades = [...new Set(forms.map(form => form.grade))].sort((a, b) => b - a);
    const inGrade = forms.filter(form => String(form.grade) === grade);
    const units = [...new Map(inGrade.map(form => [unitKey(form), form])).values()];
    const filtered = inGrade.filter(form => 
        (!unit || unitKey(form) === unit) && 
        `${form.label} ${form.unit_name} ${form.key}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <section id="practice-catalog" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex gap-2.5 items-start">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <BookOpen size={18}/>
                </div>
                <div>
                    <h2 className="font-bold text-sm sm:text-base text-slate-900">
                        {beginner ? 'Bắt đầu ôn từng dạng của bài' : 'Ôn tập theo bài học & dạng câu hỏi'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {beginner 
                            ? 'Chưa có lịch sử thi? Chọn một bài học rồi luyện tập từng dạng từ cơ bản. Kết quả sẽ tự động đưa vào bản đồ năng lực sau khi nộp bài.' 
                            : 'Chọn đúng dạng kiến thức muốn củng cố. Chỉ hiển thị các dạng hiện có câu hỏi sẵn sàng trong ngân hàng.'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div role="status" className="flex items-center gap-2 text-xs font-bold text-blue-600 py-4">
                    <Loader2 className="animate-spin" size={16}/> Đang tải các dạng bài có thể ôn tập...
                </div>
            ) : error ? (
                <div role="alert" className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <p>{error}</p>
                    <button 
                        onClick={() => { setLoading(true); setError(''); setRevision(n => n + 1); }} 
                        className="inline-flex items-center gap-1.5 mt-2 font-bold text-rose-700 hover:underline"
                    >
                        <RefreshCw size={13}/> Thử tải lại
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid gap-2.5 sm:grid-cols-[130px_1fr_1fr]">
                        <label className="text-xs font-bold text-slate-600">
                            Khối lớp
                            <select 
                                className="block mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 hover:bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer" 
                                value={grade} 
                                onChange={e => { setGrade(e.target.value); setUnit(''); setLimit(24); }}
                            >
                                {grades.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                            </select>
                        </label>
                        
                        <label className="text-xs font-bold text-slate-600">
                            Bài học
                            <select 
                                className="block mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 hover:bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer" 
                                value={unit} 
                                onChange={e => { setUnit(e.target.value); setLimit(24); }}
                            >
                                <option value="">Tất cả bài học</option>
                                {units.map(u => <option key={unitKey(u)} value={unitKey(u)}>{u.chapter_name} · {u.unit_name}</option>)}
                            </select>
                        </label>

                        <label className="text-xs font-bold text-slate-600">
                            Tìm dạng bài
                            <div className="relative mt-1">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input 
                                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 hover:bg-white focus:bg-white pl-8 pr-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" 
                                    value={search} 
                                    placeholder="Tên dạng, bài học hoặc ID6..." 
                                    onChange={e => { setSearch(e.target.value); setLimit(24); }}
                                />
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-1">
                        <span>{filtered.length} dạng câu hỏi có sẵn trong ngân hàng</span>
                        <span className="text-slate-400">Gợi ý theo khung chương trình</span>
                    </div>

                    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.slice(0, limit).map(form => (
                            <article 
                                key={form.key} 
                                className="rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between gap-2.5 hover:border-blue-300 hover:shadow-2xs transition-all bg-white group"
                            >
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 truncate">
                                        {form.chapter_name} · {form.unit_name}
                                    </p>
                                    <h3 className="font-bold text-xs sm:text-sm text-slate-800 mt-1 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        Dạng {form.count}: {form.label}
                                    </h3>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                        <span className="font-bold text-slate-700">{form.available} câu</span>
                                        <span>·</span>
                                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                            {['N','H','V','C'].filter(l => form.levels[l]).map(l => `${l}:${form.levels[l]}`).join(' ')}
                                        </span>
                                    </div>

                                    <button 
                                        onClick={() => onSelect(form.key)} 
                                        className="mt-2.5 w-full h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition-all flex items-center justify-between shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
                                    >
                                        <span>Ôn dạng này</span>
                                        <ArrowRight size={14}/>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {!filtered.length && (
                        <p className="text-xs text-slate-500 rounded-xl bg-slate-50 p-4 border border-slate-200 text-center">
                            Chưa tìm thấy dạng phù hợp với điều kiện lọc. Thầy cô hoặc học viên vui lòng chọn bài khác hoặc bổ sung câu hỏi vào ngân hàng.
                        </p>
                    )}

                    {filtered.length > limit && (
                        <div className="text-center pt-2">
                            <button 
                                onClick={() => setLimit(n => n + 24)} 
                                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                            >
                                Xem thêm các dạng tiếp theo ({filtered.length - limit} dạng)
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
