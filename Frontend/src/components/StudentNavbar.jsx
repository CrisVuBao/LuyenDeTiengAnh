import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, Home, BarChart3, TrendingUp, 
  User, LogOut, Sun, Moon, ShieldCheck, ChevronDown, 
  Layers, Zap, Trophy, Menu, X, ChevronRight, GraduationCap, Lightbulb
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import authApi from '../api/authApi';
import binoApi from '../api/binoApi';
import toeicApi from '../api/toeicApi';
import toast from 'react-hot-toast';
import XPBar from '../features/gamification/components/XPBar';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import MasterLearningGuideModal from './MasterLearningGuideModal';
import BrandLogo from './BrandLogo';
import useBrandingStore from '../store/useBrandingStore';

// Prefetch JS chunks & API data on hover
const prefetchRoute = (route) => {
  if (route === 'home') {
    import('../features/home/components/StudentHome');
  } else if (route === 'toeic') {
    import('../features/toeic/ToeicStudyPage');
    toeicApi.prefetchAllTests();
  } else if (route === 'communication' || route === 'bino') {
    import('../features/bino/BinoBookOverviewPage');
    import('../features/bino/BinoDialogueStudyPage');
    binoApi.prefetchBookOverview();
  } else if (route === 'reflex50') {
    import('../features/reflex50/Reflex50OverviewPage');
    import('../features/reflex50/Reflex50UnitStudyPage');
  } else if (route === 'vocab') {
    import('../features/vocab/VocabOverviewPage');
    import('../features/vocab/VocabStudyPage');
  } else if (route === 'progress') {
    import('../features/progress/components/StudyProgressPage');
  } else if (route === 'dashboard') {
    import('../features/dashboard/components/Home');
  }
};

