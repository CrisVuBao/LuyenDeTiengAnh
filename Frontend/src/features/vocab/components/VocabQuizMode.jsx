import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Volume2, Sparkles, RotateCw, CheckCircle, 
  XCircle, Zap, ArrowRight, Star, Flame
} from 'lucide-react';
import useVocabStore from '../store/useVocabStore';
import confetti from 'canvas-confetti';

export default function VocabQuizMode({ topic, allTopics, onSwitchToFlashcard }) {
  const words = topic?.words || [];
  const { speakWord, playEffect, recordQuizResult, markWordMastered } = useVocabStore();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wrongWords, setWrongWords] = useState([]);

  // Generate 10 smart quiz questions
  const generateQuestions = useCallback(() => {
    if (!words || words.length < 2) return [];

    // Pool of distractors from this topic or across topics
    const distractorPool = words.length >= 4 
      ? words 
      : (allTopics?.flatMap(t => t.words) || words);

    // Pick up to 10 random words from current topic
    const sampleWords = [...words].sort(() => Math.random() - 0.5).slice(0, 10);

    return sampleWords.map((target, idx) => {
      // 50% EN -> VN, 50% VN -> EN
      const isEnToVn = idx % 2 === 0;

      // Pick 3 wrong options
      const otherWords = distractorPool
        .filter(w => w.word !== target.word && w.meaning !== target.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [
        { text: isEnToVn ? target.meaning : target.word, isCorrect: true, wordObj: target },
        ...otherWords.map(w => ({ text: isEnToVn ? w.meaning : w.word, isCorrect: false, wordObj: w }))
      ].sort(() => Math.random() - 0.5);

      return {
        id: target.id,
        targetWord: target,
        isEnToVn,
        prompt: isEnToVn ? target.word : target.meaning,
        subPrompt: isEnToVn ? target.ipa : `(${target.pos || 'từ vựng'})`,
        options
      };
    });
  }, [words, allTopics]);

  const startQuiz = useCallback(() => {
    const qList = generateQuestions();
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setIsFinished(false);
    setWrongWords([]);
  }, [generateQuestions]);

  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    if (option.isCorrect) {
      playEffect('correct');
      setScore((s) => s + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
      markWordMastered(currentQ.targetWord.id, true);
    } else {
      playEffect('wrong');
      setStreak(0);
      setWrongWords((prev) => [...prev, currentQ.targetWord]);
    }

    // Auto next after 1.1s
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        finishQuiz(score + (option.isCorrect ? 1 : 0));
      }
    }, 1100);
  };

  const finishQuiz = (finalScore) => {
    setIsFinished(true);
    recordQuizResult(topic.id, finalScore, questions.length);

    if (finalScore >= questions.length * 0.8) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  if (!currentQ && !isFinished) {
    return <div className="text-center py-12 text-slate-500">Đang chuẩn bị câu hỏi...</div>;
  }

  // Quiz Finished Screen
  if (isFinished) {
    const accuracy = Math.round((score / questions.length) * 100);
    const xpBonus = Math.max(5, score * 3);

    return (
      <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#0071e3] to-sky-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 animate-bounce">
          <Trophy size={42} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400 block mb-1">
            Kết Quả Trắc Nghiệm • {topic.title}
          </span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
            {accuracy >= 80 ? 'Xuất Sắc! 🎉' : accuracy >= 50 ? 'Khá Lắm! Cố Lên 💪' : 'Cần Ôn Luyện Thêm! 📚'}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Độ chính xác</span>
            <span className="text-xl sm:text-2xl font-black text-[#0071e3] dark:text-sky-400">{accuracy}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Combo cao nhất</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <Flame size={18} /> {bestStreak}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Điểm thưởng</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">+{xpBonus} XP</span>
          </div>
        </div>

        {/* Wrong Words List */}
        {wrongWords.length > 0 && (
          <div className="text-left p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
              Từ vựng cần ôn lại ({wrongWords.length} từ):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {wrongWords.map((w, idx) => (
                <span 
                  key={idx}
                  onClick={() => speakWord(w.word)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-rose-200/80 dark:border-rose-900/60 flex items-center gap-1 cursor-pointer hover:border-[#0071e3]"
                  title="Bấm để nghe đọc"
                >
                  <Volume2 size={12} className="text-[#0071e3]" />
                  <span>{w.word}: {w.meaning}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={startQuiz}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw size={15} />
            <span>Thử Thách Lại</span>
          </button>
          {onSwitchToFlashcard && (
            <button
              onClick={onSwitchToFlashcard}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Zap size={15} />
              <span>Về Ôn Flashcard</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-3.5 sm:space-y-6">
      
      {/* Top Status: Question number & Streak indicator */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 sm:mb-1.5">
            <span>Câu {currentIndex + 1} / {questions.length}</span>
            <span>{score} đúng</span>
          </div>
          <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {streak >= 2 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20"
          >
            <Flame size={14} className="animate-pulse" />
            <span>{streak} COMBO!</span>
          </motion.div>
        )}
      </div>

      {/* Question Card */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_rgb(0,0,0,0.05)] text-center space-y-2 sm:space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400 block">
          {currentQ.isEnToVn ? 'Chọn nghĩa tiếng Việt đúng' : 'Chọn từ tiếng Anh phù hợp'}
        </span>

        <div className="flex items-center justify-center gap-2.5 sm:gap-3">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-snug">
            {currentQ.prompt}
          </h2>
          {currentQ.isEnToVn && (
            <button
              onClick={() => speakWord(currentQ.targetWord.word)}
              className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Nghe phát âm"
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>

        {currentQ.subPrompt && (
          <p className="text-xs sm:text-sm font-medium text-slate-400 font-mono">
            {currentQ.subPrompt}
          </p>
        )}
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-[#0071e3]/60 hover:bg-blue-50/30 dark:hover:bg-slate-800/80';

          if (isAnswered) {
            if (option.isCorrect) {
              btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25';
            } else if (isSelected && !option.isCorrect) {
              btnStyle = 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 animate-shake';
            } else {
              btnStyle = 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(option)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between gap-3 shadow-sm select-none cursor-pointer ${btnStyle}`}
            >
              <span className="flex-1">{option.text}</span>
              {isAnswered && option.isCorrect && <CheckCircle size={18} className="shrink-0" />}
              {isAnswered && isSelected && !option.isCorrect && <XCircle size={18} className="shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
