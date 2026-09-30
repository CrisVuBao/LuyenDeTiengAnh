import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Sparkles,
  Volume2,
  X,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Award,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react';
import useVocabStore from '../store/useVocabStore';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import { getFsrsIntervalPreviews, formatFsrsInterval } from '../../../utils/fsrsScheduler';
import toast from 'react-hot-toast';

export default function FsrsShieldRecoveryModal({
  isOpen,
  onClose,
  wordsToReview = [],
  initialHealth = 80,
  onSuccess
}) {
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [currentHealth, setCurrentHealth] = useState(initialHealth);
  const [isFinished, setIsFinished] = useState(false);
  const [comboCount, setComboCount] = useState(0);

  const { gradeWordFsrs, speakWord, fsrsCards } = useVocabStore();
  const earnXP = useGamificationStore((s) => s.earnXP);

  // Khởi tạo hàng đợi ôn tập khi mở modal
  useEffect(() => {
    if (isOpen) {
      const queue = wordsToReview && wordsToReview.length > 0
        ? [...wordsToReview]
        : [];
      setDeck(queue);
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewedCount(0);
      setCurrentHealth(initialHealth);
      setIsFinished(queue.length === 0);
      setComboCount(0);
    }
  }, [isOpen, wordsToReview, initialHealth]);

  const currentWord = deck[currentIndex] || null;
  const currentCardState = currentWord ? fsrsCards[currentWord.id] : null;

  // Dự báo thời gian ôn lại cho 4 cấp độ FSRS
  const previews = useMemo(() => {
    return getFsrsIntervalPreviews(currentCardState || {});
  }, [currentCardState]);

  // Phát âm từ vựng tự động khi lật sang thẻ mới
  useEffect(() => {
    if (isOpen && currentWord && !isFinished) {
      setIsFlipped(false);
      try {
        speakWord(currentWord.word);
      } catch {}
    }
  }, [currentIndex, currentWord, isOpen, isFinished, speakWord]);

  // Xử lý chấm điểm FSRS
  const handleGrade = useCallback((grade) => {
    if (!currentWord || isFinished) return;

    // Chấm điểm vào store và lưu xuống LocalStorage / Cloud
    gradeWordFsrs(currentWord.id, grade);

    const isGood = grade >= 2;
    if (isGood) {
      setComboCount((prev) => prev + 1);
    } else {
      setComboCount(0);
    }

    const nextReviewed = reviewedCount + 1;
    setReviewedCount(nextReviewed);

    // Tính toán lại sức khỏe lá chắn tăng dần về 100%
    const progressRatio = nextReviewed / Math.max(1, deck.length);
    const nextHealth = Math.min(100, Math.round(initialHealth + (100 - initialHealth) * progressRatio));
    setCurrentHealth(nextHealth);

    // Chuyển thẻ tiếp theo
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Đã hoàn thành toàn bộ hàng đợi nguy cấp!
      setIsFinished(true);
      try {
        earnXP(25, 'shield_defense', 'Hoàn thành Bảo Vệ Lá Chắn Trí Nhớ 100%');
      } catch {}
      if (onSuccess) onSuccess();
    }
  }, [currentWord, isFinished, gradeWordFsrs, reviewedCount, deck.length, initialHealth, currentIndex, earnXP, onSuccess]);

  // Phím tắt bàn phím (1-4 để chọn mức độ FSRS, Space để lật thẻ)
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGrade(0);
      } else if (e.key === '2') {
        e.preventDefault();
        handleGrade(1);
      } else if (e.key === '3' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleGrade(2);
      } else if (e.key === '4') {
        e.preventDefault();
        handleGrade(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, handleGrade]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar with Live Shield Health Gauge */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                currentHealth >= 85
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : currentHealth >= 70
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}>
                <Shield size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Phục Hồi Lá Chắn Trí Nhớ
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide border ${
                    currentHealth >= 85
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : currentHealth >= 70
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {currentHealth}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFinished
                    ? 'Lá chắn đã nạp đầy 100% năng lượng!'
                    : `Đang ôn từ ${currentIndex + 1}/${deck.length} • Ngăn ngừa phân rã trí nhớ`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Smooth Health Recharge Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 relative overflow-hidden">
            <motion.div
              className={`h-full transition-all duration-500 ${
                currentHealth >= 85
                  ? 'bg-emerald-500'
                  : currentHealth >= 70
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${currentHealth}%` }}
            />
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
            {isFinished ? (
              /* Finish Celebration Screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 sm:py-8 text-center space-y-4"
              >
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Shield size={44} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                    Lá Chắn Trí Nhớ Đã Đạt 100%! 🛡️⚡
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Xuất sắc! Bạn vừa cứu thành công <strong>{reviewedCount} từ vựng</strong> khỏi nguy cơ bị lãng quên theo đường cong Ebbinghaus.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30">
                  <Award size={15} />
                  <span>+25 XP Thưởng Bảo Vệ Trí Nhớ Thành Công</span>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    Hoàn Thành & Đóng
                  </button>
                </div>
              </motion.div>
            ) : currentWord ? (
              /* Active Flashcard Card */
              <div className="space-y-5">
                {/* Combo Badge */}
                {comboCount >= 3 && (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/30 animate-bounce">
                      <Flame size={14} className="text-amber-500" />
                      <span>Combo {comboCount} từ nhớ tốt liên tiếp!</span>
                    </span>
                  </div>
                )}

                {/* Interactive Card with 3D Flip */}
                <div
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="relative min-h-[220px] sm:min-h-[260px] p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-md flex flex-col justify-between cursor-pointer hover:border-[#0071e3]/40 transition-all select-none group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider">
                      {currentWord.topicTitle || '3000 Từ Vựng Oxford'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-[#0071e3] transition-colors">
                      <RotateCw size={12} />
                      <span>Chạm để lật</span>
                    </span>
                  </div>

                  <div className="my-auto text-center space-y-3">
                    {!isFlipped ? (
                      /* FRONT: English Word */
                      <motion.div
                        key="front"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currentWord.word}
                          </h2>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(currentWord.word);
                            }}
                            className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-[#0071e3] dark:text-sky-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Nghe phát âm"
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>

                        {currentWord.ipa && (
                          <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                            {currentWord.ipa}
                          </p>
                        )}

                        {currentWord.pos && (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {currentWord.pos}
                          </span>
                        )}
                      </motion.div>
                    ) : (
                      /* BACK: Vietnamese Meaning */
                      <motion.div
                        key="back"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                          {currentWord.meaning}
                        </p>
                        {currentWord.example && (
                          <div className="pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic max-w-md mx-auto">
                            &ldquo;{currentWord.example}&rdquo;
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 pt-1">
                          Trí nhớ hiện tại: <strong className="text-rose-500">{currentWord.retrievability || 50}%</strong> → Sẽ hồi phục lên <strong>100%</strong> sau khi ôn!
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="text-center text-[11px] text-slate-400 font-medium">
                    Nhấn phím cách (Space) hoặc bấm thẻ để lật
                  </div>
                </div>

                {/* 4 FSRS Rating Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleGrade(0)}
                      className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-xs font-bold">1. Quên hẳn</span>
                      <span className="text-[10px] opacity-75">{previews[0]}</span>
                    </button>

                    <button
                      onClick={() => handleGrade(1)}
                      className="p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-xs font-bold">2. Thấy khó</span>
                      <span className="text-[10px] opacity-75">{previews[1]}</span>
                    </button>

                    <button
                      onClick={() => handleGrade(2)}
                      className="p-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-[#0071e3] dark:text-sky-400 border border-blue-500/30 flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-xs font-bold">3. Nhớ tốt</span>
                      <span className="text-[10px] opacity-75">{previews[2]}</span>
                    </button>

                    <button
                      onClick={() => handleGrade(3)}
                      className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-xs font-bold">4. Quá dễ</span>
                      <span className="text-[10px] opacity-75">{previews[3]}</span>
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-slate-400">
                    Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">1</kbd> Quên • <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">2</kbd> Khó • <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">3</kbd> Nhớ tốt • <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">4</kbd> Quá dễ
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
