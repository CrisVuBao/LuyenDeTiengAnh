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

  // 5 Primary Learning Programs (Include Home + 4 Pillars)
  const learningPrograms = [
    {
      to: '/home',
      prefetch: 'home',
      title: 'Trang Chủ',
      shortTitle: 'Trang Chủ',
      desc: 'Bảng điều khiển học tập, 3 trụ cột & nhiệm vụ hàng ngày',
      icon: Home,
      color: 'from-[#0071e3] to-sky-500',
      activeBg: 'bg-[#0071e3] border-b-4 border-[#0055b3] text-white',
      badge: 'Tổng Quan'
    },
    {
      to: '/communication',
      prefetch: 'communication',
      title: 'Giao Tiếp Thực Chiến',
      shortTitle: 'Hội Thoại',
      desc: '12 chương hội thoại thực chiến, phản xạ 1:1 & Ebook',
      icon: Sparkles,
      color: 'from-[#0071e3] to-indigo-600',
      activeBg: 'bg-[#0071e3] border-b-4 border-[#0055b3] text-white',
      badge: '12 Chương'
    },
    {
      to: '/reflex-50',
      prefetch: 'reflex50',
      title: 'Phản Xạ 50 Chủ Đề',
      shortTitle: 'Phản Xạ 50',
      desc: '1500 câu nói - viết phản xạ tức thì theo ngữ cảnh',
      icon: Zap,
      color: 'from-amber-500/85 to-yellow-600/85',
      activeBg: 'bg-[#d9822b] border-b-4 border-[#b46312] text-white',
      badge: '1500 Câu'
    },
    {
      to: '/vocab',
      prefetch: 'vocab',
      title: 'Học Từ Vựng',
      shortTitle: '3000 Từ',
      desc: 'Oxford 3000 theo 60 chủ đề Flashcard 3D & Quiz',
      icon: Layers,
      color: 'from-lime-400 to-lime-600',
      activeBg: 'bg-[#7acc15] border-b-4 border-[#5ea810] text-white',
      badge: '60 Chủ Đề'
    },
    {
      to: '/toeic',
      prefetch: 'toeic',
      title: 'Luyện Đề TOEIC',
      shortTitle: 'TOEIC',
      desc: 'Kho đề thi chuẩn ETS, giải thích chi tiết & chấm điểm',
      icon: BookOpen,
      color: 'from-rose-500 to-pink-600',
      activeBg: 'bg-[#ff4b4b] border-b-4 border-[#ea2b2b] text-white',
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
          
          {/* Zone 1: Brand Logo (Left) - Fixed shrink-0 with safe right margin */}
          <div className="flex items-center shrink-0 mr-1 sm:mr-4">
            <NavLink 
              to="/home" 
              onMouseEnter={() => prefetchRoute('home')} 
              className="flex items-center group shrink-0"
              title="Về Trang chủ"
            >
              <BrandLogo size="sm" showTagline={true} />
            </NavLink>
          </div>

          {/* Zone 2: Desktop Navigation Links (Duolingo 3D Chunky Tabs) */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0 min-w-0 select-none">
            {/* Home Tab (Sapphire Blue - Đồng bộ màu nút vào luyện giao tiếp) */}
            <NavLink
              to="/home"
              onMouseEnter={() => prefetchRoute('home')}
              className={({ isActive }) =>
                `hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#0071e3] border-b-4 border-[#0055b3] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-b-2 border-transparent hover:border-blue-400 dark:hover:border-blue-600'
                }`
              }
            >
              <Home size={15} className="shrink-0" />
              <span>Trang chủ</span>
            </NavLink>

            {/* Giao Tiếp Thực Chiến (Sapphire Blue - Đồng bộ màu nút vào luyện giao tiếp) */}
            <NavLink
              to="/communication"
              onMouseEnter={() => prefetchRoute('communication')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-[#0071e3] border-b-4 border-[#0055b3] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-b-2 border-transparent hover:border-blue-400 dark:hover:border-blue-600'
                }`
              }
            >
              <Sparkles size={15} className="shrink-0 text-amber-300" />
              <span className="xl:hidden">Giao Tiếp</span>
              <span className="hidden xl:inline">Giao Tiếp Thực Chiến</span>
            </NavLink>

            {/* Phản Xạ 50 Chủ Đề (Soft Warm Amber - Dịu mắt, tập trung học tập) */}
            <NavLink
              to="/reflex-50"
              onMouseEnter={() => prefetchRoute('reflex50')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-[#d9822b] border-b-4 border-[#b46312] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#d9822b] dark:hover:text-[#f59e0b] hover:bg-amber-50/70 dark:hover:bg-amber-950/30 border-b-2 border-transparent hover:border-amber-400/70 dark:hover:border-amber-600/70'
                }`
              }
            >
              <Zap size={15} className="shrink-0 text-amber-200" />
              <span className="xl:hidden">Phản Xạ</span>
              <span className="hidden xl:inline">Phản Xạ 50 Chủ Đề</span>
            </NavLink>

            {/* Học Từ Vựng 3000 (Xanh Nõn Chuối Tươi Mát & Trẻ Trung) */}
            <NavLink
              to="/vocab"
              onMouseEnter={() => prefetchRoute('vocab')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-[#7acc15] border-b-4 border-[#5ea810] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#65a30d] dark:hover:text-[#a3e635] hover:bg-lime-50 dark:hover:bg-lime-950/30 border-b-2 border-transparent hover:border-lime-300 dark:hover:border-lime-700'
                }`
              }
            >
              <Layers size={15} className="shrink-0 text-lime-100" />
              <span className="xl:hidden">Từ Vựng</span>
              <span className="hidden xl:inline">Học Từ Vựng</span>
            </NavLink>

            {/* Luyện Đề TOEIC (Duolingo Coral Red) */}
            <NavLink
              to="/toeic"
              onMouseEnter={() => prefetchRoute('toeic')}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-[#ff4b4b] border-b-4 border-[#ea2b2b] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#ff4b4b] dark:hover:text-[#ff4b4b] hover:bg-rose-50 dark:hover:bg-rose-950/40 border-b-2 border-transparent hover:border-rose-300 dark:hover:border-rose-700'
                }`
              }
            >
              <BookOpen size={15} className="shrink-0 text-rose-200" />
              <span className="xl:hidden">TOEIC</span>
              <span className="hidden xl:inline">Luyện Đề TOEIC</span>
            </NavLink>
          </nav>

          {/* Zone 3: Right Controls (XP, Theme, User Dropdown / Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Gamification XP Bar Widget */}
            <XPBar />

            {/* Realtime Notification Bell */}
            <NotificationBell />

            {/* Multilingual Selector */}
            {/* <LanguageSelector compact={false} /> */}
            
            {/* Theme Toggle (Duolingo 3D Chunky Round Button) */}
            <button
              onClick={toggleTheme}
              className="hidden min-[440px]:flex sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl duo-btn duo-btn-white duo-btn-xs sm:duo-btn-sm p-0 items-center justify-center shrink-0 cursor-pointer"
              title={mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            >
              {mode === 'light' ? <Moon size={15} /> : <Sun size={15} className="text-amber-400" />}
            </button>

            {/* Desktop User Avatar & Dropdown Menu (>= 1024px) */}
            <div className="relative hidden lg:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#1cb0f6] to-sky-400 text-white font-black flex items-center justify-center text-xs shadow-xs">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <span className="hidden xl:block font-black text-xs text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                  {user?.fullName || 'Học viên'}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Dropdown Card */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute right-0 mt-2 w-64 duo-card p-2 z-50 overflow-hidden shadow-2xl"
                  >
                    {/* User Info Header */}
                    <div className="px-3.5 py-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 mb-1 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1cb0f6] to-sky-400 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-xs text-slate-900 dark:text-white truncate">
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Lightbulb size={15} className="text-amber-500" />
                        <span>Lộ trình & Hướng dẫn học 💡</span>
                      </button>

                      <button
                        onClick={() => navigate('/home')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Home size={15} className="text-[#1cb0f6]" />
                        <span>Trang chủ học viên</span>
                      </button>

                      <button
                        onClick={() => navigate('/leaderboard')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Trophy size={15} className="text-amber-500" />
                        <span>Bảng xếp hạng & Huy hiệu</span>
                      </button>

                      <button
                        onClick={() => navigate('/progress')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <TrendingUp size={15} className="text-[#58cc02]" />
                        <span>Quá trình học tập</span>
                      </button>

                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <BarChart3 size={15} className="text-[#1cb0f6]" />
                        <span>Tổng quan TOEIC</span>
                      </button>

                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <User size={15} className="text-slate-500" />
                        <span>Hồ sơ cá nhân</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => navigate('/admin/dashboard')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-extrabold text-[#1cb0f6] dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <ShieldCheck size={15} />
                          <span>Quản trị hệ thống</span>
                        </button>
                      )}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-1 px-1.5 border-t border-slate-200/80 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile / Tablet Hamburger Button (< 1024px) — Strictly hidden on desktop >= 1024px */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex lg:!hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl duo-btn duo-btn-white duo-btn-xs sm:duo-btn-sm p-0 items-center justify-center shrink-0 cursor-pointer shadow-xs"
              title="Mở menu điều hướng"
            >
              <Menu size={17} />
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
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Drawer Panel — Tactile Duolingo 3D Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border-l-2 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-sky-400 border-b-4 border-[#0055b3] text-white font-black flex items-center justify-center text-base shadow-md shadow-blue-500/25 shrink-0">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {user?.fullName || 'Học viên'}
                    </p>
                    <p className="text-xs text-slate-400 font-bold truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="duo-btn duo-btn-white duo-btn-xs p-2 rounded-xl flex items-center justify-center cursor-pointer shadow-xs"
                  title="Đóng menu"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                
                {/* Master Learning Guide Trigger — Duolingo 3D Card */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setGuideModalOpen(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 border-2 border-amber-300 dark:border-amber-700/70 border-b-4 border-b-amber-500 text-amber-900 dark:text-amber-200 flex items-center justify-between text-left cursor-pointer transition-all hover:scale-[1.01] shadow-xs active:translate-y-0.5 active:border-b-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0 border-b-2 border-amber-600 shadow-xs">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black">Hướng Dẫn Học Hiệu Quả 💡</p>
                      <p className="text-[10px] text-amber-700/90 dark:text-amber-300/80 font-bold">Tam giác vàng 45–60 phút/ngày</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                </button>

                {/* 5 Primary Learning Programs (Duolingo 3D Chunky Cards) */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                    Chương trình học tập
                  </span>
                  <div className="space-y-2.5">
                    {learningPrograms.map((prog) => {
                      const Icon = prog.icon;
                      const isActive = location.pathname.startsWith(prog.to) || (prog.to === '/home' && location.pathname === '/');
                      return (
                        <NavLink
                          key={prog.to}
                          to={prog.to}
                          onMouseEnter={() => prefetchRoute(prog.prefetch)}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 border-b-4 transition-all ${
                            isActive
                              ? `${prog.activeBg} shadow-md scale-[1.01]`
                              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 border-b-slate-300 dark:border-b-slate-900 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 shadow-xs'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${prog.color} text-white flex items-center justify-center shrink-0 border-b-2 border-black/20 shadow-xs`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-xs sm:text-sm truncate">
                                {prog.title}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${
                                isActive
                                  ? 'bg-white/20 border-white/40 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700/80 border-slate-200/80 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                              }`}>
                                {prog.badge}
                              </span>
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 font-medium ${isActive ? 'text-white/85' : 'text-slate-400 dark:text-slate-400'}`}>
                              {prog.desc}
                            </p>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>

                {/* Study Tools & Profile Links (Duolingo 3D Chunky Action List) */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
                    Tiện ích & Thành tích
                  </span>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate('/leaderboard');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 text-slate-800 dark:text-slate-200 text-xs font-black transition-all hover:scale-[1.01] active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-400 border-b-2 border-amber-600 text-white flex items-center justify-center shrink-0">
                          <Trophy size={16} />
                        </div>
                        <span>Bảng xếp hạng & Huy hiệu</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        navigate('/progress');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 text-slate-800 dark:text-slate-200 text-xs font-black transition-all hover:scale-[1.01] active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 border-b-2 border-emerald-700 text-white flex items-center justify-center shrink-0">
                          <TrendingUp size={16} />
                        </div>
                        <span>Quá trình học tập chi tiết</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 text-slate-800 dark:text-slate-200 text-xs font-black transition-all hover:scale-[1.01] active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#0071e3] border-b-2 border-[#0055b3] text-white flex items-center justify-center shrink-0">
                          <BarChart3 size={16} />
                        </div>
                        <span>Tổng quan điểm TOEIC</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        navigate('/profile');
                        setDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 text-slate-800 dark:text-slate-200 text-xs font-black transition-all hover:scale-[1.01] active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-500 border-b-2 border-slate-700 text-white flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
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
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800 border-b-4 border-b-blue-400 dark:border-b-blue-900 text-[#0071e3] dark:text-sky-400 text-xs font-black transition-all hover:scale-[1.01] active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0071e3] border-b-2 border-[#0055b3] text-white flex items-center justify-center shrink-0">
                            <ShieldCheck size={16} />
                          </div>
                          <span>Quản trị hệ thống</span>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer (Theme & Logout) — Duolingo 3D Buttons */}
              <div className="p-4 border-t-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                    Giao diện: {mode === 'light' ? 'Chế độ sáng' : 'Chế độ tối'}
                  </span>
                  <button
                    onClick={toggleTheme}
                    className="duo-btn duo-btn-white duo-btn-xs p-2 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {mode === 'light' ? <Moon size={14} /> : <Sun size={14} className="text-amber-500" />}
                    <span className="text-[11px] font-black">{mode === 'light' ? 'Tối' : 'Sáng'}</span>
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="duo-btn duo-btn-red duo-btn-sm w-full font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <LogOut size={15} />
                  <span>ĐĂNG XUẤT TÀI KHOẢN</span>
                </button>

                <div className="text-center pt-0.5">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500">
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
      {/* Native Duolingo App-Style 3D TabBar at Bottom of Screen   */}
      {/* ======================================================== */}
      <nav 
        aria-label="Mobile Navigation" 
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t-2 border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5"
      >
        <div className="flex items-center justify-around px-2 gap-1">
          {[
            { to: '/home', prefetch: 'home', label: 'Trang chủ', icon: Home, activeColor: 'bg-[#0071e3] text-white border-b-3 border-[#0055b3] shadow-md shadow-blue-500/25' },
            { to: '/communication', prefetch: 'communication', label: 'Giao tiếp', icon: Sparkles, activeColor: 'bg-[#0071e3] text-white border-b-3 border-[#0055b3] shadow-md shadow-blue-500/25' },
            { to: '/reflex-50', prefetch: 'reflex50', label: 'Phản xạ', icon: Zap, activeColor: 'bg-[#d9822b] text-white border-b-3 border-[#b46312] shadow-sm' },
            { to: '/vocab', prefetch: 'vocab', label: 'Từ vựng', icon: Layers, activeColor: 'bg-[#7acc15] text-white border-b-3 border-[#5ea810] shadow-sm' },
            { to: '/toeic', prefetch: 'toeic', label: 'TOEIC', icon: BookOpen, activeColor: 'bg-[#ff4b4b] text-white border-b-3 border-[#ea2b2b] shadow-md shadow-rose-500/25' }
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
                  `flex-1 flex flex-col items-center justify-center py-0.5 rounded-2xl transition-all select-none ${
                    isActive
                      ? 'scale-105'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`px-3.5 py-1 rounded-2xl flex items-center justify-center transition-all ${
                        isActive
                          ? `${item.activeColor}`
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={19} />
                    </div>
                    <span className={`text-[10px] mt-0.5 leading-tight font-black tracking-tight ${
                      isActive ? 'text-slate-900 dark:text-white' : 'font-bold text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.label}
                    </span>
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
