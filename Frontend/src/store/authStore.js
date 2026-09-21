import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (token) {
          try { localStorage.setItem('vbace_auth_token', token); } catch {}
        }
        set({ user, token, isAuthenticated: true });
      },
      updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
      logout: () => {
        try { localStorage.removeItem('vbace_auth_token'); } catch {}
        set({ user: null, token: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
