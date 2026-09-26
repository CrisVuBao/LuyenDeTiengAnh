import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, BookOpen, Home, BarChart3, TrendingUp, 
  User, LogOut, Sun, Moon, ShieldCheck, ChevronDown, Layers 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import binoApi from '../api/binoApi';
import toeicApi from '../api/toeicApi';
import toast from 'react-hot-toast';

// Prefetch cả JS chunk lẫn dữ liệu API ngay khi người dùng di chuột vào thanh menu
const prefetchRoute = (route) => {
  if (route === 'home') {
    import('../features/home/components/StudentHome');
  } else if (route === 'toeic') {
    import('../features/toeic/ToeicStudyPage');
    toeicApi.prefetchAllTests();
  } else if (route === 'bino') {
    import('../features/bino/BinoBookOverviewPage');
    import('../features/bino/BinoDialogueStudyPage');
    binoApi.prefetchBookOverview();
  } else if (route === 'progress') {
    import('../features/progress/components/StudyProgressPage');
  } else if (route === 'dashboard') {
    import('../features/dashboard/components/Home');
  }
};

export default function StudentNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <NavLink to="/home" onMouseEnter={() => prefetchRoute('home')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Sparkles size={17} />
            </div>
            <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
              VBaceEnglish
            </span>
          </NavLink>

          {/* Top Menu Links (Clean Apple Pill Tabs) */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/home"
              onMouseEnter={() => prefetchRoute('home')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Home size={14} />
              <span>Trang chủ</span>
            </NavLink>

            <NavLink
              to="/bino"
              onMouseEnter={() => prefetchRoute('bino')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0071e3] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Sparkles size={14} />
              <span>Chém Tiếng Anh Bino</span>
            </NavLink>

            <NavLink
              to="/toeic"
              onMouseEnter={() => prefetchRoute('toeic')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <BookOpen size={14} />
              <span>Luyện đề TOEIC</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Controls: Theme toggle & Avatar dropdown */}
        <div className="flex items-center gap-2.5">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title={mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
          >
            {mode === 'light' ? <Moon size={15} /> : <Sun size={15} className="text-amber-400" />}
          </button>

          {/* User Avatar & Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#0071e3] text-white font-semibold flex items-center justify-center text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block font-medium text-xs text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {user?.fullName || 'Học viên'}
              </span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 animate-fade-in z-50">
                
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {user?.fullName || 'Học viên'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {user?.email || ''}
                  </p>
                </div>

                {/* Navigation Options */}
                <div className="py-1 px-1.5 space-y-0.5">
                  <button
                    onClick={() => navigate('/bino')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <Sparkles size={15} className="text-[#0071e3]" />
                    <span>Khóa học Bino (12 chương)</span>
                  </button>

                  <button
                    onClick={() => navigate('/bino/flashcards')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <Layers size={15} className="text-slate-500" />
                    <span>Bộ thẻ Flashcard (SRS)</span>
                  </button>

                  <button
                    onClick={() => navigate('/progress')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <TrendingUp size={15} className="text-slate-500" />
                    <span>Quá trình học tập</span>
                  </button>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <BarChart3 size={15} className="text-slate-500" />
                    <span>Tổng quan TOEIC</span>
                  </button>

                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                  >
                    <User size={15} className="text-slate-500" />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0071e3] dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                    >
                      <ShieldCheck size={15} />
                      <span>Quản trị hệ thống</span>
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <div className="pt-1 px-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-left"
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/70 dark:border-slate-800/80 py-2 bg-white/95 dark:bg-slate-900/95">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'text-[#0071e3] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <Home size={15} />
          <span>Trang chủ</span>
        </NavLink>

        <NavLink
          to="/bino"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'text-[#0071e3] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <Sparkles size={15} />
          <span>Chém Tiếng Anh</span>
        </NavLink>

        <NavLink
          to="/toeic"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'text-[#0071e3] font-semibold' : 'text-slate-500'
            }`
          }
        >
          <BookOpen size={15} />
          <span>TOEIC</span>
        </NavLink>
      </div>
    </header>
  );
}
