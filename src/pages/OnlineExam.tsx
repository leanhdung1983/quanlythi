
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { useLanguageStore } from '../services/languageStore';
import { SavedMatrix, OnlineQuestion, QuestionType } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { clearSvgCache } from '../components/TikZRenderer';
import { extractMatrixHierarchy, prepareMatrixPayload } from '../utils/matrixUtils';
import { checkKQAnswer, calculateExamScore } from '../utils/gradeHelper';
import { parseQuestionContent, shuffleArray } from '../utils/latexParser';
import { ensureExamSessionId, resolveResumedSession, remainingExamSeconds } from '../utils/examSession';
import { 
    Clock, PlayCircle, ChevronRight, BookOpen, 
    Loader2, BarChart3, 
    Eye, AlertTriangle, ArrowLeft, Trash2,
    X, Timer, Book, Layers, Layout, Plus, Minus,
    Download, FileSpreadsheet, Flag, ChevronDown, FileText,
    Target, Lock, ShieldCheck, Database, Folder, FolderOpen, Calendar, Award, Zap, Users,
    PieChart as PieChartIcon, Info
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Document, Packer, Paragraph, Table, TableRow, TableCell, 
    WidthType, AlignmentType, HeadingLevel, TextRun 
} from 'docx';

// --- DOCX GENERATOR FOR HISTORY OR MATRIX ---
const generateGlobalResultsDocx = async (history: any[]) => {
    // Group history by exam title
    const examGroups: Record<string, { exam_title: string, records: any[] }> = {};
    history.forEach(h => {
        const key = h.exam_title || "Unknown Exam";
        if (!examGroups[key]) {
            examGroups[key] = {
                exam_title: key,
                records: []
            };
        }
        examGroups[key].records.push(h);
    });

    const docChildren: any[] = [
        new Paragraph({ text: "KẾT QUẢ THI TOÀN HỆ THỐNG", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: `Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} - Tổng số bài thi: ${Object.keys(examGroups).length}`, alignment: AlignmentType.CENTER, spacing: { after: 300 } })
    ];

    Object.values(examGroups).sort((a, b) => a.exam_title.localeCompare(b.exam_title)).forEach(group => {
        // Add exam header
        docChildren.push(new Paragraph({
            children: [
                new TextRun({ text: `Bài thi: ${group.exam_title.toUpperCase()}`, bold: true, size: 28 }),
            ],
            spacing: { before: 400, after: 100 }
        }));

        // Sort records by student name
        group.records.sort((a, b) => {
            const nameA = a.full_name || a.username || "Unknown";
            const nameB = b.full_name || b.username || "Unknown";
            return nameA.localeCompare(nameB);
        });

        // Add summary table for this exam
        const summaryRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "STT", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 5, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ text: "Học sinh", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ text: "Trường", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ text: "Điểm", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ text: "Thời gian", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ text: "Ngày thi", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                ]
            })
        ];

        group.records.forEach((exam, idx) => {
            const dateStr = new Date(exam.created_at).toLocaleDateString('vi-VN') + ' ' + new Date(exam.created_at).toLocaleTimeString('vi-VN');
            const durationStr = `${Math.floor(exam.duration_seconds / 60)}p ${exam.duration_seconds % 60}s`;
            const name = exam.full_name || exam.username || "Unknown";
            const school = exam.school || "";

            summaryRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: String(idx + 1), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: name })] }),
                    new TableCell({ children: [new Paragraph({ text: school })] }),
                    new TableCell({ children: [new Paragraph({ text: String(Number(exam.score).toFixed(2)), alignment: AlignmentType.CENTER, style: "strong" })] }),
                    new TableCell({ children: [new Paragraph({ text: durationStr, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: dateStr, alignment: AlignmentType.CENTER })] }),
                ]
            }));
        });

        docChildren.push(new Table({ rows: summaryRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        
        // Page break after each exam group
        docChildren.push(new Paragraph({
            text: "",
            pageBreakBefore: true
        }));
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren
        }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ket_qua_thi_toan_he_thong_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
};

const generateResultsDocx = async (history: unknown[], title: string, subtitle: string) => {
    const tableRows = [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: "STT", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 5, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                new TableCell({ children: [new Paragraph({ text: "Họ và Tên", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                new TableCell({ children: [new Paragraph({ text: "Đơn vị/Trường", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                new TableCell({ children: [new Paragraph({ text: "Điểm Số", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                new TableCell({ children: [new Paragraph({ text: "Thời Gian", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
                new TableCell({ children: [new Paragraph({ text: "Ngày Thi", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "EFEFEF" } }),
            ]
        })
    ];

    const parsedHistory = history as Array<{ created_at: string; duration_seconds: number; score: number; full_name?: string; username?: string; school?: string; result_detail?: any }>;

    parsedHistory.forEach((h, index) => {
        const dateStr = new Date(h.created_at).toLocaleDateString('vi-VN') + ' ' + new Date(h.created_at).toLocaleTimeString('vi-VN');
        const durationStr = `${Math.floor(h.duration_seconds / 60)}p ${h.duration_seconds % 60}s`;
        const name = h.full_name || h.username || "Unknown";
        const school = h.school || "";
        
        tableRows.push(new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: name })] }),
                new TableCell({ children: [new Paragraph({ text: school })] }),
                new TableCell({ children: [new Paragraph({ text: String(Number(h.score).toFixed(2)), alignment: AlignmentType.CENTER, style: "strong" })] }),
                new TableCell({ children: [new Paragraph({ text: durationStr, alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: dateStr, alignment: AlignmentType.CENTER })] }),
            ]
        }));
    });

    const docChildren = [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: subtitle, alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })
    ];

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren
        }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ket_qua_thi_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
};

import { useUIStore } from '../services/uiStore';

export const OnlineExam: React.FC = () => {
    const { t } = useLanguageStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { setHideSidebar } = useUIStore();
    const [mode, setMode] = useState<'DASHBOARD' | 'TAKING_EXAM' | 'REVIEW' | 'RESULT'>('DASHBOARD');
    
    // Sync sidebar visibility with exam mode
    useEffect(() => {
        if (mode === 'TAKING_EXAM' || mode === 'RESULT' || mode === 'REVIEW') {
            setHideSidebar(true);
        } else {
            setHideSidebar(false);
        }
        // Cleanup on unmount
        return () => setHideSidebar(false);
    }, [mode, setHideSidebar]);
    const [dashTab, setDashTab] = useState<'EXAMS' | 'STATS'>('EXAMS');
    const [savedMatrices, setSavedMatrices] = useState<SavedMatrix[]>([]);
    const [treeData, setTreeData] = useState<any[]>([]);
    const [questions, setQuestions] = useState<OnlineQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, unknown>>({});
    const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
    const [history, setHistory] = useState<unknown[]>([]); 
    
    // Matrix Stats Logic
    const [selectedMatrixId, setSelectedMatrixId] = useState<string>('');
    const [matrixResults, setMatrixResults] = useState<unknown[]>([]);
    const [loadingMatrixStats, setLoadingMatrixStats] = useState(false);

    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [currentExamSessionId, setCurrentExamSessionId] = useState<number | null>(null);
    const [examOwnerId, setExamOwnerId] = useState<number | null>(null);
    const currentUserIdRef = useRef(user?.id);
    currentUserIdRef.current = user?.id;
    const startingSessionRef = useRef(false);
    const [score, setScore] = useState(0);
    const [currentExamTitle, setCurrentExamTitle] = useState('');
    const [examSettings, setExamSettings] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [currentMatrixId, setCurrentMatrixId] = useState<number | null>(null);
    const [isRealExam, setIsRealExam] = useState(false);
    const [fontSize, setFontSize] = useState(16); // Reduced default from 18 to 16
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isStartingExam, setIsStartingExam] = useState(false);
    
    // Active Participants State
    const [showActiveParticipants, setShowActiveParticipants] = useState(false);
    const [activeParticipants, setActiveParticipants] = useState<any[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const [showAllActiveParticipants, setShowAllActiveParticipants] = useState(false);
    const [allActiveParticipants, setAllActiveParticipants] = useState<any[]>([]);
    const [loadingAllParticipants, setLoadingAllParticipants] = useState(false);

    // Custom Dialog State
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
        onCancel?: () => void;
        isAlert?: boolean;
    }>({ isOpen: false, title: '', message: '' });

    const showAlert = useCallback((title: string, message: string) => {
        setDialog({ isOpen: true, title, message, isAlert: true });
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        setDialog({ isOpen: true, title, message, onConfirm, onCancel, isAlert: false });
    }, []);

    const resumeSavedExam = useCallback(async (saved: any) => {
        if (!user?.id || startingSessionRef.current) return;
        startingSessionRef.current = true;
        setIsStartingExam(true);
        try {
            if (!Array.isArray(saved.questions) || !saved.questions.length || !Number.isFinite(Number(saved.timeLeft)) || Number(saved.timeLeft) < 0 || !Number.isFinite(Number(saved.totalTime)) || Number(saved.totalTime) <= 0) throw new Error('Bài cũ không hợp lệ. Hãy chọn làm mới.');
            const sessionId = await resolveResumedSession(saved, user.id, async id => {
                const response = await apiService.fetchExamResultDetail(id) as any;
                if (!response?.data) throw new Error('Không kiểm tra được phiên thi. Vui lòng thử lại.');
                return response.data;
            }, () => apiService.startExamSession({ matrix_id: saved.currentMatrixId,
                exam_title: saved.currentExamTitle, questions: saved.questions,
                duration_seconds: saved.totalTime, scoring_settings: saved.examSettings || {} }));
            if (currentUserIdRef.current !== user.id) throw new Error('Tài khoản đã thay đổi. Vui lòng mở lại bài thi.');
            setQuestions(saved.questions); setAnswers(saved.answers || {});
            setTimeLeft(remainingExamSeconds(saved)); setTotalTime(Number(saved.totalTime));
            setCurrentQIdx(saved.currentQIdx || 0); setCurrentExamTitle(saved.currentExamTitle);
            setCurrentMatrixId(saved.currentMatrixId); setExamSettings(saved.examSettings || {});
            setIsRealExam(!!saved.isRealExam); setCurrentExamSessionId(sessionId);
            setExamOwnerId(user.id); setMode('TAKING_EXAM');
        } catch (e: any) { showAlert('Không thể tiếp tục bài cũ', e.message || 'Vui lòng thử lại. Bài làm cũ vẫn được giữ.'); }
        finally { startingSessionRef.current = false; setIsStartingExam(false); }
    }, [user?.id, showAlert]);

    useEffect(() => {
        if (mode === 'TAKING_EXAM' && examOwnerId !== null && examOwnerId !== user?.id) {
            setMode('DASHBOARD'); setCurrentExamSessionId(null);
            showAlert('Tài khoản đã thay đổi', 'Bài thi cũ thuộc tài khoản trước. Hãy đăng nhập đúng tài khoản hoặc chọn làm mới.');
        }
    }, [mode, examOwnerId, user?.id, showAlert]);

    const handleViewActiveParticipants = useCallback(async (matrixId: number, showModal = true) => {
        setLoadingParticipants(true);
        if (showModal) {
            setShowActiveParticipants(true);
            setActiveParticipants([]);
        }
        try {
            const data = await apiService.fetchActiveParticipants(matrixId);
            setActiveParticipants(data || []);
        } catch {
            if (showModal) {
                showAlert("Lỗi", "Không thể lấy danh sách học sinh đang thi.");
                setShowActiveParticipants(false);
            }
        } finally {
            setLoadingParticipants(false);
        }
    }, [showAlert]);

    const handleViewAllActiveParticipants = async () => {
        setLoadingAllParticipants(true);
        setShowAllActiveParticipants(true);
        setAllActiveParticipants([]);
        try {
            const data = await apiService.fetchAllActiveParticipants();
            setAllActiveParticipants(data || []);
        } catch {
            showAlert("Lỗi", "Không thể lấy danh sách học sinh đang thi toàn hệ thống.");
            setShowAllActiveParticipants(false);
        } finally {
            setLoadingAllParticipants(false);
        }
    };

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [selectedExam, setSelectedExam] = useState<SavedMatrix | null>(null);

    // Auto-fetch active participants when an exam is selected
    useEffect(() => {
        let interval: any;
        if (selectedExam && mode === 'DASHBOARD') {
            handleViewActiveParticipants(selectedExam.id, false);
            interval = setInterval(() => {
                handleViewActiveParticipants(selectedExam.id, false);
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [selectedExam, mode, handleViewActiveParticipants]);

    // --- PROGRESS PERSISTENCE ---
    useEffect(() => {
        if (mode === 'TAKING_EXAM' && questions.length > 0 && examOwnerId === user?.id) {
            const state = {
                userId: user?.id,
                questions,
                answers,
                timeLeft,
                totalTime,
                currentQIdx,
                currentExamTitle,
                currentMatrixId,
                examSettings,
                isRealExam,
                currentExamSessionId,
                startTime: Date.now()
            };
            try {
                localStorage.setItem('online_exam_progress', JSON.stringify(state));
            } catch (e) {
                console.error("LocalStorage save failed", e);
            }
        } else if (mode === 'DASHBOARD' || mode === 'RESULT') {
            if (mode === 'RESULT') {
                try {
                    localStorage.removeItem('online_exam_progress');
                } catch (e) {
                    console.error("LocalStorage remove failed", e);
                }
            }
        }
    }, [mode, questions, answers, timeLeft, currentQIdx, currentExamTitle, currentMatrixId, totalTime, isRealExam, examSettings, currentExamSessionId, user?.id, examOwnerId]);

    // Backend periodic sync for live tracking
    useEffect(() => {
        if (mode !== 'TAKING_EXAM' || !currentExamSessionId) return;
        const interval = setInterval(() => {
            apiService.updateExamProgress(currentExamSessionId, answers).catch(() => {});
        }, 10000); // sync every 10 seconds
        return () => clearInterval(interval);
    }, [mode, currentExamSessionId, answers]);

    // Resume Check on Mount
    useEffect(() => {
        if (mode !== 'DASHBOARD' || !user?.id) return;

        try {
            const saved = localStorage.getItem('online_exam_progress');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.userId !== undefined && Number(state.userId) !== user.id) return;
                if (Array.isArray(state.questions) && state.questions.length) {
                    showConfirm(
                        "Tiếp tục bài thi?",
                        `Bạn có bài thi "${state.currentExamTitle}" chưa nộp. Bạn có muốn làm tiếp ngay không? (Nếu Chọn Hủy, tiến trình vẫn được lưu lại).`,
                        () => { void resumeSavedExam(state); },
                        () => {
                            // Do nothing, let user manually start later
                        }
                    );
                }
            }
        } catch (e) {
            console.error("Error resuming exam", e);
            try { localStorage.removeItem('online_exam_progress'); } catch {}
        }
    }, [mode, showConfirm, user?.id, resumeSavedExam]);

    const loadDashboardData = useCallback(async () => {
        try {
            // Filter by user's grade if they are a student
            const gradeId = user?.role === 'STUDENT' ? user.grade_id : undefined;

            const [mRes, hRes, treeRes, classAssigRes] = await Promise.all([
                apiService.fetchSavedMatrices(gradeId),
                user ? apiService.fetchUserExamHistory(user.id) : Promise.resolve([]) as Promise<unknown[]>,
                apiService.fetchTreeData(),
                (user && user.role !== 'TEACHER' && user.role !== 'ADMIN') ? apiService.fetchStudentClassAssignments(user.id) : Promise.resolve([])
            ]);

            let allMatrices = mRes || [];
            
            if (user && user.role === 'STUDENT') {
                // STUDENT: Only show matrices that are assigned to them via classes
                allMatrices = [];
                if (classAssigRes && classAssigRes.length > 0) {
                    const assignedMatrices = classAssigRes.map((ca: any) => ({
                        ...ca,
                        name: `[${ca.class_name}] ${ca.name}`,
                        id: ca.id // matrix_id
                    }));
                    
                    // Also need the actual matrix templates from mRes to get structure, criteria, etc.
                    const existingMap = new Map((mRes || []).map((m: any) => [m.id, m]));
                    
                    assignedMatrices.forEach((am: any) => {
                        const fullMatrixData = existingMap.get(am.id) || {};
                        allMatrices.push({ ...fullMatrixData, ...am });
                    });
                }
            } else {
                // TEACHER / ADMIN: Show all matrices, append class names to assigned ones if they are also students (rare but possible)
                if (classAssigRes && classAssigRes.length > 0) {
                    const assignedMatrices = classAssigRes.map((ca: any) => ({
                        ...ca,
                        name: `[${ca.class_name}] ${ca.name}`,
                        id: ca.id // matrix_id
                    }));
                    const existingIds = new Set(allMatrices.map((m: any) => m.id));
                    assignedMatrices.forEach((am: any) => {
                        if (!existingIds.has(am.id)) {
                            allMatrices.push(am);
                        } else {
                            const existing = allMatrices.find((m: any) => m.id === am.id);
                            if (existing && !existing.name.includes(`[${am.class_name}]`)) {
                                existing.name = `[${am.class_name}] ${existing.name}`;
                            }
                        }
                    });
                }
            }

            setTreeData(treeRes || []);
            setSavedMatrices(allMatrices);
            setHistory(hRes || []);

        } catch { console.error("Error loading dashboard data"); }
    }, [user]);

    const submittingRef = useRef(false);
    const [submittedResultId, setSubmittedResultId] = useState<number | null>(null);
    const finishExam = useCallback(async (isAuto: boolean = false, autoMsg?: string) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        try {
            if (!user || examOwnerId !== user.id) throw new Error('Vui lòng đăng nhập đúng tài khoản của bài thi. Bài làm vẫn được giữ trên máy.');
            let sessionId = currentExamSessionId;
            // Legacy local progress may predate server sessions. Recover it via
            // the normal start endpoint (including all LMS/attempt restrictions).
            if (!sessionId) {
                sessionId = await ensureExamSessionId(sessionId, () => apiService.startExamSession({ matrix_id: currentMatrixId,
                    exam_title: currentExamTitle, questions, duration_seconds: totalTime, scoring_settings: examSettings || {} }));
                setCurrentExamSessionId(sessionId);
            }
            if (currentUserIdRef.current !== user.id) throw new Error('Tài khoản đã thay đổi. Vui lòng mở lại bài thi.');
            const result = await apiService.saveExamResult({
                id: sessionId,
                duration_seconds: totalTime - timeLeft,
                answers
            }, isAuto);
            if (currentUserIdRef.current !== user.id) throw new Error('Tài khoản đã thay đổi. Hãy đăng nhập đúng tài khoản để xem kết quả.');
            if (!result?.success || !Number.isFinite(Number(result.score))) throw new Error('Máy chủ chưa xác nhận điểm bài thi.');
            setScore(Number(result.score));
            setSubmittedResultId(Number(result.id));
            try {
                const response = await apiService.fetchExamResultDetail(Number(result.id)) as any;
                const detail = typeof response.data?.result_detail === 'string' ? JSON.parse(response.data.result_detail) : response.data?.result_detail;
                if (Array.isArray(detail?.questions)) setQuestions(detail.questions);
                if (detail?.answers) setAnswers(detail.answers);
            } catch (e) { console.error('Đã nộp bài; có thể tải lại lời giải từ lịch sử.', e); }
            setCurrentExamSessionId(null);
            setMode('RESULT');
            try { localStorage.removeItem('online_exam_progress'); } catch {}
            clearSvgCache();
            await loadDashboardData();
            if (isAuto && autoMsg) showAlert('Thông báo', autoMsg);
        } catch (e: any) {
            showAlert('Chưa nộp được bài', e.message || 'Bài làm chưa được xác nhận. Vui lòng thử nộp lại.');
        } finally { submittingRef.current = false; }
    }, [answers, questions, examSettings, currentMatrixId, currentExamTitle, user, examOwnerId, currentExamSessionId, totalTime, timeLeft, loadDashboardData, showAlert]);

    const groupedExams = useMemo(() => {
        const tree: Record<string, Record<string, Record<string, Record<string, SavedMatrix[]>>>> = {};
        
        savedMatrices.forEach(m => {
            const { grade, subject, chapter, lesson } = extractMatrixHierarchy(m, t, treeData);
            
            if (!tree[grade]) tree[grade] = {};
            if (!tree[grade][subject]) tree[grade][subject] = {};
            if (!tree[grade][subject][chapter]) tree[grade][subject][chapter] = {};
            if (!tree[grade][subject][chapter][lesson]) tree[grade][subject][chapter][lesson] = [];
            
            tree[grade][subject][chapter][lesson].push(m);
        });
        
        return tree;
    }, [savedMatrices, t, treeData]);

    // Auto-expand first section when matrices load
    useEffect(() => {
        if (savedMatrices.length > 0 && Object.keys(expandedSections).length === 0) {
            const firstGrade = Object.keys(groupedExams)[0];
            if (firstGrade) {
                setExpandedSections({ [firstGrade]: true });
            }
        }
    }, [savedMatrices, groupedExams, expandedSections]);

    // --- AUTO-SUBMIT FOR REAL EXAM & EXIT HANDLING ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && mode === 'TAKING_EXAM') {
                if (isRealExam) {
                    finishExam(true, "Hệ thống tự động nộp bài do bạn đã thoát trình duyệt/chuyển tab trong kỳ thi thật."); 
                } else {
                    // Force save progress on visibility change for non-real exams
                    const state = {
                        questions, answers, timeLeft, totalTime, currentQIdx,
                        currentExamTitle, currentMatrixId, examSettings, isRealExam,
                        startTime: Date.now()
                    };
                    try { localStorage.setItem('online_exam_progress', JSON.stringify(state)); } catch(e) { console.error(e); }
                }
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (mode === 'TAKING_EXAM') {
                if (isRealExam) {
                    finishExam(true, "Hệ thống tự động nộp bài do bạn đã thoát trình duyệt trong kỳ thi thật.");
                } else {
                    e.preventDefault();
                    e.returnValue = 'Bạn có chắc chắn muốn thoát? Tiến trình làm bài sẽ được lưu lại.';
                }
            }
        };

        // Handle browser back button
        const handlePopState = () => {
            if (mode === 'TAKING_EXAM') {
                showConfirm(
                    "Thoát phòng thi?",
                    "Bạn đang trong phòng thi. Bạn có chắc chắn muốn thoát không?",
                    () => {
                        setMode('DASHBOARD');
                    },
                    () => {
                        window.history.pushState(null, '', window.location.pathname);
                    }
                );
            }
        };

        if (mode === 'TAKING_EXAM') {
            window.history.pushState(null, '', window.location.pathname);
            window.addEventListener('popstate', handlePopState);
        }

        // Security: Block DevTools shortcuts, view source, and right-click menu during exam
        const handleContextMenu = (e: MouseEvent) => {
            if (mode === 'TAKING_EXAM') {
                e.preventDefault();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (mode === 'TAKING_EXAM') {
                // Block F12
                if (e.key === 'F12') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // Block Ctrl+Shift+I / J / C (DevTools inspector)
                if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // Block Ctrl+U (View source)
                if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // Block Ctrl+S (Save page)
                if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleVisibilityChange); // More reliable for iOS
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mode, finishExam, isRealExam, questions, answers, timeLeft, totalTime, currentQIdx, currentExamTitle, currentMatrixId, examSettings, showConfirm]);

    // Export UI
    const [showSidebar, setShowSidebar] = useState(true);

    // Report Error State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => { if (user) loadDashboardData(); }, [user, loadDashboardData]);

    useEffect(() => {
        let timer: any;
        if (mode === 'TAKING_EXAM' && timeLeft <= 0) { void finishExam(true); return; }
        if (mode === 'TAKING_EXAM' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { clearInterval(timer); finishExam(true); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [mode, timeLeft, finishExam]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- MATRIX STATS HANDLER ---
    useEffect(() => {
        if (mode !== 'DASHBOARD' || dashTab !== 'STATS') return;
        let active = true;
        const refresh = async () => {
            if (document.visibilityState === 'hidden') return;
            await loadDashboardData();
            if (selectedMatrixId) {
                try { const rows = await apiService.fetchMatrixResults(Number(selectedMatrixId)); if (active) setMatrixResults(rows || []); }
                catch (e) { console.error('Không tải được thống kê mới', e); }
            }
        };
        void refresh();
        const timer = setInterval(() => void refresh(), 15000);
        window.addEventListener('focus', refresh);
        return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
    }, [mode, dashTab, selectedMatrixId, loadDashboardData]);
    const handleMatrixSelect = async (mId: string) => {
        setSelectedMatrixId(mId);
        if (!mId) { setMatrixResults([]); return; }
        
        setLoadingMatrixStats(true);
        try {
            const res = await apiService.fetchMatrixResults(parseInt(mId));
            setMatrixResults(res || []);
        } catch { } finally { setLoadingMatrixStats(false); }
    };

    const handleExportAllSystemStats = async () => {
        try {
            const data = await apiService.fetchAllExamHistory();
            if (!data || data.length === 0) {
                return showAlert("Thông báo", "Chưa có dữ liệu thi nào trên hệ thống.");
            }
            await generateGlobalResultsDocx(data);
        } catch (e) {
            showAlert("Lỗi", "Không thể lấy dữ liệu toàn hệ thống.");
        }
    };

    const handleExportMatrixStats = () => {
        if (!selectedMatrixId || matrixResults.length === 0) return showAlert("Thông báo", "Chưa có dữ liệu để xuất.");
        const mName = savedMatrices.find(m => m.id.toString() === selectedMatrixId)?.name || "Unknown";
        generateResultsDocx(matrixResults, "BẢNG ĐIỂM CHI TIẾT", `Đề thi: ${mName}`);
    };

    const handleStartExam = async (m: SavedMatrix, forceNew: boolean = false) => {
        // Check for saved progress for THIS specific matrix
        let savedState = null;
        if (!forceNew) {
            try {
                const saved = localStorage.getItem('online_exam_progress');
                if (saved) savedState = JSON.parse(saved);
            } catch (e) {
                console.warn("Storage access warning", e);
            }
        }

        if (savedState && Number(savedState.currentMatrixId) === Number(m.id) && (savedState.userId === undefined || Number(savedState.userId) === user?.id)) {
            showConfirm(
                "Tiếp tục bài làm?",
                `Bạn có bài làm chưa nộp của đề này. Nhấn ĐỒNG Ý để LÀM TIẾP, nhấn HUỶ để XOÁ BÀI CŨ và LÀM MỚI.`,
                () => { void resumeSavedExam(savedState); },
                () => {
                    handleStartExam(m, true);
                }
            );
            return;
        }

        if (!user?.id || startingSessionRef.current) return;
        startingSessionRef.current = true;
        setIsStartingExam(true);
        try {
            let parsedData = m.matrix_data;
            if (typeof parsedData === 'string') {
                try {
                    parsedData = JSON.parse(parsedData);
                } catch {
                    throw new Error("Dữ liệu ma trận bị lỗi.");
                }
            }
            
            const matrixData = parsedData.matrix || parsedData;
            const settings = parsedData.settings || {};
            const duration = settings.duration ? parseInt(String(settings.duration)) : 90;

            const payload: any = { TN: [], TF: [], KQ: [], TL: [] };
            
            ['TN', 'TF', 'KQ', 'TL'].forEach(type => {
                const rawData = matrixData[type];
                if (Array.isArray(rawData)) {
                    payload[type] = rawData;
                } else if (rawData && typeof rawData === 'object') {
                    const items = Object.entries(rawData).map(([key, levels]) => {
                        const parts = key.split('-');
                        if(parts.length < 5) return null;
                        return { cls: parseInt(parts[0]), sub: parts[1], chap: parseInt(parts[2]), unit: parseInt(parts[3]), count: parseInt(parts[4]), levels: levels };
                    }).filter((item: any) => {
                        if (!item || !item.levels) return false;
                        const l = item.levels as Record<string, number>;
                        return (l.N||0) + (l.H||0) + (l.V||0) + (l.C||0) > 0;
                    });
                    payload[type] = items;
                }
            });

            const qsRaw = await apiService.generateOnlineExam(payload, user?.id);
            
            if (!qsRaw || qsRaw.length === 0) {
                return showAlert("Lỗi", "Không đủ câu hỏi để sinh đề hoặc lỗi server.");
            }
            
            const qs = qsRaw.map((q: any, idx: number) => ({ ...parseQuestionContent(q), id: q.id || idx }));
            const typeOrder: Record<string, number> = { 'TN': 1, 'TF': 2, 'KQ': 3, 'TL': 4 };
            qs.sort((a, b) => (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99));
            if (currentUserIdRef.current !== user.id) throw new Error('Tài khoản đã thay đổi. Vui lòng mở lại bài thi.');

            if (user?.id) {
                try {
                    const sessionRes = await apiService.startExamSession({ 
                        user_id: user.id, 
                        matrix_id: m.id, 
                        exam_title: m.name, 
                        questions: qs, 
                        duration_seconds: duration * 60,
                        scoring_settings: settings
                    });
                    if (sessionRes?.success && Number.isSafeInteger(Number(sessionRes.id)) && Number(sessionRes.id) > 0) {
                        setCurrentExamSessionId(Number(sessionRes.id));
                    } else throw new Error('Máy chủ chưa xác nhận phiên thi. Vui lòng thử lại.');
                } catch(e: any) {
                    console.error("Failed to start session on server", e);
                    showAlert("Không thể vào thi", e.message || "Bạn không thể vào thi bài tập này.");
                    return;
                }
            }

            if (currentUserIdRef.current !== user?.id) throw new Error('Tài khoản đã thay đổi. Vui lòng mở lại bài thi.');
            setExamOwnerId(user.id);
            setQuestions(qs); 
            setAnswers({}); 
            setCurrentExamTitle(m.name);
            setExamSettings(settings);
            setTotalTime(duration * 60); 
            setTimeLeft(duration * 60); 
            setCurrentQIdx(0); 
            setCurrentMatrixId(m.id);
            setIsRealExam(settings.mode === 'REAL');
            setMode('TAKING_EXAM');
        } catch (e: unknown) { 
            const error = e as Error;
            showAlert("Lỗi", "Lỗi khi tạo đề: " + (error.message || "Lỗi không xác định")); 
        } finally {
            startingSessionRef.current = false;
            setIsStartingExam(false);
        }
    };

    // Auto-start exam when navigated from Class Management or other pages with autoStartMatrixId
    const lastAutoStartedIdRef = useRef<number | null>(null);
    useEffect(() => {
        const autoStartId = (location.state as any)?.autoStartMatrixId;
        if (!autoStartId || lastAutoStartedIdRef.current === autoStartId || savedMatrices.length === 0 || mode !== 'DASHBOARD') return;

        const targetMatrix = savedMatrices.find((m: any) => Number(m.id) === Number(autoStartId));
        if (targetMatrix) {
            lastAutoStartedIdRef.current = autoStartId;
            try {
                window.history.replaceState({}, document.title);
            } catch (e) {
                console.warn("Could not clear history state", e);
            }
            handleStartExam(targetMatrix);
        }
    }, [savedMatrices, location.state, mode]);

    const handleAnswer = (val: unknown) => { setAnswers(prev => ({ ...prev, [questions[currentQIdx].id]: val })); };
    const handleTFAnswer = (optId: string, isTrue: boolean) => {
        setAnswers(prev => {
            const currentAns = (prev[questions[currentQIdx].id] || {}) as Record<string, boolean>;
            return { ...prev, [questions[currentQIdx].id]: { ...currentAns, [optId]: isTrue } };
        });
    };

    const handleViewHistory = async (item: unknown) => {
        try {
            const res = await apiService.fetchExamResultDetail((item as any).id) as any;
            const data = res?.data;
            if (!data) throw new Error("No data returned");

            if (data.review_locked) {
                showAlert("Thông báo", "Giáo viên đã khoá chức năng xem đáp án và lời giải chi tiết cho bài tập này.");
                return;
            }

            let detail = data.result_detail || data.details; 
            if (typeof detail === 'string') detail = JSON.parse(detail);
            
            if (!detail || !detail.questions) throw new Error("Chi tiết bài thi bị lỗi.");

            // Review the immutable submitted snapshot, not today's edited/shuffled bank.
            setQuestions(detail.questions.map((q: any) => Array.isArray(q.options) && q.content ? q : parseQuestionContent(q, true)));
            setAnswers(detail.answers || {});
            setScore(Number(data.score || 0));
            setCurrentExamTitle(data.exam_title); 
            setCurrentQIdx(0); 
            setMode('REVIEW');
        } catch (err: any) { showAlert("Lỗi", "Lỗi tải bài thi: " + (err.message || "Lỗi không xác định")); }
    };

    const handleDeleteHistory = (id: number) => {
        if (!id) return;
        showConfirm("Xoá kết quả?", "Bạn có chắc chắn muốn xoá lịch sử làm bài này không?", async () => {
            try {
                await apiService.deleteExamResult(id);
                setHistory(prev => prev.filter((h: any) => Number(h.id) !== Number(id)));
                setMatrixResults(prev => prev.filter((h: any) => Number(h.id) !== Number(id)));
            } catch (err: any) {
                showAlert("Lỗi", err?.message || "Không thể xoá lịch sử.");
            }
        });
    };

    const handleDeleteAllHistory = () => {
        if (!user || history.length === 0) return;
        showConfirm(
            "Xoá toàn bộ lịch sử?", 
            "Bạn có chắc chắn muốn xoá TOÀN BỘ lịch sử làm bài không? Hành động này không thể hoàn tác.", 
            async () => {
                try {
                    await apiService.deleteAllExamHistory(user.id);
                    setHistory([]);
                    showAlert("Thành công", "Đã xoá toàn bộ lịch sử làm bài.");
                } catch (err: any) {
                    showAlert("Lỗi", err?.message || "Không thể xoá toàn bộ lịch sử.");
                }
            }
        );
    };

    const handleReportSubmit = async () => {
        if (!reportReason.trim() || !user) return;
        try {
            await apiService.reportQuestion({ question_id: questions[currentQIdx].id, user_id: user.id, report_reason: reportReason });
            showAlert("Thành công", t('oe_report_success'));
            setShowReportModal(false);
            setReportReason('');
        } catch { showAlert("Lỗi", "Gửi báo cáo thất bại."); }
    };

    const handleExport = (type: string = 'ALL') => {
        if (history.length === 0) return showAlert("Thông báo", "Chưa có dữ liệu lịch sử để xuất.");
        
        let dataToExport = [...history];
        if (type === 'LATEST') {
            dataToExport = [history[0]];
        } else if (type === 'BEST') {
            dataToExport = [...history].sort((a: any, b: any) => Number(b.score) - Number(a.score)).slice(0, 1);
        }

        // Remap history to have full_name for docx
        const mappedHistory = dataToExport.map(h => ({...(h as any), full_name: user?.full_name}));
        generateResultsDocx(mappedHistory, "KẾT QUẢ THI CÁ NHÂN", `Học sinh: ${user?.full_name}`);
        setShowExportMenu(false);
    }

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderExamTree = () => {
        if (savedMatrices.length === 0) {
            return (
                <div className="text-center p-10 text-slate-400">
                    <AlertTriangle size={48} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-xs">
                        {user?.role === 'STUDENT' ? 'Chưa có bài tập nào. Hãy yêu cầu giáo viên thêm bạn vào lớp để được giao bài tập.' : 'Chưa có đề thi nào.'}
                    </p>
                </div>
            );
        }

        const gradeOrder = ['2', '1', '0', '9', '8', '7', '6', 'MULTI', 'OT'];
        const sortedGrades = Object.entries(groupedExams).sort((a, b) => {
            return gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0]);
        });

        return (
            <div className="space-y-1">
                {sortedGrades.map(([grade, subjects]) => {
                    const isGradeExpanded = expandedSections[grade];
                    return (
                        <div key={grade} className="mb-1">
                            <button 
                                onClick={() => toggleSection(grade)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${isGradeExpanded ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {isGradeExpanded ? <FolderOpen size={14}/> : <Folder size={14}/>}
                                    <span className="text-xs font-bold">
                                        {grade === '0' ? 'Lớp 10' : grade === '1' ? 'Lớp 11' : grade === '2' ? 'Lớp 12' : grade === 'MULTI' ? 'Liên khối' : grade === 'OT' ? 'Chưa phân loại' : `Lớp ${grade}`}
                                    </span>
                                </div>
                                {isGradeExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                            
                            {isGradeExpanded && (
                                <div className="ml-3 pl-2 border-l border-slate-100 mt-1 space-y-1">
                                    {Object.entries(subjects).map(([subject, chapters]) => {
                                        const subKey = `${grade}-${subject}`;
                                        const isSubExpanded = expandedSections[subKey] !== false;
                                        
                                        // Calculate total items in this subject
                                        let totalItems = 0;
                                        Object.values(chapters).forEach(lessons => {
                                            Object.values(lessons).forEach(list => {
                                                totalItems += list.length;
                                            });
                                        });

                                        return (
                                            <div key={subject}>
                                                <button 
                                                    onClick={() => toggleSection(subKey)}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                                                >
                                                    {isSubExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                                    <span>{subject}</span>
                                                    <span className="ml-auto bg-slate-100 text-slate-400 px-1 rounded-full text-[9px]">{totalItems}</span>
                                                </button>
                                                
                                                {isSubExpanded && (
                                                    <div className="ml-2 pl-2 border-l border-slate-100 mt-1 space-y-1">
                                                        {Object.entries(chapters).map(([chapter, lessons]) => {
                                                            const chapKey = `${subKey}-${chapter}`;
                                                            const isChapExpanded = expandedSections[chapKey];
                                                            return (
                                                                <div key={chapter}>
                                                                    <button 
                                                                        onClick={() => toggleSection(chapKey)}
                                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                                                                    >
                                                                        {isChapExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                                                        <span className="truncate">{chapter}</span>
                                                                    </button>
                                                                    
                                                                    {isChapExpanded && (
                                                                        <div className="ml-2 pl-2 border-l border-slate-100 mt-1 space-y-1">
                                                                            {Object.entries(lessons).map(([lesson, list]) => {
                                                                                const lessonKey = `${chapKey}-${lesson}`;
                                                                                const isLessonExpanded = expandedSections[lessonKey] !== false;
                                                                                return (
                                                                                    <div key={lesson}>
                                                                                        <button 
                                                                                            onClick={() => toggleSection(lessonKey)}
                                                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                                                                                        >
                                                                                            {isLessonExpanded ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                                                                            <span className="truncate">{lesson}</span>
                                                                                            <span className="ml-auto bg-slate-100 text-slate-400 px-1 rounded-full text-[9px]">{list.length}</span>
                                                                                        </button>
                                                                                        
                                                                                        {isLessonExpanded && (
                                                                                            <div className="space-y-1 mt-1 mb-2">
                                                                                                {list.map((m: any) => (
                                                                                                    <button 
                                                                                                        key={m.id}
                                                                                                        onClick={() => setSelectedExam(m)}
                                                                                                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all border ${selectedExam?.id === m.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                                                                    >
                                                                                                        <div className="font-bold line-clamp-1">{m.name}</div>
                                                                                                        <div className={`text-[9px] mt-0.5 ${selectedExam?.id === m.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                                                                            {new Date(m.created_at).toLocaleDateString()}
                                                                                                        </div>
                                                                                                    </button>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
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
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderExamDetails = (m: SavedMatrix) => {
        let settings: Record<string, any> = { duration: 90 };
        try {
            const parsed = (typeof m.matrix_data === 'string' ? JSON.parse(m.matrix_data) : m.matrix_data) as Record<string, any>;
            if (parsed.settings) settings = parsed.settings;
        } catch { }

        const isReal = settings.mode === 'REAL';
        const now = new Date();
        const startTime = settings.start_time ? new Date(settings.start_time) : null;
        const endTime = settings.end_time ? new Date(settings.end_time) : null;
        const isStarted = !startTime || now >= startTime;
        const isEnded = endTime && now > endTime;
        const myAttempts = history.filter((h: any) => h.matrix_id === m.id).length;
        const maxAttempts = settings.max_attempts || 0;
        const attemptsExhausted = maxAttempts > 0 && myAttempts >= maxAttempts;
        const canTake = isStarted && !isEnded && !attemptsExhausted;

        return (
            <div className="max-w-4xl mx-auto py-2 md:py-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-2xl shadow-indigo-100/40 border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <button onClick={() => setSelectedExam(null)} className="md:hidden mb-4 md:mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                                <ArrowLeft size={16}/> Quay lại
                            </button>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                {isReal ? (
                                    <span className="bg-red-400/20 border border-red-400/30 text-red-100 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck size={14}/> {t('oe_mode_real')}
                                    </span>
                                ) : (
                                    <span className="bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Target size={14}/> {t('oe_mode_practice')}
                                    </span>
                                )}
                                <span className="bg-white/5 border border-white/10 text-white/40 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">ID: {m.id}</span>
                                <button 
                                    onClick={() => handleViewActiveParticipants(m.id)}
                                    className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/40 transition-colors px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                                >
                                    <Users size={14} /> Xem người đang thi
                                </button>
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black mb-3 md:mb-4 leading-[1.1] tracking-tight max-w-2xl">{m.name}</h2>
                            <p className="text-indigo-100/60 text-xs md:text-sm font-medium flex items-center gap-2">
                                <Info size={16} className="text-orange-300"/>
                                Đảm bảo kết nối internet ổn định trước khi nhấn nút Bắt đầu.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 md:p-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-10">
                            <div className="flex items-center gap-4 md:gap-5 p-4 md:p-6 bg-slate-50/50 rounded-2xl md:rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-2xl shadow-sm text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Clock size={24} className="md:w-7 md:h-7"/></div>
                                <div>
                                    <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</div>
                                    <div className="text-lg md:text-xl font-black text-slate-800">{settings.duration} phút</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 md:gap-5 p-4 md:p-6 bg-slate-50/50 rounded-2xl md:rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-50 rounded-2xl shadow-sm text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Target size={24} className="md:w-7 md:h-7"/></div>
                                <div>
                                    <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số lượt cho phép</div>
                                    <div className="text-lg md:text-xl font-black text-slate-800">{maxAttempts === 0 ? 'Tự do' : `${maxAttempts} lượt`}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 md:gap-5 p-4 md:p-6 bg-slate-50/50 rounded-2xl md:rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-green-50 rounded-2xl shadow-sm text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={24} className="md:w-7 md:h-7"/></div>
                                <div>
                                    <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời hạn mở đề</div>
                                    <div className="text-[10px] md:text-xs font-bold text-slate-700 leading-tight">
                                        {startTime ? startTime.toLocaleString('vi-VN') : 'Đang mở'} - {endTime ? endTime.toLocaleString('vi-VN') : 'Mãi mãi'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 md:gap-5 p-4 md:p-6 bg-slate-50/50 rounded-2xl md:rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-2xl shadow-sm text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Zap size={24} className="md:w-7 md:h-7"/></div>
                                <div>
                                    <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ của bạn</div>
                                    <div className="text-lg md:text-xl font-black text-slate-800">Đã thi {myAttempts} lần</div>
                                </div>
                            </div>
                        </div>

                        {/* Live active participants inside test dashboard */}
                        <div className="mb-6 p-4 bg-slate-50/50 rounded-2xl md:rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang trong phòng thi ({activeParticipants.length})</span>
                            </div>
                            {loadingParticipants && activeParticipants.length === 0 ? (
                                <div className="text-xs text-slate-400 font-medium italic animate-pulse">Đang kiểm tra phòng thi...</div>
                            ) : activeParticipants.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {activeParticipants.map(hs => (
                                        <div key={hs.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold shadow-sm">
                                            <div className="w-4 h-4 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center text-[8px]">{hs.full_name?.charAt(0) || 'U'}</div>
                                            {hs.full_name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 font-medium italic">Hiện chưa có ai đang làm bài thi này.</div>
                            )}
                        </div>

                        {!canTake && (
                            <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 mb-8">
                                <AlertTriangle size={24} className="text-red-500 shrink-0"/>
                                <div>
                                    <h4 className="font-black text-red-600 uppercase tracking-widest text-[10px] mb-1">Cảnh báo hệ thống</h4>
                                    <p className="text-slate-600 text-xs font-bold opacity-80">
                                        {!isStarted ? `Đề chưa đến thời điểm bắt đầu (${startTime?.toLocaleString('vi-VN')}).` : 
                                         isEnded ? 'Đề thi đã hết hạn tham gia.' : 
                                         attemptsExhausted ? 'Bạn đã hết lượt tham gia cho bài kiểm tra này.' : 'Vui lòng quay lại sau.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => handleStartExam(m)} 
                            disabled={!canTake || isStartingExam}
                            className={`w-full py-4 md:py-6 rounded-2xl md:rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 md:gap-4 transition-all shadow-xl ${canTake ? 'bg-orange-500 text-white shadow-orange-200/50 hover:bg-orange-600 hover:-translate-y-1 active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                            {isStartingExam ? <Loader2 size={24} className="animate-spin" /> : (canTake ? <PlayCircle size={24}/> : <Lock size={24}/>)}
                            {isStartingExam ? 'Đang chuẩn bị đề...' : (canTake ? 'Vào phòng thi ngay' : 'Đang bị khoá')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const currentQ = questions[currentQIdx];
    const isQuestionAnswered = (q: typeof currentQ) => {
        const value = answers[q.id];
        if (value === undefined || value === null || value === '') return false;
        if (q.type === 'TF') return q.options?.length > 0 && q.options.every(option => (value as Record<string, boolean>)[option.id] !== undefined);
        return true;
    };
    const answeredCount = questions.filter(isQuestionAnswered).length;
    const isReviewMode = mode === 'REVIEW';

    const getSectionInfo = (q: OnlineQuestion) => {
        if (!q) return { title: '', sub: '' };
        if (q.type === 'TN') return { title: 'PHẦN I', sub: 'Câu trắc nghiệm nhiều phương án chọn. Thí sinh trả lời từ câu 1 đến câu ' + questions.filter(x => x.type === 'TN').length + '. Mỗi câu hỏi thí sinh chỉ chọn một phương án.' };
        if (q.type === 'TF') return { title: 'PHẦN II', sub: 'Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu ' + questions.filter(x => x.type === 'TF').length + '. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.' };
        if (q.type === 'KQ') return { title: 'PHẦN III', sub: 'Câu trắc nghiệm trả lời ngắn. Thí sinh trả lời từ câu 1 đến câu ' + questions.filter(x => x.type === 'KQ').length + '.' };
        if (q.type === 'TL') return { title: 'PHẦN IV', sub: 'Câu tự luận. Thí sinh tự trình bày bài giải.' };
        return { title: 'PHẦN KHÁC', sub: '' };
    };

    const handleFontSize = (delta: number) => {
        setFontSize(prev => Math.min(32, Math.max(14, prev + delta)));
    };

    const renderQuestionOptions = () => {
        if (!currentQ) return null;
        
        if (currentQ.type === 'TF' && currentQ.options) {
            return (
                <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-1.5">
                        {currentQ.options.map((opt, idx) => {
                            const userChoice = (answers[currentQ.id] as Record<string, boolean>)?.[opt.id];
                            const label = String.fromCharCode(97 + idx); // a, b, c, d
                            
                            const containerStyle = "bg-slate-50/50 border-slate-100 hover:border-slate-200";
                            let trueBtnStyle = "bg-white border-slate-300 shadow-sm text-slate-600 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50";
                            let falseBtnStyle = "bg-white border-slate-300 shadow-sm text-slate-600 font-bold hover:border-rose-500 hover:text-rose-600 hover:bg-rose-50";

                            if (isReviewMode) {
                                if (opt.isCorrect) {
                                    if (userChoice === true) trueBtnStyle = "bg-exam-green border-exam-green text-white shadow-lg shadow-exam-green/20";
                                    else trueBtnStyle = "border-exam-green text-exam-green font-black";
                                } else {
                                    if (userChoice === false) falseBtnStyle = "bg-exam-green border-exam-green text-white shadow-lg shadow-exam-green/20";
                                    else falseBtnStyle = "border-exam-green text-exam-green font-black";
                                }

                                if (userChoice !== undefined && userChoice !== opt.isCorrect) {
                                    if (userChoice === true) trueBtnStyle = "bg-exam-red border-exam-red text-white shadow-lg shadow-exam-red/20";
                                    else falseBtnStyle = "bg-exam-red border-exam-red text-white shadow-lg shadow-exam-red/20";
                                }
                            } else {
                                if (userChoice === true) trueBtnStyle = "bg-exam-green border-exam-green text-white shadow-lg shadow-exam-green/30";
                                if (userChoice === false) falseBtnStyle = "bg-exam-red border-exam-red text-white shadow-lg shadow-exam-red/30";
                            }

                            return (
                                <motion.div 
                                    key={opt.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl border transition-all group ${containerStyle}`}
                                >
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:text-exam-indigo group-hover:border-exam-indigo/30 transition-all shrink-0 mt-0.5 text-[9px]">
                                            {label})
                                        </div>
                                        <div className="flex-1 text-slate-700 leading-relaxed font-sans font-medium" style={{ fontSize: `${fontSize - 1}px` }}>
                                            <MathRenderer content={opt.content} mode="question" hideToolbar={true} />
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            onClick={() => !isReviewMode && handleTFAnswer(opt.id, true)}
                                            className={`min-w-[56px] h-7 rounded-lg font-black text-[9px] transition-all border flex items-center justify-center gap-1 ${trueBtnStyle}`}
                                        >
                                            {userChoice === true && <ShieldCheck size={10}/>} ĐÚNG
                                        </button>
                                        <button 
                                            onClick={() => !isReviewMode && handleTFAnswer(opt.id, false)}
                                            className={`min-w-[56px] h-7 rounded-lg font-black text-[9px] transition-all border flex items-center justify-center gap-1 ${falseBtnStyle}`}
                                        >
                                            {userChoice === false && <ShieldCheck size={10}/>} SAI
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (currentQ.type === 'TN' && currentQ.options) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentQ.options.map((opt, idx) => {
                        const isSelected = answers[currentQ.id] === opt.id;
                        let btnStyle = "bg-white border-slate-300 shadow-sm text-slate-800 hover:border-indigo-400 hover:bg-indigo-50";
                        let labelStyle = "bg-slate-100 text-slate-600 border-slate-300 font-bold";
                        
                        if (isReviewMode) {
                            if (opt.isCorrect) {
                                btnStyle = "bg-exam-green/10 border-exam-green text-exam-green shadow-xl shadow-exam-green/10";
                                labelStyle = "bg-exam-green text-white border-exam-green";
                            } else if (isSelected) {
                                btnStyle = "bg-exam-red/10 border-exam-red text-exam-red opacity-80";
                                labelStyle = "bg-exam-red text-white border-red-200";
                            }
                        } else if (isSelected) {
                            btnStyle = "bg-exam-indigo text-white border-exam-indigo shadow-lg shadow-exam-indigo/20 scale-[1.005]";
                            labelStyle = "bg-white/20 text-white border-white/30";
                        }
                        
                        return (
                            <motion.button 
                                key={opt.id} 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => !isReviewMode && handleAnswer(opt.id)}
                                className={`w-full p-2 rounded-xl border flex items-center gap-2.5 text-left transition-all active:scale-[0.99] group relative ${btnStyle}`}
                            >
                                <div className={`w-7 h-7 rounded-lg border flex-shrink-0 flex items-center justify-center font-black text-sm transition-all ${labelStyle}`}>
                                    {opt.id}
                                </div>
                                <div className="flex-1 font-bold leading-relaxed font-sans" style={{ fontSize: `${fontSize - 1}px` }}>
                                    <MathRenderer 
                                        content={opt.content && /^[a-zâêôưăđơàảãáạèẻẽéẹìỉĩíịòỏõóọùủũúụỳỷỹýỵ]/.test(opt.content.toLowerCase()) 
                                            ? opt.content.charAt(0).toUpperCase() + opt.content.slice(1) 
                                            : opt.content} 
                                        mode="question" 
                                        hideToolbar={true} 
                                    />
                                </div>
                                {isSelected && !isReviewMode && (
                                    <div className="absolute right-2 top-2 text-white/50"><ShieldCheck size={12}/></div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            );
        }

        if (currentQ.type === 'KQ') {
            return (
                <div className="p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-exam-orange/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex flex-col items-center max-w-md mx-auto text-center relative z-10">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-exam-orange mb-4">
                            <Target size={24}/>
                        </div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Kết quả tính toán của bạn</label>
                        <input 
                            className="w-full text-center p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-exam-orange focus:ring-8 focus:ring-exam-orange/10 font-black text-2xl text-slate-800 shadow-inner group-hover:shadow-2xl transition-all" 
                            placeholder="???" 
                            value={(answers[currentQ.id] as string) || ''} 
                            onChange={(e) => !isReviewMode && handleAnswer(e.target.value)} 
                            disabled={isReviewMode}
                        />
                        {!isReviewMode && (
                            <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Hãy nhập chính xác giá trị số hoặc biểu thức rút gọn
                            </p>
                        )}
                        {isReviewMode && (
                            <div className="mt-8 flex flex-col items-center">
                                <div className="text-[10px] font-black text-exam-green uppercase tracking-widest mb-2">Đáp án chính xác</div>
                                <div className="bg-exam-green text-white px-8 py-3 rounded-2xl font-black text-2xl shadow-lg shadow-exam-green/20">
                                    <MathRenderer content={currentQ.correctAnswer?.includes(',') || currentQ.correctAnswer?.includes('{') || currentQ.correctAnswer?.includes('\\') ? `$${currentQ.correctAnswer}$` : currentQ.correctAnswer || ''} mode="all" hideToolbar={true} isExTest={false} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (currentQ.type === 'TL') {
            return (
                <div className="p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 relative overflow-hidden group">
                    <div className="flex flex-col max-w-2xl mx-auto relative z-10">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-center">Trình bày bài giải của bạn</label>
                        <textarea 
                            className="w-full min-h-[160px] p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-exam-indigo focus:ring-8 focus:ring-exam-indigo/10 font-medium text-slate-700 shadow-inner group-hover:shadow-xl transition-all resize-y" 
                            placeholder="Nhập bài giải..." 
                            value={(answers[currentQ.id] as string) || ''} 
                            onChange={(e) => !isReviewMode && handleAnswer(e.target.value)} 
                            disabled={isReviewMode}
                        />
                    </div>
                </div>
            );
        }

        return <div className="p-10 text-center text-slate-400 italic font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">Dạng câu hỏi này chỉ hỗ trợ hiển thị, chưa hỗ trợ tương tác trực tuyến.</div>;
    };

    const dialogComponent = (
        <AnimatePresence mode="wait">
            {dialog.isOpen && (
                <motion.div 
                    key="dialog-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                >
                    <motion.div 
                        key="dialog-content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dialog.isAlert ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                                    {dialog.isAlert ? <AlertTriangle size={20} /> : <Info size={20} />}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{dialog.title}</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed mb-8">{dialog.message}</p>
                            
                            <div className="flex gap-3 justify-end">
                                {!dialog.isAlert && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setDialog(prev => ({ ...prev, isOpen: false }));
                                            if (dialog.onCancel) dialog.onCancel();
                                        }}
                                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                )}
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setDialog(prev => ({ ...prev, isOpen: false }));
                                        if (dialog.onConfirm) dialog.onConfirm();
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95"
                                >
                                    {dialog.isAlert ? 'Đóng' : 'Đồng ý'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const activeParticipantsModal = (
        <AnimatePresence>
            {showActiveParticipants && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-emerald-500" size={20} />
                                Học sinh đang thi ({activeParticipants.length})
                            </h3>
                            <button 
                                onClick={() => setShowActiveParticipants(false)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingParticipants ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                                    <span>Đang tải danh sách...</span>
                                </div>
                            ) : activeParticipants.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    Không có học sinh nào đang làm bài thi này.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {activeParticipants.map(hs => (
                                        <div key={hs.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center">
                                                    {hs.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{hs.full_name}</div>
                                                    <div className="text-xs text-slate-500">{hs.school || (hs.username ? `@${hs.username}` : 'Chưa cập nhật')}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 border border-slate-200 rounded-md">Vào lúc: {new Date(hs.created_at).toLocaleTimeString('vi-VN')}</div>
                                                <div className="text-xs text-indigo-500 mt-1 flex items-center justify-end gap-1 font-medium"><Clock size={12}/> {new Date(hs.last_updated).toLocaleTimeString('vi-VN')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const allActiveParticipantsModal = (
        <AnimatePresence>
            {showAllActiveParticipants && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-emerald-500" size={20} />
                                Học sinh đang thi Toàn hệ thống ({allActiveParticipants.length})
                            </h3>
                            <button 
                                onClick={() => setShowAllActiveParticipants(false)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            {loadingAllParticipants ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                                    <span>Đang tải danh sách...</span>
                                </div>
                            ) : allActiveParticipants.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    Không có học sinh nào đang làm bài thi trên toàn hệ thống lúc này.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(
                                        allActiveParticipants.reduce((acc: any, hs: any) => {
                                            const group = hs.matrix_name || hs.exam_title || "Khác";
                                            if (!acc[group]) acc[group] = [];
                                            acc[group].push(hs);
                                            return acc;
                                        }, {})
                                    ).map(([groupName, students]: [string, any]) => (
                                        <div key={groupName} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
                                                <Target size={16} className="text-indigo-500" />
                                                {groupName} <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{students.length}</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {students.map((hs: any) => (
                                                    <div key={hs.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-xs">
                                                                {hs.full_name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{hs.full_name}</div>
                                                                <div className="text-xs text-slate-500">{hs.school || (hs.username ? `@${hs.username}` : 'Chưa cập nhật')}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 border border-slate-200 rounded shadow-sm">Bắt đầu: {new Date(hs.created_at).toLocaleTimeString('vi-VN')}</div>
                                                            <div className="text-[10px] text-indigo-500 mt-1.5 flex items-center justify-end gap-1 font-medium"><Clock size={10}/> Cập nhật: {new Date(hs.last_updated).toLocaleTimeString('vi-VN')}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (mode === 'DASHBOARD') return (
        <>
            {dialogComponent}
            {activeParticipantsModal}
            {allActiveParticipantsModal}
            <div className="flex-1 flex flex-col space-y-0 w-full bg-[#f8fafc] overflow-hidden md:rounded-2xl border border-slate-200 shadow-sm relative min-h-[calc(100vh-8rem)]">
                    <header className="flex justify-between items-center px-4 py-3 md:px-8 md:py-5 bg-white border-b border-slate-200 shrink-0 shadow-sm z-20">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-exam-orange rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-exam-orange/20 rotate-3 shrink-0">
                                <Award size={20} className="md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">{t('oe_title')}</h1>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 md:mt-1.5 flex items-center gap-1 md:gap-2 line-clamp-1">
                                    <ShieldCheck size={12} className="text-exam-green shrink-0"/> Hệ thống thi trực tuyến bảo mật
                                </p>
                            </div>
                            {['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(user?.role || '') && (
                                <div className="hidden md:flex ml-4 items-center gap-2">
                                    <button 
                                        onClick={handleExportAllSystemStats}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold rounded-xl border border-blue-100 transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        <FileText size={16} className="text-blue-500" />
                                        Xuất tổng hợp
                                    </button>
                                    <button 
                                        onClick={handleViewAllActiveParticipants}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100 transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        <Users size={16} className="text-emerald-500" />
                                        Theo dõi hệ thống
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 md:gap-6">
                            <nav className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                                <button 
                                    onClick={() => setDashTab('EXAMS')} 
                                    className={`flex items-center gap-1 md:gap-2 px-2 py-1 md:px-6 md:py-2.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${dashTab === 'EXAMS' ? 'bg-white text-exam-orange shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Book size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Đề thi</span>
                                </button>
                                <button 
                                    onClick={() => setDashTab('STATS')} 
                                    className={`flex items-center gap-1 md:gap-2 px-2 py-1 md:px-6 md:py-2.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${dashTab === 'STATS' ? 'bg-white text-exam-orange shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <BarChart3 size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Lịch sử</span>
                                </button>
                            </nav>
                            
                            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                            
                            <div className="items-center gap-3 hidden md:flex">
                                <div className="text-right hidden xl:block">
                                    <div className="text-sm font-black text-slate-800">{user?.full_name}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</div>
                                </div>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 border-2 border-white shadow-inner flex items-center justify-center font-black text-slate-400">
                                    {user?.full_name?.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 flex min-h-0 overflow-hidden relative">
                        {dashTab === 'EXAMS' ? (
                            <div className="flex-1 flex max-md:flex-col min-h-0">
                                {/* SIDEBAR TREE */}
                                <div className={`w-full md:w-[340px] bg-white border-r border-slate-200 flex-col shrink-0 shadow-sm z-10 ${selectedExam ? 'hidden md:flex' : 'flex'} flex-1 md:flex-initial min-h-0`}>
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kho học liệu số</h3>
                                            <div className="p-2 bg-exam-indigo/10 text-exam-indigo rounded-xl"><Database size={16}/></div>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Tìm kiếm bài thi..." 
                                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-transparent rounded-2xl text-xs font-medium focus:bg-white focus:border-exam-orange/30 focus:ring-4 focus:ring-exam-orange/5 outline-none transition-all"
                                            />
                                            <Info className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                                        {renderExamTree()}
                                    </div>
                                </div>

                                {/* MAIN CONTENT */}
                                <main className={`flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc] exam-grid-pattern custom-scrollbar ${selectedExam ? 'block' : 'hidden md:block'}`}>
                                    <AnimatePresence mode="wait">
                                        {selectedExam ? (
                                            <motion.div 
                                                key={selectedExam.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.4 }}
                                            >
                                                {renderExamDetails(selectedExam)}
                                            </motion.div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-8 animate-in fade-in duration-1000">
                                                <div className="p-12 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 relative group">
                                                    <div className="absolute inset-0 bg-exam-orange/5 rounded-[3rem] scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                                                    <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-100 relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                                                        <BookOpen size={64} className="opacity-10"/>
                                                    </div>
                                                </div>
                                                <div className="text-center max-w-sm">
                                                    <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Cổng Học Liệu Pro</h3>
                                                    <p className="text-sm font-medium text-slate-400 leading-relaxed px-6">
                                                        Chào mừng <span className="text-exam-orange font-bold font-sans tracking-normal">{user?.full_name}</span>. Hãy chọn một chuyên đề bên trái để bắt đầu đo lường năng lực ngay.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </main>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] p-8 overflow-y-auto custom-scrollbar">
                               <div className="max-w-6xl mx-auto w-full space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Thống kê Năng lực</h2>
                                            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Xem lại tiến trình & kết quả học tập</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 pr-4">
                                                <div className="p-2.5 bg-exam-indigo/10 text-exam-indigo rounded-xl"><Layers size={20}/></div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Số liệu của</div>
                                                    <select 
                                                        className="bg-transparent border-none p-0 text-sm font-black text-slate-700 outline-none cursor-pointer focus:ring-0"
                                                        value={selectedMatrixId}
                                                        onChange={(e) => handleMatrixSelect(e.target.value)}
                                                    >
                                                        <option value="">Cá nhân (Của tôi)</option>
                                                        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                                                            <>
                                                                {Object.entries(groupedExams).map(([grade, subjects]) => (
                                                                    Object.entries(subjects).map(([subject, chapters]) => {
                                                                        const gradeLabel = grade === 'OT' ? 'Khác' : `Lớp ${grade}`;
                                                                        return (
                                                                            <optgroup key={`${grade}-${subject}`} label={`${gradeLabel} - ${subject}`}>
                                                                                {Object.values(chapters).flatMap(lessons => 
                                                                                    Object.values(lessons).flat()
                                                                                ).map(m => (
                                                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                                                ))}
                                                                            </optgroup>
                                                                        );
                                                                    })
                                                                ))}
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            {selectedMatrixId ? (
                                                <button 
                                                    onClick={handleExportMatrixStats}
                                                    disabled={matrixResults.length === 0}
                                                    className="h-[60px] bg-exam-indigo hover:bg-indigo-700 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-30"
                                                >
                                                    <FileText size={20}/> Xuất Kết Quả (Word)
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    {history.length > 0 && (
                                                        <button 
                                                            type="button"
                                                            onClick={handleDeleteAllHistory}
                                                            className="h-[60px] bg-red-50 text-red-600 border border-red-100 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-red-100 transition-all shadow-sm"
                                                            title="Xoá toàn bộ lịch sử"
                                                        >
                                                            <Trash2 size={20}/> Xoá hết
                                                        </button>
                                                    )}
                                                    <div className="relative group/export">
                                                        <button 
                                                            onClick={() => setShowExportMenu(!showExportMenu)}
                                                            className="h-[60px] bg-white border border-slate-200 text-slate-700 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-all"
                                                        >
                                                            <Download size={20}/> Tải Bảng Điểm <ChevronDown size={14}/>
                                                        </button>
                                                        {showExportMenu && (
                                                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-slate-200/50">
                                                                <div className="p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải về theo định dạng Excel</div>
                                                                <button onClick={() => { handleExport('LATEST'); setShowExportMenu(false); }} className="w-full text-left px-6 py-4 text-xs font-black text-slate-600 hover:bg-exam-indigo/5 hover:text-exam-indigo transition-all flex items-center gap-3 border-b border-slate-50"><div className="w-2 h-2 rounded-full bg-exam-indigo"></div> Lần thi mới nhất</button>
                                                                <button onClick={() => { handleExport('BEST'); setShowExportMenu(false); }} className="w-full text-left px-6 py-4 text-xs font-black text-slate-600 hover:bg-exam-indigo/5 hover:text-exam-indigo transition-all flex items-center gap-3 border-b border-slate-50"><div className="w-2 h-2 rounded-full bg-exam-green"></div> Điểm cao nhất</button>
                                                                <button onClick={() => { handleExport('ALL'); setShowExportMenu(false); }} className="w-full text-left px-6 py-4 text-xs font-black text-slate-600 hover:bg-exam-indigo/5 hover:text-exam-indigo transition-all flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-exam-orange"></div> Tất cả lịch sử</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden transition-all">
                                        {selectedMatrixId ? (
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                                            <th className="px-8 py-6">Thí Sinh</th>
                                                            <th className="px-8 py-6">Đơn vị / Lớp</th>
                                                            <th className="px-8 py-6 text-center">Điểm số</th>
                                                            <th className="px-8 py-6 text-center">Thời lượng</th>
                                                            <th className="px-8 py-6 text-right">Ngày thực hiện</th>
                                                            <th className="px-8 py-6 text-right">Hành động</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {loadingMatrixStats ? (
                                                            <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin inline text-exam-orange" size={32}/></td></tr>
                                                        ) : matrixResults.map((r: any) => (
                                                            <tr key={r.id || Math.random()} className="group hover:bg-slate-50/80 transition-all">
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-exam-indigo/10 flex items-center justify-center text-exam-indigo font-black text-xs uppercase tracking-tighter">
                                                                            {r.full_name?.charAt(0)}
                                                                        </div>
                                                                        <div className="font-extrabold text-slate-800 text-sm">{r.full_name || 'Học viên ẩn danh'}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-slate-400 text-xs font-bold font-sans tracking-normal uppercase">{r.school || 'Chưa cập nhật'}</td>
                                                                <td className="px-8 py-5 text-center">
                                                                    <div className={`text-xl font-black ${Number(r.score) >= 8 ? 'text-exam-green' : Number(r.score) >= 5 ? 'text-exam-blue' : 'text-exam-red'}`}>
                                                                        {Number(r.score).toFixed(2)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-center">
                                                                    <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 uppercase font-mono">
                                                                        <Timer size={12}/> {Math.floor(r.duration_seconds/60)}p {r.duration_seconds%60}s
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400 uppercase tracking-widest">{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                                                                <td className="px-8 py-5 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button 
                                                                            onClick={() => handleViewHistory(r)} 
                                                                            className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-exam-orange hover:border-exam-orange hover:bg-exam-orange/5 rounded-xl shadow-sm transition-all flex items-center justify-center group/btn"
                                                                        >
                                                                            <Eye size={18} className="group-hover/btn:scale-110 transition-transform"/>
                                                                        </button>
                                                                        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
                                                                            <button 
                                                                                onClick={() => handleDeleteHistory(r.id)} 
                                                                                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-exam-red hover:border-exam-red rounded-xl p-2 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center justify-center group/btn"
                                                                                title="Xoá kết quả của học sinh"
                                                                            >
                                                                                <Trash2 size={16}/>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {matrixResults.length === 0 && !loadingMatrixStats && (
                                                            <tr><td colSpan={6} className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.2em] italic">Chưa có bản ghi kết quả nào</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                                            <th className="px-8 py-6 font-mono">TÊN BÀI THI</th>
                                                            <th className="px-8 py-6 text-center">ĐIỂM</th>
                                                            <th className="px-8 py-6 text-center">THỜI GIAN</th>
                                                            <th className="px-8 py-6 text-right">NGÀY THỰC HIỆN</th>
                                                            <th className="px-8 py-6 text-right">CHI TIẾT</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {history.map((h: any) => (
                                                            <tr key={h.id} className="group hover:bg-slate-50/80 transition-all">
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2.5 bg-exam-indigo/5 text-exam-indigo rounded-xl group-hover:bg-exam-indigo group-hover:text-white transition-all"><Book size={18}/></div>
                                                                        <div className="font-extrabold text-slate-700 text-sm tracking-tight">{h.exam_title}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-center">
                                                                    <div className={`text-2xl font-black ${Number(h.score) >= 8 ? 'text-exam-green' : Number(h.score) >= 5 ? 'text-exam-blue' : 'text-exam-red'}`}>
                                                                        {Number(h.score).toFixed(2)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-center">
                                                                    <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 uppercase font-mono tracking-widest">
                                                                        <Timer size={12}/> {Math.floor(h.duration_seconds/60)}p {h.duration_seconds%60}s
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400 uppercase tracking-widest">{new Date(h.created_at).toLocaleString('vi-VN')}</td>
                                                                <td className="px-8 py-5 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button 
                                                                            onClick={() => handleViewHistory(h)} 
                                                                            className="bg-white border border-slate-200 text-slate-400 hover:text-exam-orange hover:border-exam-orange rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all inline-flex items-center gap-2 group/btn"
                                                                        >
                                                                            <Eye size={16}/> Xem lại
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteHistory(h.id)} 
                                                                            className="bg-white border border-slate-200 text-slate-400 hover:text-exam-red hover:border-exam-red rounded-xl p-2 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all inline-flex items-center group/btn"
                                                                            title="Xoá lịch sử"
                                                                        >
                                                                            <Trash2 size={16}/>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {history.length === 0 && (
                                                            <tr><td colSpan={5} className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.2em] italic">Bạn chưa thực hiện bài thi nào</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                               </div>
                            </div>
                        )}
                    </div>
                </div>
        </>
    );

    return (
        <div className={`fixed inset-0 flex flex-col bg-white overflow-hidden z-[100] ${mode === 'TAKING_EXAM' ? 'select-none' : ''}`}>
            {mode === 'TAKING_EXAM' && user && (
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex flex-wrap gap-16 justify-around content-around opacity-[0.035] select-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="transform -rotate-12 text-slate-900 font-bold text-sm tracking-wider whitespace-nowrap">
                            {user.full_name || user.username} • {user.username} • ID6-EXAM
                        </div>
                    ))}
                </div>
            )}
            <header className="bg-white border-b border-slate-200 px-3 md:px-5 py-2 shrink-0 flex justify-between items-center gap-2 shadow-sm z-30 sticky top-0">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <button 
                        onClick={() => { 
                            showConfirm("Thoát bài thi?", "Tiến trình của bạn sẽ được lưu lại (nếu là bài tự luyện). Bạn có chắc chắn muốn quay lại?", () => { setMode('DASHBOARD'); clearSvgCache(); });
                        }} 
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200 active:scale-95"
                    >
                        <ArrowLeft size={16}/>
                    </button>
                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                    <div className="min-w-0">
                        <h2 className="font-extrabold text-sm text-slate-800 line-clamp-1 tracking-tight flex items-center gap-2">
                            <BookOpen className="text-orange-500 shrink-0" size={14}/>
                            <span className="truncate">{currentExamTitle}</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-0.5">
                            <div className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-lg border border-slate-200">
                                {currentQIdx + 1} / {questions.length}
                            </div>
                            {isReviewMode ? (
                                <div className="flex items-center gap-1 text-green-600 font-black text-[11px] uppercase tracking-wider">
                                    <Award size={12}/> {Number(score || 0).toFixed(2)} ĐIỂM
                                </div>
                            ) : (
                                <div className={`flex items-center gap-1.5 font-mono font-black text-sm transition-colors ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                    <Clock size={16} className={timeLeft < 300 ? 'text-red-500' : 'text-orange-500'}/> 
                                    {formatTime(timeLeft)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <div className="hidden lg:flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1">
                        <button onClick={() => handleFontSize(-2)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-all"><Minus size={14}/></button>
                        <div className="px-2 text-[10px] font-black text-slate-400 uppercase">Font</div>
                        <button onClick={() => handleFontSize(2)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-all"><Plus size={14}/></button>
                    </div>

                    <button
                        className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all font-black flex items-center gap-1"
                        onClick={() => setShowSidebar(true)}
                    >
                        <Layout size={14}/>
                    </button>

                    {!isReviewMode && (
                        <button 
                            onClick={() => {
                                const qId = questions[currentQIdx].id;
                                setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
                            }}
                            className={`p-2 rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border ${markedForReview[questions[currentQIdx].id] ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            <Flag size={14}/>
                            <span className="hidden sm:inline text-[8px]">Đánh dấu</span>
                        </button>
                    )}

                    <button 
                        onClick={() => setShowReportModal(true)} 
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                        title="Báo lỗi câu hỏi"
                    >
                        <AlertTriangle size={16}/>
                    </button>

                    {!isReviewMode && (
                        <button 
                            onClick={() => { 
                                showConfirm(
                                    "Nộp bài?", 
                                    "Bạn còn " + formatTime(timeLeft) + " để kiểm tra lại. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?", 
                                    () => finishExam()
                                ); 
                            }} 
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-[11px] shadow-lg shadow-orange-500/30 transition-all active:scale-95 uppercase tracking-widest border border-orange-400/50"
                        >
                            Nộp bài
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                {isStartingExam && (
                    <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap size={24} className="text-orange-500 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em] mb-2">Đang thiết lập đề thi</h2>
                        <p className="text-slate-500 text-xs font-bold tracking-widest animate-pulse">Vui lòng đợi trong giây lát...</p>
                    </div>
                )}
                <main className="flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-5 custom-scrollbar bg-slate-50 exam-grid-pattern">
                    <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentQ && (
                            <div className="space-y-3">
                                {/* Section Header */}
                                <div className="flex items-center gap-2">
                                    <div className="bg-exam-indigo/10 text-exam-indigo px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-exam-indigo/20 flex items-center gap-1.5">
                                        <Layers size={10}/>
                                        {getSectionInfo(currentQ).title}
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-500">Câu {currentQIdx + 1} / {questions.length}</span>
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                </div>

                                {/* Question Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 md:p-6">
                                        {/* Question Text */}
                                        <div 
                                            className="text-slate-800 leading-[1.5] font-medium"
                                            style={{ fontSize: `${fontSize - 1}px` }}
                                        >
                                            <MathRenderer 
                                                content={currentQ.content} 
                                                isExTest={true}
                                                hideToolbar={true}
                                                mode="question"
                                                renderChoices={false}
                                            />
                                        </div>

                                        {/* Options Grid */}
                                        <div className="mt-3">
                                            {renderQuestionOptions()}
                                        </div>

                                        {/* Review Mode Solution */}
                                        <AnimatePresence>
                                            {isReviewMode && currentQ.solution && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-12 pt-10 border-t border-slate-100"
                                                >
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <div className="w-8 h-8 bg-exam-indigo/10 rounded-lg flex items-center justify-center text-exam-indigo">
                                                            <BookOpen size={18}/>
                                                        </div>
                                                        <span className="font-black text-slate-800 uppercase tracking-widest text-xs">Phân tích & Lời giải</span>
                                                    </div>
                                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/50 text-slate-700 leading-relaxed italic">
                                                        <MathRenderer content={currentQ.solution} mode="all" hideToolbar={true} isExTest={false} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Bottom Navigation */}
                                <div className="flex items-center justify-between pb-2">
                                    <button 
                                        onClick={() => setCurrentQIdx(Math.max(0, currentQIdx - 1))} 
                                        disabled={currentQIdx === 0} 
                                        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 rounded-xl font-black text-[9px] text-slate-600 uppercase tracking-widest transition-all hover:shadow-sm active:scale-95"
                                    >
                                        <ChevronRight className="rotate-180" size={14}/> Câu trước
                                    </button>
                                    
                                    <div className="hidden sm:flex items-center gap-1">
                                        {questions.slice(Math.max(0, currentQIdx - 1), Math.min(questions.length, currentQIdx + 2)).map((_, i) => (
                                            <div key={i} className={`h-0.5 rounded-full transition-all duration-300 ${i === (currentQIdx <= 0 ? 0 : 1) ? 'w-4 bg-exam-indigo' : 'w-1 bg-slate-200'}`}></div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => setCurrentQIdx(Math.min(questions.length - 1, currentQIdx + 1))} 
                                        disabled={currentQIdx === questions.length - 1} 
                                        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 rounded-xl font-black text-[9px] text-slate-600 uppercase tracking-widest transition-all hover:shadow-sm active:scale-95"
                                    >
                                        Câu sau <ChevronRight size={14}/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Question Navigator Sidebar */}
                <aside className={`fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 shadow-2xl transition-transform duration-500 lg:static lg:translate-x-0 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Layout size={14}/> Phiếu Trả Lời
                                </h3>
                                <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X size={18}/></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-black text-slate-800">
                                    {answeredCount}
                                    <span className="text-sm font-bold text-slate-300 ml-1">/ {questions.length}</span>
                                </div>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-exam-orange transition-all duration-1000 ease-out"
                                        style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                            {['TN', 'TF', 'KQ', 'TL'].map(type => {
                                const typeNames: Record<string, string> = { TN: 'Trắc nghiệm', TF: 'Đúng/Sai', KQ: 'Trả lời ngắn', TL: 'Tự luận' };
                                const qsInType = questions.map((q, i) => ({ q, i })).filter(item => item.q.type === type);
                                if (qsInType.length === 0) return null;
                                return (
                                    <div key={type}>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">{typeNames[type]}</div>
                                        <div className="grid grid-cols-5 gap-2.5">
                                            {qsInType.map(({ q, i }) => {
                                                const isAns = isQuestionAnswered(q);
                                                const isActive = i === currentQIdx;
                                                const isMarked = markedForReview[q.id];
                                                
                                                let btnCls = "h-11 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-center relative ";
                                                
                                                if (isReviewMode) {
                                                    let correct = false;
                                                    let isAutoGradable = true;
                                                    if (q.type === 'KQ') {
                                                        correct = checkKQAnswer(answers[q.id], q.correctAnswer);
                                                    }
                                                    else if (q.type === 'TF') { let cnt = 0; q.options.forEach(o => { if ((answers[q.id] as any)?.[o.id] === o.isCorrect) cnt++; }); correct = cnt === 4; }
                                                    else if (q.type === 'TL') { isAutoGradable = false; }
                                                    else correct = q.options?.find(o => o.isCorrect)?.id === answers[q.id];
                                                    
                                                    if (!isAutoGradable) {
                                                        btnCls += isAns 
                                                            ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                                                            : "bg-slate-50 border-slate-100 text-slate-300";
                                                    } else {
                                                        btnCls += correct 
                                                            ? "bg-exam-green/10 border-exam-green text-exam-green" 
                                                            : isAns 
                                                                ? "bg-exam-red/10 border-exam-red text-exam-red" 
                                                                : "bg-slate-50 border-slate-100 text-slate-300";
                                                    }
                                                } else {
                                                    if (isActive) btnCls += "bg-indigo-600 border-indigo-600 text-white shadow-xl ring-4 ring-indigo-50";
                                                    else if (isAns) btnCls += "bg-indigo-50 border-indigo-200 text-indigo-600 font-black";
                                                    else btnCls += "bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-500";
                                                    
                                                    if (isMarked) btnCls += " !border-orange-500 !text-orange-500 shadow-sm shadow-orange-100";
                                                }
                                                
                                                return (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => { setCurrentQIdx(i); if (window.innerWidth < 1024) setShowSidebar(false); }} 
                                                        className={btnCls}
                                                        aria-label={`Câu ${i + 1}: ${isAns ? 'đã hoàn thành' : 'chưa hoàn thành'}${isMarked ? ', cần xem lại' : ''}`}
                                                        aria-current={isActive ? 'step' : undefined}
                                                    >
                                                        {isMarked && !isActive && (
                                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-exam-orange text-white rounded-full flex items-center justify-center border-2 border-white">
                                                                <Flag size={8} fill="currentColor"/>
                                                            </div>
                                                        )}
                                                        {i + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!isReviewMode && (
                            <div className="p-6 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Hoàn thành</div>
                                        <div className="text-xl font-black text-slate-800">{answeredCount}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Cần xem lại</div>
                                        <div className="text-xl font-black text-exam-orange">{Object.keys(markedForReview).filter(k => markedForReview[k]).length}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        showConfirm(
                                            "Nộp bài?", 
                                            "Bạn còn " + formatTime(timeLeft) + " để kiểm tra lại. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?", 
                                            () => finishExam()
                                        ); 
                                    }}
                                    className="w-full bg-orange-500 h-16 rounded-[1.5rem] text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-100/50 hover:-translate-y-1 active:translate-y-0 active:scale-95"
                                >
                                    Hoàn thành & nộp bài <ShieldCheck size={20}/>
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Flag className="text-red-500"/> {t('oe_report_modal_title')}</h3><button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button></div>
                        <div className="p-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('oe_report_reason')}</label>
                            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full h-32 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="Ví dụ: Sai đáp án, lỗi font LaTeX, đề bài thiếu dữ kiện..."/>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2"><button onClick={() => setShowReportModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Huỷ</button><button onClick={handleReportSubmit} disabled={!reportReason.trim()} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">{t('oe_report_submit')}</button></div>
                    </div>
                </div>
            )}

            {mode === 'RESULT' && (
                <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col items-center overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
                    <div className="max-w-6xl w-full px-4 py-12">
                        {/* Summary Card */}
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12 animate-in zoom-in-95 duration-500">
                            <div className="bg-exam-dark p-12 text-white relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-exam-green/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-exam-orange/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-exam-green rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-exam-green/40 mb-8 animate-bounce">
                                        <Award size={48}/>
                                    </div>
                                    <h2 className="text-4xl font-black mb-3 tracking-tight uppercase">Chúc mừng bạn đã hoàn thành!</h2>
                                    <p className="text-slate-400 text-sm font-medium opacity-80 uppercase tracking-[0.2em]">Hệ thống đã ghi nhận kết quả và phân tích chi tiết</p>
                                </div>
                            </div>

                            <div className="p-12">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Score Display */}
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-indigo-50/30 rounded-[3rem] border border-indigo-100/50 text-center group">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Tổng điểm đạt được</div>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-indigo-400/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                                            <div className={`text-9xl font-black leading-none mb-4 relative z-10 ${Number(score) >= 8 ? 'text-green-500' : Number(score) >= 5 ? 'text-indigo-600' : 'text-red-500'}`}>
                                                {Number(score || 0).toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-6 py-2 bg-white rounded-full border border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-widest shadow-md">
                                            Hệ điểm 10 tối đa
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-exam-orange/30 transition-all">
                                            <div className="w-14 h-14 bg-exam-orange/10 rounded-2xl flex items-center justify-center text-exam-orange"><Target size={28}/></div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số câu đúng</div>
                                                <div className="text-2xl font-black text-slate-800">{questions.filter(q => {
                                                    const userAns = answers[q.id];
                                                    if (!userAns) return false;
                                                    if (q.type === 'TN') return userAns === q.options.find(o => o.isCorrect)?.id;
                                                    if (q.type === 'TF') {
                                                        let cnt = 0; q.options.forEach(o => { if ((userAns as any)[o.id] === o.isCorrect) cnt++; });
                                                        return cnt === 4;
                                                    }
                                                    if (q.type === 'KQ') {
                                                        return checkKQAnswer(userAns, q.correctAnswer);
                                                    }
                                                    return false;
                                                }).length} <span className="text-sm font-bold text-slate-300">/ {questions.length}</span></div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-exam-blue/30 transition-all">
                                            <div className="w-14 h-14 bg-exam-blue/10 rounded-2xl flex items-center justify-center text-exam-blue"><Clock size={28}/></div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian làm</div>
                                                <div className="text-2xl font-black text-slate-800">
                                                    {Math.floor((examSettings.duration * 60 - timeLeft) / 60)}p {(examSettings.duration * 60 - timeLeft) % 60}s
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-exam-indigo/30 transition-all">
                                            <div className="w-14 h-14 bg-exam-indigo/10 rounded-2xl flex items-center justify-center text-exam-indigo"><Layers size={28}/></div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Độ chính xác</div>
                                                <div className="text-2xl font-black text-slate-800">{Math.round((questions.filter(q => {
                                                    const userAns = answers[q.id];
                                                    if (!userAns) return false;
                                                    if (q.type === 'TN') return userAns === q.options.find(o => o.isCorrect)?.id;
                                                    if (q.type === 'TF') {
                                                        let cnt = 0; q.options.forEach(o => { if ((userAns as any)[o.id] === o.isCorrect) cnt++; });
                                                        return cnt === 4;
                                                    }
                                                    if (q.type === 'KQ') {
                                                        return checkKQAnswer(userAns, q.correctAnswer);
                                                    }
                                                    return false;
                                                }).length / questions.length) * 100)}%</div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-exam-green/30 transition-all">
                                            <div className="w-14 h-14 bg-exam-green/10 rounded-2xl flex items-center justify-center text-exam-green"><ShieldCheck size={28}/></div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bài thi</div>
                                                <div className="text-sm font-black text-slate-800 truncate max-w-[200px]">{selectedExam?.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                            {/* Performance by Level */}
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 uppercase tracking-tight">
                                    <BarChart3 size={24} className="text-exam-orange"/> Phân phối điểm theo mức độ
                                </h3>
                                <div className="h-80 w-full">
                                    {(() => {
                                        const getLevel = (id_full: string) => {
                                            if (id_full.includes('N')) return 'Nhận biết';
                                            if (id_full.includes('H')) return 'Thông hiểu';
                                            if (id_full.includes('V')) return 'Vận dụng';
                                            if (id_full.includes('C')) return 'Vận dụng cao';
                                            return 'Khác';
                                        };
                                        const levelStats: Record<string, { total: number, correct: number }> = {
                                            'Nhận biết': { total: 0, correct: 0 },
                                            'Thông hiểu': { total: 0, correct: 0 },
                                            'Vận dụng': { total: 0, correct: 0 },
                                            'Vận dụng cao': { total: 0, correct: 0 }
                                        };
                                        questions.forEach(q => {
                                            const lvl = getLevel(q.id_full || '');
                                            if (levelStats[lvl]) {
                                                levelStats[lvl].total++;
                                                const userAns = answers[q.id];
                                                if (userAns) {
                                                    if (q.type === 'TN' && userAns === q.options.find(o => o.isCorrect)?.id) levelStats[lvl].correct++;
                                                    else if (q.type === 'TF') {
                                                        let cnt = 0; q.options.forEach(o => { if ((userAns as any)[o.id] === o.isCorrect) cnt++; });
                                                        if (cnt === 4) levelStats[lvl].correct++;
                                                    } else if (q.type === 'KQ') {
                                                        if (checkKQAnswer(userAns, q.correctAnswer)) levelStats[lvl].correct++;
                                                    }
                                                }
                                            }
                                        });
                                        const data = Object.entries(levelStats).map(([name, stats]) => ({
                                            name,
                                            percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                                            total: stats.total
                                        }));
                                        return (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `${v}%`} />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }}
                                                        cursor={{ fill: '#f8fafc' }}
                                                    />
                                                    <Bar dataKey="percent" fill="#f97316" radius={[12, 12, 12, 12]} name="Tỷ lệ đúng (%)" barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Competency Analysis */}
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 text-exam-blue/10 rotate-12"><Target size={120}/></div>
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 uppercase tracking-tight relative z-10">
                                    <PieChartIcon size={24} className="text-exam-blue"/> Phân tích năng lực chuyên sâu
                                </h3>
                                <div className="space-y-6 relative z-10">
                                    {(() => {
                                        const compStats: Record<string, { total: number, correct: number }> = {};
                                        questions.forEach(q => {
                                            const comps = q.competencies || [];
                                            const userAns = answers[q.id];
                                            let isCorrect = false;
                                            if (q.type === 'TN') isCorrect = userAns === q.options.find(o => o.isCorrect)?.id;
                                            else if (q.type === 'TF' && userAns) {
                                                let cnt = 0; q.options.forEach(o => { if ((userAns as any)[o.id] === o.isCorrect) cnt++; });
                                                isCorrect = cnt === 4;
                                            } else if (q.type === 'KQ') {
                                                isCorrect = checkKQAnswer(userAns, q.correctAnswer);
                                            }
                                            comps.forEach(c => {
                                                if (!compStats[c]) compStats[c] = { total: 0, correct: 0 };
                                                compStats[c].total++;
                                                if (isCorrect) compStats[c].correct++;
                                            });
                                        });
                                        const sortedComps = Object.entries(compStats).sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total));
                                        if (sortedComps.length === 0) return <div className="h-40 flex items-center justify-center text-slate-300 font-black uppercase text-xs tracking-widest italic">Dữ liệu đang được cập nhật...</div>;
                                        return sortedComps.slice(0, 4).map(([name, stats]) => {
                                            const percent = Math.round((stats.correct / stats.total) * 100);
                                            return (
                                                <div key={name} className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-xs font-black text-slate-600 uppercase tracking-tight truncate max-w-[200px]">{name}</span>
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${percent >= 80 ? 'bg-exam-green/10 text-exam-green' : percent >= 50 ? 'bg-exam-blue/10 text-exam-blue' : 'bg-exam-red/10 text-exam-red'}`}>
                                                            {percent}% SẴN SÀNG
                                                        </span>
                                                    </div>
                                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${percent >= 80 ? 'bg-exam-green' : percent >= 50 ? 'bg-exam-blue' : 'bg-exam-red'}`}
                                                        ></motion.div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                    <button 
                                        onClick={() => navigate('/adaptive')}
                                        className="w-full mt-4 py-4 bg-exam-indigo text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <Zap size={16} className="group-hover:animate-pulse"/> Thiết kế lộ trình Adaptive riêng
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Section Summary */}
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden mb-12 animate-in slide-in-from-bottom-8 duration-700">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                                    <Layout size={24} className="text-exam-indigo"/> Tổng quan hiệu suất theo phần thi
                                </h3>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                            <th className="px-10 py-6">Phần thi / Dạng câu hỏi</th>
                                            <th className="px-8 py-6 text-center">Số lượng</th>
                                            <th className="px-8 py-6 text-center">Đúng</th>
                                            <th className="px-8 py-6 text-center">Hiệu suất</th>
                                            <th className="px-10 py-6 text-right">Đánh giá chung</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {['TN', 'TF', 'KQ'].map((type, idx) => {
                                            const sectionQs = questions.filter(q => q.type === type);
                                            if (sectionQs.length === 0) return null;
                                            const correctCount = sectionQs.filter(q => {
                                                const userAns = answers[q.id];
                                                if (!userAns) return false;
                                                if (type === 'TN') return userAns === q.options?.find(o => o.isCorrect)?.id;
                                                if (type === 'TF') {
                                                    let cnt = 0; q.options?.forEach(o => { if ((userAns as any)[o.id] === o.isCorrect) cnt++; });
                                                    return cnt === 4;
                                                }
                                                if (type === 'KQ') {
                                                    return checkKQAnswer(userAns, q.correctAnswer);
                                                }
                                                return false;
                                            }).length;
                                            const percent = Math.round((correctCount / sectionQs.length) * 100);
                                            
                                            let label = '';
                                            let color = '';
                                            if (percent >= 80) { label = 'Xuất sắc'; color = 'text-exam-green bg-exam-green/10'; }
                                            else if (percent >= 50) { label = 'Đạt yêu cầu'; color = 'text-exam-blue bg-exam-blue/10'; }
                                            else { label = 'Cần cải thiện'; color = 'text-exam-red bg-exam-red/10'; }

                                            return (
                                                <tr key={type} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-exam-indigo group-hover:text-white transition-all">{idx + 1}</div>
                                                            <div>
                                                                <div className="text-sm font-extrabold text-slate-800">{type === 'TN' ? 'Trắc nghiệm nhiều lựa chọn' : type === 'TF' ? 'Trắc nghiệm đúng sai' : 'Trắc nghiệm trả lời ngắn'}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dạng {type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center font-bold text-slate-500">{sectionQs.length} câu</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="inline-flex items-center gap-1.5 font-black text-exam-green">
                                                            {correctCount} <span className="text-[10px] text-slate-300">/ {sectionQs.length}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                                <div className="h-full bg-exam-indigo transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 tracking-tighter">{percent}% hoàn thành</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${color}`}>
                                                            {label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                                <button 
                                    onClick={() => { if (submittedResultId) void handleViewHistory({ id: submittedResultId }); }}
                                    className="w-full sm:w-auto min-w-[240px] px-10 py-6 bg-white border-2 border-indigo-600 text-indigo-600 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 hover:text-white transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Eye size={20}/> Xem giải chi tiết
                                </button>
                                <button 
                                    onClick={() => { setMode('DASHBOARD'); clearSvgCache(); }}
                                    className="w-full sm:w-auto min-w-[240px] px-10 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <ArrowLeft size={20}/> Quay lại trang chủ
                                </button>
                            </div>
                    </div>
                </div>
            )}

            {dialogComponent}
        </div>
    );
};
