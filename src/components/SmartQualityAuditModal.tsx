import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle, 
    X, 
    Loader2, 
    RefreshCw, 
    Sparkles, 
    Copy, 
    Check, 
    ArrowRight, 
    FileText, 
    Database, 
    Layers, 
    HelpCircle, 
    ChevronDown, 
    ChevronUp, 
    BookOpen, 
    Play, 
    Pause, 
    Square, 
    Filter,
    FileCheck2,
    Eye,
    CheckCheck,
    Search
} from 'lucide-react';
import { QuestionQualityCheck7Steps, QuestionQualitySummary, QualityCheckStepDetail } from '../types';
import { 
    qualityCheckQuestion7Steps, 
    batchQualityCheckBank, 
    fetchQualitySummary,
    fetchQualityQuestions,
    confirmQualityCheckResolved
} from '../services/aiService';
import { MathRenderer } from './MathRenderer';

interface SmartQualityAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentQuestion: {
        id: number;
        content: string;
        assignedId: string;
        originalId: string;
        dbId?: number;
        qualityCheck?: QuestionQualityCheck7Steps;
    } | null;
    onApplySuggestedId: (newId: string, questionDbId?: number) => Promise<void> | void;
    onApplyRewrittenContent: (newContent: string, questionDbId?: number, questionWorkItemId?: number) => Promise<void> | void;
    onQuestionQualityUpdated?: (result: QuestionQualityCheck7Steps) => void;
    isAdminOrTeacher: boolean;
}

const STEP_DEFINITIONS = [
    {
        key: 'step1_purpose',
        num: 1,
        title: 'Xác định mục đích',
        desc: 'Câu hỏi cần giúp bạn tìm hiểu, quyết định hoặc làm rõ điều gì? Đo lường kiến thức, kỹ năng gì?'
    },
    {
        key: 'step2_clarity',
        num: 2,
        title: 'Kiểm tra độ rõ',
        desc: 'Người đọc có hiểu câu hỏi đang hỏi về điều gì không? Có từ ngữ mơ hồ hoặc nhiều cách hiểu không?'
    },
    {
        key: 'step3_scope',
        num: 3,
        title: 'Kiểm tra phạm vi',
        desc: 'Câu hỏi có quá rộng hoặc quá hẹp không? Đã nêu rõ đối tượng, thời gian, bối cảnh cần thiết chưa?'
    },
    {
        key: 'step4_answerability',
        num: 4,
        title: 'Kiểm tra tính trả lời được',
        desc: 'Người trả lời có đủ thông tin để trả lời không? Câu hỏi có đòi hỏi dữ liệu hoặc kiến thức không thể tiếp cận không?'
    },
    {
        key: 'step5_neutrality',
        num: 5,
        title: 'Kiểm tra tính trung lập',
        desc: 'Câu hỏi có vô tình gợi ý câu trả lời, áp đặt giả định hoặc mang tính dẫn dắt không?'
    },
    {
        key: 'step6_structure',
        num: 6,
        title: 'Kiểm tra cấu trúc',
        desc: 'Câu hỏi có đang hỏi nhiều việc cùng lúc không? Nếu có, hãy tách thành các câu riêng.'
    },
    {
        key: 'step7_rewrite',
        num: 7,
        title: 'Viết lại và thử đọc',
        desc: 'Viết câu hỏi ngắn gọn hơn, rồi thử xem một người không biết bối cảnh có hiểu đúng ý bạn không.'
    }
];

