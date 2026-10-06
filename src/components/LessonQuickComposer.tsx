import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Check, FileText, Loader2, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import { apiService } from '../services/api';
import { SavedMatrix, Unit } from '../types';
import { LessonContent } from './LessonContent';
import { LESSON_BLOCK_LABELS, lessonBlockContent, validateLessonDraft, youtubeEmbed } from '../../shared/lessonAuthoring';
type BlockType = 'TEXT' | 'FORMULA' | 'EXAMPLE' | 'NOTE' | 'VIDEO' | 'PRACTICE';
type Block = { type: BlockType; title: string; content: string; video_url?: string; matrix_id?: number | null };
type Draft = { title: string; blocks: Block[] };
type StoredDraft = { id: number; revision: number; draft: Draft; title: string; published_at?: string | null };
const labels = LESSON_BLOCK_LABELS as Record<BlockType, string>;
const newBlock = (type: BlockType): Block => ({ type, title: labels[type], content: '', video_url: '', matrix_id: null });
const template = (name: string): Draft => ({ title: name, blocks: [
    { ...newBlock('TEXT'), title: 'Mục tiêu bài học', content: 'Sau bài học, học sinh có thể:\n- ...\n- ...' },
    { ...newBlock('TEXT'), title: 'Kiến thức trọng tâm', content: 'Khái niệm và cách sử dụng:\n...' },
    { ...newBlock('EXAMPLE'), content: 'Đề bài:\n...\n\nCác bước giải:\n1. ...\n2. ...\n\nKết luận:\n...' },
    { ...newBlock('NOTE'), content: 'Lỗi thường gặp: ...\n\nCách kiểm tra: ...' }
] });
export const LessonQuickComposer: React.FC<{ unit: Unit; userId: number; matrices: SavedMatrix[]; onClose: () => void; onPublished: () => Promise<void>; embedded?: boolean }> = ({ unit, userId, matrices, onClose, onPublished, embedded = false }) => {
    const unitName = unit.unit_name || unit.name;
    const storageKey = `lesson-composer:v1:${userId}:${unit.id}`;
    const [draft, setDraft] = useState<Draft>(() => template(unitName));
    const [draftId, setDraftId] = useState<number | null>(null);
    const [revision, setRevision] = useState(1);
    const [stored, setStored] = useState<StoredDraft[]>([]);
    const [selected, setSelected] = useState(0);
    const [source, setSource] = useState('');
    const [instruction, setInstruction] = useState('');
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [ready, setReady] = useState(false);
    const [reviewed, setReviewed] = useState(false);
    const [proposal, setProposal] = useState<{ draft: Draft; index: number | null } | null>(null);
    const [confirmation, setConfirmation] = useState<{ message: string; action: () => void } | null>(null);
    const [lastSaved, setLastSaved] = useState('');
    const savingRef = useRef(false);
    const aiController = useRef<AbortController | null>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const active = draft.blocks[selected];
    const dirty = JSON.stringify(draft) !== lastSaved;
    const publicMatrices = matrices.filter(m => m.is_public || m.created_by == null);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            let backup: { draft: Draft; id: number | null; revision: number; source?: string; instruction?: string } | null = null;
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) { const parsed = JSON.parse(raw); validateLessonDraft(parsed.draft); backup = parsed; }
            } catch { if (!cancelled) setNotice('Không đọc được bản lưu trên trình duyệt. Bạn vẫn có thể mở bản nháp trên máy chủ.'); }
            try {
                const result = await apiService.lessonAuthoring(`/drafts?unit_id=${unit.id}`);
                if (cancelled) return;
                setStored(result.data);
                if (backup) {
                    const serverCopy = result.data.find((d: StoredDraft) => d.id === backup!.id);
                    if (serverCopy?.published_at) {
                        setDraft(template(unitName)); setDraftId(null); setRevision(1);
                        setNotice(`Bản nháp #${serverCopy.id} đã xuất bản thành công. Không xuất bản lại bản dự phòng để tránh trùng nội dung. Bạn có thể chọn bản đã xuất bản để chủ động sao chép.`);
                        return;
                    }
                    setDraft(backup.draft); setDraftId(backup.id); setRevision(backup.revision);
                    setSource(backup.source || ''); setInstruction(backup.instruction || '');
                    if (serverCopy && !serverCopy.published_at && serverCopy.revision === backup.revision) setLastSaved(JSON.stringify(serverCopy.draft));
                    setNotice('Đã khôi phục nội dung trên trình duyệt. Kiểm tra trước khi lưu hoặc xuất bản.');
                } else {
                    const latest = result.data.find((d: StoredDraft) => !d.published_at);
                    if (latest) { setDraft(latest.draft); setDraftId(latest.id); setRevision(latest.revision); setLastSaved(JSON.stringify(latest.draft)); }
                }
            } catch (e) {
                if (cancelled) return;
                setError(e instanceof Error ? e.message : 'Không tải được bản nháp.');
                if (backup) { setDraft(backup.draft); setDraftId(backup.id); setRevision(backup.revision); setSource(backup.source || ''); }
            } finally { if (!cancelled) setReady(true); }
        };
        void load(); return () => { cancelled = true; aiController.current?.abort(); };
    }, [storageKey, unit.id, unitName]);
    useEffect(() => {
        if (!ready) return;
        try { localStorage.setItem(storageKey, JSON.stringify({ draft, id: draftId, revision, source, instruction })); }
        catch { setNotice('Trình duyệt không lưu được bản dự phòng. Hãy bấm Lưu bản nháp trước khi đóng.'); }
        setReviewed(false);
    }, [draft, draftId, revision, ready, storageKey, source, instruction]);
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    const change = (values: Partial<Block>) => setDraft(old => ({ ...old, blocks: old.blocks.map((b, i) => i === selected ? { ...b, ...values } : b) }));
    const insert = (prefix: string, suffix = '') => {
        const area = editorRef.current; if (!area || !active) return;
        const start = area.selectionStart, end = area.selectionEnd;
        change({ content: active.content.slice(0, start) + prefix + active.content.slice(start, end) + suffix + active.content.slice(end) });
        requestAnimationFrame(() => { area.focus(); area.setSelectionRange(start + prefix.length, end + prefix.length); });
    };
    const add = (type: BlockType) => { if (draft.blocks.length >= 30) return setError('Tối đa 30 khối.'); setDraft(old => ({ ...old, blocks: [...old.blocks, newBlock(type)] })); setSelected(draft.blocks.length); };
    const move = (delta: number) => {
        const target = selected + delta; if (target < 0 || target >= draft.blocks.length) return;
        setDraft(old => { const blocks = [...old.blocks]; [blocks[selected], blocks[target]] = [blocks[target], blocks[selected]]; return { ...old, blocks }; }); setSelected(target);
    };
    const saveDraft = async () => {
        const cleaned = validateLessonDraft(draft) as Draft;
        const result = await apiService.lessonAuthoring(draftId ? `/drafts/${draftId}` : '/drafts', { draft: cleaned, ...(draftId ? { revision } : { unit_id: unit.id }) }, draftId ? 'PUT' : 'POST');
        setDraftId(result.id); setRevision(result.revision); setLastSaved(JSON.stringify(draft));
        // Write synchronously so closing immediately after a response keeps its new revision.
        try { localStorage.setItem(storageKey, JSON.stringify({ draft, id: result.id, revision: result.revision, source, instruction })); } catch { /* server copy is durable */ }
        return result;
    };
    const save = async (publish = false) => {
        if (savingRef.current) return;
        savingRef.current = true; setBusy(publish ? 'Đang xuất bản…' : 'Đang lưu bản nháp…'); setError(''); setNotice('');
        try {
            if (publish) { validateLessonDraft(draft, true); if (!reviewed) throw new Error('Xác nhận đã kiểm tra nội dung trước khi xuất bản.'); }
            const saved = await saveDraft();
            if (publish) {
                await apiService.lessonAuthoring(`/drafts/${saved.id}/publish`, { revision: saved.revision, reviewed: true });
                try { localStorage.removeItem(storageKey); } catch { /* optional backup */ }
                await onPublished(); onClose();
            } else {
                setNotice('Đã lưu bản nháp riêng trên máy chủ. Học sinh chưa nhìn thấy nội dung này.');
                const result = await apiService.lessonAuthoring(`/drafts?unit_id=${unit.id}`); setStored(result.data);
            }
        } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được nội dung.'); }
        finally { savingRef.current = false; setBusy(''); }
    };
    const askAI = async (rewrite: boolean) => {
        setBusy(rewrite ? 'AI đang chỉnh mục đã chọn…' : 'AI đang soạn bản nháp…'); setError('');
        const controller = new AbortController(); aiController.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 95000);
        try {
            const result = await apiService.lessonAuthoring('/ai', { unit_id: unit.id, source, instruction, action: rewrite ? 'REWRITE' : 'GENERATE', ...(rewrite ? { draft: { title: draft.title, blocks: [active] } } : {}) }, 'POST', controller.signal);
            setProposal({ draft: result.data, index: rewrite ? selected : null });
        } catch (e) { if (controller.signal.aborted) setNotice('Đã dừng AI hoặc hết thời gian chờ. Nội dung đang soạn được giữ nguyên; bạn có thể thử lại hoặc soạn bằng mẫu.'); else setError(e instanceof Error ? e.message : 'AI chưa phản hồi.'); }
        finally { window.clearTimeout(timeout); aiController.current = null; setBusy(''); }
    };
    const replaceDraft = (next: Draft, id: number | null = null, rev = 1) => {
        const apply = () => { setDraft(next); setDraftId(id); setRevision(rev); setSelected(0); setLastSaved(id ? JSON.stringify(next) : ''); setProposal(null); setError(''); };
        if (dirty) setConfirmation({ message: 'Thay nội dung đang soạn? Hãy lưu bản nháp nếu cần giữ lại.', action: apply });
        else apply();
    };
    const preview = (blocks: Block[]) => blocks.map((b, i) => {
        let video = ''; try { if (b.type === 'VIDEO') video = youtubeEmbed(b.video_url || ''); } catch { /* editor shows invalid URL on publish */ }
        return <article key={i} className={`rounded-2xl border p-5 space-y-3 ${b.type === 'NOTE' ? 'bg-amber-50 border-amber-200' : b.type === 'EXAMPLE' ? 'bg-indigo-50/40 border-indigo-100' : 'bg-white border-slate-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{labels[b.type]}</p><h3 className="font-bold text-slate-900">{b.title}</h3>
            {b.content && <LessonContent content={lessonBlockContent(b)}/>}
            {video && <iframe title={b.title} src={video} className="w-full aspect-video rounded-lg" sandbox="allow-scripts allow-same-origin allow-presentation" allowFullScreen/>}
            {b.type === 'PRACTICE' && <p className="text-sm text-slate-500">Luyện tập từ ma trận: {matrices.find(m => m.id === Number(b.matrix_id))?.name || 'Chưa chọn ma trận'}. Học sinh làm trực tiếp trong bài học sau khi xuất bản.</p>}
        </article>;
    });
    return <div className={embedded ? "h-full min-h-0 flex" : "fixed inset-0 z-50 bg-slate-950/60 p-2 md:p-5 flex items-center justify-center"}><section role={embedded ? undefined : "dialog"} aria-modal={embedded ? undefined : true} aria-label="Soạn bài nhanh" className={`relative w-full flex flex-col bg-slate-50 overflow-hidden ${embedded ? "h-full rounded-2xl border border-slate-200" : "max-w-7xl h-[94vh] rounded-2xl shadow-2xl"}`}>
        <header className="bg-white border-b p-4 flex justify-between gap-4 items-start"><div><h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-600"/>Soạn bài nhanh</h2><p className="text-sm text-slate-500 mt-1">{unitName} · Bản nháp riêng → kiểm tra → xuất bản</p></div><button aria-label="Đóng trình soạn bài" disabled={!!busy} onClick={() => { if (!dirty) onClose(); else setConfirmation({ message: 'Bản nháp chưa được lưu lên máy chủ. Đóng trình soạn bài?', action: onClose }); }} className="p-2 rounded-lg hover:bg-slate-100"><X/></button></header>
        {(error || notice) && <div role={error ? 'alert' : 'status'} className={`px-5 py-3 text-sm ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}
        {busy.startsWith('AI') && <div className="px-5 py-2 bg-indigo-50 text-indigo-700 flex justify-between items-center text-xs"><span>AI chỉ tạo đề xuất, không tự lưu hoặc xuất bản. Có thể dừng bất kỳ lúc nào.</span><button onClick={() => aiController.current?.abort()} className="border border-indigo-300 bg-white px-3 py-1 rounded-lg font-bold">Dừng AI</button></div>}
        {!ready ? <div className="m-auto flex items-center gap-2"><Loader2 className="animate-spin"/>Đang tải bản nháp…</div> : <fieldset disabled={!!busy || !!proposal || !!confirmation} className="min-h-0 flex-1 overflow-y-auto"><div className="grid lg:grid-cols-[300px_1fr_1fr] min-h-full">
            <aside className="p-4 border-r space-y-4 bg-white">
                <label className="block text-xs font-bold text-slate-600">Tên bài soạn<input value={draft.title} maxLength={200} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} className="w-full mt-1 rounded-xl border p-2 text-sm"/></label>
                <select aria-label="Mở bản nháp đã lưu" value={draftId || ''} onChange={e => { const found = stored.find(d => d.id === Number(e.target.value)); if (found) replaceDraft(found.draft, found.published_at ? null : found.id, found.published_at ? 1 : found.revision); }} className="w-full border rounded-xl p-2 text-xs"><option value="">Mở bản nháp / sao chép bài đã xuất bản</option>{stored.map(d => <option key={d.id} value={d.id}>{d.published_at ? 'Đã xuất bản · Sao chép' : 'Bản nháp'} #{d.id} · {d.title}</option>)}</select>
                <button onClick={() => replaceDraft(template(unitName))} className="w-full text-left text-sm font-semibold text-indigo-600 flex items-center gap-2"><FileText size={16}/>Bắt đầu từ mẫu bài học</button>
                <div className="bg-indigo-50 rounded-2xl p-3 space-y-3"><h3 className="text-sm font-bold text-indigo-900">Trợ lý soạn bài</h3><label className="block text-xs">Dán giáo án / Markdown / LaTeX<textarea rows={5} maxLength={40000} value={source} onChange={e => setSource(e.target.value)} placeholder="Có tài liệu: AI tổ chức lại thành bài học. Để trống: AI soạn theo tên bài." className="w-full mt-1 rounded-lg border p-2 text-xs"/></label><label className="block text-xs">Yêu cầu thêm<textarea rows={2} maxLength={2000} value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="Ví dụ: giải thích dễ hiểu, ví dụ từ cơ bản đến vận dụng…" className="w-full mt-1 rounded-lg border p-2 text-xs"/></label><button onClick={() => void askAI(false)} className="w-full bg-indigo-600 text-white rounded-xl p-2 text-sm font-bold flex items-center justify-center gap-2"><Sparkles size={16}/>AI tạo bản nháp</button><p className="text-[11px] text-indigo-700">Tài liệu được gửi tới Gemini khi bấm AI. Không đưa thông tin riêng tư của học sinh. Kết quả luôn cần giáo viên duyệt.</p></div>
                <h3 className="text-xs font-bold text-slate-500 uppercase">Các khối nội dung ({draft.blocks.length}/30)</h3><div className="space-y-1">{draft.blocks.map((b, i) => <button key={i} onClick={() => setSelected(i)} className={`w-full text-left p-3 rounded-xl text-xs ${selected === i ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><span className="font-bold">{i + 1}. {b.title}</span><span className="block mt-1 opacity-70">{labels[b.type]}</span></button>)}</div>
                <div className="grid grid-cols-2 gap-2">{(Object.keys(labels) as BlockType[]).map(type => <button key={type} onClick={() => add(type)} className="flex gap-1 items-center text-xs border p-2 rounded-lg hover:border-indigo-400"><Plus size={12}/>{labels[type]}</button>)}</div>
            </aside>
            <main className="p-4 space-y-4 border-r">
                {active && <><div className="flex justify-between gap-2 items-center"><h3 className="font-bold text-slate-800">Chỉnh sửa khối {selected + 1}</h3><div className="flex gap-1"><button aria-label="Di chuyển lên" disabled={selected === 0} onClick={() => move(-1)} className="p-2 border rounded-lg disabled:opacity-30"><ArrowUp size={15}/></button><button aria-label="Di chuyển xuống" disabled={selected === draft.blocks.length - 1} onClick={() => move(1)} className="p-2 border rounded-lg disabled:opacity-30"><ArrowDown size={15}/></button><button aria-label="Xóa khối" disabled={draft.blocks.length === 1} onClick={() => { setConfirmation({ message: 'Xóa khối này khỏi bản nháp?', action: () => { setDraft(d => ({ ...d, blocks: d.blocks.filter((_, i) => i !== selected) })); setSelected(Math.max(0, selected - 1)); } }); }} className="p-2 border rounded-lg text-rose-500 disabled:opacity-30"><Trash2 size={15}/></button></div></div>
                <label className="block text-xs font-semibold">Tiêu đề khối<input className="mt-1 w-full border rounded-xl p-3 text-sm" maxLength={200} value={active.title} onChange={e => change({ title: e.target.value })}/></label>
                {active.type === 'VIDEO' ? <label className="block text-sm">Liên kết YouTube<input className="mt-2 w-full border rounded-xl p-3" value={active.video_url || ''} onChange={e => change({ video_url: e.target.value })} placeholder="Dán link YouTube thường, không cần mã nhúng"/></label> : active.type === 'PRACTICE' ? <div className="space-y-3"><label className="block text-sm">Ma trận luyện tập<select value={active.matrix_id || ''} onChange={e => change({ matrix_id: Number(e.target.value) || null })} className="block w-full mt-2 border rounded-xl p-3"><option value="">Chọn ma trận công khai</option>{publicMatrices.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><p className="text-xs text-slate-500">Dùng ma trận công khai để học sinh truy cập được. Có thể tạo ma trận AI trong phần Ma trận. Nếu chưa có ma trận, bỏ khối này; cuối bài vẫn có “Bài tập vận dụng” theo ngân hàng của bài.</p></div> : <><div className="flex gap-2 flex-wrap"><button onClick={() => insert('**', '**')} className="text-xs border rounded-lg p-2 font-bold">Đậm</button><button onClick={() => insert('\n- ')} className="text-xs border rounded-lg p-2">Danh sách</button><button onClick={() => insert('$', '$')} className="text-xs border rounded-lg p-2">Công thức</button></div><textarea ref={editorRef} rows={16} maxLength={20000} value={active.content} onChange={e => change({ content: e.target.value })} placeholder={active.type === 'FORMULA' ? 'Ví dụ: x^2 + y^2 = r^2' : 'Nhập nội dung. Công thức toán đặt trong $...$. Xem trước ở bên cạnh.'} className="w-full border rounded-xl p-4 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-indigo-300"/><p className="text-xs text-slate-400">{active.content.length}/20.000 ký tự · Không cần viết HTML</p><div className="flex flex-wrap gap-2">{['Rút gọn, giữ kiến thức cốt lõi', 'Giải thích dễ hiểu hơn', 'Thêm ví dụ có lời giải từng bước'].map(text => <button key={text} onClick={() => setInstruction(text)} className="text-xs bg-white border rounded-lg px-2 py-2">{text}</button>)}</div><button onClick={() => void askAI(true)} className="text-indigo-600 font-bold text-sm flex gap-2 items-center"><Sparkles size={16}/>AI chỉnh khối này theo yêu cầu</button></>}
                </>}
            </main>
            <aside className="p-4 space-y-4"><h3 className="font-bold flex items-center gap-2"><BookOpen size={18}/>Xem trước bài học</h3><p className="text-xs text-slate-500">Nội dung dưới đây chưa hiển thị cho học sinh.</p>{preview(draft.blocks)}<div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 text-sm text-indigo-800">Cuối bài: Bài tập vận dụng lấy từ ngân hàng câu hỏi của bài học.</div></aside>
        </div></fieldset>}
        <footer className="border-t bg-white p-4 flex flex-wrap items-center justify-between gap-3"><div><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={reviewed} disabled={!!busy || !ready} onChange={e => setReviewed(e.target.checked)}/>Tôi đã kiểm tra kiến thức, công thức và lời giải.</label><p className="text-[11px] text-slate-400 mt-1">Xuất bản thêm nội dung vào bài, không xóa mục cũ hoặc tiến độ học sinh.</p></div><div className="flex gap-2 items-center">{busy && <span role="status" className="text-xs flex gap-1 items-center"><Loader2 size={15} className="animate-spin"/>{busy}</span>}<button disabled={!!busy || !ready || !!proposal} onClick={() => void save()} className="border rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 disabled:opacity-40"><Save size={16}/>Lưu bản nháp</button><button disabled={!!busy || !ready || !reviewed || !!proposal} onClick={() => { setConfirmation({ message: `Xuất bản ${draft.blocks.length} khối cho học sinh? Nội dung cũ được giữ nguyên.`, action: () => { void save(true); } }); }} className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 disabled:opacity-40"><Check size={16}/>Duyệt & xuất bản</button></div></footer>
        {proposal && <div className="absolute inset-0 z-10 bg-slate-950/60 flex items-center justify-center p-5"><section role="dialog" aria-modal="true" aria-label="Duyệt đề xuất AI" className="bg-slate-50 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"><header className="p-5 border-b"><h3 className="text-lg font-bold">AI đã soạn xong · Kiểm tra đề xuất</h3><p className="text-xs text-slate-500 mt-1">Chưa thay đổi bản nháp và chưa xuất bản. Áp dụng để tiếp tục chỉnh sửa.</p></header><div className="p-5 space-y-4 overflow-y-auto">{preview(proposal.draft.blocks)}</div><footer className="p-4 border-t flex justify-end gap-2"><button onClick={() => setProposal(null)} className="px-4 py-2 border rounded-xl text-sm">Giữ bản hiện tại</button><button onClick={() => { if (proposal.index === null) { replaceDraft(proposal.draft); } else { const index = proposal.index; setDraft(d => ({ ...d, blocks: d.blocks.map((b, i) => i === index ? proposal.draft.blocks[0] : b) })); setProposal(null); } }} className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold">Áp dụng đề xuất</button></footer></section></div>}
        {confirmation && <div className="absolute inset-0 z-20 bg-slate-950/60 flex items-center justify-center p-5"><section role="alertdialog" aria-modal="true" aria-label="Xác nhận thao tác" className="bg-white rounded-2xl p-6 max-w-md space-y-5 shadow-xl"><h3 className="text-lg font-bold">Xác nhận thao tác</h3><p className="text-sm text-slate-600">{confirmation.message}</p><div className="flex justify-end gap-2"><button onClick={() => setConfirmation(null)} className="border rounded-xl px-4 py-2 text-sm">Quay lại</button><button onClick={() => { const action = confirmation.action; setConfirmation(null); action(); }} className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold">Xác nhận</button></div></section></div>}
    </section></div>;
};
