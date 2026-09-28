import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, HelpCircle, CheckCircle2, XCircle, RotateCw, 
  Sparkles, ArrowRight, Lightbulb, Trophy
} from 'lucide-react';
import useVocabStore from '../store/useVocabStore';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import confetti from 'canvas-confetti';

export default function VocabSpellingMode({ topic, onSwitchToFlashcard }) {
  const words = topic?.words || [];
  const { speakWord, playEffect, markWordMastered } = useVocabStore();

  const [testWords, setTestWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [revealedChars, setRevealedChars] = useState({});
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef(null);

  // Initialize 10 random words for spelling
  const initSpelling = () => {
    const picked = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    setTestWords(picked);
    setCurrentIndex(0);
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setRevealedChars({});
    setScore(0);
    setIsFinished(false);
  };

  useEffect(() => {
    initSpelling();
  }, [topic]);

  const currentWord = testWords[currentIndex];

  // Auto focus input and speak audio
  useEffect(() => {
    if (currentWord && !isFinished) {
      setUserInput('');
      setIsAnswered(false);
      setIsCorrect(false);
      setRevealedChars({});
      setTimeout(() => {
        speakWord(currentWord.word);
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [currentIndex, testWords, isFinished, speakWord]);

  // Award XP and complete quest on spelling session finish (only when score > 0)
  useEffect(() => {
    if (isFinished && testWords.length > 0 && score > 0) {
      const earnedXP = Math.min(20, score * 2);
      useGamificationStore.getState().earnXP(
        earnedXP,
        `vocab_spelling:${score}`,
        `Luyện chính tả từ vựng: đúng ${score}/${testWords.length} từ`
      );
    }
  }, [isFinished, score, testWords.length]);

  const normalize = (str) => str.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isAnswered || !currentWord) return;

    const userClean = normalize(userInput);
    const targetClean = normalize(currentWord.word);

    const correct = userClean === targetClean;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      playEffect('correct');
      setScore((s) => s + 1);
      markWordMastered(currentWord.id, true);
    } else {
      playEffect('wrong');
    }

    setTimeout(() => {
      if (currentIndex + 1 < testWords.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setIsFinished(true);
        if (score + (correct ? 1 : 0) >= testWords.length * 0.8) {
          try {
            confetti({ particleCount: 100, spread: 60 });
          } catch {}
        }
      }
    }, 1500);
  };

  const handleRevealHint = () => {
    if (!currentWord || isAnswered) return;
    const wordClean = currentWord.word.toLowerCase();
    const unrevealedIndices = [];
    for (let i = 0; i < wordClean.length; i++) {
      if (!revealedChars[i] && wordClean[i] !== ' ') {
        unrevealedIndices.push(i);
      }
    }
    if (unrevealedIndices.length > 0) {
      const randIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setRevealedChars((prev) => ({ ...prev, [randIdx]: wordClean[randIdx] }));
    }
  };

  if (!currentWord && !isFinished) {
    return <div className="text-center py-12 text-slate-500">Đang chuẩn bị bài tập...</div>;
  }

  if (isFinished) {
    const accuracy = Math.round((score / testWords.length) * 100);
    return (
      <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-bounce">
          <Trophy size={42} />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-1">
            Luyện Gõ Chính Tả • {topic.title}
          </span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
            Đúng {score}/{testWords.length} Từ ({accuracy}%)
          </h3>
          {score > 0 && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <Sparkles size={13} />
              <span>+{Math.min(20, score * 2)} XP Thưởng Chính Tả</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={initSpelling}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw size={15} />
            <span>Thử Thách Lại</span>
          </button>
          {onSwitchToFlashcard && (
            <button
              onClick={onSwitchToFlashcard}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Về Ôn Flashcard</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / testWords.length) * 100);
  const targetChars = currentWord.word.split('');

  return (
    <div className="max-w-xl mx-auto space-y-3.5 sm:space-y-6">
      
      {/* Top progress */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex justify-between items-center text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Câu {currentIndex + 1} / {testWords.length}</span>
          <span>{score} đúng</span>
        </div>
        <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Dictation Card */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_rgb(0,0,0,0.05)] text-center space-y-3.5 sm:space-y-5">
        
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => speakWord(currentWord.word)}
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Bấm để nghe lại"
          >
            <Volume2 size={26} className="sm:w-[30px] sm:h-[30px]" />
          </button>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Nghĩa tiếng Việt
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
            {currentWord.meaning}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Từ loại: <strong className="text-[#0071e3]">{currentWord.pos || 'n'}</strong> • {currentWord.ipa}
          </p>
        </div>

        {/* Letter Slots / Hint Display */}
        <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 pt-1 sm:pt-2">
          {targetChars.map((ch, idx) => {
            if (ch === ' ') {
              return <span key={idx} className="w-3 sm:w-4" />;
            }
            const revealed = revealedChars[idx] || (isAnswered && ch);
            return (
              <span
                key={idx}
                className={`w-7 h-9 sm:w-8 sm:h-10 rounded-lg border flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-colors ${
                  revealed 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 text-[#0071e3] dark:text-sky-400' 
                    : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {revealed || '_'}
              </span>
            );
          })}
        </div>

        {/* Input Field */}
        <form onSubmit={handleSubmit} className="pt-1 sm:pt-2">
          <input
            ref={inputRef}
            type="text"
            disabled={isAnswered}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Gõ từ tiếng Anh bạn nghe được..."
            className={`w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl border text-center font-bold text-base sm:text-lg outline-none transition-all ${
              isAnswered 
                ? isCorrect 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                  : 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-[#0071e3] focus:ring-2 focus:ring-blue-100 text-slate-900 dark:text-white'
            }`}
          />
        </form>

        {/* Answer Feedback */}
        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-bold flex items-center justify-center gap-1.5 ${
              isCorrect ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 size={16} />
                <span>Chính xác tuyệt đối!</span>
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span>Đáp án đúng: <strong>{currentWord.word}</strong></span>
              </>
            )}
          </motion.div>
        )}

        {/* Hint button */}
        {!isAnswered && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleRevealHint}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb size={13} />
              <span>Gợi ý 1 chữ cái</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
