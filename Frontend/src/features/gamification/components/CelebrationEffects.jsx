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

    if (effect.type === 'level_up') {
      try {
        confetti({
          particleCount: 150,
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

    // Timer riêng biệt cho từng popup, tự động tắt sau 2.5s (hoặc 5s với level up)
    const duration = effect.type === 'level_up' ? 5000 : 2500;
    timersRef.current[id] = setTimeout(() => {
      removeEffect(id);
    }, duration);

    // Xóa ngay lastCelebration khỏi store để tránh re-trigger
    clearCelebration();
  }, [lastCelebration, clearCelebration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-end pb-8 px-4 gap-2.5">
      <AnimatePresence mode="popLayout">
        {activeEffects.map((effect) => {
          if (effect.type === 'xp_earned') {
            return (
              <motion.div
                key={effect.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -25, scale: 0.9, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                onClick={() => removeEffect(effect.id)}
                className="pointer-events-auto cursor-pointer bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-[#0071e3] dark:text-sky-400 font-extrabold px-5 py-2.5 rounded-full shadow-xl border border-blue-200/60 dark:border-slate-700/80 flex items-center gap-2 select-none hover:scale-105 active:scale-95 transition-transform"
                title="Bấm để đóng nhanh"
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-xs">
                  ⚡
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black">+{effect.data?.amount}</span>
                  <span className="text-xs font-bold text-sky-500">XP</span>
                </div>
                {effect.data?.description && (
                  <span className="text-slate-600 dark:text-slate-300 text-xs font-medium border-l border-slate-200 dark:border-slate-700 pl-2 ml-1 max-w-[220px] sm:max-w-xs truncate">
                    {effect.data.description}
                  </span>
                )}
              </motion.div>
            );
          }

          if (effect.type === 'level_up') {
            return (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 20 }}
                className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto p-4 z-[110]"
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
            );
          }

          return null;
        })}
      </AnimatePresence>
    </div>
  );
}
