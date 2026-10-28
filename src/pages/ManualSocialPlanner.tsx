import React, { useEffect, useState, useRef } from 'react';
import { 
    CheckCircle2, ClipboardCopy, ExternalLink, RefreshCw, Search, Trash2, 
    Settings, Play, Clock, AlertTriangle, ShieldCheck, Image as ImageIcon, 
    Sparkles, Eye, EyeOff, Check, X, ArrowRight, Calendar, AlertCircle
} from 'lucide-react';
import { MathRenderer } from '../components/MathRenderer';

type Question = { 
    id: number; 
    id_full: string; 
    raw_latex: string; 
    description: string; 
    used_count: number 
};

type Post = { 
    id: number; 
    question_id: number; 
    id_full: string | null; 
    raw_latex: string | null;
    caption: string; 
    scheduled_at: string; 
    status: 'DRAFT' | 'APPROVED' | 'PUBLISHING' | 'POSTED' | 'FAILED' | 'UNCERTAIN' | 'CANCELLED'; 
    has_image: number; 
    last_error: string | null;
    posted_at?: string | null;
    fb_post_id?: string | null;
    fb_photo_id?: string | null;
};

type SocialConfig = {
    pageId: string;
    configured: boolean;
    autoEnabled: boolean;
    graphVersion: string;
    pageName: string;
    tokenMasked?: string;
};

async function api(url: string, body?: object) {
    const response = await fetch(url, body ? { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
    } : undefined);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
}

const templateDefault = '📘 Bài toán ngày {NGAY}\n\nChủ đề: {CHUDE}\nMã ID6: {ID}\n\nBạn hãy thử giải và chia sẻ đáp án ở bình luận nhé!\n\n#LuyenToanThongMinh #ID6 #ExamHub';

const tomorrow = () => { 
    const d = new Date(Date.now() + 86_400_000); 
    d.setHours(7, 30, 0, 0); // Mặc định 07:30 sáng ngày mai
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); 
};

const localTime = (value: string) => {
    try {
        const d = new Date(value.includes('Z') || value.includes('+') ? value : `${value.replace(' ', 'T')}Z`);
        return d.toLocaleString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    } catch {
        return value;
    }
};

// Tạo ảnh Banner Facebook tự động từ bài toán trên Canvas
function createQuestionBanner(idCode: string, topic: string, rawContent: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Không thể khởi tạo Canvas'));

            // Nền Gradient thương hiệu xanh tím sang trọng
            const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
            bgGradient.addColorStop(0, '#0f172a'); // slate-900
            bgGradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
            bgGradient.addColorStop(1, '#1e293b'); // slate-800
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, 1200, 630);

            // Khung nội dung trắng bo góc
            ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
            ctx.beginPath();
            ctx.roundRect(40, 40, 1120, 550, 24);
            ctx.fill();

            // Viền trên nhấn màu Indigo
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.roundRect(40, 40, 1120, 12, [24, 24, 0, 0]);
            ctx.fill();

            // Header: Logo & Mã ID6
            ctx.fillStyle = '#4f46e5';
            ctx.font = 'bold 22px system-ui, sans-serif';
            ctx.fillText('LUYỆN TOÁN THÔNG MINH · EXAMHUB', 80, 95);

            // Badge ID6
            ctx.fillStyle = '#eef2ff';
            ctx.beginPath();
            ctx.roundRect(80, 115, 220, 36, 10);
            ctx.fill();
            ctx.fillStyle = '#4338ca';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(`MÃ ID6: ${idCode || 'NO-ID'}`, 95, 139);

            // Chủ đề
            ctx.fillStyle = '#64748b';
            ctx.font = '500 18px system-ui, sans-serif';
            ctx.fillText(`Chủ đề: ${topic || 'Luyện tập toán học'}`, 320, 139);

            // Đường kẻ phân cách
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(80, 175);
            ctx.lineTo(1120, 175);
            ctx.stroke();

            // Nội dung tóm tắt câu hỏi
            ctx.fillStyle = '#1e293b';
            ctx.font = '500 24px system-ui, sans-serif';
            
            // Xóa một số macro LaTeX cơ bản để text dễ đọc
            let cleanText = rawContent
                .replace(/\\begin\{[a-zA-Z*]+\}/g, '')
                .replace(/\\end\{[a-zA-Z*]+\}/g, '')
                .replace(/\\[a-zA-Z]+/g, ' ')
                .replace(/[{}$]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (!cleanText) cleanText = 'Bài tập trắc nghiệm toán học định dạng chuẩn ID6.';

            // Tách dòng văn bản
            const words = cleanText.split(' ');
            let line = '';
            let y = 225;
            const maxLines = 8;
            let lineCount = 0;

            for (const word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > 960 && line !== '') {
                    ctx.fillText(line, 80, y);
                    line = word + ' ';
                    y += 36;
                    lineCount++;
                    if (lineCount >= maxLines) {
                        ctx.fillText(line + '...', 80, y);
                        break;
                    }
                } else {
                    line = testLine;
                }
            }
            if (lineCount < maxLines && line) {
                ctx.fillText(line, 80, y);
            }

            // Footer kêu gọi bình luận
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.roundRect(80, 510, 1040, 60, 14);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            ctx.fillStyle = '#4f46e5';
            ctx.font = 'bold 20px system-ui, sans-serif';
            ctx.fillText('💡 Thử sức giải bài toán này và bình luận đáp án bên dưới nhé!', 110, 547);

            resolve(canvas.toDataURL('image/png'));
        } catch (err) {
            reject(err);
        }
    });
}

