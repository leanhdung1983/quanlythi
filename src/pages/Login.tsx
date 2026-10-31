import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { 
    Loader2, User, Lock, GraduationCap, CheckCircle2, 
    Mail, School, ArrowLeft, AlertTriangle, Sparkles, 
    Layers, ShieldCheck, Check, ArrowRight
} from 'lucide-react';
import { APP_NAME } from '../config/brand';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    
    // Register Form State
    const [regData, setRegData] = useState({ 
        username: '', 
        password: '', 
        confirmPassword: '', 
        full_name: '', 
        email: '', 
        school: '', 
        role: 'STUDENT' 
    });
    
    // Login Form State
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const { user, login } = useAuthStore();
    const navigate = useNavigate();

    // Check expired session notice
    React.useEffect(() => {
        const expiredNotice = sessionStorage.getItem('session_expired_msg');
        if (expiredNotice) {
            setError(expiredNotice);
            sessionStorage.removeItem('session_expired_msg');
        }
    }, []);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user && !sessionStorage.getItem('session_expired_msg')) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await apiService.login(loginData.username, loginData.password);
            if (res.success && res.user) {
                sessionStorage.removeItem('session_expired_msg');
                login(res.user, 'secure-cookie-session');
                navigate('/');
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (regData.password !== regData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        try {
            await apiService.register({
                username: regData.username,
                password: regData.password,
                full_name: regData.full_name,
                email: regData.email,
                school: regData.school,
                role: regData.role
            });
            setSuccess('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
            setTimeout(() => setView('LOGIN'), 1500);
        } catch (err: any) {
            setError(err.message || 'Lỗi hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await apiService.forgotPassword(forgotEmail);
            if (res.success) {
                setSuccess(res.message);
                if (res.debug_password) {
                    alert(`[TEST MODE] Mật khẩu mới của bạn là: ${res.debug_password}`);
                }
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

            {/* Split Screen Container */}
            <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Column: Visual Showcase (Desktop) */}
                <div className="hidden lg:flex lg:col-span-6 flex-col justify-between py-6 pr-6">
                    <div>
                        {/* Brand Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
                            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                            <span>Hệ sinh thái Khảo thí & Ngân hàng câu hỏi ID6</span>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4">
                            Chuẩn hóa đề thi.<br/>
                            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                                Nâng tầm chất lượng
                            </span> khảo thí.
                        </h1>

                        <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-8">
                            Nền tảng all-in-one dành cho Giáo viên & Học sinh: ngân hàng câu hỏi chuẩn ID6, tự động sinh đề thi ngẫu nhiên chống trùng lặp, hỗ trợ LaTeX/TikZ trực tiếp và phân tích năng lực IRT hiện đại.
                        </p>

                        {/* Feature Cards Grid */}
                        <div className="space-y-3.5 max-w-md">
                            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
                                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0 mt-0.5">
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Ngân hàng 50.000+ câu hỏi</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Phân loại chuẩn hóa mã ID6 theo chương trình Giáo dục phổ thông mới.</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
                                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 shrink-0 mt-0.5">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Biên soạn LaTeX & Đồ thị TikZ</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Hiển thị công thức Toán học chuẩn mực, xuất file Word và PDF tức thì.</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
                                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0 mt-0.5">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Khảo thí trực tuyến & Trắc lượng IRT</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Đánh giá độ khó câu hỏi, năng lực thí sinh và phòng thi an toàn.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <span>© 2026 {APP_NAME} Platform</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hệ thống trực tuyến</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interactive Form Card */}
                <div className="lg:col-span-6 w-full max-w-md mx-auto">
                    <div className="rounded-3xl bg-white text-slate-900 p-7 sm:p-9 shadow-2xl border border-slate-100 relative overflow-hidden">
                        
                        {/* Top decorative accent */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600" />

                        {/* Card Header */}
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-indigo-50/50">
                                <GraduationCap size={26} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {view === 'LOGIN' && `Đăng nhập ${APP_NAME}`}
                                {view === 'REGISTER' && 'Tạo tài khoản mới'}
                                {view === 'FORGOT' && 'Khôi phục mật khẩu'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {view === 'LOGIN' && 'Chào mừng bạn quay lại! Nhập thông tin để tiếp tục.'}
                                {view === 'REGISTER' && 'Đăng ký nhanh chóng để truy cập đầy đủ tính năng.'}
                                {view === 'FORGOT' && 'Nhập email đã đăng ký để thiết lập lại mật khẩu.'}
                            </p>
                        </div>

                        {/* View Switcher Tabs (Login / Register) */}
                        {view !== 'FORGOT' && (
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                                <button 
                                    type="button"
                                    onClick={() => { setView('LOGIN'); setError(''); setSuccess(''); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                        view === 'LOGIN' 
                                            ? 'bg-white text-indigo-700 shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Đăng nhập
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => { setView('REGISTER'); setError(''); setSuccess(''); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                        view === 'REGISTER' 
                                            ? 'bg-white text-indigo-700 shadow-xs' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Đăng ký
                                </button>
                            </div>
                        )}

                        {/* Alert Notifications */}
                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium mb-4 border border-rose-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle size={16} className="shrink-0 text-rose-500" />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium mb-4 border border-emerald-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                                <span className="flex-1">{success}</span>
                            </div>
                        )}

                        {/* 1. LOGIN FORM */}
                        {view === 'LOGIN' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                        Tên đăng nhập
                                    </label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required 
                                            autoComplete="username" 
                                            className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/60 transition-all" 
                                            placeholder="Nhập tên đăng nhập" 
                                            value={loginData.username} 
                                            onChange={e => setLoginData({...loginData, username: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                            Mật khẩu
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={() => setView('FORGOT')} 
                                            className="text-[11px] text-indigo-600 font-semibold hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="password" 
                                            required 
                                            autoComplete="current-password" 
                                            className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/60 transition-all" 
                                            placeholder="••••••••" 
                                            value={loginData.password} 
                                            onChange={e => setLoginData({...loginData, password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg" 
                                    loading={loading}
                                    className="w-full font-bold shadow-md shadow-indigo-500/20 mt-2"
                                >
                                    Đăng nhập ngay
                                    <ArrowRight size={16} className="ml-1" />
                                </Button>
                            </form>
                        )}

                        {/* 2. REGISTER FORM */}
                        {view === 'REGISTER' && (
                            <form onSubmit={handleRegister} className="space-y-3.5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                        Họ và Tên
                                    </label>
                                    <input 
                                        required 
                                        className="w-full py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 text-xs" 
                                        placeholder="Nguyễn Văn A" 
                                        value={regData.full_name} 
                                        onChange={e => setRegData({...regData, full_name: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Email
                                        </label>
                                        <input 
                                            type="email" 
                                            required 
                                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="email@vidu.com" 
                                            value={regData.email} 
                                            onChange={e => setRegData({...regData, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Trường / Đơn vị
                                        </label>
                                        <input 
                                            required 
                                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="THPT..." 
                                            value={regData.school} 
                                            onChange={e => setRegData({...regData, school: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                        Tên đăng nhập
                                    </label>
                                    <input 
                                        required 
                                        className="w-full py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        placeholder="username" 
                                        value={regData.username} 
                                        onChange={e => setRegData({...regData, username: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Mật khẩu
                                        </label>
                                        <input 
                                            type="password" 
                                            required 
                                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="••••••" 
                                            value={regData.password} 
                                            onChange={e => setRegData({...regData, password: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Xác nhận MK
                                        </label>
                                        <input 
                                            type="password" 
                                            required 
                                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="••••••" 
                                            value={regData.confirmPassword} 
                                            onChange={e => setRegData({...regData, confirmPassword: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                        Vai trò tài khoản
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setRegData({...regData, role: 'STUDENT'})} 
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                regData.role === 'STUDENT' 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs' 
                                                    : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            {regData.role === 'STUDENT' && <Check size={14} className="text-indigo-600" />}
                                            <span>Học sinh</span>
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setRegData({...regData, role: 'TEACHER'})} 
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                regData.role === 'TEACHER' 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs' 
                                                    : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            {regData.role === 'TEACHER' && <Check size={14} className="text-indigo-600" />}
                                            <span>Giáo viên</span>
                                        </button>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="md" 
                                    loading={loading}
                                    className="w-full font-bold shadow-md shadow-indigo-500/20 mt-3"
                                >
                                    Đăng ký tài khoản
                                </Button>
                            </form>
                        )}

                        {/* 3. FORGOT PASSWORD FORM */}
                        {view === 'FORGOT' && (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                        Email đăng ký của bạn
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="email" 
                                            required 
                                            className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                                            placeholder="email@example.com" 
                                            value={forgotEmail} 
                                            onChange={e => setForgotEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg" 
                                    loading={loading}
                                    className="w-full font-bold shadow-md shadow-indigo-500/20"
                                >
                                    Gửi liên kết khôi phục
                                </Button>

                                <div className="pt-2 text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setView('LOGIN')} 
                                        className="text-slate-500 hover:text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                                    >
                                        <ArrowLeft size={14}/> Quay lại đăng nhập
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
