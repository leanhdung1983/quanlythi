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
    Eye
} from 'lucide-react';
import { QuestionQualityCheck7Steps, QuestionQualitySummary, QualityCheckStepDetail } from '../types';
import { qualityCheckQuestion7Steps, batchQualityCheckBank, fetchQualitySummary } from '../services/aiService';
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
    onApplySuggestedId: (newId: string) => void;
    onApplyRewrittenContent: (newContent: string) => void;
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

    // Sync current question quality check when modal opens or question changes
    useEffect(() => {
        if (!isOpen) return;
        if (currentQuestion?.qualityCheck) {
            setSingleResult(currentQuestion.qualityCheck);
        } else {
            setSingleResult(null);
        }
    }, [isOpen, currentQuestion?.id, currentQuestion?.qualityCheck]);

    // Fetch summary when switching to BANK tab
    useEffect(() => {
        if (isOpen && activeTab === 'BANK') {
            loadSummary();
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

    const handleRunSingleCheck = async (force = false) => {
        if (!currentQuestion) return;
        setIsLoadingSingle(true);
        try {
            const res = await qualityCheckQuestion7Steps({
                latex: currentQuestion.content,
                currentId: currentQuestion.assignedId || currentQuestion.originalId,
                questionId: currentQuestion.dbId,
                forceRefresh: force || forceRefreshSingle
            });
            setSingleResult(res);
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
                    limit: 4,
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
                alert(`Lỗi kiểm định hàng loạt: ${e?.message || 'Có lỗi xảy ra.'}`);
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
                    
                    {/* ================= TAB 1: CÂU HỎI HIỆN TẠI ================= */}
                    {activeTab === 'CURRENT' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            
                            {/* Current Question Meta & Trigger Bar */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200">
                                        #{currentQuestion ? currentQuestion.id + 1 : '—'}
                                    </span>
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium">Mã ID đang gắn:</div>
                                        <div className="font-mono text-sm font-black text-indigo-700 flex items-center gap-1.5">
                                            {currentQuestion?.assignedId || 'Chưa gắn mã ID'}
                                            {currentQuestion?.dbId && (
                                                <span className="text-[10px] text-slate-400 font-normal font-sans">(DB ID: #{currentQuestion.dbId})</span>
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
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                    >
                                        <Eye size={14} />
                                        <span>{showLatexPreview ? 'Ẩn xem trước' : 'Xem đề bài'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleRunSingleCheck(false)}
                                        disabled={isLoadingSingle || !currentQuestion}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
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

                            {/* LaTeX Preview Collapsible */}
                            {showLatexPreview && currentQuestion && (
                                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs animate-in slide-in-from-top-2">
                                    <div className="text-xs font-bold text-indigo-700 uppercase mb-2 flex items-center gap-1.5">
                                        <BookOpen size={14} /> Nội dung câu hỏi LaTeX
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm overflow-x-auto max-h-52 custom-scrollbar">
                                        <MathRenderer content={currentQuestion.content} />
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
                                                    {singleResult.current_id || 'Chưa gắn'}
                                                </span>
                                                <ArrowRight size={14} className="text-slate-400" />
                                                <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold text-indigo-700">
                                                    Đề xuất: {singleResult.suggested_id || '—'}
                                                </span>
                                            </div>

                                            {singleResult.suggested_id && singleResult.suggested_id !== singleResult.current_id && (
                                                <button
                                                    onClick={() => onApplySuggestedId(singleResult.suggested_id)}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    <Check size={14} />
                                                    <span>Áp dụng mã ID đề xuất này</span>
                                                </button>
                                            )}
                                        </div>
                                        {singleResult.id_assessment && (
                                            <div className="mt-2 text-[11px] text-slate-600 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                                {singleResult.id_assessment}
                                            </div>
                                        )}
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
                                                                                            onClick={() => onApplyRewrittenContent(stepData.rewritten_latex!)}
                                                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95"
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
                            
                            {/* Summary Dashboard Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Tổng câu hỏi CSDL
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                                        {summary ? summary.total_questions.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">Trong kho ngân hàng</div>
                                </div>

                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
                                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                        Đã đạt chuẩn (7 bước)
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                                        {summary ? summary.standard_count.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                                        Tỉ lệ: {summary?.standard_rate || 0}%
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
                                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                        Cần cải thiện
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                                        {summary ? summary.substandard_count.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-amber-600 mt-1">Chưa đạt một số bước</div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
                                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                        Chưa kiểm tra
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
                                        {summary ? summary.unchecked_count.toLocaleString() : '—'}
                                    </div>
                                    <div className="text-[10px] text-blue-600 mt-1">Chờ khảo thí tự động</div>
                                </div>
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
                                        {filteredBankResults.map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`p-1.5 rounded-lg shrink-0 ${
                                                        item.is_standard ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {item.is_standard ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">Câu #{item.id}</span>
                                                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                                {item.legacy_full_id || 'Chưa có ID'}
                                                            </span>
                                                            {item.suggested_id && item.suggested_id !== item.legacy_full_id && (
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

                                                <button
                                                    onClick={() => {
                                                        setSingleResult(item);
                                                        setActiveTab('CURRENT');
                                                    }}
                                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] shrink-0 transition-colors"
                                                >
                                                    Xem chi tiết 7 bước
                                                </button>
                                            </div>
                                        ))}
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
