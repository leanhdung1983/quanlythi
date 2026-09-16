import React, { useMemo, useState } from 'react';
import { SavedMatrix } from '../types';
import { describeMatrix, MATRIX_PURPOSES, MATRIX_STATUSES } from '../../shared/matrixCatalog';
import { apiService } from '../services/api';

export function MatrixLibrary({ matrices, selectedId, onSelect, onConfigure, onGenerate, onDelete, onReload, canEdit }: {
    matrices: SavedMatrix[]; selectedId: number | null; onSelect: (m: SavedMatrix) => void; onConfigure: (m: SavedMatrix) => void;
    onGenerate: (m: SavedMatrix) => void; onDelete: (m: SavedMatrix) => void; onReload: () => void; canEdit: (m: SavedMatrix) => boolean;
}) {
    const [grade, setGrade] = useState('ALL'), [purpose, setPurpose] = useState('ALL'), [status, setStatus] = useState('ALL');
    const [search, setSearch] = useState(''), [year, setYear] = useState(''), [term, setTerm] = useState(''), [subject, setSubject] = useState('');
    const [sort, setSort] = useState('NEWEST'), [chosen, setChosen] = useState<number[]>([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    const [author, setAuthor] = useState('');
    const [chapter, setChapter] = useState('');
    const [bulkGrade, setBulkGrade] = useState(''), [bulkPurpose, setBulkPurpose] = useState(''), [bulkStatus, setBulkStatus] = useState('');
    const items = useMemo(() => matrices.map(row => ({ row, info: describeMatrix(row) })), [matrices]);
    const filtered = items.filter(({ row, info }) => (grade === 'ALL' || info.grade === grade) && (purpose === 'ALL' || info.purpose === purpose) && (status === 'ALL' || info.status === status)
        && (!year || info.year === year) && (!term || info.term === term) && (!subject || info.subjects.includes(subject)) && (!chapter || info.chapters.includes(chapter)) && (!author || String(row.created_by ?? 'SHARED') === author)
        && `${row.name} ${row.id} ${info.chapters.join(' ')}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
        .sort((a, b) => sort === 'NAME' ? a.row.name.localeCompare(b.row.name, 'vi') : sort === 'COUNT' ? b.info.total - a.info.total : Number(b.row.id) - Number(a.row.id));
    const gradeLabel = (g: string) => g === 'MULTI' ? 'Liên khối' : g === 'UNKNOWN' ? 'Chưa xác định khối' : `Khối ${g}`;
    const grades = ['10','11','12', ...[...new Set(items.map(i => i.info.grade))].filter(g => !['10','11','12','MULTI','UNKNOWN'].includes(g)).sort(), 'MULTI','UNKNOWN'];
    const inputClass = 'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-200';
    const bulk = async () => {
        const ids = chosen.filter(id => matrices.some(m => m.id === id && canEdit(m)));
        if (!ids.length || (!bulkGrade && !bulkPurpose && !bulkStatus)) return setMessage('Chọn ma trận và thuộc tính cần phân loại.');
        if (!window.confirm(`Phân loại ${ids.length} ma trận? Nội dung, cấu hình điểm và lịch sử thi được giữ nguyên.`)) return;
        setBusy(true); setMessage('');
        try {
            await apiService.classifyMatrices(ids, { ...(bulkGrade ? { target_grade: bulkGrade } : {}), ...(bulkPurpose ? { purpose: bulkPurpose } : {}), ...(bulkStatus ? { status: bulkStatus } : {}) });
            setMessage(`Đã phân loại ${ids.length} ma trận.`); setChosen([]); onReload();
        } catch (e: any) { setMessage(e.message || 'Không phân loại được.'); } finally { setBusy(false); }
    };
    return <div className="space-y-3">
        <p className="text-xs text-slate-500">Khối đối tượng thi → mục đích đề. Phạm vi kiến thức hiển thị riêng.</p>
        <input aria-label="Tìm ma trận" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, mã ma trận…" className={inputClass}/>
        <div className="flex flex-wrap gap-1">{['ALL', ...grades].map(g => <button key={g} onClick={() => setGrade(g)} className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${grade === g ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>{g === 'ALL' ? 'Tất cả' : gradeLabel(g)} <span className="opacity-70">{items.filter(i => g === 'ALL' || i.info.grade === g).length}</span></button>)}</div>
        <div className="grid grid-cols-2 gap-2">
            <select aria-label="Người tạo" value={author} onChange={e => setAuthor(e.target.value)} className={`${inputClass} col-span-2`}><option value="">Tất cả người tạo</option>{[...new Set(matrices.map(m => String(m.created_by ?? 'SHARED')))].map(id => <option key={id} value={id}>{id === 'SHARED' ? 'Nguồn dùng chung' : matrices.find(m => String(m.created_by) === id)?.creator_name || `Giáo viên #${id}`}</option>)}</select>
            <select aria-label="Mục đích đề" value={purpose} onChange={e => setPurpose(e.target.value)} className={inputClass}><option value="ALL">Mọi mục đích</option>{Object.entries(MATRIX_PURPOSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select aria-label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)} className={inputClass}><option value="ALL">Mọi trạng thái</option>{Object.entries(MATRIX_STATUSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select aria-label="Năm học" value={year} onChange={e => setYear(e.target.value)} className={inputClass}><option value="">Mọi năm học</option>{[...new Set(items.map(i => i.info.year).filter(Boolean))].sort().reverse().map(y => <option key={y}>{y}</option>)}</select>
            <select aria-label="Học kỳ" value={term} onChange={e => setTerm(e.target.value)} className={inputClass}><option value="">Mọi học kỳ</option><option value="1">Học kỳ I</option><option value="2">Học kỳ II</option><option value="YEAR">Cả năm</option></select>
            <select aria-label="Phạm vi nội dung" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass}><option value="">Mọi nội dung</option><option value="D">Đại số</option><option value="H">Hình học</option></select>
            <select aria-label="Chương kiến thức" value={chapter} onChange={e => setChapter(e.target.value)} className={inputClass}><option value="">Mọi chương</option>{[...new Set(items.flatMap(i => i.info.chapters))].sort().map(c => { const [g,s,n] = c.split('-'); return <option key={c} value={c}>Lớp {g} · {s === 'D' ? 'Đại số' : s === 'H' ? 'Hình học' : s} · Chương {n}</option>; })}</select>
            <select aria-label="Sắp xếp" value={sort} onChange={e => setSort(e.target.value)} className={inputClass}><option value="NEWEST">Mới nhất</option><option value="NAME">Tên A–Z</option><option value="COUNT">Số câu giảm dần</option></select>
        </div>
        <div className="flex justify-between text-xs text-slate-500"><span>{filtered.length}/{items.length} ma trận</span><button onClick={() => { setGrade('ALL'); setPurpose('ALL'); setStatus('ALL'); setSearch(''); setYear(''); setTerm(''); setSubject(''); setAuthor(''); setChapter(''); }} className="text-indigo-600">Xóa bộ lọc</button></div>
        {matrices.some(canEdit) && <details className="rounded-xl border bg-indigo-50/40 p-2"><summary className="cursor-pointer text-xs font-semibold">Phân loại hàng loạt ({chosen.filter(id => matrices.some(m => m.id === id)).length}/100)</summary><div className="mt-2 space-y-2">
            <button className="text-xs text-indigo-700" onClick={() => setChosen(filtered.filter(i => canEdit(i.row)).slice(0,100).map(i => i.row.id))}>Chọn kết quả đang lọc (tối đa 100)</button>
            <select aria-label="Khối phân loại hàng loạt" value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} className={inputClass}><option value="">Giữ nguyên khối</option>{grades.filter(g => g !== 'UNKNOWN').map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}</select>
            <select aria-label="Mục đích phân loại hàng loạt" value={bulkPurpose} onChange={e => setBulkPurpose(e.target.value)} className={inputClass}><option value="">Giữ nguyên mục đích</option>{Object.entries(MATRIX_PURPOSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select aria-label="Trạng thái phân loại hàng loạt" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className={inputClass}><option value="">Giữ nguyên trạng thái</option>{Object.entries(MATRIX_STATUSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
            <div className="flex gap-2"><button disabled={busy} onClick={() => void bulk()} className="rounded-lg bg-indigo-600 text-white p-2 text-xs disabled:opacity-50">Áp dụng phân loại</button><button onClick={() => setChosen([])} className="text-xs">Bỏ chọn</button></div>
        </div></details>}
        {message && <p role="status" className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{message}</p>}
        {grades.map(g => {
            const group = filtered.filter(i => i.info.grade === g);
            if (!group.length) return null;
            return <section key={g} className="space-y-2"><h3 className="text-sm font-bold text-slate-800 pt-2">{gradeLabel(g)} · {group.length}</h3>
                {Object.entries(MATRIX_PURPOSES).map(([p,label]) => {
                    const list = group.filter(i => i.info.purpose === p); if (!list.length) return null;
                    return <details key={p} open className="space-y-2"><summary className="text-xs font-semibold text-indigo-700 cursor-pointer">{label} · {list.length}</summary>
                        {list.map(({ row, info }) => <article key={row.id} className={`mt-2 rounded-xl border p-3 ${selectedId === row.id ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-200'}`}>
                            <div className="flex gap-2 items-start">{canEdit(row) && <input aria-label={`Chọn ma trận ${row.id}`} type="checkbox" checked={chosen.includes(row.id)} disabled={!chosen.includes(row.id) && chosen.length >= 100} onChange={() => setChosen(old => old.includes(row.id) ? old.filter(id => id !== row.id) : [...old,row.id])}/>}
                                <button onClick={() => onSelect(row)} className="text-left text-xs font-bold text-slate-800 break-words">#{row.id} · {row.name}</button></div>
                            <p className="mt-2 text-[11px] text-slate-500">{info.valid ? `${info.total} câu · ${info.duration} phút` : 'Dữ liệu cũ cần kiểm tra'} · {MATRIX_STATUSES[info.status]}</p>
                            <p className="text-[11px] text-slate-500">{row.creator_name || (row.created_by ? `Giáo viên #${row.created_by}` : 'Nguồn dùng chung')}</p>
                            <p className="text-[11px] text-slate-500">TN {info.counts.TN} · Đ/S {info.counts.TF} · Ngắn {info.counts.KQ} · TL {info.counts.TL}</p>
                            <p className="text-[11px] text-slate-500">Kiến thức: {info.grades.length ? info.grades.map(x => `Lớp ${x}`).join(', ') : 'Chưa xác định'}{info.subjects.length ? ` · ${info.subjects.map(s => s === 'D' ? 'Đại số' : s === 'H' ? 'Hình học' : s).join(', ')}` : ''}</p>
                            {(info.year || info.term) && <p className="text-[11px] text-slate-500">{info.year} {info.term ? `· ${info.term === 'YEAR' ? 'Cả năm' : `HK ${info.term}`}` : ''}</p>}
                            <div className="flex flex-wrap gap-2 mt-2 text-[11px]"><button onClick={() => onSelect(row)} className="text-indigo-700">Mở ma trận</button><button onClick={() => onGenerate(row)} className="text-emerald-700">Tạo đề TeX</button>{canEdit(row) && <><button onClick={() => onConfigure(row)} className="text-indigo-700">Phân loại / cấu hình</button><button onClick={() => onDelete(row)} className="text-red-600">Xóa</button></>}</div>
                        </article>)}
                    </details>;
                })}
            </section>;
        })}
        {!filtered.length && <p className="py-6 text-center text-xs text-slate-500">Không có ma trận phù hợp. Thử xóa bộ lọc.</p>}
    </div>;
}
