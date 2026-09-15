
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
                // Có thể thêm xóa các dữ liệu tạm thời khác ở đây nếu cần
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
