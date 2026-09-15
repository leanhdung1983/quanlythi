
// ... existing imports ...
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import { ID6Metadata, Chapter, Unit, Question } from '../types';
import { UploadCloud, Tag, CheckCircle2, Save, FileText, Database, Loader2, AlertTriangle, PenTool, Layers, FolderOpen, CopyCheck, X, ClipboardPaste, ArrowLeft, ArrowRight as ArrowRightIcon, FileCheck, Settings2, RefreshCw, Filter, Info, Sparkles } from 'lucide-react';
import { isValidID6, normalizeID } from '../utils/id6Helper';
import { detectQuestionTypeFromLatex } from '../services/parser';
import { useLanguageStore } from '../services/languageStore';
import { useAuthStore } from '../services/authStore';
import { validateAndTagQuestion } from '../services/aiService';

// --- TYPES ---
interface WorkItem {
    id: number;
    originalId: string;
    assignedId: string;
    content: string;
    startIndex: number;
    endIndex: number;
    // For Database items:
    dbId?: number; 
    hasChanged?: boolean;
    issueCodes?: string[];
    suggestedId?: string;
    updatedAt?: string;
}

interface LoadedFile {
    uniqueId: string;
    name: string;
    handle: FileSystemFileHandle | null; 
    originalContent: string;
    workItems: WorkItem[];
    isDirty: boolean;
    isDbSource?: boolean;
}

