import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'light',
      toggleTheme: () => set((state) => {
        const newMode = state.mode === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newMode === 'dark');
        return { mode: newMode };
      })
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.mode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  )
);

export default useThemeStore;
