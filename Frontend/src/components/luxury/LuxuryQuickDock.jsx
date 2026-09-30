import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageCircle,
  Zap,
  Shield,
  Layers,
  Headphones,
  Award,
  ChevronUp,
  ChevronDown,
  X,
  Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * LuxuryQuickDock - Apple VisionOS & iOS 18 Control Center Adaptive Dock.
 * - Desktop (>= 768px): macOS / VisionOS floating glass dock with spring magnification.
 * - Mobile (< 768px): Positioned cleanly above the mobile bottom tab bar (bottom-[74px]),
 *   featuring a smart auto-compacting Dynamic Pill that expands into an iOS 18 Control Center Grid.
 */
export default function LuxuryQuickDock({
  onOpenPlaylist,
  isPlaylistPlaying = false
}) {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isDesktopMinimized, setIsDesktopMinimized] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // Passive scroll listener to compact mobile floating trigger when scrolling down (0 lag)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 18) {
        setIsScrolledDown(currentScrollY > lastScrollY && currentScrollY > 160);
        lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dockItems = [
    {
      id: 'comm',
      label: 'Giao Tiếp',
      sublabel: '72 Bài Bino',
      icon: MessageCircle,
      color: '#0071E3',
      bgLight: 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0071e3]/20 dark:text-sky-400',
      action: () => navigate('/communication')
    },
    {
      id: 'reflex',
      label: 'Phản Xạ 50',
      sublabel: '1500 Câu 3s',
      icon: Zap,
      color: '#0284C7',
      bgLight: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
      action: () => navigate('/reflex-50')
    },
    {
      id: 'radar',
      label: 'Radar Năng Lực',
      sublabel: 'Chỉ số F1',
      icon: Award,
      color: '#2563EB',
      bgLight: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      action: () => {
        const el = document.getElementById('radar-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          navigate('/progress');
        }
      }
    },
    {
      id: 'shield',
      label: 'Lá Chắn FSRS',
      sublabel: 'Trí nhớ dài hạn',
      icon: Shield,
      color: '#10B981',
      bgLight: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      action: () => {
        const el = document.getElementById('shield-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          navigate('/vocab');
        }
      }
    },
    {
      id: 'vocab',
      label: '3000 Từ Vựng',
      sublabel: 'Oxford 60 Chủ đề',
      icon: Layers,
      color: '#6366F1',
      bgLight: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
      action: () => navigate('/vocab')
    },
    {
      id: 'audio',
      label: 'Nghe Thụ Động',
      sublabel: 'Playlist 24/7',
      icon: Headphones,
      color: '#0071E3',
      bgLight: 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300',
      action: onOpenPlaylist
    }
  ];

  const handleMobileItemClick = (item) => {
    setIsMobileSheetOpen(false);
    if (item.action) item.action();
  };

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. MOBILE ADAPTIVE DYNAMIC ISLAND & CONTROL SHEET (< 768px)           */}
      {/* Sits at bottom-[74px] to never overlap the Mobile Bottom Tab Bar      */}
      {/* ===================================================================== */}
      <div className="md:hidden">
        {/* Backdrop when Mobile Control Center Sheet is Open */}
        <AnimatePresence>
          {isMobileSheetOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileSheetOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-xs"
            />
          )}
        </AnimatePresence>

        {/* Expandable iOS 18 Control Center Sheet */}
        <AnimatePresence>
          {isMobileSheetOpen && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="fixed bottom-[76px] inset-x-3 z-50 p-4 rounded-[28px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
            >
              {/* Top Specular Rim */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/40 to-transparent" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 dark:bg-[#0071e3]/20 text-[#0071e3] dark:text-sky-400 flex items-center justify-center">
                    <Command size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                      Phím Tắt Nhanh Apple Dock
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Chạm để di chuyển tức thì
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSheetOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center active:scale-90 transition-transform"
                  aria-label="Đóng bảng phím tắt"
                >
                  <X size={15} />
                </button>
              </div>

              {/* 2x3 Tactile Control Center Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {dockItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMobileItemClick(item)}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-white/[0.06] text-left transition-colors relative overflow-hidden"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bgLight}`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                          {item.sublabel}
                        </p>
                      </div>
                      {item.id === 'audio' && isPlaylistPlaying && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Pill on Mobile (Automatically shifts above floating player if active) */}
        {!isMobileSheetOpen && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            onClick={() => setIsMobileSheetOpen(true)}
            className={`fixed ${
              isPlaylistPlaying ? 'bottom-[215px]' : 'bottom-[74px]'
            } right-3.5 z-30 h-9 px-3 rounded-full bg-[#0071e3] text-white shadow-[0_8px_25px_rgba(0,113,227,0.38)] border border-white/25 flex items-center gap-1.5 transition-all`}
            aria-label="Mở phím tắt nhanh"
          >
            <Sparkles size={13} className="shrink-0" />
            <AnimatePresence initial={false}>
              {!isScrolledDown && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] font-bold whitespace-nowrap overflow-hidden"
                >
                  Tiện ích nhanh
                </motion.span>
              )}
            </AnimatePresence>
            {isPlaylistPlaying && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping ml-0.5" />
            )}
          </motion.button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. DESKTOP MACOS SEQUOIA / VISIONOS FLOATING DOCK (>= 768px)          */}
      {/* ===================================================================== */}
      <div className="hidden md:flex fixed bottom-6 inset-x-0 z-40 flex-col items-center pointer-events-none px-4">
        <AnimatePresence mode="wait">
          {!isDesktopMinimized ? (
            <motion.div
              key="expanded-dock"
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="pointer-events-auto relative p-2 rounded-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_16px_45px_rgba(0,113,227,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex items-center gap-1.5 select-none"
            >
              {/* Subtle top specular reflection */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/35 to-transparent" />

              {dockItems.map((item, idx) => {
                const Icon = item.icon;
                const isHovered = hoveredIdx === idx;

                return (
                  <div key={item.id} className="relative flex flex-col items-center">
                    {/* Tooltip Popup */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: -50, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                          className="pointer-events-none absolute whitespace-nowrap px-3.5 py-1.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-[11px] font-bold shadow-xl border border-white/10 dark:border-slate-800 flex flex-col items-center z-50"
                        >
                          <span>{item.label}</span>
                          <span className="text-[9px] font-medium opacity-75">{item.sublabel}</span>
                          <div className="w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-white/95 absolute -bottom-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Icon Button with Spring Magnification */}
                    <motion.button
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={item.action}
                      whileHover={{ scale: 1.2, y: -4 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                      className="relative w-11 h-11 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-white transition-colors cursor-pointer group"
                      style={{
                        backgroundColor: isHovered ? item.color : undefined
                      }}
                    >
                      <Icon
                        size={19}
                        className={isHovered ? 'text-white' : ''}
                        style={{ color: !isHovered ? item.color : undefined }}
                      />

                      {/* Indicator Dot for Active Playlist */}
                      {item.id === 'audio' && isPlaylistPlaying && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </motion.button>
                  </div>
                );
              })}

              {/* Hairline Divider */}
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* Minimize Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDesktopMinimized(true)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-[#0071e3] dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Thu nhỏ thanh dock"
              >
                <ChevronDown size={15} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="minimized-dock"
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              onClick={() => setIsDesktopMinimized(false)}
              className="pointer-events-auto px-4 py-2 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_8px_25px_rgba(0,113,227,0.15)] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0071e3] dark:hover:text-sky-400 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles size={13} className="text-[#0071e3] dark:text-sky-400" />
              <span>Mở Dock Phím Tắt</span>
              <ChevronUp size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
