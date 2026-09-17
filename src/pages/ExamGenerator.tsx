
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { Question, MatrixTreeNode, SavedMatrix } from '../types';
import { 
    FileOutput, RefreshCw, Loader2, Save, FileText, Trash2, 
    ListChecks, CheckSquare, Type, AlignLeft, ChevronDown, ChevronRight, 
    Layers, FolderOpen, Database, Edit3, FileSpreadsheet,
    Settings, ShieldCheck, Folder, Sparkles, Copy, Check, Download,
    PanelLeftClose, PanelLeft, Plus, CheckCircle2
} from 'lucide-react';
import { useLanguageStore } from '../services/languageStore';
import { useAuthStore } from '../services/authStore';
import { MatrixLibrary } from '../components/MatrixLibrary';
import { describeMatrix, parseMatrixData, normalizeGrade, editableMatrixSections, MATRIX_PURPOSES, MATRIX_STATUSES } from '../../shared/matrixCatalog';
import { generateDocxBlob, generateCombinedLatex } from '../utils/matrixExportUtils';

interface LevelCounts {
    N: number;
    H: number;
    V: number;
    C: number;
}

type QuestionType = 'TN' | 'TF' | 'KQ' | 'TL';

export const ExamGenerator: React.FC = () => {
    const { t } = useLanguageStore();
    const user = useAuthStore(state => state.user);
    const [treeData, setTreeData] = useState<MatrixTreeNode[]>([]);
    
    // UI State
    const [selectedGrade, setSelectedGrade] = useState(2);
    const [selectedSubject, setSelectedSubject] = useState('D');
    const [activeTab, setActiveTab] = useState<QuestionType>('TN');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    
    // MATRIX STATE
    const [matrix, setMatrix] = useState<Record<QuestionType, Record<string, LevelCounts>>>({
        TN: {}, TF: {}, KQ: {}, TL: {}
    });

    const [importing, setImporting] = useState(false);
    const importFileRef = useRef<HTMLInputElement>(null);

    const [savedMatrices, setSavedMatrices] = useState<SavedMatrix[]>([]);
    const [generatedExam, setGeneratedExam] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [tabTotals, setTabTotals] = useState<Record<QuestionType, number>>({ TN:0, TF:0, KQ:0, TL:0 });
    const [copied, setCopied] = useState(false);

    // Config Modal State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [matrixName, setMatrixName] = useState('');
    const [matrixGrade, setMatrixGrade] = useState<number>(selectedGrade);
    const [matrixMultiGrade, setMatrixMultiGrade] = useState(false);
    const [matrixCatalog, setMatrixCatalog] = useState({ purpose: 'PRACTICE', term: '', year: '', status: 'DRAFT' });
    const [matrixBaseline, setMatrixBaseline] = useState<any>({});
    const [examDuration, setExamDuration] = useState(90);
    const [editingMatrixId, setEditingMatrixId] = useState<number | null>(null);
    const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
    const [assignClassIds, setAssignClassIds] = useState<number[]>([]);
    const [savingMatrix, setSavingMatrix] = useState(false);
    const [assignmentOptions, setAssignmentOptions] = useState({ open_time: '', deadline: '', max_attempts: 0, allow_review: true });
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Scoring Config
    const [pointsTN, setPointsTN] = useState(0.25);
    const [pointsTF, setPointsTF] = useState(1.0);
    const [pointsKQ, setPointsKQ] = useState(0.5);
    const [totalPointsTN, setTotalPointsTN] = useState(0);
    const [totalPointsTF, setTotalPointsTF] = useState(0);
    const [totalPointsKQ, setTotalPointsKQ] = useState(0);
    const [tfScoringMode, setTfScoringMode] = useState<'10-25-50-100' | '25-50-75-100'>('10-25-50-100');

    // Advanced Config
    const [examMode, setExamMode] = useState<'PRACTICE' | 'REAL'>('PRACTICE');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [maxAttempts, setMaxAttempts] = useState(0);

    // Sidebar Tree State
    const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({
        '2': true, '1': true, '0': true, 'OT': false
    });

    const outputRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (totalPointsTN > 0 && tabTotals.TN > 0) {
            setPointsTN(Math.round((totalPointsTN / tabTotals.TN) * 100) / 100);
        }
    }, [totalPointsTN, tabTotals.TN]);

    useEffect(() => {
        if (totalPointsTF > 0 && tabTotals.TF > 0) {
            setPointsTF(Math.round((totalPointsTF / tabTotals.TF) * 100) / 100);
        }
    }, [totalPointsTF, tabTotals.TF]);

    useEffect(() => {
        if (totalPointsKQ > 0 && tabTotals.KQ > 0) {
            setPointsKQ(Math.round((totalPointsKQ / tabTotals.KQ) * 100) / 100);
        }
    }, [totalPointsKQ, tabTotals.KQ]);


    useEffect(() => {
        const newTabTotals = { TN: 0, TF: 0, KQ: 0, TL: 0 };
        let total = 0;
        
        Object.keys(matrix).forEach((tab) => {
            const t = tab as QuestionType;
            let tabTotal = 0;
            Object.values(matrix[t]).forEach((counts) => {
                tabTotal += (counts.N || 0) + (counts.H || 0) + (counts.V || 0) + (counts.C || 0);
            });
            newTabTotals[t] = tabTotal;
            total += tabTotal;
        });
        
        setTabTotals(newTabTotals);
        setTotalQuestions(total);
    }, [matrix]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await apiService.fetchTreeData();
            if(data) setTreeData(data);
            const saved = await apiService.fetchSavedMatrices();
            setSavedMatrices(saved || []);
            if (user && (user.role === 'TEACHER' || user.role === 'ADMIN')) {
                const cls = await apiService.fetchClasses(user.id);
                setTeacherClasses(cls || []);
            }
        } catch {
            // Silently fail or log
        } finally {
            setLoading(false);
        }
    };


    const toggleGradeExpand = (key: string) => {
        setExpandedGrades(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelectMatrix = (m: any) => {
        const info = describeMatrix(m);
        let parsed: any = {};
        try {
            parsed = parseMatrixData(m.matrix_data);
        } catch (e) {
            console.error(e);
            alert('Không đọc được ma trận cũ. Chưa thay đổi dữ liệu.');
            return false;
        }

        let rawMatrix;
        try { rawMatrix = editableMatrixSections(parsed); } catch (e: any) { alert(e.message); return false; }
        setMatrixMultiGrade(info.grade === 'MULTI');
        setMatrixCatalog({ purpose: info.purpose, term: info.term, year: info.year, status: info.status });
        setEditingMatrixId(m.id);
        setMatrixName(m.name);
        setMatrixBaseline(parsed);
        const loadedMatrix: Record<QuestionType, Record<string, LevelCounts>> = {
            TN: rawMatrix.TN || {},
            TF: rawMatrix.TF || {},
            KQ: rawMatrix.KQ || {},
            TL: rawMatrix.TL || {}
        };
        setMatrix(loadedMatrix);

        const settings = parsed?.settings || {};
        if (settings) {
            const normalized = normalizeGrade(info.grade);
            const g = normalized !== null && normalized >= 10 ? normalized - 10 : selectedGrade;
            setMatrixGrade(g);
            setSelectedGrade(g);
            setExamDuration(settings.duration ?? 90);
            setExamMode(settings.mode ?? 'PRACTICE');
            setPointsTN(settings.points_tn ?? 0.25);
            setPointsTF(settings.points_tf ?? 1);
            setPointsKQ(settings.points_kq ?? 0.5);
            setTotalPointsTN(Number(settings.total_points_tn) || 0);
            setTotalPointsTF(Number(settings.total_points_tf) || 0);
            setTotalPointsKQ(Number(settings.total_points_kq) || 0);
            setTfScoringMode(settings.tf_scoring_mode || '10-25-50-100');
        }

        // Auto navigate to the first subject / tab that has configured questions
        for (const qType of ['TN', 'TF', 'KQ', 'TL'] as QuestionType[]) {
            const keys = Object.keys(loadedMatrix[qType] || {});
            if (keys.length > 0) {
                const parts = keys[0].split('-');
                if (parts.length >= 2) {
                    const g = parseInt(parts[0], 10);
                    setSelectedGrade(g);
                    setSelectedSubject(parts[1]);
                    setActiveTab(qType);
                    break;
                }
            }
        }
        return true;
    };

    const handleQuickGenerateTex = async (m: any) => {
        if (!handleSelectMatrix(m)) return;
        setGenerating(true);
        try {
            let parsed: any = {};
            try {
                parsed = typeof m.matrix_data === 'string' ? JSON.parse(m.matrix_data) : m.matrix_data;
            } catch (e) {}

            const rawMatrix = parsed.matrix || parsed;
            const res: any = await apiService.generateExamMatrix({
                matrix_id: m.id,
                matrix: rawMatrix,
                settings: parsed.settings,
                exam_title: m.name
            });

            if (res?.tex) {
                setGeneratedExam(res.tex);
                setTimeout(() => {
                    outputRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                alert("Không thể sinh đề từ ma trận này. Vui lòng thử lại.");
            }
        } catch (e: any) {
            console.error(e);
            alert("Lỗi tạo đề thi TeX: " + (e.message || "Vui lòng thử lại"));
        } finally {
            setGenerating(false);
        }
    };

    const handleOpenSaveModal = (m?: SavedMatrix) => {
        if (m && !handleSelectMatrix(m)) return;
        setAssignClassIds([]);
        setAssignmentOptions({ open_time: '', deadline: '', max_attempts: 0, allow_review: true });
        setShowSaveModal(true);
    };

    const handleNewMatrix = () => {
        setAssignClassIds([]);
        setMatrixBaseline({}); setMatrixMultiGrade(false);
        setMatrixCatalog({ purpose: 'PRACTICE', term: '', year: '', status: 'DRAFT' });
        setTotalPointsTN(0); setTotalPointsTF(0); setTotalPointsKQ(0);
        setPointsTN(0.25); setPointsTF(1); setPointsKQ(0.5); setTfScoringMode('10-25-50-100');
        setMatrix({ TN: {}, TF: {}, KQ: {}, TL: {} });
        setMatrixName('');
        setEditingMatrixId(null);
        setTabTotals({ TN: 0, TF: 0, KQ: 0, TL: 0 });
        setTotalQuestions(0);
    };

    const handleExportDocx = async (mode: string) => {
        try {
            setIsExporting(true);
            const matrixToExport = {
                name: matrixName || 'Ma_tran_de_thi',
                matrix: matrix,
                matrix_data: JSON.stringify({ matrix, settings: { duration: examDuration, mode: examMode, grade_id: matrixGrade } })
            } as any;
            const blob = await generateDocxBlob(treeData, matrixToExport, mode as any);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(matrixName || 'ma_tran_de_thi').replace(/\s+/g, '_')}_${mode.toLowerCase()}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Lỗi xuất file');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportStructureTex = () => {
        try {
            const matrixToExport = { 
                name: matrixName || 'Ma_tran_de_thi',
                matrix: matrix, 
                settings: { duration: examDuration, mode: examMode, grade_id: matrixGrade } 
            };
            const tex = generateCombinedLatex(treeData, matrixToExport);
            const blob = new Blob([tex], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(matrixName || 'ma_tran').replace(/\s+/g, '_')}_cau_truc_dac_ta.tex`;
            a.click();
            window.URL.revokeObjectURL(url);
            setShowExportMenu(false);
        } catch (e) {
            console.error(e);
            alert("Lỗi xuất file TeX ma trận & đặc tả");
        }
    };

    const handleExportReviewTex = async () => {
        setShowExportMenu(false);
        await handleGenerate();
    };

    const handleResetMatrix = () => {
        if (confirm('Làm mới ma trận?')) {
            setMatrix({ TN: {}, TF: {}, KQ: {}, TL: {} });
            setTabTotals({ TN: 0, TF: 0, KQ: 0, TL: 0 });
            setTotalQuestions(0);
        }
    };

    const handleImportMatrixFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target?.result as string);
                if (data.matrix) setMatrix(data.matrix);
                else setMatrix(data);
                if (data.settings) {
                    setExamDuration(data.settings.duration || 90);
                    setExamMode(data.settings.mode || 'PRACTICE');
                    setMatrixGrade(data.settings.grade_id || 2);
                }
            } catch (err) {
                alert("File không hợp lệ");
            }
        };
        reader.readAsText(file);
    };

    const toggleExpand = (subjectId: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    };

    const mergeTypes = (types: any[]) => {
        if (!types) return [];
        const merged: Record<string, any> = {};
        types.forEach(t => {
            if (!merged[t.count_id]) {
                merged[t.count_id] = JSON.parse(JSON.stringify(t));
            } else {
                const currentStats = merged[t.count_id].stats;
                Object.keys(t.stats || {}).forEach(tab => {
                    if (!currentStats[tab]) currentStats[tab] = { N: 0, H: 0, V: 0, C: 0 };
                    ['N', 'H', 'V', 'C'].forEach(lvl => {
                        currentStats[tab][lvl] = (currentStats[tab][lvl] || 0) + (t.stats[tab]?.[lvl] || 0);
                    });
                });
            }
        });
        return Object.values(merged);
    };

    const updateCount = (chapterId: string, level: 'N'|'H'|'V'|'C', valStr: string, max: number) => {
        const val = Math.min(parseInt(valStr) || 0, max);
        setMatrix(prev => {
            const next = { ...prev, [activeTab]: { ...prev[activeTab] } };
            if (!next[activeTab][chapterId]) {
                next[activeTab][chapterId] = { N: 0, H: 0, V: 0, C: 0 };
            }
            next[activeTab][chapterId] = { ...next[activeTab][chapterId], [level]: val };
            return next;
        });
    };

    const handleCopyTex = () => {
        if (!generatedExam) return;
        navigator.clipboard.writeText(generatedExam);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const req = {
                matrix,
                matrix_id: editingMatrixId,
                settings: {
                    name: matrixName || 'Đề kiểm tra',
                    grade_id: selectedGrade,
                    subject_id: selectedSubject,
                    duration: examDuration,
                    points: { TN: pointsTN, TF: pointsTF, KQ: pointsKQ }
                },
                exam_title: matrixName || 'ĐỀ KIỂM TRA ĐỊNH KỲ',
                duration: examDuration,
                grade_id: selectedGrade
            };
            const res: any = await apiService.generateExamMatrix(req);
            if (res?.tex) {
                setGeneratedExam(res.tex);
                setTimeout(() => {
                    outputRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else if (res?.data) {
                alert("Đã sinh câu hỏi thành công!");
            }
        } catch (e: any) {
            console.error(e);
            alert("Lỗi tạo đề: " + (e.message || "Vui lòng thử lại"));
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveMatrix = async () => {
        if (savingMatrix) return;
        if (!matrixName.trim()) return alert("Nhập tên ma trận");
        if (assignClassIds.length) {
            if (!Number.isSafeInteger(assignmentOptions.max_attempts) || assignmentOptions.max_attempts < 0) return alert('Lượt thi phải là số nguyên không âm.');
            if (assignmentOptions.open_time && assignmentOptions.deadline && new Date(assignmentOptions.open_time) >= new Date(assignmentOptions.deadline)) return alert('Hạn nộp phải sau thời gian mở đề.');
        }
        if (!Number.isFinite(examDuration) || examDuration <= 0 || examDuration > 1440) return alert('Thời gian thi phải từ 1 đến 1440 phút.');
        setSavingMatrix(true);
        let savedId = editingMatrixId;
        let saved = false;
        try {
            const data = {
                name: matrixName,
                matrix_data: { ...matrixBaseline, matrix,
                    catalog: { ...matrixCatalog, target_grade: matrixMultiGrade ? 'MULTI' : normalizeGrade(matrixGrade) },
                    settings: { ...matrixBaseline.settings, duration: examDuration, mode: examMode,
                        grade_id: matrixMultiGrade ? undefined : matrixGrade, points_tn: pointsTN, points_tf: pointsTF, points_kq: pointsKQ,
                        total_points_tn: totalPointsTN, total_points_tf: totalPointsTF, total_points_kq: totalPointsKQ, tf_scoring_mode: tfScoringMode } }
            };
            if (editingMatrixId) {
                await apiService.updateSavedMatrix(editingMatrixId as number, matrixName, data.matrix_data);
            } else {
                const res: any = await apiService.saveMatrix(matrixName, data.matrix_data);
                savedId = res?.id;
                if (!savedId) throw new Error('Không nhận được mã ma trận đã lưu.');
                setEditingMatrixId(savedId);
            }
            saved = true;
            if (assignClassIds.length && savedId) {
                const result = await apiService.assignMatrixToClasses(assignClassIds, Number(savedId), { ...assignmentOptions, open_time: assignmentOptions.open_time ? new Date(assignmentOptions.open_time).toISOString() : null, deadline: assignmentOptions.deadline ? new Date(assignmentOptions.deadline).toISOString() : null });
                alert(`Đã giao cho ${result.assigned.length} lớp. ${result.skipped.length} lớp đã nhận trước đó được giữ nguyên.`);
            }
            setShowSaveModal(false);
            loadData();
            
            // Reset matrix
            setMatrix({ TN: {}, TF: {}, KQ: {}, TL: {} });
            handleNewMatrix();
            setAssignClassIds([]);
            setAssignmentOptions({ open_time: '', deadline: '', max_attempts: 0, allow_review: true });
            setTabTotals({ TN: 0, TF: 0, KQ: 0, TL: 0 });
            setTotalQuestions(0);
        } catch (e) {
            console.error(e);
            alert(`${saved ? 'Ma trận đã lưu; chưa hoàn tất giao bài. Có thể thử lại mà không tạo ma trận mới. ' : ''}${(e as Error).message || 'Lỗi lưu ma trận.'}`);
        } finally { setSavingMatrix(false); }
    };


    const dbGradeId = selectedGrade === 10 ? 0 : selectedGrade === 11 ? 1 : selectedGrade === 12 ? 2 : selectedGrade;
    const currentGradeNode = treeData.find(g => g.grade === dbGradeId);
    const currentSubjectNode = currentGradeNode?.subjects.find(s => s.subject === selectedSubject);


    return (
        <div className="w-full h-full flex gap-3 overflow-hidden p-0.5">
            {/* LEFT: SAVED LIST (TREE VIEW) */}
            {isSidebarCollapsed ? (
                <div className="w-12 flex flex-col items-center py-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 transition-all duration-200 gap-3">
                    <button 
                        onClick={() => setIsSidebarCollapsed(false)} 
                        className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                        title="Mở danh sách ma trận đã lưu"
                    >
                        <PanelLeft size={20}/>
                    </button>
                    <div className="w-8 h-px bg-slate-200 my-1"></div>
                    <button 
                        onClick={handleNewMatrix} 
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" 
                        title="Tạo ma trận mới"
                    >
                        <Plus size={18}/>
                    </button>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 rotate-90 whitespace-nowrap uppercase tracking-widest">
                            Ma Trận ({savedMatrices.length})
                        </span>
                    </div>
                </div>
            ) : (
                <div className="w-80 max-w-[85vw] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0 transition-all duration-200">
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/90 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <Database size={17} className="text-indigo-600"/> Ma trận đã lưu
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                {savedMatrices.length}
                            </span>
                        </h3>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleNewMatrix} 
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors" 
                                title="Tạo mới"
                            >
                                <Plus size={16}/>
                            </button>
                            <button 
                                onClick={() => setIsSidebarCollapsed(true)} 
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors" 
                                title="Thu gọn danh sách"
                            >
                                <PanelLeftClose size={16}/>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
                        {savedMatrices.length === 0 ? (
                            <div className="text-center text-slate-400 text-xs mt-6">Chưa có ma trận nào.</div>
                        ) : (
                            <MatrixLibrary matrices={savedMatrices} selectedId={editingMatrixId} onSelect={handleSelectMatrix}
                                onConfigure={handleOpenSaveModal} onGenerate={handleQuickGenerateTex} onReload={() => void loadData()}
                                canEdit={m => user?.role === 'ADMIN' || (user?.role === 'TEACHER' && Number((m as any).created_by) === user.id)}
                                onDelete={m => { if (confirm('Xóa ma trận này?')) void apiService.deleteMatrix(m.id).then(loadData).catch(e => alert(e.message)); }}/>
                        )}
                    </div>
                </div>
            )}

            {/* MIDDLE: BUILDER */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 h-full overflow-hidden">
                <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0">
                    {/* Header Controls: 2 Hàng sắc nét, hiện đại */}
                    <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-md flex flex-col gap-2.5 shrink-0">
                        {/* Hàng 1: Lớp, Môn, Tên ma trận & Thống kê */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                {/* Segmented Buttons: Khối lớp */}
                                <div className="flex bg-slate-200/80 rounded-xl p-0.5 border border-slate-200">
                                    {[10, 11, 12].map(g => {
                                        const gradeVal = g === 10 ? 0 : g === 11 ? 1 : 2;
                                        return (
                                            <button 
                                                key={g} 
                                                onClick={() => setSelectedGrade(gradeVal)} 
                                                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedGrade === gradeVal ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                            >
                                                Lớp {g}
                                            </button>
                                        );
                                    })}
                                    <div className="h-4 w-px bg-slate-300 self-center mx-0.5"></div>
                                    {[9, 8, 7, 6].map(g => (
                                        <button 
                                            key={g} 
                                            onClick={() => setSelectedGrade(g)} 
                                            className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedGrade === g ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>

                                {/* Segmented Buttons: Môn học */}
                                <div className="flex bg-slate-200/80 rounded-xl p-0.5 border border-slate-200">
                                    {[
                                        { id: 'D', label: 'Đại Số' },
                                        { id: 'H', label: 'Hình Học' },
                                        { id: 'C', label: 'Chuyên Đề' }
                                    ].map(s => (
                                        <button 
                                            key={s.id} 
                                            onClick={() => setSelectedSubject(s.id)} 
                                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedSubject === s.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tên Ma Trận Hiện Tại */}
                                {matrixName ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50/80 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold max-w-[240px] truncate" title={matrixName}>
                                        <FileText size={13} className="text-indigo-600 shrink-0"/>
                                        <span className="truncate">{matrixName}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-slate-400 text-xs italic">
                                        (Ma trận mới chưa đặt tên)
                                    </div>
                                )}
                            </div>

                            {/* Badge Thống kê Tổng số câu */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs">
                                <span className="font-bold text-slate-800">
                                    Tổng: <span className="text-indigo-600 font-extrabold text-sm">{totalQuestions}</span> câu
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-blue-600 font-semibold" title="Phần I: TN 4 phương án">TN: {tabTotals.TN}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-emerald-600 font-semibold" title="Phần II: Đúng / Sai">Đ/S: {tabTotals.TF}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-amber-600 font-semibold" title="Phần III: Trả lời ngắn">TLN: {tabTotals.KQ}</span>
                                {tabTotals.TL > 0 && (
                                    <>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-purple-600 font-semibold" title="Phần IV: Tự luận">TL: {tabTotals.TL}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hàng 2: Thanh Tác vụ Nổi Bật (Nút Xuất Ma Trận & Sinh Đề Thi) */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
                            {/* Cụm Nút Hành Động Trọng Tâm */}
                            <div className="flex items-center gap-2.5">
                                {/* 🔥 NÚT XUẤT MA TRẬN - NỔI BẬT NHẤT */}
                                <div className="relative" ref={exportMenuRef}>
                                    <button 
                                        onClick={() => setShowExportMenu(!showExportMenu)} 
                                        disabled={isExporting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4.5 py-2 rounded-xl text-xs font-extrabold shadow-sm shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                        title="Xuất bảng ma trận và bản đặc tả theo chuẩn mới nhất của Bộ GD&ĐT"
                                    >
                                        {isExporting ? <Loader2 size={16} className="animate-spin"/> : <FileSpreadsheet size={16}/>} 
                                        <span>Xuất Ma Trận</span>
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}/>
                                    </button>

                                    {/* Dropdown Menu Xuất Ma Trận */}
                                    {showExportMenu && (
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="px-3.5 py-2 bg-emerald-50/80 border-b border-emerald-100 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                                                Xuất chuẩn Bộ GD&ĐT (CV 764)
                                            </div>
                                            <div className="p-1.5 space-y-0.5">
                                                <button 
                                                    onClick={() => { setShowExportMenu(false); handleExportDocx('MATRIX'); }} 
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 text-slate-700 rounded-lg flex items-center gap-2.5 transition-colors"
                                                >
                                                    <FileText size={15} className="text-emerald-600"/> 
                                                    <div>
                                                        <div className="font-bold text-slate-800">Ma trận đề thi (.docx)</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">Bảng ma trận 3 phần & % điểm</div>
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={() => { setShowExportMenu(false); handleExportDocx('SPEC'); }} 
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 text-slate-700 rounded-lg flex items-center gap-2.5 transition-colors"
                                                >
                                                    <ListChecks size={15} className="text-indigo-600"/> 
                                                    <div>
                                                        <div className="font-bold text-slate-800">Bản đặc tả ma trận (.docx)</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">Yêu cầu cần đạt & dạng toán</div>
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={() => { setShowExportMenu(false); handleExportDocx('COMBINED'); }} 
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 text-slate-700 rounded-lg flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Layers size={15} className="text-amber-600"/> 
                                                    <div>
                                                        <div className="font-bold text-slate-800">Xuất gộp cả hai (.docx)</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">Ma trận + Bản đặc tả trọn gói</div>
                                                    </div>
                                                </button>
                                                
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                
                                                <button 
                                                    onClick={handleExportStructureTex} 
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2.5 transition-colors"
                                                >
                                                    <FileOutput size={15} className="text-teal-600"/> 
                                                    <div>
                                                        <div className="font-bold text-slate-800">Ma trận & Bản đặc tả (.tex)</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">Mã nguồn bảng LaTeX khổ ngang</div>
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={handleExportReviewTex} 
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2.5 transition-colors"
                                                >
                                                    <RefreshCw size={15} className="text-purple-600"/> 
                                                    <div>
                                                        <div className="font-bold text-slate-800">Đề ôn tập theo ma trận (.tex)</div>
                                                        <div className="text-[10px] text-slate-400 font-normal">Đầy đủ câu hỏi kèm lời giải</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ⚡ NÚT SINH ĐỀ THI NGẪU NHIÊN */}
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={totalQuestions === 0 || generating} 
                                    className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white px-4.5 py-2 rounded-xl text-xs font-extrabold shadow-sm shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    title="Sinh một bộ đề thi ngẫu nhiên không trùng lặp từ ngân hàng câu hỏi TiDB"
                                >
                                    {generating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} className="text-amber-300"/>} 
                                    <span>{generating ? "Đang Sinh Đề..." : "Sinh Đề Ngẫu Nhiên (.tex)"}</span>
                                </button>
                            </div>

                            {/* Cụm Nút Phụ (Lưu, Reset, Nhập File) */}
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowSaveModal(true)} 
                                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                                    title="Lưu cấu hình ma trận này vào CSDL"
                                >
                                    <Save size={15} className="text-slate-600"/> Lưu Ma Trận
                                </button>
                                <button 
                                    onClick={handleResetMatrix} 
                                    className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                                    title="Xóa trắng các ô nhập ma trận hiện tại"
                                >
                                    <Trash2 size={14}/> Làm mới
                                </button>
                                <button 
                                    onClick={() => importFileRef.current?.click()} 
                                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                                    title="Nhập cấu trúc ma trận từ file JSON hoặc TeX"
                                >
                                    {importing ? <Loader2 size={14} className="animate-spin"/> : <FolderOpen size={14}/>} Nhập File
                                </button>
                                <input type="file" ref={importFileRef} onChange={handleImportMatrixFromFile} accept=".tex,.txt,.json" className="hidden" />
                            </div>
                        </div>
                    </div>

                    {/* TABS: Phân loại câu hỏi */}
                    <div className="flex border-b border-slate-200 bg-white px-4 pt-1 shrink-0">
                        {[
                            { id: 'TN', label: 'Phần I: TN 4 Phương Án', icon: ListChecks, color: 'blue' },
                            { id: 'TF', label: 'Phần II: TN Đúng / Sai', icon: CheckSquare, color: 'emerald' },
                            { id: 'KQ', label: 'Phần III: Trả Lời Ngắn', icon: Type, color: 'amber' },
                            { id: 'TL', label: 'Phần IV: Tự Luận', icon: AlignLeft, color: 'purple' },
                        ].map(tab => {
                            const count = tabTotals[tab.id as QuestionType] || 0;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id as QuestionType)} 
                                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                                        isActive 
                                            ? `border-${tab.color}-600 text-${tab.color}-700 bg-${tab.color}-50/40` 
                                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    <tab.icon size={15}/> 
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span className={`ml-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                            isActive 
                                                ? `bg-${tab.color}-600 text-white` 
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* TREE CONTENT: Bảng nhập liệu số câu theo mức độ */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                        {loading ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                                <Loader2 className="animate-spin text-indigo-600" size={28}/> 
                                <span className="text-xs font-semibold">Đang tải cây dữ liệu từ CSDL...</span>
                            </div>
                        ) : !currentSubjectNode ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                                <Database size={36} className="opacity-40 text-slate-400"/>
                                <span className="text-xs font-semibold">Chưa có dữ liệu cho khối lớp và môn này.</span>
                            </div>
                        ) : (
                            currentSubjectNode.chapters.map(c => {
                                const chapKey = `C-${c.id}`;
                                const isChapExpanded = expanded.has(chapKey);
                                return (
                                    <div key={c.id} className="border-b border-slate-100 last:border-0">
                                        <button 
                                            onClick={() => toggleExpand(chapKey)} 
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-left transition-colors ${isChapExpanded ? 'bg-slate-50 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {isChapExpanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                                            <span className="flex items-center gap-2"><FolderOpen size={15} className="text-indigo-500"/> Chương {c.num}. {c.name}</span>
                                        </button>
                                        
                                        {isChapExpanded && (
                                            <div className="bg-slate-50/30 border-t border-slate-100">
                                                {c.units.map(u => {
                                                    const unitKey = `U-${u.id}`;
                                                    const isUnitExpanded = expanded.has(unitKey);
                                                    const uName = u.name || '';
                                                    const dispUName = uName.startsWith('Bài') ? uName : `Bài ${u.num}. ${uName}`;

                                                    return (
                                                        <div key={u.id} className="border-b border-slate-50 last:border-0">
                                                            <button 
                                                                onClick={() => toggleExpand(unitKey)} 
                                                                className={`w-full flex items-center gap-3 px-8 py-2.5 text-xs font-bold text-left transition-colors ${isUnitExpanded ? 'text-indigo-700 bg-indigo-50/40' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'}`}
                                                            >
                                                                {isUnitExpanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                                                                <span className="flex items-center gap-2"><Layers size={13} className="text-slate-400"/> {dispUName}</span>
                                                            </button>
                                                            
                                                            {isUnitExpanded && (
                                                                <div className="bg-white pl-4">
                                                                    <div className="grid grid-cols-12 gap-2 p-2 bg-slate-100/70 text-[10px] font-extrabold text-slate-500 uppercase border-y border-slate-200/60">
                                                                        <div className="col-span-6 pl-8">Dạng toán / Chủ đề</div>
                                                                        <div className="col-span-6 grid grid-cols-5 text-center gap-1.5 font-bold">
                                                                            <span className="text-blue-600">NB (Biết)</span>
                                                                            <span className="text-emerald-600">TH (Hiểu)</span>
                                                                            <span className="text-amber-600">VD (Vận dụng)</span>
                                                                            <span className="text-purple-600">VDC (Cao)</span>
                                                                            <span className="text-slate-600">Tổng</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {mergeTypes(u.types).map(typeItem => {
                                                                        const key = `${dbGradeId}-${selectedSubject}-${c.num}-${u.num}-${typeItem.count_id}`;
                                                                        const stats = typeItem.stats?.[activeTab] || {N:0,H:0,V:0,C:0};
                                                                        const counts = matrix[activeTab]?.[key] || {N:0,H:0,V:0,C:0};
                                                                        const rowTotal = (counts.N||0) + (counts.H||0) + (counts.V||0) + (counts.C||0);
                                                                        const hasSelected = rowTotal > 0;
                                                                        
                                                                        return (
                                                                            <div key={typeItem.count_id} className={`grid grid-cols-12 gap-2 p-2 items-center transition-colors border-b border-slate-100/70 last:border-0 ${hasSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'}`}>
                                                                                <div className="col-span-6 pl-8 text-xs font-medium text-slate-700 flex items-start gap-2 min-w-0">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${hasSelected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-500'}`}>
                                                                                        #{typeItem.count_id}
                                                                                    </span>
                                                                                    <span className={`leading-snug truncate ${hasSelected ? 'font-bold text-indigo-950' : ''}`} title={typeItem.description}>
                                                                                        {typeItem.description}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="col-span-6 grid grid-cols-5 gap-1.5">
                                                                                    {['N','H','V','C'].map(lvl => {
                                                                                        const max = stats[lvl as keyof LevelCounts] || 0;
                                                                                        const val = counts[lvl as keyof LevelCounts];
                                                                                        const lvlColor = lvl === 'N' ? 'blue' : lvl === 'H' ? 'emerald' : lvl === 'V' ? 'amber' : 'purple';
                                                                                        return (
                                                                                            <div key={lvl} className="flex flex-col items-center">
                                                                                                <input 
                                                                                                    type="number" min="0" max={max} placeholder="0" 
                                                                                                    value={val > 0 ? val : ''}
                                                                                                    onChange={e => updateCount(key, lvl as any, e.target.value, max)}
                                                                                                    className={`w-full text-center border rounded-lg py-1 text-xs font-bold outline-none transition-all ${
                                                                                                        val > 0 
                                                                                                            ? `bg-${lvlColor}-50 border-${lvlColor}-400 text-${lvlColor}-900 ring-1 ring-${lvlColor}-300` 
                                                                                                            : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-400'
                                                                                                    }`}
                                                                                                    disabled={max === 0}
                                                                                                />
                                                                                                <span className={`text-[9px] font-bold mt-0.5 ${max > 0 ? 'text-slate-500' : 'text-slate-300'}`}>/{max}</span>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                    <div className={`flex flex-col items-center justify-center rounded-lg border h-[30px] mt-0.5 ${hasSelected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                                                        <span className="text-[11px] font-extrabold">{rowTotal}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* BOTTOM: OUTPUT ĐỀ THI TEX */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 shrink-0 flex flex-col gap-2.5" ref={outputRef}>
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2.5">
                            <button 
                                onClick={handleGenerate} 
                                disabled={totalQuestions === 0 || generating} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-xs"
                            >
                                {generating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} className="text-amber-300"/>} 
                                <span>{generating ? "Đang Sinh Đề..." : "Sinh Đề Ngẫu Nhiên"}</span>
                            </button>
                            
                        </div>

                        {generatedExam && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleCopyTex} 
                                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                                    title="Sao chép toàn bộ mã TeX"
                                >
                                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    <span>{copied ? "Đã chép!" : "Sao chép TeX"}</span>
                                </button>
                                <a 
                                    href={URL.createObjectURL(new Blob([generatedExam], { type: 'text/plain;charset=utf-8' }))} 
                                    download={`${(matrixName || 'de_thi').replace(/\s+/g, '_')}.tex`} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                                    title="Tải file .tex để nhúng vào template/Main-Soan-2025.tex"
                                >
                                    <Download size={14}/> Tải file .TeX (Chuẩn Main)
                                </a>
                            </div>
                        )}
                    </div>

                    {generatedExam ? (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                    <CheckCircle2 size={13} className="text-emerald-600"/> Tương thích 100% template/Main-Soan-2025.tex và gói ex_test.sty (Chỉ cần \input&#123;...&#125; vào file main)
                                </span>
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={generating}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline text-xs"
                                    title="Bấm để sinh một bộ câu hỏi ngẫu nhiên khác theo ma trận này"
                                >
                                    <RefreshCw size={12} className={generating ? "animate-spin" : ""} /> Đổi sang đề ngẫu nhiên khác
                                </button>
                            </div>
                            <div className="relative h-40 bg-slate-900 rounded-xl overflow-hidden group border border-slate-800 shadow-inner">
                                <textarea 
                                    readOnly 
                                    value={generatedExam} 
                                    className="w-full h-full bg-transparent text-emerald-400 font-mono text-xs p-3 resize-none outline-none custom-scrollbar leading-relaxed selection:bg-indigo-700 selection:text-white"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-2">
                            <span>💡 Hãy nhập số câu hỏi vào các ô và bấm</span>
                            <strong className="text-indigo-600">"Sinh Đề Ngẫu Nhiên"</strong> 
                            <span>hoặc bấm</span> 
                            <strong className="text-emerald-600">"Xuất Ma Trận"</strong>
                            <span>để xuất bảng Word / TeX.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* SAVE & CONFIG MODAL */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                            <Settings size={20} className="text-primary-600"/> 
                            {editingMatrixId ? 'Cập nhật Cấu hình' : 'Lưu & Cấu hình Đề thi'}
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('oe_save_matrix_name')}</label>
                                    <input value={matrixName} onChange={e=>setMatrixName(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-800" placeholder="VD: Kiểm tra 1 tiết..." autoFocus/>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Khối lớp</label>
                                    <select value={matrixGrade} onChange={e => setMatrixGrade(parseInt(e.target.value))} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 bg-white">
                                        <option value={0}>Lớp 10</option>
                                        <option value={1}>Lớp 11</option>
                                        <option value={2}>Lớp 12</option>
                                    </select>
                                    <label className="flex items-center gap-2 mt-2 text-xs text-slate-600"><input type="checkbox" checked={matrixMultiGrade} onChange={e => setMatrixMultiGrade(e.target.checked)}/>Dùng chung nhiều khối (Liên khối)</label>
                                </div>
                                <label className="text-xs font-bold text-slate-500">Mục đích đề<select value={matrixCatalog.purpose} onChange={e => setMatrixCatalog(old => ({ ...old, purpose: e.target.value }))} className="block w-full border rounded-xl p-3 mt-1 bg-white text-slate-700">{Object.entries(MATRIX_PURPOSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                                <label className="text-xs font-bold text-slate-500">Trạng thái biên tập<select value={matrixCatalog.status} onChange={e => setMatrixCatalog(old => ({ ...old, status: e.target.value }))} className="block w-full border rounded-xl p-3 mt-1 bg-white text-slate-700">{Object.entries(MATRIX_STATUSES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                                <label className="text-xs font-bold text-slate-500">Năm học<input placeholder="2026-2027" value={matrixCatalog.year} onChange={e => setMatrixCatalog(old => ({ ...old, year: e.target.value }))} className="block w-full border rounded-xl p-3 mt-1 text-slate-700"/></label>
                                <label className="text-xs font-bold text-slate-500">Học kỳ<select value={matrixCatalog.term} onChange={e => setMatrixCatalog(old => ({ ...old, term: e.target.value }))} className="block w-full border rounded-xl p-3 mt-1 bg-white text-slate-700"><option value="">Chưa chọn</option><option value="1">Học kỳ I</option><option value="2">Học kỳ II</option><option value="YEAR">Cả năm</option></select></label>
                                <p className="col-span-2 text-xs text-slate-500">Khối lớp là đối tượng làm đề, không giới hạn khối kiến thức trong ma trận. Trạng thái biên tập không thay đổi quyền công khai hay bài đã giao.</p>
                                {teacherClasses.length > 0 && (
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-2">Giao trực tiếp cho lớp (tuỳ chọn)</label>
                                        <ClassSelection classes={teacherClasses} selected={assignClassIds} onChange={setAssignClassIds}/>
                                        <p className="text-xs text-slate-500 mt-2">Không chọn lớp nếu chỉ muốn lưu. Cấu hình dưới đây áp dụng chung cho các lớp mới nhận bài.</p>
                                        {assignClassIds.length > 0 && <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-slate-600">
                                            <label>Mở đề (trống: mở ngay)<input type="datetime-local" className="block w-full border rounded-lg p-2" value={assignmentOptions.open_time} onChange={e => setAssignmentOptions(o => ({ ...o, open_time: e.target.value }))}/></label>
                                            <label>Hạn nộp (trống: không hạn)<input type="datetime-local" className="block w-full border rounded-lg p-2" value={assignmentOptions.deadline} onChange={e => setAssignmentOptions(o => ({ ...o, deadline: e.target.value }))}/></label>
                                            <label>Lượt thi (0: không giới hạn)<input type="number" min="0" step="1" className="block w-full border rounded-lg p-2" value={assignmentOptions.max_attempts} onChange={e => setAssignmentOptions(o => ({ ...o, max_attempts: Number(e.target.value) }))}/></label>
                                            <label className="flex gap-2 items-center"><input type="checkbox" checked={assignmentOptions.allow_review} onChange={e => setAssignmentOptions(o => ({ ...o, allow_review: e.target.checked }))}/>Xem bài làm và lời giải sau nộp</label>
                                        </div>}
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('oe_duration')}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="1" value={examDuration} onChange={e=>setExamDuration(parseInt(e.target.value))} className="flex-1 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-center text-lg text-slate-800"/>
                                        <div className="bg-slate-100 p-3 rounded-xl text-slate-500 font-bold text-sm">Phút</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('oe_mode')}</label>
                                    <select value={examMode} onChange={e => setExamMode(e.target.value as any)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-sm text-slate-700 bg-white">
                                        <option value="PRACTICE">{t('oe_mode_practice')}</option>
                                        <option value="REAL">{t('oe_mode_real')}</option>
                                    </select>
                                </div>
                            </div>

                            {examMode === 'REAL' && (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm border-b border-slate-200 pb-2 mb-2">
                                        <ShieldCheck size={16}/> Thiết lập thi thật
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('oe_start_time')}</label>
                                            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none focus:border-indigo-500"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('oe_end_time')}</label>
                                            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none focus:border-indigo-500"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('oe_max_attempts')}</label>
                                        <input type="number" min="0" value={maxAttempts} onChange={e => setMaxAttempts(parseInt(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-bold outline-none focus:border-indigo-500" placeholder="0 = Không giới hạn"/>
                                        <p className="text-[10px] text-slate-400 mt-1 italic">Nhập 0 để không giới hạn số lần thi.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm border-b border-indigo-100 pb-2 mb-2">
                                    <ShieldCheck size={16}/> Cấu hình điểm số (Thang 10)
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tổng điểm TN (4 PA)</label>
                                        <input type="number" step="0.1" value={totalPointsTN || ''} onChange={e => setTotalPointsTN(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg text-sm font-bold outline-none focus:border-indigo-500" placeholder="VD: 4.0"/>
                                        <div className="text-[9px] text-slate-400 mt-1">~ {pointsTN}đ/câu</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tổng điểm TN (Đ/S)</label>
                                        <input type="number" step="0.1" value={totalPointsTF || ''} onChange={e => setTotalPointsTF(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg text-sm font-bold outline-none focus:border-indigo-500" placeholder="VD: 4.0"/>
                                        <div className="text-[9px] text-slate-400 mt-1">~ {pointsTF}đ/câu</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tổng điểm Trả lời ngắn</label>
                                        <input type="number" step="0.1" value={totalPointsKQ || ''} onChange={e => setTotalPointsKQ(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg text-sm font-bold outline-none focus:border-indigo-500" placeholder="VD: 2.0"/>
                                        <div className="text-[9px] text-slate-400 mt-1">~ {pointsKQ}đ/câu</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold p-2 bg-white rounded-lg border border-indigo-100">
                                    <span className="text-slate-600">Tổng cộng:</span>
                                    <span className={(totalPointsTN + totalPointsTF + totalPointsKQ) === 10 ? 'text-green-600' : 'text-red-500'}>
                                        {(totalPointsTN + totalPointsTF + totalPointsKQ).toFixed(1)} / 10.0
                                    </span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hoặc cấu hình điểm lẻ mỗi câu</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <input type="number" step="0.05" value={pointsTN} onChange={e => { setPointsTN(parseFloat(e.target.value)); setTotalPointsTN(0); }} className="p-2 border rounded-lg text-xs font-bold outline-none focus:border-indigo-500" placeholder="TN"/>
                                        <input type="number" step="0.05" value={pointsTF} onChange={e => { setPointsTF(parseFloat(e.target.value)); setTotalPointsTF(0); }} className="p-2 border rounded-lg text-xs font-bold outline-none focus:border-indigo-500" placeholder="TF"/>
                                        <input type="number" step="0.05" value={pointsKQ} onChange={e => { setPointsKQ(parseFloat(e.target.value)); setTotalPointsKQ(0); }} className="p-2 border rounded-lg text-xs font-bold outline-none focus:border-indigo-500" placeholder="KQ"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Chế độ chấm điểm TN (Đ/S)</label>
                                    <select value={tfScoringMode} onChange={e => setTfScoringMode(e.target.value as any)} className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-bold text-xs text-slate-700 bg-white">
                                        <option value="10-25-50-100">1 ý: 10% | 2 ý: 25% | 3 ý: 50% | 4 ý: 100%</option>
                                        <option value="25-50-75-100">1 ý: 25% | 2 ý: 50% | 3 ý: 75% | 4 ý: 100%</option>
                                    </select>
                                    <p className="text-[9px] text-slate-400 mt-1 italic">Tỉ lệ điểm nhận được tương ứng với số ý đúng trong một câu hỏi Đúng/Sai.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={()=>setShowSaveModal(false)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold transition-colors">Huỷ bỏ</button>
                            <button disabled={savingMatrix} onClick={handleSaveMatrix} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-colors flex items-center gap-2 disabled:opacity-50">
                                <Save size={18}/> Lưu Cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
import ClassSelection from '../components/ClassSelection';
