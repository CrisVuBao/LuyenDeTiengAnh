import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, RotateCw, CheckCircle2, XCircle, ArrowLeft, ArrowRight, 
  Sparkles, Star, Shuffle, Play, Check, Trophy, CheckCheck, RotateCcw
} from 'lucide-react';
import useVocabStore from '../store/useVocabStore';

export default function VocabFlashcardMode({ topic, onSwitchToQuiz }) {
  const words = topic?.words || [];

  const { 
    masteredWords, 
    starredWords, 
    markWordMastered, 
    toggleStarred, 
    speakWord, 
    speechRate, 
    setSpeechRate, 
    autoPlayAudio, 
    toggleAutoPlayAudio,
    playEffect,
    topicLastIndex,
    setTopicLastIndex
  } = useVocabStore();

  // Word Subsets
  const unmasteredList = useMemo(() => words.filter((w) => !masteredWords[w.id]), [words, masteredWords]);
  const starredList = useMemo(() => words.filter((w) => !!starredWords[w.id]), [words, starredWords]);

  // Filter modes: 'unmastered' (Chưa thuộc), 'all' (Tất cả), 'starred' (Đã gắn sao)
  // Smart default: If unmastered words exist, prioritize unmastered so user doesn't repeat learned words!
  const [filterMode, setFilterMode] = useState(() => (unmasteredList.length > 0 ? 'unmastered' : 'all'));
  const [sessionDeck, setSessionDeck] = useState(() => (unmasteredList.length > 0 ? unmasteredList : words));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Initialize or re-sync session deck when topic changes
  useEffect(() => {
    const unmastered = words.filter((w) => !masteredWords[w.id]);
    const nextMode = unmastered.length > 0 ? 'unmastered' : 'all';
    const nextDeck = nextMode === 'unmastered' ? unmastered : words;

    setFilterMode(nextMode);
    setSessionDeck(nextDeck);

    // Resume from saved index if valid
    const savedIdx = topicLastIndex?.[topic?.id] || 0;
    const initialIdx = (savedIdx >= 0 && savedIdx < nextDeck.length) ? savedIdx : 0;
    setCurrentIndex(initialIdx);

    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCount(0);
    setReviewCount(0);
  }, [topic?.id]); // Re-initialize only when topic ID actually changes

  // Switch Filter Tab
  const handleSwitchFilter = (mode) => {
    setFilterMode(mode);
    let targetDeck = words;
    if (mode === 'unmastered') {
      targetDeck = words.filter((w) => !masteredWords[w.id]);
    } else if (mode === 'starred') {
      targetDeck = words.filter((w) => !!starredWords[w.id]);
    }

    setSessionDeck(targetDeck);
    setCurrentIndex(0);
    if (topic?.id) {
      setTopicLastIndex(topic.id, 0);
    }
    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCount(0);
    setReviewCount(0);
  };

  const currentWord = sessionDeck[currentIndex] || sessionDeck[0];
  const isMastered = !!(currentWord && masteredWords[currentWord.id]);
  const isStarred = !!(currentWord && starredWords[currentWord.id]);

  // Pronounce word when changing card (if autoPlayAudio is true)
  useEffect(() => {
    if (currentWord && autoPlayAudio && !isFinished) {
      const timer = setTimeout(() => {
        speakWord(currentWord.word);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentWord, autoPlayAudio, isFinished, speakWord]);

  // Snappy Flip Card
  const handleFlip = useCallback(() => {
    playEffect('flip');
    setIsFlipped((prev) => !prev);
  }, [playEffect]);

  // Next Word (Đã thuộc hoặc Chưa nhớ)
  const handleNextWord = useCallback((mastered) => {
    if (!currentWord) return;

    if (mastered) {
      playEffect('correct');
      markWordMastered(currentWord.id, true);
      setLearnedCount((c) => c + 1);
    } else {
      playEffect('wrong');
      markWordMastered(currentWord.id, false);
      setReviewCount((c) => c + 1);
    }

    setIsFlipped(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex < sessionDeck.length) {
      setCurrentIndex(nextIndex);
      if (topic?.id) setTopicLastIndex(topic.id, nextIndex);
    } else {
      setIsFinished(true);
      if (topic?.id) setTopicLastIndex(topic.id, 0);
    }
  }, [currentWord, currentIndex, sessionDeck.length, topic?.id, markWordMastered, setTopicLastIndex, playEffect]);

  // Previous Card Navigation
  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (topic?.id) setTopicLastIndex(topic.id, prevIdx);
    }
  }, [currentIndex, topic?.id, setTopicLastIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextWord(true); // Đã thuộc
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleNextWord(false); // Chưa nhớ
      } else if (e.code === 'KeyA' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (currentWord) speakWord(currentWord.word);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyP') {
        e.preventDefault();
        handlePrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNextWord, handlePrevCard, currentWord, isFinished, speakWord]);

  const handleRestart = () => {
    setCurrentIndex(0);
    if (topic?.id) setTopicLastIndex(topic.id, 0);
    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCount(0);
    setReviewCount(0);
  };

  const handleShuffle = () => {
    const shuffled = [...sessionDeck].sort(() => Math.random() - 0.5);
    setSessionDeck(shuffled);
    handleRestart();
  };

  // State: Topic empty
  if (!words || words.length === 0) {
    return <div className="text-center py-12 text-slate-500">Chủ đề chưa có từ vựng.</div>;
  }

  // State: All words in topic already mastered and user is on "Chưa thuộc" filter
  if (filterMode === 'unmastered' && unmasteredList.length === 0 && !isFinished) {
    return (
      <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
          <CheckCheck size={42} className="text-slate-950" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
            Chủ Đề Hoàn Hảo!
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            Bạn Đã Thuộc Hết {words.length}/{words.length} Từ!
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Không còn từ nào chưa thuộc trong chủ đề <strong>{topic.title}</strong>. Bạn có thể ôn lại toàn bộ hoặc thử thách trắc nghiệm.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => handleSwitchFilter('all')}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw size={15} />
            <span>Ôn Tập Lại Tất Cả ({words.length})</span>
          </button>
          {onSwitchToQuiz && (
            <button
              onClick={onSwitchToQuiz}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Thử Thách Trắc Nghiệm</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // State: Finished session screen
  if (isFinished) {
    const totalInDeck = sessionDeck.length;
    const remainingUnmastered = words.filter((w) => !masteredWords[w.id]).length;

    return (
      <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 animate-bounce">
          <Trophy size={40} className="text-slate-900" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            Hoàn Thành Phiên Ôn Tập!
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bạn vừa luyện xong {totalInDeck} thẻ từ vựng chủ đề <strong>{topic.title}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">Đã ghi nhớ</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{learnedCount} từ</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block">Cần ôn lại</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{reviewCount} từ</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {remainingUnmastered > 0 ? (
            <button
              onClick={() => handleSwitchFilter('unmastered')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <RotateCw size={15} />
              <span>Tiếp Tục Học Từ Chưa Nhớ ({remainingUnmastered})</span>
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw size={15} />
              <span>Luyện Lại Từ Đầu</span>
            </button>
          )}

          {onSwitchToQuiz && (
            <button
              onClick={onSwitchToQuiz}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Thử Thách Trắc Nghiệm</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return <div className="text-center py-12 text-slate-500">Không có từ vựng nào trong danh mục này.</div>;
  }

  const progressPercent = Math.round(((currentIndex + 1) / sessionDeck.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      
      {/* 1. Deck Filter Tabs (Apple Pill Design) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
        <button
          onClick={() => handleSwitchFilter('unmastered')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filterMode === 'unmastered'
              ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Chỉ hiển thị các từ bạn chưa ghi nhớ"
        >
          <span>Chưa thuộc</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            filterMode === 'unmastered' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-sky-300' : 'bg-slate-200 dark:bg-slate-800'
          }`}>
            {unmasteredList.length}
          </span>
        </button>

        <button
          onClick={() => handleSwitchFilter('all')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filterMode === 'all'
              ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Toàn bộ từ vựng trong chủ đề này"
        >
          <span>Tất cả</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            filterMode === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-sky-300' : 'bg-slate-200 dark:bg-slate-800'
          }`}>
            {words.length}
          </span>
        </button>

        <button
          onClick={() => handleSwitchFilter('starred')}
          disabled={starredList.length === 0}
          className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            filterMode === 'starred'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={starredList.length === 0 ? 'Chưa có từ nào được đánh dấu sao' : 'Danh sách từ vựng bạn đã đánh dấu sao'}
        >
          <Star size={12} fill={starredList.length > 0 ? 'currentColor' : 'none'} className={starredList.length > 0 ? 'text-amber-500' : ''} />
          <span>Đã gắn sao</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            filterMode === 'starred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-800'
          }`}>
            {starredList.length}
          </span>
        </button>
      </div>

      {/* 2. Top Controls: Session progress & Settings */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex-1">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Tiến độ thẻ: {currentIndex + 1} / {sessionDeck.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevCard}
              title="Quay lại thẻ trước [P / ↓]"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            onClick={handleShuffle}
            title="Đảo ngẫu nhiên danh sách"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
          >
            <Shuffle size={15} />
          </button>
          <button
            onClick={() => setSpeechRate(speechRate === 1.0 ? 0.8 : 1.0)}
            title="Tốc độ giọng đọc"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              speechRate === 0.8 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {speechRate}x
          </button>
        </div>
      </div>

      {/* 3. 3D Flip Card Container (Instant, Snappy Flip - No Lag) */}
      <div 
        onClick={handleFlip}
        className="relative h-[340px] sm:h-[380px] w-full cursor-pointer select-none perspective-[1200px]"
      >
        <motion.div
          className="w-full h-full relative [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.50, ease: [0.30, 1, 0.8, 1] }}
        >
          {/* Card Front: English Word & Audio */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_35px_rgb(0,0,0,0.06)] flex flex-col justify-between [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] dark:text-sky-400 border border-blue-200/60 dark:border-blue-900/60">
                  {currentWord.pos || 'vocabulary'}
                </span>
                {isMastered && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Check size={11} /> Đã thuộc
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStarred(currentWord.id);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isStarred 
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' 
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu từ quan trọng'}
              >
                <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Word Center */}
            <div className="text-center space-y-3 my-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentWord.word}
              </h2>
              {currentWord.ipa && (
                <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 font-mono tracking-wide">
                  {currentWord.ipa}
                </p>
              )}
            </div>

            {/* Bottom Actions of Front */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(currentWord.word);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer active:scale-95"
              >
                <Volume2 size={16} />
                <span>Nghe phát âm</span>
              </button>

              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <RotateCw size={13} />
                <span>Chạm để lật nghĩa</span>
              </span>
            </div>
          </div>

          {/* Card Back: Vietnamese Meaning & IPA */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl p-8 bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-sky-300 border border-white/10">
                Nghĩa tiếng Việt
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentWord.ipa}</span>
            </div>

            {/* Meaning Center */}
            <div className="text-center space-y-3 my-auto px-4">
              <span className="text-xs text-sky-400 font-bold uppercase tracking-widest block">
                {currentWord.word} ({currentWord.pos})
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300">
                {currentWord.meaning}
              </h3>
            </div>

            <div className="flex items-center justify-center pt-4 border-t border-white/10 text-xs text-slate-400 gap-1">
              <span>Đánh giá mức độ ghi nhớ của bạn ở bên dưới</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decision Buttons: "Chưa nhớ" vs "Đã thuộc" */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleNextWord(false)}
          className="py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <XCircle size={18} />
          <span>Chưa Nhớ</span>
          <span className="hidden sm:inline text-[11px] opacity-60 font-mono ml-1">[←]</span>
        </button>

        <button
          onClick={() => handleNextWord(true)}
          className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <CheckCircle2 size={18} />
          <span>Đã Thuộc</span>
          <span className="hidden sm:inline text-[11px] opacity-75 font-mono ml-1">[→]</span>
        </button>
      </div>

      {/* Keyboard Shortcut Tips */}
      <div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">Space</kbd> Lật thẻ</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">A / ↑</kbd> Nghe đọc</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">←</kbd> Chưa nhớ</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">→</kbd> Đã thuộc</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">P / ↓</kbd> Thẻ trước</span>
      </div>
    </div>
  );
}
