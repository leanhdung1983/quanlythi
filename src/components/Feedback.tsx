
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, CheckCircle, Clock, User as UserIcon, Mail } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { UserFeedback } from '../types';
import { motion } from 'motion/react';

export const UserFeedbackForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !content.trim()) return;

        setIsSubmitting(true);
        try {
            await apiService.submitFeedback({ user_id: user.id, content });
            setIsSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error("Lỗi gửi góp ý:", error);
            alert("Không thể gửi góp ý. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Gửi Góp Ý</h3>
                            <p className="text-indigo-100 text-xs">Chúng tôi luôn lắng nghe bạn</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-xl mb-2">Cảm ơn bạn!</h4>
                            <p className="text-slate-500">Góp ý của bạn đã được gửi đến ban quản trị.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung góp ý</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Nhập ý kiến đóng góp hoặc báo lỗi của bạn tại đây..."
                                    className="w-full h-40 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !content.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Gửi Góp Ý Ngay
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export const AdminFeedbackViewer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);

    useEffect(() => {
        loadFeedback();
    }, []);

    const loadFeedback = async () => {
        try {
            const data = await apiService.fetchFeedback();
            // Sắp xếp: Chưa đọc lên đầu, sau đó theo thời gian mới nhất
            const sorted = data.sort((a, b) => {
                if (a.is_read === b.is_read) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.is_read ? 1 : -1;
            });
            setFeedbackList(sorted);
        } catch (error) {
            console.error("Lỗi tải góp ý:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await apiService.markFeedbackRead(id);
            setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, is_read: true } : f));
            if (selectedFeedback?.id === id) {
                setSelectedFeedback(prev => prev ? { ...prev, is_read: true } : null);
            }
        } catch (error) {
            console.error("Lỗi đánh dấu đã xem:", error);
        }
    };

    const unreadCount = feedbackList.filter(f => !f.is_read).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2.5 rounded-xl">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Hộp Thư Góp Ý</h3>
                            <p className="text-slate-400 text-xs">Bạn có {unreadCount} góp ý chưa đọc</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className="w-1/3 border-r border-slate-100 overflow-y-auto custom-scrollbar bg-slate-50/50">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-slate-400 text-xs">Đang tải...</p>
                            </div>
                        ) : feedbackList.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Chưa có góp ý nào</p>
                            </div>
                        ) : (
                            feedbackList.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedFeedback(f)}
                                    className={`w-full text-left p-4 border-b border-slate-100 transition-all hover:bg-white relative ${selectedFeedback?.id === f.id ? 'bg-white ring-1 ring-inset ring-indigo-500/10' : ''}`}
                                >
                                    {!f.is_read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.6)]" />}
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold truncate max-w-[120px] ${f.is_read ? 'text-slate-500' : 'text-slate-900'}`}>
                                            {f.full_name || f.username}
                                        </span>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {new Date(f.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <p className={`text-xs line-clamp-2 ${f.is_read ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                                        {f.content}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Detail */}
                    <div className="flex-1 bg-white overflow-y-auto p-8 custom-scrollbar">
                        {selectedFeedback ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                            <UserIcon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{selectedFeedback.full_name || selectedFeedback.username}</h4>
                                            <div className="flex items-center gap-3 text-slate-500 text-sm">
                                                <span className="flex items-center gap-1"><Mail size={14}/> {selectedFeedback.email}</span>
                                                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(selectedFeedback.created_at).toLocaleString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {!selectedFeedback.is_read && (
                                        <button
                                            onClick={() => handleMarkRead(selectedFeedback.id)}
                                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            Đánh dấu đã đọc
                                        </button>
                                    )}
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-8 text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 min-h-[200px]">
                                    {selectedFeedback.content}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare size={40} className="opacity-20" />
                                </div>
                                <p className="font-medium">Chọn một góp ý để xem chi tiết</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
