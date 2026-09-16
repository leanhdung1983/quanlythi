import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCopy, ExternalLink, RefreshCw, Search, Trash2 } from 'lucide-react';
import { MathRenderer } from '../components/MathRenderer';

type Question = { id: number; id_full: string; raw_latex: string; description: string; used_count: number };
type Post = { id: number; question_id: number; id_full: string | null; raw_latex: string | null;
    caption: string; scheduled_at: string; status: string; has_image: number; last_error: string | null };

async function api(url: string, body?: object) {
    const response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
}
const templateDefault = '📘 Bài toán ngày {NGAY}\n\nChủ đề: {CHUDE}\nMã ID6: {ID}\n\nBạn hãy thử giải và chia sẻ đáp án ở bình luận nhé!\n\n#LuyenToanThongMinh #ID6';
const tomorrow = () => { const d = new Date(Date.now() + 86_400_000); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };
const localTime = (value: string) => new Date(`${String(value).replace(' ', 'T')}Z`).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export const ManualSocialPlanner: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const [preview, setPreview] = useState<number | null>(null);
    const [start, setStart] = useState(tomorrow);
    const [days, setDays] = useState(1);
    const [template, setTemplate] = useState(templateDefault);
    const [edits, setEdits] = useState<Record<number, string>>({});
    const [images, setImages] = useState<Record<number, string>>({});
    const [filter, setFilter] = useState<'DRAFT' | 'POSTED' | 'ALL'>('DRAFT');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadQuestions = async (term = '') => {
        try { setQuestions((await api(`/api/admin/social/questions?limit=60&search=${encodeURIComponent(term)}`)).data || []); }
        catch (e: any) { setError(e.message); }
    };
    const loadPosts = async () => {
        try {
            const rows = (await api('/api/admin/social/queue')).data || [];
            setPosts(rows);
            setEdits(Object.fromEntries(rows.map((row: Post) => [row.id, row.caption])));
        } catch (e: any) { setError(e.message); }
    };
    useEffect(() => { void loadQuestions(); void loadPosts(); }, []);

    const toggle = (id: number) => setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
    const perform = async (fn: () => Promise<void>) => {
        setBusy(true); setError(''); setMessage('');
        try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
    };
    const prepare = () => perform(async () => {
        if (!selected.length) throw new Error('Hãy chọn ít nhất một câu.');
        const result = await api('/api/admin/social/prepare', {
            question_ids: selected, scheduled_start: new Date(start).toISOString(), interval_days: days, caption_template: template
        });
        setSelected([]); setMessage(`Đã tạo ${result.data.length} bài. Hệ thống không tự đăng lên Facebook.`); await loadPosts();
    });
    const copy = async (value: string) => {
        try { await navigator.clipboard.writeText(value); setMessage('Đã sao chép caption.'); setError(''); }
        catch { setError('Không sao chép được; hãy chọn nội dung và chép thủ công.'); }
    };
    const readImage = (id: number, file?: File) => {
        if (!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) return setError('Chỉ nhận PNG/JPEG dưới 5 MB.');
        const reader = new FileReader();
        reader.onload = () => setImages(old => ({ ...old, [id]: String(reader.result || '') }));
        reader.readAsDataURL(file);
    };
    const save = (post: Post) => perform(async () => {
        await api(`/api/admin/social/queue/${post.id}/update`, { caption: edits[post.id], image_data_url: images[post.id] });
        setMessage('Đã lưu caption/ảnh.'); await loadPosts();
        setImages(old => { const next = { ...old }; delete next[post.id]; return next; });
    });
    const markPosted = (post: Post) => {
        if (!window.confirm('Bạn đã đăng bài này lên Facebook Page rồi?')) return;
        void perform(async () => { await api(`/api/admin/social/queue/${post.id}/mark-posted`, {}); setMessage('Đã đánh dấu đã đăng.'); await loadPosts(); });
    };
    const cancel = (post: Post) => {
        if (!window.confirm('Hủy bài khỏi danh sách?')) return;
        void perform(async () => { await api(`/api/admin/social/queue/${post.id}/cancel`, {}); await loadPosts(); });
    };

    return <div className="max-w-7xl mx-auto pb-12 space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-sky-800 text-white p-6 sm:p-8 shadow-xl">
            <h1 className="text-2xl sm:text-3xl font-black">Nội dung Facebook hằng ngày</h1>
            <p className="mt-2 text-indigo-100">Chọn câu hỏi, lập danh sách, sao chép caption và tự đăng lên Page Luyện Toán Thông Minh.</p>
            <span className="inline-block mt-5 rounded-full bg-emerald-500/25 px-4 py-2 text-sm">Chế độ thủ công · không cần token · không tự gửi bài</span>
        </header>
        {error && <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}
        {message && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">{message}</div>}
        <div className="grid xl:grid-cols-[1.25fr_1fr] gap-6">
            <section className="bg-white border rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center"><div><h2 className="text-lg font-bold">1. Chọn câu hỏi</h2><p className="text-sm text-slate-500">Ưu tiên câu ít dùng, đã có ID6 trong danh mục.</p></div>
                    <span className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-sm font-bold">{selected.length}/30</span></div>
                <form onSubmit={e => { e.preventDefault(); void loadQuestions(search); }} className="flex gap-2">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ID6 hoặc nội dung" className="flex-1 min-w-0 border rounded-xl px-3 py-2"/>
                    <button type="submit" className="bg-slate-900 text-white rounded-xl px-4 py-2"><Search size={18}/></button></form>
                <div className="max-h-[550px] overflow-auto space-y-2">
                    {questions.map(q => <div key={q.id} className={`border rounded-2xl p-3 ${selected.includes(q.id) ? 'border-indigo-400 bg-indigo-50' : ''}`}>
                        <div className="flex items-start gap-3"><input type="checkbox" checked={selected.includes(q.id)} disabled={!selected.includes(q.id) && selected.length >= 30}
                            onChange={() => toggle(q.id)} aria-label={`Chọn câu ${q.id}`} className="mt-1 w-5 h-5"/>
                            <div className="flex-1 min-w-0"><b className="text-indigo-700">#{q.id} · {q.id_full}</b>
                                <p className="text-sm text-slate-500 line-clamp-2">{q.description || 'Luyện tập Toán'} · Đã dùng {q.used_count || 0} lần</p></div>
                            <button onClick={() => setPreview(preview === q.id ? null : q.id)} className="text-indigo-700 text-sm underline shrink-0">{preview === q.id ? 'Ẩn' : 'Xem'}</button></div>
                        {preview === q.id && <div className="bg-white rounded-xl mt-3 p-3 max-h-64 overflow-auto"><MathRenderer content={q.raw_latex} mode="question"/></div>}
                    </div>)}
                    {!questions.length && <p className="p-6 text-center text-slate-500">Không có câu phù hợp.</p>}
                </div>
            </section>
            <section className="bg-white border rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm h-fit">
                <h2 className="text-lg font-bold">2. Lập danh sách từng ngày</h2>
                <p className="text-sm text-slate-500">Các bài xếp theo thứ tự bạn chọn.</p>
                <label className="block text-sm font-semibold">Ngày/giờ bài đầu<input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="block w-full border rounded-xl px-3 py-2 mt-2"/></label>
                <label className="block text-sm font-semibold">Cách nhau bao nhiêu ngày<input type="number" min="1" max="30" value={days} onChange={e => setDays(Number(e.target.value))} className="block w-full border rounded-xl px-3 py-2 mt-2"/></label>
                <label className="block text-sm font-semibold">Mẫu caption<textarea rows={8} value={template} onChange={e => setTemplate(e.target.value)} maxLength={2000} className="block w-full border rounded-xl p-3 mt-2"/></label>
                <p className="text-xs text-slate-500">Biến: {'{NGAY}'} · {'{ID}'} · {'{CHUDE}'}. Sau khi tạo, bạn có thể sửa từng caption.</p>
                <button disabled={busy || !selected.length} onClick={() => void prepare()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 font-bold">Tạo {selected.length} bài</button>
                {selected.length > 0 && <p className="text-xs text-slate-500">Thứ tự: {selected.map(id => questions.find(q => q.id === id)?.id_full || `#${id}`).join(' → ')}</p>}
            </section>
        </div>
        <section className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-xl font-bold">3. Danh sách để tự đăng</h2><p className="text-sm text-slate-500">Xem câu, chép caption, đăng trên Facebook rồi đánh dấu.</p></div>
                <div className="flex gap-2">{(['DRAFT','POSTED','ALL'] as const).map(status => <button key={status} onClick={() => setFilter(status)} className={`rounded-xl px-3 py-2 text-sm ${filter === status ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{status === 'DRAFT' ? 'Chưa đăng' : status === 'POSTED' ? 'Đã đăng' : 'Tất cả'}</button>)}
                    <button onClick={() => void loadPosts()} title="Tải lại" className="bg-white border rounded-xl p-2"><RefreshCw size={18}/></button></div></div>
            <div className="grid lg:grid-cols-2 gap-4">
                {posts.filter(p => filter === 'ALL' || p.status === filter).map(post => <article key={post.id} className="bg-white border rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-2"><div><b className="text-indigo-700">#{post.question_id} · {post.id_full || 'Thiếu ID'}</b><p className="text-sm text-slate-500">Dự kiến: {localTime(post.scheduled_at)}</p></div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${post.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{post.status === 'DRAFT' ? 'Chưa đăng' : post.status === 'POSTED' ? 'Đã đăng' : post.status}</span></div>
                    <div className="bg-slate-50 border rounded-2xl p-4 max-h-72 overflow-auto">{post.raw_latex ? <MathRenderer content={post.raw_latex} mode="question"/> : <p className="text-red-700">Câu hỏi không còn trong ngân hàng.</p>}</div>
                    {Boolean(post.has_image) && <div><img src={`/api/admin/social/queue/${post.id}/image`} alt="Ảnh đã chuẩn bị" className="w-full max-h-64 object-contain rounded-xl"/>
                        <a href={`/api/admin/social/queue/${post.id}/image`} download={`id6-${post.id}.png`} className="text-indigo-700 text-sm underline">Tải ảnh đã chuẩn bị</a></div>}
                    {post.status === 'DRAFT' ? <><textarea value={edits[post.id] ?? post.caption} onChange={e => setEdits(old => ({ ...old, [post.id]: e.target.value }))} rows={5} maxLength={2000} aria-label={`Caption bài ${post.id}`} className="w-full border rounded-xl p-3 text-sm"/>
                        <div className="flex flex-wrap gap-2"><button onClick={() => void copy(edits[post.id] ?? post.caption)} className="bg-indigo-600 text-white rounded-xl px-3 py-2 text-sm flex gap-2 items-center"><ClipboardCopy size={16}/> Chép caption</button>
                            <label className="bg-slate-100 rounded-xl px-3 py-2 text-sm cursor-pointer">Thêm ảnh PNG/JPEG<input type="file" accept="image/png,image/jpeg" onChange={e => readImage(post.id, e.target.files?.[0])} className="sr-only"/></label>
                            <button disabled={busy} onClick={() => void save(post)} className="bg-slate-900 text-white rounded-xl px-3 py-2 text-sm disabled:opacity-50">Lưu sửa đổi</button></div>
                        {images[post.id] && <p className="text-xs text-emerald-700">Ảnh mới đã chọn; bấm Lưu để tải lên.</p>}
                        <div className="border-t pt-3 flex flex-wrap gap-2"><a href="https://www.facebook.com/luyentoanthongminh/" target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-700 rounded-xl px-3 py-2 text-sm flex items-center gap-2"><ExternalLink size={16}/> Mở Page</a>
                            <button disabled={busy} onClick={() => markPosted(post)} className="bg-emerald-50 text-emerald-700 rounded-xl px-3 py-2 text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Tôi đã đăng</button>
                            <button disabled={busy} onClick={() => cancel(post)} title="Hủy" className="bg-red-50 text-red-700 rounded-xl px-3 py-2"><Trash2 size={16}/></button></div></>
                        : <p className="text-sm whitespace-pre-wrap text-slate-600">{post.caption}</p>}
                    {post.last_error && <p className="text-red-700 text-xs">{post.last_error}</p>}
                </article>)}
                {!posts.some(p => filter === 'ALL' || p.status === filter) && <div className="lg:col-span-2 bg-white border rounded-2xl p-8 text-center text-slate-500">Chưa có bài trong mục này.</div>}
            </div>
        </section>
    </div>;
};
