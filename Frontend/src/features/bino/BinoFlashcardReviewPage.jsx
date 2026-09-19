import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Volume2, RotateCcw, CheckCircle2, Sparkles, 
  Flame, Award, Layers, ChevronRight, HelpCircle, BookOpen
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

export default function BinoFlashcardReviewPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  useEffect(() => {
    binoApi.getDueSRSCards()
      .then((res) => {
        if (res?.data) {
          setCards(res.data);
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy thẻ ôn tập:', err);
        toast.error('Không thể tải bộ thẻ ôn tập');
      })
      .finally(() => setLoading(false));
  }, []);

  const speakText = (text) => {
    speechService.speakWord(text);
  };

  const handleGrade = async (grade) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      await binoApi.submitSRSReview(currentCard.vocabularyId, grade);
      setReviewedCount(prev => prev + 1);

      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 150);
      } else {
        setIsFinished(true);
        toast.success('Chúc mừng! Bác đã hoàn thành buổi ôn tập hôm nay! 🎉');
      }
    } catch {
      toast.error('Lỗi khi ghi nhận đánh giá');
    }
  };

  if (loading) return <PageLoader />;

  const currentCard = cards[currentIndex];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto pb-16 px-2 sm:px-0">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/bino')}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-all shadow-sm flex items-center gap-2 text-xs font-bold shrink-0"
        >
          <ArrowLeft size={16} />
          <span>Về Sách Bino</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVoiceSettingsOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 flex items-center gap-1 shadow-sm transition-all"
            title="Cài đặt giọng đọc Studio"
          >
            <Sparkles size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Giọng Studio AI 🎙️</span>
          </motion.button>
          <span className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center gap-1 shadow-sm border border-amber-200 dark:border-amber-900">
            <Flame size={14} className="text-orange-500" /> SRS SM-2
          </span>
        </div>
      </div>

      {isFinished || cards.length === 0 ? (
        /* Finished Screen */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
            <Award size={42} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {cards.length === 0 ? 'Hiện Tại Không Có Thẻ Đến Hạn!' : 'Đã Hoàn Thành Buổi Ôn Tập! 🎉'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {cards.length === 0
                ? 'Bác chưa thêm từ nào vào bộ Flashcard hoặc các từ chưa đến lịch ôn. Hãy vào các bài hội thoại của sách Bino và bấm "+ Flashcard" nhé!'
                : `Bác đã ôn tập xong ${reviewedCount} từ vựng theo thuật toán lặp lại ngắt quãng SM-2. Não bộ của bác đã ghi nhớ sâu hơn rồi đấy!`}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/bino')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              Vào Học Tiếp Sách Bino
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* Flashcard Study Box */
        <div className="space-y-6">
          
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Thẻ {currentIndex + 1} / {cards.length}</span>
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
          </div>

          {/* 3D INTERACTIVE FLIP CARD CONTAINER */}
          <div className="perspective-1000 w-full min-h-[340px] sm:min-h-[380px]">
            <motion.div
              onClick={() => setIsFlipped(prev => !prev)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 220, damping: 20 }}
              className="w-full h-full relative transform-style-3d cursor-pointer select-none rounded-3xl"
              style={{ minHeight: '340px' }}
            >
              
              {/* CARD FRONT: ENGLISH WORD & PHONETIC */}
              <div 
                className="absolute inset-0 backface-hidden glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-xl flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500 transition-colors"
                style={{ zIndex: isFlipped ? 0 : 1 }}
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-wider font-extrabold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Sparkles size={14} /> Mặt Trước (Tiếng Anh)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(currentCard.word);
                    }}
                    className="p-2.5 rounded-2xl hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="text-center py-6 space-y-3">
                  <h3 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentCard.word}
                  </h3>

                  {currentCard.phonetic && (
                    <p className="text-base sm:text-lg font-serif italic text-amber-600 dark:text-amber-400 font-vietsub">
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
                className="absolute inset-0 backface-hidden glass-card p-6 sm:p-8 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl flex flex-col justify-between rotate-y-180 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-800"
                style={{ zIndex: isFlipped ? 1 : 0 }}
              >
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Mặt Sau (Nghĩa & Ngữ Cảnh)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(currentCard.word);
                    }}
                    className="p-2.5 rounded-2xl hover:bg-amber-100/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="text-center py-4 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentCard.word}</div>
                  
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-vietsub">
                    {currentCard.meaning}
                  </p>

                  {currentCard.exampleSentence && (
                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic font-medium max-w-md mx-auto">
                      "{currentCard.exampleSentence}"
                    </div>
                  )}
                </div>

                <div className="text-center text-xs font-bold text-amber-700 dark:text-amber-400">
                  ✓ Hãy chọn mức độ ghi nhớ ở các nút bên dưới:
                </div>
              </div>

            </motion.div>
          </div>

          {/* SM-2 4-GRADE BUTTONS (THUMB-FRIENDLY & RESPONSIVE) */}
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
                className="p-3 sm:p-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm"
              >
                <span className="font-black text-sm">Quên hẳn</span>
                <span className="text-[10px] opacity-80">Ôn lại ngay (1 ngày)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(1)}
                className="p-3 sm:p-3.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-2xl border border-orange-200 dark:border-orange-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm"
              >
                <span className="font-black text-sm">Thấy khó</span>
                <span className="text-[10px] opacity-80">Ôn lại sớm</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(2)}
                className="p-3 sm:p-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm"
              >
                <span className="font-black text-sm">Nhớ tốt</span>
                <span className="text-[10px] opacity-80">Giãn cách chuẩn</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleGrade(3)}
                className="p-3 sm:p-3.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all shadow-sm"
              >
                <span className="font-black text-sm">Quá dễ</span>
                <span className="text-[10px] opacity-80">Giãn cách dài</span>
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
