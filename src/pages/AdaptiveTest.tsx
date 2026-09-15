
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { 
    Zap, Brain, Target, ArrowRight, Loader2, 
    CheckCircle2, RefreshCw, BookOpen, Timer, Award, ChevronRight, ChevronLeft,
    AlertTriangle, Info, Sparkles, ArrowLeft, Clock, Play, List, Expand, LayoutList, X, User, Flag, ShieldCheck, Minus, Plus, Layout, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OnlineQuestion, QuestionType } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { checkKQAnswer } from '../utils/gradeHelper';
import { parseQuestionContent, shuffleArray } from '../utils/latexParser';

export const AdaptiveTest: React.FC = () => {
    const { user } = useAuthStore();
    const [questions, setQuestions] = useState<OnlineQuestion[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [step, setStep] = useState<'intro' | 'generating' | 'ready' | 'taking' | 'result' | 'review'>('intro');
    const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
    const [showSidebar, setShowSidebar] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const handleFontSize = (delta: number) => setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
    const toggleMarkForReview = (qId: string) => setMarkedForReview(prev => ({...prev, [qId]: !prev[qId]}));
    const typeNames: Record<string, string> = { TN: "Trắc nghiệm", TF: "Đúng/Sai", KQ: "Trả lời ngắn", TL: "Tự luận" };
    
    // Exam State
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, unknown>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [score, setScore] = useState(0);
    const [currentExamSessionId, setCurrentExamSessionId] = useState<number | null>(null);

    // AI Features State
    const [aiExplanationForQ, setAiExplanationForQ] = useState<number | null>(null);
    const [aiExplanationContent, setAiExplanationContent] = useState<string>('');
    const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
    const [aiSimilarQ, setAiSimilarQ] = useState<(OnlineQuestion & { originalId?: number }) | null>(null);
    const [aiSimilarQAnswer, setAiSimilarQAnswer] = useState<any>(null);

    // Custom Dialog State
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
        onCancel?: () => void;
        isAlert?: boolean;
    }>({ isOpen: false, title: '', message: '' });

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        setDialog({ isOpen: true, title, message, onConfirm, onCancel, isAlert: false });
    }, []);

    // --- PROGRESS PERSISTENCE ---
    useEffect(() => {
        if (step === 'taking' && questions.length > 0) {
            const state = {
                questions,
                answers,
                timeLeft,
                currentQIdx,
                currentExamSessionId,
                startTime: Date.now()
            };
            try {
                localStorage.setItem('adaptive_test_progress', JSON.stringify(state));
            } catch (e) {
                console.error("LocalStorage save failed", e);
            }
        } else if (step === 'intro' || step === 'result') {
            if (step === 'result') {
                localStorage.removeItem('adaptive_test_progress');
            }
        }
    }, [step, questions, answers, timeLeft, currentQIdx, currentExamSessionId]);

    // Resume Check on Mount
    useEffect(() => {
        const saved = localStorage.getItem('adaptive_test_progress');
        if (saved && step === 'intro') {
            try {
                const state = JSON.parse(saved);
                if (Date.now() - state.startTime < 4 * 60 * 60 * 1000) {
                    showConfirm(
                        "Tiếp tục bài ôn tập?",
                        "Bạn có một bài ôn tập đang làm dở. Bạn có muốn tiếp tục không?",
                        () => {
                            setQuestions(state.questions);
                            setAnswers(state.answers);
                            setTimeLeft(state.timeLeft);
                            setCurrentQIdx(state.currentQIdx);
                            setCurrentExamSessionId(state.currentExamSessionId || null);
                            setStep('taking');
                        },
                        () => {
                            localStorage.removeItem('adaptive_test_progress');
                        }
                    );
                }
            } catch (e) {
                console.error("Error resuming adaptive test", e);
                localStorage.removeItem('adaptive_test_progress');
            }
        }
    }, [step]);

    const generateTest = async () => {
        if (!user) return;
        setStep('generating');
        try {
            const res = await apiService.generateAdaptiveTest(user.id);
            if (res.success) {
                const parsed = res.data.map((q: OnlineQuestion) => parseQuestionContent(q));
                setQuestions(parsed);
                setAiAnalysis(res.ai_analysis || '');
                setStep('ready');
            }
        } catch (e) {
            console.error(e);
            setStep('intro');
        }
    };

    const startExam = async () => {
        if (!user) return;
        try {
            const session = await apiService.startExamSession({
                exam_title: 'Ôn tập Adaptive',
                questions,
                duration_seconds: questions.length * 2 * 60
            });
            if (!session?.id) throw new Error('Không tạo được phiên thi');
            setCurrentExamSessionId(session.id);
        } catch (error) {
            console.error(error);
            return;
        }
        setAnswers({});
        setCurrentQIdx(0);
        setTimeLeft(questions.length * 2 * 60); // 2 mins per question
        setStep('taking');
    };

    const finishExam = useCallback(async () => {
        let totalPoints = 0;
        questions.forEach(q => {
            const userAns = answers[q.id];
            const pts = 10 / questions.length;
            if (q.type === 'TN' && userAns === q.options.find(o => o.isCorrect)?.id) totalPoints += pts;
            else if (q.type === 'TF' && userAns) {
                let correctCount = 0; q.options.forEach(o => { if (userAns[o.id] === o.isCorrect) correctCount++; });
                totalPoints += (pts * (correctCount / 4));
            } else if (q.type === 'KQ') {
                if (checkKQAnswer(userAns, q.correctAnswer)) totalPoints += pts;
            }
        });
        setScore(Math.round(totalPoints * 100) / 100);
        setStep('result');
        
        // Save result if needed
        if (user) {
            try {
                await apiService.saveExamResult({
                    id: currentExamSessionId,
                    user_id: user.id,
                    exam_title: "Ôn tập Adaptive",
                    score: Math.round(totalPoints * 100) / 100,
                    duration_seconds: (questions.length * 2 * 60) - timeLeft,
                    questions,
                    answers
                });
                setCurrentExamSessionId(null);
            } catch (e) { console.error(e); }
        }
    }, [questions, answers, user, timeLeft, currentExamSessionId]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (step === 'taking' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { clearInterval(timer); finishExam(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft, finishExam]);

    // --- EXIT HANDLING ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && step === 'taking') {
                const state = {
                    questions, answers, timeLeft, currentQIdx,
                    startTime: Date.now()
                };
                try { localStorage.setItem('adaptive_test_progress', JSON.stringify(state)); } catch(e) { console.error(e); }
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (step === 'taking') {
                e.preventDefault();
                e.returnValue = 'Bạn có chắc chắn muốn thoát? Tiến trình làm bài sẽ được lưu lại.';
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [step, questions, answers, timeLeft, currentQIdx]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleAnswer = (val: unknown) => { setAnswers(prev => ({ ...prev, [questions[currentQIdx].id]: val })); };
    const handleTFAnswer = (optId: string, isTrue: boolean) => {
        setAnswers(prev => {
            const currentAns = (prev[questions[currentQIdx].id] || {}) as Record<string, boolean>;
            return { ...prev, [questions[currentQIdx].id]: { ...currentAns, [optId]: isTrue } };
        });
    };

    const checkIsCorrectForReview = (q: OnlineQuestion, userAns: any) => {
        if (!userAns && q.type !== 'TF') return false; 
        if (q.type === 'TN') {
            return userAns === q.options?.find(o => o.isCorrect)?.id;
        } else if (q.type === 'TF') {
            if (!userAns) return false;
            let correctCount = 0;
            q.options?.forEach(o => { if (userAns[o.id] === o.isCorrect) correctCount++; });
            return correctCount === 4;
        } else if (q.type === 'KQ') {
            return checkKQAnswer(userAns, q.correctAnswer);
        }
        return false;
    };

    const handleAskAIExplain = async (q: OnlineQuestion) => {
        if (aiExplanationForQ === q.id && aiExplanationContent) return; 
        setIsGeneratingAI(true);
        setAiExplanationForQ(q.id);
        setAiSimilarQ(null); 
        
        try {
            let correctAns = q.correctAnswer;
            if (q.type === 'TN') correctAns = q.options?.find(o => o.isCorrect)?.content || 'Không rõ';
            else if (q.type === 'TF') correctAns = q.options?.map(o => `${o.content} - ${o.isCorrect ? 'Đúng' : 'Sai'}`).join('; ');
            
            let userAnsStr = answers[q.id]?.toString();
            if (q.type === 'TF') {
                const ua = answers[q.id] as any;
                if (ua) userAnsStr = q.options?.map(o => `${o.content} - ${ua[o.id] ? 'Đúng' : 'Sai'}`).join('; ');
            } else if (q.type === 'TN') {
                userAnsStr = answers[q.id] ? q.options?.find(o => o.id === answers[q.id])?.content : 'Không chọn';
            }
            
            const res = await apiService.aiExplain(q.original_latex || q.content, userAnsStr || 'Không có', correctAns || 'Không rõ');
            if (res.success) setAiExplanationContent(res.explanation);
        } catch (e) {
            console.error(e);
            setAiExplanationContent("Lỗi khi kết nối với AI. Vui lòng thử lại sau.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleAIGenerateSimilar = async (q: OnlineQuestion) => {
        setIsGeneratingAI(true);
        setAiSimilarQ({ originalId: q.id } as any); 
        setAiExplanationForQ(null); 
        
        try {
            const res = await apiService.aiGenerateSimilar(q.original_latex || q.content, q.type);
            if (res.success) {
                const parsed = parseQuestionContent({
                    id: Date.now(),
                    id_full: q.id_full,
                    type: q.type,
                    content: res.latex,
                    original_latex: res.latex,
                    raw_latex: res.latex,
                    options: []
                });
                setAiSimilarQ({ ...parsed, originalId: q.id });
                setAiSimilarQAnswer(null);
            }
        } catch (e) {
            console.error(e);
            setAiSimilarQ(null);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const reconstructExTest = (q: OnlineQuestion, includeSolution = false) => {
        let content = q.content || q.raw_latex || "";
        // Remove existing ex/bt/vd environments if present to avoid nesting
        content = content.replace(/\\begin\{(ex|bt|vd)\}/gi, "").replace(/\\end\{(ex|bt|vd)\}/gi, "").trim();

        const isReview = step === 'review';
        const showAnswers = isReview || includeSolution;

        if (q.type === QuestionType.TN && q.options) {
            let latex = `\\begin{ex}\n${content}\n\\choice`;
            q.options.forEach(opt => {
                const marker = showAnswers && opt.isCorrect ? '\\True ' : '';
                latex += `{${marker}${opt.content}}`;
            });
            if (includeSolution && q.solution) {
                latex += `\n\\loigiai{${q.solution}}`;
            }
            latex += `\n\\end{ex}`;
            return latex;
        }
        if (q.type === QuestionType.TF && q.options) {
            let latex = `\\begin{ex}\n${content}\n\\choiceTF`;
            q.options.forEach(opt => {
                const marker = showAnswers && opt.isCorrect ? '\\True ' : '';
                latex += `{${marker}${opt.content}}`;
            });
            if (includeSolution && q.solution) {
                latex += `\n\\loigiai{${q.solution}}`;
            }
            latex += `\n\\end{ex}`;
            return latex;
        }
        if (q.type === QuestionType.KQ) {
            let latex = `\\begin{ex}\n${content}`;
            if (q.correctAnswer) {
                latex += `\n\\shortans{${q.correctAnswer}}`;
            }
            if (includeSolution && q.solution) {
                latex += `\n\\loigiai{${q.solution}}`;
            }
            latex += `\n\\end{ex}`;
            return latex;
        }
        return `\\begin{ex}\n${content}\n\\end{ex}`;
    };

    const currentQ = questions[currentQIdx];

    if (step === 'taking' || step === 'review') {
        const isReview = step === 'review';
        const currentQ = questions[currentQIdx];
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

                            if (isReview) {
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
                                            onClick={() => !isReview && handleTFAnswer(opt.id, true)}
                                            className={`min-w-[56px] h-7 rounded-lg font-black text-[9px] transition-all border flex items-center justify-center gap-1 ${trueBtnStyle}`}
                                        >
                                            {userChoice === true && <ShieldCheck size={10}/>} ĐÚNG
                                        </button>
                                        <button 
                                            onClick={() => !isReview && handleTFAnswer(opt.id, false)}
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
                        
                        if (isReview) {
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
                                onClick={() => !isReview && handleAnswer(opt.id)}
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
                                {isSelected && !isReview && (
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
                            onChange={(e) => !isReview && handleAnswer(e.target.value)} 
                            disabled={isReview}
                        />
                        {!isReview && (
                            <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Hãy nhập chính xác giá trị số hoặc biểu thức rút gọn
                            </p>
                        )}
                        {isReview && (
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
                            onChange={(e) => !isReview && handleAnswer(e.target.value)} 
                            disabled={isReview}
                        />
                    </div>
                </div>
            );
        }

    };

    return (
        <div className="fixed inset-0 flex flex-col bg-white overflow-hidden z-[100]">
            <header className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 flex justify-between items-center shadow-sm z-30 sticky top-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { 
                            showConfirm("Thoát bài thi?", "Tiến trình của bạn sẽ được lưu lại (nếu là bài tự luyện). Bạn có chắc chắn muốn quay lại?", () => { setStep('intro');  });
                        }} 
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200 active:scale-95"
                    >
                        <ArrowLeft size={16}/>
                    </button>
                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                    <div className="min-w-0">
                        <h2 className="font-extrabold text-sm text-slate-800 line-clamp-1 tracking-tight flex items-center gap-2">
                            <BookOpen className="text-orange-500 shrink-0" size={14}/>
                            <span className="truncate">{"Ôn tập Adaptive"}</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-0.5">
                            <div className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-lg border border-slate-200">
                                {currentQIdx + 1} / {questions.length}
                            </div>
                            {isReview ? (
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

                <div className="flex items-center gap-2">
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

                    {!isReview && (
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

                    

                    {!isReview && (
                        <button 
                            onClick={() => { 
                                showConfirm(
                                    "Nộp bài?", 
                                    "Bạn còn " + formatTime(timeLeft) + " để kiểm tra lại. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?", 
                                    () => finishExam()
                                ); 
                            }} 
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-black text-[11px] shadow-lg shadow-orange-500/30 transition-all active:scale-95 uppercase tracking-widest border border-orange-400/50"
                        >
                            Nộp bài
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                
                <main className="flex-1 overflow-y-auto px-4 py-2 md:px-6 md:py-4 custom-scrollbar bg-slate-50 exam-grid-pattern">
                    <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentQ && (
                            <div className="space-y-3">
                                {/* Section Header */}
                                <div className="flex items-center gap-2">
                                    <div className="bg-exam-indigo/10 text-exam-indigo px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-exam-indigo/20 flex items-center gap-1.5">
                                        
                                        "Câu hỏi"
                                    </div>
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                </div>

                                {/* Question Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 md:p-5">
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
                                            {isReview && currentQ.solution && (
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
                                    {Object.keys(answers).length}
                                    <span className="text-sm font-bold text-slate-300 ml-1">/ {questions.length}</span>
                                </div>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-exam-orange transition-all duration-1000 ease-out"
                                        style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
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
                                                const isAns = answers[q.id] !== undefined && (q.type === 'TF' ? Object.keys(answers[q.id] as any).length > 0 : answers[q.id] !== '');
                                                const isActive = i === currentQIdx;
                                                const isMarked = markedForReview[q.id];
                                                
                                                let btnCls = "h-11 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-center relative ";
                                                
                                                if (isReview) {
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

                        {!isReview && (
                            <div className="p-6 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Hoàn thành</div>
                                        <div className="text-xl font-black text-slate-800">{Object.keys(answers).length}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Phê duyệt lại</div>
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
        </div>
    );
}
    if (step === 'result') {
        return (
            <div className="h-full w-full overflow-y-auto bg-slate-50 flex flex-col p-6 animate-in zoom-in duration-500">
                <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 text-center relative overflow-hidden my-auto mx-auto">
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Award size={48}/>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Hoàn thành!</h2>
                    <p className="text-slate-400 text-sm mb-8">Bạn đã hoàn thành bài ôn tập cá nhân hóa.</p>
                    
                    <div className="bg-slate-50 rounded-3xl p-8 mb-8 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm số của bạn</div>
                        <div className="text-7xl font-black text-indigo-600 tracking-tighter">{Number(score || 0).toFixed(1)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setStep('review')}
                            className="py-4 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                        >
                            Xem lại
                        </button>
                        <button 
                            onClick={() => setStep('intro')}
                            className="py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                        >
                            Tiếp tục
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderQuestionPreview = (q: OnlineQuestion, idx: number) => {
        return (
            <div key={q.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-widest">CÂU {idx + 1}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{q.id_full}</span>
                </div>
                <div className="text-slate-800 mb-4 text-xl md:text-2xl">
                    <MathRenderer content={q.content} mode="question" isExTest={true} />
                </div>
                {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                        {q.options.map(opt => (
                            <div key={opt.id} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="font-bold text-slate-400">{opt.id}.</span>
                                <MathRenderer content={opt.content} mode="all" isExTest={true} />
                            </div>
                        ))}
                    </div>
                )}
                {q.type === QuestionType.KQ && q.correctAnswer && (
                    <div className="ml-4 text-sm text-slate-400 italic">
                        (Câu hỏi trả lời ngắn)
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col">
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 py-12 px-6 my-auto">
            {step === 'intro' && (
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex p-4 bg-indigo-100 rounded-2xl text-indigo-600 mb-4">
                        <Zap size={48} fill="currentColor"/>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        Lộ trình Ôn tập Cá nhân hóa
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Hệ thống AI sẽ phân tích các bài thi gần đây của bạn, tìm ra các lỗ hổng kiến thức (Dạng bài ID6) và tự động tạo đề thi khắc phục điểm yếu.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-12">
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-indigo-500 mb-2"><Brain size={24}/></div>
                            <h3 className="font-bold text-slate-800 mb-1">Phân tích AI</h3>
                            <p className="text-xs text-slate-500">Dò tìm các dạng bài bạn thường xuyên làm sai.</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-emerald-500 mb-2"><Target size={24}/></div>
                            <h3 className="font-bold text-slate-800 mb-1">Đúng trọng tâm</h3>
                            <p className="text-xs text-slate-500">Lấy chính xác các câu hỏi cùng chuẩn ID6 đó.</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-amber-500 mb-2"><Zap size={24}/></div>
                            <h3 className="font-bold text-slate-800 mb-1">Tăng tốc</h3>
                            <p className="text-xs text-slate-500">Tiết kiệm 70% thời gian so với ôn tập đại trà.</p>
                        </div>
                    </div>

                    <button 
                        onClick={generateTest}
                        className="mt-8 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto text-lg"
                    >
                        Bắt đầu Phân tích & Tạo đề <ArrowRight size={20}/>
                    </button>
                </div>
            )}

            {step === 'generating' && (
                <div className="text-center space-y-6">
                    <div className="relative">
                        <Loader2 size={80} className="text-indigo-500 animate-spin mx-auto opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain size={32} className="text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Đang phân tích dữ liệu học tập...</h2>
                    <div className="max-w-xs mx-auto space-y-3">
                        <div className="flex items-center gap-3 text-sm text-emerald-600 font-medium">
                            <CheckCircle2 size={16}/> Đã quét lịch sử thi (3 bài gần nhất)
                        </div>
                        <div className="flex items-center gap-3 text-sm text-emerald-600 font-medium">
                            <CheckCircle2 size={16}/> Đã xác định 4 dạng bài yếu
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 animate-pulse">
                            <RefreshCw size={16} className="animate-spin"/> Đang truy xuất ngân hàng câu hỏi...
                        </div>
                    </div>
                </div>
            )}

            {step === 'ready' && (
                <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">Đề thi Khắc phục Điểm yếu</h2>
                            <p className="text-slate-500">Dựa trên phân tích: Bạn đang gặp khó khăn ở một số dạng bài quan trọng.</p>
                        </div>
                        <button 
                            onClick={startExam}
                            className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 flex items-center gap-2 transition-all hover:-translate-y-1 w-full md:w-auto justify-center"
                        >
                            Bắt đầu thi ngay <Zap size={18} fill="currentColor"/>
                        </button>
                    </div>

                    {aiAnalysis && (
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Brain size={120}/>
                            </div>
                            <div className="relative z-10 flex gap-4">
                                <div className="mt-1 shrink-0">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Sparkles size={20}/>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-indigo-900 mb-2">Phân tích từ Gia sư AI</h3>
                                    <div className="text-indigo-800/80 leading-relaxed font-medium whitespace-pre-wrap">
                                        {aiAnalysis}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-slate-600 font-black text-xs uppercase tracking-widest">
                            <BookOpen size={18}/> Danh sách câu hỏi được chọn lọc ({questions.length} câu)
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {questions.map((q, idx) => renderQuestionPreview(q, idx))}
                        </div>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => setStep('intro')}
                            className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700"
                        >
                            Quay lại
                        </button>
                        <button 
                            onClick={generateTest}
                            className="px-6 py-3 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                            Tạo đề khác
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Dialog Component */}
            <AnimatePresence>
                {dialog.isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
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
                    </div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
};
