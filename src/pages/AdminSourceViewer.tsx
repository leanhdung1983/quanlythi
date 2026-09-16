
import React, { useState, useEffect } from 'react';
import { svgImageSource } from '../utils/svgImageSource';
import { apiService } from '../services/api';
import { Loader2, Search, Eye, Copy, Check, Code, Image as ImageIcon, X, Database, Wand2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionSource {
    id: number;
    legacy_full_id: string;
    content_latex: string;
    original_latex: string;
    is_tikz_rendered: number;
}

interface QuestionImage {
    id: number;
    tikz_hash: string;
    svg_content: string;
    created_at: string;
}

interface TikzAuditRow {
    id: number;
    id_full: string | null;
    status: 'NO_TIKZ' | 'SOURCE_MISMATCH' | 'MISSING_SOURCE' | 'MALFORMED_SOURCE' | 'OTHER_IMAGE' | 'PENDING' | 'READY';
    images: { hash: string; exists: boolean; needsAction: boolean; error: string | null }[];
}

interface TikzJob {
    id: number;
    status: 'QUEUED' | 'RUNNING' | 'CANCEL_REQUESTED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
    afterId: number;
    scanned: number;
    synced: number;
    failed: number;
    heartbeatAt: string | null;
    errorMessage: string | null;
}

const SvgViewer = ({ hash }: { hash: string }) => {
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        apiService.fetchCachedImage(hash).then(res => {
            if (res) {
                setSvg(res);
            }
            else setError("Lỗi tải hình ảnh từ cache.");
        }).catch(e => setError(e.message));
    }, [hash]);

    if (error) return <div className="text-red-500 text-[10px] p-2 bg-red-50 rounded">{error}</div>;
    return <img src={svgImageSource(svg || '')} alt="Hình SVG đã biên dịch" className="block max-w-full h-auto mx-auto" />;
};

