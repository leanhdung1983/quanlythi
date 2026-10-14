import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, GraduationCap, Users, Crown, HelpCircle, Download, 
    CheckCircle2, Clock, Calendar, Copy, ArrowRight, ShieldCheck, 
    Sparkles, KeyRound, MonitorPlay, Layers, FileSpreadsheet, RefreshCw
} from 'lucide-react';

export const UserGuide: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'student' | 'teacher' | 'pricing' | 'faq'>('overview');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
            {/* Header Hero Banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
                    <GraduationCap size={320} />
                </div>
                
                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase text-indigo-100">
                        <Sparkles size={14} className="text-yellow-300" />
                        Sổ tay hướng dẫn sử dụng 2026
                    </div>
                    
                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        Hướng Dẫn Sử Dụng Hệ Thống Khảo Thí &amp; Học Tập
                    </h1>
                    
                    <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
                        Tài liệu hướng dẫn trực quan dành cho <strong>Học sinh</strong> và <strong>Giáo viên</strong>: quy trình chọn lớp, làm bài thi trực tuyến, tạo ma trận đề thi, phân biệt tài khoản Free vs PRO và nâng cấp tự động.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <a 
                            href="/HUONG_DAN_SU_DUNG_HE_THONG_THI.pdf" 
                            download="HUONG_DAN_SU_DUNG_HE_THONG_THI.pdf"
                            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-indigo-50 transition-all text-sm"
                        >
                            <Download size={16} />
                            Tải tài liệu PDF (In A4)
                        </a>

                        <button 
                            onClick={() => navigate('/profile')}
                            className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-extrabold px-4 py-2.5 rounded-xl shadow-md hover:bg-yellow-300 transition-all text-sm"
                        >
                            <Crown size={16} />
                            Nâng cấp gói PRO ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto custom-scrollbar">
                {[
                    { id: 'overview', label: 'Tổng quan & So sánh Free / PRO', icon: ShieldCheck },
                    { id: 'student', label: 'Dành cho Học sinh', icon: GraduationCap },
                    { id: 'teacher', label: 'Dành cho Giáo viên', icon: Users },
                    { id: 'pricing', label: 'Bảng giá & Nâng cấp PRO', icon: Crown },
                    { id: 'faq', label: 'Câu hỏi thường gặp', icon: HelpCircle },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-indigo-700 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT 1: OVERVIEW & COMPARISON */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="text-indigo-600" />
                                Phân biệt Tài khoản Miễn phí (Free) và Tài khoản Chuyên gia (PRO)
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Mọi tài khoản khi mới đăng ký đều là <strong>Free Tier</strong>. Dưới đây là bảng so sánh cụ thể quyền lợi khi nâng cấp lên <strong>PRO Member</strong>.
                            </p>
                        </div>

                        {/* Comparison Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                        <th className="p-4 font-bold">Tính năng / Quyền lợi</th>
                                        <th className="p-4 font-bold text-slate-500">Tài khoản Miễn phí (Free)</th>
                                        <th className="p-4 font-bold text-indigo-700 bg-indigo-50/50">Tài khoản PRO Member 👑</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="bg-slate-50/30">
                                        <td colSpan={3} className="p-3 font-bold text-xs uppercase tracking-wider text-slate-400 bg-slate-100/70">
                                            Dành cho Học sinh
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Số lượt thi thử / ngày</td>
                                        <td className="p-4 text-red-600 font-medium">Tối đa 2 lần / ngày</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Không giới hạn số lượt thi</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Xem lời giải chi tiết</td>
                                        <td className="p-4 text-slate-500">Giới hạn, chỉ xem đáp án đúng/sai cơ bản</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Mở khóa 100% lời giải chi tiết &amp; phương pháp</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Luyện tập thích ứng (Adaptive Test)</td>
                                        <td className="p-4 text-slate-500">Giới hạn số lượng câu và chuyên đề</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Luyện thi thông minh theo năng lực cá nhân</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Lưu lịch sử &amp; Biểu đồ tiến bộ</td>
                                        <td className="p-4 text-slate-500">Chỉ lưu bài thi gần nhất</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Lưu trữ không giới hạn toàn bộ quá trình học</td>
                                    </tr>

                                    <tr className="bg-slate-50/30">
                                        <td colSpan={3} className="p-3 font-bold text-xs uppercase tracking-wider text-slate-400 bg-slate-100/70">
                                            Dành cho Giáo viên
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Soạn đề &amp; Ma trận đề thi</td>
                                        <td className="p-4 text-slate-500">Giới hạn số lượng ma trận và xuất đề</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Tạo ma trận &amp; xuất đề Word/PDF không giới hạn</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Bộ công cụ chuyên gia (TikZ, IRT, Gán ID)</td>
                                        <td className="p-4 text-slate-500">Bị khóa hoặc giới hạn số lượng</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Mở khóa 100% toàn bộ công cụ nâng cao</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold text-slate-800">Quản lý lớp &amp; Bảng điểm</td>
                                        <td className="p-4 text-slate-500">Giới hạn số lớp học</td>
                                        <td className="p-4 font-bold text-emerald-600 bg-indigo-50/30">Quản lý lớp học, giao bài LMS &amp; xuất file Excel</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 gap-4">
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">Bạn muốn mở khóa toàn bộ quyền lợi PRO?</h4>
                                <p className="text-xs text-indigo-700 mt-0.5">Chỉ từ 200.000đ/năm đối với Học sinh và 300.000đ/năm đối với Giáo viên.</p>
                            </div>
                            <button 
                                onClick={() => setActiveTab('pricing')}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shrink-0"
                            >
                                Xem bảng giá &amp; Cách nâng cấp →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 2: FOR STUDENTS */}
            {activeTab === 'student' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <GraduationCap className="text-indigo-600" />
                                Hướng Dẫn Dành Cho Học Sinh (Student)
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Các bước tham gia lớp học, làm bài thi trực tuyến và ôn luyện thích ứng theo chuyên đề.
                            </p>
                        </div>

                        {/* Bước tham gia lớp */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <KeyRound size={18} className="text-emerald-600" />
                                1. Tham gia lớp học (Nhập mã hoặc chọn 3 mã đề xuất tự do)
                            </h3>
                            <p className="text-sm text-slate-600">
                                Tại thanh menu, chọn mục <strong>Lớp học của tôi</strong>. Học sinh có thể vào lớp theo 2 cách:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Cách 1: Lớp riêng của thầy/cô</span>
                                    <h4 className="font-bold text-slate-800 text-sm">Nhập mã lớp do giáo viên cung cấp</h4>
                                    <p className="text-xs text-slate-600">
                                        Nếu giáo viên bộ môn cấp cho bạn một mã gồm 6 ký tự (ví dụ: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-700">ABC123</code>), bạn chỉ cần nhập mã vào ô tìm kiếm và bấm <strong>Tham gia lớp</strong>.
                                    </p>
                                </div>

                                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase">Cách 2: Học sinh tự do</span>
                                    <h4 className="font-bold text-indigo-900 text-sm">Chọn nhanh 3 mã đề xuất tự do</h4>
                                    <p className="text-xs text-indigo-700">
                                        Học sinh tự do chưa có mã lớp riêng có thể bấm nút <strong>Vào lớp</strong> tương ứng với khối học của mình:
                                    </p>
                                </div>
                            </div>

                            {/* 3 mã tự do widget */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                {[
                                    { grade: 'Khối 10', label: 'Lớp 10 - Tự do', code: 'THY6TO', desc: 'Đề ôn tập & khảo sát K10' },
                                    { grade: 'Khối 11', label: 'Lớp 11 - Tự do', code: 'WWHXNV', desc: 'Đề ôn tập & khảo sát K11' },
                                    { grade: 'Khối 12', label: 'Lớp 12 - Tự do', code: 'W0DBUX', desc: 'Đề ôn tập & luyện thi tốt nghiệp K12' },
                                ].map(item => (
                                    <div key={item.code} className="p-4 bg-white border border-indigo-200 rounded-2xl shadow-xs flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{item.grade}</span>
                                            <h4 className="font-bold text-slate-800 text-sm mt-2">{item.label}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <code className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-800">{item.code}</code>
                                            <button 
                                                onClick={() => handleCopy(item.code)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                {copiedCode === item.code ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
                                                {copiedCode === item.code ? 'Đã sao chép' : 'Sao chép'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bước làm bài thi */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <MonitorPlay size={18} className="text-indigo-600" />
                                2. Quy trình làm bài thi trực tuyến (Online Exam)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-indigo-600 text-xs">Bước 1</span>
                                    <h4 className="font-bold text-slate-800 text-sm">Kiểm tra trạng thái bài</h4>
                                    <p className="text-xs text-slate-600">
                                        Bài thi có huy hiệu <span className="text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded text-[10px]">🟢 Đang mở</span> mới có thể bấm <strong>Vào thi</strong>. Các bài quá hạn hoặc chưa mở sẽ bị khóa.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-indigo-600 text-xs">Bước 2</span>
                                    <h4 className="font-bold text-slate-800 text-sm">Làm bài với bộ đếm giờ</h4>
                                    <p className="text-xs text-slate-600">
                                        Đồng hồ đếm ngược chạy tự động. Hệ thống lưu câu trả lời sau từng thao tác click. Rớt mạng hay cúp điện mở lại vẫn còn nguyên bài.
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                    <span className="font-bold text-indigo-600 text-xs">Bước 3</span>
                                    <h4 className="font-bold text-slate-800 text-sm">Nộp bài &amp; Xem giải</h4>
                                    <p className="text-xs text-slate-600">
                                        Nhấn <strong>Nộp bài</strong> để hệ thống chấm điểm ngay. Học sinh nâng cấp PRO có thể xem 100% lời giải chi tiết và phương pháp làm bài.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: FOR TEACHERS */}
            {activeTab === 'teacher' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-indigo-600" />
                                Hướng Dẫn Dành Cho Giáo Viên (Teacher)
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Tạo lớp học, quản lý ma trận đề thi 4 cấp độ, giao bài tập LMS nâng cao và xuất báo cáo kết quả thi.
                            </p>
                        </div>

                        {/* Quản lý lớp */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <Users size={18} className="text-blue-600" />
                                1. Quản lý lớp học &amp; Cấp mã cho học sinh
                            </h3>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
                                <li>Vào mục <strong>Lớp học của tôi</strong>, nhập tên lớp (ví dụ: <em>12A1 - Toán Thầy Dũng</em>) và nhấn dấu <strong>(+)</strong> để tạo lớp mới.</li>
                                <li>Hệ thống tự động cấp một mã lớp 6 ký tự viết hoa. Giáo viên sao chép mã này gửi cho học sinh trong lớp để các em tham gia.</li>
                                <li>Giáo viên có thể chủ động thêm học sinh bằng username/email hoặc xóa học sinh ra khỏi lớp bất cứ lúc nào.</li>
                            </ul>
                        </div>

                        {/* Tạo ma trận đề thi */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <Layers size={18} className="text-purple-600" />
                                2. Tạo ma trận &amp; Soạn đề thi chuẩn 4 cấp độ (Exam Generator)
                            </h3>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
                                <li>Tại trang <strong>Ma trận đề thi</strong>, chọn cấu trúc phân bổ câu hỏi theo 4 mức độ: <em>Nhận biết (N) - Thông hiểu (H) - Vận dụng (V) - Vận dụng cao (C)</em>.</li>
                                <li>Hỗ trợ trọn vẹn 3 dạng thức trắc nghiệm mới: Nhiều lựa chọn, Đúng/Sai (4 ý a, b, c, d) và Trả lời ngắn.</li>
                                <li>Hệ thống tự động bốc ngẫu nhiên câu hỏi từ ngân hàng chuẩn hóa và hỗ trợ xuất ra file Word (.docx) hoặc PDF kèm bảng đáp án.</li>
                            </ul>
                        </div>

                        {/* Giao bài tập LMS */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <Calendar size={18} className="text-amber-600" />
                                3. Cấu hình giao bài tập LMS nâng cao
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="font-bold text-slate-700 block">🕒 Thời gian mở đề</span>
                                    <span className="text-slate-500 mt-1 block">Đặt giờ bắt đầu cho học sinh làm bài hoặc để trống để mở ngay.</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="font-bold text-slate-700 block">📅 Hạn chót nộp bài</span>
                                    <span className="text-slate-500 mt-1 block">Sau thời điểm này học sinh không thể truy cập nộp bài.</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="font-bold text-slate-700 block">🔁 Số lượt thi tối đa</span>
                                    <span className="text-slate-500 mt-1 block">Đặt giới hạn số lần làm bài (hệ thống tự lấy điểm cao nhất).</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <span className="font-bold text-slate-700 block">👁️ Xem lời giải</span>
                                    <span className="text-slate-500 mt-1 block">Bật/tắt quyền xem lời giải chi tiết sau khi học sinh nộp bài.</span>
                                </div>
                            </div>
                        </div>

                        {/* Bảng điểm & Xuất Excel */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <FileSpreadsheet size={18} className="text-emerald-600" />
                                4. Theo dõi bảng điểm trực tuyến &amp; Xuất Excel (CSV)
                            </h3>
                            <p className="text-sm text-slate-600">
                                Bảng điểm của lớp tự động làm mới thời gian thực mỗi 15 giây khi giáo viên đang mở tab. Giáo viên có thể theo dõi tiến độ từng học sinh, điểm số, số lần nộp và bấm nút <strong>Xuất Excel</strong> để tải bảng điểm dạng CSV về máy tính.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 4: PRICING & UPGRADE */}
            {activeTab === 'pricing' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Crown className="text-yellow-500" />
                                Bảng Giá Gói Nâng Cấp PRO &amp; Hướng Dẫn Thanh Toán Tự Động
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Mở khóa không giới hạn tính năng. Hệ thống tự động kích hoạt ngay sau khi chuyển khoản quét mã QR qua SePay / MB Bank.
                            </p>
                        </div>

                        {/* 2 Gói Giá */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card Học Sinh */}
                            <div className="p-6 rounded-3xl border-2 border-emerald-200 bg-gradient-to-b from-white to-emerald-50/40 shadow-sm flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">
                                            Dành cho Học sinh
                                        </span>
                                        <span className="text-xs text-slate-400">Thời hạn 1 năm</span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-800">GÓI PRO HỌC SINH</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-emerald-600">200.000đ</span>
                                        <span className="text-xs text-slate-500">/ 1 năm (chỉ ~16.000đ/tháng)</span>
                                    </div>

                                    <ul className="space-y-2 pt-2 text-xs md:text-sm text-slate-700">
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> <strong>Không giới hạn số lượt thi thử</strong> mỗi ngày</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> <strong>Xem 100% lời giải chi tiết</strong> từng bước</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> Mở khóa toàn bộ kho thi thích ứng (Adaptive Test)</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> Lưu trữ không giới hạn lịch sử và biểu đồ tiến bộ</li>
                                    </ul>
                                </div>

                                <button 
                                    onClick={() => navigate('/profile')}
                                    className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    Nâng cấp gói Học sinh ngay <ArrowRight size={16}/>
                                </button>
                            </div>

                            {/* Card Giáo Viên */}
                            <div className="p-6 rounded-3xl border-2 border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40 shadow-sm flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase">
                                            Dành cho Giáo viên
                                        </span>
                                        <span className="text-xs text-slate-400">Thời hạn 1 năm</span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-800">GÓI PRO GIÁO VIÊN</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-indigo-600">300.000đ</span>
                                        <span className="text-xs text-slate-500">/ 1 năm (chỉ 25.000đ/tháng)</span>
                                    </div>

                                    <ul className="space-y-2 pt-2 text-xs md:text-sm text-slate-700">
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-500 shrink-0"/> <strong>Quản lý kho câu hỏi không giới hạn</strong></li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-500 shrink-0"/> <strong>Tạo ma trận &amp; xuất đề Word (.docx) / PDF</strong></li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-500 shrink-0"/> Mở khóa toàn bộ công cụ: TikZ, IRT, Gán ID, Converter</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-500 shrink-0"/> Quản lý lớp học, giao bài tập LMS &amp; xuất file Excel</li>
                                    </ul>
                                </div>

                                <button 
                                    onClick={() => navigate('/profile')}
                                    className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    Nâng cấp gói Giáo viên ngay <ArrowRight size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* 4 bước kích hoạt tự động */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <h3 className="font-bold text-slate-800 text-base">
                                Quy trình 4 bước nâng cấp tự động qua quét mã QR MB Bank:
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                    <span className="font-bold text-indigo-600 block">Bước 1</span>
                                    <h4 className="font-bold text-slate-800">Vào Hồ sơ cá nhân</h4>
                                    <p className="text-slate-500">Bấm vào tên tài khoản hoặc chọn <strong>Hồ sơ cá nhân</strong> trên menu.</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                    <span className="font-bold text-indigo-600 block">Bước 2</span>
                                    <h4 className="font-bold text-slate-800">Bấm "Tạo mã thanh toán"</h4>
                                    <p className="text-slate-500">Hệ thống tính đúng số tiền tương ứng theo vai trò tài khoản.</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                    <span className="font-bold text-indigo-600 block">Bước 3</span>
                                    <h4 className="font-bold text-slate-800">Quét mã QR MB Bank</h4>
                                    <p className="text-slate-500">Mở app ngân hàng quét mã QR, giữ nguyên nội dung chuyển khoản.</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                    <span className="font-bold text-indigo-600 block">Bước 4</span>
                                    <h4 className="font-bold text-slate-800">Tự động kích hoạt</h4>
                                    <p className="text-slate-500">Tài khoản nhảy lên PRO trong vòng 10-30 giây sau khi chuyển thành công.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 5: FAQ */}
            {activeTab === 'faq' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <HelpCircle className="text-indigo-600" />
                                Các Câu Hỏi Thường Gặp (FAQ)
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Giải đáp các vướng mắc phổ biến trong quá trình học tập, thi thử và nâng cấp tài khoản.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                {
                                    q: '1. Tôi đã chuyển khoản nhưng tài khoản chưa nhảy PRO thì phải làm sao?',
                                    a: 'Bạn hãy bấm vào nút "Kiểm tra trạng thái Pro" tại trang Hồ sơ cá nhân để hệ thống đồng bộ dữ liệu. Nếu chuyển khoản ghi sai nội dung hoặc sai số tiền, vui lòng gửi biên lai giao dịch cho Quản trị viên để được đối chiếu và kích hoạt thủ công.'
                                },
                                {
                                    q: '2. Tài khoản PRO của tôi còn hạn, nếu gia hạn thêm thì có bị mất ngày cũ không?',
                                    a: 'Không bị mất. Hệ thống cộng dồn 1 năm (365 ngày) tiếp theo vào ngày hết hạn hiện tại của bạn, bảo toàn 100% thời gian đã có.'
                                },
                                {
                                    q: '3. Học sinh tự do không có mã lớp của thầy cô thì vào lớp nào?',
                                    a: 'Học sinh chỉ cần bấm trực tiếp nút "Vào lớp" tại mục Lớp học của tôi với 3 mã đề xuất công khai: Lớp 10 (THY6TO), Lớp 11 (WWHXNV), Lớp 12 (W0DBUX).'
                                },
                                {
                                    q: '4. Đang làm bài thi mà bị rớt mạng hoặc mất điện thì xử lý thế nào?',
                                    a: 'Hệ thống tự động lưu từng câu trả lời vào bộ nhớ tạm trình duyệt. Bạn chỉ cần bật lại máy hoặc kết nối lại mạng, đăng nhập và mở lại bài thi, tất cả đáp án đã chọn vẫn được giữ nguyên.'
                                },
                                {
                                    q: '5. Làm thế nào để tải về file hướng dẫn sử dụng định dạng PDF để in ấn?',
                                    a: 'Bạn chỉ cần nhấn vào nút "Tải tài liệu PDF (In A4)" ở đầu trang này để tải về file PDF 9 trang chuẩn hóa hoàn toàn miễn phí.'
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                                    <h4 className="font-bold text-slate-800 text-sm">{item.q}</h4>
                                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
