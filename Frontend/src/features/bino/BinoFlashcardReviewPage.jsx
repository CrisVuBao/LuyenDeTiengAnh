import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Volume2, RotateCcw, CheckCircle2, Sparkles, 
  Flame, Award, Layers, ChevronRight, HelpCircle 
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import toast from 'react-hot-toast';

export default function BinoFlashcardReviewPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

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
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  const handleGrade = async (grade) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      await binoApi.submitSRSReview(currentCard.vocabularyId, grade);
      setReviewedCount(prev => prev + 1);

      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
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
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/bino')}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Về Sách Bino</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1 shadow-sm">
            <Flame size={14} className="text-orange-500" /> Thuật toán SM-2 (SRS)
          </span>
        </div>
      </div>

      {isFinished || cards.length === 0 ? (
        /* Finished Screen */
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
            <Award size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {cards.length === 0 ? 'Hiện Tại Không Có Thẻ Đến Hạn!' : 'Đã Hoàn Thành Buổi Ôn Tập!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {cards.length === 0
                ? 'Bác chưa thêm từ nào vào bộ Flashcard hoặc các từ chưa đến lịch ôn. Hãy vào các bài hội thoại của sách Bino và bấm "+ Flashcard" nhé!'
                : `Bác đã ôn tập xong ${reviewedCount} từ vựng theo thuật toán lặp lại ngắt quãng SM-2. Não bộ của bác đã ghi nhớ sâu hơn rồi đấy!`}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/bino')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-500/25 transition-all"
            >
              Vào Học Tiếp Sách Bino
            </button>
          </div>
        </div>
      ) : (
        /* Flashcard Study Box */
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Thẻ {currentIndex + 1} / {cards.length}</span>
            <span className="text-amber-600 dark:text-amber-400">
              {currentCard?.chapterTitle || 'Chương 01'}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(prev => !prev)}
            className={`min-h-[320px] sm:min-h-[360px] p-8 rounded-3xl cursor-pointer transition-all duration-300 transform border shadow-xl flex flex-col justify-between select-none ${
              isFlipped
                ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-850 dark:to-slate-800 border-amber-300 dark:border-amber-800/80'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            {/* Top Card Bar */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="uppercase tracking-wider">
                {isFlipped ? 'Mặt Sau (Nghĩa & Ví dụ)' : 'Mặt Trước (Tiếng Anh)'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.word);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="Nghe phát âm"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Main Word Area */}
            <div className="text-center py-6 space-y-3">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentCard.word}
              </h3>

              {currentCard.phonetic && (
                <p className="text-sm sm:text-base font-serif italic text-amber-600 dark:text-amber-400">
                  {currentCard.phonetic}
                </p>
              )}

              {currentCard.wordType && (
                <span className="inline-block text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {currentCard.wordType}
                </span>
              )}

              {/* Back side details revealed on flip */}
              {isFlipped && (
                <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                  <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {currentCard.meaning}
                  </p>
                  {currentCard.exampleSentence && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                      "{currentCard.exampleSentence}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Flip Prompt */}
            <div className="text-center text-[11px] font-bold text-slate-400">
              {isFlipped ? '✓ Chọn mức độ nhớ bên dưới để lên lịch ôn' : '👉 Chạm vào thẻ để xem đáp án'}
            </div>
          </div>

          {/* SM-2 4-Grade Buttons (Active only when flipped) */}
          {isFlipped ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fade-in">
              <button
                onClick={() => handleGrade(0)}
                className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <span>Quên hẳn</span>
                <span className="text-[10px] opacity-70">Ôn lại ngay (1 ngày)</span>
              </button>

              <button
                onClick={() => handleGrade(1)}
                className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-2xl border border-orange-200 dark:border-orange-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <span>Thấy khó</span>
                <span className="text-[10px] opacity-70">Ôn lại sớm</span>
              </button>

              <button
                onClick={() => handleGrade(2)}
                className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <span>Nhớ tốt</span>
                <span className="text-[10px] opacity-70">Giãn cách chuẩn</span>
              </button>

              <button
                onClick={() => handleGrade(3)}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <span>Quá dễ</span>
                <span className="text-[10px] opacity-70">Giãn cách dài</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Hãy suy nghĩ nghĩa của từ trước, sau đó bấm lật thẻ để kiểm tra!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
