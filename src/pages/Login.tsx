
import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Lock, GraduationCap, CheckCircle2, Mail, School, ArrowLeft, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    
    // Register Form State
    const [regData, setRegData] = useState({ username: '', password: '', confirmPassword: '', full_name: '', email: '', school: '', role: 'STUDENT', teacher_code: '' });
    
    // Login Form State
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await apiService.login(loginData.username, loginData.password);
            if (res.success && res.user) {
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
                role: regData.role,
                teacher_code: regData.teacher_code
            });
            setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
            setTimeout(() => setView('LOGIN'), 2000);
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-6">
            <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" aria-hidden="true" />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 sm:p-8">
                
                <div className="text-center mb-7">
                    <div className="inline-flex p-3 bg-indigo-50 rounded-xl text-indigo-600 mb-4 ring-1 ring-indigo-100">
                        <GraduationCap size={30}/>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {view === 'LOGIN' && 'Đăng Nhập ID6.Pro'}
                        {view === 'REGISTER' && 'Đăng Ký Tài Khoản'}
                        {view === 'FORGOT' && 'Quên Mật Khẩu'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-2">Ngân hàng câu hỏi và thi trực tuyến</p>
                </div>

                {/* ERROR / SUCCESS MESSAGES */}
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium mb-4 border border-red-100 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-2"><AlertTriangle size={16}/> {error}</span>
                </div>}
                
                {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center font-medium mb-4 border border-green-100 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={16}/> {success}
                </div>}

                {/* LOGIN FORM */}
                {view === 'LOGIN' && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tên đăng nhập</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input required autoComplete="username" className="w-full p-3 pl-10 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 transition" placeholder="Tên đăng nhập" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})}/>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
                                <button type="button" onClick={() => setView('FORGOT')} className="text-xs text-primary-600 font-bold hover:underline">Quên mật khẩu?</button>
                            </div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input type="password" required autoComplete="current-password" className="w-full p-3 pl-10 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 transition" placeholder="Nhập mật khẩu" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})}/>
                            </div>
                        </div>
                        
                        <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-700 active:translate-y-px transition-all flex justify-center items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 mt-6">
                            {loading && <Loader2 className="animate-spin" size={18}/>}
                            Đăng Nhập
                        </button>

                        <div className="pt-4 text-center">
                            <span className="text-slate-500 text-sm">Chưa có tài khoản? </span>
                            <button type="button" onClick={() => setView('REGISTER')} className="text-primary-600 font-bold hover:underline text-sm">Đăng ký ngay</button>
                        </div>
                    </form>
                )}

                {/* REGISTER FORM */}
                {view === 'REGISTER' && (
                    <form onSubmit={handleRegister} className="space-y-3 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Họ và Tên</label>
                                <input required className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-sm" placeholder="Nguyễn Văn A" value={regData.full_name} onChange={e => setRegData({...regData, full_name: e.target.value})}/>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Email</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input type="email" required className="w-full p-2.5 pl-8 border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-sm" placeholder="email@example.com" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}/>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Trường / Đơn vị</label>
                                <div className="relative">
                                    <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input required className="w-full p-2.5 pl-8 border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-sm" placeholder="THPT..." value={regData.school} onChange={e => setRegData({...regData, school: e.target.value})}/>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tên đăng nhập</label>
                            <input required className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-sm" placeholder="username" value={regData.username} onChange={e => setRegData({...regData, username: e.target.value})}/>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Mật khẩu</label>
                                <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-sm" placeholder="••••••" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Xác nhận MK</label>
                                <input type="password" required className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-sm" placeholder="••••••" value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})}/>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Vai trò</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setRegData({...regData, role: 'STUDENT'})} className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${regData.role === 'STUDENT' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200 text-slate-500 bg-white'}`}>Học sinh</button>
                                <button type="button" onClick={() => setRegData({...regData, role: 'TEACHER'})} className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${regData.role === 'TEACHER' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200 text-slate-500 bg-white'}`}>Giáo viên</button>
                            </div>
                        </div>

                        {regData.role === 'TEACHER' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center justify-between">
                                    <span>Mã kích hoạt Giáo viên</span>
                                    <span className="text-[9px] lowercase font-normal text-slate-400">(do Admin cấp)</span>
                                </label>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full p-2.5 border border-amber-300 bg-amber-50/40 rounded-lg outline-none focus:border-amber-500 text-sm font-mono" 
                                    placeholder="Nhập mã kích hoạt giáo viên..." 
                                    value={regData.teacher_code} 
                                    onChange={e => setRegData({...regData, teacher_code: e.target.value})}
                                />
                            </div>
                        )}

                        <button disabled={loading} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-4">
                            {loading && <Loader2 className="animate-spin" size={18}/>}
                            ĐĂNG KÝ TÀI KHOẢN
                        </button>

                        <div className="pt-2 text-center">
                            <button type="button" onClick={() => setView('LOGIN')} className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto">
                                <ArrowLeft size={14}/> Quay lại đăng nhập
                            </button>
                        </div>
                    </form>
                )}

                {/* FORGOT PASSWORD FORM */}
                {view === 'FORGOT' && (
                    <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <p className="text-sm text-slate-600 mb-4 text-center">Nhập email bạn đã đăng ký để nhận mật khẩu mới.</p>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email đăng ký</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input type="email" required className="w-full p-3 pl-10 border border-slate-200 rounded-xl outline-none focus:border-primary-500 transition-colors" placeholder="email@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}/>
                            </div>
                        </div>
                        
                        <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-6">
                            {loading && <Loader2 className="animate-spin" size={18}/>}
                            Gửi Mật Khẩu Mới
                        </button>

                        <div className="pt-4 text-center">
                            <button type="button" onClick={() => setView('LOGIN')} className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto">
                                <ArrowLeft size={14}/> Quay lại đăng nhập
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
