import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, ChevronRight, Award, Shield, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useGamificationStore from '../store/useGamificationStore';

export default function XPBar() {
  const { profile, fetchProfile } = useGamificationStore();
  // 'streak' | 'level' | null - Tách biệt rõ ràng 2 popup khác nhau
  const [activePopup, setActivePopup] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Đóng popup khi chuyển trang
  useEffect(() => {
    setActivePopup(null);
  }, [location.pathname]);

  // Đóng popup khi bấm ra ngoài hoặc nhấn phím Escape
  useEffect(() => {
    if (!activePopup) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActivePopup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePopup]);

  // Tính toán dữ liệu 7 ngày trong tuần hiện tại cho Streak tracker (Thứ 2 -> Chủ Nhật)
  const weekDays = useMemo(() => {
    const today = new Date();
    // Monday as 0 (Vietnam / ISO standard: Mon=0, Sun=6)
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const activeDatesSet = new Set(profile?.activeDates || []);

    return labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const isToday = idx === dayOfWeek;
      const isPast = idx < dayOfWeek;
      const isFuture = idx > dayOfWeek;

      let isActive = activeDatesSet.has(key);
      if (isToday) {
        isActive = Boolean(profile?.hasStudiedToday);
      }

      return {
        label,
        key,
        dateNum: d.getDate(),
        isToday,
        isPast,
        isFuture,
        isActive
      };
    });
  }, [profile?.activeDates, profile?.hasStudiedToday]);

  if (!profile) return null;

  const currentLevel = profile.currentLevel ?? profile.level ?? 1;
  const levelTitle = profile.levelTitle || 'Tân binh';
  const totalXP = profile.totalXP ?? profile.currentXP ?? 0;
  const getThreshold = (lv) => 100 * lv + 25 * lv * (lv - 1);
  const prevLevelXP = currentLevel > 1 ? getThreshold(currentLevel - 1) : 0;
  const nextLevelXP = profile.xpForNextLevel ?? profile.nextLevelXP ?? getThreshold(currentLevel);
  const levelSpanXP = Math.max(1, nextLevelXP - prevLevelXP);
  const earnedInLevelXP = Math.max(0, totalXP - prevLevelXP);
  const remainingToNextXP = Math.max(0, nextLevelXP - totalXP);
  const currentStreak = profile.currentStreak ?? profile.streakDays ?? 0;
  const longestStreak = profile.longestStreak ?? currentStreak;
  const freezeCount = profile.streakFreezeCount ?? 0;
  const hasStudiedToday = Boolean(profile.hasStudiedToday);
  const progressPercent = profile.xpProgressPercentage !== undefined 
    ? Math.min(100, Math.max(0, profile.xpProgressPercentage))
    : Math.min(100, Math.max(0, (earnedInLevelXP / levelSpanXP) * 100));

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Duolingo-style Chunky 3D Status Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 select-none">
        
        {/* Nút Chuỗi Học Tập (Streak Pill) */}
        <button
          type="button"
          onClick={() => setActivePopup((prev) => (prev === 'streak' ? null : 'streak'))}
          className={`duo-pill duo-pill-streak cursor-pointer transition-transform ${
            activePopup === 'streak' ? 'ring-2 ring-orange-400' : ''
          } ${currentStreak > 0 ? 'hover:scale-105 active:scale-95' : 'opacity-85'}`}
          title={
            currentStreak > 0
              ? (hasStudiedToday 
                  ? `Đã thắp lửa hôm nay! Chuỗi ${currentStreak} ngày an toàn 🔥` 
                  : `Chuỗi ${currentStreak} ngày • Bạn chưa học hôm nay! Cần vào học bài để giữ chuỗi ⚠️`)
              : 'Chưa có chuỗi học tập. Học 1 bài để bắt đầu chuỗi!'
          }
        >
          <Flame 
            size={15} 
            className={`shrink-0 ${
              currentStreak > 0 
                ? (hasStudiedToday ? 'fill-orange-500 text-orange-500' : 'text-amber-500 fill-amber-500/50') 
                : 'text-slate-400'
            }`} 
          />
          <span className="font-black text-xs">{currentStreak}</span>
          {currentStreak > 0 && !hasStudiedToday && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="Chưa học hôm nay!" />
          )}
        </button>

        {/* Nút Cấp Độ & XP (Level Pill) - Icon Cup đứng yên hoàn toàn theo yêu cầu */}
        <button
          type="button"
          onClick={() => setActivePopup((prev) => (prev === 'level' ? null : 'level'))}
          className={`duo-pill duo-pill-xp cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
            activePopup === 'level' ? 'ring-2 ring-amber-400' : ''
          }`}
          title="Xem chi tiết Cấp độ & Điểm XP"
        >
          {/* Icon cup đứng yên, không lên xuống */}
          <Trophy size={14} className="text-amber-500 fill-amber-400 shrink-0" />
          <span className="font-black text-xs">Lv.{currentLevel}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* POPUP 1: CHI TIẾT CHUỖI HỌC TẬP (STREAK POPOVER)          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activePopup === 'streak' && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-84 max-w-sm duo-card p-5 z-50 space-y-4 shadow-2xl"
          >
            {/* Header: Ngọn lửa 3D Duolingo & Tình trạng chuỗi */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 border-2 border-orange-400 border-b-4 border-b-orange-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                  <Flame size={26} className="fill-white drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                    Chuỗi {currentStreak} ngày
                  </h3>
                  <p className="text-xs font-bold mt-0.5">
                    {hasStudiedToday ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Đã thắp lửa hôm nay 🔥</span>
                    ) : currentStreak > 0 ? (
                      <span className="text-rose-500 dark:text-rose-400">Chưa học hôm nay ⚠️</span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Chưa bắt đầu chuỗi ❄️</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {hasStudiedToday ? (
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
                  An toàn
                </span>
              ) : currentStreak > 0 ? (
                <span className="text-[11px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-300 dark:border-rose-700 animate-pulse">
                  Cần học
                </span>
              ) : (
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700">
                  0 ngày
                </span>
              )}
            </div>

            {/* Mini 7-Day Week Strip (T2 -> CN) phong cách Duolingo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-300 px-0.5">
                <span>Tuần này</span>
                <span className="text-[11px] font-bold text-slate-400">
                  {hasStudiedToday ? 'Đã hoàn thành hôm nay' : 'Cần 1 bài học để giữ chuỗi'}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                {weekDays.map((day) => {
                  return (
                    <div key={day.key} className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-black uppercase ${
                        day.isToday ? 'text-orange-500 font-extrabold' : 'text-slate-400'
                      }`}>
                        {day.label}
                      </span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        day.isToday
                          ? day.isActive
                            ? 'bg-orange-500 text-white shadow-xs border-b-2 border-orange-600'
                            : 'bg-white dark:bg-slate-700 border-2 border-dashed border-orange-400 text-orange-500 animate-pulse'
                          : day.isActive
                            ? 'bg-amber-400 dark:bg-amber-500 text-white shadow-xs'
                            : day.isPast
                              ? 'bg-slate-200/80 dark:bg-slate-700/60 text-slate-400'
                              : 'bg-slate-200/40 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600'
                      }`}>
                        {day.isActive ? (
                          <Flame size={15} className="fill-current" />
                        ) : day.isToday ? (
                          <Flame size={14} className="text-orange-400" />
                        ) : (
                          <span className="text-xs font-bold leading-none">{day.isPast ? '•' : '·'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats: Kỷ lục & Lá chắn đóng băng */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 min-w-0">
                <Trophy size={16} className="text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block truncate">Kỷ lục chuỗi</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{longestStreak} ngày</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 flex items-center gap-2 min-w-0">
                <Shield size={16} className="text-sky-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block truncate">Đóng băng chuỗi</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{freezeCount} lá chắn</span>
                </div>
              </div>
            </div>

            {/* Call to Action Button */}
            {!hasStudiedToday ? (
              <button
                type="button"
                onClick={() => {
                  setActivePopup(null);
                  navigate('/home');
                }}
                className="duo-btn duo-btn-orange w-full duo-btn-md font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame size={16} className="fill-white" />
                <span>HỌC NGAY ĐỂ GIỮ CHUỖI</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActivePopup(null);
                  navigate('/leaderboard');
                }}
                className="duo-btn duo-btn-white w-full duo-btn-md font-black text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <Flame size={16} className="text-orange-500 fill-orange-500" />
                <span>XEM LỊCH SỬ CHUỖI & NHIỆM VỤ</span>
                <ChevronRight size={15} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* POPUP 2: CHI TIẾT CẤP ĐỘ & ĐIỂM XP (LEVEL & XP POPOVER)  */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activePopup === 'level' && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-84 max-w-sm duo-card p-5 z-50 space-y-4 shadow-2xl"
          >
            {/* Header: Cartoon Trophy Badge (Icon Cup đứng yên, không nhảy) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-amber-300 border-b-4 border-b-amber-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                  {/* Icon cup đứng yên trang trọng */}
                  <Trophy size={24} className="fill-white drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                    Cấp {currentLevel} • {levelTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    Còn <strong className="text-[#58cc02]">{remainingToNextXP} XP</strong> để lên Cấp {currentLevel + 1}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                {Math.round(progressPercent)}%
              </span>
            </div>
            
            {/* Duolingo Chunky Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/80 dark:border-slate-700">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#58cc02] to-[#89e219] rounded-full shadow-inner relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Glossy top shine */}
                  <div className="absolute inset-x-1 top-0.5 h-1 bg-white/40 rounded-full" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-extrabold">
                <span>Cấp này: {earnedInLevelXP}/{levelSpanXP} XP</span>
                <span>Tổng tích lũy: {totalXP} XP</span>
              </div>
            </div>
            
            {/* Thẻ mục tiêu cấp độ tiếp theo */}
            <div className="rounded-2xl p-3 flex items-center justify-between text-xs border-2 border-emerald-200 dark:border-emerald-900/60 border-b-4 border-b-emerald-300 dark:border-b-emerald-950 bg-emerald-50/70 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#58cc02] text-white flex items-center justify-center font-black shrink-0">
                  <Sparkles size={16} className="fill-white" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold block text-xs truncate">Mục tiêu tiếp theo</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate block">
                    Đạt Cấp {currentLevel + 1} tại mốc {nextLevelXP} XP
                  </span>
                </div>
              </div>
              <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
                +{remainingToNextXP} XP
              </span>
            </div>

            {/* Duolingo 3D Chunky Action Button */}
            <button
              type="button"
              onClick={() => {
                setActivePopup(null);
                navigate('/leaderboard');
              }}
              className="duo-btn duo-btn-green w-full duo-btn-md font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award size={16} className="shrink-0" />
              <span>BẢNG XẾP HẠNG & HUY HIỆU</span>
              <ChevronRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
