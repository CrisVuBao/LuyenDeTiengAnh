import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  PanelLeftClose,
  PanelLeft,
  Search,
  Command,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Activity,
  ShieldAlert
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useNotificationStore from '../store/useNotificationStore';
import authApi from '../api/authApi';
import NotificationBell from './NotificationBell';
import BrandLogo from './BrandLogo';
import useBrandingStore from '../store/useBrandingStore';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const branding = useBrandingStore((s) => s.branding);
  const disconnectRealtime = useNotificationStore((s) => s.disconnectRealtime);
  
  // Responsive sidebar collapse state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('vbace_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Toggle and persist desktop sidebar collapse state
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vbace_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchModalOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global hotkeys (Ctrl/Cmd + K for quick search, Ctrl/Cmd + [ for collapse)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        handleToggleSidebar();
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [searchModalOpen]);

  const handleLogout = async () => {
    try {
      await disconnectRealtime();
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      logout();
      toast.success('Đã đăng xuất khỏi phiên quản trị');
      navigate('/auth');
    }
  };

  const navGroups = [
    {
      title: 'Trung Tâm Chỉ Huy',
      items: [
        {
          to: '/admin/dashboard',
          label: 'Bảng Quản Trị',
          icon: <ShieldCheck size={18} />,
          badge: null,
          description: 'Chỉ số KPI, doanh thu & tăng trưởng hệ thống'
        },
        {
          to: '/admin/students',
          label: 'Quản Lý Học Viên',
          icon: <Users size={18} />,
          badge: 'VIP',
          badgeType: 'vip',
          description: 'Hồ sơ học viên 360°, chuỗi học & reset mật khẩu'
        },
        {
          to: '/admin/analytics',
          label: 'Phân Tích & Báo Cáo',
          icon: <BarChart3 size={18} />,
          badge: 'PRO',
          badgeType: 'pro',
          description: 'Biểu đồ chuyển đổi, Retention & Phân tích chuyên sâu'
        },
        {
          to: '/admin/notifications',
          label: 'Trung Tâm Thông Báo',
          icon: <Bell size={18} />,
          badge: 'LIVE',
          badgeType: 'live',
          description: 'Phát sóng tin tức toàn hệ thống & thông báo cá nhân'
        }
      ]
    },
    {
      title: 'Quản Trị Học Liệu',
      items: [
        {
          to: '/admin/tests',
          label: 'Kho Đề Thi TOEIC',
          icon: <BookOpen size={18} />,
          badge: null,
          description: 'Ngân hàng đề thi TOEIC, âm thanh & lời giải chi tiết'
        },
        {
          to: '/admin/communication',
          label: 'Giao Tiếp Thực Chiến',
          icon: <Sparkles size={18} />,
          badge: null,
          description: '12 chương, 72 bài hội thoại & audio luyện nói 1:1'
        },
        {
          to: '/admin/content',
          label: '3000 Từ & Phản Xạ 50',
          icon: <Layers size={18} />,
          badge: null,
          description: 'Thuật toán FSRS từ vựng Oxford 3000 & 1500 câu phản xạ'
        }
      ]
    },
    {
      title: 'Vận Hành & Cấu Hình',
      items: [
        {
          to: '/admin/activity-log',
          label: 'Nhật Ký Hoạt Động',
          icon: <ScrollText size={18} />,
          badge: null,
          description: 'Audit log, theo dõi bảo mật & lịch sử thao tác admin'
        },
        {
          to: '/admin/settings',
          label: 'Cài Đặt Hệ Thống',
          icon: <Settings size={18} />,
          badge: null,
          description: 'Thương hiệu, Logo, Favicon & Cấu hình máy chủ'
        }
      ]
    }
  ];

  // Flat list for Quick Search Palette
  const allNavItems = navGroups.flatMap((g) =>
    g.items.map((item) => ({ ...item, groupTitle: g.title }))
  );

  const filteredSearchResults = allNavItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.groupTitle.toLowerCase().includes(q)
    );
  });

  const getPageInfo = () => {
    const p = location.pathname;
    if (p.startsWith('/admin/dashboard')) return { title: 'Bảng Quản Trị Tổng Quan', group: 'Trung Tâm Chỉ Huy', icon: <ShieldCheck size={18} /> };
    if (p.startsWith('/admin/students')) return { title: 'Quản Trị Học Viên VIP 360°', group: 'Trung Tâm Chỉ Huy', icon: <Users size={18} /> };
    if (p.startsWith('/admin/analytics')) return { title: 'Phân Tích Chuyên Sâu & Báo Cáo', group: 'Trung Tâm Chỉ Huy', icon: <BarChart3 size={18} /> };
    if (p.startsWith('/admin/notifications')) return { title: 'Trung Tâm Phát Sóng Thông Báo', group: 'Trung Tâm Chỉ Huy', icon: <Bell size={18} /> };
    if (p.startsWith('/admin/tests')) return { title: 'Kho Đề Thi & Bài Tập TOEIC', group: 'Quản Trị Học Liệu', icon: <BookOpen size={18} /> };
    if (p.startsWith('/admin/communication') || p.startsWith('/admin/bino')) return { title: 'Giao Tiếp Thực Chiến CMS', group: 'Quản Trị Học Liệu', icon: <Sparkles size={18} /> };
    if (p.startsWith('/admin/content')) return { title: 'Quản Trị 3000 Từ & Phản Xạ 50', group: 'Quản Trị Học Liệu', icon: <Layers size={18} /> };
    if (p.startsWith('/admin/activity-log')) return { title: 'Nhật Ký Hoạt Động (Audit Log)', group: 'Vận Hành & Cấu Hình', icon: <ScrollText size={18} /> };
    if (p.startsWith('/admin/settings')) return { title: 'Cài Đặt & Nhận Diện Thương Hiệu', group: 'Vận Hành & Cấu Hình', icon: <Settings size={18} /> };
    return { title: `Bảng Quản Trị ${branding.brandName || 'Hệ Thống'}`, group: 'Admin Console', icon: <ShieldCheck size={18} /> };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-slate-50/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200 subpixel-antialiased selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      
      {/* Ambient background lighting mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-60 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* ===== DESKTOP LUXURY SIDEBAR ===== */}
      <aside
        className={`hidden md:flex flex-col sticky top-0 h-screen z-30 transition-[width] duration-200 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800/90 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          isSidebarCollapsed ? 'w-20 p-3' : 'w-72 p-4 sm:p-5'
        }`}
      >
        {/* Top Brand & Collapse Trigger */}
        <div className={`flex items-center mb-5 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 min-w-0 ${
          isSidebarCollapsed ? 'justify-center' : 'justify-between gap-2'
        }`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BrandLogo size="sm" showTagline={false} />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 border border-[#0071e3]/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                ADMIN PRO
              </span>
            </div>
          ) : (
            <div className="relative group cursor-pointer" onClick={handleToggleSidebar} title="Nhấn để mở rộng sidebar">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                {branding.brandName?.charAt(0) || 'V'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
          )}

          {!isSidebarCollapsed && (
            <button
              onClick={handleToggleSidebar}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-1"
              title="Thu gọn menu (Ctrl + [)"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {/* Collapsed Mode Expand Button */}
        {isSidebarCollapsed && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleToggleSidebar}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mở rộng menu (Ctrl + [)"
            >
              <PanelLeft size={18} />
            </button>
          </div>
        )}

        {/* Quick Search Trigger Pill in Sidebar (Only when expanded) */}
        {!isSidebarCollapsed && (
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 mb-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400 group-hover:text-[#0071e3] transition-colors" />
              <span className="font-medium text-slate-500 dark:text-slate-400">Tìm tính năng...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Nav Links Container */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-5 pr-1 hide-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 select-none">
                  {group.title}
                </p>
              )}
              {isSidebarCollapsed && (
                <div className="w-8 mx-auto border-t border-slate-200/80 dark:border-slate-800/80 my-2" />
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `relative group flex items-center rounded-xl transition-all duration-200 select-none ${
                        isSidebarCollapsed
                          ? 'justify-center w-11 h-11 mx-auto'
                          : 'justify-between px-3 py-2.5 text-xs font-bold'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0071e3] to-blue-600 text-white shadow-[0_4px_16px_rgba(0,113,227,0.28)]'
                          : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                          <span
                            className={`shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                              isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'
                            }`}
                          >
                            {item.icon}
                          </span>
                          {!isSidebarCollapsed && (
                            <span className="truncate tracking-tight font-bold text-xs">{item.label}</span>
                          )}
                        </div>

                        {/* Badges */}
                        {!isSidebarCollapsed && item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 transition-colors ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeType === 'live'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : item.badgeType === 'vip'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed dot indicator */}
                        {isSidebarCollapsed && item.badge && (
                          <span
                            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                              item.badgeType === 'live' ? 'bg-rose-500 animate-pulse' : 'bg-[#0071e3]'
                            }`}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Switch to Student Home */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400/90 dark:text-slate-500 mb-1.5">
                Cổng Học Viên
              </p>
            )}
            <button
              onClick={() => navigate('/home')}
              title="Vào Trang Học Viên"
              className={`w-full flex items-center rounded-xl transition-all duration-200 font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'
              }`}
            >
              <ArrowLeft size={17} className="text-emerald-500 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Vào Trang Học Viên</span>}
            </button>
          </div>
        </nav>

        {/* User Card & Logout Footer */}
        <div className="pt-3 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0071e3] to-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                    {user?.fullName?.charAt(0) || 'A'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                    {user?.fullName || 'Quản trị viên'}
                  </p>
                  <span className="text-[10px] text-[#0071e3] dark:text-sky-400 font-extrabold block uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Đăng xuất khỏi phiên quản trị"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-indigo-600 text-white font-bold flex items-center justify-center text-xs cursor-pointer shadow-xs"
                onClick={() => setProfileDropdownOpen(true)}
                title={user?.fullName || 'Admin'}
              >
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full min-h-screen overflow-x-clip z-10">
        
        {/* ===== TOP LUXURY HEADER ===== */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3 min-w-0 transition-colors">
          
          {/* Left: Mobile hamburger + Breadcrumbs + Live Indicator */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              title="Mở menu quản trị"
            >
              <Menu size={18} />
            </button>

            {/* Mobile Brand */}
            <div className="md:hidden flex items-center gap-2 min-w-0">
              <BrandLogo size="sm" showTagline={false} />
            </div>

            {/* Desktop Breadcrumb Hierarchy */}
            <div className="hidden md:flex items-center gap-2 text-xs min-w-0">
              <span className="font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                {pageInfo.group}
              </span>
              <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 dark:text-slate-400 shrink-0">{pageInfo.icon}</span>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
                  {pageInfo.title}
                </h1>
              </div>
            </div>

            {/* System Live Pill */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hệ Thống Trực Tuyến
            </span>
          </div>

          {/* Right Controls: Command Palette + Notifications + Theme + Portal Switch + Admin Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Quick Search Shortcut Pill */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs group"
            >
              <Search size={14} className="group-hover:text-[#0071e3] transition-colors" />
              <span className="font-semibold">Tìm kiếm lệnh...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[10px] font-mono border border-slate-200 dark:border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
              title="Tìm kiếm lệnh (⌘K)"
            >
              <Search size={16} />
            </button>

            {/* Realtime Notification Center */}
            <NotificationBell isAdminHeader />

            {/* Dark / Light Mode Spring Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title={mode === 'light' ? 'Chuyển sang Chế độ Tối' : 'Chuyển sang Chế độ Sáng'}
            >
              {mode === 'light' ? (
                <Moon size={16} className="text-slate-600 hover:text-[#0071e3] transition-colors" />
              ) : (
                <Sun size={16} className="text-amber-400 hover:text-amber-300 transition-colors" />
              )}
            </button>

            {/* Switch to Student Portal */}
            <button
              onClick={() => navigate('/home')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/25 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Mở giao diện cổng học viên"
            >
              <ArrowLeft size={14} className="shrink-0" />
              <span>Giao Diện Học Viên</span>
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0071e3] to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Luxury Profile Popover */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 overflow-hidden"
                  >
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1.5 border border-slate-100 dark:border-slate-800">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {user?.fullName || 'Quản trị viên'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user?.phoneNumber || user?.email || 'admin@vbace.vn'}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 border border-[#0071e3]/20">
                        Super Administrator
                      </span>
                    </div>

                    <div className="space-y-0.5 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Settings size={15} className="text-slate-400" />
                        <span>Cài đặt hệ thống</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/admin/activity-log');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <ScrollText size={15} className="text-slate-400" />
                        <span>Nhật ký hoạt động</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/home');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left cursor-pointer"
                      >
                        <ExternalLink size={15} className="text-emerald-500" />
                        <span>Chuyển sang Cổng học viên</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} className="text-rose-500" />
                        <span>Đăng xuất quản trị</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ===== PAGE CONTENT OUTLET ===== */}
        <main className="flex-1 min-w-0 max-w-7xl mx-auto w-full p-3 sm:p-5 md:p-8 overflow-x-clip">
          <Outlet />
        </main>
      </div>

      {/* ===== COMMAND PALETTE MODAL (Ctrl/Cmd + K) ===== */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Search Input Bar */}
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <Search size={18} className="text-[#0071e3] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Gõ tên module quản trị hoặc hành động cần mở..."
                  className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ESC
                </button>
              </div>

              {/* Search Results List */}
              <div className="overflow-y-auto p-2 sm:p-3 space-y-1">
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((item) => (
                    <div
                      key={item.to}
                      onClick={() => {
                        setSearchModalOpen(false);
                        navigate(item.to);
                      }}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-[#0071e3] text-slate-500 dark:text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors truncate">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.description || item.groupTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                          {item.groupTitle}
                        </span>
                        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">Không tìm thấy tính năng khớp với &quot;{searchQuery}&quot;</p>
                    <p className="text-xs mt-1">Hãy thử tìm &quot;Học viên&quot;, &quot;TOEIC&quot;, &quot;Giao tiếp&quot; hoặc &quot;Báo cáo&quot;.</p>
                  </div>
                )}
              </div>

              {/* Footer Tip */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Command size={12} />
                  <span>Dùng phím tắt <strong>⌘K</strong> để mở hộp thoại này bất cứ lúc nào</span>
                </span>
                <span>{branding.brandName} Control Center</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== MOBILE LUXURY DRAWER ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Slide-out Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto"
            >
              <div>
                {/* Header of Drawer */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <BrandLogo size="sm" />
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400">
                      ADMIN
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Nav Links */}
                <nav className="space-y-4">
                  {navGroups.map((group) => (
                    <div key={group.title}>
                      <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
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
                                  ? 'bg-gradient-to-r from-[#0071e3] to-blue-600 text-white shadow-md shadow-blue-500/25'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                              }`
                            }
                          >
                            <div className="flex items-center gap-3">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 text-white">
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
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                    >
                      <ArrowLeft size={16} className="text-emerald-500" />
                      <span>Vào Giao Diện Học Viên</span>
                    </button>
                  </div>
                </nav>
              </div>

              {/* Mobile Drawer Footer User Card */}
              <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0071e3] to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {user?.fullName?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                        {user?.fullName || 'Quản trị viên'}
                      </p>
                      <span className="text-[10px] text-[#0071e3] dark:text-sky-400 font-extrabold uppercase">
                        Super Admin
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 text-center">
                  {branding.brandName} Control Center
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
