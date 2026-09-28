import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, ChevronRight, Award } from 'lucide-react';
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
    <div className="relative shrink-0">
      {/* Compact, Apple-style Status Pill: Zero overflow, zero clutter in navbar */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-all rounded-full py-1 px-2.5 sm:px-3 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer active:scale-95 shrink-0 select-none"
        title="Xem chi tiết Cấp độ, Điểm XP & Chuỗi học"
      >
        <div className="flex items-center gap-1 font-bold text-[#0071e3] dark:text-sky-400">
          <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 dark:bg-sky-400/20 flex items-center justify-center shrink-0">
            <Trophy size={11} className="text-[#0071e3] dark:text-sky-400" />
          </div>
          <span className="text-xs tracking-tight font-extrabold">Lv.{currentLevel}</span>
        </div>

        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-500 font-bold pl-1.5 border-l border-slate-200 dark:border-slate-700 shrink-0">
            <Flame size={12} className="fill-orange-500 text-orange-500" />
            <span className="text-xs">{currentStreak}</span>
          </div>
        )}
      </button>

      {/* Flyout Card: Rich details when user taps on the XP badge */}
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
              className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-5 z-50 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
                    <Trophy size={19} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Cấp {currentLevel} • {levelTitle}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tích lũy XP để thăng hạng
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-[#0071e3] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/50">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>{totalXP} XP hiện tại</span>
                  <span>Mốc kế: {nextLevelXP} XP</span>
                </div>
              </div>
              
              {/* Streak info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Flame size={16} className="text-orange-500 fill-orange-500" />
                  <span className="font-semibold">Chuỗi học tập</span>
                </div>
                <span className="font-extrabold text-orange-500">{currentStreak} ngày liên tiếp 🔥</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setExpanded(false);
                  navigate('/leaderboard');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Award size={15} />
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
