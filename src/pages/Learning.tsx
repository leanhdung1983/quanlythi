import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Chapter, Unit, LessonSection, UserLessonProgress, SavedMatrix } from '../types';
import { useAuthStore } from '../services/authStore';
import { ChevronRight, PlayCircle, Code, CheckCircle, Save, FileText, BookOpen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MathRenderer } from '../components/MathRenderer';
import { DynamicPractice } from '../components/DynamicPractice';

export const Learning: React.FC = () => {
    const { user } = useAuthStore();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    
    // Selection state
    const [selectedGradeId, setSelectedGradeId] = useState<number>(10);
    const [selectedSubject, setSelectedSubject] = useState<string>('T');
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    
    // Lesson details
    const [sections, setSections] = useState<LessonSection[]>([]);
    const [progress, setProgress] = useState<UserLessonProgress[]>([]);
    const [activeSection, setActiveSection] = useState<LessonSection | null>(null);
    
    // UI state
    const [loading, setLoading] = useState(false);
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const [showAddChapter, setShowAddChapter] = useState(false);
    const [showAddUnit, setShowAddUnit] = useState<number | null>(null);
    const [tempName, setTempName] = useState("");

    const [savedMatrices, setSavedMatrices] = useState<SavedMatrix[]>([]);
    useEffect(() => {
        if (isTeacher) {
            apiService.fetchSavedMatrices().then(setSavedMatrices).catch(console.error);
        }
    }, [isTeacher]);


    // 1. Fetch Hierarchy (Chapters & Units)
    useEffect(() => {
        const fetchNav = async () => {
            const ch = await apiService.fetchChapters();
            const un = await apiService.fetchUnits();
            setChapters(ch);
            setUnits(un);
        };
        fetchNav();
    }, []);

    // 2. Fetch User Progress (if learning)
    useEffect(() => {
        if (user && !isTeacher) {
            apiService.fetchUserLessonProgress(user.id).then(setProgress).catch(console.error);
        }
    }, [user, isTeacher]);

    // 3. Fetch Lesson Sections when a Unit is Selected
    const handleSelectUnit = async (u: Unit) => {
        setSelectedUnit(u);
        setActiveSection(null);
        setLoading(true);
        try {
            const data = await apiService.fetchLessonSections(u.id, user?.id);
            
            const practiceSection: LessonSection = {
                id: -999, // Fake ID
                unit_id: u.id,
                title: 'Bài tập vận dụng',
                content: '',
                video_url: '',
                interactive_html: '',
                order_index: 999,
                created_at: new Date().toISOString(),
                isVirtual: true
            };
            setSections([...data, practiceSection]);
            if (data.length > 0) setActiveSection(data[0]);
            else setActiveSection(practiceSection);

        } catch(e: any) {
            console.error(e);
            alert(e.message || "Lỗi tải bài học. Bạn có thể đã bị giới hạn lượt học.");
            setSelectedUnit(null);
            setSections([]);
            setActiveSection(null);
        }
        setLoading(false);
    };

    const handleProgressUpdate = async (sectionId: number, isCompleted: boolean) => {
        if (!user) return;
        await apiService.updateUserLessonProgress({
            user_id: user.id,
            section_id: sectionId,
            is_completed: isCompleted,
            score: 0
        });
        const updated = await apiService.fetchUserLessonProgress(user.id);
        setProgress(updated);
    };
    
    // Basic Admin Editor internal state
    const [editingSection, setEditingSection] = useState<Partial<LessonSection> | null>(null);

    const handleSaveSection = async () => {
        if (!editingSection || !selectedUnit) return;
        setLoading(true);
        try {
            await apiService.saveLessonSection({
                ...editingSection,
                unit_id: selectedUnit.id,
                order_index: editingSection.order_index || 0
            });
            const data = await apiService.fetchLessonSections(selectedUnit.id, user?.id);
            setSections(data);
            setEditingSection(null);
        } catch(e: any) {
            console.error(e);
            alert(e.message || "Lỗi tải bài học. Bạn có thể đã bị giới hạn lượt học.");
            setSelectedUnit(null);
            setSections([]);
            setActiveSection(null);
        }
        setLoading(false);
    };

    const handleDeleteSection = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xoá mục này?')) return;
        setLoading(true);
        try {
            await apiService.deleteLessonSection(id);
            const data = await apiService.fetchLessonSections(selectedUnit!.id, user?.id);
            setSections(data);
            if (activeSection?.id === id) setActiveSection(null);
        } catch(e: any) {
            console.error(e);
            alert(`Lỗi khi xoá: ${e.message}`);
        }
        setLoading(false);
    };

    const handleAddChapterSubmit = async () => {
        if (!tempName.trim()) return;
        setLoading(true);
        try {
            const displayChaptersLocal = chapters.filter(c => Number(c.id_class) === selectedGradeId && (c.id_subject === selectedSubject || (selectedSubject === 'T' && c.id_subject === 'Toán')));
            await apiService.createChapter({
                gradeCode: selectedGradeId.toString(),
                subjectCode: selectedSubject,
                chapter_number: displayChaptersLocal.length + 1,
                name: tempName
            });
            setTempName('');
            setShowAddChapter(false);
            const ch = await apiService.fetchChapters();
            setChapters(ch);
        } catch(e: any) {
            console.error(e);
            alert(e.message || "Lỗi tải bài học. Bạn có thể đã bị giới hạn lượt học.");
            setSelectedUnit(null);
            setSections([]);
            setActiveSection(null);
        }
        setLoading(false);
    };

    const handleAddUnitSubmit = async (chapterId: number) => {
        if (!tempName.trim()) return;
        setLoading(true);
        try {
            const chapUnits = units.filter(u => u.chapter_id === chapterId);
            await apiService.createUnit({
                chapter_id: chapterId,
                unit_number: chapUnits.length + 1,
                name: tempName
            });
            setTempName('');
            setShowAddUnit(null);
            const un = await apiService.fetchUnits();
            setUnits(un);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleGenerateCurriculum = async () => {
        setLoading(true);
        try {
            await apiService.generateCurriculum(selectedGradeId.toString(), selectedSubject);
            const ch = await apiService.fetchChapters();
            const un = await apiService.fetchUnits();
            setChapters(ch);
            setUnits(un);
            alert("Lên cấu trúc thành công!");
        } catch(e: any) {
            console.error('Failed to generate curriculum', e);
            alert(`Lỗi khi lên cấu trúc: ${e.message || 'Lỗi không xác định'}`);
        }
        setLoading(false);
    };

    const handleGenerateLesson = async (unit: Unit, chapter: Chapter) => {
        setLoading(true);
        try {
            await apiService.generateLessonSections(unit.id, unit.name, chapter.chapter_name, selectedGradeId.toString(), selectedSubject);
            if (selectedUnit?.id === unit.id) {
                // refresh current lesson sections
                const updated = await apiService.fetchLessonSections(unit.id, user?.id);
                
                const practiceSection: LessonSection = {
                    id: -999,
                    unit_id: selectedUnit.id,
                    title: 'Bài tập vận dụng',
                    content: '',
                    video_url: '',
                    interactive_html: '',
                    order_index: 999,
                    created_at: new Date().toISOString(),
                    isVirtual: true
                };
                setSections([...updated, practiceSection]);
                if (updated.length > 0) setActiveSection(updated[0]);
                else setActiveSection(practiceSection);

            }
            alert("Tạo nội dung bài học thành công!");
        } catch(e: any) {
            console.error('Failed to generate lesson', e);
            alert(`Lỗi khi tạo nội dung: ${e.message || 'Lỗi không xác định'}`);
        }
        setLoading(false);
    };

    const grades = [10, 11, 12];
    const subjects = [{id: 'T', name: 'Toán'}, {id: 'V', name: 'Ngữ Văn'}, {id: 'L', name: 'Vật Lý'}, {id: 'H', name: 'Hóa Học'}, {id: 'B', name: 'Sinh Học'}, {id: 'E', name: 'Tiếng Anh'}];
    const displayChapters = chapters.filter(c => Number(c.id_class) === selectedGradeId && (c.id_subject === selectedSubject || (selectedSubject === 'T' && c.id_subject === 'Toán') || (selectedSubject === 'V' && c.id_subject === 'Ngữ văn')));

    // IFrame message listener to capture progress from interactive HTML
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Very simple protocol: If iframe sends { type: 'LESSON_COMPLETE', score: number }
            if (event.data?.type === 'LESSON_COMPLETE') {
                if (activeSection) {
                    if (!user) return;
                    apiService.updateUserLessonProgress({
                        user_id: user.id,
                        section_id: activeSection.id,
                        is_completed: true,
                        score: event.data.score || 0
                    }).then(() => {
                        apiService.fetchUserLessonProgress(user.id).then(setProgress);
                    });
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [activeSection, user]);


    return (
        <div className="h-full flex flex-col sm:flex-row bg-slate-50 overflow-hidden text-slate-800">
            {/* LEFT SIDEBAR: BROWSER */}
            <div className={`w-full sm:w-80 bg-white border-r border-slate-200 shadow-sm flex flex-col shrink-0 transition-transform ${selectedUnit ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100 shrink-0">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        <BookOpen className="inline mr-2 text-blue-500" size={24}/>
                        Giáo trình KNTT
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Lý thuyết & Luyện tập tương tác (AI)</p>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg mt-4 shadow-inner">
                        {grades.map(g => (
                            <button 
                                key={g}
                                onClick={() => { setSelectedGradeId(g); setSelectedChapter(null); }}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${selectedGradeId === g ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Lớp {g}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg mt-2 shadow-inner overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {subjects.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => { setSelectedSubject(s.id); setSelectedChapter(null); }}
                                className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedSubject === s.id ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
                    {displayChapters.map(chap => {
                        const isExpanded = selectedChapter === chap.id;
                        const chapUnits = units.filter(u => u.chapter_id === chap.id);
                        return (
                            <div key={chap.id} className="mb-2">
                                <div className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isExpanded ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-white border border-transparent hover:bg-slate-50 text-slate-700'}`}>
                                    <button 
                                        onClick={() => setSelectedChapter(isExpanded ? null : chap.id)}
                                        className="flex-1 flex items-center justify-between text-left"
                                    >
                                        <span className="font-bold text-sm line-clamp-2 pr-2">Chương {chap.chapter_number}. {chap.chapter_name}</span>
                                        <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`}/>
                                    </button>
                                    {isTeacher && (
                                        <button 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Bạn có chắc muốn xoá chương này? Mọi bài học bên trong cũng sẽ bị xoá.')) {
                                                    try {
                                                        await apiService.deleteChapter(chap.id);
                                                        setChapters(await apiService.fetchChapters());
                                                        setUnits(await apiService.fetchUnits());
                                                        if (selectedChapter === chap.id) setSelectedChapter(null);
                                                    } catch (err: any) {
                                                        alert(`Lỗi khi xoá: ${err.message}`);
                                                    }
                                                }
                                            }}
                                            className="ml-2 shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                                            title="Xoá chương"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-4 pr-1 py-2 space-y-1">
                                                {chapUnits.map(unit => (
                                                    <div key={unit.id} className="flex items-start gap-1">
                                                        <button 
                                                            onClick={() => handleSelectUnit(unit)}
                                                            className={`flex-1 text-left p-2 rounded-lg text-sm transition-colors flex items-start gap-2 ${selectedUnit?.id === unit.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'}`}
                                                        >
                                                            <FileText size={16} className={`shrink-0 mt-0.5 ${selectedUnit?.id === unit.id ? 'text-blue-200' : 'text-slate-400'}`}/>
                                                            <span className="leading-tight">Bài {unit.unit_number}. {unit.unit_name || unit.name}</span>
                                                        </button>
                                                        {isTeacher && (
                                                            <button 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm('Bạn có chắc muốn xoá bài này? Các mục bên trong cũng sẽ bị xoá.')) {
                                                                        try {
                                                                            await apiService.deleteUnit(unit.id);
                                                                            setUnits(await apiService.fetchUnits());
                                                                            if (selectedUnit?.id === unit.id) setSelectedUnit(null);
                                                                        } catch (err: any) {
                                                                            alert(`Lỗi khi xoá: ${err.message}`);
                                                                        }
                                                                    }
                                                                }}
                                                                className="shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                                                                title="Xoá bài học"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {isTeacher && (
                                                    <div className="mt-2">
                                                        {showAddUnit === chap.id ? (
                                                            <div className="bg-white p-2 rounded-lg border border-indigo-200">
                                                                <input autoFocus type="text" placeholder="Tên bài mới..." className="w-full text-sm border border-slate-200 rounded px-2 py-1 mb-2 outline-none focus:border-indigo-400" value={tempName} onChange={e => setTempName(e.target.value)} />
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleAddUnitSubmit(chap.id)} disabled={loading} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded">Lưu</button>
                                                                    <button onClick={() => { setShowAddUnit(null); setTempName(''); }} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded">Huỷ</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => { setShowAddUnit(chap.id); setShowAddChapter(false); setTempName(''); }} className="w-full text-left p-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg">+ Thêm Bài</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                    
                    {isTeacher && (
                        <div className="mt-4 px-1 flex flex-col gap-2">
                            {showAddChapter ? (
                                <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm">
                                    <input autoFocus type="text" placeholder="Tên chương mới..." className="w-full text-sm border border-slate-200 rounded p-2 mb-2 outline-none focus:border-indigo-400" value={tempName} onChange={e => setTempName(e.target.value)} />
                                    <div className="flex gap-2">
                                        <button onClick={handleAddChapterSubmit} disabled={loading} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">Lưu Chương</button>
                                        <button onClick={() => { setShowAddChapter(false); setTempName(''); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-lg transition-colors">Huỷ</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => { setShowAddChapter(true); setShowAddUnit(null); setTempName(''); }} className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 text-sm font-bold rounded-xl transition-colors">
                                    + Thêm Chương
                                </button>
                            )}
                            
                            <button 
                                onClick={handleGenerateCurriculum} 
                                disabled={loading} 
                                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                        Đang tạo... (Có thể mất 1-2 phút)
                                    </>
                                ) : "Lên cấu trúc bằng AI"}
                            </button>
                        </div>
                    )}
                    
                    {displayChapters.length === 0 && !isTeacher && (
                        <div className="text-center p-8 text-slate-400 text-sm">Chưa có dữ liệu chương cho khối lớp này.</div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                {!selectedUnit ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                            <BookOpen size={40} className="text-blue-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-700 mb-2">Chọn Bài Học</h2>
                        <p className="max-w-md">Hãy chọn một chương và một bài học ở menu bên trái để bắt đầu học tập và luyện tập.</p>
                    </div>
                ) : (
                    <>
                        {/* Upper Breadcrumb & Content Headers */}
                        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button className="sm:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg" onClick={() => setSelectedUnit(null)}>
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{chapters.find(c => c.id === selectedUnit.chapter_id)?.chapter_name}</div>
                                    <h1 className="text-lg md:text-xl font-bold text-slate-800 line-clamp-1">Bài {selectedUnit.unit_number}. {selectedUnit.unit_name || selectedUnit.name}</h1>
                                </div>
                            </div>
                            
                            {isTeacher && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            const activeChapter = chapters.find(c => c.id === selectedUnit?.chapter_id);
                                            if (selectedUnit && activeChapter) {
                                                handleGenerateLesson(selectedUnit, activeChapter);
                                            }
                                        }}
                                        disabled={loading}
                                        className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
                                                Đang viết nội dung...
                                            </>
                                        ) : "Tạo Nội Dung Bằng AI"}
                                    </button>
                                    <button 
                                        onClick={() => setEditingSection({ title: 'Mục Mới', content: '', video_url: '', interactive_html: '', isVirtual: false, matrix_id: null })}
                                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                                    >
                                        + Thêm Mục
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Section Navigator */}
                            <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0 overflow-y-auto">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Nội dung bài học ({sections.length})</h3>
                                <div className="space-y-2">
                                    {sections.map((sec, idx) => {
                                        const isActive = activeSection?.id === sec.id;
                                        const isCompleted = progress.find(p => p.section_id === sec.id)?.is_completed;
                                        
                                        return (
                                            <button 
                                                key={sec.id}
                                                onClick={() => setActiveSection(sec)}
                                                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all ${isActive ? 'bg-white shadow-md border border-blue-100' : 'hover:bg-slate-100 border border-transparent'}`}
                                            >
                                                <div className={`mt-0.5 shrink-0 ${isCompleted ? 'text-green-500' : (isActive ? 'text-blue-500' : 'text-slate-300')}`}>
                                                    {isCompleted ? <CheckCircle size={18} /> : (sec.video_url ? <PlayCircle size={18}/> : <Code size={18}/>)}
                                                </div>
                                                <span className={`text-sm font-semibold line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
                                                    {idx + 1}. {sec.title}
                                                </span>
                                            </button>
                                        )
                                    })}
                                    {sections.length === 0 && !loading && (
                                        <div className="text-xs text-slate-400 italic text-center p-4">Bài học này chưa có nội dung.</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Main Active Viewer */}
                            <div className="flex-1 overflow-y-auto bg-slate-100/50 p-4 sm:p-6 custom-scrollbar relative">
                                {loading && !activeSection && <div className="absolute inset-0 z-50 bg-white/50 flex items-center justify-center">Đang tải...</div>}
                                
                                {activeSection ? (
                                    <div className="max-w-4xl mx-auto space-y-6">
                                        
                                        {/* Teacher Controls */}
                                        {isTeacher && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-end gap-2 shadow-sm">
                                                <button onClick={() => setEditingSection(activeSection)} className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-1">Sửa mục này</button>
                                                <button onClick={() => handleDeleteSection(activeSection.id)} className="text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1">Xoá mục này</button>
                                            </div>
                                        )}
                                        
                                        <h2 className="text-2xl font-black text-slate-800">{activeSection.title}</h2>
                                        
                                        {/* Theory Content */}
                                        {activeSection.content && (
                                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                                                <MathRenderer content={activeSection.content} hideToolbar />
                                            </div>
                                        )}
                                        
                                        {/* Video Embed */}
                                        {activeSection.video_url && (
                                            <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-xl border border-slate-800/20">
                                                <iframe 
                                                    src={activeSection.video_url} 
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                ></iframe>
                                            </div>
                                        )}
                                        
                                        {/* Interactive HTML Embed */}
                                        {activeSection.interactive_html && !activeSection.isVirtual && !(!!activeSection.matrix_id) && (
                                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 isolate">
                                                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                                                    <Code size={16} className="text-indigo-500"/>
                                                    <span className="text-sm font-black text-slate-600 tracking-wide">LUYỆN TẬP TƯƠNG TÁC</span>
                                                </div>
                                                <div className="w-full min-h-[500px]">
                                                    <iframe 
                                                        srcDoc={activeSection.interactive_html}
                                                        className="w-full h-[600px] border-none"
                                                        sandbox="allow-scripts"
                                                        title="Interactive Practice"
                                                    ></iframe>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dynamic Practice */}
                                        {(activeSection.isVirtual || !!activeSection.matrix_id) && (
                                            <DynamicPractice unitId={activeSection.unit_id} matrixId={activeSection.matrix_id} />
                                        )}
                                        
                                        {/* Student Manual Completion (Fallback) */}
                                        {!isTeacher && (
                                            <div className="flex justify-center pt-8 pb-12">
                                                <button 
                                                    onClick={() => handleProgressUpdate(activeSection.id, true)}
                                                    className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg ${
                                                        progress.find(p => p.section_id === activeSection.id)?.is_completed 
                                                        ? 'bg-green-100 text-green-700 shadow-green-100/50' 
                                                        : 'bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:scale-105'
                                                    }`}
                                                >
                                                    <CheckCircle size={24} />
                                                    {progress.find(p => p.section_id === activeSection.id)?.is_completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    !loading && sections.length > 0 && <div className="text-center p-8 text-slate-500">Chọn một mục để bắt đầu.</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* ADMIN MODAL */}
            {isTeacher && editingSection && (
                 <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 py-10" onClick={() => setEditingSection(null)}>
                 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                         <h3 className="text-xl font-bold text-slate-800">{editingSection.id ? 'Sửa mục bài học' : 'Thêm mục bài học mới'}</h3>
                     </div>
                     <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề mục</label>
                             <input 
                                 type="text" 
                                 className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                 value={editingSection.title || ''}
                                 onChange={e => setEditingSection({...editingSection, title: e.target.value})}
                             />
                         </div>

                         <div>
                             <label className="flex items-center gap-2 cursor-pointer mb-4">
                                 <input 
                                    type="checkbox" 
                                    checked={!!editingSection.matrix_id}
                                    onChange={e => setEditingSection({...editingSection, matrix_id: e.target.checked ? (savedMatrices[0]?.id || null) : null})}
                                    className="w-5 h-5"
                                 />
                                 <span className="font-bold text-slate-700">Là bài luyện tập (Sinh từ Ma Trận)</span>
                             </label>
                         </div>
                         {!!editingSection.matrix_id && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Chọn Ma Trận Ôn Tập</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2 outline-none"
                                    value={editingSection.matrix_id || ''}
                                    onChange={e => setEditingSection({...editingSection, matrix_id: parseInt(e.target.value)})}
                                >
                                    {savedMatrices.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                         )}
                         {!editingSection.matrix_id && (
                             <>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Nội dung Lý Thuyết (Markdown/LaTeX)</label>
                             <textarea 
                                 rows={6}
                                 className="w-full border border-slate-300 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                 placeholder="Nhập nội dung lý thuyết..."
                                 value={editingSection.content || ''}
                                 onChange={e => setEditingSection({...editingSection, content: e.target.value})}
                             ></textarea>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">URL Video (Youtube Embed Link)</label>
                             <input 
                                 type="text" 
                                 className="w-full border border-slate-300 rounded-xl px-4 py-2 outline-none placeholder:text-slate-300"
                                 placeholder="https://www.youtube.com/embed/..."
                                 value={editingSection.video_url || ''}
                                 onChange={e => setEditingSection({...editingSection, video_url: e.target.value})}
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Interactive HTML Code (Gemini Generated)</label>
                             <textarea 
                                 rows={12}
                                 className="w-full border border-slate-300 rounded-xl px-4 py-3 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                 placeholder="Paste raw HTML here..."
                                 value={editingSection.interactive_html || ''}
                                 onChange={e => setEditingSection({...editingSection, interactive_html: e.target.value})}
                             ></textarea>
                         </div>

                             </>
                         )}
                         <div className="w-1/3">
                             <label className="block text-sm font-bold text-slate-700 mb-1">Thứ tự hiển thị</label>
                             <input 
                                 type="number" 
                                 className="w-full border border-slate-300 rounded-xl px-4 py-2 outline-none"
                                 value={editingSection.order_index || 0}
                                 onChange={e => setEditingSection({...editingSection, order_index: parseInt(e.target.value)})}
                             />
                         </div>
                     </div>
                     <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto">
                         <button onClick={() => setEditingSection(null)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Huỷ bỏ</button>
                         <button onClick={handleSaveSection} disabled={loading} className="px-6 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                             {loading ? 'Đang lưu...' : <><Save size={18}/> Lưu thông tin</>}
                         </button>
                     </div>
                 </div>
             </div>
            )}
        </div>
    );
};