export default function StudentNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const branding = useBrandingStore((s) => s.branding);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'Admin';

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

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

  // 4 Primary Learning Programs
  const learningPrograms = [
    {
      to: '/communication',
      prefetch: 'communication',
      title: 'Giao Tiếp Thực Chiến',
      shortTitle: 'Hội Thoại',
      desc: '12 chương hội thoại thực chiến, phản xạ 1:1 & Ebook',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
      badge: '12 Chương'
    },
    {
      to: '/reflex-50',
      prefetch: 'reflex50',
      title: 'Phản Xạ 50 Chủ Đề',
      shortTitle: 'Phản Xạ 50',
      desc: '1500 câu nói - viết phản xạ tức thì theo ngữ cảnh',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      badge: '1500 Câu'
    },
    {
      to: '/vocab',
      prefetch: 'vocab',
      title: 'Học Từ Vựng',
      shortTitle: '3000 Từ',
      desc: 'Oxford 3000 theo 60 chủ đề Flashcard 3D & Quiz',
      icon: Layers,
      color: 'from-emerald-500 to-teal-600',
      badge: '60 Chủ Đề'
    },
    {
      to: '/toeic',
      prefetch: 'toeic',
      title: 'Luyện Đề TOEIC',
      shortTitle: 'TOEIC',
      desc: 'Kho đề thi chuẩn ETS, giải thích chi tiết & chấm điểm',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-600',
      badge: 'Full ETS'
    }
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TOP STICKY NAVBAR (Clean, Single Row, Apple Glassmorphic) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 w-full max-w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
          
          {/* Zone 1: Brand Logo (Left) */}
          <div className="flex items-center min-w-0 shrink">
            <NavLink 
              to="/home" 
              onMouseEnter={() => prefetchRoute('home')} 
              className="flex items-center group min-w-0"
            >
              <BrandLogo size="sm" />
            </NavLink>
          </div>

          {/* Zone 2: Desktop Navigation Links (Center, Responsive, 0% Collision) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            <NavLink
              to="/home"
              onMouseEnter={() => prefetchRoute('home')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Home size={14} className="shrink-0" />
              <span>Trang chủ</span>
            </NavLink>

            <NavLink
              to="/communication"
              onMouseEnter={() => prefetchRoute('communication')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Sparkles size={14} className="shrink-0 text-amber-300" />
              <span className="xl:hidden">Giao Tiếp</span>
              <span className="hidden xl:inline">Giao Tiếp Thực Chiến</span>
            </NavLink>

            <NavLink
              to="/reflex-50"
              onMouseEnter={() => prefetchRoute('reflex50')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Zap size={14} className="shrink-0 text-amber-400" />
              <span className="xl:hidden">Phản xạ</span>
              <span className="hidden xl:inline">Phản Xạ 50 Chủ Đề</span>
            </NavLink>

            <NavLink
              to="/vocab"
              onMouseEnter={() => prefetchRoute('vocab')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Layers size={14} className="shrink-0 text-emerald-400" />
              <span className="xl:hidden">Từ vựng</span>
              <span className="hidden xl:inline">Học Từ Vựng</span>
            </NavLink>

            <NavLink
              to="/toeic"
              onMouseEnter={() => prefetchRoute('toeic')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <BookOpen size={14} className="shrink-0 text-purple-400" />
              <span className="xl:hidden">TOEIC</span>
              <span className="hidden xl:inline">Luyện Đề TOEIC</span>
            </NavLink>

            {/* <button
              onClick={() => setGuideModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Xem Lộ Trình & Hướng Dẫn Học Hiệu Quả"
            >
              <Lightbulb size={13} className="text-amber-500 shrink-0" />
              <span className="hidden xl:inline">Hướng dẫn học</span>
              <span className="xl:hidden">Hướng dẫn</span>
            </button> */}
          </nav>

          {/* Zone 3: Right Controls (XP, Theme, User Dropdown / Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Gamification XP Bar Widget */}
            <XPBar />

            {/* Realtime Notification Bell */}
            <NotificationBell />

            {/* Multilingual Selector */}
            {/* <LanguageSelector compact={false} /> */}
            
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 flex items-center justify-center transition-colors cursor-pointer"
              title={mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            >
              {mode === 'light' ? <Moon size={15} /> : <Sun size={15} className="text-amber-400" />}
            </button>

            {/* Desktop User Avatar & Dropdown Menu (>= 1024px) */}
            <div className="relative hidden lg:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <span className="hidden xl:block font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                  {user?.fullName || 'Học viên'}
                </span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Dropdown Card */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 py-1.5 z-50 overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {user?.fullName || 'Học viên'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {user?.email || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="py-1 px-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setGuideModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Lightbulb size={15} className="text-amber-500" />
                        <span>Lộ trình & Hướng dẫn học 💡</span>
                      </button>

                      <button
                        onClick={() => navigate('/leaderboard')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                      >
                        <Trophy size={15} className="text-amber-500" />
                        <span>Bảng xếp hạng & Huy hiệu</span>
                      </button>

                      <button
                        onClick={() => navigate('/progress')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                      >
                        <TrendingUp size={15} className="text-emerald-500" />
                        <span>Quá trình học tập</span>
                      </button>

                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                      >
                        <BarChart3 size={15} className="text-[#0071e3]" />
                        <span>Tổng quan TOEIC</span>
                      </button>

                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                      >
                        <User size={15} className="text-slate-500" />
                        <span>Hồ sơ cá nhân</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => navigate('/admin/dashboard')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#0071e3] dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors text-left"
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile / Tablet Hamburger Button (< 1024px) */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Mở menu điều hướng"
            >
              <Menu size={18} />
            </button>

          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MOBILE & TABLET SLIDE-OVER DRAWER (< 1024px)         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {user?.fullName || 'Học viên'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Đóng menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Master Learning Guide Trigger */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setGuideModalOpen(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Lightbulb size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Hướng Dẫn Học Hiệu Quả 💡</p>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80">Tam giác vàng 45–60 phút/ngày</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-amber-600 dark:text-amber-400" />
                </button>

                {/* 4 Main Learning Programs */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                    Chương trình học tập
                  </span>
                  <div className="space-y-2">
                    {learningPrograms.map((prog) => {
                      const Icon = prog.icon;
                      const isActive = location.pathname.startsWith(prog.to);
                      return (
                        <NavLink
                          key={prog.to}
                          to={prog.to}
                          onMouseEnter={() => prefetchRoute(prog.prefetch)}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-[#0071e3]/40 text-[#0071e3] dark:text-sky-400 shadow-sm'
                              : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${prog.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {prog.title}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {prog.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {prog.desc}
                            </p>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>

                {/* Study Tools & Profile Links */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                    Tiện ích & Thành tích
                  </span>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        navigate('/leaderboard');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Trophy size={16} className="text-amber-500" />
                        <span>Bảng xếp hạng & Huy hiệu</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        navigate('/progress');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={16} className="text-emerald-500" />
                        <span>Quá trình học tập chi tiết</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart3 size={16} className="text-[#0071e3]" />
                        <span>Tổng quan điểm TOEIC</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        navigate('/profile');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <User size={16} className="text-slate-500" />
                        <span>Hồ sơ cá nhân & Bảo mật</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          navigate('/admin/dashboard');
                          setDrawerOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 text-[#0071e3] dark:text-sky-400 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={16} />
                          <span>Quản trị hệ thống</span>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer (Theme & Logout) */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                {/* <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Ngôn ngữ
                  </span>
                  <LanguageSelector compact={false} />
                </div> */}

                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Giao diện: {mode === 'light' ? 'Chế độ sáng' : 'Chế độ tối'}
                  </span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {mode === 'light' ? <Moon size={14} /> : <Sun size={14} className="text-amber-400" />}
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất tài khoản</span>
                </button>

                <div className="text-center pt-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {branding.brandName} • {branding.companyName || branding.tagline}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< 768px / md:hidden)     */}
      {/* Native App-Style iOS TabBar at Bottom of Screen          */}
      {/* ======================================================== */}
      <nav 
        aria-label="Mobile Navigation" 
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1"
      >
        <div className="flex items-center justify-around px-1.5">
          {[
            { to: '/home', prefetch: 'home', label: 'Trang chủ', icon: Home },
            { to: '/communication', prefetch: 'communication', label: 'Giao tiếp', icon: Sparkles },
            { to: '/reflex-50', prefetch: 'reflex50', label: 'Phản xạ', icon: Zap },
            { to: '/vocab', prefetch: 'vocab', label: 'Từ vựng', icon: Layers },
            { to: '/toeic', prefetch: 'toeic', label: 'TOEIC', icon: BookOpen }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onMouseEnter={() => prefetchRoute(item.prefetch)}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center py-1 min-h-[46px] rounded-xl transition-colors select-none ${
                    isActive
                      ? 'text-[#0071e3] dark:text-sky-400 font-bold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`px-3 py-0.5 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? 'bg-[#0071e3]/12 dark:bg-sky-500/20' : ''
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Master Learning Methodology & Synergy Guide Modal */}
      <MasterLearningGuideModal 
        isOpen={guideModalOpen} 
        onClose={() => setGuideModalOpen(false)} 
      />
    </>
  );
}
