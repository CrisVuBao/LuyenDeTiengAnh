import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield, Trophy, Calendar, Sparkles, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import useGamificationStore from '../store/useGamificationStore';
import useReflex50Store from '../../reflex50/store/useReflex50Store';

const STREAK_MILESTONES = [
  { days: 3, title: 'Tia lửa đầu tiên', icon: '🔥', reward: '+50 XP' },
  { days: 7, title: 'Chiến binh 1 tuần', icon: '⚔️', reward: '+150 XP' },
  { days: 14, title: 'Kiên định 2 tuần', icon: '🛡️', reward: '+300 XP' },
  { days: 30, title: 'Bất bại 1 tháng', icon: '👑', reward: '+600 XP' },
  { days: 60, title: 'Kim cương 2 tháng', icon: '💎', reward: '+1200 XP' },
  { days: 100, title: 'Huyền thoại 100 ngày', icon: '🏆', reward: '+2500 XP' }
];

export default function StreakCalendar() {
  const profile = useGamificationStore((s) => s.profile);
  const reflexDailyLog = useReflex50Store((s) => s.dailyLog) || {};

  const currentStreak = profile?.currentStreak ?? profile?.streakDays ?? 0;
  const longestStreak = profile?.longestStreak ?? currentStreak;
  const freezeCount = profile?.streakFreezeCount ?? 0;
  const hasStudiedToday = Boolean(profile?.hasStudiedToday);
  const streakStatus = profile?.streakStatus || (currentStreak > 0 ? (hasStudiedToday ? 'active' : 'at_risk') : 'broken');
  const activeDates = profile?.activeDates || [];

  // Generate last 70 days (10 weeks) for GitHub-style heatmap with real learning dates
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const activeDatesSet = new Set(activeDates);
    
    // Include reflex daily logs
    Object.keys(reflexDailyLog).forEach((dateKey) => {
      if (reflexDailyLog[dateKey] > 0) activeDatesSet.add(dateKey);
    });

    for (let i = 69; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      const reflexCount = reflexDailyLog[key] || 0;
      const isDbActive = activeDatesSet.has(key);
      const isToday = i === 0;
      const isActive = isDbActive || reflexCount > 0 || (isToday && hasStudiedToday);

      let intensity = 0;
      if (isActive) {
        if (reflexCount >= 20) intensity = 3;
        else if (reflexCount >= 10) intensity = 2;
        else intensity = isDbActive ? 2 : 1;
      }

      days.push({
        date: key,
        displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
        isActive,
        intensity,
        isToday
      });
    }
    return days;
  }, [activeDates, reflexDailyLog, hasStudiedToday]);

  return (
    <div className="space-y-6">

      {/* Streak Status Notification Banner */}
      {streakStatus === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Đã thắp lửa hôm nay! Chuỗi {currentStreak} ngày an toàn
            </h4>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90">
              Tuyệt vời! Bạn đã hoàn thành bài học hôm nay. Hãy duy trì thói quen học tập này vào ngày mai nhé!
            </p>
          </div>
        </motion.div>
      )}

      {streakStatus === 'at_risk' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-700/80 flex items-center gap-3 text-amber-900 dark:text-amber-200"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Chuỗi {currentStreak} ngày đang gặp nguy hiểm!
            </h4>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
              Hôm nay bạn chưa học bài nào. Hãy học ít nhất 1 bài (Giao tiếp, Phản xạ hoặc Từ vựng) trước 23:59 hôm nay để không bị mất chuỗi!
            </p>
          </div>
        </motion.div>
      )}

      {streakStatus === 'broken' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-slate-100 via-sky-50 to-slate-100 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-slate-800 dark:text-slate-300"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Flame size={22} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Chưa có chuỗi ngày học liên tục
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chuỗi sẽ bị tắt nếu bạn bỏ lỡ ngày hôm qua. Đừng lo lắng, hãy học ngay 1 bài học hôm nay để bắt đầu chuỗi ngày học tập mới!
            </p>
          </div>
        </motion.div>
      )}
      
      {/* 3 Metric Cards (Duolingo 3D Chunky Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Current Streak */}
        <div className="p-5 rounded-3xl duo-card-orange flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#ff9600] uppercase tracking-wider">
              Chuỗi hiện tại
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-[#e08500]">
                {currentStreak}
              </span>
              <span className="text-xs font-black text-[#ff9600]">ngày</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {currentStreak > 0
                ? (hasStudiedToday ? 'Đã thắp lửa hôm nay 🔥' : 'Cần học hôm nay để giữ lửa')
                : 'Học ngay để thắp lửa'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-black/20 flex items-center justify-center text-3xl animate-duo-wiggle">
            🔥
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-5 rounded-3xl duo-card-purple flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#ce82ff] uppercase tracking-wider">
              Kỷ lục chuỗi dài nhất
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-[#a855f7]">
                {longestStreak}
              </span>
              <span className="text-xs font-black text-[#ce82ff]">ngày</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Kỷ lục cá nhân cao nhất 🏆
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-black/20 flex items-center justify-center text-3xl animate-duo-bounce">
            👑
          </div>
        </div>

        {/* Streak Freeze */}
        <div className="p-5 rounded-3xl duo-card-blue flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-wider">
              Bảo vệ chuỗi (Freeze)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-[#1899d6]">
                {freezeCount}
              </span>
              <span className="text-xs font-black text-[#1cb0f6]">lượt</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Tự động giữ lửa nếu lỡ 1 ngày 🛡️
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-black/20 flex items-center justify-center text-3xl">
            🛡️
          </div>
        </div>

      </div>

      {/* GitHub-style Heatmap */}
      <div className="p-6 rounded-3xl duo-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
              <Calendar size={18} className="text-[#1cb0f6]" />
              Lịch Hoạt Động 10 Tuần Qua (70 Ngày)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Mỗi ô vuông đại diện cho 1 ngày thắp lửa. Màu xanh càng đậm thể hiện cường độ học càng cao.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <span>Ít</span>
            <div className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#bbf7d0] dark:bg-emerald-900" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#86efac] dark:bg-emerald-600" />
            <div className="w-3.5 h-3.5 rounded-md bg-[#58cc02] dark:bg-[#58cc02]" />
            <span>Nhiều</span>
          </div>
        </div>

        {/* Heatmap Grid (7 rows x 10 cols) */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[380px]">
            {heatmapDays.map((d) => {
              let bgClass = 'bg-slate-100 dark:bg-slate-800/80';
              if (d.intensity === 1) bgClass = 'bg-[#bbf7d0] dark:bg-emerald-900/60';
              if (d.intensity === 2) bgClass = 'bg-[#86efac] dark:bg-emerald-600';
              if (d.intensity >= 3) bgClass = 'bg-[#58cc02] dark:bg-[#58cc02]';

              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.isActive ? 'Đã học' : 'Chưa học'}`}
                  className={`w-4 h-4 rounded-[5px] ${bgClass} ${
                    d.isToday ? 'ring-2 ring-[#ff9600]' : ''
                  } transition-transform hover:scale-125 cursor-pointer`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="p-6 rounded-3xl duo-card space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
          <Sparkles size={18} className="text-[#ff9600]" />
          Các Mốc Chuỗi Ngày Thưởng Lớn
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STREAK_MILESTONES.map((m) => {
            const isReached = currentStreak >= m.days;
            return (
              <div
                key={m.days}
                className={`p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                  isReached
                    ? 'duo-card-green'
                    : 'duo-card opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-duo-bounce">{m.icon}</span>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 dark:text-white">
                      {m.title} ({m.days} ngày)
                    </h4>
                    <span className="text-[11px] font-black text-[#58cc02] dark:text-[#58cc02]">
                      {m.reward}
                    </span>
                  </div>
                </div>

                {isReached ? (
                  <CheckCircle2 size={20} className="text-[#58cc02] shrink-0" />
                ) : (
                  <span className="text-[11px] text-slate-400 font-bold shrink-0">
                    {Math.max(0, m.days - currentStreak)} ngày nữa
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
