
import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuthStore, handleSessionExpired } from './services/authStore';
import { apiService } from './services/api';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const MetadataManager = lazy(() => import('./pages/MetadataManager').then(module => ({ default: module.MetadataManager })));
const QuestionBank = lazy(() => import('./pages/QuestionBank').then(module => ({ default: module.QuestionBank })));
const ExamGenerator = lazy(() => import('./pages/ExamGenerator').then(module => ({ default: module.ExamGenerator })));
const IdAssigner = lazy(() => import('./pages/IdAssigner').then(module => ({ default: module.IdAssigner })));
const Converter = lazy(() => import('./pages/Converter').then(module => ({ default: module.Converter })));
const DuplicateManager = lazy(() => import('./pages/DuplicateManager').then(module => ({ default: module.DuplicateManager })));
const OnlineExam = lazy(() => import('./pages/OnlineExam').then(module => ({ default: module.OnlineExam })));
const ErrorManager = lazy(() => import('./pages/ErrorManager').then(module => ({ default: module.ErrorManager })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(module => ({ default: module.UserProfile })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminSourceViewer = lazy(() => import('./pages/AdminSourceViewer').then(module => ({ default: module.AdminSourceViewer })));
const IRTAnalysis = lazy(() => import('./pages/IRTAnalysis').then(module => ({ default: module.IRTAnalysis })));
const AdaptiveTest = lazy(() => import('./pages/AdaptiveTest').then(module => ({ default: module.AdaptiveTest })));
const Learning = lazy(() => import('./pages/Learning').then(module => ({ default: module.Learning })));
const ClassManagement = lazy(() => import('./pages/ClassManagement').then(module => ({ default: module.ClassManagement })));
const ManualSocialPlanner = lazy(() => import('./pages/ManualSocialPlanner').then(module => ({ default: module.ManualSocialPlanner })));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse text-sm">Đang tải trang...</p>
        </div>
    </div>
);

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthStore();
    const location = useLocation();
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    return <>{children}</>;
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthStore();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
    return <>{children}</>;
};

const TeacherGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthStore();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'ADMIN' && user.role !== 'TEACHER') return <Navigate to="/" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
  const { user, touchSession } = useAuthStore();
  
  // Dùng ref để kiểm soát việc ghi vào storage không quá thường xuyên
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!user) return;

    const TIMEOUT_MS = 30 * 60 * 1000; // 30 phút không tương tác

    // Helper kiểm tra hết hạn (Đọc trực tiếp từ Store để tránh dependency loop)
    const checkExpiry = () => {
        // Không tự động đăng xuất nếu đang có phiên làm bài thi đang diễn ra
        const hasActiveExam = Boolean(localStorage.getItem('online_exam_progress'));
        if (hasActiveExam) {
            touchSession();
            return false;
        }

        const currentLastActive = useAuthStore.getState().lastActive;
        if (currentLastActive && (Date.now() - currentLastActive > TIMEOUT_MS)) {
            console.warn("Phiên đăng nhập đã hết hạn do không tương tác.");
            handleSessionExpired("Phiên làm việc đã hết hạn do không tương tác trong 30 phút. Vui lòng đăng nhập lại.");
            return true;
        }
        return false;
    };

    // 1. KIỂM TRA NGAY KHI VÀO TRANG (Mount)
    if (checkExpiry()) return;

    // Xác thực phiên với backend ngay khi khởi động trang
    apiService.checkSession().catch(() => {
        // Nếu API trả về 401, handleResponse trong apiService sẽ tự gọi handleSessionExpired
    });

    // Cập nhật session ngay khi mount (User active)
    touchSession();

    // 2. HÀM XỬ LÝ KHI NGƯỜI DÙNG TƯƠNG TÁC
    const handleUserActivity = () => {
        // Quan trọng: Kiểm tra xem phiên đã hết hạn trước đó chưa TRƯỚC KHI cập nhật lastActive
        if (checkExpiry()) return;

        const now = Date.now();
        // Chỉ cập nhật vào store mỗi 10 giây một lần để tránh spam storage/re-render
        if (now - lastUpdateRef.current > 10000) {
            touchSession();
            lastUpdateRef.current = now;
        }
    };

    // Khi người dùng chuyển tab quay lại hoặc mở lại trình duyệt
    const handleVisibilityOrFocus = () => {
        if (document.visibilityState === 'visible') {
            if (checkExpiry()) return;
            // Kiểm tra tính hợp lệ của cookie phiên với máy chủ
            apiService.checkSession().catch(() => {});
        }
    };

    // Các sự kiện đánh dấu người dùng còn đang hoạt động
    const activityEvents = [
      'mousedown', 
      'keydown', 
      'scroll', 
      'touchstart',
      'click'
    ];

    activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 3. INTERVAL KIỂM TRA ĐỊNH KỲ (Cho trường hợp treo tab)
    const intervalId = setInterval(() => {
        checkExpiry();
    }, 30 * 1000); // Kiểm tra mỗi 30 giây

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [user, touchSession]);

  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><UserProfile /></AuthGuard>} />
            
            <Route path="/metadata" element={<AuthGuard><MetadataManager /></AuthGuard>} />
            <Route path="/questions" element={<AuthGuard><QuestionBank /></AuthGuard>} />
            <Route path="/assign-id" element={<TeacherGuard><IdAssigner /></TeacherGuard>} />
            <Route path="/exam" element={<AuthGuard><ExamGenerator /></AuthGuard>} />
            <Route path="/converter" element={<AuthGuard><Converter /></AuthGuard>} />
            <Route path="/duplicates" element={<AuthGuard><DuplicateManager /></AuthGuard>} />
            <Route path="/online-exam" element={<AuthGuard><OnlineExam /></AuthGuard>} />
            <Route path="/irt" element={<TeacherGuard><IRTAnalysis /></TeacherGuard>} />
            <Route path="/adaptive" element={<AuthGuard><AdaptiveTest /></AuthGuard>} />
            <Route path="/learning" element={<AuthGuard><Learning /></AuthGuard>} />
            <Route path="/classes" element={<AuthGuard><ClassManagement /></AuthGuard>} />
            
            <Route path="/errors" element={<TeacherGuard><ErrorManager /></TeacherGuard>} />
            
            <Route path="/admin" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="/admin/source" element={<AdminGuard><AdminSourceViewer /></AdminGuard>} />
            <Route path="/admin/social" element={<AdminGuard><ManualSocialPlanner /></AdminGuard>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default App;
