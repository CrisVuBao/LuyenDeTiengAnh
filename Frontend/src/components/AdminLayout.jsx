import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, BookOpen, Users, Sparkles, 
  User, Sun, Moon, LogOut, ArrowLeft 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';

export default function AdminLayout() {
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
    { to: '/admin/dashboard', label: 'Bảng Quản Trị', icon: <ShieldCheck size={20} /> },
    { to: '/admin/tests', label: 'Quản Lý Đề Thi', icon: <BookOpen size={20} /> },
    { to: '/admin/students', label: 'Quản Lý Học Viên', icon: <Users size={20} /> },
    { to: '/admin/bino', label: 'Quản Lý Sách Bino', icon: <Sparkles size={20} /> },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith('/admin/dashboard')) return 'Trung Tâm Quản Trị';
    if (location.pathname.startsWith('/admin/tests')) return 'Quản Lý Đề Thi';
    if (location.pathname.startsWith('/admin/students')) return 'Quản Lý Học Viên';
    if (location.pathname.startsWith('/admin/bino')) return 'Quản Lý Sách Bino & Media';
    return 'Bảng Quản Trị VBaceEnglish';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      
      {/* ===== ADMIN SIDEBAR (280px) ===== */}
      <aside className="hidden md:flex flex-col w-72 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 p-6 sticky top-0 h-screen z-30">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-gradient">VBaceEnglish</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 tracking-wider">
              Admin Portal
            </span>
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

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Chế Độ Học Viên</p>
            <button
              onClick={() => navigate('/home')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
              <ArrowLeft size={18} className="text-emerald-500" />
              <span>Vào Trang Học Viên</span>
            </button>
          </div>
        </nav>

        {/* Admin User Card & Logout */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate text-slate-800 dark:text-slate-200">{user?.fullName || 'Quản trị viên'}</p>
                <span className="text-[10px] text-blue-600 font-bold block uppercase">Admin</span>
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
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {getPageTitle()}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              title={mode === 'light' ? 'Bật Chế độ Tối' : 'Bật Chế độ Sáng'}
            >
              {mode === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
            </button>

            <button
              onClick={() => navigate('/home')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Giao diện Học viên
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
