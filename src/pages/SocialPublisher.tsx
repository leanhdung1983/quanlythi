import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, ImagePlus, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import { MathRenderer } from '../components/MathRenderer';

type SocialPost = {
    id: number; question_id: number; id_full: string | null; raw_latex: string | null;
    caption: string; scheduled_at: string; status: string; attempt_count: number;
    last_error: string | null; fb_photo_id: string | null; fb_post_id: string | null;
};

async function api(url: string, payload?: object) {
    const response = await fetch(url, payload ? {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    } : undefined);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
}

const initialTime = () => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const labels: Record<string, string> = {
    DRAFT: 'Chờ duyệt', APPROVED: 'Đã duyệt · chờ giờ đăng', PUBLISHING: 'Đang gửi tới Meta',
    POSTED: 'Đã đăng', FAILED: 'Đăng thất bại', UNCERTAIN: 'Cần đối soát trên Facebook', CANCELLED: 'Đã hủy'
};

export const SocialPublisher: React.FC = () => {
    const [rows, setRows] = useState<SocialPost[]>([]);
    const [configured, setConfigured] = useState(false);
    const [pageId, setPageId] = useState('');
    const [questionId, setQuestionId] = useState('');
    const [question, setQuestion] = useState<any>(null);
    const [caption, setCaption] = useState('📘 Bài toán mỗi ngày\n\nBạn thử giải trước khi xem lời giải nhé!\n\n#LuyenToanThongMinh #ID6');
    const [scheduled, setScheduled] = useState(initialTime);
    const [image, setImage] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [config, queue] = await Promise.all([
                api('/api/admin/social/config'), api('/api/admin/social/queue')
            ]);
            setConfigured(Boolean(config.data.configured));
            setPageId(config.data.pageId);
            setRows(queue.data || []);
        } catch (e: any) { setError(e.message); }
    }, []);

    useEffect(() => {
        void load();
        const timer = window.setInterval(() => void load(), 30_000);
        return () => window.clearInterval(timer);
    }, [load]);

    const findQuestion = async () => {
        setError(''); setQuestion(null);
        const id = Number(questionId);
        if (!Number.isInteger(id) || id < 1) return setError('Hãy nhập ID số của câu hỏi trong ngân hàng.');
        try {
            const result = await api('/api/questions/by-ids', { ids: [id] });
            const item = result.data?.[0];
            if (!item) throw new Error('Không tìm thấy câu hỏi.');
            setQuestion(item);
            setCaption(prev => prev.includes('{ID}') ? prev.replaceAll('{ID}', item.id_full || '') : prev);
        } catch (e: any) { setError(e.message); }
    };

    const readImage = (file?: File) => {
        if (!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setError('Chỉ nhận PNG/JPEG nhỏ hơn 5 MB.'); return;
        }
        const reader = new FileReader();
        reader.onload = () => { setImage(String(reader.result || '')); setError(''); };
        reader.readAsDataURL(file);
    };

    const create = async () => {
        if (!question || !image) return setError('Cần chọn câu hỏi và tải ảnh bài đăng.');
        setBusy(true); setError(''); setNotice('');
        try {
            await api('/api/admin/social/queue', {
                question_id: question.id, caption, scheduled_at: new Date(scheduled).toISOString(), image_data_url: image
            });
            setNotice('Đã tạo bản nháp. Kiểm tra ảnh và caption trong hàng chờ rồi duyệt.');
            setQuestion(null); setQuestionId(''); setImage('');
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    };

    const action = async (id: number, name: 'approve' | 'cancel') => {
        if (name === 'approve' && !window.confirm('Xác nhận duyệt bài này để hệ thống tự đăng đúng giờ?')) return;
        setBusy(true); setError(''); setNotice('');
        try {
            await api(`/api/admin/social/queue/${id}/${name}`, {});
            setNotice(name === 'approve' ? 'Đã duyệt; hệ thống sẽ tự đăng đúng giờ.' : 'Đã hủy bài đăng.');
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    };

    const checkConnection = async () => {
        setBusy(true); setError(''); setNotice('');
        try {
            const result = await api('/api/admin/social/check');
            setNotice(`Đã kết nối đúng Page: ${result.data.name} (${result.data.id}).`);
        } catch (e: any) { setError(`Kết nối Facebook chưa hợp lệ: ${e.message}`); }
        finally { setBusy(false); }
    };

    return <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-sky-800 text-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-start gap-4"><div className="p-3 rounded-2xl bg-white/15"><Send size={26}/></div>
                <div><h1 className="text-2xl sm:text-3xl font-black">Đăng bài Facebook Page</h1>
                    <p className="text-indigo-100 mt-2">Chuẩn bị ảnh và nội dung, duyệt trước, hệ thống tự đăng đúng giờ lên Luyện Toán Thông Minh.</p>
                </div></div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/15 px-4 py-2">Page ID: {pageId || 'đang tải'}</span>
                <span className={`rounded-full px-4 py-2 ${configured ? 'bg-emerald-500/30' : 'bg-amber-500/30'}`}>
                    {configured ? 'Token đã cấu hình' : 'Chưa có token trên Render · tự đăng đang tạm dừng'}
                </span>
                {configured && <button disabled={busy} onClick={checkConnection}
                    className="rounded-full border border-white/40 px-4 py-2 hover:bg-white/10 disabled:opacity-50">Kiểm tra kết nối Page</button>}
            </div>
        </div>
        {error && <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}
        {notice && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">{notice}</div>}
        <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-bold flex items-center gap-2"><ImagePlus className="text-indigo-600"/> Tạo bản nháp</h2>
                <div className="flex gap-2"><input type="number" min="1" value={questionId} onChange={e => setQuestionId(e.target.value)}
                    placeholder="ID số của câu hỏi" className="flex-1 min-w-0 border border-slate-300 rounded-xl px-3 py-2"/>
                    <button onClick={findQuestion} className="rounded-xl bg-slate-900 text-white px-4 py-2">Xem câu</button></div>
                {question && <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 max-h-60 overflow-auto">
                    <b className="text-indigo-700">#{question.id} · {question.id_full || 'Thiếu ID'}</b>
                    <div className="mt-3"><MathRenderer content={question.raw_latex || ''}/></div></div>}
                <label className="block text-sm font-semibold">Ảnh đăng (PNG/JPEG, tối đa 5 MB)
                    <input type="file" accept="image/png,image/jpeg" onChange={e => readImage(e.target.files?.[0])}
                        className="block w-full mt-2 text-sm"/></label>
                {image && <img src={image} alt="Ảnh bài đăng sẽ gửi lên Facebook" className="rounded-2xl border max-h-80 mx-auto object-contain"/>}
                <p className="text-xs text-slate-500">Ảnh phải thể hiện đầy đủ câu hỏi và hình vẽ. Hãy kiểm tra bản xem trước trước khi duyệt.</p>
                <label className="block text-sm font-semibold">Caption
                    <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5} maxLength={2000}
                        className="block w-full mt-2 border border-slate-300 rounded-xl p-3"/></label>
                <label className="block text-sm font-semibold">Thời gian đăng (giờ trên máy bạn)
                    <input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)}
                        className="block w-full mt-2 border border-slate-300 rounded-xl px-3 py-2"/></label>
                <button disabled={busy || !question || !image} onClick={create}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 font-bold flex justify-center gap-2">
                    <CalendarClock size={19}/> Đưa vào hàng chờ</button>
            </section>
            <section className="space-y-3">
                <div className="flex justify-between items-center"><h2 className="text-lg font-bold">Hàng chờ</h2>
                    <button onClick={() => void load()} title="Tải lại" className="p-2 rounded-xl bg-white border"><RefreshCw size={18}/></button></div>
                {!rows.length && <div className="bg-white rounded-2xl border p-8 text-center text-slate-500">Chưa có bài đăng.</div>}
                {rows.map(row => <article key={row.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 justify-between"><b className="text-indigo-700">#{row.question_id} · {row.id_full || 'Thiếu ID'}</b>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${row.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700' : row.status === 'UNCERTAIN' || row.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {labels[row.status] || row.status}</span></div>
                    <div className="text-sm text-slate-500 mt-2">Đăng lúc {new Date(`${row.scheduled_at.replace(' ', 'T')}Z`).toLocaleString('vi-VN')} · {row.attempt_count} lần gửi</div>
                    <img src={`/api/admin/social/queue/${row.id}/image`} alt={`Ảnh bài ${row.id}`} className="mt-3 max-h-64 w-full object-contain rounded-xl bg-slate-50"/>
                    <p className="whitespace-pre-wrap text-sm mt-3">{row.caption}</p>
                    {row.last_error && <p className="text-xs text-red-700 mt-2">Lỗi: {row.last_error}</p>}
                    {row.status === 'UNCERTAIN' && <p className="text-xs text-red-700 mt-2">Kiểm tra Page trước khi tạo bài mới; hệ thống không tự gửi lại bài này.</p>}
                    {(row.fb_post_id || row.fb_photo_id) && <a
                        href={row.fb_post_id ? `https://www.facebook.com/${row.fb_post_id}` : `https://www.facebook.com/photo.php?fbid=${row.fb_photo_id}`}
                        target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline mt-2 inline-block">Xem trên Facebook</a>}
                    <div className="flex gap-2 mt-4">
                        {row.status === 'DRAFT' && <button disabled={busy || !configured} onClick={() => void action(row.id, 'approve')}
                            className="flex items-center gap-2 bg-emerald-600 disabled:opacity-50 text-white rounded-xl px-3 py-2 text-sm"><CheckCircle2 size={16}/> Duyệt đăng</button>}
                        {['DRAFT','APPROVED','FAILED'].includes(row.status) && <button disabled={busy} onClick={() => void action(row.id, 'cancel')}
                            className="flex items-center gap-2 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-sm"><XCircle size={16}/> Hủy</button>}
                    </div>
                </article>)}
            </section>
        </div>
        <p className="text-sm text-slate-500 flex items-start gap-2"><ShieldCheck size={18} className="shrink-0"/> Token chỉ nằm trên server Render. Bài chưa duyệt sẽ không được tự đăng; kết nối không rõ kết quả sẽ không tự thử lại.</p>
    </div>;
};
