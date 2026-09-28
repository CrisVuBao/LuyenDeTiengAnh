import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  BookOpen,
  Users,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  Layers
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useNotificationStore from '../store/useNotificationStore';
import authApi from '../api/authApi';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const disconnectRealtime = useNotificationStore((s) => s.disconnectRealtime);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await disconnectRealtime();
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      logout();
      toast.success('Đã đăng xuất');
      navigate('/auth');
    }
  };

  const navGroups = [
    {
      title: 'Trung Tâm Chỉ Huy',
      items: [
        { to: '/admin/dashboard', label: 'Bảng Quản Trị', icon: <ShieldCheck size={19} /> },
        { to: '/admin/students', label: 'Quản Lý Học Viên', icon: <Users size={19} />, badge: 'VIP' },
        { to: '/admin/analytics', label: 'Phân Tích & Báo Cáo', icon: <BarChart3 size={19} />, badge: 'PRO' },
        { to: '/admin/notifications', label: 'Trung Tâm Thông Báo', icon: <Bell size={19} />, badge: 'LIVE' }
      ]
    },
    {
      title: 'Quản Trị Học Liệu',
      items: [
        { to: '/admin/tests', label: 'Kho Đề Thi TOEIC', icon: <BookOpen size={19} /> },
        { to: '/admin/bino', label: 'Giao Tiếp Thực Chiến', icon: <Sparkles size={19} /> },
        { to: '/admin/content', label: '3000 Từ & Phản Xạ 50', icon: <Layers size={19} /> }
      ]
    },
    {
      title: 'Vận Hành & Cấu Hình',
      items: [
        { to: '/admin/activity-log', label: 'Nhật Ký Hoạt Động', icon: <ScrollText size={19} /> },
        { to: '/admin/settings', label: 'Cài Đặt Hệ Thống', icon: <Settings size={19} /> }
      ]
    }
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith('/admin/dashboard')) return 'Trung Tâm Quản Trị Tổng Quan';
    if (location.pathname.startsWith('/admin/students')) return 'Quản Trị Học Viên VIP 360°';
    if (location.pathname.startsWith('/admin/analytics')) return 'Phân Tích Chuyên Sâu & Báo Cáo';
    if (location.pathname.startsWith('/admin/notifications')) return 'Trung Tâm Phát Sóng Thông Báo';
    if (location.pathname.startsWith('/admin/tests')) return 'Quản Lý Kho Đề Thi TOEIC';
    if (location.pathname.startsWith('/admin/bino')) return 'Quản Lý Giao Tiếp Thực Chiến & Media CMS';
    if (location.pathname.startsWith('/admin/content')) return 'Giám Sát 3000 Từ Vựng & Phản Xạ 50';
    if (location.pathname.startsWith('/admin/activity-log')) return 'Nhật Ký Hoạt Động Quản Trị (Audit Log)';
    if (location.pathname.startsWith('/admin/settings')) return 'Cài Đặt & Cấu Hình Hệ Thống';
    return 'Bảng Quản Trị VBaceEnglish';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* ===== ADMIN SIDEBAR (280px) ===== */}
      <aside className="hidden md:flex flex-col w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 p-5 sticky top-0 h-screen z-30">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Sparkles size={21} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-gradient leading-tight">
              VBaceEnglish
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                By Vũ Bảo Software
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 tracking-wider">
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badge === 'LIVE'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Chế Độ Học Viên
            </p>
            <button
              onClick={() => navigate('/home')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
            >
              <ArrowLeft size={17} className="text-emerald-500 shrink-0" />
              <span>Vào Trang Học Viên</span>
            </button>
          </div>
        </nav>

        {/* Admin User Card & Logout */}
        <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                  {user?.fullName || 'Quản trị viên'}
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold block uppercase tracking-wider">
                  Admin Command
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              title="Mở menu quản trị"
            >
              <Menu size={18} />
            </button>

            {/* Mobile Brand */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                  VBaceEnglish
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tight mt-0.5">
                  By Vũ Bảo Software
                </span>
              </div>
            </div>

            <h2 className="hidden md:block text-base font-extrabold text-slate-800 dark:text-slate-100">
              {getPageTitle()}
            </h2>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
              Command Center 
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Realtime Notification Bell */}
            <NotificationBell isAdminHeader />

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-2xs active:scale-95"
              title={mode === 'light' ? 'Bật Chế độ Tối' : 'Bật Chế độ Sáng'}
            >
              {mode === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
            </button>

            <button
              onClick={() => navigate('/home')}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} className="text-emerald-500" />
              <span className="hidden sm:inline">Giao diện Học viên</span>
              <span className="sm:hidden">Học viên</span>
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sidebar content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                        VBaceEnglish
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        By Vũ Bảo Software
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-4">
                  {navGroups.map((group) => (
                    <div key={group.title}>
                      <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        {group.title}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                              }`
                            }
                          >
                            <div className="flex items-center gap-3">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/home');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <ArrowLeft size={16} className="text-emerald-500" />
                      <span>Về Giao Diện Học Viên</span>
                    </button>
                  </div>
                </nav>
              </div>

              {/* User Footer */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                      {user?.fullName?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                        {user?.fullName || 'Quản trị viên'}
                      </p>
                      <span className="text-[9px] text-blue-600 font-bold uppercase">Admin VIP</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
                <p className="text-[9px] font-bold text-slate-400 text-center">
                  VBaceEnglish • By Vũ Bảo Software
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
