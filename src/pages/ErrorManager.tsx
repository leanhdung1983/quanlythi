
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { QuestionReport } from '../types';
import { useLanguageStore } from '../services/languageStore';
import { useAuthStore } from '../services/authStore';
import { TikZRenderer } from '../components/TikZRenderer';
import { MathRenderer } from '../components/MathRenderer';
import { 
    Flag, CheckCircle2, AlertCircle, Save, Loader2, Eye, X
} from 'lucide-react';

export const ErrorManager: React.FC = () => {
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    const [reports, setReports] = useState<QuestionReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await apiService.fetchReports();
            setReports(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const pendingReports = useMemo(() => {
        return reports.filter(r => r.status === 'PENDING');
    }, [reports]);

    const handleSelectReport = (report: QuestionReport) => {
        setSelectedReport(report);
        setEditContent(report.raw_latex || '');
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedReport) return;
        try {
            await apiService.updateReportStatus(selectedReport.id, status);
            setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: status as 'PENDING' | 'RESOLVED' | 'IGNORED' } : r));
            if (status !== 'PENDING') {
                setSelectedReport(null);
            }
        } catch (e) {
            console.error("Update status error:", e);
            alert("Lỗi cập nhật trạng thái");
        }
    };

    const handleSaveQuestion = async () => {
        if (!selectedReport) return;
        setIsSaving(true);
        try {
            // Update content AND resolve status atomically
            await apiService.updateQuestion(selectedReport.question_id, { raw_latex: editContent });
            await apiService.updateReportStatus(selectedReport.id, 'RESOLVED');
            
            setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: 'RESOLVED', raw_latex: editContent } : r));
            
            alert("Đã lưu sửa đổi và đánh dấu đã xử lý!");
            setSelectedReport(null); 
        } catch (e: unknown) {
            const error = e as Error;
            alert("Lỗi lưu: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!selectedReport) return;
        if (!window.confirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN câu hỏi này không? Thao tác này không thể hoàn tác.")) return;
        
        setIsSaving(true);
        try {
            await apiService.deleteQuestion(selectedReport.question_id, user?.id);
            // Also mark the report as resolved since the question is gone
            await apiService.updateReportStatus(selectedReport.id, 'RESOLVED');
            
            setReports(prev => prev.filter(r => r.id !== selectedReport.id));
            alert("Đã xóa câu hỏi thành công!");
            setSelectedReport(null);
        } catch (e: unknown) {
            const error = e as Error;
            alert("Lỗi xóa: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-2 min-w-[1024px] overflow-hidden">
            <div className="shrink-0 flex items-center justify-between px-2">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Flag className="text-red-500" size={24}/> {t('error_manager')}
                </h1>
                <div className="text-xs text-slate-500 italic">
                    Danh sách các câu hỏi bị báo lỗi cần xử lý.
                </div>
            </div>

            <div className="flex gap-3 flex-1 min-h-0 overflow-hidden pb-2">
                {/* LEFT: Report List */}
                <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex justify-between items-center text-sm">
                        <span>Cần xử lý</span>
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{pendingReports.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? <div className="p-8 text-center"><Loader2 className="animate-spin inline text-slate-400"/></div> : 
                        pendingReports.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                <CheckCircle2 size={32} className="text-green-500 opacity-50"/>
                                <span>Không có báo lỗi mới.</span>
                            </div>
                        ) :
                        pendingReports.map(r => (
                            <div 
                                key={r.id} 
                                onClick={() => handleSelectReport(r)}
                                className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedReport?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">#{r.id}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="font-bold text-xs text-slate-800 mb-1 truncate">{r.id_full || `Q#${r.question_id}`}</div>
                                <div className="text-xs text-slate-600 bg-slate-100 p-2 rounded-lg relative">
                                    <AlertCircle size={10} className="absolute top-2 left-2 text-red-400"/>
                                    <p className="pl-4 italic line-clamp-2" title={r.report_reason}>{r.report_reason}</p>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400">Reporter: {r.reporter_name || 'Anonymous'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Detail & Editor */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                    {selectedReport ? (
                        <>
                            {/* HEADER */}
                            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-800">Sửa lỗi ID: {selectedReport.id_full}</span>
                                            <span className="text-xs text-slate-400 bg-white border px-1.5 rounded">QID: {selectedReport.question_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleUpdateStatus('IGNORED')} className="px-4 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">Bỏ qua báo cáo</button>
                                    <button onClick={() => setSelectedReport(null)} className="p-1.5 text-slate-400 hover:text-slate-700"><X size={20}/></button>
                                </div>
                            </div>

                            {/* REASON BOX */}
                            <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-red-800 text-sm flex items-start gap-3 shrink-0">
                                <div className="p-1 bg-red-100 rounded-full text-red-600"><Flag size={16}/></div>
                                <div className="flex-1">
                                    <div className="font-bold text-xs uppercase mb-1 opacity-70">Lý do báo lỗi:</div>
                                    <div className="font-medium">{selectedReport.report_reason}</div>
                                </div>
                            </div>

                            {/* EDITOR AREA - SPLIT VIEW */}
                            <div className="flex-1 flex min-h-0 relative">
                                <div className="absolute inset-0 grid grid-cols-2 divide-x divide-slate-200">
                                    {/* Code Editor */}
                                    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
                                        <div className="p-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between shrink-0">
                                            <span>Mã nguồn LaTeX</span>
                                            <div className="flex items-center gap-2">
                                                {selectedReport.original_latex && selectedReport.raw_latex?.includes('TIKZ_HASH') && (
                                                    <button 
                                                        onClick={() => setEditContent(selectedReport.original_latex || '')}
                                                        className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-200 hover:bg-amber-100 transition-colors"
                                                        title="Khôi phục lại mã TikZ gốc để render lại"
                                                    >
                                                        Khôi phục TikZ gốc
                                                    </button>
                                                )}
                                                <span className="text-blue-600 bg-blue-50 px-2 rounded border border-blue-100">Editable</span>
                                            </div>
                                        </div>
                                        <textarea 
                                            className="flex-1 w-full p-4 font-mono text-sm resize-none outline-none focus:bg-white transition-colors overflow-y-auto custom-scrollbar leading-relaxed text-slate-700"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                    
                                    {/* Preview */}
                                    <div className="flex flex-col h-full overflow-hidden bg-white">
                                        <div className="p-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-2 shrink-0">
                                            <Eye size={12}/> Live Preview
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col items-center">
                                            {/* Smart Renderer Choice */}
                                            <div className="prose prose-sm max-w-none w-full">
                                                <MathRenderer content={editContent} mode="all" isExTest={true} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-3 border-t border-slate-200 flex justify-between gap-3 bg-white shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <button 
                                    onClick={handleDeleteQuestion}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <X size={18}/>
                                    Xóa câu hỏi này
                                </button>
                                
                                <button 
                                    onClick={handleSaveQuestion} 
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-100 disabled:opacity-50 transition-all"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                    Lưu & Đánh dấu Đã xử lý
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <Flag size={48} className="opacity-20 text-slate-400"/>
                            </div>
                            <p className="font-bold text-lg text-slate-400">Chọn một báo cáo để xử lý</p>
                            <p className="text-sm">Hệ thống hỗ trợ sửa lỗi trực tiếp và xem trước kết quả.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
