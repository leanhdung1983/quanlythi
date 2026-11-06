import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { 
    User, Lock, GraduationCap, CheckCircle2, 
    Mail, School, ArrowLeft, AlertTriangle, Sparkles, 
    Layers, ShieldCheck, Check, ArrowRight, Eye, EyeOff,
    Phone, Users, KeyRound, RefreshCw, Calendar, MapPin
} from 'lucide-react';
import { APP_NAME } from '../config/brand';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Nhập email gửi OTP, 2: Nhập OTP & mật khẩu mới
    
    // Show/Hide Password States
    const [showLoginPass, setShowLoginPass] = useState(false);
    const [showRegPass, setShowRegPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);

    // Register Form State (mở rộng đầy đủ thông tin học sinh)
    const [regData, setRegData] = useState({ 
        username: '', 
        password: '', 
        confirmPassword: '', 
        full_name: '', 
        email: '', 
        school: '', 
        role: 'STUDENT',
        phone: '',
        parent_phone: '',
        grade_id: 10,
        class_name: '',
        gender: 'Nam',
        date_of_birth: '',
        address: ''
    });
    
    // Login Form State
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Forgot / Reset Password State
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [debugOtpNotice, setDebugOtpNotice] = useState('');

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
                setError(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi hệ thống đăng nhập');
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

        if (regData.password.length < 8) {
            setError("Mật khẩu phải có tối thiểu 8 ký tự.");
            return;
        }

        setLoading(true);
        try {
            await apiService.register({
                username: regData.username,
                password: regData.password,
                full_name: regData.full_name,
                email: regData.email || undefined,
                school: regData.school,
                role: regData.role,
                phone: regData.phone || undefined,
                parent_phone: regData.parent_phone || undefined,
                grade_id: regData.role === 'STUDENT' ? Number(regData.grade_id) : undefined,
                class_name: regData.role === 'STUDENT' ? regData.class_name : undefined,
                gender: regData.gender,
                date_of_birth: regData.date_of_birth || undefined,
                address: regData.address || undefined
            });
            setSuccess('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
            setTimeout(() => {
                setLoginData({ username: regData.username, password: '' });
                setView('LOGIN');
            }, 1200);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi đăng ký tài khoản');
        } finally {
            setLoading(false);
        }
    };

    // Bước 1 Quên mật khẩu: Gửi mã OTP về email
    const handleSendForgotOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setDebugOtpNotice('');
        setLoading(true);
        try {
            const res = await apiService.forgotPassword(forgotEmail);
            if (res.success) {
                setSuccess(res.message);
                setMaskedEmail(res.masked_email || forgotEmail);
                if (res.debug_otp) {
                    setDebugOtpNotice(res.debug_otp);
                    setResetOtp(res.debug_otp);
                }
                setForgotStep(2);
            } else {
                setError(res.message || 'Không thể gửi mã xác nhận');
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi khi gửi yêu cầu khôi phục');
        } finally {
            setLoading(false);
        }
    };

    // Bước 2 Quên mật khẩu: Nhập OTP và đặt mật khẩu mới
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmNewPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiService.resetPassword({
                email: forgotEmail,
                otp: resetOtp,
                new_password: newPassword
            });
            if (res.success) {
                setSuccess(res.message || 'Đặt lại mật khẩu thành công!');
                setTimeout(() => {
                    setLoginData({ username: forgotEmail, password: '' });
                    setView('LOGIN');
                    setForgotStep(1);
                    setResetOtp('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                }, 1500);
            } else {
                setError(res.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi khi đặt lại mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200 py-6 sm:py-10">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

            {/* Split Screen Container */}
            <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Column: Visual Showcase (Desktop) */}
                <div className="hidden lg:flex lg:col-span-5 flex-col justify-between py-6 pr-6">
                    <div>
                        {/* Brand Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
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
                            Nền tảng thi và ôn tập thông minh dành cho Học sinh & Giáo viên: ngân hàng chuẩn hóa mã ID6, tự động sinh đề theo ma trận, phòng thi chống gian lận và giải thích công thức toán học chuyên sâu.
                        </p>

                        {/* Feature Cards Grid */}
                        <div className="space-y-3.5 max-w-md">
                            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
                                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0 mt-0.5">
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Ngân hàng câu hỏi chuẩn hóa ID6</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Phân cấp đầy đủ theo 4 mức độ nhận thức (NB-TH-VD-VDC) và chương trình GDPT mới.</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
                                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 shrink-0 mt-0.5">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Công thức Toán học & Hình vẽ TikZ</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Render LaTeX sắc nét trên cả điện thoại và máy tính, chống vỡ dấu căn và ký hiệu khoa học.</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
                                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0 mt-0.5">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Bảo mật tài khoản & Khôi phục dễ dàng</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Xác thực OTP qua email, đổi mật khẩu chủ động và lưu trữ hồ sơ học tập an toàn.</p>
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
                <div className="lg:col-span-7 w-full max-w-xl mx-auto">
                    <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
                        
                        {/* Top decorative accent */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600" />

                        {/* Card Header */}
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-indigo-50/50">
                                <GraduationCap size={26} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {view === 'LOGIN' && `Đăng nhập ${APP_NAME}`}
                                {view === 'REGISTER' && 'Đăng ký tài khoản'}
                                {view === 'FORGOT' && (forgotStep === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu')}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {view === 'LOGIN' && 'Học sinh & Giáo viên đăng nhập bằng Tên đăng nhập hoặc Email.'}
                                {view === 'REGISTER' && 'Điền thông tin bên dưới để tạo hồ sơ học tập / giảng dạy mới.'}
                                {view === 'FORGOT' && (forgotStep === 1 ? 'Nhập email hoặc tên đăng nhập để nhận mã OTP xác nhận.' : `Nhập mã xác nhận đã gửi đến ${maskedEmail || 'email của bạn'}.`)}
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
                                            ? 'bg-white text-indigo-700 shadow-sm' 
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
                                            ? 'bg-white text-indigo-700 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Đăng ký
                                </button>
                            </div>
                        )}

                        {/* Alert Notifications */}
                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium mb-4 border border-rose-200 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle size={16} className="shrink-0 text-rose-500" />
                                <span className="flex-1">{error}</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium mb-4 border border-emerald-200 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                                <span className="flex-1">{success}</span>
                            </div>
                        )}

                        {/* ================= 1. LOGIN FORM ================= */}
                        {view === 'LOGIN' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                        Tên đăng nhập hoặc Email
                                    </label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required 
                                            autoComplete="username" 
                                            className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/60 transition-all" 
                                            placeholder="Nhập username hoặc địa chỉ email" 
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
                                            onClick={() => { setView('FORGOT'); setForgotStep(1); setError(''); setSuccess(''); }} 
                                            className="text-[11px] text-indigo-600 font-bold hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type={showLoginPass ? 'text' : 'password'} 
                                            required 
                                            autoComplete="current-password" 
                                            className="w-full py-2.5 pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/60 transition-all" 
                                            placeholder="••••••••" 
                                            value={loginData.password} 
                                            onChange={e => setLoginData({...loginData, password: e.target.value})}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowLoginPass(!showLoginPass)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            aria-label={showLoginPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                            {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
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

                        {/* ================= 2. REGISTER FORM ================= */}
                        {view === 'REGISTER' && (
                            <form onSubmit={handleRegister} className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                                {/* Vai trò */}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                        Bạn là:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setRegData({...regData, role: 'STUDENT'})} 
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                regData.role === 'STUDENT' 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs' 
                                                    : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <GraduationCap size={15} />
                                            <span>Học sinh</span>
                                            {regData.role === 'STUDENT' && <Check size={14} className="text-indigo-600 ml-auto" />}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setRegData({...regData, role: 'TEACHER'})} 
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                regData.role === 'TEACHER' 
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs' 
                                                    : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <Users size={15} />
                                            <span>Giáo viên</span>
                                            {regData.role === 'TEACHER' && <Check size={14} className="text-indigo-600 ml-auto" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Họ tên & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Họ và Tên *
                                        </label>
                                        <input 
                                            required 
                                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="Nguyễn Văn A" 
                                            value={regData.full_name} 
                                            onChange={e => setRegData({...regData, full_name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Email (để nhận mật khẩu) *
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
                                </div>

                                {/* Khối & Lớp (Dành riêng cho Học sinh) */}
                                {regData.role === 'STUDENT' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                                        <div>
                                            <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1 block">
                                                Khối lớp *
                                            </label>
                                            <select 
                                                className="w-full py-2 px-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
                                                value={regData.grade_id}
                                                onChange={e => setRegData({...regData, grade_id: Number(e.target.value)})}
                                            >
                                                <option value={6}>Khối 6</option>
                                                <option value={7}>Khối 7</option>
                                                <option value={8}>Khối 8</option>
                                                <option value={9}>Khối 9</option>
                                                <option value={10}>Khối 10</option>
                                                <option value={11}>Khối 11</option>
                                                <option value={12}>Khối 12</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1 block">
                                                Tên lớp (vd: 10A1)
                                            </label>
                                            <input 
                                                className="w-full py-2 px-3 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500" 
                                                placeholder="10A1" 
                                                value={regData.class_name} 
                                                onChange={e => setRegData({...regData, class_name: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1 block">
                                                Giới tính
                                            </label>
                                            <select 
                                                className="w-full py-2 px-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
                                                value={regData.gender}
                                                onChange={e => setRegData({...regData, gender: e.target.value})}
                                            >
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                                <option value="Khác">Khác</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Trường học & Số điện thoại */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Trường học / Đơn vị *
                                        </label>
                                        <div className="relative">
                                            <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                required 
                                                className="w-full py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                                placeholder="THPT Chuyên..." 
                                                value={regData.school} 
                                                onChange={e => setRegData({...regData, school: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Số điện thoại học sinh
                                        </label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="tel"
                                                className="w-full py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                                placeholder="0912..." 
                                                value={regData.phone} 
                                                onChange={e => setRegData({...regData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SĐT phụ huynh & Ngày sinh (Cho học sinh) */}
                                {regData.role === 'STUDENT' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                                SĐT Phụ huynh (để gửi điểm)
                                            </label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="tel"
                                                    className="w-full py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                                    placeholder="0988..." 
                                                    value={regData.parent_phone} 
                                                    onChange={e => setRegData({...regData, parent_phone: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                                Ngày sinh
                                            </label>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="date"
                                                    className="w-full py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                                    value={regData.date_of_birth} 
                                                    onChange={e => setRegData({...regData, date_of_birth: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tên đăng nhập */}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                        Tên đăng nhập (Username) *
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required 
                                            className="w-full py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="username (viết liền không dấu)" 
                                            value={regData.username} 
                                            onChange={e => setRegData({...regData, username: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Mật khẩu & Xác nhận */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Mật khẩu (≥ 8 ký tự) *
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showRegPass ? 'text' : 'password'} 
                                                required 
                                                className="w-full py-2 pl-3 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                                placeholder="••••••••" 
                                                value={regData.password} 
                                                onChange={e => setRegData({...regData, password: e.target.value})}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowRegPass(!showRegPass)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showRegPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                                            Xác nhận Mật khẩu *
                                        </label>
                                        <input 
                                            type="password" 
                                            required 
                                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                            placeholder="••••••••" 
                                            value={regData.confirmPassword} 
                                            onChange={e => setRegData({...regData, confirmPassword: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="md" 
                                    loading={loading}
                                    className="w-full font-bold shadow-md shadow-indigo-500/20 mt-3"
                                >
                                    Đăng ký tài khoản ngay
                                </Button>
                            </form>
                        )}

                        {/* ================= 3. FORGOT / RESET PASSWORD FLOW ================= */}
                        {view === 'FORGOT' && (
                            <div>
                                {forgotStep === 1 ? (
                                    /* BƯỚC 1: NHẬP EMAIL / USERNAME ĐỂ GỬI MÃ OTP */
                                    <form onSubmit={handleSendForgotOtp} className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                                Email hoặc Tên đăng nhập của bạn
                                            </label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    required 
                                                    className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                                                    placeholder="Nhập email hoặc username" 
                                                    value={forgotEmail} 
                                                    onChange={e => setForgotEmail(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1.5">
                                                Hệ thống sẽ gửi mã xác thực 6 số (OTP) tới hòm thư email liên kết với tài khoản này.
                                            </p>
                                        </div>
                                        
                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            size="lg" 
                                            loading={loading}
                                            className="w-full font-bold shadow-md shadow-indigo-500/20"
                                        >
                                            Gửi mã xác nhận qua Email
                                            <ArrowRight size={16} className="ml-1" />
                                        </Button>

                                        <div className="pt-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => { setView('LOGIN'); setError(''); setSuccess(''); }} 
                                                className="text-slate-500 hover:text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                                            >
                                                <ArrowLeft size={14}/> Quay lại đăng nhập
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* BƯỚC 2: NHẬP MÃ OTP VÀ THIẾT LẬP MẬT KHẨU MỚI */
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        {debugOtpNotice && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                                                <span>Mã xác thực thử nghiệm: <strong className="font-mono text-sm tracking-widest text-amber-900">{debugOtpNotice}</strong></span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setResetOtp(debugOtpNotice)}
                                                    className="text-[10px] font-bold bg-amber-200/80 hover:bg-amber-300 px-2 py-1 rounded-lg"
                                                >
                                                    Tự điền mã
                                                </button>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                                Mã OTP xác thực 6 chữ số
                                            </label>
                                            <div className="relative">
                                                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    required 
                                                    maxLength={6}
                                                    className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold tracking-widest text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all text-center" 
                                                    placeholder="123456" 
                                                    value={resetOtp} 
                                                    onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                                Mật khẩu mới (≥ 8 ký tự)
                                            </label>
                                            <div className="relative">
                                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type={showNewPass ? 'text' : 'password'}
                                                    required 
                                                    className="w-full py-2.5 pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                                                    placeholder="Nhập mật khẩu mới" 
                                                    value={newPassword} 
                                                    onChange={e => setNewPassword(e.target.value)}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowNewPass(!showNewPass)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                                >
                                                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                                                Xác nhận Mật khẩu mới
                                            </label>
                                            <div className="relative">
                                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="password"
                                                    required 
                                                    className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                                                    placeholder="Nhập lại mật khẩu mới" 
                                                    value={confirmNewPassword} 
                                                    onChange={e => setConfirmNewPassword(e.target.value)}
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
                                            Kích hoạt & Đặt lại mật khẩu
                                        </Button>

                                        <div className="flex items-center justify-between pt-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setForgotStep(1)} 
                                                className="text-slate-500 hover:text-slate-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                            >
                                                <ArrowLeft size={14}/> Gửi lại mã khác
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => { setView('LOGIN'); setError(''); setSuccess(''); }} 
                                                className="text-indigo-600 hover:underline text-xs font-bold"
                                            >
                                                Quay lại đăng nhập
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
