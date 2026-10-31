import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, FileText, GraduationCap, FileCode, Tag, 
    Wand2, MonitorPlay, ChevronDown, Menu, X, LogOut, 
    User, Shield, Copy, Flag, ChevronRight, Layers, Zap,
    MessageSquare, BookOpen, Users, Send, HelpCircle, BarChart3,
    Sparkles, PlusCircle, ExternalLink,
    LucideIcon
} from 'lucide-react';
import { useLanguageStore } from '../services/languageStore';
import { useAuthStore } from '../services/authStore';
import { useUIStore } from '../services/uiStore';
import { UserFeedbackForm, AdminFeedbackViewer } from './Feedback';
import { apiService } from '../services/api';
import { APP_NAME, APP_TAGLINE } from '../config/brand';
import { cn } from '../utils/cn';

interface SidebarItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    isCompact?: boolean;
    badge?: string;
    isNew?: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, onClick, isCompact, badge, isNew }: SidebarItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        'app-nav-item flex items-center gap-3 px-3.5 py-2.5 my-0.5 mx-2.5 rounded-xl transition-all duration-200 group relative select-none',
        isActive
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25 font-semibold is-active'
          : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 font-medium'
      )
    }
    title={isCompact ? label : ''}
  >
    {({ isActive }) => (
      <>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
          isActive ? 'bg-white/15 text-white' : 'text-slate-500 group-hover:text-indigo-600',
          isCompact && 'mx-auto'
        )}>
          <Icon size={18} />
        </div>
        
        {!isCompact && (
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <span className="text-xs tracking-tight truncate">{label}</span>
            {badge && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
              )}>
                {badge}
              </span>
            )}
            {isNew && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            )}
          </div>
        )}

        {isCompact && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-[70] whitespace-nowrap shadow-xl border border-slate-800">
            {label}
            {badge && <span className="ml-1.5 text-[9px] text-indigo-300">({badge})</span>}
          </div>
        )}
      </>
    )}
  </NavLink>
);

