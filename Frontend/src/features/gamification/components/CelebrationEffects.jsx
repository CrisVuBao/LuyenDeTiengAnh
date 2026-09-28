import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGamificationStore from '../store/useGamificationStore';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';

export default function CelebrationEffects() {
  const { lastCelebration, clearCelebration } = useGamificationStore();
  const [activeEffects, setActiveEffects] = useState([]);
  const timersRef = useRef({});

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  const removeEffect = (id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setActiveEffects((prev) => prev.filter((e) => e.id !== id));
  };

  useEffect(() => {
    if (!lastCelebration) return;

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const effect = { id, ...lastCelebration };

    if (effect.type === 'level_up' || effect.type === 'all_quests_completed') {
      try {
        confetti({
          particleCount: effect.type === 'all_quests_completed' ? 80 : 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0071e3', '#34d399', '#fbbf24', '#f87171']
        });
      } catch {}
    }

    setActiveEffects((prev) => {
      // Giới hạn tối đa 2 toast cùng lúc để không bao giờ bị xếp chồng đè màn hình
      const updated = [...prev, effect];
      if (updated.length > 2) {
        const removed = updated.slice(0, updated.length - 2);
        removed.forEach((r) => {
          if (timersRef.current[r.id]) {
            clearTimeout(timersRef.current[r.id]);
            delete timersRef.current[r.id];
          }
        });
        return updated.slice(-2);
      }
      return updated;
    });

    // Timer riêng biệt cho từng popup, tự động tắt sau 3.5s (hoặc 5s với level up)
    const duration = effect.type === 'level_up' ? 5000 : 3500;
    timersRef.current[id] = setTimeout(() => {
      removeEffect(id);
    }, duration);

    // Xóa ngay lastCelebration khỏi store để tránh re-trigger
    clearCelebration();
  }, [lastCelebration, clearCelebration]);

  return (
    <>
      {/* 1. Top Toasts Container: Nhiệm vụ hoàn thành & Thành tựu (Đặt góc trên bên phải để không che thanh công cụ học tập ở dưới) */}
      <div className="fixed top-4 inset-x-0 sm:top-5 sm:right-5 sm:left-auto pointer-events-none z-[110] flex flex-col items-center sm:items-end px-4 gap-2.5">
        <AnimatePresence mode="popLayout">
          {activeEffects
            .filter((e) => e.type !== 'level_up')
            .map((effect) => {
              // 1.1 Nhiệm vụ hàng ngày vừa hoàn thành
              if (effect.type === 'quest_completed') {
                return (
                  <motion.div
                    key={effect.id}
                    layout
                    initial={{ opacity: 0, y: -25, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', damping: 20, stiffness: 320 }}
                    onClick={() => removeEffect(effect.id)}
                    className="pointer-events-auto cursor-pointer bg-slate-900/95 dark:bg-slate-900/95 text-white p-3.5 px-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-3 select-none hover:scale-102 active:scale-95 transition-transform max-w-sm w-full"
                    title="Bấm để đóng nhanh"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl border border-emerald-500/30">
                      🎯
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                          Nhiệm Vụ Hoàn Thành!
                        </span>
                        {effect.data?.rewardXP && (
                          <span className="text-[11px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950">
                            +{effect.data.rewardXP} XP
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate mt-0.5">
                        {effect.data?.title || 'Hoàn thành nhiệm vụ'}
                      </p>
                    </div>
                  </motion.div>
                );
              }

              // 1.2 Hoàn thành 100% tất cả nhiệm vụ hôm nay
              if (effect.type === 'all_quests_completed') {
                return (
                  <motion.div
                    key={effect.id}
                    layout
                    initial={{ opacity: 0, y: -30, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.85, transition: { duration: 0.25 } }}
                    transition={{ type: 'spring', damping: 20, stiffness: 280 }}
                    onClick={() => removeEffect(effect.id)}
                    className="pointer-events-auto cursor-pointer bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 p-4 rounded-2xl shadow-2xl border border-amber-200 select-none hover:scale-102 active:scale-95 transition-transform max-w-md w-full flex items-center gap-3.5"
                    title="Bấm để đóng nhanh"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0 text-2xl">
                      🌟
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                          Xuất Sắc Hôm Nay!
                        </span>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-amber-300">
                          +{effect.data?.bonusXP || 50} XP Bonus
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                        Đã hoàn thành 100% nhiệm vụ hàng ngày 🎉
                      </p>
                    </div>
                  </motion.div>
                );
              }

              // 1.3 Mở khóa thành tựu mới
              if (effect.type === 'achievement_unlocked') {
                return (
                  <motion.div
                    key={effect.id}
                    layout
                    initial={{ opacity: 0, y: -25, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={() => removeEffect(effect.id)}
                    className="pointer-events-auto cursor-pointer bg-slate-900/95 dark:bg-slate-900/95 text-white p-3.5 px-4 rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-md flex items-center gap-3 select-none hover:scale-102 active:scale-95 transition-transform max-w-sm w-full"
                    title="Bấm để đóng nhanh"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-xl border border-indigo-500/30">
                      🏆
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                        Thành Tựu Mới!
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate mt-0.5">
                        Mở khóa huy hiệu thành tích mới
                      </p>
                    </div>
                  </motion.div>
                );
              }

              return null;
            })}
        </AnimatePresence>
      </div>

      {/* 2. Modal Cột Mốc Lớn: Thăng Cấp (Level Up) */}
      <AnimatePresence>
        {activeEffects
          .filter((e) => e.type === 'level_up')
          .map((effect) => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto p-4 z-[120]"
            >
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-700">
                <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#0071e3] to-sky-400 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 animate-bounce">
                  <Trophy size={42} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Thăng Cấp!</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-base">
                  Chúc mừng bạn đã đạt <strong className="text-[#0071e3] dark:text-sky-400">Cấp {effect.data?.newLevel}</strong> 🎉
                </p>
                <button
                  onClick={() => removeEffect(effect.id)}
                  className="w-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold py-3 rounded-2xl transition-colors cursor-pointer active:scale-95 shadow-lg shadow-blue-500/25"
                >
                  Tuyệt vời! Tiếp tục học
                </button>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </>
  );
}
