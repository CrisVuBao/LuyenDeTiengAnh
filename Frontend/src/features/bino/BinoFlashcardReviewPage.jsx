import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Volume2, RotateCcw, CheckCircle2, Sparkles, 
  Flame, Award, Layers, ChevronRight, HelpCircle, BookOpen, 
  Trash2, Brain, Calendar, Clock, RefreshCw
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import { getCardFsrsMetrics, getFsrsIntervalPreviews } from '../../utils/fsrsScheduler';
import useAuthStore from '../../store/authStore';
import useGamificationStore from '../gamification/store/useGamificationStore';
import SeoMeta from '../../components/SeoMeta';
import toast from 'react-hot-toast';

const getLocalFlashcardKey = () => {
  const uid = useAuthStore.getState().user?.id || 'guest';
  return `vbace_local_flashcard_ids_v1_u_${uid}`;
};

export default function BinoFlashcardReviewPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [allSavedCards, setAllSavedCards] = useState([]);
  const [totalSavedCount, setTotalSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  const loadCards = async () => {
    setLoading(true);
    try {
      const [dueRes, allRes] = await Promise.allSettled([
        binoApi.getDueSRSCards(),
        binoApi.getAllSRSCards()
      ]);

      const dueData = (dueRes.status === 'fulfilled' && dueRes.value?.data) ? dueRes.value.data : [];
      const allData = (allRes.status === 'fulfilled' && allRes.value?.data) ? allRes.value.data : [];

      setTotalSavedCount(allData.length);
      setAllSavedCards(allData);
      setCards(dueData);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setIsCramMode(false);
    } catch (err) {
      console.error('Lỗi lấy thẻ ôn tập:', err);
      toast.error('Không thể tải bộ thẻ ôn tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleStartCramMode = () => {
    if (allSavedCards.length === 0) {
      toast('Chưa có thẻ nào trong bộ sưu tập', { icon: 'ℹ️' });
      return;
    }
    setCards([...allSavedCards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsCramMode(true);
    toast.success('Bắt đầu buổi ôn tập tự do toàn bộ thẻ đã lưu! 🚀');
  };

  const speakText = (text) => {
    speechService.speakWord(text);
  };

  const handleRemoveCard = async (e) => {
    e?.stopPropagation?.();
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      const raw = localStorage.getItem(getLocalFlashcardKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed[currentCard.vocabularyId];
        localStorage.setItem(getLocalFlashcardKey(), JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }

    const nextCards = cards.filter((_, idx) => idx !== currentIndex);
    setCards(nextCards);
    setAllSavedCards(prev => prev.filter(c => c.vocabularyId !== currentCard.vocabularyId));
    setTotalSavedCount(prev => Math.max(0, prev - 1));
    setIsFlipped(false);
    if (currentIndex >= nextCards.length && nextCards.length > 0) {
      setCurrentIndex(nextCards.length - 1);
    }

    toast(`Đã gỡ "${currentCard.word}" khỏi bộ Flashcard`, { icon: '↩️' });
    try {
      await binoApi.removeWordFromSRS(currentCard.vocabularyId);
    } catch {
      // ignore
    }
  };

  const currentCard = cards[currentIndex];
  const fsrsMetrics = useMemo(() => getCardFsrsMetrics(currentCard), [currentCard]);
  const fsrsPreviews = useMemo(() => getFsrsIntervalPreviews(currentCard, false), [currentCard]);

  const handleGrade = async (grade) => {
    if (!currentCard) return;

    const cardToGrade = currentCard;
    setReviewedCount(prev => prev + 1);

    // Nếu bấm "Quên hẳn" (grade 0), đẩy thẻ về cuối danh sách để ôn lại ngay trong phiên học
    if (grade === 0) {
      toast('Sẽ kiểm tra lại từ này ở cuối buổi học!', { icon: '🔄' });
      setCards(prev => [...prev, cardToGrade]);
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 120);
    } else {
      setIsFinished(true);
      toast.success('Chúc mừng! Bạn đã hoàn thành buổi ôn tập FSRS hôm nay! 🎉');
    }

    try {
      await binoApi.submitSRSReview(cardToGrade.vocabularyId, grade);
      if (grade >= 1) {
        const xp = grade >= 2 ? 2 : 1;
        useGamificationStore.getState().earnXP(xp, 'flashcard_review', `Ôn thẻ FSRS #${cardToGrade.vocabularyId}`);
      }
    } catch (err) {
      console.warn('Sync review error:', err);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto pb-16 px-2 sm:px-0">
      <SeoMeta
        title="Ôn Tập Từ Vựng FSRS — Giao Tiếp"
        description="Ôn tập từ vựng giao tiếp với thuật toán lặp lại ngắt quãng FSRS chuẩn xác."
      />
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/communication')}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-all shadow-sm flex items-center gap-2 text-xs font-bold shrink-0 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Về Lộ Trình 12 Chương</span>
        </motion.button>

        <div className="flex items-center gap-2">
          {isCramMode && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              Ôn tập tự do
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVoiceSettingsOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            title="Cài đặt giọng đọc Studio"
          >
            <Sparkles size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Giọng Studio AI 🎙️</span>
          </motion.button>
          <span
            className="px-3 py-1.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 shadow-sm border border-indigo-200 dark:border-indigo-800"
            title="Thuật toán lặp lại ngắt quãng thế hệ mới FSRS (Free Spaced Repetition Scheduler)"
          >
            <Brain size={14} className="text-indigo-600 dark:text-indigo-400" /> FSRS AI
          </span>
        </div>
      </div>

      {isFinished || cards.length === 0 ? (
        /* Finished / No Due Cards Screen */
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-7 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-2xl bg-white dark:bg-slate-900"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
            {totalSavedCount === 0 ? <BookOpen size={38} /> : <Award size={42} />}
          </div>

          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalSavedCount === 0 
                ? 'Chưa Có Từ Vựng Nào Trong Bộ Flashcard!' 
                : 'Đã Hoàn Thành Buổi Ôn Tập Hôm Nay! 🎉'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {totalSavedCount === 0
                ? 'Bạn chưa lưu từ vựng nào vào Flashcard. Hãy vào các bài học trong Giao Tiếp Thực Chiến và bấm "+ Flashcard" tại các từ vựng bạn muốn ghi nhớ lâu dài nhé!'
                : isFinished
                ? `Tuyệt vời! Bạn vừa ôn tập hoàn tất ${reviewedCount} từ vựng theo thuật toán FSRS. Chu kỳ ôn tập tối ưu tiếp theo đã được lập lịch chính xác vào não bộ của bạn!`
                : `Hiện tại bạn không còn từ nào đến hạn cần ôn tập. Toàn bộ ${totalSavedCount} từ vựng đã lưu đang nằm trong vùng trí nhớ an toàn của bạn!`}
            </p>
          </div>

          {/* Statistics summary card when user has saved words */}
          {totalSavedCount > 0 && (
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-left">
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Tổng từ đã lưu:</span>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">{totalSavedCount} từ</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Trạng thái trí nhớ:</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Đạt chuẩn 90%</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {totalSavedCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartCramMode}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw size={15} />
                <span>Ôn tập tự do ({totalSavedCount} thẻ)</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/communication')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              Vào Học Tiếp 72 Bài Hội Thoại
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* Flashcard Study Box */
        <div className="space-y-5">
          
          {/* Progress Indicator + FSRS Memory Metrics Pill Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Thẻ {currentIndex + 1} / {cards.length} {isCramMode && '(Ôn tự do)'}</span>
              <span className="text-amber-600 dark:text-amber-400 font-black font-vietsub">
                {currentCard?.chapterTitle || 'Chương 01'}
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
              />
            </div>

            {/* FSRS DSR Memory Model Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Brain size={13} />
                <span>{fsrsMetrics.statusLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <span title="Stability (S): Độ bền trí nhớ ước tính (ngày)">
                  Độ bền S: <strong className="text-slate-800 dark:text-slate-200">{fsrsMetrics.stability > 0 ? `${fsrsMetrics.stability}d` : 'Mới'}</strong>
                </span>
                <span title="Difficulty (D): Độ khó nội tại của từ (1-10)">
                  Độ khó D: <strong className="text-slate-800 dark:text-slate-200">{fsrsMetrics.difficulty}/10</strong>
                </span>
                <span title="Retrievability (R): Xác suất gợi nhớ thành công hiện tại">
                  Nhớ R: <strong className="text-emerald-600 dark:text-emerald-400">{fsrsMetrics.retrievability}%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3D INTERACTIVE FLIP CARD CONTAINER */}
          <div className="perspective-1000 w-full min-h-[340px] sm:min-h-[380px]">
            <motion.div
              onClick={() => setIsFlipped(prev => !prev)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 240, damping: 22 }}
              className="w-full h-full relative transform-style-3d cursor-pointer select-none rounded-3xl"
              style={{ minHeight: '340px' }}
            >
              
              {/* CARD FRONT: ENGLISH WORD & PHONETIC */}
              {/* CARD FRONT: ENGLISH WORD */}
              <div 
                className="absolute inset-0 backface-hidden glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-xl flex flex-col justify-between hover:border-[#0071e3]/60 transition-colors bg-white dark:bg-slate-900"
                style={{ zIndex: isFlipped ? 0 : 1 }}
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-wider font-extrabold flex items-center gap-1 text-[#0071e3] dark:text-sky-400">
                    <Sparkles size={14} /> Mặt Trước (Tiếng Anh)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleRemoveCard}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Thoát / Bỏ từ này khỏi bộ Flashcard"
                    >
                      <Trash2 size={13} />
                      <span>Bỏ thẻ</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.word);
                      }}
                      className="p-2.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#0071e3] transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-center py-6 space-y-3">
                  <h3 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentCard.word}
                  </h3>

                  {currentCard.phonetic && (
                    <p className="text-base sm:text-lg font-serif italic text-[#0071e3] dark:text-sky-400 font-vietsub">
                      {currentCard.phonetic}
                    </p>
                  )}

                  {currentCard.wordType && (
                    <span className="inline-block text-xs font-black uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {currentCard.wordType}
                    </span>
                  )}
                </div>

                <div className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1">
                  <span>👉 Chạm vào thẻ để lật xem nghĩa & ví dụ</span>
                </div>
              </div>

              {/* CARD BACK: VIETNAMESE MEANING & EXAMPLE SENTENCE */}
              <div 
                className="absolute inset-0 backface-hidden glass-card p-6 sm:p-8 rounded-3xl border border-blue-200 dark:border-blue-900/60 shadow-2xl flex flex-col justify-between rotate-y-180 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/50 dark:from-slate-850 dark:via-slate-850 dark:to-slate-800"
                style={{ zIndex: isFlipped ? 1 : 0 }}
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Mặt Sau (Nghĩa & Ngữ Cảnh)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleRemoveCard}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Thoát / Bỏ từ này khỏi bộ Flashcard"
                    >
                      <Trash2 size={13} />
                      <span>Bỏ thẻ</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.word);
                      }}
                      className="p-2.5 rounded-2xl hover:bg-blue-100/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-center py-4 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentCard.word}</div>
                  
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-vietsub">
                    {currentCard.meaning}
                  </p>

                  {currentCard.exampleSentence && (
                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic font-medium max-w-md mx-auto">
                      "{currentCard.exampleSentence}"
                    </div>
                  )}
                </div>

                <div className="text-center text-xs font-bold text-[#0071e3] dark:text-sky-400">
                  ✓ Chọn mức độ nhớ bên dưới để FSRS lên lịch ôn tối ưu:
                </div>
              </div>

            </motion.div>
          </div>

          {/* FSRS 4-GRADE BUTTONS WITH LIVE NEXT-INTERVAL PREVIEWS */}
          {isFlipped ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(0)}
                className="p-3 sm:p-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-black text-sm">Quên hẳn</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 font-extrabold">
                  {fsrsPreviews[0]}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(1)}
                className="p-3 sm:p-3.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-2xl border border-orange-200 dark:border-orange-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-black text-sm">Thấy khó</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/50 font-extrabold">
                  {fsrsPreviews[1]}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(2)}
                className="p-3 sm:p-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-black text-sm">Nhớ tốt</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 font-extrabold">
                  {fsrsPreviews[2]}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(3)}
                className="p-3 sm:p-3.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-black text-sm">Quá dễ</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 font-extrabold">
                  {fsrsPreviews[3]}
                </span>
              </motion.button>
            </motion.div>
          ) : (
            <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              💡 Hãy tự nhẩm nghĩa của từ trong đầu trước, sau đó chạm vào thẻ để lật xem đáp án!
            </div>
          )}
        </div>
      )}

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />
    </div>
  );
}
