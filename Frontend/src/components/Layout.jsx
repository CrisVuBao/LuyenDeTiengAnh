import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BookOpen, User, Sun, Moon, LogOut, 
  FileText, ShieldCheck, Sparkles 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      logout();
      toast.success('Đã đăng xuất');
      navigate('/auth');
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { to: '/toeic', label: 'Luyện Đề TOEIC', icon: <BookOpen size={20} /> },
    ...(user?.role === 'Admin' ? [{ to: '/admin', label: 'Quản Trị Đề Thi', icon: <ShieldCheck size={20} /> }] : []),
    { to: '/profile', label: 'Hồ Sơ Cá Nhân', icon: <User size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      
      {/* ===== DESKTOP SIDEBAR (280px) (E.3) ===== */}
      <aside className="hidden md:flex flex-col w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 p-6 sticky top-0 h-screen z-30">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-gradient">VBaceEnglish</h1>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Smart English Platform</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate text-slate-800 dark:text-slate-200">{user?.fullName || 'Học viên'}</p>
                <span className="text-[11px] text-slate-400 block truncate">{user?.role || 'Student'}</span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles size={18} />
            </div>
            <span className="font-black text-lg text-gradient">VBaceEnglish</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {location.pathname.startsWith('/toeic') ? 'Luyện Đề Phản Xạ' :
               location.pathname.startsWith('/dashboard') ? 'Tổng Quan Học Tập' :
               location.pathname.startsWith('/admin') ? 'Trung Tâm Quản Trị' : 'Hồ Sơ'}
            </h2>
          </div>

          {/* Header Controls: Theme toggle & User profile link */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              title={mode === 'light' ? 'Bật Chế độ Tối' : 'Bật Chế độ Sáng'}
            >
              {mode === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="md:hidden w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs"
            >
              {user?.fullName?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV BAR (E.3) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
