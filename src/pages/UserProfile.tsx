
import React, { useState } from 'react';
import { useAuthStore } from '../services/authStore';
import { apiService } from '../services/api';
import { Save, Key, Crown, User as UserIcon, CheckCircle2, QrCode, CalendarClock, Edit2, X, RefreshCw } from 'lucide-react';

export const UserProfile: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const [apiKey, setApiKey] = useState(user?.api_key || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ 
        full_name: user?.full_name || '', 
        email: user?.email || '', 
        school: user?.school || '',
        grade_id: user?.grade_id || 0
    });

    if (!user) return <div>Please login.</div>;

    const handleSaveKey = async () => {
        setIsSaving(true);
        try {
            await apiService.updateApiKey(user.id, apiKey);
            updateUser({ api_key: apiKey });
            alert("Lưu API Key thành công!");
        } catch {
            alert("Lỗi lưu key.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const dataToUpdate = {
                full_name: editForm.full_name,
                email: editForm.email,
                school: editForm.school,
                grade_id: editForm.grade_id
            };
            
            const res = await apiService.updateUserInfo(user.id, dataToUpdate);
            if(res.success) {
                updateUser(dataToUpdate);
                setIsEditing(false);
                alert("Cập nhật thông tin thành công!");
            } else {
                alert("Cập nhật thất bại: " + (res.message || "Unknown error"));
            }
        } catch {
            alert("Lỗi cập nhật");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRenewPro = async () => {
        if(!confirm(`Bạn đã thanh toán gia hạn? Nhấn OK để gửi yêu cầu hệ thống gia hạn ngay lập tức (Demo mode: tự gia hạn).`)) return;
        try {
            const res = await apiService.renewPro(user.id);
            if(res.success && res.new_expiry) {
                updateUser({ is_pro: true, expiry_date: res.new_expiry });
                alert("Gia hạn thành công!");
            }
        } catch {
            alert("Lỗi");
        }
    };

    // Role-based pricing
    const isTeacher = user.role === 'TEACHER';
    const amount = isTeacher ? 300000 : 100000;
    const priceDisplay = isTeacher ? "300.000đ" : "100.000đ";
    
    const bankId = 'MB';
    const accNo = '04567896868';
    const accName = 'ID6 ADMIN';
    const content = `ID6PRO ${user.username}`;
    const qrLink = `https://img.vietqr.io/image/${bankId}-${accNo}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accName)}`;

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                    <div className="absolute top-4 right-4">
                        {isEditing ? (
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 rounded-full text-primary-600"><Edit2 size={20}/></button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-slate-100 rounded-full">
                            <UserIcon size={32} className="text-slate-500"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{user.full_name}</h2>
                            <p className="text-slate-500">@{user.username}</p>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-3 animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Họ và Tên</label>
                                <input className="w-full border p-2 rounded-lg text-sm" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Email</label>
                                <input className="w-full border p-2 rounded-lg text-sm" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Trường/Đơn vị</label>
                                <input className="w-full border p-2 rounded-lg text-sm" value={editForm.school} onChange={e => setEditForm({...editForm, school: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Lớp đang học</label>
                                <select 
                                    className="w-full border p-2 rounded-lg text-sm" 
                                    value={editForm.grade_id} 
                                    onChange={e => setEditForm({...editForm, grade_id: parseInt(e.target.value)})}
                                >
                                    <option value={0}>Chưa chọn</option>
                                    <option value={6}>Lớp 6</option>
                                    <option value={7}>Lớp 7</option>
                                    <option value={8}>Lớp 8</option>
                                    <option value={9}>Lớp 9</option>
                                    <option value={10}>Lớp 10</option>
                                    <option value={11}>Lớp 11</option>
                                    <option value={12}>Lớp 12</option>
                                </select>
                            </div>
                            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold mt-2 hover:bg-primary-700">
                                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-bold text-slate-500">Email</span>
                                <span className="text-sm text-slate-700">{user.email || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-bold text-slate-500">Đơn vị</span>
                                <span className="text-sm text-slate-700">{user.school || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-bold text-slate-500">Lớp</span>
                                <span className="text-sm text-slate-700">{user.grade_id ? `Lớp ${user.grade_id}` : 'Chưa chọn'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-bold text-slate-500">Vai trò</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{user.role}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-bold text-slate-500">Trạng thái</span>
                                {user.is_pro ? (
                                    <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><Crown size={16}/> PRO</span>
                                ) : (
                                    <span className="text-slate-500 font-bold text-sm">Free Tier</span>
                                )}
                            </div>
                            {user.is_pro && user.expiry_date && (
                                <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                                    <span className="text-sm font-bold text-green-700 flex items-center gap-2"><CalendarClock size={16}/> Hết hạn</span>
                                    <span className="text-sm font-bold text-green-800">{new Date(user.expiry_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* API Key Settings */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Key size={20} className="text-amber-500"/> Gemini API Key</h3>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        Nhập API Key Google AI Studio. <strong>Mẹo chống hết hạn mức (Quota 429):</strong> Thầy/cô có thể nhập nhiều API Key (cách nhau bởi dấu phẩy hoặc xuống dòng) để hệ thống tự động xoay vòng khi hết hạn mức.
                    </p>
                    <div className="space-y-3">
                        <textarea 
                            rows={2}
                            value={apiKey} 
                            onChange={e => setApiKey(e.target.value)} 
                            className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                            placeholder="AIzaSy... (nhập 1 hoặc nhiều key cách nhau bằng dấu phẩy)"
                        />
                        <button onClick={handleSaveKey} disabled={isSaving} className="w-full bg-slate-800 text-white py-2 rounded-xl font-bold hover:bg-slate-700 transition-colors flex justify-center items-center gap-2">
                            <Save size={16}/> {isSaving ? 'Đang lưu...' : 'Lưu Key'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Section (Visible for upgrade or renewal) */}
            {user.role !== 'ADMIN' && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10"><Crown size={200}/></div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1">
                            <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
                                <Crown className="text-yellow-400"/> {user.is_pro ? 'Gia hạn gói PRO' : 'Nâng cấp lên PRO'}
                            </h2>
                            <p className="text-indigo-200 text-sm mb-4 font-medium">Chi phí ({user.role}): <span className="text-white font-bold text-lg">{priceDisplay} / 1 năm</span></p>
                            
                            {user.role === 'STUDENT' ? (
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-400"/> Không giới hạn số lần thi thử</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-400"/> Xem lời giải chi tiết</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-400"/> Lưu lịch sử làm bài không giới hạn</li>
                                </ul>
                            ) : (
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-400"/> Không giới hạn sử dụng Tool (Ma trận, Gán ID...)</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-400"/> Quản lý kho câu hỏi không giới hạn</li>
                                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-400"/> Ưu tiên hỗ trợ</li>
                                </ul>
                            )}

                            <div className="text-sm opacity-90 bg-white/10 p-4 rounded-xl border border-white/20">
                                <p className="mb-1 text-xs uppercase text-indigo-300 font-bold">Ngân hàng MB Bank (Quân Đội)</p>
                                <p className="font-mono text-lg font-bold">04567896868</p>
                                <p className="mt-2 text-xs uppercase text-indigo-300 font-bold">Nội dung chuyển khoản</p>
                                <p className="font-mono font-bold text-yellow-300 bg-black/20 p-2 rounded mt-1 inline-block select-all">{content}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center">
                                <img src={qrLink} alt="QR Code" className="w-48 h-48 object-contain rounded-lg"/>
                                <div className="text-center mt-3 text-slate-800 font-bold text-sm flex items-center justify-center gap-1"><QrCode size={14}/> Quét mã để thanh toán</div>
                                <div className="text-center mt-1 text-primary-600 font-black text-lg">{priceDisplay}</div>
                            </div>
                            {user.is_pro && (
                                <button onClick={handleRenewPro} className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 flex items-center gap-2 w-full justify-center">
                                    <RefreshCw size={18}/> Xác nhận đã gia hạn
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
