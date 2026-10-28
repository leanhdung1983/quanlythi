import React, { useEffect, useState } from 'react';
import '../styles/home.css';
import { apiService } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    FileQuestion, BookOpen, Layers, Loader2, 
    ArrowRight, Zap, Tag, GraduationCap, 
    Clock, BarChart3, BrainCircuit,
    Target, Sparkles, CheckCircle2, MonitorPlay, 
    Wand2, FileCode, Flag, Users, HelpCircle,
    X, Lock,
    Calendar, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { APP_NAME, APP_TAGLINE } from '../config/brand';

// --- Upgrade Modal for Free Tier Users ---
const FreeUpgradeModal = ({ onClose, role }: { onClose: () => void, role: string }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-indigo-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
                            <Sparkles size={20} className="text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight">Nâng Cấp Tài Khoản Pro</h2>
                            <p className="text-xs text-indigo-100 font-medium">Mở khóa toàn bộ tính năng cao cấp</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                        aria-label="Đóng thông báo"
                    >
                        <X size={20}/>
                    </button>
                </div>
                <div className="p-6">
                    {role === 'STUDENT' ? (
                        <>
                            <p className="text-slate-600 mb-4 font-medium text-sm">
                                Bạn đang dùng tài khoản <strong className="text-slate-800">Miễn phí (Học sinh)</strong>. Một số tính năng bị giới hạn:
                            </p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 text-xs leading-relaxed font-medium">Giới hạn 2 lần thi (Real) và 2 lần ôn tập thích ứng (Adaptive) mỗi ngày.</span>
                                </li>
                                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 text-xs leading-relaxed font-medium">Chỉ được truy cập bài giảng đầu tiên của mỗi chương trong hệ thống.</span>
                                </li>
                            </ul>
                            
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                                <h3 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-indigo-600"/> Quyền lợi khi kích hoạt PRO:
                                </h3>
                                <ul className="space-y-2 text-xs text-indigo-800">
                                    <li className="flex items-center gap-2 font-medium">✓ Học bài giảng lý thuyết & video không giới hạn</li>
                                    <li className="flex items-center gap-2 font-medium">✓ Luyện tập trắc nghiệm & thi online không giới hạn</li>
                                </ul>
                                <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between">
                                    <span className="text-slate-600 text-xs font-semibold">Ưu đãi đăng ký:</span>
                                    <span className="text-lg font-black text-indigo-700">199.000đ</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-slate-600 mb-4 font-medium text-sm">
                                Bạn đang dùng tài khoản <strong className="text-slate-800">Miễn phí (Giáo viên)</strong>. Các giới hạn:
                            </p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 text-xs leading-relaxed font-medium">Chỉ có thể xem và tra cứu câu hỏi trong ngân hàng.</span>
                                </li>
                                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-700 text-xs leading-relaxed font-medium">Tạo ma trận nhưng <strong className="text-rose-600">không thể tải mã nguồn LaTeX/DOCX</strong>.</span>
                                </li>
                            </ul>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 mb-6">
                                <h3 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-purple-600"/> Quyền lợi khi kích hoạt PRO:
                                </h3>
                                <ul className="space-y-2 text-xs text-purple-800">
                                    <li className="flex items-center gap-2 font-medium">✓ Xuất file Word (DOCX) và mã nguồn LaTeX nguyên bản</li>
                                    <li className="flex items-center gap-2 font-medium">✓ Trộn nhiều mã đề thi chuẩn kèm phiếu tô đáp án</li>
                                </ul>
                            </div>
                        </>
                    )}
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                    >
                        Đã hiểu & Tiếp tục trải nghiệm
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Reusable Metric Card ---
interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo';
    trend?: string;
    trendType?: 'positive' | 'neutral' | 'accent';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
    const colorStyles: Record<string, { bg: string, text: string, ring: string, glow: string }> = {
        blue: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100', glow: '#0ea5e9' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100', glow: '#8b5cf6' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', glow: '#10b981' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', glow: '#f59e0b' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100', glow: '#f43f5e' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100', glow: '#6366f1' },
    };
    
    const style = colorStyles[color] || colorStyles.indigo;

    return (
        <div className="home-page__stat-card">
            <div className="home-page__stat-watermark">
                <Icon size={120} />
            </div>
            <div>
                <div className="home-page__stat-top">
                    <div className={`home-page__stat-icon-wrap ${style.bg} ${style.text} ring-4 ${style.ring}`}>
                        <Icon size={24} />
                    </div>
                    {trend && (
                        <div className="home-page__stat-trend">
                            <Sparkles size={11} className="text-amber-500" />
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                <h3 className="home-page__stat-number">
                    {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
                </h3>
                <p className="home-page__stat-label">{title}</p>
            </div>
        </div>
    );
};

// --- Reusable Tool / Action Card ---
interface QuickActionProps {
    to: string;
    title: string;
    desc: string;
    icon: React.ElementType;
    color: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ to, title, desc, icon: Icon, color }) => (
    <NavLink to={to} className="home-page__tool-card">
        <div className="home-page__tool-top">
            <div className={`home-page__tool-icon-wrap ${color}`}>
                <Icon size={22} />
            </div>
            <div className="home-page__tool-arrow">
                <ChevronRight size={16} />
            </div>
        </div>
        <div>
            <h4 className="home-page__tool-title">{title}</h4>
            <p className="home-page__tool-desc">{desc}</p>
        </div>
    </NavLink>
);

// --- Grade Progress Bar ---
const GradeProgressBar: React.FC<{ label: string, count: number, total: number, colorClass: string }> = ({
    label, count, total, colorClass
}) => {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="home-page__grade-bar-item">
            <div className="home-page__grade-bar-head">
                <span className="home-page__grade-bar-name">{label}</span>
                <span className="home-page__grade-bar-count">
                    {count.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-400">({percent}%)</span>
                </span>
            </div>
            <div className="home-page__grade-track">
                <div 
                    className={`home-page__grade-fill ${colorClass}`} 
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

// ==========================================================================
// MAIN DASHBOARD COMPONENT
// ==========================================================================
export const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [showUpgrade, setShowUpgrade] = useState(false);
    
    // Check if free user should see upgrade hint
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
        const timer = setTimeout(() => { 
            if (loading) setLongLoading(true); 
        }, 2000);

        const loadStats = async () => {
            try {
                if (user?.role === 'STUDENT') {
                    const data = await apiService.fetchStudentDashboardStats(user.id);
                    if (data) setStats(data);
                    else setError("Không nhận được dữ liệu từ hệ thống.");
                } else {
                    const data = await apiService.fetchStats();
                    if (data) setStats(data);
                    else setError("Không nhận được dữ liệu từ hệ thống.");
                }
            } catch (e: any) {
                setError(e.message || "Lỗi khi tải thông tin thống kê.");
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

    // Current formatted Vietnamese Date
    const todayFormatted = new Date().toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

    // Loading State
    if (loading) {
        return (
            <div className="home-page flex items-center justify-center min-h-[65vh]">
                <div className="flex flex-col items-center gap-4 text-center p-8 bg-white/80 backdrop-blur rounded-3xl border border-slate-200/60 shadow-lg max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                        <Loader2 className="animate-spin text-indigo-600" size={32}/>
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-base">
                            {longLoading ? "Đang đánh thức máy chủ dữ liệu..." : "Đang tải dữ liệu trang chủ..."}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {longLoading ? "Hệ thống đang chuẩn bị tài nguyên, vui lòng đợi trong giây lát." : "Đang nạp số liệu thống kê mới nhất"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (!stats) {
        return (
            <div className="home-page flex items-center justify-center min-h-[60vh] p-4">
                <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-xl max-w-md text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Không thể tải trang chủ</h3>
                    <p className="text-sm text-slate-500 mb-6">{error || "Lỗi kết nối tới máy chủ."}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                    >
                        <RefreshCw size={16} /> Thử tải lại
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // STUDENT VIEW
    // =========================================================================
    if (user?.role === 'STUDENT') {
        const avgScore = Number(stats.averageScore) || 0;
        const totalExams = Number(stats.totalExams) || 0;

        return (
            <div className="home-page">
                <div className="home-page__bg-grid" />
                <div className="home-page__container">
                    {/* Header */}
                    <header className="home-page__header">
                        <div>
                            <div className="home-page__eyebrow-pill">
                                <span className="home-page__pulse-dot" />
                                <span>KHÔNG GIAN HỌC TẬP THÔNG MINH</span>
                            </div>
                            <h1 className="home-page__title">
                                Xin chào, <span className="home-page__title-name">{user.full_name || user.username}</span>! 👋
                            </h1>
                            <p className="home-page__subtitle">
                                Đây là lộ trình học tập, thống kê kết quả và phân tích điểm yếu cá nhân hóa của bạn.
                            </p>
                        </div>
                        <div className="home-page__header-meta">
                            <div className="home-page__date-badge">
                                <Calendar size={16} className="text-indigo-600"/>
                                <span>{todayFormatted}</span>
                            </div>
                            <span className="home-page__role-tag">Học sinh</span>
                        </div>
                    </header>

                    {/* Student Hero Banner */}
                    <section className="home-page__student-hero">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-indigo-200/80 rounded-full text-xs font-bold text-indigo-700">
                                <Sparkles size={13} className="text-amber-500" /> Luyện tập thích ứng Adaptive
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Sẵn sàng bứt phá điểm số hôm nay?
                            </h2>
                            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                                Thuật toán AI tự động phân tích các dạng bài bạn chưa thuần thục để tạo đề ôn luyện đúng trọng tâm nhất.
                            </p>
                        </div>
                        <NavLink 
                            to="/adaptive" 
                            className="home-page__btn-primary shadow-lg shadow-indigo-300"
                        >
                            <Zap size={18} />
                            <span>Khắc phục Điểm yếu ngay</span>
                            <ArrowRight size={16} />
                        </NavLink>
                    </section>

                    {/* Student Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <StatCard 
                            title="Số đề thi đã hoàn thành" 
                            value={totalExams} 
                            icon={CheckCircle2} 
                            color="emerald"
                            trend={totalExams > 0 ? "Đã ghi nhận kết quả" : "Hãy bắt đầu đề đầu tiên"}
                        />
                        <StatCard 
                            title="Điểm số trung bình tích lũy" 
                            value={avgScore > 0 ? `${avgScore} / 10` : "Chưa có"} 
                            icon={Target} 
                            color="blue"
                            trend={avgScore >= 8 ? "Thành tích Giỏi" : avgScore >= 6.5 ? "Thành tích Khá" : "Cần ôn tập thêm"}
                        />
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="home-page__tools-section">
                        <div className="home-page__section-header">
                            <div>
                                <p className="home-page__section-eyebrow">ĐIỀU HƯỚNG NHANH</p>
                                <h2 className="home-page__section-title">Lối tắt học tập & thi cử</h2>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4 cổng tương tác</span>
                        </div>
                        <div className="home-page__tools-grid">
                            <QuickActionCard 
                                to="/online-exam" 
                                title="Thi trực tuyến" 
                                desc="Làm bài thi được phân công hoặc tự luyện tập" 
                                icon={MonitorPlay} 
                                color="bg-emerald-600"
                            />
                            <QuickActionCard 
                                to="/learning" 
                                title="Học trực tuyến" 
                                desc="Xem bài giảng lý thuyết, đồ thị & video tương tác" 
                                icon={BookOpen} 
                                color="bg-sky-600"
                            />
                            <QuickActionCard 
                                to="/eduloop" 
                                title="EduLoop · Kỹ năng" 
                                desc="Luyện tập thích ứng Adaptive nhận diện lỗ hổng kiến thức" 
                                icon={Zap} 
                                color="bg-amber-600"
                            />
                            <QuickActionCard 
                                to="/classes" 
                                title="Lớp học của tôi" 
                                desc="Xem danh sách lớp, bài tập về nhà và giáo viên" 
                                icon={Users} 
                                color="bg-purple-600"
                            />
                        </div>
                    </div>

                    {/* Weak Topics Analysis Dashboard */}
                    <section className="home-page__weak-card">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                    <BrainCircuit size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Phân tích Chủ đề Cần Cải Thiện</h3>
                                    <p className="text-xs text-slate-500 font-medium">Xác định từ các câu hỏi bạn trả lời chưa chính xác trong bài thi</p>
                                </div>
                            </div>
                            <NavLink to="/adaptive" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                Luyện tập Adaptive <ArrowRight size={14} />
                            </NavLink>
                        </div>

                        {(!stats.weakTopics || stats.weakTopics.length === 0) ? (
                            <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 mt-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">Tuyệt vời! Chưa phát hiện điểm yếu nào đáng chú ý</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    Bạn đang làm bài rất tốt. Hãy tiếp tục luyện đề và giữ vững phong độ nhé!
                                </p>
                            </div>
                        ) : (
                            <div className="home-page__weak-list">
                                {stats.weakTopics.map((topic: any, idx: number) => {
                                    const acc = Number(topic.accuracy) || 0;
                                    const colorClass = acc < 35 ? 'bg-rose-500' : acc < 60 ? 'bg-amber-500' : 'bg-emerald-500';
                                    const textColorClass = acc < 35 ? 'text-rose-600' : acc < 60 ? 'text-amber-600' : 'text-emerald-600';
                                    const badgeText = acc < 35 ? 'Cần ôn gấp' : acc < 60 ? 'Cần luyện thêm' : 'Khá';
                                    
                                    return (
                                        <div key={idx} className="home-page__weak-item">
                                            <div className="home-page__weak-info">
                                                <div className="flex items-center gap-2">
                                                    <h4>Mã dạng: <span className="font-mono text-indigo-700">{topic.topic}</span></h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc < 35 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {badgeText}
                                                    </span>
                                                </div>
                                                <p>Đã làm: <strong>{topic.total}</strong> câu hỏi liên quan</p>
                                            </div>
                                            <div className="home-page__weak-meter-wrap">
                                                <div className="home-page__weak-track">
                                                    <div 
                                                        className={`home-page__weak-fill ${colorClass}`} 
                                                        style={{ width: `${acc}%` }}
                                                    />
                                                </div>
                                                <span className={`home-page__weak-pct ${textColorClass}`}>
                                                    {acc}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Footer */}
                    <footer className="home-page__footer">
                        <div className="home-page__footer-brand">
                            <GraduationCap size={18} className="text-indigo-600"/>
                            <span>{APP_NAME}</span>
                            <span className="text-slate-300 font-normal">|</span>
                            <span className="text-xs text-slate-400 font-normal">{APP_TAGLINE}</span>
                        </div>
                        <div className="home-page__footer-links">
                            <NavLink to="/guide" className="home-page__footer-link">Hướng dẫn sử dụng</NavLink>
                            <NavLink to="/profile" className="home-page__footer-link">Hồ sơ cá nhân</NavLink>
                        </div>
                    </footer>
                </div>
            </div>
        );
    }

    // =========================================================================
    // TEACHER & ADMIN VIEW
    // =========================================================================
    
    // Cognitive level distribution colors
    const levelConfig: Record<string, { color: string, label: string }> = { 
        'N': { color: '#10b981', label: 'Nhận biết' }, 
        'H': { color: '#0284c7', label: 'Thông hiểu' }, 
        'V': { color: '#f59e0b', label: 'Vận dụng' }, 
        'C': { color: '#ef4444', label: 'Vận dụng cao' },
        'Unknown': { color: '#94a3b8', label: 'Chưa phân loại' }
    };
    
    const pieData = (stats.levelDistribution || []).map((l: any) => ({
        name: levelConfig[l.id_level]?.label || l.id_level,
        value: l.count,
        id: l.id_level,
        color: levelConfig[l.id_level]?.color || '#94a3b8'
    })).filter((d: any) => d.value > 0);

    const getGradeCount = (name: string) => (stats.classDistribution || []).find((c: any) => c.name === name)?.count || 0;
    const gradeTotal = ['Lớp 12', 'Lớp 11', 'Lớp 10'].reduce((sum, name) => sum + getGradeCount(name), 0);

    return (
        <div className="home-page">
            <div className="home-page__bg-grid" />
            
            {showUpgrade && (
                <FreeUpgradeModal 
                    onClose={() => setShowUpgrade(false)} 
                    role={user?.role || 'TEACHER'} 
                />
            )}

            <div className="home-page__container">
                {/* 1. Header & Live Indicator */}
                <header className="home-page__header">
                    <div>
                        <div className="home-page__eyebrow-pill">
                            <span className="home-page__pulse-dot" />
                            <span>TỔNG QUAN KHÔNG GIAN LÀM VIỆC</span>
                        </div>
                        <h1 className="home-page__title">
                            Chào <span className="home-page__title-name">{user?.full_name || user?.username}</span> <span className="text-indigo-400">✦</span>
                        </h1>
                        <p className="home-page__subtitle">
                            Quản lý ngân hàng câu hỏi chuẩn ID6, xây dựng ma trận đề thi và tổ chức khảo thí tập trung.
                        </p>
                    </div>
                    <div className="home-page__header-meta">
                        <div className="home-page__date-badge">
                            <Clock size={16} className="text-indigo-600"/>
                            <span>{todayFormatted}</span>
                        </div>
                        <span className="home-page__role-tag">
                            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên chuyên môn'}
                        </span>
                    </div>
                </header>

                {/* 2. Hero Section: Value Proposition & 3-Step Specialist Workflow */}
                <section className="home-page__hero">
                    <div className="home-page__hero-copy">
                        <div className="home-page__hero-badge">
                            <span className="home-page__hero-badge-dot" />
                            <span>{APP_NAME} WORKSPACE</span>
                        </div>
                        <h2 className="home-page__hero-title">
                            Một nơi để chuẩn bị<br/>mọi bài kiểm tra chất lượng.
                        </h2>
                        <p className="home-page__hero-desc">
                            Từ ngân hàng câu hỏi chuẩn hóa mã dạng ID6, tự động sinh đề thi ngẫu nhiên chống trùng lặp, đến khảo thí trực tuyến và phân tích độ khó IRT chuẩn trắc lượng.
                        </p>
                        <div className="home-page__hero-actions">
                            <NavLink to="/exam" className="home-page__btn-primary">
                                <Layers size={18}/>
                                <span>Tạo ma trận đề</span>
                                <ArrowRight size={16}/>
                            </NavLink>
                            <NavLink to="/questions" className="home-page__btn-secondary">
                                <FileQuestion size={18}/>
                                <span>Ngân hàng câu hỏi</span>
                            </NavLink>
                            <NavLink to="/online-exam" className="home-page__btn-secondary">
                                <MonitorPlay size={18}/>
                                <span>Thi trực tuyến</span>
                            </NavLink>
                        </div>

                        <div className="home-page__hero-highlights">
                            <span className="home-page__highlight-chip">
                                <CheckCircle2 size={14} className="text-emerald-600" /> Chuẩn hóa ID6 quốc gia
                            </span>
                            <span className="home-page__highlight-chip">
                                <CheckCircle2 size={14} className="text-emerald-600" /> Chống trùng lặp thông minh
                            </span>
                            <span className="home-page__highlight-chip">
                                <CheckCircle2 size={14} className="text-emerald-600" /> Đánh giá năng lực IRT
                            </span>
                        </div>
                    </div>

                    {/* 3-Step Specialist Workflow */}
                    <div className="home-page__workflow">
                        <p className="home-page__workflow-heading">QUY TRÌNH CHUYÊN MÔN</p>
                        
                        <NavLink to="/questions" className="home-page__workflow-card">
                            <div className="home-page__workflow-icon bg-blue-50 text-blue-600">
                                <FileQuestion size={22}/>
                            </div>
                            <div className="home-page__workflow-info">
                                <span className="home-page__workflow-step">Bước 1</span>
                                <h4 className="home-page__workflow-title">Tổ chức ngân hàng câu hỏi</h4>
                                <p className="home-page__workflow-desc">Phân loại cây chuyên đề, mức độ nhận thức theo chuẩn ID6.</p>
                            </div>
                            <div className="home-page__workflow-arrow">
                                <ChevronRight size={18}/>
                            </div>
                        </NavLink>

                        <NavLink to="/exam" className="home-page__workflow-card">
                            <div className="home-page__workflow-icon bg-purple-50 text-purple-600">
                                <Layers size={22}/>
                            </div>
                            <div className="home-page__workflow-info">
                                <span className="home-page__workflow-step">Bước 2</span>
                                <h4 className="home-page__workflow-title">Xây dựng ma trận & sinh đề</h4>
                                <p className="home-page__workflow-desc">Sinh nhiều đề thi ngẫu nhiên khác biệt, xuất TeX & ZIP chuẩn in.</p>
                            </div>
                            <div className="home-page__workflow-arrow">
                                <ChevronRight size={18}/>
                            </div>
                        </NavLink>

                        <NavLink to="/online-exam" className="home-page__workflow-card">
                            <div className="home-page__workflow-icon bg-emerald-50 text-emerald-600">
                                <MonitorPlay size={22}/>
                            </div>
                            <div className="home-page__workflow-info">
                                <span className="home-page__workflow-step">Bước 3</span>
                                <h4 className="home-page__workflow-title">Khảo thí & Đánh giá IRT</h4>
                                <p className="home-page__workflow-desc">Thi trực tuyến tự động chấm & đo lường chất lượng câu hỏi thực tế.</p>
                            </div>
                            <div className="home-page__workflow-arrow">
                                <ChevronRight size={18}/>
                            </div>
                        </NavLink>
                    </div>
                </section>

                {/* 3. Core Metrics Grid */}
                <div className="home-page__stats-grid">
                    <StatCard 
                        title="Tổng câu hỏi trong kho" 
                        value={stats.totalQuestions || 0} 
                        icon={FileQuestion} 
                        color="blue" 
                        trend={'+' + (stats.recentQuestions?.length || 0) + ' mới'}
                    />
                    <StatCard 
                        title="Mã dạng chuẩn ID6" 
                        value={stats.totalMetadata || 0} 
                        icon={Tag} 
                        color="purple" 
                        trend="Cấu trúc chuẩn"
                    />
                    <StatCard 
                        title="Chuyên đề & Bài học" 
                        value={stats.totalUnits || 0} 
                        icon={BookOpen} 
                        color="emerald" 
                        trend={`${stats.totalChapters || 0} Chương`}
                    />
                    <StatCard 
                        title="Độ phủ trung bình" 
                        value={Math.round((stats.totalQuestions || 0) / (stats.totalMetadata || 1))} 
                        icon={Layers} 
                        color="amber" 
                        trend="Câu / Dạng"
                    />
                </div>

                {/* 4. Complete System Directory (Categorized by Pillar) */}
                <section className="home-page__tools-section">
                    <div className="home-page__section-header">
                        <div>
                            <p className="home-page__section-eyebrow">DANH MỤC CHỨC NĂNG HỆ THỐNG</p>
                            <h2 className="home-page__section-title">Trung tâm làm việc</h2>
                            <p className="home-page__section-desc">Phân nhóm tính năng đồng bộ và nhất quán với thanh điều hướng</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">12 công cụ chuyên sâu</span>
                    </div>

                    {/* Pillar 1: Khảo thí & Đề thi */}
                    <div className="home-page__category-block">
                        <div className="home-page__category-title">
                            <span className="home-page__category-dot bg-purple-500" />
                            <span>1. Khảo thí & Đề thi</span>
                        </div>
                        <div className="home-page__tools-grid">
                            <QuickActionCard 
                                to="/exam" 
                                title="Ma trận & Tạo đề thi" 
                                desc="Sinh nhiều đề ngẫu nhiên khác biệt, xuất TeX & ZIP" 
                                icon={Layers} 
                                color="bg-purple-600"
                            />
                            <QuickActionCard 
                                to="/questions" 
                                title="Ngân hàng câu hỏi" 
                                desc="Tra cứu, lọc theo ID6, quản lý kho đề bài" 
                                icon={FileQuestion} 
                                color="bg-blue-600"
                            />
                            <QuickActionCard 
                                to="/online-exam" 
                                title="Thi trực tuyến" 
                                desc="Tổ chức thi online & tự động chấm điểm tức thì" 
                                icon={MonitorPlay} 
                                color="bg-emerald-600"
                            />
                            <QuickActionCard 
                                to="/irt" 
                                title="Phân tích IRT" 
                                desc="Đo lường độ khó thực tế & trắc lượng học thuật" 
                                icon={BarChart3} 
                                color="bg-indigo-600"
                            />
                        </div>
                    </div>

                    {/* Pillar 2: Biên soạn & Công cụ AI */}
                    <div className="home-page__category-block">
                        <div className="home-page__category-title">
                            <span className="home-page__category-dot bg-rose-500" />
                            <span>2. Biên soạn & Công cụ AI</span>
                        </div>
                        <div className="home-page__tools-grid">
                            <QuickActionCard 
                                to="/assign-id" 
                                title="Gán ID tự động" 
                                desc="AI phân tích nhận diện mã dạng ID6 chính xác" 
                                icon={Tag} 
                                color="bg-rose-600"
                            />
                            <QuickActionCard 
                                to="/converter" 
                                title="Chuyển đổi tài liệu" 
                                desc="Chuyển file Word / PDF sang LaTeX chuẩn hóa" 
                                icon={Wand2} 
                                color="bg-amber-600"
                            />
                            <QuickActionCard 
                                to="/metadata" 
                                title="Dữ liệu ID6" 
                                desc="Cây chương trình, chuyên đề & dạng bài học" 
                                icon={FileCode} 
                                color="bg-teal-600"
                            />
                            <QuickActionCard 
                                to="/errors" 
                                title="Quản lý báo lỗi" 
                                desc="Tiếp nhận và xử lý phản ánh sai sót nội dung" 
                                icon={Flag} 
                                color="bg-orange-600"
                            />
                        </div>
                    </div>

                    {/* Pillar 3: Học tập & Giảng dạy */}
                    <div className="home-page__category-block">
                        <div className="home-page__category-title">
                            <span className="home-page__category-dot bg-sky-500" />
                            <span>3. Học tập & Giảng dạy</span>
                        </div>
                        <div className="home-page__tools-grid">
                            <QuickActionCard 
                                to="/learning" 
                                title="Học trực tuyến" 
                                desc="Bài giảng lý thuyết & giáo trình số tương tác" 
                                icon={BookOpen} 
                                color="bg-sky-600"
                            />
                            <QuickActionCard 
                                to="/eduloop" 
                                title="EduLoop · Kỹ năng" 
                                desc="Luyện tập thích ứng Adaptive theo thuật toán AI" 
                                icon={Zap} 
                                color="bg-yellow-600"
                            />
                            <QuickActionCard 
                                to="/classes" 
                                title="Lớp học của tôi" 
                                desc="Quản lý học sinh, giao đề & theo dõi tiến độ" 
                                icon={Users} 
                                color="bg-violet-600"
                            />
                            <QuickActionCard 
                                to="/guide" 
                                title="Hướng dẫn sử dụng" 
                                desc="Cẩm nang thao tác từ A-Z cho toàn hệ thống" 
                                icon={HelpCircle} 
                                color="bg-slate-700"
                            />
                        </div>
                    </div>
                </section>

                {/* 5. Deep Analytics & Insights Grid */}
                <div className="home-page__analytics-grid">
                    {/* Cognition Levels Donut Chart */}
                    <section className="home-page__panel">
                        <div className="home-page__panel-header">
                            <div>
                                <h3 className="home-page__panel-title">Mức độ nhận thức</h3>
                                <p className="home-page__panel-subtitle">Phân bố câu hỏi theo thang tư duy Bloom / ID6</p>
                            </div>
                            <div className="home-page__panel-icon">
                                <BrainCircuit size={20} />
                            </div>
                        </div>

                        <div className="home-page__cognition-body">
                            <div className="home-page__chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={pieData} 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius={68} 
                                            outerRadius={92} 
                                            paddingAngle={4} 
                                            dataKey="value" 
                                            cornerRadius={5} 
                                            stroke="none"
                                        >
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={index} fill={entry.color}/>
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => [`${value.toLocaleString('vi-VN')} câu`, '']} 
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                                                fontSize: 13,
                                                fontWeight: 600
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="home-page__chart-center">
                                    <strong className="home-page__chart-center-value">{pieData.length}</strong>
                                    <span className="home-page__chart-center-label">Mức độ</span>
                                </div>
                            </div>

                            <div className="home-page__legend">
                                {pieData.map((item: any) => {
                                    const pct = Math.round(item.value / (stats.totalQuestions || 1) * 100);
                                    return (
                                        <div key={item.id} className="home-page__legend-item">
                                            <div className="home-page__legend-label">
                                                <span className="home-page__legend-dot" style={{ background: item.color }}/>
                                                <span>{item.name}</span>
                                            </div>
                                            <div className="home-page__legend-stats">
                                                <span className="home-page__legend-count">{item.value.toLocaleString('vi-VN')}</span>
                                                <span className="home-page__legend-pct">{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Grade Level Distribution */}
                    <section className="home-page__panel">
                        <div className="home-page__panel-header">
                            <div>
                                <h3 className="home-page__panel-title">Phân bố khối lớp</h3>
                                <p className="home-page__panel-subtitle">Tỷ lệ câu hỏi theo chương trình giáo dục phổ thông</p>
                            </div>
                            <div className="home-page__panel-icon">
                                <GraduationCap size={20} />
                            </div>
                        </div>

                        <div className="home-page__grade-list">
                            <GradeProgressBar 
                                label="Khối Lớp 12" 
                                count={getGradeCount('Lớp 12')} 
                                total={gradeTotal} 
                                colorClass="bg-gradient-to-r from-emerald-500 to-teal-500"
                            />
                            <GradeProgressBar 
                                label="Khối Lớp 11" 
                                count={getGradeCount('Lớp 11')} 
                                total={gradeTotal} 
                                colorClass="bg-gradient-to-r from-teal-400 to-sky-500"
                            />
                            <GradeProgressBar 
                                label="Khối Lớp 10" 
                                count={getGradeCount('Lớp 10')} 
                                total={gradeTotal} 
                                colorClass="bg-gradient-to-r from-amber-400 to-orange-400"
                            />
                        </div>

                        <div className="home-page__grade-total-box">
                            <BookOpen size={18} className="text-indigo-600 shrink-0"/>
                            <span>
                                Tổng cộng <strong>{gradeTotal.toLocaleString('vi-VN')}</strong> câu hỏi đã được phân định khối lớp
                            </span>
                        </div>
                    </section>
                </div>

                {/* 6. Recent Activity Log */}
                <section className="home-page__recent-card">
                    <div className="home-page__panel-header">
                        <div>
                            <h3 className="home-page__panel-title">Hoạt động gần đây</h3>
                            <p className="home-page__panel-subtitle">Các câu hỏi mới nhất được biên soạn và cập nhật vào ngân hàng</p>
                        </div>
                        <NavLink to="/questions" className="home-page__recent-link">
                            <span>Xem tất cả câu hỏi</span>
                            <ArrowRight size={15}/>
                        </NavLink>
                    </div>

                    <div className="home-page__table-wrap">
                        <table className="home-page__table">
                            <thead>
                                <tr>
                                    <th>Mã định danh (ID Code)</th>
                                    <th>Trạng thái</th>
                                    <th className="text-right">Thời gian tạo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentQuestions?.length ? (
                                    stats.recentQuestions.map((q: any) => (
                                        <tr key={q.id}>
                                            <td>
                                                <div className="home-page__row-id-cell">
                                                    <span className="home-page__row-icon">
                                                        <FileQuestion size={16}/>
                                                    </span>
                                                    <span className="home-page__row-id-code">
                                                        {q.id_full || 'NO-ID'}
                                                    </span>
                                                    <small className="home-page__row-id-sub">#{q.id}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="home-page__status-badge">
                                                    <span className="home-page__status-badge-dot" />
                                                    <span>Hoạt động</span>
                                                </span>
                                            </td>
                                            <td className="text-right text-slate-500 text-xs">
                                                {new Date(q.created_at).toLocaleString('vi-VN')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center text-slate-400 py-12">
                                            <BarChart3 size={28} className="mx-auto mb-2 opacity-40"/>
                                            <span>Chưa có câu hỏi nào được thêm gần đây</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 7. Footer */}
                <footer className="home-page__footer">
                    <div className="home-page__footer-brand">
                        <GraduationCap size={18} className="text-indigo-600"/>
                        <span>{APP_NAME}</span>
                        <span className="text-slate-300 font-normal">|</span>
                        <span className="text-xs text-slate-400 font-normal">{APP_TAGLINE}</span>
                    </div>
                    <div className="home-page__footer-links">
                        <NavLink to="/guide" className="home-page__footer-link">Hướng dẫn sử dụng</NavLink>
                        <NavLink to="/profile" className="home-page__footer-link">Hồ sơ cá nhân</NavLink>
                    </div>
                </footer>
            </div>
        </div>
    );
};
