import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield, Trophy, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
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

  // Generate last 70 days (10 weeks) for GitHub-style heatmap
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 69; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      
      // If within current streak (counting back from today) or has activity in reflexDailyLog
      const hasReflexActivity = Boolean(reflexDailyLog[key] && reflexDailyLog[key] > 0);
      const isWithinStreak = i < currentStreak;
      const isActive = hasReflexActivity || isWithinStreak;
      const intensity = hasReflexActivity ? Math.min(3, Math.ceil(reflexDailyLog[key] / 10)) : (isWithinStreak ? 2 : 0);

      days.push({
        date: key,
        displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
        isActive,
        intensity,
        isToday: i === 0
      });
    }
    return days;
  }, [currentStreak, reflexDailyLog]);

  return (
    <div className="space-y-6">
      
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Current Streak */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80 dark:border-orange-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chuỗi hiện tại
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-orange-500">
                {currentStreak}
              </span>
              <span className="text-xs font-semibold text-slate-400">ngày</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tiếp tục học hôm nay để duy trì
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center">
            <Flame size={24} className="fill-orange-500" />
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kỷ lục chuỗi dài nhất
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {longestStreak}
              </span>
              <span className="text-xs font-semibold text-slate-400">ngày</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kỷ lục cá nhân cao nhất
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 flex items-center justify-center">
            <Trophy size={24} />
          </div>
        </div>

        {/* Streak Freeze */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bảo vệ chuỗi (Freeze)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-sky-500">
                {freezeCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">lượt</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tự động giữ chuỗi nếu lỡ 1 ngày
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center">
            <Shield size={24} />
          </div>
        </div>

      </div>

      {/* GitHub-style Heatmap */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-[#0071e3] dark:text-sky-400" />
              Lịch Hoạt Động 10 Tuần Qua (70 Ngày)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mỗi ô vuông đại diện cho 1 ngày học tập. Màu xanh càng đậm thể hiện cường độ học càng cao.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Ít</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
            <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
            <span>Nhiều</span>
          </div>
        </div>

        {/* Heatmap Grid (7 rows x 10 cols) */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[380px]">
            {heatmapDays.map((d) => {
              let bgClass = 'bg-slate-100 dark:bg-slate-800/80';
              if (d.intensity === 1) bgClass = 'bg-emerald-200 dark:bg-emerald-900/60';
              if (d.intensity === 2) bgClass = 'bg-emerald-400 dark:bg-emerald-600';
              if (d.intensity >= 3) bgClass = 'bg-emerald-600 dark:bg-emerald-400';

              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.isActive ? 'Đã học' : 'Chưa học'}`}
                  className={`w-4 h-4 rounded-[4px] ${bgClass} ${
                    d.isToday ? 'ring-2 ring-[#0071e3] dark:ring-sky-400' : ''
                  } transition-transform hover:scale-125 cursor-pointer`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          Các Mốc Chuỗi Ngày Thưởng Lớn
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STREAK_MILESTONES.map((m) => {
            const isReached = currentStreak >= m.days;
            return (
              <div
                key={m.days}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isReached
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {m.title} ({m.days} ngày)
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {m.reward}
                    </span>
                  </div>
                </div>

                {isReached ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <span className="text-[11px] text-slate-400 shrink-0">
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
