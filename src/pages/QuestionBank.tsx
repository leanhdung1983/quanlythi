
import React, { useState, useEffect, useMemo } from 'react';
import { parseTexFile } from '../services/parser';
import { extractTextFromDocx } from '../services/docxService';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { Question, QuestionType, Chapter, Unit, ID6Metadata } from '../types';
import { decodeID6, normalizeID } from '../utils/id6Helper';
import { Plus, Trash2, Search, FileText, Loader2, UploadCloud, Database, X, Edit2, Tag, FileOutput, Sparkles, Info, CheckCircle2, Eye, Clock } from 'lucide-react';
import { useLanguageStore } from '../services/languageStore';
import { MathRenderer } from '../components/MathRenderer';

export const QuestionBank: React.FC = () => {
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [metadataList, setMetadataList] = useState<ID6Metadata[]>([]);
    const [loading, setLoading] = useState(false);

    // Import State
    const [isAdding, setIsAdding] = useState(false);
    const [texInput, setTexInput] = useState('');
    
    // Review State
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewQuestions, setReviewQuestions] = useState<Partial<Question>[]>([]);
    
    // Validation State
    const [isValidating, setIsValidating] = useState(false);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQ, setSelectedQ] = useState<Question | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showProcessingOverlay, setShowProcessingOverlay] = useState(true);
    const [processingProgress, setProcessingProgress] = useState(0);
    
    // Filter State
    const [filterGrade, setFilterGrade] = useState<'ALL' | '0' | '1' | '2'>('ALL');
    const [filterSubject, setFilterSubject] = useState<'ALL' | 'D' | 'H' | 'C'>('ALL');
    const [filterChapterId, setFilterChapterId] = useState<string>('ALL'); 
    const [filterUnit, setFilterUnit] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterLevel, setFilterLevel] = useState<'ALL' | 'N' | 'H' | 'V' | 'C'>('ALL');
    const [filterQType, setFilterQType] = useState<string>('ALL');
    const [filterIdStatus, setFilterIdStatus] = useState<string>('ALL');

    // Quick Assign State
    const [showQuickAssign, setShowQuickAssign] = useState(false);
    const [quickAssignId, setQuickAssignId] = useState('');
    
    // ID Builder State for Modal
    const [builderClass, setBuilderClass] = useState(2);
    const [builderSubject, setBuilderSubject] = useState('D');
    const [builderChapter, setBuilderChapter] = useState(1);
    const [builderLevel, setBuilderLevel] = useState('H');
    const [builderUnit, setBuilderUnit] = useState(1);
    const [builderCount, setBuilderCount] = useState(1);
    const [isManualId, setIsManualId] = useState(false);
    const [isSavingAssign, setIsSavingAssign] = useState(false);

    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [inlineEditId, setInlineEditId] = useState<number | null>(null);
    const [inlineEditText, setInlineEditText] = useState('');
    const [inlineEditSaving, setInlineEditSaving] = useState(false);

    const [showUserGuide, setShowUserGuide] = useState(false);

    const filteredQuestions = questions;

    const totalPages = Math.ceil(questions.length / limit) || 1;
    const currentQuestions = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return questions.slice(start, start + limit);
    }, [questions, currentPage, limit]);

    const loadInitialData = React.useCallback(async () => {
        try {
            const [cData, uData, mData] = await Promise.all([
                apiService.fetchChapters().catch(() => []),
                apiService.fetchUnits().catch(() => []),
                apiService.fetchMetadata().catch(() => [])
            ]);

            const processedMetadata = (mData || []).map((item: ID6Metadata) => {
                let id_class = item.id_class !== undefined ? Number(item.id_class) : undefined;
                let id_subject = item.id_subject;
                let id_chapter = item.id_chapter !== undefined ? Number(item.id_chapter) : undefined;
                let id_unit = item.id_unit !== undefined ? Number(item.id_unit) : undefined;
                let id_count = item.id_count !== undefined ? Number(item.id_count) : undefined;

                const regex = /\[?\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*[-_]\s*(\d+)\s*\]?/i;
                const match = item.id_full?.match(regex);
                if (match) {
                    let rawClass = parseInt(match[1]);
                    if (rawClass === 10) rawClass = 0;
                    else if (rawClass === 11) rawClass = 1;
                    else if (rawClass === 12) rawClass = 2;
                    
                    id_class = rawClass;
                    id_subject = match[2].toUpperCase();
                    id_chapter = parseInt(match[3]);
                    id_unit = parseInt(match[5]);
                    id_count = parseInt(match[6]);
                } else if (id_class !== undefined) {
                    if (id_class === 10) id_class = 0;
                    else if (id_class === 11) id_class = 1;
                    else if (id_class === 12) id_class = 2;
                }

                return {
                    ...item,
                    id_full: normalizeID(item.id_full),
                    id_class,
                    id_subject,
                    id_chapter,
                    id_unit,
                    id_count
                };
            });

            setChapters((cData || []).map((c: Chapter) => ({
                ...c,
                id_class: c.id_class === 10 ? 0 : c.id_class === 11 ? 1 : c.id_class === 12 ? 2 : c.id_class,
                id_subject: c.id_subject?.toUpperCase()
            })));
            setUnits(uData || []);
            setMetadataList(processedMetadata);
        } catch (e) {
            console.error("Error loading initial data:", e);
        }
    }, []);

    const loadQuestions = React.useCallback(async (isMore = false) => {
        if (!isMore) setLoading(true);
        try {
            const currentLimit = isMore ? limit + 100 : 100;
            if (isMore) setLimit(currentLimit);

            const params: Record<string, unknown> = { limit: currentLimit };
            if (filterGrade !== 'ALL') params.grade = filterGrade;
            if (filterSubject !== 'ALL') params.subject = filterSubject;
            if (filterChapterId !== 'ALL') {
                const chap = chapters.find(c => c.id.toString() === filterChapterId);
                if (chap) params.chapter = chap.id_chapter;
            }
            if (filterUnit !== 'ALL') params.unit = filterUnit;
            if (filterLevel !== 'ALL') params.level = filterLevel;
            if (filterType !== 'ALL') params.type = filterType;
            if (filterQType !== 'ALL') params.q_type = filterQType;
            if (filterIdStatus === 'UNCLASSIFIED') params.unclassified = true;
            if (searchTerm) params.search = searchTerm;

            const qRes = await apiService.fetchQuestions(params).catch(err => {
                console.warn("Failed to fetch questions", err);
                return { success: false, data: [] };
            });

            const rawQuestions = qRes.data || [];
            // Sanitize questions (tự động tạo field thiếu)
            const sanitized = rawQuestions.map((q: Question) => ({
                ...q,
                raw_latex: q.raw_latex || '',
                id_full: q.id_full ? normalizeID(q.id_full) : '',
                grade_id: q.grade_id || 12,
                subject_id: q.subject_id || 'D',
                chapter_id: q.chapter_id || 1,
                unit_id: q.unit_id || 1,
                level_id: q.level_id || 'H',
                type_id: q.type_id || 'TN',
                discrimination: q.discrimination || 0
            }));
            
            setQuestions(sanitized);
            setHasMore(sanitized.length >= currentLimit);
        } catch (e) { 
            console.error("Error loading questions:", e); 
        } finally { 
            setLoading(false); 
        }
    }, [limit, filterGrade, filterSubject, filterChapterId, filterUnit, filterLevel, filterType, filterQType, filterIdStatus, searchTerm, chapters]);

    // Initial load
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Reload questions when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            loadQuestions();
            setCurrentPage(1);
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [filterGrade, filterSubject, filterChapterId, filterUnit, filterType, filterLevel, filterQType, filterIdStatus, searchTerm, loadQuestions]);

    const getDetailedDescription = React.useCallback((idFull: string | undefined | null) => {
        if (!idFull) return { line1: t('no_id'), line2: "", valid: false, details: null, full_summary: t('no_id') };

        const regex = /\[?\s*(\d+)\s*([DHC])\s*(\d+)\s*([NHVCX])\s*(\d+)\s*-\s*(\d+)\s*\]?/i;
        const normalized = normalizeID(idFull);
        const match = normalized.match(regex);
        
        if (!match) return { line1: "Mã ID không hợp lệ hoặc không đúng định dạng.", line2: "", valid: false, details: null, full_summary: "Mã ID không hợp lệ." };

        let rawClass = parseInt(match[1]);
        if (rawClass === 10) rawClass = 0;
        if (rawClass === 11) rawClass = 1;
        if (rawClass === 12) rawClass = 2;

        const rawSubject = match[2].toUpperCase();
        const rawChapter = parseInt(match[3]);
        const rawUnit = parseInt(match[5]);
        const rawCount = parseInt(match[6]);

        const rawLevel = match[4].toUpperCase();

        const gradeStr = rawClass === 0 ? "Lớp 10" : rawClass === 1 ? "Lớp 11" : rawClass === 2 ? "Lớp 12" : `Lớp ${rawClass}`;
        const subjectStr = rawSubject === 'D' ? "Toán (ĐS/GT)" : (rawSubject === 'H' ? "Toán (Hình học)" : (rawSubject === 'C' ? "Chuyên đề" : rawSubject));
        const chapterObj = chapters.find(c => 
            c.id_class === rawClass && 
            c.id_subject === rawSubject && 
            c.id_chapter === rawChapter
        );
        const chapterStr = `Chương ${rawChapter}. ${chapterObj?.chapter_name || '...'}`;
        const line1 = `${gradeStr} | ${subjectStr} | ${chapterStr}`;

        let unitStr = `Bài ${rawUnit}`;
        if (chapterObj) {
            const unitObj = units.find(u => u.chapter_id === chapterObj.id && u.id_unit === rawUnit);
            if (unitObj && unitObj.unit_name) {
                unitStr = `Bài ${rawUnit}. ${unitObj.unit_name}`;
            }
        }
        
        const metaObj = metadataList.find(m => m.id_full === normalized);
        let typeStr = `Dạng ${rawCount}`;
        if (metaObj && metaObj.description) {
            typeStr = `Dạng ${rawCount}: ${metaObj.description}`;
        }
        const line2 = `${unitStr} | ${typeStr}`;
        
        let levelStr = "Chưa rõ";
        if (rawLevel === 'N') levelStr = "Nhận biết";
        if (rawLevel === 'H') levelStr = "Thông hiểu";
        if (rawLevel === 'V') levelStr = "Vận dụng";
        if (rawLevel === 'C') levelStr = "Vận dụng cao";

        // Combined string for the "Diễn giải ID" column as requested
        const full_summary = `${gradeStr} - ${subjectStr}\n- ${chapterStr}\n- ${unitStr}\n- ${typeStr}\n- Mức độ: ${levelStr}`;

        return { 
            line1, line2, valid: true,
            full_summary,
            details: {
                grade: gradeStr,
                subject: subjectStr,
                chapter: chapterStr,
                unit: unitStr,
                type: typeStr,
                level: levelStr
            }
        };
    }, [t, chapters, units, metadataList]);

    const handleProcessImport = async () => {
        if (!texInput.trim()) return alert("No content.");
        
        setIsValidating(true);
        try {
            const result = parseTexFile(texInput);
            let parsedQs = result.questions.filter(q => q.raw_latex);
            
            if (parsedQs.length === 0 && texInput.length > 10) {
                parsedQs = [{ id_full: 'UNKNOWN', q_type: QuestionType.TN, raw_latex: texInput }];
            }

            if (parsedQs.length === 0) {
                alert("Không tìm thấy câu hỏi nào để nhập.");
                return;
            }

            // Normalize and prepare for review
            const prepared = parsedQs.map(q => ({
                ...q,
                id_full: q.id_full ? normalizeID(q.id_full) : 'UNKNOWN',
                is_selected: true
            }));

            setReviewQuestions(prepared);
            setIsReviewing(true);
            setIsAdding(false); // Close the initial add modal
            setTexInput('');
        } catch (error) {
            alert("Lỗi phân tích: " + error);
        } finally {
            setIsValidating(false);
        }
    };

    const handleUpdateReviewId = (index: number, newId: string) => {
        const newArr = [...reviewQuestions];
        const oldLatex = newArr[index].raw_latex || '';
        const normalizedId = normalizeID(newId);
        
        // Cố gắng cập nhật ID trong Latex nếu có; backend sẽ chuẩn hóa lại lần cuối.
        const idRegex = /\[(10|11|12|[0126789])([DHC])(\d+)([NHVCXYBKGT])(\d+)-(\d+)\]/i;
        let newLatex = oldLatex;
        if (idRegex.test(oldLatex)) {
            newLatex = oldLatex.replace(idRegex, `[${normalizedId}]`);
        } else if (oldLatex.includes('\\begin{ex}')) {
            newLatex = oldLatex.replace('\\begin{ex}', `\\begin{ex}\n%[${normalizedId}]`);
        }
        
        newArr[index] = { ...newArr[index], id_full: normalizedId, raw_latex: newLatex };
        setReviewQuestions(newArr);
    };

    const handleConfirmImport = async () => {
        const toImport = reviewQuestions.filter(q => (q as any).is_selected);
        if (toImport.length === 0) return alert("Vui lòng chọn ít nhất một câu hỏi để nhập.");

        setIsValidating(true);
        try {
            await apiService.importQuestions(toImport, user?.id, user?.username);
            alert(`Đã nhập thành công ${toImport.length} câu hỏi.`);
            setIsReviewing(false);
            setReviewQuestions([]);
            loadQuestions();
        } catch (error) {
            alert("Lỗi khi nhập câu hỏi: " + error);
        } finally {
            setIsValidating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        setIsProcessing(true);
        setProcessingProgress(0);
        
        try {
            const fileList = Array.from(files);
            const allParsedQs: Partial<Question>[] = [];

            for (let i = 0; i < fileList.length; i++) {
                let text = '';
                if (fileList[i].name.toLowerCase().endsWith('.docx')) {
                    text = await extractTextFromDocx(fileList[i]);
                } else {
                    text = await fileList[i].text();
                }

                const result = parseTexFile(text);
                const parsedQs = result.questions.filter(q => q.raw_latex);
                allParsedQs.push(...parsedQs.map(q => ({
                    ...q,
                    id_full: q.id_full ? normalizeID(q.id_full) : 'UNKNOWN',
                    is_selected: true
                })));
                
                setProcessingProgress(Math.round(((i + 1) / fileList.length) * 100));
            }

            if (allParsedQs.length > 0) {
                setReviewQuestions(allParsedQs);
                setIsReviewing(true);
                setIsAdding(false);
            } else {
                alert("Không tìm thấy câu hỏi nào trong các file đã chọn.");
            }
            
            loadQuestions();
        } catch (err) { 
            alert("Lỗi khi xử lý file: " + err); 
        } finally { 
            setIsProcessing(false); 
            setProcessingProgress(0);
            if (e.target) e.target.value = ''; 
        }
    };

    const handleBulkDelete = async () => {
        if (filteredQuestions.length === 0) return;
        if (!confirm(`Bạn có chắc chắn muốn xoá TẤT CẢ ${filteredQuestions.length} câu hỏi đang được lọc?`)) return;
        
        try {
            const ids = filteredQuestions.map(q => q.id);
            const res = await apiService.bulkDeleteQuestions(ids, user?.id);
            if (res.success) {
                alert(`Đã xoá thành công ${ids.length} câu hỏi!`);
                if (selectedQ && ids.includes(selectedQ.id)) setSelectedQ(null);
                loadQuestions();
            }
        } catch (err) {
            console.error("Bulk Delete Error:", err);
            alert("Lỗi khi xoá hàng loạt.");
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm(t('delete_confirm'))) return;
        try {
            await apiService.deleteQuestion(id, user?.id);
            if(selectedQ?.id === id) setSelectedQ(null);
            loadQuestions();
        } catch (err: unknown) { 
            const error = err as Error;
            alert(error.message || "Delete failed"); 
        }
    };

    const handleSaveEdit = async () => {
        // Feature removed
    };

    const handleQuickAssign = async (newId: string, applyToAllSimilar = false) => {
        if(!selectedQ) return;
        
        // If we are in review mode, just update the local state
        if (isReviewing) {
            const index = reviewQuestions.indexOf(selectedQ as any);
            if (index !== -1) {
                handleUpdateReviewId(index, newId);
                setShowQuickAssign(false);
                return;
            }
        }

        setIsSavingAssign(true);
        try {
            const normalizedId = normalizeID(newId);
            const targetOriginId = selectedQ.id_full;
            const targets = applyToAllSimilar && targetOriginId && targetOriginId !== 'UNKNOWN'
                ? questions.filter(q => q.id_full === targetOriginId)
                : [selectedQ];
            if (targets.length > 1 && !confirm(`Bạn có chắc chắn muốn gán ID "${normalizedId}" cho TẤT CẢ ${targets.length} câu hỏi có cùng mã gốc "${targetOriginId}"?`)) return;
            await apiService.confirmQuestionReview(targets.map(q => ({
                id: q.id,
                id_full: normalizedId,
                content_latex: q.raw_latex || '',
                change_type: 'QUESTION_BANK_ASSIGN'
            })));
            const targetIds = new Set(targets.map(q => q.id));
            setQuestions(prev => prev.map(q => targetIds.has(q.id) ? { ...q, id_full: normalizedId } : q));
            setSelectedQ(prev => prev && targetIds.has(prev.id) ? { ...prev, id_full: normalizedId } : prev);
            
            setShowQuickAssign(false);
            alert("Đã gán ID thành công!");
        } catch (err) { 
            console.error(err);
            alert("Lỗi khi gán ID."); 
        } finally {
            setIsSavingAssign(false);
        }
    };

    const handleOpenQuickAssign = () => {
        if (!selectedQ) return;
        const id = selectedQ.id_full || '';
        setQuickAssignId(id);
        
        const normalized = normalizeID(id);
        const regex = /\[?(\d+)([A-Z]+)(\d+)([A-Z]+)(\d+)-(\d+)\]?/i;
        const match = normalized.match(regex);
        
        if (match) {
            let cls = parseInt(match[1]);
            if (cls === 10) cls = 0;
            else if (cls === 11) cls = 1;
            else if (cls === 12) cls = 2;
            
            setBuilderClass(cls);
            setBuilderSubject(match[2].toUpperCase());
            setBuilderChapter(parseInt(match[3]));
            setBuilderLevel(match[4].toUpperCase());
            setBuilderUnit(parseInt(match[5]));
            setBuilderCount(parseInt(match[6]));
            setIsManualId(false);
        } else {
            setIsManualId(true);
        }
        setShowQuickAssign(true);
    };

    const builderId = useMemo(() => {
        return `${builderClass}${builderSubject}${builderChapter}${builderLevel}${builderUnit}-${builderCount}`;
    }, [builderClass, builderSubject, builderChapter, builderLevel, builderUnit, builderCount]);

    const builderDescription = useMemo(() => {
        if (isManualId) return getDetailedDescription(quickAssignId);
        return getDetailedDescription(builderId);
    }, [isManualId, quickAssignId, builderId, getDetailedDescription]);

    useEffect(() => { loadQuestions(); }, [loadQuestions]);

    const filteredChapters = chapters.filter(c => {
        if (filterGrade !== 'ALL') {
             let g = parseInt(filterGrade as string);
             if (g === 10) g = 0;
             if (g === 11) g = 1;
             if (g === 12) g = 2;
             
             if (c.id_class !== g) return false;
        }
        if (filterSubject !== 'ALL' && c.id_subject !== filterSubject) return false;
        return true;
    });

    const filteredUnits = filterChapterId !== 'ALL' 
        ? units.filter(u => u.chapter_id.toString() === filterChapterId)
        : [];

    const availableTypes = React.useMemo(() => {
        if (filterChapterId === 'ALL') return [];
        
        const selectedChapter = chapters.find(c => c.id.toString() === filterChapterId);
        const chapterNum = selectedChapter ? (selectedChapter.chapter_number ?? selectedChapter.id_chapter) : null;
        
        let targetGrade = parseInt(filterGrade);
        if (targetGrade === 10) targetGrade = 0;
        if (targetGrade === 11) targetGrade = 1;
        if (targetGrade === 12) targetGrade = 2;

        const typesMap = new Map<number, string>();
        
        metadataList.forEach(m => {
            const id = normalizeID(m.id_full).toUpperCase();
            const match = id.match(/\[?\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*[-_]\s*(\d+)\s*\]?/i);
            if (!match) return;
            
            let qGrade = parseInt(match[1]);
            if (qGrade === 10) qGrade = 0;
            if (qGrade === 11) qGrade = 1;
            if (qGrade === 12) qGrade = 2;
            
            const qSubject = match[2].toUpperCase();
            const qChapter = parseInt(match[3]);
            const qUnit = parseInt(match[5]);
            const qCount = parseInt(match[6]);
            
            if (filterGrade !== 'ALL' && qGrade !== targetGrade) return;
            if (filterSubject !== 'ALL' && qSubject !== filterSubject) return;
            if (chapterNum !== null && Number(qChapter) !== Number(chapterNum)) return;
            if (filterUnit !== 'ALL' && (qUnit === null || Number(qUnit) !== Number(filterUnit))) return;
            
            typesMap.set(qCount, m.description);
        });
        
        return Array.from(typesMap.entries())
            .map(([count, desc]) => ({ count, desc }))
            .sort((a, b) => a.count - b.count);
    }, [filterGrade, filterSubject, filterChapterId, filterUnit, metadataList, chapters]);

    const handleInlineSave = async (id: number) => {
        setInlineEditSaving(true);
        try {
            const q = questions.find(item => item.id === id);
            // Try to extract id_full
            const head = inlineEditText.substring(0, 500);
            const idMatch = head.match(/\[\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*[-_]\s*(\d+)\s*\]/i);
            let extractedIdFull: string | undefined = undefined;
            if (idMatch) {
                const [, cls, sub, chap, lvl, unit, cnt] = idMatch;
                extractedIdFull = normalizeID(`${cls}${sub.toUpperCase()}${chap}${lvl.toUpperCase()}${unit}-${cnt}`);
            }

            const updatePayload: Partial<Question> = { 
                raw_latex: inlineEditText,
                id_full: extractedIdFull || q?.id_full // FALLBACK to existing ID if not extracted
            };

            await apiService.updateQuestion(id, updatePayload);
            setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updatePayload } : q));
            if (selectedQ?.id === id) {
                setSelectedQ(prev => prev ? { ...prev, ...updatePayload } : null);
            }
            setInlineEditId(null);
            
            // Reload to grab any backend metadata changes
            setTimeout(() => loadQuestions(), 500);
        } catch (error) {
            alert("Lỗi khi lưu câu hỏi");
        } finally {
            setInlineEditSaving(false);
        }
    };

    const handleTogglePublic = async () => {
        if (!selectedQ) return;
        try {
            const newStatus = !selectedQ.is_public;
            await apiService.toggleQuestionPublic(selectedQ.id, newStatus);
            setSelectedQ({ ...selectedQ, is_public: newStatus });
            setQuestions(prev => prev.map(q => q.id === selectedQ.id ? { ...q, is_public: newStatus } : q));
        } catch { alert("Lỗi khi thay đổi trạng thái chia sẻ"); }
    };

    const handleUpdateCompetencies = async (comp: string) => {
        if (!selectedQ) return;
        const current = selectedQ.competencies || [];
        let updated;
        if (current.includes(comp)) {
            updated = current.filter(c => c !== comp);
        } else {
            updated = [...current, comp];
        }
        try {
            await apiService.updateQuestionCompetencies(selectedQ.id, updated);
            setSelectedQ({ ...selectedQ, competencies: updated });
            setQuestions(prev => prev.map(q => q.id === selectedQ.id ? { ...q, competencies: updated } : q));
        } catch { alert("Lỗi khi cập nhật năng lực"); }
    };

    const COMPETENCIES = [
        "Tư duy và lập luận toán học",
        "Giải quyết vấn đề toán học",
        "Mô hình hóa toán học",
        "Giao tiếp toán học",
        "Sử dụng công cụ, phương tiện học toán"
    ];

    const displayId = isReviewing && selectedQ ? selectedQ.id_full : selectedQ?.id_full;
    const detailedInfo = selectedQ ? getDetailedDescription(displayId) : null;
    const basicInfo = selectedQ ? decodeID6(displayId) : null;

    const handleExportFiltered = () => {
        if (filteredQuestions.length === 0) return alert("Không có câu hỏi để xuất.");
        
        let content = `% ==============================================================================
% TÀI LIỆU CHUYÊN ĐỀ / CÂU HỎI TRÍCH XUẤT TỪ NGÂN HÀNG ID6
% DÙNG TRỰC TIẾP VỚI template/Main-Soan-2025.tex VÀ GÓI LỆNH ex_test.sty
% Thầy/cô chỉ cần gọi: \\input{<tên_file>} trong file main là chạy ngay, không cần khai báo gì khác.
% Số lượng: ${filteredQuestions.length} câu
% ==============================================================================

\\begin{name}{MÔN TOÁN}{TÀI LIỆU CHUYÊN ĐỀ - CÂU HỎI TRÍCH XUẤT}
\\end{name}

`;

        filteredQuestions.forEach((q, idx) => {
            let latex = (q.content_latex_original || q.content_latex || q.original_latex || q.raw_latex || '').trim();
            // Remove watermark
            latex = latex.replace(/%<MyLT>/g, '').trim();

            // Extract ID6 tag if present
            const idTag = q.normalized_id || q.id_full || '';
            const tagMatch = latex.match(/^\\begin\{(?:ex|bt)\}\s*(%\[.*?\])/);
            if (tagMatch) {
                // already has %[...]
            } else if (idTag) {
                // Ensure starts with \begin{ex}%[ID6]
                if (latex.startsWith('\\begin{ex}') || latex.startsWith('\\begin{bt}')) {
                    latex = latex.replace(/^\\begin\{(?:ex|bt)\}/, `\\begin{ex}%[${idTag}]`);
                }
            }

            if (!latex.includes('\\begin{ex}') && !latex.includes('\\begin{bt}') && !latex.includes('\\begin{vd}')) {
                const header = idTag ? `\\begin{ex}%[${idTag}]` : `\\begin{ex}% Câu ${idx + 1}`;
                latex = `${header}\n${latex}\n\\end{ex}`;
            }
            content += `${latex}\n\n`;
        });

        content += `\\begin{center}\n    \\textbf{--------- HẾT ---------}\n\\end{center}\n`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chuyen_de_id6_${new Date().getTime()}.tex`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportAllDB = async () => {
        if (!confirm("Bạn có chắc chắn muốn xuất TOÀN BỘ câu hỏi trong cơ sở dữ liệu? Quá trình này có thể mất một lúc.")) return;
        setLoading(true);
        try {
            const result = await apiService.fetchQuestions({ limit: 50000 }); // Large limit
            const allQ = result.data || [];
            if (allQ.length === 0) {
                alert("Không có câu hỏi nào trong database.");
                return;
            }

            let content = `% ==============================================================================
% DANH SÁCH TOÀN BỘ CÂU HỎI TRONG DATABASE ID6
% DÙNG TRỰC TIẾP VỚI template/Main-Soan-2025.tex VÀ GÓI LỆNH ex_test.sty
% Thầy/cô chỉ cần gọi: \\input{<tên_file>} trong file main là chạy ngay, không cần khai báo gì khác.
% Số lượng: ${allQ.length} câu
% ==============================================================================

\\begin{name}{MÔN TOÁN}{DANH SÁCH TOÀN BỘ CÂU HỎI}
\\end{name}

`;

            allQ.forEach((q: any, idx: number) => {
                let latex = (q.content_latex_original || q.content_latex || q.original_latex || q.raw_latex || '').trim();
                latex = latex.replace(/%<MyLT>/g, '').trim();
                const idTag = q.normalized_id || q.id_full || '';
                const tagMatch = latex.match(/^\\begin\{(?:ex|bt)\}\s*(%\[.*?\])/);
                if (tagMatch) {
                    // already has %[...]
                } else if (idTag) {
                    if (latex.startsWith('\\begin{ex}') || latex.startsWith('\\begin{bt}')) {
                        latex = latex.replace(/^\\begin\{(?:ex|bt)\}/, `\\begin{ex}%[${idTag}]`);
                    }
                }

                if (!latex.includes('\\begin{ex}') && !latex.includes('\\begin{bt}') && !latex.includes('\\begin{vd}')) {
                    const header = idTag ? `\\begin{ex}%[${idTag}]` : `\\begin{ex}% Câu ${idx + 1}`;
                    latex = `${header}\n${latex}\n\\end{ex}`;
                }
                content += `${latex}\n\n`;
            });

            content += `\\begin{center}\n    \\textbf{--------- HẾT ---------}\n\\end{center}\n`;

            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_all_db_${new Date().getTime()}.tex`;
            a.click();
            URL.revokeObjectURL(url);
            alert(`Đã xuất thành công ${allQ.length} câu hỏi.`);
        } catch (err) {
            console.error("Lỗi xuất toàn bộ:", err);
            alert("Lỗi khi tải hoặc xuất toàn bộ dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col min-h-0 bg-white relative">
            {/* Top Bar: Filters */}
            <div className="shrink-0 bg-slate-100 p-2 border-b border-slate-200 grid grid-cols-10 gap-2 items-end">
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lọc</label>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                        <input className="w-full pl-6 pr-2 py-1 text-xs border border-slate-300 rounded bg-white shadow-sm focus:ring-1 ring-primary-500 outline-none" placeholder="Tìm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lớp</label>
                    <select value={filterGrade} onChange={e => setFilterGrade(e.target.value as any)} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm">
                        <option value="ALL">Tất cả</option>
                        <option value="0">Lớp 10</option>
                        <option value="1">Lớp 11</option>
                        <option value="2">Lớp 12</option>
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Môn</label>
                    <select value={filterSubject} onChange={e => setFilterSubject(e.target.value as any)} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm">
                        <option value="ALL">Tất cả</option>
                        <option value="D">Toán ĐS</option>
                        <option value="H">Toán HH</option>
                        <option value="C">Chuyên đề</option>
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chương</label>
                    <select value={filterChapterId} onChange={e => setFilterChapterId(e.target.value)} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm truncate">
                        <option value="ALL">Tất cả</option>
                        {filteredChapters.map(c => (<option key={c.id} value={c.id} title={c.chapter_name}>Chương {c.id_chapter}: {c.chapter_name}</option>))}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bài</label>
                    <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={filterChapterId === 'ALL'} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm disabled:bg-slate-200">
                        <option value="ALL">Tất cả</option>
                        {filteredUnits.map(u => (<option key={u.id} value={u.id_unit} title={u.unit_name}>Bài {u.id_unit}: {u.unit_name}</option>))}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dạng</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} disabled={filterChapterId === 'ALL'} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm disabled:bg-slate-200">
                        <option value="ALL">Tất cả</option>
                        {availableTypes.map(item => (<option key={item.count} value={item.count} title={item.desc}>Dạng {item.count}: {item.desc}</option>))}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mức độ</label>
                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm">
                        <option value="ALL">Tất cả</option>
                        <option value="N">Nhận biết</option>
                        <option value="H">Thông hiểu</option>
                        <option value="V">Vận dụng</option>
                        <option value="C">Vận dụng cao</option>
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Loại</label>
                    <select value={filterQType} onChange={e => setFilterQType(e.target.value)} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm">
                        <option value="ALL">Tất cả</option>
                        <option value="TN">Trắc nghiệm</option>
                        <option value="TF">Đúng sai</option>
                        <option value="KQ">Trả lời ngắn</option>
                        <option value="TL">Tự luận</option>
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Trạng thái ID</label>
                    <select value={filterIdStatus} onChange={e => setFilterIdStatus(e.target.value)} className="w-full text-xs border border-slate-300 rounded bg-white p-1 outline-none shadow-sm">
                        <option value="ALL">Tất cả</option>
                        <option value="UNCLASSIFIED">Lỗi / Chưa gán</option>
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID</label>
                    <input className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white shadow-sm outline-none" placeholder="Mã ID..."/>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full border-collapse border-spacing-0">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                        <tr className="text-xs font-bold text-slate-500 uppercase bg-slate-100">
                            <th className="border-r border-slate-200 px-2 py-1 text-center w-12">STT</th>
                            <th className="border-r border-slate-200 px-4 py-1 text-left min-w-[300px]">Câu hỏi</th>
                            <th className="border-r border-slate-200 px-2 py-1 text-center w-24">ID</th>
                            <th className="px-4 py-1 text-left min-w-[200px]">Diễn giải ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && questions.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center bg-white"><Loader2 className="animate-spin inline-block mr-2 text-indigo-600" /> <span className="text-sm font-bold text-slate-400">Đang tải dữ liệu...</span></td></tr>
                        ) : currentQuestions.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 bg-white italic font-medium">Không tìm thấy nội dung phù hợp với bộ lọc.</td></tr>
                        ) : (
                            currentQuestions.map((q, idx) => {
                                const detail = getDetailedDescription(q.id_full);
                                const d = detail.details;
                                const stt = (currentPage - 1) * limit + idx + 1;
                                return (
                                    <tr 
                                        key={q.id} 
                                        onClick={() => setSelectedQ(q)}
                                        className={`hover:bg-indigo-50/30 cursor-pointer transition-colors border-b border-slate-50 ${selectedQ?.id === q.id ? 'bg-indigo-50/80 shadow-inner' : 'bg-white'}`}
                                    >
                                        <td className="border-r border-slate-100 px-3 py-4 text-center text-xs font-black text-slate-400 align-top">{stt}</td>
                                        <td className="border-r border-slate-100 px-5 py-4 group/cell relative align-top">
                                            {inlineEditId === q.id ? (
                                                <div className="flex flex-col gap-3 p-1">
                                                    <textarea 
                                                        autoFocus
                                                        className="w-full border-2 border-indigo-200 p-4 rounded-xl shadow-inner font-mono text-[12px] focus:border-indigo-500 outline-none transition-all"
                                                        value={inlineEditText} 
                                                        onChange={e => setInlineEditText(e.target.value)} 
                                                        rows={Math.max(6, (q.raw_latex?.match(/\n/g)?.length || 0) + 1)} 
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={(e) => { e.stopPropagation(); setInlineEditId(null); }} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 text-xs font-bold transition-all">Hủy</button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleInlineSave(q.id); }} 
                                                            disabled={inlineEditSaving}
                                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                                                        >
                                                            {inlineEditSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                            {inlineEditSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="relative cursor-pointer group" 
                                                    onClick={(e) => { e.stopPropagation(); setInlineEditId(q.id); setInlineEditText(q.raw_latex || ''); }}
                                                >
                                                    <div className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                                                        {q.raw_latex || <span className="italic text-slate-300">(Nội dung trống)</span>}
                                                    </div>
                                                    <div className="absolute -inset-2 rounded-lg border-2 border-dashed border-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="bg-indigo-500 text-white p-1.5 rounded-lg shadow-lg"><Edit2 size={12}/></span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="border-r border-slate-100 px-3 py-4 text-center align-top">
                                            <span className={`text-xs font-black px-2 py-1.5 rounded-lg border tracking-tight ${q.id_full ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                {q.id_full || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-600 align-top leading-[1.6] font-medium">
                                            {detail.valid ? (
                                                <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/50 whitespace-pre-wrap">
                                                    {detail.full_summary}
                                                </div>
                                            ) : (
                                                <span className="text-red-300 italic">ID không xác định</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Bar */}
            <div className="shrink-0 bg-slate-100 p-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-1">
                    <button onClick={() => setShowUserGuide(true)} className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-slate-600">
                        <Info size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">HDSD</span>
                    </button>
                    <button onClick={handleOpenQuickAssign} className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-slate-600">
                        <Tag size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">Gán ID</span>
                    </button>
                    <button className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-indigo-600">
                        <Sparkles size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">AI ID</span>
                    </button>
                    <div className="w-px bg-slate-300 mx-1 h-8 self-center"></div>
                    <button onClick={() => setIsAdding(true)} className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-emerald-600">
                        <Plus size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">Nhập</span>
                    </button>
                    <button onClick={() => { if(selectedQ) handleDelete(selectedQ.id); }} className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-red-600">
                        <Trash2 size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">Xoá</span>
                    </button>
                    <button onClick={handleExportFiltered} className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-slate-600" title="Xuất danh sách đang lọc">
                        <FileOutput size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">Xuất Lọc</span>
                    </button>
                    <button onClick={handleExportAllDB} className="flex flex-col items-center justify-center w-12 h-10 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 text-indigo-700" title="Xuất toàn bộ database">
                        <Database size={14} /><span className="text-[8px] font-bold uppercase mt-0.5">Xuất All</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Số câu: <span className="text-blue-600 font-black">{questions.length}</span></span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(1)} className="px-2 py-1 border border-slate-300 rounded bg-white text-[10px] font-bold uppercase hover:bg-slate-50 disabled:opacity-50" disabled={currentPage === 1}>Đầu</button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-2 py-1 border border-slate-300 rounded bg-white text-[10px] font-bold uppercase hover:bg-slate-50 disabled:opacity-50" disabled={currentPage === 1}>Trước</button>
                        <div className="flex items-center bg-white border border-slate-300 rounded px-2 h-7 text-[11px] font-bold">
                            {currentPage} / {totalPages}
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 border border-slate-300 rounded bg-white text-[10px] font-bold uppercase hover:bg-slate-50 disabled:opacity-50" disabled={currentPage === totalPages}>Sau</button>
                        <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 border border-slate-300 rounded bg-white text-[10px] font-bold uppercase hover:bg-slate-50 disabled:opacity-50" disabled={currentPage === totalPages}>Cuối</button>
                    </div>
                </div>
            </div>

            {/* Existing processing status and modals kept as they were or slightly adjusted */}
            {isProcessing && showProcessingOverlay && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Database size={32} className="text-primary-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">ĐANG XỬ LÝ DỮ LIỆU</h2>
                    <p className="text-slate-400 max-w-md mb-4">Hệ thống đang đọc và nhập câu hỏi vào ngân hàng. Vui lòng không đóng trình duyệt...</p>
                    <div className="w-full max-w-md bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700 shadow-inner mb-4">
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-500 h-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(37,99,235,0.5)]" style={{ width: `${processingProgress}%` }}></div>
                    </div>
                    <div className="text-4xl font-black text-primary-400 tabular-nums">{processingProgress}%</div>
                    <button onClick={() => setShowProcessingOverlay(false)} className="mt-8 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                        <Eye size={16} /> Chạy ngầm
                    </button>
                </div>
            )}

            {isProcessing && !showProcessingOverlay && (
                <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-slate-700" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-primary-500" strokeDasharray={`${processingProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{processingProgress}%</div>
                    </div>
                    <div>
                        <p className="text-xs font-bold">Đang xử lý ngầm...</p>
                        <button onClick={() => setShowProcessingOverlay(true)} className="text-[10px] text-primary-400 hover:underline">Xem chi tiết</button>
                    </div>
                </div>
            )}


            {showQuickAssign && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Tag className="text-primary-600" size={20}/> Phân loại & Gán ID6
                            </h3>
                            <button onClick={() => setShowQuickAssign(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setIsManualId(false)} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isManualId ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Sử dụng Bộ tạo ID
                                </button>
                                <button 
                                    onClick={() => setIsManualId(true)} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isManualId ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Nhập ID thủ công
                                </button>
                            </div>

                            {!isManualId ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Khối</label>
                                        <select value={builderClass} onChange={e => setBuilderClass(parseInt(e.target.value))} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500">
                                            {[6,7,8,9,0,1,2].map(g => (
                                                <option key={g} value={g}>{g===0?'Lớp 10':g===1?'Lớp 11':g===2?'Lớp 12':`Lớp ${g}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Môn</label>
                                        <select value={builderSubject} onChange={e => setBuilderSubject(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500">
                                            <option value="D">Đại số / Giải tích</option>
                                            <option value="H">Hình học</option>
                                            <option value="C">Chuyên đề</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Chương</label>
                                        <select value={builderChapter} onChange={e => { setBuilderChapter(parseInt(e.target.value)); setBuilderUnit(1); }} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500">
                                            {chapters.filter(c => c.id_class === builderClass && c.id_subject === builderSubject).map(c => (
                                                <option key={c.id} value={c.id_chapter}>Chương {c.id_chapter}: {c.chapter_name}</option>
                                            ))}
                                            {chapters.filter(c => c.id_class === builderClass && c.id_subject === builderSubject).length === 0 && <option value={1}>Chương 1 (Mặc định)</option>}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mức độ</label>
                                        <select value={builderLevel} onChange={e => setBuilderLevel(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500">
                                            <option value="N">Nhận biết</option>
                                            <option value="H">Thông hiểu</option>
                                            <option value="V">Vận dụng</option>
                                            <option value="C">Vận dụng cao</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bài (Unit)</label>
                                        <select value={builderUnit} onChange={e => setBuilderUnit(parseInt(e.target.value))} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500">
                                            {units.filter(u => {
                                                const chap = chapters.find(c => c.id_class === builderClass && c.id_subject === builderSubject && c.id_chapter === builderChapter);
                                                return chap && u.chapter_id === chap.id;
                                            }).map(u => (
                                                <option key={u.id} value={u.id_unit}>Bài {u.id_unit}: {u.unit_name}</option>
                                            ))}
                                            {units.filter(u => {
                                                const chap = chapters.find(c => c.id_class === builderClass && c.id_subject === builderSubject && c.id_chapter === builderChapter);
                                                return chap && u.chapter_id === chap.id;
                                            }).length === 0 && <option value={1}>Bài 1 (Mặc định)</option>}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Số thứ tự (Dạng)</label>
                                        <div className="flex gap-2 items-center">
                                            {availableTypes.length > 0 ? (
                                                <select 
                                                    value={builderCount} 
                                                    onChange={e => setBuilderCount(parseInt(e.target.value))} 
                                                    className="flex-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500"
                                                >
                                                    {availableTypes.map(item => (
                                                        <option key={item.count} value={item.count}>Dạng {item.count}: {item.desc}</option>
                                                    ))}
                                                    <option value={builderCount > 0 && !availableTypes.find(t => t.count === builderCount) ? builderCount : 99}>Khác (Nhập số...)</option>
                                                </select>
                                            ) : (
                                                <input 
                                                    type="number" 
                                                    value={builderCount} 
                                                    onChange={e => setBuilderCount(parseInt(e.target.value) || 1)} 
                                                    className="flex-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 ring-primary-500"
                                                />
                                            )}
                                            <div className="text-xs text-slate-400 italic">Gợi ý: Dạng bài tập</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mã ID6 đầy đủ</label>
                                    <input 
                                        value={quickAssignId} 
                                        onChange={e => setQuickAssignId(e.target.value)} 
                                        placeholder="Nhập ID (VD: 2D1H1-1)" 
                                        className="w-full border rounded-xl p-3 text-lg font-mono outline-none focus:ring-2 ring-primary-500 shadow-inner bg-slate-50"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 italic">Định dạng: [Khối][Môn][Chương][Mức độ][Bài]-[Số thứ tự]</p>
                                </div>
                            )}

                            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Mã ID sẽ gán</span>
                                <div className="text-3xl font-mono font-black text-primary-700 tracking-tighter">
                                    {isManualId ? (quickAssignId || '?????-?') : builderId}
                                </div>
                                {builderDescription && builderDescription.valid && (
                                    <div className="mt-2 text-center">
                                        <div className="text-[10px] font-bold text-primary-600 uppercase mb-1">Tên đầy đủ</div>
                                        <div className="text-xs font-bold text-primary-800 leading-tight bg-white/50 px-3 py-2 rounded-lg border border-primary-100">
                                            {builderDescription.line1} <br/>
                                            {builderDescription.line2}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="applyAll" 
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    defaultChecked={true}
                                />
                                <label htmlFor="applyAll" className="text-xs font-medium text-slate-600 cursor-pointer">Gán cho tất cả câu hỏi cùng mã gốc</label>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowQuickAssign(false)} 
                                    className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                                >
                                    Huỷ bỏ
                                </button>
                                <button 
                                    disabled={isSavingAssign}
                                    onClick={() => {
                                        const applyAll = (document.getElementById('applyAll') as HTMLInputElement)?.checked;
                                        handleQuickAssign(isManualId ? quickAssignId : builderId, applyAll);
                                    }} 
                                    className="bg-primary-600 text-white px-8 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSavingAssign ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Xác nhận gán ID
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                <Database size={20} className="text-primary-600"/> {t('import_questions')}
                            </h3>
                            <button onClick={() => setIsAdding(false)}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
                        </div>
                        <div className="p-6 flex flex-col gap-4 flex-1">
                            <div className="flex gap-2">
                                <input type="file" id="q-upload" className="hidden" accept=".docx,.tex,.txt" multiple onChange={handleFileUpload} />
                                <button onClick={() => document.getElementById('q-upload')?.click()} disabled={isProcessing} className="bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2">
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />} {t('upload_files')}
                                </button>
                                <div className="text-[10px] text-slate-400 flex items-center italic">Hỗ trợ file .tex, .docx (ex, bt, vd)</div>
                            </div>
                            <textarea value={texInput} onChange={(e) => setTexInput(e.target.value)} className="w-full flex-1 font-mono text-xs p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none bg-slate-50" placeholder="Paste LaTeX code here (có chứa các môi trường ex, bt, vd)..." />
                            <div className="flex justify-end gap-2">
                                <button onClick={handleProcessImport} disabled={isValidating || !texInput.trim()} className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-700">
                                    {isValidating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} {t('validate_import') || 'Tiếp tục bước duyệt'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isReviewing && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Duyệt & Chỉnh sửa ID câu hỏi</h3>
                                <p className="text-xs text-slate-500">Màu đỏ: ID chưa đúng hoặc chưa có trong hệ thống mẫu ID.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setIsReviewing(false); setReviewQuestions([]); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Huỷ bỏ</button>
                                <button 
                                    onClick={handleConfirmImport} 
                                    disabled={isValidating}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center gap-2"
                                >
                                    {isValidating ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                                    Nhập {reviewQuestions.filter(q => (q as any).is_selected).length} câu hỏi vào kho
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-hidden flex">
                            {/* List of candidates */}
                            <div className="w-1/3 flex flex-col border-r border-slate-100">
                                <div className="p-2 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh sách ({reviewQuestions.length})</span>
                                    <button 
                                        onClick={() => {
                                            const allSelected = reviewQuestions.every(q => (q as any).is_selected);
                                            setReviewQuestions(reviewQuestions.map(q => ({ ...q, is_selected: !allSelected })));
                                        }}
                                        className="text-[10px] font-bold text-primary-600 hover:underline"
                                    >
                                        {reviewQuestions.every(q => (q as any).is_selected) ? 'Bỏ chọn hết' : 'Chọn hết'}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {reviewQuestions.map((q, idx) => {
                                        const idInfo = decodeID6(q.id_full || '');
                                        const isSelected = (q as any).is_selected;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => setSelectedQ(q as any)}
                                                className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedQ === q ? 'bg-primary-50 ring-1 ring-inset ring-primary-100' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected} 
                                                        onChange={(e) => {
                                                            const newArr = [...reviewQuestions];
                                                            (newArr[idx] as any).is_selected = e.target.checked;
                                                            setReviewQuestions(newArr);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${idInfo.valid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                                {q.id_full || 'UNKNOWN'}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400">Câu {idx + 1}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 truncate italic">
                                                            {q.raw_latex?.substring(0, 80).replace(/\\begin\{ex\}|\\end\{ex\}|\\loigiai\{.*?\}|/gi, '').trim()}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Detail / Editor */}
                            <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0 overflow-hidden">
                                {selectedQ && reviewQuestions.includes(selectedQ as any) ? (
                                    <>
                                        <div className="p-4 bg-white border-b border-slate-200">
                                            <div className="flex gap-4 items-end max-w-2xl">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Chỉnh sửa ID cho câu hỏi này</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            value={selectedQ.id_full || ''} 
                                                            onChange={(e) => handleUpdateReviewId(reviewQuestions.indexOf(selectedQ as any), e.target.value)}
                                                            className="flex-1 border border-slate-200 p-2 rounded-lg font-mono text-base outline-none focus:ring-2 ring-primary-500 shadow-sm"
                                                            placeholder="Nhập ID (VD: 2D1H1-1)"
                                                        />
                                                        <button 
                                                            onClick={handleOpenQuickAssign}
                                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center gap-2 shrink-0"
                                                        >
                                                            <Tag size={14}/> ID Builder
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {detailedInfo && (
                                                <div className="mt-3 p-3 rounded-xl bg-primary-50/50 border border-primary-100 text-[10px] font-medium text-primary-800">
                                                    <div className="flex gap-2 items-center mb-1">
                                                        <Info size={12} className="text-primary-400"/>
                                                        <span className="font-bold">Mô phỏng giải mã ID:</span>
                                                    </div>
                                                    {detailedInfo.valid ? (
                                                        <div>{detailedInfo.line1} | {detailedInfo.line2}</div>
                                                    ) : (
                                                        <div className="text-red-500 font-bold italic">Mã ID6 này chưa đúng định dạng hoặc không có trong danh mục hệ thống.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                                                <pre className="whitespace-pre-wrap font-mono text-xs">{selectedQ.raw_latex?.replace(/\\begin\{ex\}|\\end\{ex\}/gi, '') || ''}</pre>
                                            </div>
                                            
                                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                                                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã nguồn LaTeX</span>
                                                    <button 
                                                        onClick={() => {
                                                            const newContent = prompt("Chỉnh sửa mã LaTeX:", selectedQ.raw_latex);
                                                            if (newContent !== null) {
                                                                const idx = reviewQuestions.indexOf(selectedQ as any);
                                                                const newArr = [...reviewQuestions];
                                                                newArr[idx] = { ...newArr[idx], raw_latex: newContent };
                                                                setReviewQuestions(newArr);
                                                                setSelectedQ(newArr[idx] as any);
                                                            }
                                                        }}
                                                        className="text-[10px] text-primary-600 font-bold hover:underline"
                                                    >
                                                        Chỉnh sửa nguồn
                                                    </button>
                                                </div>
                                                <pre className="p-4 text-[11px] font-mono text-slate-600 bg-slate-50/50 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                    {selectedQ.raw_latex}
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                        <Eye size={64} className="mb-4 text-slate-100" />
                                        <p className="font-bold text-slate-400">Chọn câu hỏi bên trái để xem chi tiết</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showUserGuide && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 rotate-3">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Hướng Dẫn Sử Dụng</h2>
                                    <p className="text-xs text-slate-500 mt-1">Cách quản lý và chỉnh sửa ngân hàng câu hỏi</p>
                                </div>
                            </div>
                            <button onClick={() => setShowUserGuide(false)} className="text-slate-400 hover:text-red-500 transition-colors z-10 bg-white hover:bg-red-50 p-2 rounded-full border border-slate-200 shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-slate-50 flex-1 relative text-sm text-slate-700 space-y-6">
                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">1. Xem và lọc câu hỏi</h3>
                                <ul className="pl-5 list-disc space-y-1">
                                    <li>Sử dụng thanh công cụ phía trên để lọc câu hỏi theo Lớp, Môn, Chương, Bài, Dạng, Mức độ và Loại.</li>
                                    <li>Nhập thông tin vào ô &quot;Tìm...&quot; để tìm kiếm văn bản trong đoạn Latex.</li>
                                </ul>
                            </section>
                            
                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">2. Chỉnh sửa câu hỏi nhanh (Inline Edit)</h3>
                                <ul className="pl-5 list-disc space-y-1">
                                    <li>Nhấp đúp chuột vào cột <strong>Câu hỏi</strong> hoặc văn bản Latex của một câu hỏi bất kỳ trên bảng dữ liệu.</li>
                                    <li>Trình soạn thảo sẽ hiện ra để bạn có thể sửa trực tiếp đoạn mã Latex.</li>
                                    <li>Click nút <strong>Lưu</strong> sau khi chỉnh sửa xong để cập nhật vào hệ thống.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">3. Giải thích cột ID</h3>
                                <ul className="pl-5 list-disc space-y-1">
                                    <li>Cột <strong>ID</strong> hiển thị mã ID6 chuẩn hoá của câu hỏi (Ví dụ: `2D1H1-1`).</li>
                                    <li>Cột <strong>Diễn giải ID</strong> tách bạch mã thành các thành phần: Lớp, Môn, Chương, Bài, Dạng, Mức độ, và Loại câu hỏi.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">4. Nhập danh sách câu hỏi</h3>
                                <ul className="pl-5 list-disc space-y-1">
                                    <li>Click nút <strong>Nhập</strong>.</li>
                                    <li>Dán nội dung Latex (`.tex`) của tài liệu vào khung nhập. Hệ thống sẽ tự động bóc tách các câu hỏi và các ID liên quan.</li>
                                    <li>Chọn <strong>Lưu lên Data Server</strong> để lưu các câu hỏi phân tách thành công.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
