import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, BookOpen, Home, BarChart3, TrendingUp, 
  User, LogOut, Sun, Moon, ShieldCheck, ChevronDown, Layers, Server 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import toast from 'react-hot-toast';
import ServerConfigModal from './ServerConfigModal';

export default function StudentNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'Admin';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

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

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <NavLink to="/home" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-gradient">VBaceEnglish</span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 block -mt-1 uppercase tracking-wider">
                Smart English Platform
              </span>
            </div>
          </NavLink>

          {/* Top Menu Links */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Home size={17} />
              <span>Trang Chủ</span>
            </NavLink>

            <NavLink
              to="/toeic"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <BookOpen size={17} />
              <span>Luyện Đề TOEIC</span>
            </NavLink>

            <NavLink
              to="/bino"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Sparkles size={16} className="text-amber-500 group-hover:rotate-12 transition-transform" />
              <span>Chém Tiếng Anh</span>
              <span className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold">Bino</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Controls: Theme toggle & Avatar dropdown */}
        <div className="flex items-center gap-3">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
            title={mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
          >
            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
          </button>

          {/* User Avatar & Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all active:scale-98"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {user?.fullName || 'Học viên'}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {isAdmin ? 'Admin' : 'Học viên'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 animate-fade-in z-50">
                
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user?.fullName || 'Học viên'}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {user?.email || ''}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      isAdmin 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    }`}>
                      {isAdmin ? 'Quản Trị Viên' : 'Học Viên Chuẩn'}
                    </span>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="py-1.5 px-1 space-y-0.5">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <BarChart3 size={16} className="text-blue-500" />
                    <span>Tổng quan học tập</span>
                  </button>

                  <button
                    onClick={() => navigate('/progress')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <TrendingUp size={16} className="text-emerald-500" />
                    <span>Quá trình học tập</span>
                  </button>

                  <button
                    onClick={() => navigate('/bino')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors text-left"
                  >
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Sách Bino (12 Chương)</span>
                  </button>

                  <button
                    onClick={() => navigate('/bino/flashcards')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <Layers size={16} className="text-emerald-500" />
                    <span>Bộ Thẻ Flashcards (SRS)</span>
                  </button>

                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <User size={16} className="text-purple-500" />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsServerModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <Server size={16} className="text-indigo-500" />
                    <span>Cài đặt máy chủ (API)</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors text-left"
                    >
                      <ShieldCheck size={16} />
                      <span>Bảng điều khiển Quản trị</span>
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <div className="pt-1.5 px-1 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-left"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800/80 py-2 bg-white/95 dark:bg-slate-900/95">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
              isActive ? 'text-blue-600' : 'text-slate-500'
            }`
          }
        >
          <Home size={16} />
          <span>Trang Chủ</span>
        </NavLink>

        <NavLink
          to="/toeic"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
              isActive ? 'text-blue-600' : 'text-slate-500'
            }`
          }
        >
          <BookOpen size={16} />
          <span>TOEIC</span>
        </NavLink>

        <NavLink
          to="/bino"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
              isActive ? 'text-amber-600 font-black' : 'text-slate-500'
            }`
          }
        >
          <Sparkles size={16} className="text-amber-500" />
          <span>Sách Bino</span>
        </NavLink>
      </div>

      {/* Server Config Modal */}
      <ServerConfigModal 
        isOpen={isServerModalOpen} 
        onClose={() => setIsServerModalOpen(false)} 
      />
    </header>
  );
}