export const SmartQualityAuditModal: React.FC<SmartQualityAuditModalProps> = ({
    isOpen,
    onClose,
    currentQuestion,
    onApplySuggestedId,
    onApplyRewrittenContent,
    onQuestionQualityUpdated,
    isAdminOrTeacher
}) => {
    const [activeTab, setActiveTab] = useState<'CURRENT' | 'BANK'>('CURRENT');

    // Single Question State
    const [isLoadingSingle, setIsLoadingSingle] = useState(false);
    const [singleResult, setSingleResult] = useState<QuestionQualityCheck7Steps | null>(null);
    const [copiedRewrite, setCopiedRewrite] = useState(false);
    const [showLatexPreview, setShowLatexPreview] = useState(false);
    const [forceRefreshSingle, setForceRefreshSingle] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
        step1_purpose: true,
        step2_clarity: true,
        step3_scope: true,
        step4_answerability: true,
        step5_neutrality: true,
        step6_structure: true,
        step7_rewrite: true
    });

    // Bank-wide State
    const [summary, setSummary] = useState<QuestionQualitySummary | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isBankAuditing, setIsBankAuditing] = useState(false);
    const [onlyUntested, setOnlyUntested] = useState(true);
    const [bankAuditProgress, setBankAuditProgress] = useState({ current: 0, total: 0, remaining: 0, message: '' });
    const [bankResults, setBankResults] = useState<any[]>([]);
    const [bankFilter, setBankFilter] = useState<'ALL' | 'STANDARD' | 'SUBSTANDARD'>('ALL');
    const [selectedBankItem, setSelectedBankItem] = useState<any | null>(null);
    const cancelBankAuditRef = useRef(false);

    // Filterable CSDL Questions Inspection State
    const [selectedCategory, setSelectedCategory] = useState<'SUBSTANDARD' | 'STANDARD' | 'UNCHECKED' | 'ALL'>('SUBSTANDARD');
    const [bankQuestionsList, setBankQuestionsList] = useState<any[]>([]);
    const [isLoadingQuestionsList, setIsLoadingQuestionsList] = useState(false);
    const [confirmingQuestionId, setConfirmingQuestionId] = useState<number | null>(null);
    const [confirmNotice, setConfirmNotice] = useState<string>('');
    const [questionSearch, setQuestionSearch] = useState<string>('');

    // Sync current question quality check when modal opens or question changes
    useEffect(() => {
        if (!isOpen) return;
        if (currentQuestion?.qualityCheck) {
            setSingleResult(currentQuestion.qualityCheck);
        } else {
            setSingleResult(null);
        }
    }, [isOpen, currentQuestion?.id, currentQuestion?.qualityCheck]);

    // Fetch summary and questions list when switching to BANK tab
    useEffect(() => {
        if (isOpen && activeTab === 'BANK') {
            loadSummary();
            loadQuestionsList(selectedCategory);
        }
    }, [isOpen, activeTab]);

    const loadSummary = async () => {
        setIsLoadingSummary(true);
        try {
            const data = await fetchQualitySummary();
            setSummary(data);
        } catch (e) {
            console.error('Failed to load quality summary:', e);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const loadQuestionsList = async (category: 'SUBSTANDARD' | 'STANDARD' | 'UNCHECKED' | 'ALL' = selectedCategory) => {
        setIsLoadingQuestionsList(true);
        try {
            const apiStatus = category === 'SUBSTANDARD' ? 'substandard' : category === 'STANDARD' ? 'standard' : category === 'UNCHECKED' ? 'unchecked' : 'all';
            const res = await fetchQualityQuestions({ status: apiStatus as any, limit: 100 });
            setBankQuestionsList(res.items || []);
        } catch (e: any) {
            console.error('Failed to load quality questions list:', e);
        } finally {
            setIsLoadingQuestionsList(false);
        }
    };

    const handleSelectCategory = (cat: 'SUBSTANDARD' | 'STANDARD' | 'UNCHECKED' | 'ALL') => {
        setSelectedCategory(cat);
        loadQuestionsList(cat);
    };

    // Xác nhận đã chỉnh sửa / Đánh dấu câu hỏi đạt chuẩn
    const handleConfirmResolved = async (questionDbId?: number) => {
        const targetId = questionDbId || activeDbId;
        if (!targetId) {
            alert('Câu hỏi chưa được lưu vào cơ sở dữ liệu để cập nhật trạng thái.');
            return;
        }

        setConfirmingQuestionId(targetId);
        try {
            await confirmQualityCheckResolved(targetId);

            // Cập nhật câu hỏi đang xem nếu trùng
            if (singleResult && (singleResult.question_id === targetId || (singleResult as any).id === targetId || activeDbId === targetId)) {
                const updatedSteps: any = { ...(singleResult.steps || {}) };
                STEP_DEFINITIONS.forEach(s => {
                    if (!updatedSteps[s.key]) {
                        updatedSteps[s.key] = { passed: true, name: s.title, evaluation: 'Đã chuẩn hóa hoàn thiện', advice: '' };
                    } else {
                        updatedSteps[s.key] = { ...updatedSteps[s.key], passed: true, evaluation: 'Đã hoàn tất chỉnh sửa và xác nhận đạt chuẩn' };
                    }
                });

                const updated = {
                    ...singleResult,
                    is_standard: true,
                    score: 7,
                    steps: updatedSteps,
                    overall_comment: 'Đã được giáo viên/chuyên gia kiểm tra, chỉnh sửa hoàn thiện và xác nhận đạt chuẩn 7 bước.'
                };
                setSingleResult(updated);
                onQuestionQualityUpdated?.(updated);
            }

            // Cập nhật trong danh sách bankQuestionsList
            setBankQuestionsList(prev => prev.map(item => {
                if (item.id === targetId || item.question_id === targetId) {
                    return {
                        ...item,
                        is_standard: true,
                        score: 7,
                        overall_comment: 'Đã được giáo viên/chuyên gia kiểm tra, chỉnh sửa hoàn thiện và xác nhận đạt chuẩn 7 bước.'
                    };
                }
                return item;
            }));

            // Cập nhật trong bankResults nếu có
            setBankResults(prev => prev.map(item => {
                if (item.id === targetId || item.question_id === targetId) {
                    return {
                        ...item,
                        is_standard: true,
                        score: 7,
                        overall_comment: 'Đã được giáo viên/chuyên gia kiểm tra, chỉnh sửa hoàn thiện và xác nhận đạt chuẩn 7 bước.'
                    };
                }
                return item;
            }));

            // Đồng bộ lại số liệu thống kê
            await loadSummary();

            setConfirmNotice(`✓ Đã xác nhận câu hỏi #${targetId} hoàn thành chỉnh sửa và đạt chuẩn 7 bước!`);
            setTimeout(() => setConfirmNotice(''), 4500);
        } catch (err: any) {
            console.error('Failed to confirm resolved:', err);
            alert(`Lỗi khi xác nhận chỉnh sửa: ${err?.message || 'Có lỗi xảy ra'}`);
        } finally {
            setConfirmingQuestionId(null);
        }
    };

    // Helper computed properties for active question (either from workspace or bank inspection)
    const activeDbId = singleResult?.question_id || (singleResult as any)?.id || currentQuestion?.dbId;
    const activeContent = singleResult?.content_latex || currentQuestion?.content || '';
    const activeCurrentId = singleResult?.current_id || (singleResult as any)?.legacy_full_id || currentQuestion?.assignedId || 'Chưa gắn mã ID';
    const activeLabel = activeDbId ? `DB #${activeDbId}` : (currentQuestion ? `#${currentQuestion.id + 1}` : '—');
    const isViewingBankItem = Boolean(singleResult?.content_latex && singleResult.content_latex !== currentQuestion?.content);

    const handleRunSingleCheck = async (force = false) => {
        if (!activeContent) return;
        setIsLoadingSingle(true);
        try {
            const res = await qualityCheckQuestion7Steps({
                latex: activeContent,
                currentId: activeCurrentId !== 'Chưa gắn mã ID' ? activeCurrentId : undefined,
                questionId: activeDbId,
                forceRefresh: force || forceRefreshSingle
            });
            setSingleResult({
                ...res,
                id: activeDbId,
                question_id: activeDbId,
                content_latex: activeContent,
                current_id: activeCurrentId,
                legacy_full_id: activeCurrentId
            });
            onQuestionQualityUpdated?.(res);
        } catch (e: any) {
            console.error('Quality check failed:', e);
            alert(`Lỗi kiểm định câu hỏi: ${e?.message || 'Không thể kết nối AI.'}`);
        } finally {
            setIsLoadingSingle(false);
        }
    };

    const handleCopyRewrite = (latex: string) => {
        navigator.clipboard.writeText(latex);
        setCopiedRewrite(true);
        setTimeout(() => setCopiedRewrite(false), 2000);
    };

    const toggleStep = (key: string) => {
        setExpandedSteps(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAllSteps = (expand: boolean) => {
        const next: Record<string, boolean> = {};
        STEP_DEFINITIONS.forEach(s => { next[s.key] = expand; });
        setExpandedSteps(next);
    };

    // Bank Audit loop
    const handleStartBankAudit = async () => {
        setIsBankAuditing(true);
        cancelBankAuditRef.current = false;

        try {
            const sum = await fetchQualitySummary();
            setSummary(sum);

            const total = onlyUntested ? sum.unchecked_count : sum.total_questions;
            if (total === 0) {
                alert('Tất cả câu hỏi trong ngân hàng đều đã được kiểm tra!');
                setIsBankAuditing(false);
                return;
            }

            let processedCount = 0;
            let currentRemaining = total;

            while (!cancelBankAuditRef.current && currentRemaining > 0) {
                setBankAuditProgress({
                    current: processedCount,
                    total,
                    remaining: currentRemaining,
                    message: `Đang kiểm định lô câu hỏi (${processedCount}/${total})...`
                });

                const res = await batchQualityCheckBank({
                    limit: 2,
                    forceRefresh: !onlyUntested
                });

                if (!res.results || res.results.length === 0) {
                    break;
                }

                processedCount += res.processed;
                currentRemaining = res.remaining;
                setBankResults(prev => [...res.results, ...prev]);

                if (currentRemaining === 0) break;

                // Rest 1.2s to prevent rate limit
                await new Promise(r => setTimeout(r, 1200));
            }

            // Refresh summary
            await loadSummary();
        } catch (e: any) {
            if (!cancelBankAuditRef.current) {
                console.error('Bank audit error:', e);
                const isNetworkError = e?.message?.includes('Failed to fetch') || e?.name === 'TypeError';
                const msg = isNetworkError
                    ? 'Không thể kết nối đến máy chủ backend (Failed to fetch). Vui lòng kiểm tra server ứng dụng đang chạy (npm run dev).'
                    : (e?.message || 'Có lỗi xảy ra.');
                alert(`Lỗi kiểm định hàng loạt: ${msg}`);
            }
        } finally {
            setIsBankAuditing(false);
            setBankAuditProgress({ current: 0, total: 0, remaining: 0, message: '' });
        }
    };

    const handleStopBankAudit = () => {
        cancelBankAuditRef.current = true;
        setIsBankAuditing(false);
    };

    if (!isOpen) return null;

    const filteredBankResults = bankResults.filter(item => {
        if (bankFilter === 'STANDARD') return item.is_standard;
        if (bankFilter === 'SUBSTANDARD') return !item.is_standard;
        return true;
    });

    const filteredBankQuestions = bankQuestionsList.filter(item => {
        if (!questionSearch.trim()) return true;
        const q = questionSearch.toLowerCase();
        const idStr = String(item.id || item.question_id || '');
        const currentId = (item.current_id || item.legacy_full_id || '').toLowerCase();
        const suggestedId = (item.suggested_id || '').toLowerCase();
        const latex = (item.content_latex || '').toLowerCase();
        const comment = (item.overall_comment || '').toLowerCase();
        return idStr.includes(q) || currentId.includes(q) || suggestedId.includes(q) || latex.includes(q) || comment.includes(q);
    });

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95">
                
                {/* MODAL HEADER */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                                    Kiểm Tra Đề Thông Minh — Quy Trình 7 Bước
                                </h2>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                                    AI Khảo Thí
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                                Thẩm định chuẩn mực sư phạm: Mục đích • Độ rõ • Phạm vi • Tính trả lời • Tính trung lập • Cấu trúc • Viết lại
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200">
                            <button
                                onClick={() => setActiveTab('CURRENT')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                    activeTab === 'CURRENT'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <FileCheck2 size={14} />
                                <span>Câu hỏi hiện tại</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('BANK')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                    activeTab === 'BANK'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Database size={14} />
                                <span>Kiểm tra toàn diện CSDL</span>
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors ml-1"
                            title="Đóng cửa sổ"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50/50">
                    
                    {/* Confirmation & Alert Toast Banner */}
                    {confirmNotice && (
                        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                <span>{confirmNotice}</span>
                            </div>
                            <button 
                                onClick={() => setConfirmNotice('')} 
                                className="text-emerald-600 hover:text-emerald-900 text-xs underline cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    )}
                    
                    {/* ================= TAB 1: CÂU HỎI HIỆN TẠI ================= */}
                    {activeTab === 'CURRENT' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            
                            {/* Current Question Meta & Trigger Bar */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200">
                                        {activeLabel}
                                    </span>
                                    {isViewingBankItem && (
                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-200">
                                            Từ Ngân hàng CSDL
                                        </span>
                                    )}
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium">Mã ID đang gắn:</div>
                                        <div className="font-mono text-sm font-black text-indigo-700 flex items-center gap-1.5">
                                            {activeCurrentId}
                                            {activeDbId && (
                                                <span className="text-[10px] text-slate-400 font-normal font-sans">(DB ID: #{activeDbId})</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer mr-2 select-none">
                                        <input
                                            type="checkbox"
                                            checked={forceRefreshSingle}
                                            onChange={e => setForceRefreshSingle(e.target.checked)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>Làm mới (Bỏ qua cache)</span>
                                    </label>

                                    <button
                                        onClick={() => setShowLatexPreview(!showLatexPreview)}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Eye size={14} />
                                        <span>{showLatexPreview ? 'Thu gọn đề' : 'Mở rộng đề'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleRunSingleCheck(false)}
                                        disabled={isLoadingSingle || !activeContent}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isLoadingSingle ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                <span>Đang thẩm định 7 bước...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={15} />
                                                <span>{singleResult ? 'Kiểm tra lại câu này' : 'Bắt đầu kiểm tra 7 bước'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* LaTeX Preview Collapsible - Always visible when content exists */}
                            {activeContent && (
                                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1.5">
                                            <BookOpen size={14} /> Nội dung câu hỏi (LaTeX)
                                        </div>
                                        {isViewingBankItem && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (currentQuestion?.qualityCheck) {
                                                        setSingleResult(currentQuestion.qualityCheck);
                                                    } else {
                                                        setSingleResult(null);
                                                    }
                                                }}
                                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                                            >
                                                ← Quay lại câu đang mở trong file
                                            </button>
                                        )}
                                    </div>
                                    <div className={`bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm overflow-x-auto ${showLatexPreview ? 'max-h-96' : 'max-h-48'} custom-scrollbar`}>
                                        <MathRenderer content={activeContent} />
                                    </div>
                                </div>
                            )}

                            {/* No Result State */}
                            {!singleResult && !isLoadingSingle && (
                                <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <div className="max-w-md mx-auto">
                                        <h3 className="text-base font-bold text-slate-800">Câu hỏi chưa được kiểm định chất lượng</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Hệ thống AI sẽ tự động phân tích câu hỏi theo quy trình 7 bước khảo thí chuyên sâu và đối chiếu với danh mục ID6 để đề xuất mã chuẩn xác.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left max-w-xl mx-auto pt-2">
                                        {STEP_DEFINITIONS.slice(0, 4).map(s => (
                                            <div key={s.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                                                <div className="font-bold text-slate-700">Bước {s.num}</div>
                                                <div className="text-slate-500 truncate">{s.title}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleRunSingleCheck(false)}
                                        disabled={!currentQuestion}
                                        className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 inline-flex items-center gap-2"
                                    >
                                        <Sparkles size={16} /> Kiểm tra ngay bây giờ
                                    </button>
                                </div>
                            )}

                            {/* Loading Skeleton */}
                            {isLoadingSingle && (
                                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
                                    <div className="w-16 h-16 relative mx-auto">
                                        <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                                            <ShieldCheck size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Đang thẩm định chất lượng câu hỏi bằng AI...</h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Đang kiểm tra 7 bước sư phạm & đối chiếu ma trận phân loại ID6
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Result Display */}
                            {singleResult && !isLoadingSingle && (
                                <div className="space-y-5 animate-in fade-in">
                                    
                                    {/* Verdict Banner */}
                                    <div className={`p-5 rounded-2xl border shadow-xs ${
                                        singleResult.is_standard
                                            ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-200 text-emerald-900'
                                            : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200 text-amber-900'
                                    }`}>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className={`p-2.5 rounded-xl text-white shrink-0 shadow-sm ${
                                                    singleResult.is_standard ? 'bg-emerald-600' : 'bg-amber-600'
                                                }`}>
                                                    {singleResult.is_standard ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-black tracking-tight">
                                                            {singleResult.is_standard ? 'CÂU HỎI ĐẠT CHUẨN KIỂM ĐỊNH' : 'CÂU HỎI CẦN CẢI THIỆN'}
                                                        </h3>
                                                        {singleResult.cached && (
                                                            <span className="text-[10px] bg-white/80 font-bold px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                                                                ✓ Tải từ CSDL (0 token)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs opacity-90 mt-1 leading-relaxed max-w-2xl">
                                                        {singleResult.overall_comment}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Score Badge */}
                                            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-white/60 shadow-xs text-center shrink-0 min-w-[130px]">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Điểm tiêu chí
                                                </div>
                                                <div className="text-2xl font-black text-slate-800 my-0.5">
                                                    <span className={singleResult.is_standard ? 'text-emerald-600' : 'text-amber-600'}>
                                                        {singleResult.score}
                                                    </span>
                                                    <span className="text-slate-400 text-base font-bold">/7</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-1 mt-1">
                                                    {STEP_DEFINITIONS.map(s => {
                                                        const p = singleResult.steps?.[s.key]?.passed;
                                                        return (
                                                            <div
                                                                key={s.key}
                                                                className={`w-2.5 h-2.5 rounded-full ${
                                                                    p ? 'bg-emerald-500' : 'bg-amber-400'
                                                                }`}
                                                                title={`Bước ${s.num}: ${s.title} (${p ? 'Đạt' : 'Chưa đạt'})`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ID Assessment Box */}
                                        <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-600">Đối chiếu mã ID:</span>
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-700">
                                                    {singleResult.current_id || activeCurrentId}
                                                </span>
                                                <ArrowRight size={14} className="text-slate-400" />
                                                <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold text-indigo-700">
                                                    Đề xuất: {singleResult.suggested_id || '—'}
                                                </span>
                                            </div>

                                            {singleResult.suggested_id && singleResult.suggested_id !== (singleResult.current_id || activeCurrentId) ? (
                                                <button
                                                    onClick={async () => {
                                                        const newId = singleResult.suggested_id;
                                                        const targetDbId = activeDbId;
                                                        await onApplySuggestedId(newId, targetDbId);
                                                        setSingleResult(prev => prev ? { ...prev, current_id: newId, suggested_id: newId } : null);
                                                        if (targetDbId) {
                                                            setBankResults(prev => prev.map(item => 
                                                                (item.id === targetDbId || item.question_id === targetDbId) 
                                                                    ? { ...item, legacy_full_id: newId, current_id: newId, suggested_id: newId } 
                                                                    : item
                                                            ));
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Check size={14} />
                                                    <span>Áp dụng mã ID đề xuất này</span>
                                                </button>
                                            ) : singleResult.suggested_id && singleResult.suggested_id === (singleResult.current_id || activeCurrentId) ? (
                                                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                                    <span>Đã áp dụng mã ID ({singleResult.suggested_id})</span>
                                                </div>
                                            ) : null}
                                        </div>
                                        {singleResult.id_assessment && (
                                            <div className="mt-2 text-[11px] text-slate-600 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                                {singleResult.id_assessment}
                                            </div>
                                        )}

                                        {/* Resolution & Confirmation Action Bar */}
                                        <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                                            <div className="text-xs">
                                                {singleResult.is_standard ? (
                                                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                                        <CheckCircle2 size={16} className="text-emerald-600" />
                                                        Câu hỏi đã được xác nhận đạt chuẩn chất lượng khảo thí 7 bước.
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-800 font-medium">
                                                        Sau khi áp dụng bản viết lại hoặc hoàn thiện câu hỏi, bấm xác nhận để đưa câu này vào danh sách Đạt chuẩn.
                                                    </span>
                                                )}
                                            </div>

                                            {!singleResult.is_standard && (
                                                <button
                                                    onClick={() => handleConfirmResolved(activeDbId)}
                                                    disabled={confirmingQuestionId === activeDbId || !activeDbId}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                                    title="Xác nhận câu hỏi đã hoàn tất chỉnh sửa và đạt chuẩn 7 bước"
                                                >
                                                    {confirmingQuestionId === activeDbId ? (
                                                        <Loader2 size={15} className="animate-spin" />
                                                    ) : (
                                                        <CheckCheck size={16} />
                                                    )}
                                                    <span>Xác nhận đã chỉnh sửa</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 7 Steps Accordion List */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                                            <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Layers size={14} className="text-emerald-600" />
                                                <span>Chi tiết đánh giá theo 7 bước</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <button
                                                    onClick={() => toggleAllSteps(true)}
                                                    className="text-slate-500 hover:text-emerald-600 font-semibold text-[11px]"
                                                >
                                                    Mở tất cả
                                                </button>
                                                <span className="text-slate-300">•</span>
                                                <button
                                                    onClick={() => toggleAllSteps(false)}
                                                    className="text-slate-500 hover:text-emerald-600 font-semibold text-[11px]"
                                                >
                                                    Thu gọn
                                                </button>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {STEP_DEFINITIONS.map(step => {
                                                const stepData: QualityCheckStepDetail = singleResult.steps?.[step.key] || {
                                                    name: step.title,
                                                    question: step.desc,
                                                    passed: false,
                                                    evaluation: 'Chưa có dữ liệu đánh giá.'
                                                };
                                                const isExpanded = Boolean(expandedSteps[step.key]);

                                                return (
                                                    <div key={step.key} className="transition-colors">
                                                        {/* Step Header */}
                                                        <div
                                                            onClick={() => toggleStep(step.key)}
                                                            className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                                                    stepData.passed
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {step.num}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                                                                        <span>{step.title}</span>
                                                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                                                            stepData.passed
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>
                                                                            {stepData.passed ? '✓ Đạt yêu cầu' : '⚠ Cần cải thiện'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                                                                        {step.desc}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-slate-400 p-1">
                                                                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                            </div>
                                                        </div>

                                                        {/* Step Content */}
                                                        {isExpanded && (
                                                            <div className="px-4 pb-4 pt-1 sm:pl-13 text-xs space-y-2.5 bg-slate-50/40">
                                                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                                        Đánh giá chuyên môn:
                                                                    </div>
                                                                    <p className="text-slate-700 leading-relaxed">
                                                                        {stepData.evaluation}
                                                                    </p>
                                                                    {stepData.advice && (
                                                                        <div className="mt-2 pt-2 border-t border-slate-100 text-indigo-700 font-medium">
                                                                            <strong>💡 Lời khuyên:</strong> {stepData.advice}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Special rendering for Step 7: Rewrite & Trial Reading */}
                                                                {step.key === 'step7_rewrite' && (
                                                                    <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                                                                                <FileText size={14} className="text-emerald-600" />
                                                                                Nội dung đề xuất viết lại (Chuẩn hóa):
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                {stepData.rewritten_latex && (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={() => handleCopyRewrite(stepData.rewritten_latex!)}
                                                                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                                                                                        >
                                                                                            {copiedRewrite ? <Check size={12} className="text-emerald-600"/> : <Copy size={12}/>}
                                                                                            <span>{copiedRewrite ? 'Đã sao chép' : 'Sao chép LaTeX'}</span>
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={async () => {
                                                                                                const rewritten = stepData.rewritten_latex!;
                                                                                                const targetDbId = activeDbId;
                                                                                                await onApplyRewrittenContent(rewritten, targetDbId, currentQuestion?.id);
                                                                                                setSingleResult(prev => prev ? { ...prev, content_latex: rewritten } : null);
                                                                                                if (targetDbId) {
                                                                                                    setBankResults(prev => prev.map(b => 
                                                                                                        (b.id === targetDbId || b.question_id === targetDbId) ? { ...b, content_latex: rewritten } : b
                                                                                                    ));
                                                                                                }
                                                                                            }}
                                                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                                                                        >
                                                                                            <Check size={12} />
                                                                                            <span>Áp dụng vào câu hỏi</span>
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {stepData.rewritten_latex && (
                                                                            <div className="bg-white p-3 rounded-lg border border-emerald-100 font-mono text-[11px] text-slate-800 overflow-x-auto max-h-40 custom-scrollbar select-all">
                                                                                {stepData.rewritten_latex}
                                                                            </div>
                                                                        )}

                                                                        {stepData.trial_reading_feedback && (
                                                                            <div className="text-[11px] text-emerald-800 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                                                                                <strong>🔍 Thử đọc:</strong> {stepData.trial_reading_feedback}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ================= TAB 2: KIỂM ĐỊNH TOÀN DIỆN CSDL ================= */}
                    {activeTab === 'BANK' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            
                            {/* Summary Dashboard Cards (Clickable Category Tabs) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSelectCategory('ALL')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        selectedCategory === 'ALL'
                                            ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Tổng câu hỏi CSDL
                                        </span>
                                        {selectedCategory === 'ALL' && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                                                Đang xem
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                                        {summary ? summary.total_questions.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Trong kho ngân hàng</span>
                                        <span className="underline font-semibold">Xem danh sách →</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSelectCategory('STANDARD')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        selectedCategory === 'STANDARD'
                                            ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500 shadow-sm'
                                            : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 hover:shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                            Đã đạt chuẩn (7 bước)
                                        </span>
                                        {selectedCategory === 'STANDARD' && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                                                Đang xem
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                                        {summary ? summary.standard_count.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center justify-between">
                                        <span>Tỉ lệ: {summary?.standard_rate || 0}%</span>
                                        <span className="underline">Xem danh sách →</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSelectCategory('SUBSTANDARD')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                                        selectedCategory === 'SUBSTANDARD'
                                            ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500 shadow-sm'
                                            : 'bg-amber-50 border-amber-200 hover:border-amber-300 hover:shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                            <span>Cần cải thiện</span>
                                            {Boolean(summary && summary.substandard_count > 0) && (
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                                            )}
                                        </span>
                                        {selectedCategory === 'SUBSTANDARD' && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                                                Đang xem
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                                        {summary ? summary.substandard_count.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-amber-700 mt-1 flex items-center justify-between">
                                        <span>Chưa đạt một số bước</span>
                                        <span className="font-bold underline text-amber-800">Bấm xem & sửa →</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSelectCategory('UNCHECKED')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        selectedCategory === 'UNCHECKED'
                                            ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-500 shadow-sm'
                                            : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                            Chưa kiểm tra
                                        </span>
                                        {selectedCategory === 'UNCHECKED' && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                                                Đang xem
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
                                        {summary ? summary.unchecked_count.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-blue-600 mt-1 flex items-center justify-between">
                                        <span>Chờ khảo thí tự động</span>
                                        <span className="underline">Xem danh sách →</span>
                                    </div>
                                </button>
                            </div>

                            {/* CSDL Questions Explorer Feed for Selected Category */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-xl text-white font-bold text-xs shrink-0 ${
                                            selectedCategory === 'SUBSTANDARD' ? 'bg-amber-600 shadow-sm shadow-amber-200' :
                                            selectedCategory === 'STANDARD' ? 'bg-emerald-600 shadow-sm shadow-emerald-200' :
                                            selectedCategory === 'UNCHECKED' ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-slate-700 shadow-sm'
                                        }`}>
                                            {selectedCategory === 'SUBSTANDARD' ? <AlertTriangle size={16}/> :
                                             selectedCategory === 'STANDARD' ? <CheckCircle2 size={16}/> :
                                             selectedCategory === 'UNCHECKED' ? <HelpCircle size={16}/> : <Layers size={16}/>}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800">
                                                {selectedCategory === 'SUBSTANDARD' && `Danh sách câu hỏi cần cải thiện (${filteredBankQuestions.length} câu)`}
                                                {selectedCategory === 'STANDARD' && `Danh sách câu hỏi đã đạt chuẩn (${filteredBankQuestions.length} câu)`}
                                                {selectedCategory === 'UNCHECKED' && `Danh sách câu hỏi chưa kiểm tra (${filteredBankQuestions.length} câu)`}
                                                {selectedCategory === 'ALL' && `Tất cả câu hỏi trong cơ sở dữ liệu (${filteredBankQuestions.length} câu)`}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {selectedCategory === 'SUBSTANDARD' && 'Xem chi tiết các tiêu chí chưa đạt, áp dụng bản viết lại gợi ý và bấm xác nhận đã chỉnh sửa.'}
                                                {selectedCategory === 'STANDARD' && 'Các câu hỏi đã vượt qua toàn bộ 7 tiêu chí kiểm định khảo thí.'}
                                                {selectedCategory === 'UNCHECKED' && 'Các câu hỏi đang chờ khảo thí tự động hoặc kiểm tra đơn lẻ.'}
                                                {selectedCategory === 'ALL' && 'Toàn bộ kho câu hỏi được lưu trữ trong hệ thống.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Search & Refresh Actions */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Tìm theo ID, mã hoặc nội dung..."
                                                value={questionSearch}
                                                onChange={e => setQuestionSearch(e.target.value)}
                                                className="py-1.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 w-44 sm:w-60 transition-all"
                                            />
                                        </div>

                                        <button
                                            onClick={() => loadQuestionsList(selectedCategory)}
                                            disabled={isLoadingQuestionsList}
                                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                            title="Tải lại danh sách"
                                        >
                                            <RefreshCw size={14} className={isLoadingQuestionsList ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>

                                {/* Question Items Feed */}
                                {isLoadingQuestionsList ? (
                                    <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                                        <Loader2 size={24} className="animate-spin text-emerald-600" />
                                        <span>Đang tải danh sách câu hỏi từ CSDL...</span>
                                    </div>
                                ) : filteredBankQuestions.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-xs">
                                        {questionSearch ? 'Không tìm thấy câu hỏi phù hợp với từ khóa.' : 'Không có câu hỏi nào thuộc phân loại này trong cơ sở dữ liệu.'}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto custom-scrollbar">
                                        {filteredBankQuestions.map((item, idx) => {
                                            const itemDbId = item.id || item.question_id;
                                            const isSelected = activeDbId === itemDbId;
                                            const currentDisplayId = item.legacy_full_id || item.current_id || 'Chưa gắn mã';
                                            return (
                                                <div
                                                    key={itemDbId || idx}
                                                    onClick={() => {
                                                        setSingleResult(item);
                                                        setActiveTab('CURRENT');
                                                    }}
                                                    className={`p-3.5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs cursor-pointer ${
                                                        isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                                                    }`}
                                                    title="Bấm để xem chi tiết câu hỏi và phân tích 7 bước"
                                                >
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                                            item.is_standard ? 'bg-emerald-100 text-emerald-700' : 
                                                            selectedCategory === 'UNCHECKED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {item.is_standard ? <CheckCircle2 size={16}/> : 
                                                             selectedCategory === 'UNCHECKED' ? <HelpCircle size={16}/> : <AlertTriangle size={16}/>}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-slate-800">Câu #{itemDbId}</span>
                                                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border border-slate-200">
                                                                    {currentDisplayId}
                                                                </span>
                                                                {item.suggested_id && item.suggested_id !== currentDisplayId && (
                                                                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                                                                        → {item.suggested_id}
                                                                    </span>
                                                                )}
                                                                {item.score !== undefined && (
                                                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                                                        item.is_standard 
                                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                                            : item.score === 0 
                                                                                ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                        {item.is_standard 
                                                                            ? '7/7 Đạt chuẩn' 
                                                                            : item.score === 0 
                                                                                ? 'Chưa thẩm định (0/7)' 
                                                                                : `${item.score}/7 tiêu chí`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-500 text-[11px] truncate mt-1 max-w-xl">
                                                                {item.overall_comment || item.content_latex?.substring(0, 90) || ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                                                        {item.suggested_id && item.suggested_id !== currentDisplayId && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await onApplySuggestedId(item.suggested_id, itemDbId);
                                                                    setBankQuestionsList(prev => prev.map(b => 
                                                                        (b.id === itemDbId || b.question_id === itemDbId) 
                                                                            ? { ...b, legacy_full_id: item.suggested_id, current_id: item.suggested_id, suggested_id: item.suggested_id } 
                                                                            : b
                                                                    ));
                                                                    if (singleResult && (singleResult.question_id === itemDbId || (singleResult as any).id === itemDbId)) {
                                                                        setSingleResult(prev => prev ? { ...prev, current_id: item.suggested_id, suggested_id: item.suggested_id } : null);
                                                                    }
                                                                }}
                                                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 border border-indigo-200 cursor-pointer"
                                                                title="Áp dụng mã ID đề xuất vào CSDL"
                                                            >
                                                                <Check size={12} />
                                                                <span>Áp dụng ID</span>
                                                            </button>
                                                        )}

                                                        {!item.is_standard && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleConfirmResolved(itemDbId);
                                                                }}
                                                                disabled={confirmingQuestionId === itemDbId}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                                                title="Xác nhận câu hỏi đã được sửa xong và đánh dấu Đạt chuẩn"
                                                            >
                                                                {confirmingQuestionId === itemDbId ? (
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                ) : (
                                                                    <CheckCheck size={13} />
                                                                )}
                                                                <span>Xác nhận đã chỉnh sửa</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSingleResult(item);
                                                                setActiveTab('CURRENT');
                                                            }}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Eye size={12} />
                                                            <span>Xem chi tiết 7 bước</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Control & Batch Runner Bar */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800">
                                            Quy trình kiểm tra toàn diện tự động
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Duyệt qua từng câu hỏi trong ngân hàng, phân tích 7 tiêu chí và lưu kết quả vĩnh viễn vào CSDL.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isBankAuditing ? (
                                            <button
                                                onClick={handleStopBankAudit}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <Square size={14} />
                                                <span>Dừng kiểm tra</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleStartBankAudit}
                                                disabled={isLoadingSummary || !isAdminOrTeacher}
                                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <Play size={14} />
                                                <span>Bắt đầu kiểm tra toàn diện</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={onlyUntested}
                                            onChange={e => setOnlyUntested(e.target.checked)}
                                            disabled={isBankAuditing}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>
                                            <strong>Bỏ qua câu đã kiểm tra</strong> (Tiết kiệm thời gian & không tốn token lặp lại)
                                        </span>
                                    </label>

                                    <button
                                        onClick={loadSummary}
                                        disabled={isLoadingSummary || isBankAuditing}
                                        className="text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} className={isLoadingSummary ? 'animate-spin' : ''} />
                                        <span>Cập nhật số liệu</span>
                                    </button>
                                </div>

                                {/* Active Progress Bar */}
                                {isBankAuditing && (
                                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                                        <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-emerald-600" />
                                                <span>{bankAuditProgress.message}</span>
                                            </div>
                                            <span>Còn lại: {bankAuditProgress.remaining} câu</span>
                                        </div>
                                        <div className="w-full bg-emerald-200/50 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${
                                                        bankAuditProgress.total > 0
                                                            ? Math.min(100, Math.round((bankAuditProgress.current / bankAuditProgress.total) * 100))
                                                            : 0
                                                    }%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Batch Results Feed */}
                            {bankResults.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
                                        <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <FileCheck2 size={14} className="text-emerald-600" />
                                            <span>Kết quả kiểm định đợt này ({bankResults.length} câu)</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Filter size={12} className="text-slate-400" />
                                            <button
                                                onClick={() => setBankFilter('ALL')}
                                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                                                    bankFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                Tất cả ({bankResults.length})
                                            </button>
                                            <button
                                                onClick={() => setBankFilter('STANDARD')}
                                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                                                    bankFilter === 'STANDARD' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                                                }`}
                                            >
                                                Đạt chuẩn ({bankResults.filter(r => r.is_standard).length})
                                            </button>
                                            <button
                                                onClick={() => setBankFilter('SUBSTANDARD')}
                                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                                                    bankFilter === 'SUBSTANDARD' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
                                                }`}
                                            >
                                                Cần sửa ({bankResults.filter(r => !r.is_standard).length})
                                            </button>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                                        {filteredBankResults.map((item, idx) => {
                                            const itemDbId = item.question_id || item.id;
                                            const isSelected = activeDbId === itemDbId;
                                            const currentDisplayId = item.current_id || item.legacy_full_id || 'Chưa có ID';
                                            return (
                                                <div
                                                    key={itemDbId || idx}
                                                    onClick={() => {
                                                        setSingleResult(item);
                                                        setActiveTab('CURRENT');
                                                    }}
                                                    className={`p-3.5 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer ${
                                                        isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                                                    }`}
                                                    title="Bấm để xem chi tiết nội dung câu hỏi và phân tích 7 bước"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className={`p-1.5 rounded-lg shrink-0 ${
                                                            item.is_standard ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {item.is_standard ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800">Câu #{itemDbId}</span>
                                                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                                    {currentDisplayId}
                                                                </span>
                                                                {item.suggested_id && item.suggested_id !== currentDisplayId && (
                                                                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                                                                        → {item.suggested_id}
                                                                    </span>
                                                                )}
                                                                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                                                    item.is_standard ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                                }`}>
                                                                    {item.score}/7 tiêu chí
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-500 text-[11px] truncate mt-0.5 max-w-xl">
                                                                {item.overall_comment || item.content_latex?.substring(0, 80) || ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                                        {item.suggested_id && item.suggested_id !== currentDisplayId && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await onApplySuggestedId(item.suggested_id, itemDbId);
                                                                    setBankResults(prev => prev.map(b => 
                                                                        (b.id === item.id || b.question_id === itemDbId) 
                                                                            ? { ...b, legacy_full_id: item.suggested_id, current_id: item.suggested_id, suggested_id: item.suggested_id } 
                                                                            : b
                                                                    ));
                                                                    if (singleResult && (singleResult.question_id === itemDbId || (singleResult as any).id === itemDbId)) {
                                                                        setSingleResult(prev => prev ? { ...prev, current_id: item.suggested_id, suggested_id: item.suggested_id } : null);
                                                                    }
                                                                }}
                                                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 border border-indigo-200 cursor-pointer"
                                                                title="Áp dụng mã ID đề xuất vào CSDL"
                                                            >
                                                                <Check size={12} />
                                                                <span>Áp dụng ID</span>
                                                            </button>
                                                        )}
                                                        {!item.is_standard && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleConfirmResolved(itemDbId);
                                                                }}
                                                                disabled={confirmingQuestionId === itemDbId}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                                                title="Xác nhận câu hỏi đã được sửa xong và đánh dấu Đạt chuẩn"
                                                            >
                                                                {confirmingQuestionId === itemDbId ? (
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                ) : (
                                                                    <CheckCheck size={13} />
                                                                )}
                                                                <span>Xác nhận đã chỉnh sửa</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSingleResult(item);
                                                                setActiveTab('CURRENT');
                                                            }}
                                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                                                        >
                                                            Xem chi tiết 7 bước
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 text-xs">
                    <div className="text-slate-400 text-[11px] hidden sm:block">
                        Áp dụng tiêu chuẩn khảo thí sư phạm & định dạng chuẩn ID6
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors ml-auto"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
