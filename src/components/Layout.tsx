
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, FileText, GraduationCap, FileCode, Tag, 
    Wand2, MonitorPlay, ChevronDown, Menu, X, LogOut, 
    User, Shield, Copy, Flag, ChevronRight, Layers, Zap, Target,
    MessageSquare, BookOpen, Users, Send,
    LucideIcon
} from 'lucide-react';
import { useLanguageStore } from '../services/languageStore';
import { useAuthStore } from '../services/authStore';
import { UserFeedbackForm, AdminFeedbackViewer } from './Feedback';
import { apiService } from '../services/api';

interface SidebarItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    isCompact?: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, onClick, isCompact }: SidebarItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 my-0.5 mx-2 rounded-lg transition-all duration-200 group relative overflow-visible ${
        isActive
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-700'
      }`
    }
    title={isCompact ? label : ''}
  >
    <Icon size={20} className={`shrink-0 z-10 transition-transform group-hover:scale-110 ${isCompact ? 'mx-auto' : ''}`} />
    {!isCompact && <span className="font-bold text-sm z-10 whitespace-nowrap tracking-wide animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
    {isCompact && <div className="absolute left-full ml-2 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[70] whitespace-nowrap shadow-lg">{label}</div>}
  </NavLink>
);

const SidebarGroup = ({ title, children, isCompact }: { title: string; children: React.ReactNode; isCompact: boolean }) => {
    if (isCompact) return <div className="space-y-1 my-2 border-t border-slate-100 pt-2">{children}</div>;
    return (
        <div className="mb-4 animate-in fade-in slide-in-from-left-1 duration-300">
            <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">{title}</h3>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
};

import { useUIStore } from '../services/uiStore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguageStore();
  const { user, logout } = useAuthStore();
  const { hideSidebar: forceHide } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  
  // Mặc định là thu gọn (true)
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  const navigate = useNavigate();

  const handleLogout = () => { 
    sessionStorage.removeItem('admin_feedback_notified');
    logout(); 
    navigate('/login'); 
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  // Kiểm tra góp ý chưa đọc khi admin đăng nhập
  useEffect(() => {
    if (isAdmin) {
      const checkFeedback = async () => {
        try {
          const data = await apiService.fetchFeedback();
          const unread = data.filter(f => !f.is_read);
          setUnreadFeedbackCount(unread.length);
          
          // Chỉ hiện thông báo tự động một lần mỗi phiên làm việc
          const hasShown = sessionStorage.getItem('admin_feedback_notified');
          if (unread.length > 0 && !hasShown) {
            setShowAdminFeedback(true);
            sessionStorage.setItem('admin_feedback_notified', 'true');
          }
        } catch (error) {
          console.error("Lỗi kiểm tra góp ý:", error);
        }
      };
      checkFeedback();
    }
  }, [isAdmin]);

  // Check if we should hide layout elements (e.g. during online exam)
  // We now use the forceHide from UIStore for more granular control
  const hideLayout = forceHide;

  // Logic hiển thị: Nếu đang pinned (không collapsed) HOẶC đang hover chuột thì mở rộng
  const isExpanded = !isCollapsed || isHovered;
  // Logic gọn: Ngược lại của expanded
  const isCompact = !isExpanded;

  // Trang xác thực cần một canvas riêng, không hiển thị điều hướng của ứng dụng.
  if (!user) {
    return <main className="min-h-screen bg-slate-50 font-sans">{children}</main>;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-700">
        
        {/* --- PLACEHOLDER (Desktop only) --- 
            Giữ chỗ khoảng trắng 80px (w-20) khi Sidebar ở chế độ Fixed/Collapsed 
            để nội dung chính không bị che khuất bởi Sidebar.
        */}
        {isCollapsed && (
            <div className="hidden md:block w-[72px] shrink-0 transition-all duration-300 ease-in-out bg-transparent" />
        )}

        {/* --- SIDEBAR (Desktop) --- */}
        {!hideLayout && (
            <aside 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    hidden md:flex flex-col bg-white border-r border-slate-200/80 shadow-lg shadow-slate-200/30 z-50 
                    transition-all duration-300 ease-in-out h-full
                    ${isCollapsed ? 'fixed left-0 top-0 bottom-0' : 'relative'} 
                    ${isExpanded ? 'w-64' : 'w-[72px]'}
                `}
            >
                {/* Logo Area */}
                <div className="h-[72px] flex items-center justify-center border-b border-slate-100 relative shrink-0 overflow-hidden">
                    <div className={`flex items-center gap-2 transition-all duration-300 ${isCompact ? 'scale-0 w-0 opacity-0 absolute' : 'scale-100 w-auto opacity-100 relative'}`}>
                            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-sm">
                            <GraduationCap size={26} />
                        </div>
                        <div className="whitespace-nowrap">
                            <span className="font-extrabold text-slate-800 text-xl tracking-tight block leading-none">ID6<span className="text-indigo-600">.Pro</span></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Question Bank</span>
                        </div>
                    </div>
                    
                    {/* Logo rút gọn khi đóng */}
                    <div className={`absolute transition-all duration-300 ${isCompact ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
                            <GraduationCap size={24} />
                        </div>
                    </div>
                    
                    {/* Nút Ghim (Pin) Sidebar */}
                    {isExpanded && (
                        <button 
                            onClick={() => { setIsCollapsed(!isCollapsed); setIsHovered(false); }} 
                            className={`absolute top-8 bg-white border border-slate-200 rounded-full p-1.5 text-slate-400 hover:text-indigo-600 shadow-sm z-50 hover:shadow-md transition-all duration-300 ${isCompact ? '-right-3' : 'right-4'}`}
                            title={isCollapsed ? "Ghim menu (Luôn mở)" : "Bỏ ghim (Tự động thu gọn)"}
                        >
                            <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                                {isCollapsed ? <ChevronRight size={14}/> : <ChevronDown size={14} className="rotate-90"/>} 
                            </div>
                        </button>
                    )}
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto overflow-x-visible custom-scrollbar py-3 space-y-1">
                    {user ? (
                        <>
                            <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} isCompact={isCompact} />
                            <SidebarItem to="/online-exam" icon={MonitorPlay} label={t('online_exam')} isCompact={isCompact} />
                            <SidebarItem to="/adaptive" icon={Zap} label="Ôn tập Adaptive" isCompact={isCompact} />
                            <SidebarItem to="/learning" icon={BookOpen} label="Học trực tuyến" isCompact={isCompact} />
                            <SidebarItem to="/classes" icon={Users} label="Lớp học của tôi" isCompact={isCompact} />
                            
                            {isTeacher && (
                                <>
                                    <SidebarGroup title={t('data_mgmt')} isCompact={isCompact}>
                                        <SidebarItem to="/metadata" icon={FileCode} label={t('id6_metadata')} isCompact={isCompact} />
                                        <SidebarItem to="/questions" icon={FileText} label={t('question_bank')} isCompact={isCompact} />
                                        <SidebarItem to="/duplicates" icon={Copy} label="Xử lý Trùng lặp" isCompact={isCompact} />
                                        <SidebarItem to="/irt" icon={Target} label="Phân tích IRT" isCompact={isCompact} />
                                    </SidebarGroup>

                                    <SidebarGroup title={t('tools')} isCompact={isCompact}>
                                        <SidebarItem to="/exam" icon={Layers} label={t('exam_matrix')} isCompact={isCompact} />
                                        <SidebarItem to="/assign-id" icon={Tag} label={t('ai_assigner')} isCompact={isCompact} />
                                        <SidebarItem to="/converter" icon={Wand2} label={t('ai_converter')} isCompact={isCompact} />
                                        <SidebarItem to="/errors" icon={Flag} label={t('error_manager')} isCompact={isCompact} />
                                    </SidebarGroup>
                                </>
                            )}

                            {isAdmin && (
                                <SidebarGroup title="Admin" isCompact={isCompact}>
                                    <SidebarItem to="/admin" icon={Shield} label="Quản trị User" isCompact={isCompact} />
                                    <SidebarItem to="/admin/source" icon={FileCode} label="Mã nguồn & SVG" isCompact={isCompact} />
                                    <SidebarItem to="/admin/social" icon={Send} label="Nội dung Facebook" isCompact={isCompact} />
                                    <button 
                                        onClick={() => setShowAdminFeedback(true)}
                                        className={`flex items-center gap-3 px-3 py-3 my-1 mx-2 rounded-xl transition-all duration-300 group relative overflow-hidden text-slate-500 hover:bg-slate-50 hover:text-indigo-600 w-[calc(100%-16px)]`}
                                    >
                                        <MessageSquare size={20} className={`shrink-0 z-10 transition-transform group-hover:scale-110 ${isCompact ? 'mx-auto' : ''}`} />
                                        {!isCompact && <span className="font-bold text-sm z-10 whitespace-nowrap tracking-wide">Góp ý người dùng</span>}
                                        {unreadFeedbackCount > 0 && (
                                            <span className={`absolute ${isCompact ? 'top-2 right-2' : 'right-3'} w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse`} />
                                        )}
                                    </button>
                                </SidebarGroup>
                            )}
                            
                            {/* Nút Góp ý cho người dùng bình thường */}
                            {!isAdmin && (
                                <div className="px-2 mt-4">
                                    <button 
                                        onClick={() => setShowFeedbackForm(true)}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden bg-indigo-50 text-indigo-600 hover:bg-indigo-100 w-full`}
                                    >
                                        <MessageSquare size={20} className={`shrink-0 z-10 transition-transform group-hover:scale-110 ${isCompact ? 'mx-auto' : ''}`} />
                                        {!isCompact && <span className="font-bold text-sm z-10 whitespace-nowrap tracking-wide">Gửi góp ý</span>}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-4 text-center text-slate-400 text-xs italic">Please Login</div>
                    )}
                </div>

                {/* Footer User Profile */}
                {user && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0 overflow-hidden">
                        <div className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isCompact ? 'justify-center' : 'bg-white border border-slate-200/50 shadow-sm'}`}>
                            <NavLink to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform shrink-0">
                                <User size={20}/>
                            </NavLink>
                            {!isCompact && (
                                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <h4 className="font-bold text-slate-700 text-sm truncate">{user.full_name}</h4>
                                    <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">{user.role}</p>
                                </div>
                            )}
                            {!isCompact && (
                                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="Đăng xuất">
                                    <LogOut size={18}/>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        )}

        {/* --- MOBILE OVERLAY --- */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
                    <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
                        <span className="font-extrabold text-slate-800 text-xl">ID6.Pro</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <SidebarItem to="/online-exam" icon={MonitorPlay} label={t('online_exam')} onClick={() => setIsMobileMenuOpen(false)}/>
                        <SidebarItem to="/adaptive" icon={Zap} label="Ôn tập Adaptive" onClick={() => setIsMobileMenuOpen(false)}/>
                        <SidebarItem to="/learning" icon={BookOpen} label="Học trực tuyến" onClick={() => setIsMobileMenuOpen(false)}/>
                        
                        {isTeacher && (
                            <>
                                <div className="font-bold text-slate-400 text-xs uppercase mt-4 mb-2 px-2">Quản lý</div>
                                <SidebarItem to="/metadata" icon={FileCode} label={t('id6_metadata')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/questions" icon={FileText} label={t('question_bank')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/duplicates" icon={Copy} label="Xử lý Trùng lặp" onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/irt" icon={Target} label="Phân tích IRT" onClick={() => setIsMobileMenuOpen(false)}/>
                                
                                <div className="font-bold text-slate-400 text-xs uppercase mt-4 mb-2 px-2">Công cụ</div>
                                <SidebarItem to="/exam" icon={Layers} label={t('exam_matrix')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/assign-id" icon={Tag} label={t('ai_assigner')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/converter" icon={Wand2} label={t('ai_converter')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/errors" icon={Flag} label={t('error_manager')} onClick={() => setIsMobileMenuOpen(false)}/>
                            </>
                        )}
                        
                        {isAdmin && (
                            <>
                                <div className="font-bold text-slate-400 text-xs uppercase mt-4 mb-2 px-2">Hệ thống</div>
                                <SidebarItem to="/admin" icon={Shield} label="Quản trị User" onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/admin/social" icon={Send} label="Nội dung Facebook" onClick={() => setIsMobileMenuOpen(false)}/>
                            </>
                        )}
                        
                        <div className="mt-8 pt-4 border-t border-slate-100">
                            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 bg-red-50 rounded-xl font-bold"><LogOut size={20}/> Đăng xuất</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Mobile Header */}
            {!hideLayout && (
                <header className="md:hidden h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><GraduationCap size={20}/></div>
                        <span className="font-bold text-slate-800 text-lg">ID6.Pro</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu size={24}/></button>
                </header>
            )}

            {/* Content Container */}
            <div className="flex-1 overflow-hidden relative z-0">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/40 to-transparent pointer-events-none -z-10"></div>
                <div className={`flex-1 h-full overflow-auto custom-scrollbar ${hideLayout ? 'p-0' : 'p-4 md:p-7'}`}>
                    <div className={`${hideLayout ? 'w-full' : 'max-w-[1600px] mx-auto'} h-full flex flex-col`}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showFeedbackForm && <UserFeedbackForm onClose={() => setShowFeedbackForm(false)} />}
            {showAdminFeedback && <AdminFeedbackViewer onClose={() => {
                setShowAdminFeedback(false);
                // Cập nhật lại count sau khi đóng
                apiService.fetchFeedback().then(data => setUnreadFeedbackCount(data.filter(f => !f.is_read).length));
            }} />}
        </main>
    </div>
  );
};
