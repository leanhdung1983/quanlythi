import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../services/authStore';
import { apiService } from '../services/api';
import { 
    Users, Plus, Trash2, KeyRound, BookOpen, Layers, X, BarChart, Download, 
    Settings, Clock, Calendar
} from 'lucide-react';
import { SavedMatrix } from '../types';

interface ClassData {
    id: number;
    name: string;
    code: string;
    created_at: string;
    teacher_name?: string;
}

interface StudentData {
    id: number;
    full_name: string;
    username: string;
    school: string;
    joined_at: string;
}

interface ScoreData {
    student_id: number;
    full_name: string;
    username: string;
    matrix_id: number;
    assignment_name: string;
    attempt_id?: number;
    score: string | number | null;
    submit_time: string | null;
    attempt_index?: number;
}

interface AssignmentData {
    assignment_id: number;
    id: number; // matrix_id
    name: string;
    assigned_at: string;
    matrix_data?: string | any;
    open_time?: string | null;
    deadline?: string | null;
    max_attempts?: number;
    allow_review?: boolean | number;
    completed_attempts?: number;
    status?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'ATTEMPTS_EXHAUSTED';
}

const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

const toInputDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ClassManagement = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
    const [students, setStudents] = useState<StudentData[]>([]);

    const [assignments, setAssignments] = useState<AssignmentData[]>([]);
    const [scores, setScores] = useState<ScoreData[]>([]);

    // Teacher states
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [newStudentId, setNewStudentId] = useState('');
    const [newClassName, setNewClassName] = useState('');
    
    // Student states
    const [joinCode, setJoinCode] = useState('');

    // Assign Modal states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [savedMatrices, setSavedMatrices] = useState<SavedMatrix[]>([]);
    const [selectedMatrixToAssign, setSelectedMatrixToAssign] = useState<SavedMatrix | null>(null);
    const [assignOpenTime, setAssignOpenTime] = useState('');
    const [assignDeadline, setAssignDeadline] = useState('');
    const [assignMaxAttempts, setAssignMaxAttempts] = useState(0);
    const [assignAllowReview, setAssignAllowReview] = useState(true);

    // Edit Assignment LMS states
    const [editingAssignment, setEditingAssignment] = useState<AssignmentData | null>(null);
    const [editOpenTime, setEditOpenTime] = useState('');
    const [editDeadline, setEditDeadline] = useState('');
    const [editMaxAttempts, setEditMaxAttempts] = useState(0);
    const [editAllowReview, setEditAllowReview] = useState(true);

    const loadClasses = async () => {
        if (!user) return;
        try {
            if (isTeacher) {
                const data = await apiService.fetchClasses(user.id);
                setClasses(data || []);
            } else {
                const data = await apiService.fetchStudentClasses(user.id);
                setClasses(data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadClassDetails = async (classId: number) => {
        try {
            const studs = await apiService.fetchClassStudents(classId);
            setStudents(studs || []);
            
            if (isTeacher) {
                const assigns = await apiService.fetchClassAssignments(classId);
                setAssignments(assigns || []);
                const scoreData = await apiService.fetchClassScores(classId);
                setScores(scoreData || []);
            } else {
                if (user?.id) {
                    const studentAssigns = await apiService.fetchStudentClassAssignments(user.id);
                    const filtered = (studentAssigns || []).filter((a: any) => Number(a.class_id) === Number(classId));
                    setAssignments(filtered);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadClasses();
    }, [user]);

    useEffect(() => {
        if (selectedClass) {
            loadClassDetails(selectedClass.id);
        }
    }, [selectedClass]);

    const handleExportExcel = () => {
        if (!selectedClass || scores.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Học sinh,Tài khoản,Bài tập,Điểm,Lần nộp thứ,Thời gian nộp\n";
        
        scores.forEach(s => {
            const dateStr = s.submit_time ? new Date(s.submit_time).toLocaleString('vi-VN') : '';
            csvContent += `"${s.full_name || ''}","${s.username}","${s.assignment_name}",${s.score !== null ? s.score : ''},${s.attempt_index || 0},"${dateStr}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Diem_Lop_${selectedClass.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentId.trim() || !selectedClass) return;
        try {
            const res = await apiService.addStudentToClass(selectedClass.id, newStudentId.trim());
            if (res.success) {
                setNewStudentId('');
                setShowAddStudentModal(false);
                loadClassDetails(selectedClass.id);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi thêm học sinh. Vui lòng kiểm tra lại Email/Tài khoản.");
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim() || !user) return;
        try {
            await apiService.createClass(user.id, newClassName);
            setNewClassName('');
            loadClasses();
        } catch (error) {
            alert('Lỗi tạo lớp học');
        }
    };

    const handleDeleteClass = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xoá lớp này?')) return;
        try {
            await apiService.deleteClass(id);
            if (selectedClass?.id === id) setSelectedClass(null);
            loadClasses();
        } catch (error) {
            alert('Lỗi xoá lớp học');
        }
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim() || !user) return;
        try {
            await apiService.joinClass(user.id, joinCode.trim().toUpperCase());
            setJoinCode('');
            loadClasses();
            alert('Tham gia lớp học thành công!');
        } catch (error: any) {
            alert(error.message || 'Lỗi tham gia lớp');
        }
    };

    const handleRemoveStudent = async (studentId: number) => {
        if (!selectedClass) return;
        if (!confirm('Bạn có chắc muốn xoá học sinh này khỏi lớp?')) return;
        try {
            await apiService.removeStudentFromClass(selectedClass.id, studentId);
            loadClassDetails(selectedClass.id);
        } catch (error) {
            alert('Lỗi xoá học sinh');
        }
    };

    const openAssignModal = async () => {
        try {
            const data = await apiService.fetchSavedMatrices();
            if (data) {
                setSavedMatrices(data);
            }
            setSelectedMatrixToAssign(null);
            setAssignOpenTime('');
            setAssignDeadline('');
            setAssignMaxAttempts(0);
            setAssignAllowReview(true);
            setShowAssignModal(true);
        } catch (error) {
            console.error("Lỗi lấy danh sách đề:", error);
        }
    };

    const handleConfirmAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass || !selectedMatrixToAssign) return;

        if (assignOpenTime && assignDeadline && new Date(assignOpenTime) >= new Date(assignDeadline)) {
            alert("Hạn nộp bài phải diễn ra sau thời gian mở đề.");
            return;
        }

        try {
            await apiService.assignMatrixToClass(selectedClass.id, selectedMatrixToAssign.id, {
                open_time: assignOpenTime ? new Date(assignOpenTime).toISOString() : null,
                deadline: assignDeadline ? new Date(assignDeadline).toISOString() : null,
                max_attempts: assignMaxAttempts,
                allow_review: assignAllowReview
            });
            alert("Đã giao bài tập thành công!");
            loadClassDetails(selectedClass.id);
            setShowAssignModal(false);
            setSelectedMatrixToAssign(null);
        } catch (error: any) {
            alert(error.message || "Lỗi giao bài tập");
        }
    };

    const openEditAssignmentModal = (assignment: AssignmentData) => {
        setEditingAssignment(assignment);
        setEditOpenTime(toInputDateTime(assignment.open_time));
        setEditDeadline(toInputDateTime(assignment.deadline));
        setEditMaxAttempts(assignment.max_attempts || 0);
        setEditAllowReview(assignment.allow_review !== 0 && assignment.allow_review !== false);
    };

    const handleConfirmEditAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass || !editingAssignment) return;

        if (editOpenTime && editDeadline && new Date(editOpenTime) >= new Date(editDeadline)) {
            alert("Hạn nộp bài phải diễn ra sau thời gian mở đề.");
            return;
        }

        try {
            await apiService.updateClassAssignment(editingAssignment.assignment_id, {
                open_time: editOpenTime ? new Date(editOpenTime).toISOString() : null,
                deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
                max_attempts: editMaxAttempts,
                allow_review: editAllowReview
            });
            alert("Cập nhật thông số bài tập thành công!");
            loadClassDetails(selectedClass.id);
            setEditingAssignment(null);
        } catch (error: any) {
            alert(error.message || "Lỗi cập nhật bài tập");
        }
    };

    const handleRemoveAssignment = async (assignmentId: number) => {
        if (!confirm('Bạn có chắc muốn xoá bài tập này khỏi lớp?')) return;
        try {
            await apiService.deleteClassAssignment(assignmentId);
            if (selectedClass) loadClassDetails(selectedClass.id);
        } catch (error) {
            alert('Lỗi xoá bài tập');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <Users className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-slate-800">Lớp học của tôi</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Panel: Class List */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Danh sách lớp</h2>
                        
                        {isTeacher ? (
                            <form onSubmit={handleCreateClass} className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="Tên lớp mới..."
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                                />
                                <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleJoinClass} className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    placeholder="Nhập mã lớp..."
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 uppercase"
                                />
                                <button type="submit" className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    <KeyRound className="w-5 h-5" />
                                </button>
                            </form>
                        )}

                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {classes.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">Chưa có lớp học nào.</p>
                            ) : (
                                classes.map(cls => (
                                    <div 
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls)}
                                        className={`p-3 rounded-xl cursor-pointer border transition-all ${
                                            selectedClass?.id === cls.id 
                                                ? 'bg-indigo-50 border-indigo-200' 
                                                : 'hover:bg-slate-50 border-slate-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{cls.name}</h3>
                                                {isTeacher ? (
                                                    <p className="text-sm text-indigo-600 font-mono mt-1">Mã: {cls.code}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-500 mt-1">GV: {cls.teacher_name}</p>
                                                )}
                                            </div>
                                            {isTeacher && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                                                    className="text-slate-400 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Class Details */}
                <div className="md:col-span-2">
                    {selectedClass ? (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedClass.name}</h2>
                                    {isTeacher && (
                                        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-mono font-bold flex items-center gap-2">
                                            <span>Mã tham gia:</span>
                                            <span className="text-xl tracking-widest">{selectedClass.code}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tabs for Details */}
                                <div className={`grid ${isTeacher ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                    {isTeacher && (
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> Học sinh ({students.length})</h3>
                                            {isTeacher && (
                                                <button onClick={() => setShowAddStudentModal(true)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                                    <Plus className="w-3 h-3" /> Thêm HS
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                                            {students.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">Chưa có học sinh tham gia</p>
                                            ) : (
                                                students.map(s => (
                                                    <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-sm">{s.full_name || s.username}</p>
                                                            <p className="text-xs text-slate-500">{s.school || 'Chưa cập nhật trường'}</p>
                                                        </div>
                                                        {isTeacher && (
                                                            <button onClick={() => handleRemoveStudent(s.id)} className="text-slate-400 hover:text-red-500">
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    )}
                                    
                                    <div className="border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-green-500"/> Bài tập ({assignments.length})</h3>
                                            
                                            {isTeacher && (
                                                <button onClick={openAssignModal} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                                    <Plus className="w-3 h-3" /> Giao bài
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                            {assignments.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">Chưa có bài tập nào</p>
                                            ) : (
                                                assignments.map(a => {
                                                    let duration = 0;
                                                    try {
                                                        const md = typeof a.matrix_data === 'string' ? JSON.parse(a.matrix_data) : a.matrix_data;
                                                        if (md?.duration) duration = md.duration;
                                                    } catch(e){}

                                                    const isLocked = !isTeacher && a.status && a.status !== 'ACTIVE';
                                                    const attemptsDisplay = a.max_attempts && a.max_attempts > 0 
                                                        ? (isTeacher ? `Tối đa: ${a.max_attempts} lần` : `${a.completed_attempts || 0}/${a.max_attempts} lần`) 
                                                        : 'Không giới hạn';

                                                    return (
                                                        <div key={a.assignment_id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-all space-y-2">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <p className="font-bold text-sm text-slate-800">{a.name}</p>
                                                                        {!isTeacher && a.status && (
                                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                                                a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                                                a.status === 'UPCOMING' ? 'bg-amber-100 text-amber-800' :
                                                                                a.status === 'EXPIRED' ? 'bg-rose-100 text-rose-700' :
                                                                                'bg-slate-200 text-slate-700'
                                                                            }`}>
                                                                                {a.status === 'ACTIVE' ? '🟢 Đang mở' :
                                                                                 a.status === 'UPCOMING' ? '🟡 Chưa mở' :
                                                                                 a.status === 'EXPIRED' ? '🔴 Quá hạn' :
                                                                                 '⚪ Hết lượt'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-slate-500">
                                                                        {duration > 0 ? (
                                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">⏱ {duration} phút</span>
                                                                        ) : (
                                                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">∞ Không giới hạn tg</span>
                                                                        )}
                                                                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">🔁 {attemptsDisplay}</span>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.allow_review !== 0 && a.allow_review !== false ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                            {a.allow_review !== 0 && a.allow_review !== false ? '👁️ Cho xem giải' : '🔒 Khoá giải'}
                                                                        </span>
                                                                    </div>
                                                                    {(a.open_time || a.deadline) && (
                                                                        <div className="flex items-center gap-3 flex-wrap mt-1 text-[11px] text-slate-500">
                                                                            {a.open_time && (
                                                                                <span className="flex items-center gap-1 text-slate-600">
                                                                                    <Clock className="w-3 h-3 text-blue-500" /> Mở: {formatDateTime(a.open_time)}
                                                                                </span>
                                                                            )}
                                                                            {a.deadline && (
                                                                                <span className="flex items-center gap-1 text-slate-600">
                                                                                    <Calendar className="w-3 h-3 text-red-500" /> Hạn: {formatDateTime(a.deadline)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    {isTeacher ? (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => openEditAssignmentModal(a)} 
                                                                                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-white transition-colors"
                                                                                title="Cấu hình thông số LMS"
                                                                            >
                                                                                <Settings className="w-4 h-4"/>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleRemoveAssignment(a.assignment_id)} 
                                                                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white transition-colors"
                                                                                title="Xoá bài tập khỏi lớp"
                                                                            >
                                                                                <Trash2 className="w-4 h-4"/>
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <button 
                                                                            disabled={Boolean(isLocked)}
                                                                            onClick={() => navigate('/online-exam', { state: { autoStartMatrixId: a.id } })}
                                                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                                                isLocked 
                                                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95'
                                                                            }`}
                                                                            title={
                                                                                a.status === 'UPCOMING' ? 'Chưa tới giờ mở đề thi' :
                                                                                a.status === 'EXPIRED' ? 'Đã quá hạn nộp bài' :
                                                                                a.status === 'ATTEMPTS_EXHAUSTED' ? 'Đã dùng hết số lượt làm bài' :
                                                                                'Bắt đầu làm bài thi'
                                                                            }
                                                                        >
                                                                            {a.status === 'UPCOMING' ? 'Chưa mở' :
                                                                             a.status === 'EXPIRED' ? 'Quá hạn' :
                                                                             a.status === 'ATTEMPTS_EXHAUSTED' ? 'Hết lượt' :
                                                                             'Vào thi'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Thống kê điểm (Giáo viên) */}
                                {isTeacher && (
                                    <div className="mt-6 border rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2"><BarChart className="w-5 h-5 text-purple-500"/> Thống kê bảng điểm</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                                                    <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Điểm trung bình (Tổng): </span>
                                                    <span className="font-mono font-bold text-purple-700">
                                                        {scores.filter(s => s.score !== null).length > 0 ? (scores.filter(s => s.score !== null).reduce((acc, s) => acc + Number(s.score || 0), 0) / scores.filter(s => s.score !== null).length).toFixed(2) : '0.00'}
                                                    </span>
                                                </div>
                                                <button onClick={handleExportExcel} className="text-sm bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                                    <Download className="w-4 h-4" /> Xuất Excel
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b bg-slate-50 text-sm text-slate-500">
                                                        <th className="p-2">Học sinh</th>
                                                        <th className="p-2">Bài tập</th>
                                                        <th className="p-2 text-center">Lần nộp thứ</th>
                                                        <th className="p-2 text-center">Điểm</th>
                                                        <th className="p-2 text-center">Thời gian</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {scores.length === 0 ? (
                                                        <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Chưa có dữ liệu điểm</td></tr>
                                                    ) : (
                                                        scores.map((s, idx) => (
                                                            <tr key={`${s.student_id}-${s.matrix_id}-${s.attempt_id || idx}`} className="border-b last:border-0 hover:bg-slate-50">
                                                                <td className="p-2">
                                                                    <p className="font-medium">{s.full_name || s.username}</p>
                                                                </td>
                                                                <td className="p-2 text-sm">{s.assignment_name}</td>
                                                                <td className="p-2 text-center text-sm">{s.attempt_index ? `Lần ${s.attempt_index}` : '-'}</td>
                                                                <td className="p-2 text-center font-bold text-indigo-600">{s.score !== null ? Number(s.score).toFixed(2) : '-'}</td>
                                                                <td className="p-2 text-center text-sm text-slate-500">{s.submit_time ? new Date(s.submit_time).toLocaleString('vi-VN') : '-'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400 h-full">
                            <Layers className="w-16 h-16 mb-4 opacity-50" />
                            <p>Chọn một lớp học để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        
            {showAddStudentModal && isTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Thêm Học Sinh</h2>
                            <button onClick={() => setShowAddStudentModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email hoặc Tên tài khoản</label>
                                <input
                                    type="text"
                                    value={newStudentId}
                                    onChange={(e) => setNewStudentId(e.target.value)}
                                    placeholder="Nhập email hoặc username..."
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                                Thêm vào lớp
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && isTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {selectedMatrixToAssign ? `Cấu hình thông số: ${selectedMatrixToAssign.name}` : `Giao bài tập cho lớp: ${selectedClass?.name}`}
                            </h2>
                            <button onClick={() => { setShowAssignModal(false); setSelectedMatrixToAssign(null); }} className="p-2 hover:bg-slate-200 rounded-full">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        
                        {!selectedMatrixToAssign ? (
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                <p className="text-xs text-slate-500 mb-2">Chọn đề thi từ danh sách ma trận đã tạo của bạn để cấu hình và giao cho học sinh:</p>
                                {(() => {
                                    const availableMatrices = savedMatrices.filter(m => !assignments.some(a => a.id === m.id));
                                    if (availableMatrices.length === 0) {
                                        return <p className="text-center text-slate-500 py-10">Không còn bài tập nào mới để giao cho lớp này.</p>;
                                    }
                                    return availableMatrices.map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{m.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1">Ngày tạo: {new Date(m.created_at).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSelectedMatrixToAssign(m);
                                                    setAssignOpenTime('');
                                                    setAssignDeadline('');
                                                    setAssignMaxAttempts(0);
                                                    setAssignAllowReview(true);
                                                }}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-all"
                                            >
                                                Chọn & Cấu hình
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmAssign} className="p-6 overflow-y-auto space-y-4 flex-1">
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Đề thi được chọn</p>
                                    <p className="font-bold text-slate-800 text-base">{selectedMatrixToAssign.name}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                                            Thời gian mở đề (Bắt đầu)
                                        </label>
                                        <input 
                                            type="datetime-local"
                                            value={assignOpenTime}
                                            onChange={(e) => setAssignOpenTime(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">Để trống nếu muốn mở ngay cho học sinh</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-red-600" />
                                            Hạn nộp bài (Kết thúc)
                                        </label>
                                        <input 
                                            type="datetime-local"
                                            value={assignDeadline}
                                            onChange={(e) => setAssignDeadline(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">Để trống nếu không giới hạn hạn nộp</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Số lượt làm bài tối đa
                                        </label>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={assignMaxAttempts}
                                            onChange={(e) => setAssignMaxAttempts(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            placeholder="0 = Không giới hạn"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">Nhập 0 để cho phép làm bài không giới hạn</p>
                                    </div>

                                    <div className="flex flex-col justify-center">
                                        <label className="text-xs font-bold text-slate-700 mb-2">Xem giải & đáp án</label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border transition-colors">
                                            <input 
                                                type="checkbox"
                                                checked={assignAllowReview}
                                                onChange={(e) => setAssignAllowReview(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-medium text-slate-700">Cho phép học sinh xem lời giải chi tiết sau khi nộp</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedMatrixToAssign(null)}
                                        className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        Quay lại
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all"
                                    >
                                        Xác nhận giao bài
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Assignment LMS Settings Modal */}
            {editingAssignment && isTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Cấu hình thông số bài tập</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{editingAssignment.name}</p>
                            </div>
                            <button onClick={() => setEditingAssignment(null)} className="p-2 hover:bg-slate-200 rounded-full">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleConfirmEditAssignment} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        Thời gian mở đề (Bắt đầu)
                                    </label>
                                    <input 
                                        type="datetime-local"
                                        value={editOpenTime}
                                        onChange={(e) => setEditOpenTime(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Để trống nếu mở ngay</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-red-600" />
                                        Hạn nộp bài (Kết thúc)
                                    </label>
                                    <input 
                                        type="datetime-local"
                                        value={editDeadline}
                                        onChange={(e) => setEditDeadline(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Để trống nếu không giới hạn</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Số lượt làm bài tối đa
                                    </label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={editMaxAttempts}
                                        onChange={(e) => setEditMaxAttempts(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="0 = Không giới hạn"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">0 = Không giới hạn lượt làm</p>
                                </div>

                                <div className="flex flex-col justify-center">
                                    <label className="text-xs font-bold text-slate-700 mb-2">Xem giải & đáp án</label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border transition-colors">
                                        <input 
                                            type="checkbox"
                                            checked={editAllowReview}
                                            onChange={(e) => setEditAllowReview(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-medium text-slate-700">Cho phép xem lời giải sau khi nộp bài</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingAssignment(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
