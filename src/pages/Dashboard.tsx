
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    FileQuestion, BookOpen, Layers, Loader2, Plus, 
    ArrowRight, Zap, Tag, GraduationCap, 
    Clock, BarChart3, BrainCircuit,
    Sigma, FunctionSquare, Target, Sparkles,
    CheckCircle2
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLanguageStore } from '../services/languageStore';
import { useAuthStore } from '../services/authStore';
import { X, Lock, Check } from 'lucide-react';

// --- Styled Components ---

const MathBackground = () => (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40" 
         style={{ 
             backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
         }}>
    </div>
);


const FreeUpgradeModal = ({ onClose, role }: { onClose: () => void, role: string }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles size={20} /> Nâng Cấp Tài Khoản Pro
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                <div className="p-6">
                    {role === 'STUDENT' ? (
                        <>
                            <p className="text-slate-600 mb-4 font-medium">Tài khoản hiện tại của bạn là <strong className="text-slate-800">Miễn phí (Học sinh)</strong>. Bạn sẽ bị giới hạn chức năng:</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3">
                                    <Lock size={18} className="text-slate-400 mt-0.5" />
                                    <span className="text-slate-700 text-sm">Chỉ được 2 lần thi (Real) và 2 lần ôn tập (Practice/Adaptive) mỗi ngày.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Lock size={18} className="text-slate-400 mt-0.5" />
                                    <span className="text-slate-700 text-sm">Chỉ được học phần bài giảng đầu tiên của mỗi chương trong hệ thống.</span>
                                </li>
                            </ul>
                            
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                                <h3 className="font-bold text-indigo-800 mb-2">Quyền lợi khi đăng ký PRO:</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-indigo-700 text-sm"><Check size={16} /> Học bài giảng lý thuyết không giới hạn</li>
                                    <li className="flex items-center gap-2 text-indigo-700 text-sm"><Check size={16} /> Thi và luyện tập trắc nghiệm không giới hạn</li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-indigo-200 flex items-center justify-between">
                                    <span className="text-slate-600 text-sm font-medium">Mức phí đăng ký:</span>
                                    <span className="text-xl font-black text-indigo-600">199.000đ</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-slate-600 mb-4 font-medium">Tài khoản hiện tại của bạn là <strong className="text-slate-800">Miễn phí (Giáo viên)</strong>. Bạn sẽ bị giới hạn:</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3">
                                    <Lock size={18} className="text-slate-400 mt-0.5" />
                                    <span className="text-slate-700 text-sm">Chỉ có thể xem và thêm các câu hỏi.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Lock size={18} className="text-slate-400 mt-0.5" />
                                    <span className="text-slate-700 text-sm">Có thể tạo ma trận nhưng <strong className="text-red-500">không thể tải được mã nguồn</strong> các câu hỏi/đề thi.</span>
                                </li>
                            </ul>
                            
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
                                <h3 className="font-bold text-purple-800 mb-2">Quyền lợi khi đăng ký PRO:</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-purple-700 text-sm"><Check size={16} /> Tải đề thi DOCX / LaTeX mã nguồn gốc</li>
                                    <li className="flex items-center gap-2 text-purple-700 text-sm"><Check size={16} /> Quản lý nội dung đầy đủ</li>
                                </ul>
                            </div>
                        </>
                    )}
                    <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Đã hiểu & Tiếp tục dùng Free
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: number, icon: React.ElementType, color: string, trend?: string }) => {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    };
    
    const styleClass = colorMap[color] || colorMap['blue'];

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 duration-500`}>
                <Icon size={100} className="text-current" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${styleClass} shadow-sm`}>
                        <Icon size={24} />
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-800 mb-1">{value.toLocaleString()}</h3>
                    <p className="text-sm font-bold text-slate-400">{title}</p>
                    {trend && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
                            <Sparkles size={10} className="text-yellow-500"/> {trend}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuickActionCard = ({ to, title, desc, icon: Icon, color }: { to: string, title: string, desc: string, icon: React.ElementType, color: string }) => (
    <NavLink to={to} className="flex items-center gap-4 p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{title}</h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">{desc}</p>
        </div>
        <div className="bg-slate-50 rounded-full p-2 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
            <ArrowRight size={16} />
        </div>
    </NavLink>
);

const GradeProgressBar = ({ label, count, total, colorClass }: { label: string, count: number, total: number, colorClass: string }) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-600">{label}</span>
                <span className="text-xs font-black text-slate-800">{count}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-100">
                <div 
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out relative`} 
                    style={{ width: `${percent}%` }}
                >
                    {percent > 5 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30"></div>}
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { t } = useLanguageStore();
    const [showUpgrade, setShowUpgrade] = useState(false);
    
    useEffect(() => {
        if (user && !user.is_pro && user.role !== 'ADMIN') {
            const hasSeen = sessionStorage.getItem('upgradeModalShown');
            if (!hasSeen) {
                setShowUpgrade(true);
                sessionStorage.setItem('upgradeModalShown', 'true');
            }
        }
    }, [user]);
    
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [longLoading, setLongLoading] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => { if (loading) setLongLoading(true); }, 2000);
        const loadStats = async () => {
            try {
                if (user?.role === 'STUDENT') {
                    const data = await apiService.fetchStudentDashboardStats(user.id);
                    if (data) setStats(data);
                    else setError("No data received");
                } else {
                    const data = await apiService.fetchStats();
                    if (data) setStats(data);
                    else setError("No data received");
                }
            } catch (e: any) {
                setError(e.message || "Error loading data");
            } finally {
                setLoading(false);
                setLongLoading(false);
                clearTimeout(timer);
            }
        };
        loadStats();
        
        return () => {
            clearTimeout(timer);
        };
    }, [user?.role, user?.id]);

    if (loading) {
        return <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-400">
            <Loader2 className="animate-spin text-indigo-500" size={48}/>
            <div className="text-center">
                <p className="font-bold text-slate-700">{longLoading ? "Đang đánh thức server..." : "Đang tải..."}</p>
                {longLoading && <p className="text-xs mt-2 text-slate-400">Server Free Tier có thể mất tới 60s để khởi động.</p>}
            </div>
        </div>;
    }

    if (!stats) return <div className="p-10 text-center text-red-500">{error || "Lỗi kết nối"}</div>;

    // --- Data Processing ---
    const levelConfig: Record<string, { color: string, label: string, bg: string }> = { 
        'N': { color: '#4ade80', label: 'Nhận biết', bg: 'bg-green-100' }, 
        'H': { color: '#60a5fa', label: 'Thông hiểu', bg: 'bg-blue-100' }, 
        'V': { color: '#facc15', label: 'Vận dụng', bg: 'bg-yellow-100' }, 
        'C': { color: '#f87171', label: 'Vận dụng cao', bg: 'bg-red-100' },
        'Unknown': { color: '#cbd5e1', label: 'Chưa phân loại', bg: 'bg-slate-100' }
    };
    
    const pieData = (stats.levelDistribution || []).map((l: any) => ({
        name: levelConfig[l.id_level]?.label || l.id_level,
        value: l.count,
        id: l.id_level,
        color: levelConfig[l.id_level]?.color || '#94a3b8'
    })).filter((d: any) => d.value > 0);

    if (user?.role === 'STUDENT') {
        return (
            <div className="h-full w-full overflow-y-auto custom-scrollbar pr-2 pb-20 relative">
                <MathBackground />
                <div className="relative z-10 space-y-8 p-1">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-indigo-100 rounded-full shadow-sm mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hệ thống Toán học ID6</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                Xin chào, <span className="text-indigo-600">{user.full_name || user.username}</span>!
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Đây là lộ trình học tập và phân tích điểm yếu của bạn.
                            </p>
                        </div>
                        <NavLink to="/adaptive" className="group bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-2">
                            <Zap size={20} className="group-hover:scale-110 transition-transform"/>
                            <span>Khắc phục Điểm yếu</span>
                        </NavLink>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard 
                            title="Số đề đã làm" 
                            value={stats.totalExams || 0} 
                            icon={CheckCircle2} 
                            color="emerald"
                        />
                        <StatCard 
                            title="Điểm trung bình" 
                            value={stats.averageScore || 0} 
                            icon={Target} 
                            color="blue"
                        />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Dashboard Điểm yếu</h3>
                                <p className="text-slate-500 text-sm font-medium">Các chủ đề bạn cần tập trung ôn tập thêm</p>
                            </div>
                        </div>

                        {(!stats.weakTopics || stats.weakTopics.length === 0) ? (
                            <div className="text-center p-8 text-slate-500">
                                <p>Tuyệt vời! Hệ thống chưa phát hiện điểm yếu nào đáng chú ý.</p>
                                <p className="text-sm mt-2">Hãy tiếp tục luyện tập để giữ vững phong độ nhé.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.weakTopics.map((topic: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800">Mã dạng: {topic.topic}</h4>
                                            <p className="text-sm text-slate-500">Tỉ lệ đúng: {topic.accuracy}% ({topic.total} câu đã làm)</p>
                                        </div>
                                        <div className="w-full md:w-48 bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${topic.accuracy < 30 ? 'bg-rose-500' : topic.accuracy < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${topic.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const getGradeCount = (name: string) => (stats.classDistribution || []).find((c: any) => c.name === name)?.count || 0;
    const count10 = getGradeCount('Lớp 10');
    const count11 = getGradeCount('Lớp 11');
    const count12 = getGradeCount('Lớp 12');
    const totalByGrade = count10 + count11 + count12; 

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar pr-2 pb-20 relative">
            <MathBackground />
            
            <div className="relative z-10 space-y-6 p-1">
                {/* 1. Header */}
                <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 md:px-8 md:py-8 text-white shadow-xl shadow-slate-200">
                    <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full mb-3">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Không gian quản lý ID6</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            Chào {user?.full_name || user?.username},
                            <span className="block text-indigo-300 mt-1">hôm nay bạn muốn làm gì?</span>
                        </h1>
                        <p className="text-slate-400 font-medium mt-3 flex items-center gap-2">
                            <Clock size={14}/> {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">
                        <NavLink to="/assign-id" className="group bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30">
                            <Tag size={19}/><span>Gán ID tự động</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </NavLink>
                        <NavLink to="/questions" className="group bg-white/10 text-white px-5 py-3 rounded-xl font-bold border border-white/15 hover:bg-white/15 transition-all flex items-center justify-center gap-2">
                            <Plus size={19} className="group-hover:rotate-90 transition-transform"/><span>Thêm câu hỏi</span>
                        </NavLink>
                    </div>
                    </div>
                </section>

                {/* 2. Stats Grid (Bento Box Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Tổng câu hỏi" 
                        value={stats.totalQuestions} 
                        icon={FileQuestion} 
                        color="blue"
                        trend={`+${stats.recentQuestions?.length || 0} mới`}
                    />
                    <StatCard 
                        title="Mã ID6 (Dạng)" 
                        value={stats.totalMetadata} 
                        icon={Tag} 
                        color="purple"
                        trend="Định nghĩa chuẩn"
                    />
                    <StatCard 
                        title="Chuyên đề & Bài" 
                        value={stats.totalUnits} 
                        icon={BookOpen} 
                        color="emerald"
                        trend={`${stats.totalChapters} Chương`}
                    />
                    <StatCard 
                        title="Độ phủ trung bình" 
                        value={Math.round(stats.totalQuestions / (stats.totalMetadata || 1))} 
                        icon={Layers} 
                        color="amber"
                        trend="Câu / Dạng"
                    />
                </div>

                {/* 3. Main Content: Charts & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Cognitive Level Chart */}
                    <div className="lg:col-span-2 bg-white p-6 md:p-7 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <BrainCircuit className="text-indigo-500" /> Mức độ nhận thức
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Phân bố câu hỏi theo độ khó ID6</p>
                            </div>
                            <div className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-bold text-slate-500 border border-slate-200">
                                Tổng: {stats.totalQuestions}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                            {/* Chart */}
                            <div className="w-full md:w-1/2 h-[280px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={100}
                                            paddingAngle={6}
                                            dataKey="value"
                                            cornerRadius={8} // Soft corners
                                            stroke="none"
                                        >
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
                                                padding: '12px 16px'
                                            }}
                                            itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontSize: '12px' }}
                                            formatter={(value: number) => [`${value} câu`, '']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-full shadow-sm">
                                        <div className="text-3xl font-black text-slate-800">{pieData.length}</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Mức độ</div>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Legend (No more overlapping lines) */}
                            <div className="w-full md:w-1/2 grid grid-cols-1 gap-3">
                                {pieData.map((item: any) => (
                                    <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-10 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.id}</div>
                                                <div className="font-bold text-slate-700">{item.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-slate-800 text-lg">{item.value}</div>
                                            <div className="text-[10px] font-bold text-slate-400">
                                                {Math.round((item.value / (stats.totalQuestions || 1)) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Grade Distribution */}
                    <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <GraduationCap className="text-indigo-500" /> Phân bố khối lớp
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Tỷ lệ câu hỏi theo chương trình</p>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center space-y-2">
                            <GradeProgressBar label="Lớp 12" count={count12} total={totalByGrade} colorClass="bg-indigo-500" />
                            <GradeProgressBar label="Lớp 11" count={count11} total={totalByGrade} colorClass="bg-blue-500" />
                            <GradeProgressBar label="Lớp 10" count={count10} total={totalByGrade} colorClass="bg-sky-400" />
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex flex-col gap-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500"/> Thao tác nhanh
                                </h4>
                                <QuickActionCard 
                                    to="/exam" 
                                    title="Tạo Ma Trận Đề" 
                                    desc="Sinh đề ngẫu nhiên từ cấu trúc" 
                                    icon={Sigma} 
                                    color="bg-purple-500"
                                />
                                <QuickActionCard 
                                    to="/assign-id" 
                                    title="Gán ID tự động" 
                                    desc="Chuẩn hóa file LaTeX và dữ liệu" 
                                    icon={FunctionSquare} 
                                    color="bg-rose-500"
                                />
                                <QuickActionCard 
                                    to="/adaptive" 
                                    title="Ôn tập Adaptive" 
                                    desc="Học tập cá nhân hóa với AI" 
                                    icon={Zap} 
                                    color="bg-amber-500"
                                />
                                <QuickActionCard 
                                    to="/irt" 
                                    title="Phân tích IRT" 
                                    desc="Đánh giá độ khó thực tế" 
                                    icon={Target} 
                                    color="bg-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Recent Activity */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                         <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="text-blue-500"/> Hoạt động gần đây
                         </h3>
                         <NavLink to="/questions" className="text-xs font-bold bg-white text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors shadow-sm">
                            Xem tất cả
                         </NavLink>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="p-5 pl-8">ID Code</th>
                                    <th className="p-5">Loại</th>
                                    <th className="p-5 text-right pr-8">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-50">
                                {stats.recentQuestions && stats.recentQuestions.length > 0 ? (
                                    stats.recentQuestions.map((q: any) => (
                                        <tr key={q.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                        {q.id}
                                                    </div>
                                                    <span className="font-mono font-bold text-slate-700">{q.id_full || 'NO-ID'}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                                </span>
                                            </td>
                                            <td className="p-5 text-right pr-8 text-slate-400 font-medium font-mono text-xs">
                                                {new Date(q.created_at).toLocaleString('vi-VN')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-12 text-center text-slate-400">
                                            <BarChart3 size={32} className="mx-auto mb-2 opacity-20"/>
                                            Chưa có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
