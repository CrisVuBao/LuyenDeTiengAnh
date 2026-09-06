import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,          // Token chỉ lưu trong RAM (chống XSS)
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
        // KHÔNG lưu token vào localStorage → chống XSS
      })
    }
  )
);

export default useAuthStore;
