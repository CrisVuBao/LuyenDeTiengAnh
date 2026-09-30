import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * LuxuryQuickDock - Inspired by macOS Dynamic Dock & Uniqlo precision minimalism.
 * Frosted glass capsule floating at the bottom with magnetic spring magnification.
 */
export default function LuxuryQuickDock({
  onOpenPlaylist,
  isPlaylistPlaying = false
}) {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isDockMinimized, setIsDockMinimized] = useState(false);

  const dockItems = [
    {
      id: 'comm',
      label: 'Giao Tiếp',
      sublabel: '72 Bài Bino',
      icon: MessageCircle,
      color: '#0071E3',
      action: () => navigate('/communication')
    },
    {
      id: 'reflex',
      label: 'Phản Xạ 50',
      sublabel: '1500 Câu',
      icon: Zap,
      color: '#0284C7',
      action: () => navigate('/reflex-50')
    },
    {
      id: 'radar',
      label: 'Radar Năng Lực',
      sublabel: 'F1 Index',
      icon: Award,
      color: '#3B82F6',
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
      label: 'Lá Chắn Trí Nhớ',
      sublabel: 'FSRS Shield',
      icon: Shield,
      color: '#10B981',
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
      sublabel: 'Oxford FSRS',
      icon: Layers,
      color: '#8B5CF6',
      action: () => navigate('/vocab')
    },
    {
      id: 'audio',
      label: 'Nghe Thụ Động',
      sublabel: 'Playlist 24/7',
      icon: Headphones,
      color: '#EC4899',
      action: onOpenPlaylist
    }
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex flex-col items-center pointer-events-none px-3">
      {/* Dock Capsule */}
      <AnimatePresence>
        {!isDockMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative p-1.5 sm:p-2 rounded-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center gap-1 sm:gap-2 select-none"
          >
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
                        animate={{ opacity: 1, y: -48, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-none absolute whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-[11px] font-bold shadow-xl border border-white/10 dark:border-slate-800 flex flex-col items-center z-50"
                      >
                        <span>{item.label}</span>
                        <span className="text-[9px] font-medium opacity-70">{item.sublabel}</span>
                        <div className="w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-white/95 absolute -bottom-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Icon Button with Spring Magnification */}
                  <motion.button
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={item.action}
                    whileHover={{ scale: 1.18, y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-white transition-colors cursor-pointer group"
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

            {/* Minimize Toggle */}
            <button
              onClick={() => setIsDockMinimized(true)}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
              title="Thu nhỏ thanh dock"
            >
              <ChevronDown size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-expand button when minimized */}
      {isDockMinimized && (
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsDockMinimized(false)}
          className="pointer-events-auto px-4 py-2 rounded-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles size={13} className="text-amber-500" />
          <span>Mở Dock Phím Tắt</span>
          <ChevronUp size={13} />
        </motion.button>
      )}
    </div>
  );
}
