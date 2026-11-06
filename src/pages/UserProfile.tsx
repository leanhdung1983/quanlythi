import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../services/authStore';
import { apiService } from '../services/api';
import { 
    Save, Key, Crown, User as UserIcon, CheckCircle2, QrCode, 
    CalendarClock, Edit2, X, RefreshCw, Lock, ShieldCheck, 
    Phone, Mail, School, BookOpen, GraduationCap, Eye, EyeOff,
    Check, AlertTriangle, Sparkles, MapPin, Calendar, Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const UserProfile: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD' | 'PRO' | 'API'>('PROFILE');

    // API Key State
    const [apiKey, setApiKey] = useState(user?.api_key || '');
    const [isSavingKey, setIsSavingKey] = useState(false);

    // Pro Payment State
    const [isCheckingPlan, setIsCheckingPlan] = useState(false);
    const [payment, setPayment] = useState<{ 
        code: string; 
        amount: number; 
        account: string; 
        account_name: string; 
        qr_url: string; 
        status: string; 
        expires_at: string 
    } | null>(null);
    const [paymentError, setPaymentError] = useState('');
    const [creatingPayment, setCreatingPayment] = useState(false);

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    const [editForm, setEditForm] = useState({ 
        full_name: user?.full_name || '', 
        email: user?.email || '', 
        school: user?.school || '',
        grade_id: user?.grade_id || 0,
        class_name: user?.class_name || '',
        student_code: user?.student_code || '',
        phone: user?.phone || '',
        parent_phone: user?.parent_phone || '',
        date_of_birth: user?.date_of_birth ? user.date_of_birth.split('T')[0] : '',
        gender: user?.gender || 'Nam',
        address: user?.address || '',
        bio: user?.bio || ''
    });

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    // Sync profile state when user changes
    useEffect(() => {
        if (user) {
            setEditForm({
                full_name: user.full_name || '',
                email: user.email || '',
                school: user.school || '',
                grade_id: user.grade_id || 0,
                class_name: user.class_name || '',
                student_code: user.student_code || '',
                phone: user.phone || '',
                parent_phone: user.parent_phone || '',
                date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
                gender: user.gender || 'Nam',
                address: user.address || '',
                bio: user.bio || ''
            });
            setApiKey(user.api_key || '');
        }
    }, [user]);

    useEffect(() => {
        setPayment(null);
        setPaymentError('');
    }, [user?.id]);

    // Payment poll loop
    useEffect(() => {
        if (!payment || payment.status !== 'PENDING') return;
        let stopped = false;
        let timer: ReturnType<typeof setTimeout>;
        const check = async () => {
            try {
                const res = await apiService.getProPaymentOrder(payment.code);
                if (stopped) return;
                setPayment(res.data);
                setPaymentError('');
                if (res.data.status === 'PAID') {
                    updateUser({ is_pro: true, expiry_date: res.user.expiry_date });
                    return;
                }
                if (res.data.status !== 'PENDING') return;
            } catch {
                if (stopped) return;
                setPaymentError('Chưa kiểm tra được giao dịch. Hệ thống sẽ thử lại.');
            }
            timer = setTimeout(check, 5000);
        };
        timer = setTimeout(check, 3000);
        return () => { stopped = true; clearTimeout(timer); };
    }, [payment?.code, payment?.status, updateUser]);

    if (!user) return <div className="p-8 text-center text-slate-500 font-medium">Vui lòng đăng nhập để xem thông tin hồ sơ.</div>;

    const handleCreatePayment = async () => {
        setCreatingPayment(true);
        setPaymentError('');
        try { 
            const res = await apiService.createProPaymentOrder(); 
            setPayment(res.data); 
        } catch (error) { 
            setPaymentError((error as Error).message); 
        } finally { 
            setCreatingPayment(false); 
        }
    };

    const handleSaveKey = async () => {
        setIsSavingKey(true);
        try {
            await apiService.updateApiKey(user.id, apiKey);
            updateUser({ api_key: apiKey });
            alert("Lưu API Key thành công!");
        } catch {
            alert("Lỗi khi lưu API Key.");
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setProfileError('');
        setProfileSuccess('');
        try {
            const dataToUpdate = {
                full_name: editForm.full_name,
                email: editForm.email,
                school: editForm.school,
                grade_id: editForm.grade_id ? Number(editForm.grade_id) : null,
                class_name: editForm.class_name,
                student_code: editForm.student_code,
                phone: editForm.phone,
                parent_phone: editForm.parent_phone,
                date_of_birth: editForm.date_of_birth || null,
                gender: editForm.gender,
                address: editForm.address,
                bio: editForm.bio
            };
            
            const res = await apiService.updateUserInfo(user.id, dataToUpdate);
            if (res.success) {
                updateUser(dataToUpdate);
                setIsEditing(false);
                setProfileSuccess("Cập nhật thông tin hồ sơ thành công!");
                setTimeout(() => setProfileSuccess(''), 3000);
            } else {
                setProfileError(res.message || "Cập nhật hồ sơ thất bại.");
            }
        } catch (err: any) {
            setProfileError(err.message || "Lỗi cập nhật hồ sơ");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');

        if (newPassword.length < 8) {
            setPassError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setPassLoading(true);
        try {
            const res = await apiService.changePassword(currentPassword, newPassword);
            if (res.success) {
                setPassSuccess("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setPassSuccess(''), 4000);
            } else {
                setPassError(res.message || "Đổi mật khẩu thất bại.");
            }
        } catch (err: any) {
            setPassError(err.message || "Mật khẩu hiện tại không chính xác hoặc lỗi hệ thống.");
        } finally {
            setPassLoading(false);
        }
    };

    const handleRenewPro = async () => {
        setIsCheckingPlan(true);
        try {
            const res = await apiService.getCurrentUser();
            if (!res.success || !res.user) throw new Error('Không kiểm tra được trạng thái tài khoản. Vui lòng thử lại.');
            const active = Number(res.user.is_pro) === 1 && (!res.user.expiry_date || new Date(res.user.expiry_date).getTime() > Date.now());
            updateUser({ is_pro: active, expiry_date: res.user.expiry_date });
            alert(active ? 'Tài khoản đang sử dụng gói Pro. Hạn sử dụng đã được cập nhật!' : 'Chưa tìm thấy gói Pro còn hạn. Quý khách vui lòng quét mã chuyển khoản và kiểm tra lại.');
        } catch {
            alert('Không kiểm tra được trạng thái tài khoản. Vui lòng thử lại sau.');
        } finally {
            setIsCheckingPlan(false);
        }
    };

    // Tính độ mạnh mật khẩu (Password Strength)
    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, text: '', color: 'bg-slate-200' };
        let s = 0;
        if (pass.length >= 8) s += 1;
        if (/[A-Z]/.test(pass)) s += 1;
        if (/[0-9]/.test(pass)) s += 1;
        if (/[^A-Za-z0-9]/.test(pass)) s += 1;
        if (s <= 1) return { score: 1, text: 'Yếu', color: 'bg-rose-500' };
        if (s <= 3) return { score: 2, text: 'Trung bình', color: 'bg-amber-500' };
        return { score: 3, text: 'Rất mạnh', color: 'bg-emerald-500' };
    };

    const passStrength = getPasswordStrength(newPassword);
    const priceDisplay = payment ? `${payment.amount.toLocaleString('vi-VN')}đ` : '';

    return (
        <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
            
            {/* Header Hero Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Avatar Badge */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-0.5 shadow-xl shrink-0">
                        <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
                            {user.role === 'STUDENT' ? (
                                <GraduationCap size={40} className="text-indigo-300" />
                            ) : user.role === 'TEACHER' ? (
                                <Users size={40} className="text-sky-300" />
                            ) : (
                                <ShieldCheck size={40} className="text-amber-400" />
                            )}
                        </div>
                    </div>

                    {/* Basic Meta */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                                {user.full_name || user.username}
                            </h1>
                            {user.is_pro && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                    <Crown size={12} className="text-amber-400 fill-amber-400" /> PRO
                                </span>
                            )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400 font-mono mb-3">
                            @{user.username} • {user.email || 'Chưa liên kết email'}
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                            <span className="px-3 py-1 rounded-xl bg-white/10 text-slate-200 font-semibold border border-white/10">
                                {user.role === 'STUDENT' ? '🎓 Học sinh' : user.role === 'TEACHER' ? '👨‍🏫 Giáo viên' : '⚡ Quản trị viên'}
                            </span>
                            {user.school && (
                                <span className="px-3 py-1 rounded-xl bg-white/10 text-slate-300 font-medium border border-white/10 flex items-center gap-1.5">
                                    <School size={13} /> {user.school}
                                </span>
                            )}
                            {user.grade_id ? (
                                <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 font-medium border border-indigo-500/30">
                                    Khối {user.grade_id} {user.class_name ? `• Lớp ${user.class_name}` : ''}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Nav Tabs */}
                <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('PROFILE')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === 'PROFILE'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <UserIcon size={15} /> Thông tin hồ sơ
                    </button>
                    <button
                        onClick={() => setActiveTab('PASSWORD')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === 'PASSWORD'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Lock size={15} /> Đổi mật khẩu
                    </button>
                    {user.role !== 'ADMIN' && (
                        <button
                            onClick={() => setActiveTab('PRO')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                activeTab === 'PRO'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Crown size={15} /> Gói Pro & Nâng cấp
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('API')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                            activeTab === 'API'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Key size={15} /> Cài đặt AI Key
                    </button>
                </div>
            </div>

            {/* TAB 1: THÔNG TIN HỒ SƠ HỌC SINH / NGƯỜI DÙNG */}
            {activeTab === 'PROFILE' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <GraduationCap className="text-indigo-600" size={20} />
                                Thông tin học tập & liên lạc
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Quản lý thông tin cá nhân của bạn trên hệ thống kiểm tra và đánh giá năng lực ID6.
                            </p>
                        </div>
                        <div>
                            {isEditing ? (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                    title="Hủy chỉnh sửa"
                                >
                                    <X size={20} />
                                </button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="font-bold gap-1.5"
                                >
                                    <Edit2 size={14} /> Chỉnh sửa
                                </Button>
                            )}
                        </div>
                    </div>

                    {profileSuccess && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            {profileSuccess}
                        </div>
                    )}

                    {profileError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle size={16} className="text-rose-500" />
                            {profileError}
                        </div>
                    )}

                    {isEditing ? (
                        /* EDIT MODE */
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Họ và Tên *</label>
                                    <input 
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" 
                                        value={editForm.full_name} 
                                        onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Email liên hệ *</label>
                                    <input 
                                        type="email"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" 
                                        value={editForm.email} 
                                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Khối lớp</label>
                                    <select 
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                                        value={editForm.grade_id} 
                                        onChange={e => setEditForm({...editForm, grade_id: parseInt(e.target.value)})}
                                    >
                                        <option value={0}>Chưa chọn</option>
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
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Lớp học (vd: 10A1)</label>
                                    <input 
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.class_name} 
                                        onChange={e => setEditForm({...editForm, class_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Mã học sinh / SBD</label>
                                    <input 
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.student_code} 
                                        onChange={e => setEditForm({...editForm, student_code: e.target.value})}
                                        placeholder="HS-12345"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Trường học / Đơn vị</label>
                                    <input 
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.school} 
                                        onChange={e => setEditForm({...editForm, school: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Số điện thoại</label>
                                    <input 
                                        type="tel"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.phone} 
                                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">SĐT Phụ huynh</label>
                                    <input 
                                        type="tel"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.parent_phone} 
                                        onChange={e => setEditForm({...editForm, parent_phone: e.target.value})}
                                        placeholder="098..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Ngày sinh</label>
                                    <input 
                                        type="date"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.date_of_birth} 
                                        onChange={e => setEditForm({...editForm, date_of_birth: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">Giới tính</label>
                                    <select 
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                        value={editForm.gender} 
                                        onChange={e => setEditForm({...editForm, gender: e.target.value})}
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 block">Địa chỉ / Tỉnh thành</label>
                                <input 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500" 
                                    value={editForm.address} 
                                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                                    placeholder="Quận/Huyện, Tỉnh/Thành phố"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
                                <Button variant="primary" loading={isSavingProfile} onClick={handleSaveProfile} className="font-bold">
                                    <Save size={16} className="mr-1.5" /> Lưu thay đổi
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* VIEW MODE */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" /> Email
                                </span>
                                <span className="text-sm font-semibold text-slate-800">{user.email || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <Phone size={16} className="text-slate-400" /> Số điện thoại
                                </span>
                                <span className="text-sm font-semibold text-slate-800">{user.phone || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <School size={16} className="text-slate-400" /> Trường học
                                </span>
                                <span className="text-sm font-semibold text-slate-800">{user.school || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <BookOpen size={16} className="text-slate-400" /> Khối & Lớp
                                </span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {user.grade_id ? `Khối ${user.grade_id}` : 'Chưa chọn'}
                                    {user.class_name ? ` • Lớp ${user.class_name}` : ''}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <Users size={16} className="text-slate-400" /> SĐT Phụ huynh
                                </span>
                                <span className="text-sm font-semibold text-slate-800">{user.parent_phone || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" /> Ngày sinh & Giới tính
                                </span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('vi-VN') : '—'} 
                                    {user.gender ? ` (${user.gender})` : ''}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between md:col-span-2">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400" /> Địa chỉ
                                </span>
                                <span className="text-sm font-semibold text-slate-800">{user.address || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: ĐỔI MẬT KHẨU (BẢO MẬT TÀI KHOẢN) */}
            {activeTab === 'PASSWORD' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-2xl space-y-6">
                    <div className="pb-4 border-b border-slate-100">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Lock className="text-indigo-600" size={20} />
                            Thay đổi mật khẩu
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Để bảo vệ tài khoản của bạn, vui lòng không chia sẻ mật khẩu cho người khác.
                        </p>
                    </div>

                    {passSuccess && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            {passSuccess}
                        </div>
                    )}

                    {passError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle size={16} className="text-rose-500" />
                            {passError}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                                Mật khẩu hiện tại *
                            </label>
                            <div className="relative">
                                <input 
                                    type={showCurrentPass ? 'text' : 'password'}
                                    required 
                                    className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="Nhập mật khẩu bạn đang sử dụng"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                                Mật khẩu mới (tối thiểu 8 ký tự) *
                            </label>
                            <div className="relative">
                                <input 
                                    type={showNewPass ? 'text' : 'password'}
                                    required 
                                    className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="Nhập mật khẩu mới an toàn"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {newPassword && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`h-1.5 flex-1 rounded-full ${passStrength.score >= 1 ? passStrength.color : 'bg-slate-200'}`} />
                                        <div className={`h-1.5 flex-1 rounded-full ${passStrength.score >= 2 ? passStrength.color : 'bg-slate-200'}`} />
                                        <div className={`h-1.5 flex-1 rounded-full ${passStrength.score >= 3 ? passStrength.color : 'bg-slate-200'}`} />
                                        <span className="text-[11px] font-bold text-slate-500 ml-1">{passStrength.text}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Gợi ý: Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt.</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                                Xác nhận Mật khẩu mới *
                            </label>
                            <input 
                                type="password"
                                required 
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <div className="pt-2">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                loading={passLoading}
                                className="w-full font-bold shadow-md shadow-indigo-600/20"
                            >
                                <Lock size={16} className="mr-2" /> Lưu mật khẩu mới
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 3: GÓI PRO & NÂNG CẤP */}
            {activeTab === 'PRO' && user.role !== 'ADMIN' && (
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10"><Crown size={220}/></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-3xl font-black mb-3 flex items-center gap-3">
                                <Crown className="text-amber-300 fill-amber-300"/> {user.is_pro ? 'Gia hạn gói PRO' : 'Nâng cấp lên PRO'}
                            </h2>
                            <p className="text-indigo-100 text-sm mb-4 font-medium">
                                {payment ? (
                                    <>Chi phí gói: <span className="text-white font-bold text-lg">{priceDisplay} / 1 năm</span></>
                                ) : (
                                    'Gói PRO mở khóa không giới hạn phòng thi, lời giải chi tiết và phân tích năng lực cá nhân.'
                                )}
                            </p>
                            
                            <ul className="space-y-3 mb-6 text-sm">
                                <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400 shrink-0"/> Không giới hạn số lần thi thử trực tuyến</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400 shrink-0"/> Xem giải thích chi tiết, bước giải và mẹo làm bài</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400 shrink-0"/> Lưu trữ toàn bộ lịch sử thi và biểu đồ tiến bộ học tập</li>
                            </ul>

                            {payment && (
                                <div className="text-sm bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
                                    <p className="mb-1 text-xs uppercase text-indigo-200 font-bold">Ngân hàng MB Bank (Quân Đội)</p>
                                    <p className="font-mono text-lg font-bold text-white">{payment.account}</p>
                                    <p className="text-indigo-100">{payment.account_name}</p>
                                    <p className="mt-2 text-xs uppercase text-indigo-200 font-bold">Nội dung chuyển khoản</p>
                                    <p className="font-mono font-bold text-amber-300 bg-black/25 px-2 py-1 rounded mt-1 inline-block select-all break-all">{payment.code}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                            {payment?.status === 'PENDING' && (
                                <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center">
                                    <img src={payment.qr_url} alt="QR Code" className="w-48 h-48 object-contain rounded-lg"/>
                                    <div className="text-center mt-3 text-slate-800 font-bold text-xs flex items-center justify-center gap-1">
                                        <QrCode size={14}/> Quét mã bằng ứng dụng ngân hàng
                                    </div>
                                    <div className="text-center mt-1 text-indigo-600 font-black text-lg">{priceDisplay}</div>
                                </div>
                            )}

                            {(!payment || payment.status !== 'PENDING') && (
                                <button 
                                    onClick={handleCreatePayment} 
                                    disabled={creatingPayment} 
                                    className="bg-white hover:bg-slate-50 text-indigo-700 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {creatingPayment ? 'Đang tạo mã...' : 'Tạo mã thanh toán Pro'}
                                </button>
                            )}

                            <button 
                                onClick={handleRenewPro} 
                                disabled={isCheckingPlan} 
                                className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 w-full justify-center disabled:opacity-50 text-xs"
                            >
                                <RefreshCw size={14} className={isCheckingPlan ? 'animate-spin' : ''}/> Kiểm tra trạng thái kích hoạt Pro
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: API KEY SETTINGS */}
            {activeTab === 'API' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-2xl space-y-4">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <Key size={20} className="text-amber-500"/> Cấu hình Google Gemini AI Key
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Nhập API Key từ Google AI Studio để hệ thống sử dụng model AI tối tân phục vụ việc giải toán và phân tích câu hỏi. Thầy/cô và học sinh có thể nhập nhiều key cách nhau bởi dấu phẩy.
                    </p>
                    <div className="space-y-3 pt-2">
                        <textarea 
                            rows={3}
                            value={apiKey} 
                            onChange={e => setApiKey(e.target.value)} 
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 font-mono text-xs"
                            placeholder="AIzaSy... (nhập 1 hoặc nhiều key cách nhau bằng dấu phẩy)"
                        />
                        <Button 
                            onClick={handleSaveKey} 
                            disabled={isSavingKey} 
                            variant="primary"
                            className="w-full font-bold"
                        >
                            <Save size={16} className="mr-1.5"/> {isSavingKey ? 'Đang lưu...' : 'Lưu API Key'}
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
};
