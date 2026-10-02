import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Medal, Sparkles, TrendingUp, User } from 'lucide-react';
import useGamificationStore from '../store/useGamificationStore';
import useAuthStore from '../../../store/authStore';
import useBrandingStore from '../../../store/useBrandingStore';

export default function LeaderboardPanel() {
  const { leaderboard, fetchLeaderboard, profile } = useGamificationStore();
  const currentUser = useAuthStore((s) => s.user);
  const brandName = useBrandingStore((s) => s.branding.brandName);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Reorder for podium: [Rank 2, Rank 1, Rank 3]
  const podium = [
    top3[1] || null, // Silver
    top3[0] || null, // Gold
    top3[2] || null  // Bronze
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Banner (Duolingo League Banner) */}
      <div className="p-6 rounded-3xl duo-card duo-card-blue bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]/40 dark:from-[#082f49]/60 dark:via-[#0c4a6e]/40 dark:to-[#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/90 dark:bg-sky-950/80 text-[#0284c7] dark:text-[#38bdf8] text-xs font-black uppercase tracking-wider border border-sky-200 dark:border-sky-800/80">
            <Sparkles size={14} className="animate-duo-bounce" />
            <span>Đấu Trường Kim Cương • Reset 23:59 CN</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Bảng Xếp Hạng Cao Thủ
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Học tập, hoàn thành nhiệm vụ và luyện phản xạ mỗi ngày để tích lũy XP leo đỉnh vinh quang!
          </p>
        </div>

        {profile && (
          <div className="p-4 rounded-2xl duo-card duo-card-yellow text-center shrink-0">
            <span className="text-[11px] font-black text-[#8a5800] dark:text-amber-400 uppercase tracking-wider block">
              {currentUser?.role === 'Admin' || !profile.leaderboardRank ? 'Trạng thái' : 'Hạng của bạn'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#d97706] dark:text-amber-300">
              {currentUser?.role === 'Admin' || !profile.leaderboardRank ? 'Quản Trị Viên' : `#${profile.leaderboardRank}`}
            </span>
            <span className="text-[11px] font-bold text-[#8a5800] dark:text-amber-400/90 block mt-0.5">
              {currentUser?.role === 'Admin' || !profile.leaderboardRank 
                ? '(Không tham gia BXH)' 
                : `${profile.weeklyXP || profile.totalXP || 0} XP tuần này`}
            </span>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 max-w-2xl mx-auto">
          
          {/* Rank 2 (Silver) */}
          <div className="flex flex-col items-center">
            {podium[0] ? (
              <div className="w-full flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-lg shadow-md ring-4 ring-slate-300 dark:ring-slate-600">
                    {podium[0].fullName?.charAt(0) || '2'}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold shadow">
                      #2
                    </span>
                  </div>
                </div>
                <div className="text-center pt-1 min-w-0 w-full px-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                    {podium[0].fullName}
                  </p>
                  <p className="text-xs font-black text-slate-600 dark:text-slate-400">
                    {podium[0].weeklyXP} XP
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/60 flex items-center justify-center font-black text-slate-400 text-xl">
                  🥈
                </div>
              </div>
            ) : null}
          </div>

          {/* Rank 1 (Gold) */}
          <div className="flex flex-col items-center">
            {podium[1] ? (
              <div className="w-full flex flex-col items-center space-y-2">
                <div className="relative">
                  <Crown size={24} className="text-amber-500 fill-amber-500 absolute -top-6 inset-x-0 mx-auto animate-bounce" />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center font-black text-amber-950 text-xl shadow-lg ring-4 ring-amber-400">
                    {podium[1].fullName?.charAt(0) || '1'}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black shadow">
                      #1
                    </span>
                  </div>
                </div>
                <div className="text-center pt-1 min-w-0 w-full px-1">
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {podium[1].fullName}
                  </p>
                  <p className="text-xs font-black text-amber-500">
                    {podium[1].weeklyXP} XP
                  </p>
                </div>
                <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 flex items-center justify-center font-black text-amber-500 text-2xl border-t border-amber-300 dark:border-amber-700">
                  🥇
                </div>
              </div>
            ) : null}
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="flex flex-col items-center">
            {podium[2] ? (
              <div className="w-full flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-700/30 flex items-center justify-center font-black text-amber-800 dark:text-amber-200 text-lg shadow-md ring-4 ring-amber-600/40">
                    {podium[2].fullName?.charAt(0) || '3'}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold shadow">
                      #3
                    </span>
                  </div>
                </div>
                <div className="text-center pt-1 min-w-0 w-full px-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                    {podium[2].fullName}
                  </p>
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                    {podium[2].weeklyXP} XP
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-orange-200 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/20 flex items-center justify-center font-black text-orange-600 text-xl">
                  🥉
                </div>
              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* Ranks 4 to 20 Table */}
      <div className="duo-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-black text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Hạng & Học viên</span>
          <span>Điểm tuần</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {leaderboard.map((entry, idx) => {
            const isMe = currentUser?.id === entry.userId || (currentUser?.email && entry.fullName === currentUser.fullName);
            const rank = idx + 1;

            return (
              <div
                key={entry.userId || idx}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                  isMe
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border-l-4 border-l-[#1cb0f6]'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className={`w-7 text-center font-black text-sm shrink-0 ${
                    rank === 1 ? 'text-amber-500' :
                    rank === 2 ? 'text-slate-400' :
                    rank === 3 ? 'text-amber-700 dark:text-amber-500' :
                    'text-slate-400'
                  }`}>
                    #{rank}
                  </span>

                  <div className="w-10 h-10 rounded-2xl bg-[#1cb0f6] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0 border-b-2 border-[#1899d6]">
                    {entry.fullName?.charAt(0) || 'U'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        {entry.fullName}
                      </p>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full duo-pill-xp text-[10px] font-black shrink-0">
                          BẠN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-[#1cb0f6] dark:text-[#1cb0f6] font-bold">
                        Lv.{entry.currentLevel || 1} {entry.levelTitle || ''}
                      </span>
                      {entry.currentStreak > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-orange-500 font-bold flex items-center gap-0.5">
                            <Flame size={12} className="fill-orange-500" />
                            {entry.currentStreak} ngày
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-black text-[#1cb0f6] dark:text-[#1cb0f6]">
                    {entry.weeklyXP || entry.totalXP || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                    XP
                  </span>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Đang tổng hợp bảng xếp hạng tuần... Hãy hoàn thành bài học đầu tiên để chiếm vị trí dẫn đầu!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