export const ManualSocialPlanner: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [search, setSearch] = useState('');
    const [onlyUnused, setOnlyUnused] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [preview, setPreview] = useState<number | null>(null);
    const [start, setStart] = useState(tomorrow);
    const [days, setDays] = useState(1);
    const [template, setTemplate] = useState(templateDefault);
    const [autoApproveOnCreate, setAutoApproveOnCreate] = useState(true);
    
    const [edits, setEdits] = useState<Record<number, string>>({});
    const [editSchedule, setEditSchedule] = useState<Record<number, string>>({});
    const [images, setImages] = useState<Record<number, string>>({});
    const [filter, setFilter] = useState<'APPROVED' | 'DRAFT' | 'POSTED' | 'FAILED' | 'ALL'>('APPROVED');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Cấu hình Facebook Modal & Config state
    const [config, setConfig] = useState<SocialConfig | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [cfgPageId, setCfgPageId] = useState('');
    const [cfgToken, setCfgToken] = useState('');
    const [cfgAutoEnabled, setCfgAutoEnabled] = useState(true);
    const [testingConnection, setTestingConnection] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const loadConfig = async () => {
        try {
            const res = await api('/api/admin/social/config');
            if (res.data) {
                setConfig(res.data);
                setCfgPageId(res.data.pageId || '');
                setCfgAutoEnabled(Boolean(res.data.autoEnabled));
            }
        } catch (_) {}
    };

    const loadQuestions = async (term = '', unused = onlyUnused) => {
        try {
            const url = `/api/admin/social/questions?limit=60&search=${encodeURIComponent(term)}${unused ? '&unused=1' : ''}`;
            const res = await api(url);
            setQuestions(res.data || []);
        } catch (e: any) { 
            setError(e.message); 
        }
    };

    const loadPosts = async () => {
        try {
            const rows = (await api('/api/admin/social/queue')).data || [];
            setPosts(rows);
            setEdits(Object.fromEntries(rows.map((row: Post) => [row.id, row.caption])));
            setEditSchedule(Object.fromEntries(rows.map((row: Post) => [row.id, row.scheduled_at])));
        } catch (e: any) { 
            setError(e.message); 
        }
    };

    useEffect(() => { 
        void loadConfig();
        void loadQuestions(); 
        void loadPosts(); 
    }, []);

    const toggle = (id: number) => {
        setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
    };

    const selectQuick = (count: number) => {
        const available = questions.filter(q => !selected.includes(q.id)).slice(0, count);
        setSelected(old => [...old, ...available.map(q => q.id)].slice(0, 30));
    };

    const perform = async (fn: () => Promise<void>) => {
        setBusy(true); 
        setError(''); 
        setMessage('');
        try { 
            await fn(); 
        } catch (e: any) { 
            setError(e.message); 
        } finally { 
            setBusy(false); 
        }
    };

    const prepare = () => perform(async () => {
        if (!selected.length) throw new Error('Hãy chọn ít nhất một câu hỏi.');
        const result = await api('/api/admin/social/prepare', {
            question_ids: selected, 
            scheduled_start: new Date(start).toISOString(), 
            interval_days: days, 
            caption_template: template,
            auto_approve: autoApproveOnCreate
        });
        setSelected([]);
        const modeText = autoApproveOnCreate ? 'và đã lên lịch tự động đăng' : 'dưới dạng bản nháp';
        setMessage(`Đã tạo thành công ${result.data.length} bài đăng ${modeText}!`);
        await loadPosts();
        if (autoApproveOnCreate) setFilter('APPROVED');
    });

    const copy = async (value: string) => {
        try { 
            await navigator.clipboard.writeText(value); 
            setMessage('Đã sao chép caption vào bộ nhớ tạm.'); 
            setError(''); 
        } catch { 
            setError('Không sao chép được; vui lòng bôi đen và sao chép thủ công.'); 
        }
    };

    const readImage = (id: number, file?: File) => {
        if (!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            return setError('Chỉ chấp nhận file ảnh PNG hoặc JPEG dung lượng dưới 5 MB.');
        }
        const reader = new FileReader();
        reader.onload = () => setImages(old => ({ ...old, [id]: String(reader.result || '') }));
        reader.readAsDataURL(file);
    };

    const autoGenerateImage = async (post: Post) => {
        try {
            setMessage('Đang kết xuất ảnh bài toán...');
            const dataUrl = await createQuestionBanner(
                post.id_full || 'NO-ID', 
                'Toán học ID6', 
                post.raw_latex || post.caption
            );
            setImages(old => ({ ...old, [post.id]: dataUrl }));
            setMessage('Đã tạo ảnh bài toán tự động! Nhấn "Lưu thay đổi" để áp dụng.');
        } catch (err: any) {
            setError('Không thể tạo ảnh tự động: ' + err.message);
        }
    };

    const save = (post: Post) => perform(async () => {
        await api(`/api/admin/social/queue/${post.id}/update`, { 
            caption: edits[post.id], 
            scheduled_at: editSchedule[post.id],
            image_data_url: images[post.id] 
        });
        setMessage('Đã lưu nội dung và lịch đăng.');
        await loadPosts();
        setImages(old => { const next = { ...old }; delete next[post.id]; return next; });
    });

    // Duyệt tự động đăng bài
    const approve = (post: Post) => perform(async () => {
        await api(`/api/admin/social/queue/${post.id}/approve`, {});
        setMessage(`Bài #${post.id} đã được duyệt! Hệ thống sẽ tự động đăng lên Facebook khi đến giờ hẹn.`);
        await loadPosts();
    });

    // Đăng ngay lập tức
    const publishNow = (post: Post) => {
        if (!window.confirm(`Bạn muốn đăng ngay bài #${post.id} lên trang Facebook quản lý?`)) return;
        void perform(async () => {
            setMessage(`Đang gửi bài #${post.id} lên Facebook...`);
            const res = await api(`/api/admin/social/queue/${post.id}/publish-now`, {});
            setMessage(`Đã đăng bài #${post.id} thành công lên Facebook! ID bài viết: ${res.data?.postId || res.data?.photoId}`);
            await loadPosts();
        });
    };

    // Đánh dấu đã đăng thủ công
    const markPosted = (post: Post) => {
        if (!window.confirm('Bạn xác nhận đã đăng bài này lên Facebook Page rồi?')) return;
        void perform(async () => { 
            await api(`/api/admin/social/queue/${post.id}/mark-posted`, {}); 
            setMessage('Đã đánh dấu bài là đã đăng.'); 
            await loadPosts(); 
        });
    };

    // Thử lại bài lỗi
    const retry = (post: Post) => perform(async () => {
        await api(`/api/admin/social/queue/${post.id}/retry`, {});
        setMessage(`Đã đưa bài #${post.id} trở lại hàng chờ tự động đăng.`);
        await loadPosts();
    });

    // Hủy bài
    const cancel = (post: Post) => {
        if (!window.confirm('Bạn có chắc muốn hủy bài này khỏi hàng chờ?')) return;
        void perform(async () => { 
            await api(`/api/admin/social/queue/${post.id}/cancel`, {}); 
            setMessage('Đã hủy bài viết.');
            await loadPosts(); 
        });
    };

    // Lưu cấu hình Facebook Page
    const saveFacebookConfig = async () => {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const body: any = {
                page_id: cfgPageId.trim(),
                auto_enabled: cfgAutoEnabled
            };
            if (cfgToken.trim()) {
                body.access_token = cfgToken.trim();
            }
            const res = await api('/api/admin/social/config', body);
            setMessage(res.message || 'Đã lưu cấu hình Facebook.');
            await loadConfig();
            setShowConfigModal(false);
            setCfgToken('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    // Kiểm tra kết nối Facebook Page
    const testConnection = async () => {
        setTestingConnection(true);
        setError('');
        setMessage('');
        try {
            const body: any = { page_id: cfgPageId.trim() };
            if (cfgToken.trim()) body.access_token = cfgToken.trim();
            const res = await api('/api/admin/social/test-connection', body);
            setMessage(`Kết nối Facebook Page thành công! Tên Trang: ${res.data.name} (ID: ${res.data.id})`);
            await loadConfig();
        } catch (e: any) {
            setError('Kết nối thất bại: ' + e.message);
        } finally {
            setTestingConnection(false);
        }
    };

    const statusCounts = {
        APPROVED: posts.filter(p => p.status === 'APPROVED').length,
        DRAFT: posts.filter(p => p.status === 'DRAFT').length,
        POSTED: posts.filter(p => p.status === 'POSTED').length,
        FAILED: posts.filter(p => p.status === 'FAILED' || p.status === 'UNCERTAIN').length,
        ALL: posts.length
    };

    return (
        <div className="max-w-7xl mx-auto pb-16 space-y-7">
            {/* Header Banner */}
            <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles size={180} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3">
                            <Sparkles size={14} className="text-yellow-400" />
                            <span>TỰ ĐỘNG ĐĂNG BÀI FACEBOOK TỪ NGÂN HÀNG CÂU HỎI</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Nội Dung Facebook Tự Động</h1>
                        <p className="mt-2 text-indigo-100 max-w-2xl text-sm sm:text-base leading-relaxed">
                            Chọn câu hỏi chuẩn ID6, lên lịch phát hành và hệ thống sẽ tự động đăng bài kèm hình ảnh lên Fanpage Facebook đúng thời gian đã hẹn.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        {/* Status Badge */}
                        <div className="bg-white/10 backdrop-blur border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${config?.configured && config?.autoEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                            <div className="text-left">
                                <span className="text-[11px] uppercase tracking-wider block text-indigo-200 font-bold">
                                    {config?.configured && config?.autoEnabled ? 'Tự động đăng: Đang bật' : 'Tự động đăng: Đang tắt'}
                                </span>
                                <span className="text-xs font-semibold text-white truncate max-w-[180px] block">
                                    {config?.pageName || (config?.configured ? 'Đã liên kết Fanpage' : 'Chưa cấu hình Token')}
                                </span>
                            </div>
                        </div>

                        {/* Nút Cấu hình */}
                        <button 
                            onClick={() => setShowConfigModal(true)}
                            className="bg-white text-indigo-950 hover:bg-indigo-50 transition-all font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                        >
                            <Settings size={18} />
                            <span>Cấu hình Trang</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Thông báo Alert */}
            {error && (
                <div role="alert" className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 flex items-start gap-3 animate-in fade-in">
                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1 text-sm font-medium">{error}</div>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                </div>
            )}
            {message && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-start gap-3 animate-in fade-in">
                    <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-600" />
                    <div className="flex-1 text-sm font-medium">{message}</div>
                    <button onClick={() => setMessage('')} className="text-emerald-500 hover:text-emerald-700"><X size={16}/></button>
                </div>
            )}

            {/* Khu vực tạo bài: 1. Chọn câu hỏi & 2. Lập lịch */}
            <div className="grid xl:grid-cols-[1.3fr_1fr] gap-6">
                {/* 1. Chọn câu hỏi từ ngân hàng */}
                <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                Chọn bài tập từ ngân hàng
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Ưu tiên câu hỏi chuẩn ID6 và chưa từng đăng.</p>
                        </div>
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-xs font-black">
                            Đã chọn: {selected.length} / 30
                        </span>
                    </div>

                    {/* Toolbar tìm kiếm & lọc nhanh */}
                    <div className="space-y-2">
                        <form onSubmit={e => { e.preventDefault(); void loadQuestions(search, onlyUnused); }} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    placeholder="Tìm theo mã ID6 hoặc nội dung bài toán..." 
                                    className="w-full pl-10 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
                                Tìm kiếm
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                                <input 
                                    type="checkbox" 
                                    checked={onlyUnused} 
                                    onChange={e => {
                                        setOnlyUnused(e.target.checked);
                                        void loadQuestions(search, e.target.checked);
                                    }} 
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Chỉ lấy câu chưa từng đăng (0 lượt dùng)</span>
                            </label>

                            <div className="flex items-center gap-1.5">
                                <button onClick={() => selectQuick(1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">
                                    +1 câu
                                </button>
                                <button onClick={() => selectQuick(5)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">
                                    +5 câu
                                </button>
                                <button onClick={() => selectQuick(10)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">
                                    +10 câu
                                </button>
                                {selected.length > 0 && (
                                    <button onClick={() => setSelected([])} className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors">
                                        Bỏ chọn
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Danh sách câu hỏi */}
                    <div className="max-h-[500px] overflow-auto space-y-2 pr-1 custom-scrollbar">
                        {questions.map(q => {
                            const isChecked = selected.includes(q.id);
                            return (
                                <div 
                                    key={q.id} 
                                    className={`border rounded-2xl p-3.5 transition-all ${isChecked ? 'border-indigo-500 bg-indigo-50/70 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={isChecked} 
                                            disabled={!isChecked && selected.length >= 30}
                                            onChange={() => toggle(q.id)} 
                                            aria-label={`Chọn câu ${q.id}`} 
                                            className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <b className="text-indigo-700 font-mono text-sm">#{q.id} · {q.id_full}</b>
                                                {q.used_count === 0 ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Mới (Chưa đăng)</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">Đã đăng {q.used_count} lần</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                {q.description || 'Luyện tập Toán'}
                                            </p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setPreview(preview === q.id ? null : q.id)} 
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                                        >
                                            {preview === q.id ? 'Thu gọn' : 'Xem đề'}
                                        </button>
                                    </div>

                                    {/* Preview MathRenderer */}
                                    {preview === q.id && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl mt-3 p-3.5 max-h-64 overflow-auto text-sm animate-in fade-in duration-200">
                                            <MathRenderer content={q.raw_latex} mode="question"/>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {!questions.length && (
                            <p className="p-8 text-center text-slate-400 text-sm">Không tìm thấy câu hỏi phù hợp.</p>
                        )}
                    </div>
                </section>

                {/* 2. Lập lịch tự động đăng */}
                <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm h-fit">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                            Lập lịch đăng bài
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Hệ thống sẽ tự động đăng bài theo khung thời gian này.</p>
                    </div>

                    <div className="space-y-3.5">
                        <label className="block text-xs font-bold text-slate-700">
                            Ngày & Giờ đăng bài đầu tiên
                            <input 
                                type="datetime-local" 
                                value={start} 
                                onChange={e => setStart(e.target.value)} 
                                className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mt-1.5 focus:outline-none focus:border-indigo-500 font-sans"
                            />
                        </label>

                        <label className="block text-xs font-bold text-slate-700">
                            Tần suất lặp (Khoảng cách giữa các bài)
                            <div className="flex items-center gap-2 mt-1.5">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="30" 
                                    value={days} 
                                    onChange={e => setDays(Math.max(1, Number(e.target.value)))} 
                                    className="block w-28 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-sans"
                                />
                                <span className="text-sm text-slate-600 font-medium">ngày / 1 bài (cùng khung giờ)</span>
                            </div>
                        </label>

                        {/* Tùy chọn Tự động đăng vs Nháp */}
                        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={autoApproveOnCreate} 
                                    onChange={e => setAutoApproveOnCreate(e.target.checked)} 
                                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="text-xs font-bold text-indigo-900 block">
                                        ⚡ Tự động đăng khi đến giờ (Khuyên dùng)
                                    </span>
                                    <span className="text-[11px] text-indigo-700 block mt-0.5 leading-relaxed">
                                        Hệ thống sẽ tự động gửi bài lên Facebook Page đúng thời gian mà không cần bạn phải thao tác lại.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <label className="block text-xs font-bold text-slate-700">
                            Mẫu caption mặc định
                            <textarea 
                                rows={6} 
                                value={template} 
                                onChange={e => setTemplate(e.target.value)} 
                                maxLength={2000} 
                                className="block w-full border border-slate-200 rounded-xl p-3 text-xs mt-1.5 focus:outline-none focus:border-indigo-500 font-sans"
                            />
                        </label>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Biến hỗ trợ: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{NGAY}'}</code> · <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{ID}'}</code> · <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{CHUDE}'}</code> · <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{NOIDUNG}'}</code>.
                        </p>

                        <button 
                            disabled={busy || !selected.length} 
                            onClick={() => void prepare()} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Calendar size={18} />
                            <span>Lên lịch tự động {selected.length} bài tập</span>
                        </button>
                    </div>
                </section>
            </div>

            {/* Khu vực 3: Danh sách & Theo dõi hàng chờ đăng bài */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span>Hàng Chờ Đăng Bài</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                                {posts.length} bài
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Quản lý các bài đã lên lịch tự động, bài nháp và theo dõi kết quả sau khi đăng.
                        </p>
                    </div>

                    {/* Bộ lọc trạng thái */}
                    <div className="flex flex-wrap items-center gap-2">
                        {(['APPROVED', 'DRAFT', 'POSTED', 'FAILED', 'ALL'] as const).map(st => {
                            const count = statusCounts[st] || 0;
                            const label = 
                                st === 'APPROVED' ? 'Chờ tự động đăng' :
                                st === 'DRAFT' ? 'Bản nháp' :
                                st === 'POSTED' ? 'Đã đăng' :
                                st === 'FAILED' ? 'Lỗi' : 'Tất cả';
                            return (
                                <button 
                                    key={st} 
                                    onClick={() => setFilter(st)} 
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        filter === st 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    <span>{label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === st ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => void loadPosts()} 
                            title="Tải lại danh sách" 
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl p-2 transition-colors ml-1"
                        >
                            <RefreshCw size={16}/>
                        </button>
                    </div>
                </div>

                {/* Danh sách bài đăng dạng thẻ */}
                <div className="grid lg:grid-cols-2 gap-5">
                    {posts
                        .filter(p => {
                            if (filter === 'ALL') return true;
                            if (filter === 'FAILED') return p.status === 'FAILED' || p.status === 'UNCERTAIN';
                            return p.status === filter;
                        })
                        .map(post => {
                            const isScheduled = post.status === 'APPROVED';
                            const isPosted = post.status === 'POSTED';
                            const isFailed = post.status === 'FAILED' || post.status === 'UNCERTAIN';
                            const isDraft = post.status === 'DRAFT';

                            return (
                                <article key={post.id} className="bg-slate-50/50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3.5 hover:border-indigo-200 transition-all flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <b className="text-indigo-700 font-mono text-sm">#{post.question_id} · {post.id_full || 'Thiếu ID'}</b>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                                                    <Clock size={13} className="text-slate-400" />
                                                    {isPosted ? `Đã đăng: ${localTime(post.posted_at || post.scheduled_at)}` : `Lịch đăng: ${localTime(post.scheduled_at)}`}
                                                </p>
                                            </div>

                                            {/* Status Badge */}
                                            <span className={`rounded-full px-3 py-1 text-[11px] font-black shrink-0 ${
                                                isPosted ? 'bg-emerald-100 text-emerald-800' :
                                                isScheduled ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                                                isFailed ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {isPosted ? '✓ Đã đăng' :
                                                 isScheduled ? '⏰ Chờ tự động' :
                                                 isFailed ? '⚠️ Lỗi đăng' :
                                                 '📝 Bản nháp'}
                                            </span>
                                        </div>

                                        {/* Nội dung câu hỏi LaTeX */}
                                        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 max-h-52 overflow-auto text-xs">
                                            {post.raw_latex ? (
                                                <MathRenderer content={post.raw_latex} mode="question"/>
                                            ) : (
                                                <p className="text-red-600 italic">Câu hỏi không còn trong ngân hàng dữ liệu.</p>
                                            )}
                                        </div>

                                        {/* Hiển thị ảnh kèm theo nếu có */}
                                        {Boolean(post.has_image || images[post.id]) && (
                                            <div className="bg-white border border-slate-200 rounded-xl p-2 relative group">
                                                <img 
                                                    src={images[post.id] || `/api/admin/social/queue/${post.id}/image`} 
                                                    alt="Ảnh bài tập" 
                                                    className="w-full max-h-48 object-contain rounded-lg"
                                                />
                                                <div className="mt-1 flex justify-between items-center text-[11px] text-slate-500 px-1">
                                                    <span>Ảnh đính kèm</span>
                                                    <a 
                                                        href={images[post.id] || `/api/admin/social/queue/${post.id}/image`} 
                                                        download={`post-${post.id}.png`} 
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        Tải ảnh về
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lỗi nếu có */}
                                        {post.last_error && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 leading-relaxed">
                                                <b>Lỗi:</b> {post.last_error}
                                            </div>
                                        )}

                                        {/* Caption editor / viewer */}
                                        {!isPosted ? (
                                            <div className="space-y-2">
                                                <textarea 
                                                    value={edits[post.id] ?? post.caption} 
                                                    onChange={e => setEdits(old => ({ ...old, [post.id]: e.target.value }))} 
                                                    rows={4} 
                                                    maxLength={2000} 
                                                    aria-label={`Caption bài ${post.id}`} 
                                                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                                                />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => void copy(edits[post.id] ?? post.caption)} 
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <ClipboardCopy size={14}/> Chép caption
                                                    </button>

                                                    <button 
                                                        type="button"
                                                        onClick={() => void autoGenerateImage(post)}
                                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                                        title="Tự động vẽ bài toán thành ảnh banner Facebook chuẩn 1200x630"
                                                    >
                                                        <Sparkles size={14} className="text-yellow-600"/> Tạo ảnh bài toán
                                                    </button>

                                                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                                                        <ImageIcon size={14}/> Tải ảnh riêng
                                                        <input 
                                                            type="file" 
                                                            accept="image/png,image/jpeg" 
                                                            onChange={e => readImage(post.id, e.target.files?.[0])} 
                                                            className="sr-only"
                                                        />
                                                    </label>

                                                    <button 
                                                        type="button"
                                                        disabled={busy} 
                                                        onClick={() => void save(post)} 
                                                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ml-auto"
                                                    >
                                                        Lưu thay đổi
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs whitespace-pre-wrap text-slate-700 bg-white p-3 rounded-xl border border-slate-100 max-h-32 overflow-auto">
                                                {post.caption}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action buttons dưới thẻ */}
                                    <div className="border-t border-slate-200/60 pt-3 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {/* Nút Đăng ngay (Publish Now) */}
                                            {!isPosted && (
                                                <button 
                                                    disabled={busy} 
                                                    onClick={() => publishNow(post)} 
                                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                                                    title="Đăng bài này lên Facebook Page ngay lập tức"
                                                >
                                                    <Play size={14} />
                                                    <span>Đăng ngay</span>
                                                </button>
                                            )}

                                            {/* Nút Duyệt sang Tự động đăng */}
                                            {isDraft && (
                                                <button 
                                                    disabled={busy} 
                                                    onClick={() => approve(post)} 
                                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                    title="Lên lịch để hệ thống tự động đăng khi đến giờ"
                                                >
                                                    <CheckCircle2 size={14}/>
                                                    <span>Bật tự động</span>
                                                </button>
                                            )}

                                            {/* Nút Thử lại khi lỗi */}
                                            {isFailed && (
                                                <button 
                                                    disabled={busy} 
                                                    onClick={() => retry(post)} 
                                                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                >
                                                    <RefreshCw size={14}/>
                                                    <span>Thử lại</span>
                                                </button>
                                            )}

                                            {/* Link xem bài trên Facebook */}
                                            {isPosted && (
                                                <a 
                                                    href={post.fb_post_id ? `https://facebook.com/${post.fb_post_id}` : (config?.pageId ? `https://facebook.com/${config.pageId}` : 'https://facebook.com/luyentoanthongminh')} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                >
                                                    <ExternalLink size={14}/>
                                                    <span>Xem trên Facebook</span>
                                                </a>
                                            )}

                                            {/* Nút đánh dấu đã đăng thủ công */}
                                            {!isPosted && (
                                                <button 
                                                    disabled={busy} 
                                                    onClick={() => markPosted(post)} 
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors"
                                                    title="Đánh dấu bài đã được đăng mà không cần qua API"
                                                >
                                                    Đã đăng tay
                                                </button>
                                            )}
                                        </div>

                                        {/* Nút Hủy */}
                                        {!isPosted && (
                                            <button 
                                                disabled={busy} 
                                                onClick={() => cancel(post)} 
                                                title="Hủy bài" 
                                                className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    
                    {!posts.some(p => filter === 'ALL' || (filter === 'FAILED' ? (p.status === 'FAILED' || p.status === 'UNCERTAIN') : p.status === filter)) && (
                        <div className="lg:col-span-2 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
                            Chưa có bài viết nào trong mục này. Hãy chọn câu hỏi ở trên và bấm "Lên lịch tự động".
                        </div>
                    )}
                </div>
            </section>

            {/* Modal Cấu hình Facebook Page */}
            {showConfigModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Settings size={20} className="text-indigo-400" />
                                    Cấu Hình Facebook Page
                                </h3>
                                <p className="text-xs text-indigo-200 mt-0.5">Kết nối với Trang Facebook để tự động đăng tin</p>
                            </div>
                            <button 
                                onClick={() => setShowConfigModal(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Trạng thái hiện tại */}
                            {config?.pageName && (
                                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                                    <ShieldCheck size={24} className="text-emerald-600 shrink-0" />
                                    <div className="text-xs">
                                        <b className="text-emerald-900 block font-bold text-sm">{config.pageName}</b>
                                        <span className="text-emerald-700">Page ID: {config.pageId} · Token hợp lệ</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Facebook Page ID (ID Trang)
                                </label>
                                <input 
                                    type="text" 
                                    value={cfgPageId} 
                                    onChange={e => setCfgPageId(e.target.value)} 
                                    placeholder="Ví dụ: 100105564680397"
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    ID của trang Fanpage Facebook bạn đang quản lý.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between items-center">
                                    <span>Page Access Token (Mã truy cập trang)</span>
                                    {config?.configured && (
                                        <span className="text-emerald-600 font-normal">Đã lưu: {config.tokenMasked}</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showToken ? 'text' : 'password'} 
                                        value={cfgToken} 
                                        onChange={e => setCfgToken(e.target.value)} 
                                        placeholder={config?.configured ? "Nhập token mới nếu muốn thay đổi..." : "Dán mã Page Access Token vào đây..."}
                                        className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowToken(!showToken)} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showToken ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Token dài hạn được cấp quyền <code className="text-indigo-600">pages_manage_posts</code> và <code className="text-indigo-600">pages_read_engagement</code>.
                                </span>
                            </div>

                            {/* Công tắc Bật/Tắt tự động */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">Kích hoạt Tự Động Đăng Bài</span>
                                        <span className="text-xs text-slate-500 block">Khi đến giờ hẹn, hệ thống sẽ tự động đăng bài lên Page.</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={cfgAutoEnabled} 
                                        onChange={e => setCfgAutoEnabled(e.target.checked)} 
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                </label>
                            </div>

                            {/* Nút hành động */}
                            <div className="pt-3 flex gap-2 justify-end">
                                <button 
                                    type="button" 
                                    disabled={testingConnection} 
                                    onClick={() => void testConnection()} 
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                                >
                                    <RefreshCw size={14} className={testingConnection ? 'animate-spin' : ''} />
                                    <span>Kiểm tra kết nối</span>
                                </button>
                                <button 
                                    type="button" 
                                    disabled={busy} 
                                    onClick={() => void saveFacebookConfig()} 
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
                                >
                                    Lưu cấu hình
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