const SidebarGroup = ({ title, children, isCompact }: { title: string; children: React.ReactNode; isCompact: boolean }) => {
    if (isCompact) return <div className="space-y-1 my-2 border-t border-slate-100 pt-2">{children}</div>;
    return (
        <div className="mb-3">
            <h3 className="px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">{title}</h3>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguageStore();
  const { user, logout } = useAuthStore();
  const { hideSidebar: forceHide } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  
  // Default is collapsed for maximum workspace
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitles: Record<string, { title: string; category: string; icon: LucideIcon }> = { 
    '/': { title: 'Tổng quan', category: 'Không gian làm việc', icon: LayoutDashboard }, 
    '/questions': { title: 'Ngân hàng câu hỏi', category: 'Khảo thí & Đề thi', icon: FileText }, 
    '/exam': { title: 'Ma trận đề thi', category: 'Khảo thí & Đề thi', icon: Layers }, 
    '/online-exam': { title: 'Thi trực tuyến', category: 'Khảo thí & Đề thi', icon: MonitorPlay }, 
    '/assign-id': { title: 'Gán ID câu hỏi', category: 'Biên soạn & AI', icon: Tag }, 
    '/metadata': { title: 'Danh mục ID6', category: 'Biên soạn & AI', icon: FileCode }, 
    '/classes': { title: 'Lớp học của tôi', category: 'Học tập & Lớp học', icon: Users }, 
    '/learning': { title: 'Học trực tuyến', category: 'Học tập & Lớp học', icon: BookOpen }, 
    '/eduloop': { title: 'EduLoop · Kỹ năng', category: 'Học tập & Lớp học', icon: Zap }, 
    '/converter': { title: 'Chuyển đổi tài liệu AI', category: 'Biên soạn & AI', icon: Wand2 }, 
    '/duplicates': { title: 'Câu hỏi trùng lặp', category: 'Biên soạn & AI', icon: Copy }, 
    '/irt': { title: 'Phân tích IRT', category: 'Khảo thí & Đề thi', icon: BarChart3 }, 
    '/errors': { title: 'Quản lý lỗi', category: 'Biên soạn & AI', icon: Flag }, 
    '/profile': { title: 'Hồ sơ cá nhân', category: 'Cá nhân', icon: User }, 
    '/guide': { title: 'Hướng dẫn sử dụng', category: 'Hỗ trợ', icon: HelpCircle }, 
    '/user-guide': { title: 'Hướng dẫn sử dụng', category: 'Hỗ trợ', icon: HelpCircle }, 
    '/admin': { title: 'Quản trị người dùng', category: 'Hệ thống', icon: Shield }, 
    '/admin/source': { title: 'Mã nguồn & SVG', category: 'Hệ thống', icon: FileCode }, 
    '/admin/social': { title: 'Nội dung Facebook', category: 'Hệ thống', icon: Send } 
  };
  const currentPageInfo = pageTitles[location.pathname] || { title: APP_NAME, category: 'ExamHub', icon: GraduationCap };

  const handleLogout = () => { 
    sessionStorage.removeItem('admin_feedback_notified');
    logout(); 
    navigate('/login'); 
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      const checkFeedback = async () => {
        try {
          const data = await apiService.fetchFeedback();
          const unread = data.filter(f => !f.is_read);
          setUnreadFeedbackCount(unread.length);
          
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

  const hideLayout = forceHide;
  const isExpanded = !isCollapsed || isHovered;
  const isCompact = !isExpanded;

  if (!user) {
    return <main className="app-auth min-h-screen font-sans">{children}</main>;
  }

  return (
    <div className="app-shell flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-800">
        
        {/* Placeholder when collapsed & fixed on Desktop */}
        {isCollapsed && (
            <div className="hidden md:block w-[72px] shrink-0 transition-all duration-300 ease-in-out bg-transparent" />
        )}

        {/* --- SIDEBAR (Desktop) --- */}
        {!hideLayout && (
            <aside 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    'app-sidebar hidden md:flex flex-col bg-white border-r border-slate-200/90 shadow-sm z-50 transition-all duration-300 ease-in-out h-full',
                    isCollapsed ? 'fixed left-0 top-0 bottom-0 shadow-xl shadow-slate-900/5' : 'relative',
                    isExpanded ? 'w-64' : 'w-[72px]'
                )}
            >
                {/* Brand Header */}
                <div className="h-16 flex items-center px-4 border-b border-slate-100 relative shrink-0 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
                    <div className={cn(
                        'flex items-center gap-3 transition-all duration-300',
                        isCompact ? 'scale-0 w-0 opacity-0 absolute' : 'scale-100 w-auto opacity-100 relative'
                    )}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 ring-2 ring-indigo-50 shrink-0">
                            <GraduationCap size={22} className="stroke-[2.2]" />
                        </div>
                        <div className="whitespace-nowrap min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none">{APP_NAME}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/80">v2.1</span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">Hệ thống khảo thí ID6</span>
                        </div>
                    </div>
                    
                    {/* Compact Logo */}
                    <div className={cn(
                        'absolute left-1/2 -translate-x-1/2 transition-all duration-300',
                        isCompact ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    )}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-indigo-50">
                            <GraduationCap size={20} />
                        </div>
                    </div>
                    
                    {/* Pin/Toggle Button */}
                    {isExpanded && (
                        <button 
                            onClick={() => { setIsCollapsed(!isCollapsed); setIsHovered(false); }} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                            title={isCollapsed ? "Ghim mở rộng menu" : "Thu gọn menu"}
                        >
                            <div className={cn('transition-transform duration-200', isCollapsed ? 'rotate-180' : '')}>
                                <ChevronRight size={16} />
                            </div>
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2.5 space-y-0.5">
                    <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} isCompact={isCompact} />

                    {/* 1. KHẢO THÍ & ĐỀ THI */}
                    <SidebarGroup title={t('exam_management')} isCompact={isCompact}>
                        {isTeacher && <SidebarItem to="/exam" icon={Layers} label={t('exam_matrix')} isCompact={isCompact} badge="Hot" />}
                        {isTeacher && <SidebarItem to="/questions" icon={FileText} label={t('question_bank')} isCompact={isCompact} />}
                        <SidebarItem to="/online-exam" icon={MonitorPlay} label={t('online_exam')} isCompact={isCompact} />
                        {isTeacher && <SidebarItem to="/irt" icon={BarChart3} label="Phân tích IRT" isCompact={isCompact} />}
                    </SidebarGroup>

                    {/* 2. BIÊN SOẠN & CÔNG CỤ AI */}
                    {isTeacher && (
                        <SidebarGroup title={t('authoring_tools')} isCompact={isCompact}>
                            <SidebarItem to="/assign-id" icon={Tag} label={t('ai_assigner')} isCompact={isCompact} />
                            <SidebarItem to="/converter" icon={Wand2} label={t('ai_converter')} isCompact={isCompact} />
                            <SidebarItem to="/metadata" icon={FileCode} label={t('id6_metadata')} isCompact={isCompact} />
                            <SidebarItem to="/errors" icon={Flag} label={t('error_manager')} isCompact={isCompact} />
                            {isAdmin && <SidebarItem to="/duplicates" icon={Copy} label="Xử lý Trùng lặp" isCompact={isCompact} />}
                        </SidebarGroup>
                    )}

                    {/* 3. HỌC TẬP & LỚP HỌC */}
                    <SidebarGroup title={t('learning_classroom')} isCompact={isCompact}>
                        <SidebarItem to="/learning" icon={BookOpen} label="Học trực tuyến" isCompact={isCompact} isNew />
                        <SidebarItem to="/eduloop" icon={Zap} label="EduLoop · Kỹ năng" isCompact={isCompact} />
                        <SidebarItem to="/classes" icon={Users} label="Lớp học của tôi" isCompact={isCompact} />
                    </SidebarGroup>

                    {/* 4. QUẢN TRỊ HỆ THỐNG */}
                    {isAdmin && (
                        <SidebarGroup title={t('system_admin')} isCompact={isCompact}>
                            <SidebarItem to="/admin" icon={Shield} label="Quản trị User" isCompact={isCompact} />
                            <SidebarItem to="/admin/source" icon={FileCode} label="Mã nguồn & SVG" isCompact={isCompact} />
                            <SidebarItem to="/admin/social" icon={Send} label="Nội dung Facebook" isCompact={isCompact} />
                            <button 
                                onClick={() => setShowAdminFeedback(true)}
                                className={cn(
                                    'app-nav-item flex items-center gap-3 px-3.5 py-2 my-0.5 mx-2.5 rounded-xl transition-all duration-200 group relative text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-[calc(100%-20px)]',
                                    isCompact && 'justify-center'
                                )}
                                title={isCompact ? "Góp ý người dùng" : ""}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-indigo-600 shrink-0">
                                    <MessageSquare size={18} />
                                </div>
                                {!isCompact && <span className="text-xs font-semibold tracking-tight">Góp ý người dùng</span>}
                                {unreadFeedbackCount > 0 && (
                                    <span className={cn(
                                        'w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse',
                                        isCompact ? 'absolute top-1 right-2' : 'ml-auto'
                                    )} />
                                )}
                            </button>
                        </SidebarGroup>
                    )}

                    {/* 5. HỖ TRỢ */}
                    <SidebarGroup title={t('help_support')} isCompact={isCompact}>
                        <SidebarItem to="/guide" icon={HelpCircle} label="Hướng dẫn sử dụng" isCompact={isCompact} />
                        {!isAdmin && (
                            <button 
                                onClick={() => setShowFeedbackForm(true)}
                                className={cn(
                                    'app-nav-item flex items-center gap-3 px-3.5 py-2 my-0.5 mx-2.5 rounded-xl transition-all duration-200 group relative text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-[calc(100%-20px)]',
                                    isCompact && 'justify-center'
                                )}
                                title={isCompact ? "Gửi góp ý" : ""}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-indigo-600 shrink-0">
                                    <MessageSquare size={18} />
                                </div>
                                {!isCompact && <span className="text-xs font-semibold tracking-tight">Gửi góp ý</span>}
                            </button>
                        )}
                    </SidebarGroup>
                </div>

                {/* Footer User Profile Card */}
                {user && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
                        <div className={cn(
                            'flex items-center gap-3 p-2 rounded-xl transition-all',
                            isCompact ? 'justify-center p-1' : 'bg-white border border-slate-200/80 shadow-xs'
                        )}>
                            <NavLink 
                                to="/profile" 
                                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm hover:ring-2 hover:ring-indigo-300 transition-all shrink-0 font-bold text-sm"
                                title="Hồ sơ cá nhân"
                            >
                                {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                            </NavLink>
                            
                            {!isCompact && (
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{user.full_name || user.username}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                            {isAdmin ? 'Quản trị' : isTeacher ? 'Giáo viên' : 'Học sinh'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!isCompact && (
                                <button 
                                    onClick={handleLogout} 
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" 
                                    title="Đăng xuất"
                                >
                                    <LogOut size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        )}

        {/* --- MOBILE DRAWER OVERLAY --- */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
                    <div className="h-16 flex items-center px-5 border-b border-slate-100 justify-between bg-slate-50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                                <GraduationCap size={20}/>
                            </div>
                            <span className="font-extrabold text-slate-900 text-lg tracking-tight">{APP_NAME}</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50">
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        <SidebarItem to="/" icon={LayoutDashboard} label={t('dashboard')} onClick={() => setIsMobileMenuOpen(false)}/>
                        
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-1">{t('exam_management')}</div>
                        {isTeacher && <SidebarItem to="/exam" icon={Layers} label={t('exam_matrix')} onClick={() => setIsMobileMenuOpen(false)}/>}
                        {isTeacher && <SidebarItem to="/questions" icon={FileText} label={t('question_bank')} onClick={() => setIsMobileMenuOpen(false)}/>}
                        <SidebarItem to="/online-exam" icon={MonitorPlay} label={t('online_exam')} onClick={() => setIsMobileMenuOpen(false)}/>
                        {isTeacher && <SidebarItem to="/irt" icon={BarChart3} label="Phân tích IRT" onClick={() => setIsMobileMenuOpen(false)}/>}
                        
                        {isTeacher && (
                            <>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-1">{t('authoring_tools')}</div>
                                <SidebarItem to="/assign-id" icon={Tag} label={t('ai_assigner')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/converter" icon={Wand2} label={t('ai_converter')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/metadata" icon={FileCode} label={t('id6_metadata')} onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/errors" icon={Flag} label={t('error_manager')} onClick={() => setIsMobileMenuOpen(false)}/>
                                {isAdmin && <SidebarItem to="/duplicates" icon={Copy} label="Xử lý Trùng lặp" onClick={() => setIsMobileMenuOpen(false)}/>}
                            </>
                        )}
                        
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-1">{t('learning_classroom')}</div>
                        <SidebarItem to="/learning" icon={BookOpen} label="Học trực tuyến" onClick={() => setIsMobileMenuOpen(false)}/>
                        <SidebarItem to="/eduloop" icon={Zap} label="EduLoop · Kỹ năng" onClick={() => setIsMobileMenuOpen(false)}/>
                        <SidebarItem to="/classes" icon={Users} label="Lớp học của tôi" onClick={() => setIsMobileMenuOpen(false)}/>
                        
                        {isAdmin && (
                            <>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-1">{t('system_admin')}</div>
                                <SidebarItem to="/admin" icon={Shield} label="Quản trị User" onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/admin/source" icon={FileCode} label="Mã nguồn & SVG" onClick={() => setIsMobileMenuOpen(false)}/>
                                <SidebarItem to="/admin/social" icon={Send} label="Nội dung Facebook" onClick={() => setIsMobileMenuOpen(false)}/>
                            </>
                        )}
                        
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mt-4 mb-1">{t('help_support')}</div>
                        <SidebarItem to="/guide" icon={HelpCircle} label="Hướng dẫn sử dụng" onClick={() => setIsMobileMenuOpen(false)}/>
                        
                        <div className="mt-6 pt-3 border-t border-slate-100">
                            <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors">
                                <LogOut size={16}/> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MAIN APPLICATION AREA --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* Mobile Header Bar */}
            {!hideLayout && (
                <header className="md:hidden h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center px-4 justify-between shrink-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <GraduationCap size={18}/>
                        </div>
                        <span className="font-bold text-slate-900 text-base">{APP_NAME}</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Menu size={20}/>
                    </button>
                </header>
            )}

            {/* Desktop Modern Topbar */}
            {!hideLayout && (
                <header className="app-topbar hidden md:flex items-center justify-between gap-4 px-6 py-3.5 shrink-0 z-10">
                    {/* Breadcrumbs & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/60">
                            <currentPageInfo.icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <span>{currentPageInfo.category}</span>
                                <ChevronRight size={12} className="text-slate-300" />
                                <span className="text-slate-800 font-bold">{currentPageInfo.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate hidden lg:block">{APP_TAGLINE}</p>
                        </div>
                    </div>

                    {/* Right Action Bar */}
                    <div className="flex items-center gap-3">
                        {isTeacher && (
                            <NavLink 
                                to="/exam" 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-500/20 active:scale-95"
                            >
                                <PlusCircle size={15} />
                                <span>Tạo ma trận đề</span>
                            </NavLink>
                        )}

                        <NavLink 
                            to="/guide" 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all text-xs font-semibold shadow-2xs" 
                            title="Tài liệu & hướng dẫn sử dụng"
                        >
                            <HelpCircle size={14}/>
                            <span>Tài liệu</span>
                        </NavLink>

                        <div className="h-6 w-px bg-slate-200 mx-1" />

                        {/* User Badge */}
                        <div className="flex items-center gap-2.5 pl-1">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-800 leading-tight">{user.full_name || user.username}</p>
                                <span className="text-[10px] font-semibold text-indigo-600">
                                    {isAdmin ? 'Quản trị viên' : isTeacher ? 'Giáo viên' : 'Học sinh'}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-indigo-50">
                                {(user.full_name || user.username || 'E').charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* Content Container */}
            <div className="flex-1 overflow-hidden relative z-0">
                <div className={`flex-1 h-full overflow-auto custom-scrollbar ${hideLayout ? 'p-0' : 'app-workspace p-4 md:p-6'}`}>
                    <div className={`${hideLayout ? 'w-full' : 'max-w-[1800px] mx-auto'} h-full flex flex-col`}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showFeedbackForm && <UserFeedbackForm onClose={() => setShowFeedbackForm(false)} />}
            {showAdminFeedback && (
                <AdminFeedbackViewer onClose={() => {
                    setShowAdminFeedback(false);
                    apiService.fetchFeedback().then(data => setUnreadFeedbackCount(data.filter(f => !f.is_read).length));
                }} />
            )}
        </main>
    </div>
  );
};
