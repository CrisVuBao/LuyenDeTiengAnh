import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, ChevronRight, Sparkles, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useGamificationStore from '../store/useGamificationStore';

export default function XPBar() {
  const { profile, fetchProfile } = useGamificationStore();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (!profile) return null;

  const currentLevel = profile.currentLevel ?? profile.level ?? 1;
  const levelTitle = profile.levelTitle || 'Tân binh';
  const totalXP = profile.totalXP ?? profile.currentXP ?? 0;
  const nextLevelXP = profile.xpForNextLevel ?? profile.nextLevelXP ?? 100;
  const currentStreak = profile.currentStreak ?? profile.streakDays ?? 0;
  const progressPercent = profile.xpProgressPercentage !== undefined 
    ? Math.min(100, Math.max(0, profile.xpProgressPercentage))
    : Math.min(100, Math.max(0, (totalXP / nextLevelXP) * 100));

  return (
    <div className="relative">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-all rounded-full py-1 pl-2.5 pr-3 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer active:scale-95"
        title="Bấm để xem tiến trình Level & Thành tích"
      >
        <div className="flex items-center gap-1.5 font-bold text-[#0071e3] dark:text-sky-400">
          <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 dark:bg-sky-400/20 flex items-center justify-center">
            <Trophy size={12} className="text-[#0071e3] dark:text-sky-400" />
          </div>
          <span className="text-xs tracking-tight font-extrabold">Lv.{currentLevel}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="hidden sm:block w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        
        <div className="hidden md:flex items-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          <span>{totalXP}</span>
          <span>/</span>
          <span>{nextLevelXP}</span>
          <span className="text-[10px] text-slate-400">XP</span>
        </div>
        
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-500 font-bold pl-1 border-l border-slate-200 dark:border-slate-700">
            <Flame size={13} className="fill-orange-500 text-orange-500" />
            <span className="text-xs">{currentStreak}</span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setExpanded(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-5 z-50 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0071e3]/10 dark:bg-sky-400/20 text-[#0071e3] dark:text-sky-400 flex items-center justify-center font-black">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Cấp {currentLevel} • {levelTitle}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tích lũy XP để thăng hạng
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-[#0071e3] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>{totalXP} XP hiện tại</span>
                  <span>{nextLevelXP} XP mốc kế</span>
                </div>
              </div>
              
              {/* Streak info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Flame size={16} className="text-orange-500 fill-orange-500" />
                  <span className="font-medium">Chuỗi học tập</span>
                </div>
                <span className="font-bold text-orange-500">{currentStreak} ngày liên tiếp</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setExpanded(false);
                  navigate('/leaderboard');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Award size={14} />
                <span>Xem Bảng Xếp Hạng & Huy Hiệu</span>
                <ChevronRight size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
