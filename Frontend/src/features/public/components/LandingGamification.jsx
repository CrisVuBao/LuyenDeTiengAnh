import React, { useState } from 'react';
import { Trophy, Flame, Award, Target, ShieldCheck, Check, BarChart3 } from 'lucide-react';

export default function LandingGamification() {
  const [completedQuests, setCompletedQuests] = useState([1, 2]);

  const toggleQuestDemo = (id) => {
    setCompletedQuests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="gamification"
      className="py-20 lg:py-24 border-y border-slate-200/70 dark:border-slate-800/80 bg-gradient-to-b from-white/70 to-slate-100/60 dark:from-[#0a0f1d] dark:to-[#060913]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Gamification Description (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Trophy size={13} />
              <span>Hệ Thống Gamification Đỉnh Cao</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Biến Việc Học Tiếng Anh Mỗi Ngày Thành Trò Chơi Đầy Hứng Khởi
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Mỗi câu hội thoại bạn đọc, mỗi thẻ từ vựng bạn lật và mỗi đề TOEIC bạn hoàn thành đều được quy đổi thành điểm kinh nghiệm (XP), giúp bạn thăng cấp qua các bậc danh hiệu và đua Top trên Bảng xếp hạng Tuần.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  icon: Flame,
                  color: 'text-orange-500 bg-orange-500/10',
                  title: 'Chuỗi Ngày Học (Daily Streak) & Streak Freeze',
                  desc: 'Duy trì lửa học tập liên tục mỗi ngày kèm Lá chắn bảo vệ chuỗi khi bạn có việc đột xuất.'
                },
                {
                  icon: Award,
                  color: 'text-[#0071e3] bg-[#0071e3]/10',
                  title: 'Hệ Thống Cấp Độ & Danh Hiệu Vinh Quang',
                  desc: 'Thăng tiến từ Tân Binh → Chiến Binh Phản Xạ → Tinh Anh → Cao Thủ → Bậc Thầy → Huyền Thoại.'
                },
                {
                  icon: Target,
                  color: 'text-emerald-500 bg-emerald-500/10',
                  title: '4 Nhiệm Vụ Hàng Ngày (Daily Quests)',
                  desc: 'Mục tiêu rõ ràng, vừa sức mỗi ngày giúp bạn tích lũy XP và xây dựng kỷ luật bền vững.'
                }
              ].map((g, i) => {
                const Icon = g.icon;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${g.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {g.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {g.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Gamification HUD Preview (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xl space-y-6">
              {/* Top Player Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0071e3] to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                    LV.18
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        Chiến Binh Phản Xạ
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 text-[11px] font-bold">
                        2.450 / 3.000 XP
                      </span>
                    </div>
                    {/* XP Progress Bar */}
                    <div className="w-48 sm:w-64 h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                      <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#0071e3] to-sky-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="px-3.5 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-black text-sm">
                    <Flame size={17} className="fill-orange-500 text-orange-500" />
                    <span>14 Ngày Streak</span>
                  </div>
                  <div
                    className="px-3 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-1.5 text-[#0071e3] dark:text-sky-400 font-bold text-xs"
                    title="Lá chắn bảo vệ chuỗi ngày học"
                  >
                    <ShieldCheck size={16} />
                    <span>2 Freeze</span>
                  </div>
                </div>
              </div>

              {/* Interactive Daily Quests + Mini Leaderboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Interactive Quests (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Nhiệm vụ hàng ngày (Bấm thử để nhận XP)
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Hoàn thành {completedQuests.length}/4
                    </span>
                  </div>

                  {[
                    { id: 1, title: 'Hoàn thành 1 bài Hội thoại Thực Chiến', xp: '+50 XP' },
                    { id: 2, title: 'Vượt qua 15 câu Phản xạ nói 3 giây', xp: '+40 XP' },
                    { id: 3, title: 'Ôn tập 20 thẻ từ vựng Oxford 3D / SRS', xp: '+30 XP' },
                    { id: 4, title: 'Giải 10 câu TOEIC Part 5 chuẩn xác', xp: '+60 XP' }
                  ].map((quest) => {
                    const done = completedQuests.includes(quest.id);
                    return (
                      <div
                        key={quest.id}
                        onClick={() => toggleQuestDemo(quest.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          done
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0071e3]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-xs font-bold">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                              done
                                ? 'bg-emerald-500 text-white'
                                : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {done && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={done ? 'line-through opacity-75' : ''}>
                            {quest.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-[#0071e3] dark:text-sky-400 shrink-0">
                          {quest.xp}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Leaderboard Preview (5 cols) */}
                <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <BarChart3 size={14} className="text-amber-500" />
                      <span>Đấu Trường Tuần</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Top Học Viên
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { rank: 1, name: 'Minh Anh', xp: '3.420 XP', badge: '🥇' },
                      { rank: 2, name: 'Hoàng Bảo', xp: '3.180 XP', badge: '🥈' },
                      { rank: 3, name: 'Bạn (Dự kiến)', xp: '2.950 XP', badge: '🥉', highlight: true }
                    ].map((u) => (
                      <div
                        key={u.rank}
                        className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                          u.highlight
                            ? 'bg-[#0071e3]/12 border border-[#0071e3]/30 font-bold text-[#0071e3] dark:text-sky-300'
                            : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{u.badge}</span>
                          <span>{u.name}</span>
                        </div>
                        <span className="font-extrabold">{u.xp}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                    Cập nhật thời gian thực theo từng bài học hoàn thành
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
