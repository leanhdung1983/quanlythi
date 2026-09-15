
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../services/api';
import { Question } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { 
    Trash2, CheckCircle2, RefreshCw, Loader2, 
    Copy, Calendar, BarChart3, Zap
} from 'lucide-react';
import { useAuthStore } from '../services/authStore';

export const DuplicateManager: React.FC = () => {
    const { user } = useAuthStore();
    const [groups, setGroups] = useState<Question[][]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [jobId, setJobId] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [rehashing, setRehashing] = useState(false);
    
    // State to track which ID is selected as "Keeper" for each group
    const [selections, setSelections] = useState<Record<number, number>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return groups.slice(start, start + itemsPerPage);
    }, [groups, currentPage]);

    const totalPages = Math.ceil(groups.length / itemsPerPage);
    
    // Logic to pick the best "Original" question
    const determineBestCandidate = (group: Question[]): number => {
        // Priority 1: Has a valid ID6 format (e.g., 2D1H1-1) AND not just a placeholder/number
        const validIdRegex = /^[0-2][DHC]\d+[NHVCX]\d+-\d+$/;
        
        const validIds = group.filter(q => validIdRegex.test(q.id_full || ''));
        if (validIds.length > 0) {
            // Sub-priority: Most used (used_count)
            validIds.sort((a, b) => (b.used_count || 0) - (a.used_count || 0));
            // Sub-sub-priority: Oldest (created_at) - implied by lower ID usually
            return validIds[0].id;
        }

        // Priority 2: Most used
        const sortedByUsage = [...group].sort((a, b) => (b.used_count || 0) - (a.used_count || 0));
        if ((sortedByUsage[0].used_count || 0) > (sortedByUsage[1]?.used_count || 0)) {
            return sortedByUsage[0].id;
        }

        // Fallback: Keep the oldest record (lowest ID)
        const sortedById = [...group].sort((a, b) => a.id - b.id);
        return sortedById[0].id;
    };

    const scanDuplicates = useCallback(async () => {
        setLoading(true);
        setCurrentPage(1);
        try {
            const res = await apiService.findDuplicates();
            if (res && res.groups) {
                const foundGroups: Question[][] = res.groups;
                setGroups(foundGroups);
                
                // Auto-select the best candidate to keep for each group
                const initialSelections: Record<number, number> = {};
                foundGroups.forEach((group, idx) => {
                    initialSelections[idx] = determineBestCandidate(group);
                });
                setSelections(initialSelections);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi khi quét dữ liệu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (jobId) {
            const interval = setInterval(async () => {
                try {
                    const res = await apiService.fetchJobStatus(jobId);
                    if (res.success) {
                        setProgress(res.data.progress);
                        if (res.data.status === 'COMPLETED') {
                            setJobId(null);
                            setProcessing(false);
                            scanDuplicates();
                        } else if (res.data.status === 'FAILED') {
                            setJobId(null);
                            setProcessing(false);
                            alert("Lỗi tác vụ: " + res.data.error_message);
                        }
                    }
                } catch (e) { console.error(e); }
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [jobId, scanDuplicates]);

    const startScanJob = async () => {
        if (!user) return;
        setProcessing(true);
        setProgress(0);
        try {
            const res = await apiService.createJob('DUPLICATE_SCAN', user.id);
            if (res.success) {
                setJobId(res.jobId);
            }
        } catch (e) {
            console.error(e);
            setProcessing(false);
        }
    };

    const rehashQuestions = async () => {
        setRehashing(true);
        try {
            const res = await apiService.rehashQuestions();
            if (res.success) {
                alert(`Đã băm xong ${res.count} câu hỏi mới.`);
                scanDuplicates();
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi khi băm dữ liệu.");
        } finally {
            setRehashing(false);
        }
    };

    const handleKeepSelection = (groupIdx: number, questionId: number) => {
        setSelections(prev => ({ ...prev, [groupIdx]: questionId }));
    };

    const resolveGroup = async (groupIdx: number) => {
        const group = groups[groupIdx];
        const keepId = selections[groupIdx];
        const deleteIds = group.filter(q => q.id !== keepId).map(q => q.id);

        if (deleteIds.length === 0) return;

        // Optimistic UI update
        const backupGroups = [...groups];
        setGroups(prev => prev.filter((_, i) => i !== groupIdx));

        try {
            await apiService.bulkDeleteQuestions(deleteIds, user?.id);
        } catch (e: unknown) {
            alert("Lỗi xoá: " + (e as Error).message);
            setGroups(backupGroups); // Revert on error
        }
    };

    const resolveAll = async () => {
        const totalToDelete = groups.reduce((acc, group, idx) => {
            const keepId = selections[idx];
            return acc + group.filter(q => q.id !== keepId).length;
        }, 0);

        if (totalToDelete === 0) return;

        if (!confirm(`Hành động này sẽ XOÁ VĨNH VIỄN ${totalToDelete} câu hỏi trùng lặp và chỉ giữ lại các câu được đánh dấu 'Chuẩn'.\n\nBạn có chắc chắn không?`)) return;

        setProcessing(true);
        try {
            // Collect all IDs to delete
            let allDeleteIds: number[] = [];
            groups.forEach((group, idx) => {
                const keepId = selections[idx];
                const ids = group.filter(q => q.id !== keepId).map(q => q.id);
                allDeleteIds = [...allDeleteIds, ...ids];
            });

            // Chunk requests if too many
            const chunkSize = 500;
            for (let i = 0; i < allDeleteIds.length; i += chunkSize) {
                const chunk = allDeleteIds.slice(i, i + chunkSize);
                await apiService.bulkDeleteQuestions(chunk, user?.id);
            }

            alert(`Đã xử lý xong! Dọn dẹp ${allDeleteIds.length} câu hỏi rác.`);
            scanDuplicates(); // Refresh
        } catch (e: unknown) {
            alert("Lỗi xử lý hàng loạt: " + (e as Error).message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4 min-w-[800px]">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Copy className="text-orange-500"/> Quản lý Trùng lặp
                    </h1>
                    <p className="text-xs text-slate-500">Phát hiện và xử lý các câu hỏi có nội dung LaTeX giống nhau.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={rehashQuestions} 
                        disabled={loading || processing || rehashing}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        {rehashing ? <Loader2 size={16} className="animate-spin text-indigo-500"/> : <Zap size={16} className="text-indigo-500"/>} 
                        {rehashing ? 'Đang băm...' : 'Đồng bộ Mã băm'}
                    </button>
                    <button 
                        onClick={startScanJob} 
                        disabled={loading || processing}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        {processing ? <Loader2 size={16} className="animate-spin text-orange-500"/> : <RefreshCw size={16}/>} 
                        {processing ? `Đang quét (${progress}%)` : 'Quét tác vụ nền'}
                    </button>
                    <button 
                        onClick={scanDuplicates} 
                        disabled={loading || processing}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Xem kết quả
                    </button>
                    {groups.length > 0 && (
                        <button 
                            onClick={resolveAll}
                            disabled={processing}
                            className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18}/>}
                            Xử lý tất cả ({groups.length} nhóm)
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 size={48} className="animate-spin text-orange-500"/>
                        <p className="font-medium animate-pulse">Đang quét toàn bộ cơ sở dữ liệu...</p>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <div className="p-6 bg-green-50 rounded-full">
                            <CheckCircle2 size={64} className="text-green-500"/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">Tuyệt vời!</h3>
                        <p>Không tìm thấy câu hỏi trùng lặp nào trong CSDL.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar space-y-6">
                        {paginatedGroups.map((group, pIdx) => {
                            const idx = (currentPage - 1) * itemsPerPage + pIdx;
                            return (
                                <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                    {/* Group Header */}
                                    <div className="px-4 py-3 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">Nhóm #{idx + 1}</span>
                                            <span className="text-xs text-slate-500 font-medium">Tìm thấy {group.length} bản sao</span>
                                        </div>
                                        <button 
                                            onClick={() => resolveGroup(idx)}
                                            className="text-xs bg-white border border-slate-300 hover:border-red-300 hover:text-red-600 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 size={12}/> Xoá các câu thừa
                                        </button>
                                    </div>

                                    <div className="flex flex-col md:flex-row">
                                        {/* Content Preview (Left) */}
                                        <div className="md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Nội dung trùng lặp:</p>
                                            <div className="text-sm text-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                                                <MathRenderer content={group[0].original_latex || group[0].raw_latex} mode="all" isExTest={true} />
                                            </div>
                                        </div>

                                        {/* List of Duplicates (Right) */}
                                        <div className="md:w-1/2 p-0">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                                    <tr>
                                                        <th className="p-3 w-10">Chọn</th>
                                                        <th className="p-3">ID & Loại</th>
                                                        <th className="p-3 text-right">Thông tin</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {group.map(q => {
                                                        const isSelected = selections[idx] === q.id;
                                                        return (
                                                            <tr 
                                                                key={q.id} 
                                                                onClick={() => handleKeepSelection(idx, q.id)}
                                                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                                                            >
                                                                <td className="p-3 text-center">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${isSelected ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'}`}>
                                                                        {isSelected && <CheckCircle2 size={12}/>}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`font-mono font-bold ${isSelected ? 'text-green-700' : 'text-slate-700'}`}>{q.id_full || 'NO-ID'}</span>
                                                                        {isSelected && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold border border-green-200">GIỮ LẠI</span>}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                                                                        <span>#{q.id}</span>
                                                                        <span>•</span>
                                                                        <span className="uppercase">{q.q_type}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex flex-col items-end gap-0.5">
                                                                        <span className="flex items-center gap-1 text-slate-600" title="Ngày tạo">
                                                                            <Calendar size={10}/> {new Date(q.created_at).toLocaleDateString('vi-VN')}
                                                                        </span>
                                                                        <span className="flex items-center gap-1 text-slate-500" title="Số lần sử dụng">
                                                                            <BarChart3 size={10}/> {q.used_count || 0} lần
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4 pb-8">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-white border border-slate-300 rounded-md text-sm font-medium disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <span className="text-sm font-bold text-slate-600">Trang {currentPage} / {totalPages}</span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 bg-white border border-slate-300 rounded-md text-sm font-medium disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