export const AdminSourceViewer: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<QuestionSource[]>([]);
    const [images, setImages] = useState<QuestionImage[]>([]);
    const [search, setSearch] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionSource | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'ALL' | 'RENDERED' | 'NOT_RENDERED' | 'NONE'>('ALL');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [auditRunning, setAuditRunning] = useState(false);
    const [auditScanned, setAuditScanned] = useState(0);
    const [auditCounts, setAuditCounts] = useState<Record<string, number> | null>(null);
    const [auditSamples, setAuditSamples] = useState<TikzAuditRow[]>([]);
    const [auditError, setAuditError] = useState<string | null>(null);
    const [job, setJob] = useState<TikzJob | null>(null);
    const [workerOnline, setWorkerOnline] = useState(false);
    const [jobBusy, setJobBusy] = useState(false);
    const [jobError, setJobError] = useState<string | null>(null);

    const refreshJob = async () => {
        const result = await apiService.fetchTikzJobStatus();
        setJob(result.job || null);
        setWorkerOnline(Boolean(result.worker));
    };

    useEffect(() => {
        refreshJob().catch(error => setJobError(error.message));
        const timer = window.setInterval(() => refreshJob().catch(error => setJobError(error.message)), 10_000);
        return () => window.clearInterval(timer);
    }, []);

    const startJob = async () => {
        if (!window.confirm('Lô này sẽ biên dịch và cập nhật SVG/câu hỏi trong database. Bạn đã sao lưu database và bật worker local chưa?')) return;
        setJobBusy(true);
        setJobError(null);
        try {
            const result = await apiService.startTikzJob();
            setJob(result.job);
            await refreshJob();
        } catch (error: any) { setJobError(error.message || 'Không thể tạo công việc.'); }
        finally { setJobBusy(false); }
    };

    const cancelJob = async () => {
        if (!job) return;
        setJobBusy(true);
        setJobError(null);
        try { setJob((await apiService.cancelTikzJob(job.id)).job); }
        catch (error: any) { setJobError(error.message || 'Không thể dừng công việc.'); }
        finally { setJobBusy(false); }
    };

    const scanAllTikz = async () => {
        setAuditRunning(true);
        setAuditError(null);
        setAuditScanned(0);
        setAuditSamples([]);
        const counts: Record<string, number> = {};
        let cursor = 0;
        let scanned = 0;
        try {
            while (true) {
                const page = await apiService.fetchTikzAuditPage(cursor, 100);
                const rows = page.data as TikzAuditRow[];
                for (const row of rows) counts[row.status] = (counts[row.status] || 0) + 1;
                scanned += rows.length;
                setAuditScanned(scanned);
                setAuditCounts({ ...counts });
                setAuditSamples(previous => [
                    ...previous,
                    ...rows.filter(row => !['READY', 'NO_TIKZ'].includes(row.status)),
                ].slice(0, 100));
                if (!page.hasMore) break;
                if (page.afterId <= cursor) throw new Error('Quét bị dừng do con trỏ không tiến.');
                cursor = page.afterId;
            }
        } catch (error: any) {
            setAuditError(error.message || 'Không thể quét TikZ.');
        } finally {
            setAuditRunning(false);
        }
    };

    const handleSelectQuestion = (q: QuestionSource) => {
        setSelectedQuestion(q);
        setEditContent(q.original_latex || q.content_latex);
        setIsEditing(false);
    };

    const handleSaveAndReset = async () => {
        if (!selectedQuestion) return;
        setIsSaving(true);
        try {
            // SVG hashes are shared by other questions; editing one source must not delete global images.
            // Update question with new raw latex, this will reset is_tikz_rendered to 0
            await apiService.updateQuestion(selectedQuestion.id, { 
                id_full: selectedQuestion.legacy_full_id,
                raw_latex: editContent 
            });
            
            // Refresh data
            const [qData, iData] = await Promise.all([
                apiService.fetchAdminQuestionsFull(1000, filterType),
                apiService.fetchAdminQuestionImages()
            ]);
            setQuestions(qData);
            setImages(iData);
            
            // Close modal
            setSelectedQuestion(null);
        } catch (err: any) {
            alert('Lỗi khi lưu và đặt lại: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [qData, iData] = await Promise.all([
                    apiService.fetchAdminQuestionsFull(1000, filterType),
                    apiService.fetchAdminQuestionImages()
                ]);
                setQuestions(qData);
                setImages(iData);
            } catch (err) {
                console.error("Lỗi tải dữ liệu admin:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [filterType]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = (q.legacy_full_id || '').toLowerCase().includes(search.toLowerCase()) ||
                              (q.content_latex || '').toLowerCase().includes(search.toLowerCase());
                              
        if (!matchesSearch) return false;
        
        // 0: pending
        // 1: success
        // 2: none
        const isRendered = Number(q.is_tikz_rendered);
        if (filterType === 'RENDERED') return isRendered === 1;
        if (filterType === 'NOT_RENDERED') return isRendered === 0;
        if (filterType === 'NONE') return isRendered === 2;
        return true;
    });

    const getImagesInQuestion = (content: string) => {
        const hashRegex = /\[TIKZ_HASH:([a-f0-9]{64})\]/g;
        const hashes: string[] = [];
        let match;
        while ((match = hashRegex.exec(content)) !== null) {
            hashes.push(match[1]);
        }
        return hashes.map(hash => images.find(img => img.tikz_hash === hash)).filter(Boolean) as QuestionImage[];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium italic">Đang truy vấn mã nguồn hệ thống...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-8">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Database className="text-indigo-600" size={32} />
                        Source & SVG Viewer
                    </h1>
                    <p className="text-slate-500 font-medium">Truy xuất mã vãng lai và tài nguyên SVG đã render</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 min-w-[320px]">
                    <select 
                        className="w-full sm:w-auto bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600 outline-none cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'ALL' | 'RENDERED' | 'NOT_RENDERED' | 'NONE')}
                    >
                        <option value="ALL">Tất cả câu hỏi</option>
                        <option value="RENDERED">Đã dựng hình TikZ (1)</option>
                        <option value="NOT_RENDERED">Chưa dựng hình TikZ (0)</option>
                        <option value="NONE">Không có hình (2)</option>
                    </select>

                    <div className="relative group w-full flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input 
                            type="search"
                            placeholder="Tìm theo ID6 hoặc từ khóa..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <section className="mb-8 rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Kiểm kê TikZ → SVG toàn database</h2>
                        <p className="text-sm text-slate-500">Đối chiếu mã TikZ, placeholder và SVG thực tế; không sửa database khi quét.</p>
                    </div>
                    <button type="button" onClick={scanAllTikz} disabled={auditRunning}
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                        {auditRunning ? 'Đang quét...' : 'Quét toàn bộ câu hỏi'}
                    </button>
                </div>
                {auditCounts && (
                    <div className="mt-5 flex flex-wrap gap-3 text-sm">
                        <span className="rounded-xl bg-slate-100 px-3 py-2">Đã quét: {auditScanned}</span>
                        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">Đủ SVG: {auditCounts.READY || 0}</span>
                        <span className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">Cần xử lý: {auditCounts.PENDING || 0}</span>
                        <span className="rounded-xl bg-red-50 px-3 py-2 text-red-700">Thiếu mã gốc: {auditCounts.MISSING_SOURCE || 0}</span>
                        <span className="rounded-xl bg-orange-50 px-3 py-2 text-orange-700">Nguồn lệch: {auditCounts.SOURCE_MISMATCH || 0}</span>
                        <span className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700">Nguồn lỗi: {auditCounts.MALFORMED_SOURCE || 0}</span>
                        <span className="rounded-xl bg-sky-50 px-3 py-2 text-sky-700">Hình khác TikZ: {auditCounts.OTHER_IMAGE || 0}</span>
                    </div>
                )}
                {auditError && <p className="mt-3 text-sm text-red-600">{auditError}</p>}
                {auditSamples.length > 0 && (
                    <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-100">
                        {auditSamples.map(row => (
                            <div key={row.id} className="flex flex-wrap gap-3 border-b border-slate-100 px-4 py-2 text-xs">
                                <span className="font-bold">#{row.id} {row.id_full || ''}</span>
                                <span>{row.status}</span>
                                <span>{row.images.filter(image => image.needsAction).length} hình cần xử lý</span>
                                {row.images.find(image => image.error)?.error && (
                                    <span className="text-red-600">{row.images.find(image => image.error)?.error}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-4 text-xs text-slate-500">Biên dịch trên máy local bằng <code>scripts/tikz_local_worker.py</code>; chỉ cập nhật câu hỏi sau khi SVG lưu thành công.</p>
            </section>

            <section className="mb-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Quét và biên dịch SVG bằng máy local</h2>
                        <p className="text-sm text-slate-500">Nút này tạo công việc trên Render. Worker local nhận việc, biên dịch LaTeX và đồng bộ từng hình.</p>
                        <p className={`mt-2 text-xs font-bold ${workerOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                            Worker: {workerOnline ? 'Đang kết nối' : 'Chưa kết nối — công việc sẽ chờ máy local'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={startJob} disabled={jobBusy || Boolean(job && ['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(job.status))}
                            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                            Quét và biên dịch
                        </button>
                        {job && ['QUEUED', 'RUNNING'].includes(job.status) && (
                            <button type="button" onClick={cancelJob} disabled={jobBusy}
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50">
                                Dừng công việc
                            </button>
                        )}
                    </div>
                </div>
                {job && (
                    <div className="mt-4 flex flex-wrap gap-3 text-sm" aria-live="polite">
                        <span className="rounded-xl bg-slate-100 px-3 py-2">Lô #{job.id}: {job.status}</span>
                        <span className="rounded-xl bg-slate-100 px-3 py-2">Đã quét: {job.scanned}</span>
                        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">Đã đồng bộ: {job.synced} hình</span>
                        <span className="rounded-xl bg-red-50 px-3 py-2 text-red-700">Lỗi: {job.failed}</span>
                        <span className="rounded-xl bg-slate-100 px-3 py-2">ID cuối: {job.afterId}</span>
                    </div>
                )}
                {job?.status === 'CANCEL_REQUESTED' && <p className="mt-3 text-xs text-amber-700">Worker sẽ dừng sau hình đang biên dịch.</p>}
                {job?.errorMessage && <p className="mt-3 text-xs text-red-700">{job.errorMessage}</p>}
                {jobError && <p className="mt-3 text-xs text-red-700">{jobError}</p>}
                <p className="mt-4 text-xs text-slate-500">Khởi động một lần <code>python scripts/tikz_local_worker.py --url URL_RENDER --daemon</code> trên máy có TeX. Để máy bật khi xử lý.</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Questions List */}
                <div className="lg:col-span-12 overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Câu hỏi</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái TikZ</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã nguồn LaTeX</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">SVG Hashes</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredQuestions.map((q) => {
                                    const hashes = getImagesInQuestion(q.content_latex);
                                    return (
                                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                    {q.legacy_full_id || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {Number(q.is_tikz_rendered) === 1 && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-100">Đã dựng (1)</span>}
                                                {Number(q.is_tikz_rendered) === 0 && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase tracking-widest border border-amber-100">Chưa dựng (0)</span>}
                                                {Number(q.is_tikz_rendered) === 2 && <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded uppercase tracking-widest border border-slate-200">Không có hình (2)</span>}
                                                {![0, 1, 2].includes(Number(q.is_tikz_rendered)) && <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded uppercase tracking-widest border border-slate-200">KXD</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-md truncate font-mono text-[11px] text-slate-400 italic">
                                                    {q.content_latex}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap justify-center gap-1.5">
                                                    {hashes.length > 0 ? (
                                                        hashes.map(h => (
                                                            <div key={h.tikz_hash} className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold border border-amber-100" title={h.tikz_hash}>
                                                                {h.tikz_hash.substring(0, 8)}...
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-300 text-[10px]">No SVG</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleSelectQuestion(q)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                                >
                                                    <Eye size={14} />
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Source Detail Modal */}
            <AnimatePresence>
                {selectedQuestion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedQuestion(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                        <Code size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">
                                            Chi tiết mã nguồn
                                        </h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            ID: <span className="text-indigo-500 font-mono">{selectedQuestion.legacy_full_id}</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedQuestion(null)}
                                    className="w-10 h-10 rounded-full hover:bg-white text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: LaTeX Sources */}
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Database size={14} /> mã nguồn gốc
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {!isEditing ? (
                                                        <>
                                                            <button 
                                                                onClick={() => setIsEditing(true)}
                                                                className="text-[10px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-white border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded-lg transition-colors"
                                                            >
                                                                Sửa mã
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCopy(selectedQuestion.original_latex || selectedQuestion.content_latex, 'orig')}
                                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg"
                                                            >
                                                                {copiedId === 'orig' ? <Check size={10} /> : <Copy size={10} />}
                                                                {copiedId === 'orig' ? 'Đã chép' : 'Sao chép'}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => setIsEditing(false)}
                                                                className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button 
                                                                onClick={handleSaveAndReset}
                                                                disabled={isSaving}
                                                                className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
                                                            >
                                                                {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                                                                Lưu & Đặt lại
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-indigo-300 border border-slate-800 shadow-inner min-h-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                                                    spellCheck="false"
                                                />
                                            ) : (
                                                <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-indigo-300 overflow-x-auto whitespace-pre-wrap border border-slate-800 shadow-inner min-h-[200px]">
                                                    {selectedQuestion.original_latex || selectedQuestion.content_latex}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Wand2 size={14} /> mã đã render (SVG Placeholders)
                                                </h3>
                                                <button 
                                                    onClick={() => handleCopy(selectedQuestion.content_latex, 'proc')}
                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg"
                                                >
                                                    {copiedId === 'proc' ? <Check size={10} /> : <Copy size={10} />}
                                                    {copiedId === 'proc' ? 'Đã chép' : 'Sao chép'}
                                                </button>
                                            </div>
                                            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-amber-300 overflow-x-auto whitespace-pre-wrap border border-slate-800 shadow-inner min-h-[200px]">
                                                {selectedQuestion.content_latex}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: SVG Assets */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ImageIcon size={14} /> Tài nguyên SVG Liên quan
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {getImagesInQuestion(selectedQuestion.content_latex).length > 0 ? (
                                                getImagesInQuestion(selectedQuestion.content_latex).map((img, idx) => (
                                                    <div key={img.tikz_hash} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xs">
                                                                    #{idx + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">
                                                                        HASH: {img.tikz_hash}
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-400 uppercase font-bold">Rendered at {new Date(img.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleCopy(img.svg_content, img.tikz_hash)}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                                title="Copy SVG XML"
                                                            >
                                                                {copiedId === img.tikz_hash ? <Check size={18} /> : <ImageIcon size={18} />}
                                                            </button>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-dashed border-slate-200 min-h-[200px] overflow-hidden">
                                                            <div className="max-w-full w-full">
                                                                <SvgViewer hash={img.tikz_hash} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
                                                    <ImageIcon size={48} className="text-slate-200 mb-4" />
                                                    <p className="text-slate-400 font-medium">Không tìm thấy mã SVG nào liên kết với câu hỏi này.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-center">
                                <button 
                                    onClick={() => setSelectedQuestion(null)}
                                    className="px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                                >
                                    Đóng trình xem
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
