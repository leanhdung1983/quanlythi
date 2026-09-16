
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
    id: number;
    username: string;
    role: UserRole;
    full_name: string;
    email?: string;
    school?: string;
    api_key?: string;
    is_pro: boolean;
    expiry_date?: string; // ISO String
    grade_id?: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    lastActive: number; // Thêm trường lưu thời gian hoạt động cuối
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    touchSession: () => void; // Hàm cập nhật thời gian hoạt động
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            lastActive: Date.now(),
            login: (user, token) => set({ user, token, lastActive: Date.now() }),
            logout: () => {
                fetch('/api/logout', { method: 'POST', keepalive: true }).catch(() => undefined);
                set({ user: null, token: null, lastActive: 0 });
            },
            updateUser: (updates) => set((state) => ({ 
                user: state.user ? { ...state.user, ...updates } : null 
            })),
            touchSession: () => set({ lastActive: Date.now() })
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage), // Sử dụng sessionStorage để tự thoát khi đóng tab
        }
    )
);

let isHandlingSessionExpiry = false;

/**
 * Xử lý khi phiên làm việc hết hạn (do 401 hoặc do không tương tác).
 * Tự động xóa trạng thái phiên đăng nhập và điều hướng ngay về trang đăng nhập.
 */
export const handleSessionExpired = (message?: string) => {
    if (isHandlingSessionExpiry) return;
    isHandlingSessionExpiry = true;
    setTimeout(() => {
        isHandlingSessionExpiry = false;
    }, 2500);

    // 1. Xoá phiên trong authStore
    useAuthStore.getState().logout();

    // 2. Xóa các cờ tạm thời trong sessionStorage
    sessionStorage.removeItem('admin_feedback_notified');

    // 3. Lưu thông báo hiển thị tại màn hình đăng nhập
    const notice = message || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
    sessionStorage.setItem('session_expired_msg', notice);

    // 4. Lập tức chuyển về trang đăng nhập
    if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
    }
};

