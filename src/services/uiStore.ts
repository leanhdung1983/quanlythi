
import { create } from 'zustand';

interface UIState {
  hideSidebar: boolean;
  setHideSidebar: (hide: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hideSidebar: false,
  setHideSidebar: (hide) => set({ hideSidebar: hide }),
}));