// --- MAIN COMPONENT ---
export const IdAssigner: React.FC = () => {
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    
    // --- STATE: REFERENCE DATA ---
    const [metadata, setMetadata] = useState<ID6Metadata[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    
    // --- STATE: FILES & WORKSPACE ---
    const [files, setFiles] = useState<LoadedFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
    const [sidebarMode, setSidebarMode] = useState<'FILES' | 'QUESTIONS'>('FILES');

    // --- STATE: MODALS & UI ---
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualText, setManualText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [isSavingDb, setIsSavingDb] = useState(false);
    
    // --- STATE: DB LOAD MODAL ---
    const [showDbLoadModal, setShowDbLoadModal] = useState(false);
    const [dbLoadType, setDbLoadType] = useState<'UNASSIGNED' | 'REVIEW' | 'SEARCH'>('UNASSIGNED');
    const [dbSearchTerm, setDbSearchTerm] = useState('');
    
    // --- STATE: ID BUILDER FORM ---
    const [selClass, setSelClass] = useState(2);
    const [selSubject, setSelSubject] = useState('D');
    const [selChapter, setSelChapter] = useState(1);
    const [selLevel, setSelLevel] = useState('H');
    const [selUnit, setSelUnit] = useState(1);
    const [selCount, setSelCount] = useState(1);
    const [manualCount, setManualCount] = useState(false);
    const [showMetadataCatalog, setShowMetadataCatalog] = useState(false);
    const [metadataSearch, setMetadataSearch] = useState('');
    
    // --- STATE: AI VALIDATION ---
    const [aiResult, setAiResult] = useState<{ isValid: boolean, reason: string, suggestedId?: string, confidence?: number, alternatives?: string[], competencies?: string[] } | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    
    const fileInputRef = useRef(null);

    const isAdminOrTeacher = useMemo(() => {
        return user?.role === 'ADMIN' || user?.role === 'TEACHER';
    }, [user]);

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        const loadRefs = async () => {
            try {
                const [m, c, u] = await Promise.all([
                    apiService.fetchMetadata(),
                    apiService.fetchChapters(),
                    apiService.fetchUnits()
                ]);
                
                const processed = (m || []).map((item: ID6Metadata) => {
                    let id_class = item.id_class !== undefined ? Number(item.id_class) : undefined;
                    let id_subject = item.id_subject;
                    let id_chapter = item.id_chapter !== undefined ? Number(item.id_chapter) : undefined;
                    let id_unit = item.id_unit !== undefined ? Number(item.id_unit) : undefined;
                    let id_count = item.id_count !== undefined ? Number(item.id_count) : undefined;

                    // Always try to parse from id_full to be sure
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
                        const id_level = match[4].toUpperCase();

                        return {
                            ...item,
                            id_full: normalizeID(item.id_full),
                            id_class,
                            id_subject,
                            id_chapter,
                            id_unit,
                            id_count,
                            id_level
                        };
                    } else if (id_class !== undefined) {
                        // Fallback normalization if regex fails but id_class exists
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
                        id_count,
                        id_level: item.id_level || 'H'
                    };
                });

                setMetadata(processed);
                setChapters((c || []).map((chap: Chapter) => ({
                    ...chap,
                    id_class: chap.id_class === 10 ? 0 : chap.id_class === 11 ? 1 : chap.id_class === 12 ? 2 : chap.id_class,
                    id_subject: chap.id_subject?.toUpperCase()
                })));
                setUnits(u || []);
            } catch (e) {
                console.error("Failed to load reference data", e);
            }
        };
        loadRefs();
    }, []);

    // --- COMPUTED: ACTIVE FILE & ITEM ---
    const activeFile = useMemo(() => files.find(f => f.uniqueId === activeFileId), [files, activeFileId]);
    
    const currentItem = useMemo(() => 
        activeFile?.workItems.find(i => i.id === selectedQuestionId), 
    [activeFile, selectedQuestionId]);

    // --- EFFECT: SYNC BUILDER WITH CURRENT ITEM ---
    useEffect(() => {
        const idToParse = currentItem?.assignedId || currentItem?.originalId;
        if (idToParse) {
            // Apply normalization to state (e.g., convert Y to N for the dropdowns)
            const normId = normalizeID(idToParse);
            const regex = /\[?(\d+)([A-Za-z])(\d+)([A-Za-z])(\d+)-(\d+)\]?/i;
            const match = normId.match(regex);
            
            if (match) {
                 let rawClass = parseInt(match[1]);
                 if (rawClass === 10) rawClass = 0;
                 else if (rawClass === 11) rawClass = 1;
                 else if (rawClass === 12) rawClass = 2;

                 setSelClass(rawClass);
                 setSelSubject(match[2].toUpperCase());
                 setSelChapter(parseInt(match[3]));
                 setSelLevel(match[4].toUpperCase()); 
                 setSelUnit(parseInt(match[5]));
                 setSelCount(parseInt(match[6]));
            }
        }
    }, [currentItem?.id, currentItem?.assignedId, currentItem?.originalId]); 

    // --- EFFECT: AUTO-VALIDATE SELECTIONS WHEN METADATA LOADS ---
    // This solves the issue where users had to select another item then back to trigger loading
    useEffect(() => {
        if (chapters.length > 0) {
            const availableChaps = chapters.filter(c => c.id_class === selClass && c.id_subject === selSubject);
            if (availableChaps.length > 0) {
                const exists = availableChaps.some(c => (c.chapter_number || c.id_chapter) === selChapter);
                if (!exists) {
                    const first = availableChaps[0];
                    setSelChapter(first.chapter_number || first.id_chapter || 1);
                }
            }
        }
    }, [chapters, selClass, selSubject, selChapter]);

    useEffect(() => {
        if (units.length > 0 && chapters.length > 0) {
            const currentChap = chapters.find(c => 
                c.id_class === selClass && 
                c.id_subject === selSubject && 
                (c.chapter_number || c.id_chapter) === selChapter
            );
            if (currentChap) {
                const availableU = units.filter(u => u.chapter_id === currentChap.id);
                if (availableU.length > 0) {
                    const exists = availableU.some(u => (u.unit_number || u.id_unit) === selUnit);
                    if (!exists) {
                        const first = availableU[0];
                        setSelUnit(first.unit_number || first.id_unit || 1);
                    }
                }
            }
        }
    }, [units, chapters, selClass, selSubject, selChapter, selUnit]);

    // --- LOGIC: PARSING & INJECTING ---
    const injectId = (fullLatex: string, newId: string) => {
        let content = fullLatex;

        // 1. Normalize environments
        content = content.replace(/\\begin\{(bt|vd|cau|bai|tuluan|tl)\}/gi, '\\begin{ex}');
        content = content.replace(/\\end\{(bt|vd|cau|bai|tuluan|tl)\}/gi, '\\end{ex}');

        const idToInsert = (newId && !newId.includes('?')) ? newId : '?????-?';
        // Always standard ID format: %[ID]
        const newTag = `%[${idToInsert}]`;

        // 2. AGGRESSIVE CLEANUP
        // Remove ALL variants: %[...], $[...], [...] including legacy chars
        const idPattern = `\\d+\\s*[a-zA-Z]\\s*\\d+\\s*[a-zA-Z]\\s*\\d+\\s*-\\s*\\d+`;
        const placeholderPattern = `[\\?]+(?:-[\\?]+)?`; 
        
        // Remove standalone tags
        const cleanupRegex = new RegExp(`\\s*([%\\$])?\\s*\\[\\s*(?:${idPattern}|${placeholderPattern})\\s*\\]`, 'gi');
        content = content.replace(cleanupRegex, '');

        // Remove from \begin{ex}[...]
        content = content.replace(new RegExp(`(\\\\begin\\{ex\\})\\s*\\[\\s*(?:${idPattern}|${placeholderPattern})\\s*\\]`, 'gi'), '$1');

        // 3. INJECT NEW TAG
        if (/\\begin\{ex\}/i.test(content)) {
            // Remove any potential double % tags if B failed or overlapped
            content = content.replace(/(\\begin\{ex\})\s*%\[.*?\]/gi, '$1');
            // Inject strictly as \begin{ex}%[ID] (compact)
            return content.replace(/(\\begin\{ex\})/i, `$1${newTag}`);
        } else {
            return `${newTag}\n${content.trim()}`;
        }
    };

    const parseContentToItems = (text: string): WorkItem[] => {
        const regex = /(\\begin\{(ex|bt|vd|cau|bai|tuluan|tl)\}[\s\S]*?\\end\{\2\})/gi;
        let match;
        const items: WorkItem[] = [];
        let idx = 0;

        while ((match = regex.exec(text)) !== null) {
            let fullContent = match[0];
            let endIndex = match.index + fullContent.length;

            const textAfter = text.substring(endIndex);
            const envMatch = textAfter.match(/^\s*\\begin\{loigiai\}[\s\S]*?\\end\{loigiai\}/i);
            if (envMatch) {
                fullContent += envMatch[0];
                endIndex += envMatch[0].length;
            } else {
                const cmdMatch = textAfter.match(/^\s*\\loigiai\s*\{/i);
                if (cmdMatch) {
                    let braceCount = 0;
                    let i = cmdMatch[0].length;
                    let foundEnd = false;
                    for (; i < textAfter.length; i++) {
                        if (textAfter[i] === '{') braceCount++;
                        else if (textAfter[i] === '}') {
                            if (braceCount === 0) {
                                foundEnd = true;
                                i++; 
                                break;
                            }
                            braceCount--;
                        }
                    }
                    if (foundEnd) {
                        const loigiaiContent = textAfter.substring(0, i);
                        fullContent += loigiaiContent;
                        endIndex += loigiaiContent.length;
                    }
                }
            }
            
            if (fullContent.match(/\\begin\{(bt|vd|cau|bai|tuluan|tl)\}/i)) {
                fullContent = fullContent.replace(/\\begin\{(bt|vd|cau|bai|tuluan|tl)\}/gi, '\\begin{ex}');
                fullContent = fullContent.replace(/\\end\{(bt|vd|cau|bai|tuluan|tl)\}/gi, '\\end{ex}');
            }

            // ID extraction - Relaxed to capture Legacy IDs (Y, B, K)
            const idStrictPatternSource = `(\\d+)\\s*([a-zA-Z])\\s*(\\d+)\\s*([a-zA-Z])\\s*(\\d+)\\s*-\\s*(\\d+)`; 
            
            let foundId = '';

            const commentMatch = fullContent.match(new RegExp(`%\\[\\s*${idStrictPatternSource}\\s*\\]`, 'i'));
            const dollarMatch = fullContent.match(new RegExp(`\\$\\[\\s*${idStrictPatternSource}\\s*\\]`, 'i'));
            const standardMatch = fullContent.substring(0, 200).match(new RegExp(`(\\\\begin\\{.*?\\})\\s*\\[\\s*${idStrictPatternSource}\\s*\\]`, 'i'));

            if (commentMatch) {
                foundId = commentMatch[0].replace(/^%\[|\]$/g, '').trim();
            } else if (dollarMatch) {
                foundId = dollarMatch[0].replace(/^\$\[|\]$/g, '').trim();
            } else if (standardMatch) {
                const idPart = fullContent.substring(0, 200).match(new RegExp(`\\[\\s*${idStrictPatternSource}\\s*\\]`, 'i'));
                if(idPart) foundId = idPart[0].replace(/^\[|\]$/g, '').trim();
            }

            if (foundId) foundId = foundId.toUpperCase().replace(/\s+/g, '');
            
            const isPlaceholder = !foundId || foundId.includes('?');
            
            // AUTOMATICALLY NORMALIZE LEGACY IDs HERE (Y->N, B->H...)
            const finalId = isPlaceholder ? '?????-?' : normalizeID(foundId);
            
            items.push({
                id: idx++,
                originalId: foundId,  // Keep raw found ID
                assignedId: finalId,  // Set normalized ID as current assignment
                content: fullContent,
                startIndex: match.index,
                // Include a trailing solution block in the replaced source range.
                // Using match[0].length here duplicated \loigiai every time the file was saved.
                endIndex
            });
        }
        return items;
    };

    // ... (createLoadedFile, handleLoadFromDB, handleSaveDbChanges same as before) ...
    const createLoadedFile = async (fileObj: File | FileSystemFileHandle): Promise<LoadedFile> => {
        let text = '';
        let name = '';
        let handle: FileSystemFileHandle | null = null;

        try {
            if ('kind' in fileObj && fileObj.kind === 'file') {
                const f = await fileObj.getFile();
                text = await f.text();
                name = f.name;
                handle = fileObj;
            } else if (fileObj instanceof File) {
                text = await fileObj.text();
                name = fileObj.name;
            }
        } catch (e) {
            console.error("Error reading file", e);
            name = "Unknown File";
        }

        const items = parseContentToItems(text);
        return {
            uniqueId: Math.random().toString(36).substring(2, 9),
            name,
            handle,
            originalContent: text,
            workItems: items,
            isDirty: false
        };
    };

    const handleLoadFromDB = async () => {
        setIsProcessing(true);
        setShowDbLoadModal(false);
        try {
            let questions: any[] = [];
            if (dbLoadType === 'REVIEW') {
                const res = await apiService.fetchQuestionReview(200);
                questions = res.data || [];
            } else {
                const params: Record<string, string | number | boolean> = { limit: 200 };
                if (dbLoadType === 'UNASSIGNED') params.unclassified = true;
                if (dbLoadType === 'SEARCH' && dbSearchTerm) params.search = dbSearchTerm;
                const res = await apiService.fetchQuestions(params);
                questions = res.data as Question[];
            }

            if (!questions || questions.length === 0) {
                alert("Không tìm thấy câu hỏi nào phù hợp.");
                return;
            }

            const items: WorkItem[] = questions.map((q, idx) => ({
                id: idx,
                originalId: q.id_full || q.legacy_full_id || 'UNKNOWN',
                assignedId: q.suggestedId || (q.id_full || q.legacy_full_id ? normalizeID(q.id_full || q.legacy_full_id) : '?????-?'),
                content: q.raw_latex || q.content_latex,
                startIndex: 0, 
                endIndex: 0,
                dbId: q.id,
                issueCodes: q.issues || [],
                suggestedId: q.suggestedId,
                updatedAt: q.updated_at,
                hasChanged: Boolean(q.suggestedId && q.suggestedId !== normalizeID(q.legacy_full_id || q.id_full || ''))
            }));

            const newFile: LoadedFile = {
                uniqueId: Math.random().toString(36).substring(2, 9),
                name: `DB_Load_${dbLoadType}_${questions.length}Qs`,
                handle: null,
                originalContent: "", // Not used for DB updates
                workItems: items,
                isDirty: false,
                isDbSource: true
            };

            setFiles(prev => [...prev, newFile]);
            setActiveFileId(newFile.uniqueId);
            setSidebarMode('QUESTIONS');
            if (items.length > 0) setSelectedQuestionId(items[0].id);

        } catch (e: any) {
            alert("Lỗi tải từ DB: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveDbChanges = async (fileId: string) => {
        const file = files.find(f => f.uniqueId === fileId);
        if (!file || !file.isDbSource) return;

        const modifiedItems = file.workItems.filter(i => i.hasChanged && i.dbId);
        if (modifiedItems.length === 0) return alert("Không có thay đổi nào để lưu.");

        const validIdSet = new Set(metadata.map(item => item.id_full));
        const invalidItems = modifiedItems.filter(item => !isValidID6(item.assignedId) || !validIdSet.has(item.assignedId));
        if (invalidItems.length > 0) {
            return alert(`Có ${invalidItems.length} câu chưa có ID hợp lệ trong danh mục. Vui lòng hoàn tất trước khi cập nhật CSDL.`);
        }

        if (!confirm(`Xác nhận cập nhật ${modifiedItems.length} câu hỏi vào CSDL?`)) return;

        setIsSavingDb(true);
        try {
            const updates = modifiedItems.map(item => ({
                id: item.dbId!,
                id_full: item.assignedId,
                content_latex: injectId(item.content, item.assignedId),
                expected_updated_at: item.updatedAt,
                change_type: 'ID_REVIEW'
            }));
            await apiService.confirmQuestionReview(updates);

            alert("Đã cập nhật thành công vào CSDL!");
            
            const cleanItems = file.workItems.map(i => ({...i, originalId: i.assignedId, hasChanged: false}));
            setFiles(prev => prev.map(f => f.uniqueId === fileId ? { ...f, workItems: cleanItems, isDirty: false } : f));

        } catch {
            alert("Lỗi lưu CSDL");
        } finally {
            setIsSavingDb(false);
        }
    };

    const handleNormalizeDbSource = async () => {
        if (!activeFile?.isDbSource) return;
        const ids = activeFile.workItems.map(item => item.dbId).filter((id): id is number => Boolean(id));
        if (!ids.length) return;
        setIsProcessing(true);
        try {
            const result = await apiService.previewQuestionNormalization(ids);
            const changed = (result.data || []).filter((item: any) => item.changed);
            if (!changed.length) return alert('Mã nguồn đã đúng chuẩn, không có thay đổi an toàn nào cần áp dụng.');
            if (!confirm(`Tìm thấy ${changed.length} câu có thể chuẩn hóa an toàn. Áp dụng vào bản xem trước để bạn kiểm tra trước khi lưu?`)) return;
            const changedById = new Map(changed.map((item: any) => [Number(item.id), item]));
            setFiles(prev => prev.map(file => file.uniqueId !== activeFile.uniqueId ? file : {
                ...file,
                isDirty: true,
                workItems: file.workItems.map(item => {
                    const preview: any = item.dbId ? changedById.get(item.dbId) : null;
                    return preview ? { ...item, content: preview.after, assignedId: preview.id_full || item.assignedId, updatedAt: preview.updated_at, hasChanged: true } : item;
                })
            }));
            alert('Đã tạo bản xem trước. Hãy kiểm tra nội dung rồi nhấn “Cập nhật DB” để xác nhận.');
        } catch (e: any) {
            alert(`Không thể chuẩn hóa: ${e.message}`);
        } finally { setIsProcessing(false); }
    };

    // --- ACTIONS: FILES ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        
        setIsProcessing(true);
        setProcessingProgress(0);
        try {
            const filesArray = Array.from(fileList);
            const loadedFiles: LoadedFile[] = [];
            
            for (let i = 0; i < filesArray.length; i++) {
                const file = await createLoadedFile(filesArray[i]);
                loadedFiles.push(file);
                setProcessingProgress(Math.round(((i + 1) / filesArray.length) * 100));
            }

            setFiles(prev => [...prev, ...loadedFiles]);
            if (!activeFileId && loadedFiles.length > 0) {
                const first = loadedFiles[0];
                setActiveFileId(first.uniqueId);
                setSidebarMode('QUESTIONS');
                if(first.workItems.length > 0) setSelectedQuestionId(first.workItems[0].id);
            }
        } catch {
            alert("Lỗi đọc file.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
            e.target.value = '';
        }
    };

    const handleOpenFile = async () => {
        try {
            // @ts-ignore
            if (!window.showOpenFilePicker) throw new Error("FS API Not Supported");
            // @ts-ignore
            const handles = await window.showOpenFilePicker({
                types: [{ description: 'LaTeX Files', accept: { 'text/plain': ['.tex', '.txt'] } }],
                multiple: true 
            });
            
            if (handles.length > 0) {
                setIsProcessing(true);
                setProcessingProgress(0);
                const loadedFiles: LoadedFile[] = [];
                
                for (let i = 0; i < handles.length; i++) {
                    const file = await createLoadedFile(handles[i]);
                    loadedFiles.push(file);
                    setProcessingProgress(Math.round(((i + 1) / handles.length) * 100));
                }

                setFiles(prev => [...prev, ...loadedFiles]);
                if (!activeFileId && loadedFiles.length > 0) {
                    const first = loadedFiles[0];
                    setActiveFileId(first.uniqueId);
                    setSidebarMode('QUESTIONS');
                    if(first.workItems.length > 0) setSelectedQuestionId(first.workItems[0].id);
                }
                setIsProcessing(false);
                setProcessingProgress(0);
            }
        } catch (e: any) {
            if (e.message !== "FS API Not Supported" && e.name !== 'AbortError') console.error(e);
            else fileInputRef.current?.click();
        }
    };

    const handleSaveFile = async (fileId: string) => {
        const file = files.find(f => f.uniqueId === fileId);
        if (!file) return;
        
        if (file.isDbSource) {
            return handleSaveDbChanges(fileId);
        }

        try {
            let result = '';
            let cursor = 0;
            const sorted = [...file.workItems].sort((a,b) => a.startIndex - b.startIndex);
            
            sorted.forEach(item => {
                result += file.originalContent.slice(cursor, item.startIndex);
                result += injectId(item.content, item.assignedId);
                cursor = item.endIndex;
            });
            result += file.originalContent.slice(cursor);

            if (file.handle) {
                const writable = await file.handle.createWritable();
                await writable.write(result);
                await writable.close();
            } else {
                const blob = new Blob([result], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); 
                a.href = url; 
                a.download = `updated_${file.name}`; 
                a.click();
                URL.revokeObjectURL(url);
            }
            setFiles(prev => prev.map(f => f.uniqueId === fileId ? { ...f, isDirty: false } : f));
        } catch (e) {
            alert("Lỗi khi lưu file: " + e);
        }
    };

    const handleSaveToBank = async () => {
        if (!user) return alert("Vui lòng đăng nhập để lưu vào CSDL.");
        if (!activeFile) return alert("Chưa chọn file nào.");
        if (activeFile.isDbSource) return alert("File này đã được tải từ DB.");

        const validIdSet = new Set(metadata.map(item => item.id_full));
        const validItems = activeFile.workItems.filter(item => isValidID6(item.assignedId) && validIdSet.has(item.assignedId));
        const invalidCount = activeFile.workItems.length - validItems.length;

        if (validItems.length === 0) return alert("Không tìm thấy câu hỏi nào có ID hợp lệ.");
        if (invalidCount > 0) return alert(`Còn ${invalidCount} câu có ID sai hoặc không tồn tại trong danh mục. Hãy hoàn tất toàn bộ trước khi lưu để tránh nhập thiếu dữ liệu.`);
        if(!confirm(`Lưu ${validItems.length} câu hỏi vào CSDL?`)) return;

        setIsSavingDb(true);
        try {
            const payload = validItems.map(item => ({
                id_full: item.assignedId,
                raw_latex: injectId(item.content, item.assignedId),
                q_type: detectQuestionTypeFromLatex(item.content)
            }));
            await apiService.importQuestions(payload, user.id);
            alert(`✅ Đã thêm ${validItems.length} câu hỏi vào CSDL!`);
        } catch (e: any) {
            alert("❌ Lỗi: " + e.message);
        } finally {
            setIsSavingDb(false);
        }
    };

    const handleProcessManualInput = () => {
        if (!manualText.trim()) return;
        
        const items = parseContentToItems(manualText);
        if (items.length === 0) {
            alert("Không tìm thấy câu hỏi (ex, bt, vd) trong văn bản.");
            return;
        }

        const newFile: LoadedFile = {
            uniqueId: Math.random().toString(36).substring(2, 9),
            name: `Manual_Text_${new Date().toLocaleTimeString().replace(/:/g,'-')}`,
            handle: null,
            originalContent: manualText,
            workItems: items,
            isDirty: true
        };

        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.uniqueId);
        setSidebarMode('QUESTIONS');
        if(items.length > 0) setSelectedQuestionId(items[0].id);
        
        setManualText('');
    };

    // --- ACTIONS: EDITING ---
    const updateActiveFileItems = useCallback((newItems: WorkItem[]) => {
        if (!activeFileId) return;
        setFiles(prev => prev.map(f => 
            f.uniqueId === activeFileId ? { ...f, workItems: newItems, isDirty: true } : f
        ));
    }, [activeFileId]);

    const updateAssignedId = useCallback((newId: string) => {
        if (!currentItem || !activeFile) return;
        const normalized = normalizeID(newId);
        
        const newItems: WorkItem[] = activeFile.workItems.map(item => 
            item.id === currentItem.id 
                ? { ...item, assignedId: normalized, hasChanged: true } 
                : item
        );
        
        updateActiveFileItems(newItems);
    }, [currentItem, activeFile, updateActiveFileItems]);

    // --- NEW ACTION: BATCH APPLY BY ORIGINAL ID ---
    const handleBatchApply = () => {
        if (!currentItem || !activeFile || !currentItem.originalId) return;
        const targetOrigin = currentItem.originalId;
        const targetNew = currentItem.assignedId;

        const others = activeFile.workItems.filter(i => i.originalId === targetOrigin && i.id !== currentItem.id);
        if (others.length === 0) return;

        if(!confirm(`Xác nhận đồng bộ ID "${targetNew}" cho ${others.length} câu hỏi khác có cùng mã gốc "${targetOrigin}"?`)) return;

        const newItems = activeFile.workItems.map(item => {
            if (item.originalId === targetOrigin) {
                return { ...item, assignedId: targetNew, hasChanged: true };
            }
            return item;
        });
        updateActiveFileItems(newItems);
    };

    const handleBuilderChange = (field: string, value: string | number) => {
        let nClass = selClass, nSub = selSubject, nChap = selChapter, nLvl = selLevel, nUnit = selUnit, nCount = selCount;
        
        if (field === 'class') {
            setSelClass(value as number);
            nClass = value as number;
            // Find first chapter for this new class/subject
            const firstChap = chapters.find(c => c.id_class === value && c.id_subject === nSub);
            if (firstChap) {
                const chapNum = firstChap.chapter_number || firstChap.id_chapter || 1;
                setSelChapter(chapNum);
                nChap = chapNum;
                // Find first unit for this chapter
                const firstUnit = units.find(u => u.chapter_id === firstChap.id);
                if (firstUnit) {
                    const unitNum = firstUnit.unit_number || firstUnit.id_unit || 1;
                    setSelUnit(unitNum);
                    nUnit = unitNum;
                } else {
                    setSelUnit(1);
                    nUnit = 1;
                }
            } else {
                setSelChapter(1);
                nChap = 1;
                setSelUnit(1);
                nUnit = 1;
            }
        }
        
        if (field === 'subject') {
            setSelSubject(value as string);
            nSub = value as string;
            // Find first chapter for this new class/subject
            const firstChap = chapters.find(c => c.id_class === nClass && c.id_subject === value);
            if (firstChap) {
                const chapNum = firstChap.chapter_number || firstChap.id_chapter || 1;
                setSelChapter(chapNum);
                nChap = chapNum;
                // Find first unit for this chapter
                const firstUnit = units.find(u => u.chapter_id === firstChap.id);
                if (firstUnit) {
                    const unitNum = firstUnit.unit_number || firstUnit.id_unit || 1;
                    setSelUnit(unitNum);
                    nUnit = unitNum;
                } else {
                    setSelUnit(1);
                    nUnit = 1;
                }
            } else {
                setSelChapter(1);
                nChap = 1;
                setSelUnit(1);
                nUnit = 1;
            }
        }
        
        if (field === 'chapter') {
            setSelChapter(value as number);
            nChap = value as number;
            // Find first unit for this chapter
            const currentChap = chapters.find(c => c.id_class === nClass && c.id_subject === nSub && (c.chapter_number || c.id_chapter) === value);
            if (currentChap) {
                const firstUnit = units.find(u => u.chapter_id === currentChap.id);
                if (firstUnit) {
                    const unitNum = firstUnit.unit_number || firstUnit.id_unit || 1;
                    setSelUnit(unitNum);
                    nUnit = unitNum;
                } else {
                    setSelUnit(1);
                    nUnit = 1;
                }
            } else {
                setSelUnit(1);
                nUnit = 1;
            }
        }
        
        if (field === 'level') { setSelLevel(value as string); nLvl = value as string; }
        if (field === 'unit') { setSelUnit(value as number); nUnit = value as number; }
        if (field === 'count') { setSelCount(value as number); nCount = value as number; }
        
        // Auto-select first available count if changing other fields and available metadata exists
        if (field !== 'count' && !manualCount) {
            const firstAvailable = metadata.find(m => 
                m.id_class === nClass && 
                m.id_subject === nSub && 
                m.id_chapter === nChap && 
                m.id_unit === nUnit &&
                m.id_level === nLvl
            );
            if (firstAvailable && firstAvailable.id_count !== undefined) {
                setSelCount(firstAvailable.id_count);
                nCount = firstAvailable.id_count;
            }
        }

        const newId = `${nClass}${nSub}${nChap}${nLvl}${nUnit}-${nCount}`;
        updateAssignedId(newId);
    };

    const selectNext = () => {
        if (!activeFile || selectedQuestionId === null) return;
        const sorted = [...activeFile.workItems].sort((a,b) => a.id - b.id);
        const currIndex = sorted.findIndex(i => i.id === selectedQuestionId);
        if (currIndex < sorted.length - 1) setSelectedQuestionId(sorted[currIndex + 1].id);
    };

    const selectPrev = () => {
        if (!activeFile || selectedQuestionId === null) return;
        const sorted = [...activeFile.workItems].sort((a,b) => a.id - b.id);
        const currIndex = sorted.findIndex(i => i.id === selectedQuestionId);
        if (currIndex > 0) setSelectedQuestionId(sorted[currIndex - 1].id);
    };

    const handleAIValidate = async () => {
        if (!currentItem) return;
        setIsValidating(true);
        setAiResult(null);
        try {
            const result = await validateAndTagQuestion(currentItem.content, currentItem.assignedId);
            setAiResult(result);
            
            // If AI suggests competencies, we could potentially auto-tag them here or just show them
            if (result && result.competencies && result.competencies.length > 0) {
                // For now, we just show them in the UI
            }
        } catch (e) {
            console.error("AI Validation error", e);
        } finally {
            setIsValidating(false);
        }
    };

    const applyAISuggestion = () => {
        if (aiResult && aiResult.suggestedId) {
            updateAssignedId(aiResult.suggestedId);
            setAiResult(null);
        }
    };

    // --- DERIVED UI DATA ---
    const availableChapters = useMemo(() => {
        return chapters.filter(c => c.id_class === selClass && c.id_subject === selSubject);
    }, [chapters, selClass, selSubject]);

    const availableUnits = useMemo(() => {
        const currentChap = availableChapters.find(c => (c.chapter_number || c.id_chapter) === selChapter);
        if (!currentChap) return [];
        return units.filter(u => u.chapter_id === currentChap.id);
    }, [units, availableChapters, selChapter]);

    const availableTypes = useMemo(() => {
        const rawTypes = metadata.filter(m => 
            m.id_class === selClass && 
            m.id_subject === selSubject && 
            m.id_chapter === selChapter && 
            m.id_unit === selUnit &&
            m.id_level === selLevel
        );

        const unique = new Map<number, ID6Metadata>();
        rawTypes.forEach(t => {
            const count = t.id_count || 0;
            if (!unique.has(count)) {
                unique.set(count, t);
            }
        });

        return Array.from(unique.values()).sort((a,b) => (a.id_count || 0) - (b.id_count || 0));
    }, [metadata, selClass, selSubject, selChapter, selUnit, selLevel]); 
    
    // --- EFFECT: AUTO-SELECT FIRST TYPE WHEN LIST CHANGES ---
    useEffect(() => {
        if (!manualCount && availableTypes.length > 0) {
            // Find if current selCount is in availableTypes
            const currentMeta = availableTypes.find(t => t.id_count === selCount);
            if (!currentMeta) {
                const firstCount = availableTypes[0].id_count || 1;
                setSelCount(firstCount);
                
                // Update the assigned ID as well
                const newId = `${selClass}${selSubject}${selChapter}${selLevel}${selUnit}-${firstCount}`;
                updateAssignedId(newId);
            }
        }
    }, [availableTypes, manualCount, selClass, selSubject, selChapter, selLevel, selUnit, selCount, updateAssignedId]);

    const selectedTypeDescription = useMemo(() => {
        const found = availableTypes.find(t => t.id_count === selCount);
        return found ? found.description : '';
    }, [availableTypes, selCount]);

    // Sort logic for sidebar
    const sortedSidebarItems = useMemo(() => {
        if (!activeFile) return [];
        const validIdSet = new Set(metadata.map(m => m.id_full));
        const itemsCopy = [...activeFile.workItems];
        
        const isPending = (item: WorkItem) => !isValidID6(item.assignedId) || !validIdSet.has(item.assignedId);
        const pending = itemsCopy.filter(i => isPending(i));
        const completed = itemsCopy.filter(i => !isPending(i));

        return [...pending.sort((a,b)=>a.id-b.id), ...completed.sort((a,b)=>a.id-b.id)];
    }, [activeFile, metadata]);

    // Derived Count for Batch Button
    const similarCount = useMemo(() => {
        if (!activeFile || !currentItem || !currentItem.originalId) return 0;
        return activeFile.workItems.filter(i => i.originalId === currentItem.originalId && i.id !== currentItem.id).length;
    }, [activeFile, currentItem]);

    // --- RENDER ---
    return (
        <div className="h-full flex flex-col space-y-3 min-h-[600px] overflow-auto lg:overflow-hidden">
             {/* 1. Header Toolbar */}
             <div className="flex justify-between items-center shrink-0 px-1">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Tag className="text-indigo-600"/> {t('assign_title')}
                    </h1>
                    <p className="text-xs text-slate-500 hidden md:block">Công cụ gán mã ID tự động cho tài liệu LaTeX & CSDL.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowManualModal(true)} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2">
                        <ClipboardPaste size={16}/> Dán Text
                    </button>
                    <button onClick={() => setShowDbLoadModal(true)} className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 shadow-sm flex items-center gap-2">
                        <Database size={16}/> Tải từ CSDL
                    </button>
                    <button onClick={handleOpenFile} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2">
                        <FolderOpen size={16}/> Mở File
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".tex,.txt" multiple onChange={handleFileUpload}/>
                    
                    {files.length > 0 && activeFile && !activeFile.isDbSource && (
                        <>
                            <div className="h-8 w-px bg-slate-200 mx-1"></div>
                            <button onClick={handleSaveToBank} disabled={isSavingDb} className="px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all">
                                {isSavingDb ? <Loader2 size={16} className="animate-spin"/> : <Database size={16}/>} Lưu DB
                            </button>
                        </>
                    )}
                    {activeFile?.isDbSource && (
                        <button onClick={handleNormalizeDbSource} disabled={isProcessing || isSavingDb} className="px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
                            <Sparkles size={16}/> Chuẩn hóa mã nguồn
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Main Content Area */}
            {files.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 m-2">
                    <div className="text-center max-w-lg p-10 bg-white rounded-3xl shadow-xl border border-slate-100">
                         <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <UploadCloud size={40}/>
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 mb-2">Bắt đầu làm việc</h3>
                         <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                            Chọn file .tex từ máy tính, dán nội dung thủ công, hoặc tải câu hỏi trực tiếp từ CSDL để gán ID và chỉnh sửa.
                         </p>
                         <div className="flex gap-4 justify-center">
                             <button onClick={handleOpenFile} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-transform active:scale-95 flex items-center gap-2">
                                <FolderOpen size={18}/> Chọn File
                             </button>
                             <button onClick={() => setShowDbLoadModal(true)} className="bg-white text-indigo-700 border border-indigo-200 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 shadow-sm transition-transform active:scale-95 flex items-center gap-2">
                                <Database size={18}/> CSDL
                             </button>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 lg:overflow-hidden px-1 pb-1">
                    {/* LEFT SIDEBAR: File List or Question List */}
                    <div className="w-full lg:w-80 max-h-72 lg:max-h-none flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0 transition-all duration-300">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-100 bg-slate-50 p-1 gap-1">
                            <button 
                                onClick={() => setSidebarMode('FILES')} 
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${sidebarMode === 'FILES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Layers size={14}/> DS File ({files.length})
                            </button>
                            <button 
                                onClick={() => setSidebarMode('QUESTIONS')} 
                                disabled={!activeFile}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${sidebarMode === 'QUESTIONS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
                            >
                                <FileCheck size={14}/> Câu hỏi ({activeFile?.workItems.length || 0})
                            </button>
                        </div>

                        {/* Content List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                            {sidebarMode === 'FILES' ? (
                                <div className="p-2 space-y-2">
                                    {files.map(f => (
                                        <div key={f.uniqueId} 
                                            onClick={() => { setActiveFileId(f.uniqueId); setSidebarMode('QUESTIONS'); if(f.workItems.length>0) setSelectedQuestionId(f.workItems[0].id); }}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md group ${activeFileId === f.uniqueId ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className={`p-1.5 rounded-lg ${f.isDbSource ? 'bg-purple-100 text-purple-600' : f.isDirty ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {f.isDbSource ? <Database size={16}/> : <FileText size={16}/>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-xs text-slate-700 truncate" title={f.name}>{f.name}</div>
                                                        <div className="text-[10px] text-slate-400">{f.workItems.length} câu hỏi</div>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); if(confirm("Đóng file?")) setFiles(files.filter(x => x.uniqueId !== f.uniqueId)); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                    <X size={14}/>
                                                </button>
                                            </div>
                                            {f.isDirty && (
                                                <div className="mt-2 flex justify-end">
                                                    <button onClick={(e) => { e.stopPropagation(); handleSaveFile(f.uniqueId); }} className="text-[10px] bg-white border border-amber-200 text-amber-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-50 shadow-sm">
                                                        {isSavingDb ? <Loader2 className="animate-spin" size={10}/> : <Save size={10}/>} {f.isDbSource ? "Cập nhật DB" : "Lưu thay đổi"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {sortedSidebarItems.map(item => {
                                        const isPending = !isValidID6(item.assignedId) || !metadata.some(m => m.id_full === item.assignedId);
                                        const isSelected = selectedQuestionId === item.id;
                                        return (
                                            <div key={item.id} 
                                                onClick={() => setSelectedQuestionId(item.id)}
                                                className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-bold text-xs flex items-center gap-1.5 ${isPending ? 'text-amber-600' : 'text-green-600'}`}>
                                                        #{item.id + 1} {isPending ? <AlertTriangle size={10}/> : <CheckCircle2 size={10}/>}
                                                    </span>
                                                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${isPending ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                                        {item.assignedId}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 line-clamp-1 italic opacity-80">{item.content.substring(0, 50)}...</p>
                                            </div>
                                        );
                                    })}
                                    {sortedSidebarItems.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">Không có câu hỏi nào.</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CENTER: EDITOR & BUILDER */}
                    {activeFile && currentItem ? (
                        <div className="flex-1 flex flex-col gap-3 min-w-0">
                            {/* Editor Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10"></div>
                                
                                {/* Toolbar */}
                                <div className="p-3 border-b border-slate-100 bg-white flex flex-col gap-2 shrink-0">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="font-mono text-lg font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-2">
                                                <span className="text-slate-400 text-xs">%[</span>
                                                <input 
                                                    value={currentItem.assignedId} 
                                                    onChange={(e) => updateAssignedId(e.target.value)} 
                                                    className="bg-transparent border-none outline-none w-32 text-center text-indigo-700" 
                                                />
                                                <span className="text-slate-400 text-xs">]</span>
                                            </div>
                                            {currentItem.assignedId && metadata.some(item => item.id_full === currentItem.assignedId) && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                    <CheckCircle2 size={12}/> Valid
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={selectPrev} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30" disabled={!selectedQuestionId}><ArrowLeft size={18}/></button>
                                            <span className="text-xs font-bold text-slate-400">Câu {currentItem.id + 1}</span>
                                            <button onClick={selectNext} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowRightIcon size={18}/></button>
                                        </div>
                                    </div>
                                    {currentItem.issueCodes && currentItem.issueCodes.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentItem.issueCodes.map(code => (
                                                <span key={code} className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                    {({
                                                        ID_MISSING: 'Chưa có ID', ID_MALFORMED: 'Sai cú pháp', ID_LEGACY: 'ID chuẩn cũ',
                                                        ID_UNKNOWN: 'Không có trong mục lục', ID_SOURCE_MISMATCH: 'ID trong mã nguồn không khớp',
                                                        ID_NOT_IN_SOURCE: 'Mã nguồn thiếu ID', ID_UNIT_MISMATCH: 'Sai chương/bài',
                                                        ID_LEVEL_MISMATCH: 'Sai mức độ'
                                                    } as Record<string, string>)[code] || code}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Batch Apply Button */}
                                    {similarCount > 0 && (
                                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-1.5 rounded-lg">
                                            <span className="text-[10px] text-blue-600 font-medium">
                                                Tìm thấy <strong className="text-blue-800">{similarCount}</strong> câu hỏi khác có cùng mã gốc <code>{currentItem.originalId}</code>
                                            </span>
                                            <button 
                                                onClick={handleBatchApply}
                                                className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <CopyCheck size={12}/> Gán ID này cho tất cả
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 relative bg-slate-50/50">
                                    <textarea 
                                        className="absolute inset-0 w-full h-full p-6 font-mono text-sm leading-relaxed text-slate-700 bg-transparent resize-none outline-none focus:bg-white transition-colors"
                                        value={injectId(currentItem.content, currentItem.assignedId)}
                                        onChange={() => {}}
                                        readOnly
                                    />
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur rounded text-[10px] font-bold text-slate-400 border border-slate-200 pointer-events-none">
                                        Read-Only Preview
                                    </div>
                                </div>
                            </div>

                            {/* ID Builder Panel */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 shrink-0">
                                <div className="flex items-center gap-2 mb-3 text-indigo-600 border-b border-slate-100 pb-2">
                                    <Settings2 size={16}/>
                                    <span className="text-xs font-bold uppercase tracking-wider">Bộ tạo ID</span>
                                </div>
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Khối</label>
                                        <select value={selClass} onChange={e => handleBuilderChange('class', parseInt(e.target.value))} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700">
                                            {[6,7,8,9,0,1,2].map(g => (
                                                <option key={g} value={g}>{g===0?'Lớp 10':g===1?'Lớp 11':g===2?'Lớp 12':`Lớp ${g}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Môn</label>
                                        <select value={selSubject} onChange={e => handleBuilderChange('subject', e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700">
                                            <option value="D">Đại số</option>
                                            <option value="H">Hình học</option>
                                            <option value="C">Chuyên đề</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Chương</label>
                                        <select value={selChapter} onChange={e => handleBuilderChange('chapter', parseInt(e.target.value))} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700 truncate">
                                            {availableChapters.length > 0 ? availableChapters.map(c => (
                                                <option key={c.id} value={c.chapter_number || c.id_chapter}>
                                                    {`Chương ${c.chapter_number || c.id_chapter}. ${c.name || c.chapter_name || ''}`}
                                                </option>
                                            )) : <option value={1}>Chương 1</option>}
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bài</label>
                                        <select value={selUnit} onChange={e => handleBuilderChange('unit', parseInt(e.target.value))} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700 truncate">
                                            {availableUnits.length > 0 ? availableUnits.map(u => (
                                                <option key={u.id} value={u.unit_number || u.id_unit}>
                                                    {`Bài ${u.unit_number || u.id_unit}. ${u.name || u.unit_name || ''}`}
                                                </option>
                                            )) : <option value={1}>Bài 1</option>}
                                        </select>
                                    </div>
                                    <div className="col-span-9">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex justify-between items-center">
                                            <span className="flex items-center gap-1.5">
                                                Dạng (Type)
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setShowMetadataCatalog(true)} className="text-indigo-500 hover:underline text-[9px] font-normal cursor-pointer">
                                                    Tra cứu mục lục
                                                </button>
                                                <button onClick={() => setManualCount(!manualCount)} className="text-indigo-500 hover:underline text-[9px] font-normal cursor-pointer">
                                                    {manualCount ? 'Chọn từ danh sách' : 'Nhập tay'}
                                                </button>
                                            </div>
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                {manualCount ? (
                                                    <input type="number" min="1" value={selCount} onChange={e => handleBuilderChange('count', parseInt(e.target.value))} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"/>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <select 
                                                            value={selCount} 
                                                            onChange={e => handleBuilderChange('count', parseInt(e.target.value))} 
                                                            className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"
                                                        >
                                                            {availableTypes.length > 0 ? (
                                                                availableTypes.map(m => (
                                                                    <option key={m.id_full} value={m.id_count}>
                                                                        {`Dạng ${m.id_count}: ${m.description || 'Chưa có tên'}`}
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                <option value={selCount}>Dạng {selCount} (Tự định nghĩa)</option>
                                                            )}
                                                        </select>
                                                        {selectedTypeDescription && (
                                                            <div className="text-[11px] text-indigo-600 font-medium bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50 leading-relaxed">
                                                                <Info size={12} className="inline mr-1 mb-0.5" />
                                                                {selectedTypeDescription}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mức độ</label>
                                        <select value={selLevel} onChange={e => handleBuilderChange('level', e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700">
                                            <option value="N">Nhận biết (NB)</option>
                                            <option value="H">Thông hiểu (TH)</option>
                                            <option value="V">Vận dụng (VD)</option>
                                            <option value="C">Vận dụng cao (VDC)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {isAdminOrTeacher && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">AI Phân tích & Gắn thẻ</span>
                                            <button 
                                                onClick={handleAIValidate}
                                                disabled={isValidating}
                                                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                                            >
                                                {isValidating ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                                                Kiểm tra & Gắn thẻ AI
                                            </button>
                                        </div>
                                        
                                        {aiResult && (
                                            <div className={`p-3 rounded-xl border text-xs animate-in slide-in-from-top-2 ${aiResult.isValid ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                                                <div className="flex items-start gap-2 mb-2">
                                                    {aiResult.isValid ? <CheckCircle2 size={16} className="text-green-600 shrink-0"/> : <AlertTriangle size={16} className="text-amber-600 shrink-0"/>}
                                                    <div>
                                                        <p className="font-bold mb-1">{aiResult.isValid ? 'ID Hợp lệ' : 'ID Có thể chưa chính xác'}</p>
                                                        <p className="opacity-90">{aiResult.reason}</p>
                                                        {aiResult.confidence !== undefined && <p className="mt-1 font-bold">Độ tin cậy: {Math.round(aiResult.confidence * 100)}%</p>}
                                                    </div>
                                                </div>
                                                
                                                {!aiResult.isValid && aiResult.suggestedId && (
                                                    <div className="mt-2 p-2 bg-white/50 rounded-lg border border-amber-200 flex justify-between items-center">
                                                        <span>Đề xuất: <code className="font-bold">{aiResult.suggestedId}</code></span>
                                                        <button onClick={applyAISuggestion} className="bg-amber-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-amber-700">Áp dụng</button>
                                                    </div>
                                                )}
                                                {aiResult.alternatives && aiResult.alternatives.length > 0 && (
                                                    <p className="mt-2 text-[10px]">Phương án khác: {aiResult.alternatives.join(', ')}</p>
                                                )}
                                                
                                                {aiResult.competencies && aiResult.competencies.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="font-bold mb-1 text-[10px] uppercase opacity-60">Năng lực đề xuất:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {aiResult.competencies.map((c: string, idx: number) => (
                                                                <span key={idx} className="bg-white/60 px-2 py-0.5 rounded-full border border-slate-200 text-[9px] font-medium">{c}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-medium rounded-xl border border-dashed border-slate-300">
                            <PenTool size={48} className="opacity-20 mb-2"/>
                            <p>Chọn một câu hỏi để bắt đầu chỉnh sửa</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: MANUAL INPUT */}
            {showManualModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><ClipboardPaste size={20} className="text-indigo-600"/> Nhập Dữ liệu Thủ công</h3>
                            <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-0 flex-1 relative">
                            <textarea 
                                value={manualText} 
                                onChange={e => setManualText(e.target.value)} 
                                className="w-full h-full p-6 font-mono text-sm resize-none outline-none focus:bg-slate-50 transition-colors"
                                placeholder={`\\begin{ex}\nNội dung câu hỏi...\n\\end{ex}`}
                                autoFocus
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button onClick={() => setShowManualModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Huỷ bỏ</button>
                            <button onClick={() => { handleProcessManualInput(); setShowManualModal(false); }} disabled={!manualText.trim()} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                                Phân tích & Xử lý
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DB LOAD FILTER */}
            {showDbLoadModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 p-6">
                        <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                            <Database size={24} className="text-indigo-600"/> Tải từ CSDL
                        </h3>
                        
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${dbLoadType === 'UNASSIGNED' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`} onClick={() => setDbLoadType('UNASSIGNED')}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${dbLoadType === 'UNASSIGNED' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Tag size={18}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Cần gán mã ID mới</h4>
                                        <p className="text-xs text-slate-500">Tải các câu hỏi chưa có ID, ID cũ hoặc không đúng định dạng.</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${dbLoadType === 'REVIEW' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300'}`} onClick={() => setDbLoadType('REVIEW')}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${dbLoadType === 'REVIEW' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <AlertTriangle size={18}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Rà soát ID đang có vấn đề</h4>
                                        <p className="text-xs text-slate-500">Tìm ID sai chuẩn, không khớp mục lục, mã nguồn hoặc dữ liệu chương/bài.</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${dbLoadType === 'SEARCH' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`} onClick={() => setDbLoadType('SEARCH')}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-full ${dbLoadType === 'SEARCH' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Filter size={18}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Tìm kiếm nâng cao</h4>
                                        <p className="text-xs text-slate-500">Lọc theo từ khoá hoặc mã ID.</p>
                                    </div>
                                </div>
                                {dbLoadType === 'SEARCH' && (
                                    <input 
                                        autoFocus 
                                        className="w-full border border-indigo-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                                        placeholder="Nhập mã ID, nội dung..."
                                        value={dbSearchTerm}
                                        onChange={e => setDbSearchTerm(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setShowDbLoadModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Huỷ</button>
                            <button onClick={handleLoadFromDB} disabled={isProcessing} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>} Tải Dữ Liệu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-xl">
                                {processingProgress}%
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Đang xử lý file...</h3>
                            <p className="text-sm text-slate-500 mt-1">Vui lòng đợi trong giây lát, hệ thống đang phân tích cấu trúc câu hỏi.</p>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                                style={{ width: `${processingProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Metadata Catalog Modal */}
            {showMetadataCatalog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Tag className="text-indigo-600" size={20}/>
                                    Tra cứu Mục lục Dạng (ID6 Metadata)
                                </h3>
                                <p className="text-xs text-slate-500">Tìm kiếm dạng bài theo tên hoặc từ khóa để tự động điền mã ID. Chỉ hiển thị cho môn {selSubject === 'D' ? 'Đại số' : 'Hình học'}.</p>
                            </div>
                            <button onClick={() => setShowMetadataCatalog(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <div className="p-4 bg-white border-b border-slate-50 flex gap-4 items-center">
                            <div className="relative flex-1">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 transition-all font-medium" 
                                    placeholder="Tìm kiếm theo mã ID, tên chương, tên bài hoặc mô tả dạng..." 
                                    value={metadataSearch}
                                    onChange={e => setMetadataSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2 text-xs font-bold shrink-0">
                                <span className={`px-2 py-1 rounded-full ${selClass === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>Lớp 10</span>
                                <span className={`px-2 py-1 rounded-full ${selClass === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>Lớp 11</span>
                                <span className={`px-2 py-1 rounded-full ${selClass === 2 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>Lớp 12</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20">
                            <div className="grid grid-cols-1 gap-3">
                                {metadata
                                    .filter(m => {
                                        if (m.id_class !== selClass) return false;
                                        if (m.id_subject !== selSubject) return false;
                                        const s = metadataSearch.toLowerCase();
                                        return !s || 
                                               m.id_full.toLowerCase().includes(s) || 
                                               (m.description || '').toLowerCase().includes(s) ||
                                               (m.chapter_name || '').toLowerCase().includes(s) ||
                                               (m.unit_name || '').toLowerCase().includes(s);
                                    })
                                    .slice(0, 100) 
                                    .map(m => (
                                        <div 
                                            key={m.id_full} 
                                            className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                                            onClick={() => {
                                                setSelClass(m.id_class || 0);
                                                setSelSubject(m.id_subject || 'D');
                                                setSelChapter(m.id_chapter || 1);
                                                setSelUnit(m.id_unit || 1);
                                                setSelLevel(m.id_level || 'H');
                                                setSelCount(m.id_count || 1);
                                                setManualCount(false);
                                                setShowMetadataCatalog(false);
                                                
                                                updateAssignedId(m.id_full);
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{m.id_full}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium truncate italic max-w-[250px]">
                                                        {m.chapter_name ? `${m.chapter_name} › ` : ''}{m.unit_name ? m.unit_name : ''}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {m.description || 'Chưa có mô tả chi tiết cho dạng này'}
                                                </p>
                                            </div>
                                            <div className="shrink-0 ml-4">
                                                <div className="bg-indigo-50 p-2 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <ArrowRightIcon size={16}/>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {metadata.filter(m => m.id_class === selClass && m.id_subject === selSubject).length === 0 && (
                                    <div className="text-center py-12">
                                        <Tag className="mx-auto text-slate-200 mb-4" size={48}/>
                                        <p className="text-slate-400 font-medium">Chưa có dữ liệu mục lục cho khối lớp và môn này.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
                            <p className="text-[10px] text-slate-400 italic">Mẹo: Bạn có thể tìm nhanh bằng cách gõ tên bài hoặc mô tả của dạng bài cần gán.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
