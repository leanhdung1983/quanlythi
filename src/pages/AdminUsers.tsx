
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Trash2, Shield, Search, Calendar, RefreshCw, Edit2, Loader2, Users, AlertOctagon, CheckCircle2, Settings2 } from 'lucide-react';
import { User } from '../types';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Edit Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ full_name: '', email: '', school: '', role: 'TEACHER' as User['role'] });

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ username: '', password: '', full_name: '', email: '', school: '', role: 'TEACHER' as User['role'] });
    const [isCreating, setIsCreating] = useState(false);

    // Settings State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [geminiKey, setGeminiKey] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Password Reset Result State
    const [resetResult, setResetResult] = useState<{ username: string, pass: string } | null>(null);

    const handleOpenSettings = async () => {
        try {
            const data = await apiService.getSettings();
            if (data && data.gemini_api_key) {
                setGeminiKey(data.gemini_api_key);
            } else {
                setGeminiKey('');
            }
            setShowSettingsModal(true);
        } catch(e: any) {
            alert("Lỗi tải settings: " + e.message);
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await apiService.saveSetting('gemini_api_key', geminiKey);
            alert("Lưu thiết lập thành công!");
            setShowSettingsModal(false);
        } catch(e: any) {
            alert("Lỗi lưu thiết lập: " + e.message);
        } finally {
            setIsSavingSettings(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await apiService.fetchUsers();
            // Ensure all fields exist (tự động tạo field thiếu khi chạy chương trình)
            const sanitized = (data || []).map((u: any) => ({
                ...u,
                full_name: u.full_name || '',
                email: u.email || '',
                school: u.school || '',
                is_pro: !!u.is_pro,
                role: u.role || 'TEACHER',
                expiry_date: u.expiry_date || null,
                created_at: u.created_at || new Date().toISOString()
            }));
            setUsers(sanitized);
        } catch {
            console.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!createForm.username || !createForm.password) return alert("Vui lòng nhập Username và Password");
        setIsCreating(true);
        try {
            await apiService.createUser(createForm);
            setShowCreateModal(false);
            setCreateForm({ username: '', password: '', full_name: '', email: '', school: '', role: 'TEACHER' });
            loadUsers();
            alert("Tạo người dùng thành công!");
        } catch (e: any) {
            alert("Lỗi: " + e.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleTogglePro = async (id: number, current: boolean) => {
        if (!confirm(`Xác nhận ${current ? 'HUỶ' : 'KÍCH HOẠT'} gói PRO cho user này?\n(Kích hoạt sẽ cộng thêm 1 năm sử dụng)`)) return;
        await apiService.togglePro(id, !current);
        loadUsers();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Xoá người dùng này? Hành động không thể hoàn tác.")) return;
        await apiService.deleteUser(id);
        loadUsers();
    };

    const handleResetPassword = async (id: number, username: string) => {
        if (!confirm(`Xác nhận reset mật khẩu cho ${username}? Mật khẩu mới sẽ được tạo ngẫu nhiên.`)) return;
        try {
            const res = await apiService.adminResetPassword(id);
            if (res.newPassword) {
                setResetResult({ username, pass: res.newPassword });
            } else {
                alert("Reset thành công.");
            }
        } catch { 
            alert("Lỗi khi reset mật khẩu"); 
        }
    };

    const handleNuclearReset = async () => {
        if (!confirm("⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG!\n\nHành động này sẽ XOÁ TOÀN BỘ:\n- Tất cả câu hỏi\n- Tất cả Metadata ID6\n- Tất cả Chương, Bài, Dạng đã tạo\n- Tất cả kết quả thi và ma trận đã lưu\n\nBạn có chắc chắn muốn thực hiện? Hành động này KHÔNG THỂ HOÀN TÁC.")) return;
        
        const secondConfirm = prompt("Để xác nhận, hãy nhập 'XOÁ TẤT CẢ' vào ô bên dưới:");
        if (secondConfirm !== 'XOÁ TẤT CẢ') return;

        setLoading(true);
        try {
            await apiService.nuclearReset();
            alert("Đã xoá sạch toàn bộ dữ liệu ID6 thành công!");
            loadUsers();
        } catch {
            alert("Lỗi khi xoá dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleClearChapters = async () => {
        if (!confirm("Xác nhận xoá toàn bộ danh sách Chương?")) return;
        setLoading(true);
        try {
            await apiService.clearChapters();
            alert("Đã xoá toàn bộ Chương.");
        } catch { alert("Lỗi"); }
        finally { setLoading(false); }
    };

    const handleClearUnits = async () => {
        if (!confirm("Xác nhận xoá toàn bộ danh sách Bài?")) return;
        setLoading(true);
        try {
            await apiService.clearUnits();
            alert("Đã xoá toàn bộ Bài.");
        } catch { alert("Lỗi"); }
        finally { setLoading(false); }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({ 
            full_name: user.full_name || '', 
            email: user.email || '', 
            school: user.school || '',
            role: user.role
        });
    };

    const saveEdit = async () => {
        if (!editingUser) return;
        try {
            await apiService.updateUserInfo(editingUser.id, editForm);
            setEditingUser(null);
            loadUsers();
        } catch(e: unknown) { 
            const error = e as Error;
            alert(error.message); 
        }
    };

    const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col space-y-4 relative">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Shield className="text-red-600"/> Quản trị người dùng</h1>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input className="w-full pl-10 p-2 border border-slate-200 rounded-lg outline-none" placeholder="Tìm kiếm user..." value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-sm"
                >
                    <Users size={18}/>
                    <span>Thêm User</span>
                </button>
                <button onClick={loadUsers} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Làm mới">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
                </button>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleOpenSettings}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all border border-blue-100"
                    >
                        <Settings2 size={16}/>
                        Thiết lập Gemini
                    </button>
                    <button 
                        onClick={handleClearChapters}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold transition-all border border-orange-100"
                    >
                        Xoá Chương
                    </button>
                    <button 
                        onClick={handleClearUnits}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition-all border border-amber-100"
                    >
                        Xoá Bài
                    </button>
                    <button 
                        onClick={handleNuclearReset}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-all border border-red-100"
                        title="Xoá sạch toàn bộ dữ liệu ID6"
                    >
                        <AlertOctagon size={18}/>
                        <span>Nuclear Reset</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 size={32} className="animate-spin text-primary-500"/>
                        <span className="text-sm font-medium">Đang tải danh sách...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Users size={48} className="opacity-20"/>
                        <span className="text-sm">Không tìm thấy người dùng nào.</span>
                    </div>
                ) : (
                    <div className="overflow-auto h-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10 font-bold text-slate-600 text-xs uppercase">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Info</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4">Expiry Date</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filtered.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{u.username}</div>
                                            <div className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{u.full_name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                            <div className="text-xs text-slate-400">{u.school}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleTogglePro(u.id, u.is_pro)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${u.is_pro ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                                            >
                                                {u.is_pro ? 'PRO MEMBER' : 'FREE TIER'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            {u.expiry_date ? (
                                                <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                                                    <Calendar size={14} className="text-slate-400"/>
                                                    {new Date(u.expiry_date).toLocaleDateString('vi-VN')}
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">-</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => openEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa thông tin">
                                                    <Edit2 size={18}/>
                                                </button>
                                                <button onClick={() => handleResetPassword(u.id, u.username)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Reset Mật khẩu">
                                                    <RefreshCw size={18}/>
                                                </button>
                                                {u.role !== 'ADMIN' && (
                                                    <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={18}/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Sửa thông tin: {editingUser.username}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Họ tên</label>
                                <input className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Họ tên" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email</label>
                                <input className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Trường</label>
                                <input className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Trường" value={editForm.school} onChange={e => setEditForm({...editForm, school: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vai trò</label>
                                <select 
                                    className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={editForm.role}
                                    onChange={e => setEditForm({...editForm, role: e.target.value as User['role']})}
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="TEACHER">TEACHER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Huỷ</button>
                            <button onClick={saveEdit} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-sm">Lưu Thay Đổi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Thêm người dùng mới</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Username *</label>
                                    <input className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Password *</label>
                                    <input className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})}/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Họ tên</label>
                                <input className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={createForm.full_name} onChange={e => setCreateForm({...createForm, full_name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email</label>
                                <input className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vai trò</label>
                                <select 
                                    className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={createForm.role}
                                    onChange={e => setCreateForm({...createForm, role: e.target.value as User['role']})}
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="TEACHER">TEACHER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Huỷ</button>
                            <button 
                                onClick={handleCreateUser} 
                                disabled={isCreating}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                            >
                                {isCreating ? 'Đang tạo...' : 'Tạo User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Settings2 size={18} className="text-blue-500" /> Thiết lập API Gemini</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg shadow-sm border border-slate-200">
                                Đóng
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Gemini API Key</label>
                                <input 
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
                                    placeholder="AIzaSy..."
                                    value={geminiKey}
                                    onChange={e => setGeminiKey(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 mt-2">API key dùng để tạo chương, bài học và câu hỏi bằng AI.</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                            <button 
                                onClick={() => setShowSettingsModal(false)}
                                className="flex-1 py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSavingSettings}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <Settings2 size={18} />}
                                Lưu Thiết Lập
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Result Modal */}
            {resetResult && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32}/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Reset thành công!</h3>
                        <p className="text-slate-500 text-sm mb-6">Mật khẩu mới cho user <span className="font-bold text-slate-800">{resetResult.username}</span> là:</p>
                        
                        <div className="bg-slate-100 p-4 rounded-xl font-mono text-xl font-bold text-indigo-600 mb-6 select-all border border-slate-200">
                            {resetResult.pass}
                        </div>
                        
                        <button 
                            onClick={() => setResetResult(null)}
                            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
