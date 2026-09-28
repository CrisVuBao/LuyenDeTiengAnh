import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, RotateCw, CheckCircle2, XCircle, ArrowLeft, ArrowRight, 
  Sparkles, Star, Shuffle, Play, Check, Trophy, CheckCheck, RotateCcw,
  Brain, Square, Headphones, SkipBack, SkipForward
} from 'lucide-react';
import toast from 'react-hot-toast';
import useVocabStore from '../store/useVocabStore';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import { getCardFsrsMetrics, getFsrsIntervalPreviews } from '../../../utils/fsrsScheduler';

export default function VocabFlashcardMode({ topic, onSwitchToQuiz, onReset }) {
  const words = topic?.words || [];

  const { 
    masteredWords, 
    starredWords, 
    fsrsCards,
    gradeWordFsrs,
    markWordMastered, 
    toggleStarred, 
    speakWord, 
    speechRate, 
    setSpeechRate, 
    autoPlayAudio, 
    toggleAutoPlayAudio,
    playEffect,
    topicLastIndex,
    topicLastWordId,
    topicFilterMode,
    setTopicLastPosition,
    setTopicFilterMode,
    resetTopicProgress
  } = useVocabStore();

  // Word Subsets
  const unmasteredList = useMemo(() => words.filter((w) => !masteredWords[w.id]), [words, masteredWords]);
  const starredList = useMemo(() => words.filter((w) => !!starredWords[w.id]), [words, starredWords]);

  // Helper to find best card index in any given deck
  const findBestIndexInDeck = useCallback((deck, targetWordId, fallbackIdx = 0) => {
    if (!deck || deck.length === 0) return 0;

    // 1. Exact match by word ID
    if (targetWordId) {
      const idx = deck.findIndex((w) => w.id === targetWordId);
      if (idx !== -1) return idx;
    }

    // 2. If target word was mastered, find the next sequential word in topic that exists in this deck
    if (targetWordId && words.length > 0) {
      const fullTargetIdx = words.findIndex((w) => w.id === targetWordId);
      if (fullTargetIdx !== -1) {
        for (let i = fullTargetIdx + 1; i < words.length; i++) {
          const nextId = words[i].id;
          const deckIdx = deck.findIndex((w) => w.id === nextId);
          if (deckIdx !== -1) return deckIdx;
        }
      }
    }

    // 3. Fallback to index if within bounds
    if (typeof fallbackIdx === 'number' && fallbackIdx >= 0 && fallbackIdx < deck.length) {
      return fallbackIdx;
    }

    return 0;
  }, [words]);

  // Get saved filter mode from store or smart default
  const getInitialFilterMode = useCallback(() => {
    const saved = topicFilterMode?.[topic?.id];
    const unmastered = words.filter((w) => !masteredWords[w.id]);
    const starred = words.filter((w) => !!starredWords[w.id]);

    if (saved === 'starred' && starred.length > 0) return 'starred';
    if (saved === 'all') return 'all';
    if (saved === 'unmastered' && unmastered.length > 0) return 'unmastered';
    return unmastered.length > 0 ? 'unmastered' : 'all';
  }, [topic?.id, topicFilterMode, words, masteredWords, starredWords]);

  const getDeckForMode = useCallback((mode) => {
    if (mode === 'unmastered') {
      const unmastered = words.filter((w) => !masteredWords[w.id]);
      return unmastered.length > 0 ? unmastered : words;
    }
    if (mode === 'starred') {
      const starred = words.filter((w) => !!starredWords[w.id]);
      return starred.length > 0 ? starred : words;
    }
    return words;
  }, [words, masteredWords, starredWords]);

  // Synchronously initialize state so 1st frame on F5 has the exact active card
  const [filterMode, setFilterMode] = useState(() => getInitialFilterMode());
  const [sessionDeck, setSessionDeck] = useState(() => {
    const mode = getInitialFilterMode();
    return getDeckForMode(mode);
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const mode = getInitialFilterMode();
    const deck = getDeckForMode(mode);
    const savedWordId = topicLastWordId?.[topic?.id];
    const savedIdx = topicLastIndex?.[topic?.id] || 0;
    return findBestIndexInDeck(deck, savedWordId, savedIdx);
  });

  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const handleResetTopic = () => {
    resetTopicProgress(topic.id);
    setShowResetConfirmModal(false);
    toast.success(`Đã đặt lại Chủ đề ${topic.id}! Bạn có thể bắt đầu học từ đầu.`);
    if (onReset) {
      onReset();
    } else {
      setFilterMode('unmastered');
      setSessionDeck(words);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setLearnedCount(0);
      setReviewCount(0);
    }
  };

  // Re-sync session deck ONLY if topic ID changes (never during card review)
  const prevTopicIdRef = useRef(topic?.id);
  useEffect(() => {
    if (prevTopicIdRef.current === topic?.id) return;
    prevTopicIdRef.current = topic?.id;

    const nextMode = getInitialFilterMode();
    const nextDeck = getDeckForMode(nextMode);
    const savedWordId = topicLastWordId?.[topic?.id];
    const savedIdx = topicLastIndex?.[topic?.id] || 0;
    const initialIdx = findBestIndexInDeck(nextDeck, savedWordId, savedIdx);

    setFilterMode(nextMode);
    setSessionDeck(nextDeck);
    setCurrentIndex(initialIdx);

    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCount(0);
    setReviewCount(0);
  }, [topic?.id, getInitialFilterMode, getDeckForMode, findBestIndexInDeck, topicLastWordId, topicLastIndex]);

  // Background cloud sync: re-align once if remote progress is received while user hasn't interacted
  const hasSyncedCloudRef = useRef(false);
  useEffect(() => {
    if (!topic?.id || hasSyncedCloudRef.current) return;
    const savedWordId = topicLastWordId?.[topic.id];
    if (savedWordId && currentIndex === 0 && sessionDeck.length > 0 && sessionDeck[0]?.id !== savedWordId) {
      const alignedIdx = findBestIndexInDeck(sessionDeck, savedWordId, topicLastIndex?.[topic.id] || 0);
      if (alignedIdx > 0) {
        setCurrentIndex(alignedIdx);
        hasSyncedCloudRef.current = true;
      }
    }
  }, [topicLastWordId, topicLastIndex, topic?.id, sessionDeck, currentIndex, findBestIndexInDeck]);

  // Switch Filter Tab without losing current position!
  const handleSwitchFilter = (nextMode) => {
    setFilterMode(nextMode);
    if (topic?.id) {
      setTopicFilterMode(topic.id, nextMode);
    }

    const targetDeck = getDeckForMode(nextMode);
    setSessionDeck(targetDeck);

    // Keep the exact word the user was currently looking at or start from 0 if coming from finished
    const targetWordId = isFinished ? null : (currentWord?.id || topicLastWordId?.[topic?.id]);
    const newIdx = isFinished ? 0 : findBestIndexInDeck(targetDeck, targetWordId, 0);

    setCurrentIndex(newIdx);
    if (topic?.id && targetDeck[newIdx]) {
      setTopicLastPosition(topic.id, newIdx, targetDeck[newIdx].id);
    }

    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCount(0);
    setReviewCount(0);
  };

  const currentWord = sessionDeck[currentIndex] || sessionDeck[0];
  const isMastered = !!(currentWord && masteredWords[currentWord.id]);
  const isStarred = !!(currentWord && starredWords[currentWord.id]);
  const currentCardFsrs = currentWord ? fsrsCards?.[currentWord.id] : null;
  const fsrsMetrics = useMemo(() => getCardFsrsMetrics(currentCardFsrs), [currentCardFsrs]);
  const fsrsPreviews = useMemo(() => getFsrsIntervalPreviews(currentCardFsrs, false), [currentCardFsrs]);

  // Continuous Auto-Play state for Flashcard mode
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const isAutoPlayingRef = useRef(false);
  const autoPlayTimerRef = useRef(null);

  const stopAutoPlay = useCallback(() => {
    isAutoPlayingRef.current = false;
    setIsAutoPlaying(false);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return () => stopAutoPlay();
  }, [topic?.id, stopAutoPlay]);

  // Continuous playback loop: Speak word -> flip to meaning -> advance to next card
  useEffect(() => {
    if (!isAutoPlaying || isFinished || !currentWord) return;

    setIsFlipped(false);
    speakWord(currentWord.word);

    const flipTimer = setTimeout(() => {
      if (!isAutoPlayingRef.current) return;
      setIsFlipped(true);
    }, speechRate === 0.8 ? 1700 : 1300);

    const nextTimer = setTimeout(() => {
      if (!isAutoPlayingRef.current) return;
      setIsFlipped(false);
      const nextIdx = (currentIndex + 1) % sessionDeck.length;
      setCurrentIndex(nextIdx);
      if (topic?.id && sessionDeck[nextIdx]) {
        setTopicLastPosition(topic.id, nextIdx, sessionDeck[nextIdx].id);
      }
    }, speechRate === 0.8 ? 3800 : 3000);

    autoPlayTimerRef.current = nextTimer;
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(nextTimer);
    };
  }, [isAutoPlaying, currentIndex, currentWord, isFinished, sessionDeck, speechRate, speakWord, topic?.id, setTopicLastPosition]);

  const toggleContinuousPlay = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      isAutoPlayingRef.current = true;
      setIsAutoPlaying(true);
    }
  };

  // Pronounce word when changing card (if autoPlayAudio is true and not already in continuous loop)
  useEffect(() => {
    if (currentWord && autoPlayAudio && !isFinished && !isAutoPlaying) {
      const timer = setTimeout(() => {
        speakWord(currentWord.word);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentWord, autoPlayAudio, isFinished, isAutoPlaying, speakWord]);

  // Award XP and advance daily quest on session finish
  useEffect(() => {
    if (isFinished && (learnedCount > 0 || reviewCount > 0)) {
      stopAutoPlay();
      const totalCards = learnedCount + reviewCount;
      const earnedXP = Math.max(10, (learnedCount * 3) + (reviewCount * 1));
      useGamificationStore.getState().earnXP(
        earnedXP,
        `vocab_flashcard:${totalCards}`,
        `Hoàn thành phiên lật thẻ từ vựng (${totalCards} thẻ)`
      );
    }
  }, [isFinished, learnedCount, reviewCount, stopAutoPlay]);

  // Snappy Flip Card
  const handleFlip = useCallback(() => {
    playEffect('flip');
    setIsFlipped((prev) => !prev);
  }, [playEffect]);

  // FSRS 4-Grade Review Handler (0: Again, 1: Hard, 2: Good, 3: Easy)
  const handleFsrsGrade = useCallback((grade) => {
    if (!currentWord) return;
    hasSyncedCloudRef.current = true;

    if (grade >= 2) {
      playEffect('correct');
      setLearnedCount((c) => c + 1);
    } else {
      playEffect('wrong');
      setReviewCount((c) => c + 1);
    }

    gradeWordFsrs(currentWord.id, grade);
    setIsFlipped(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex < sessionDeck.length) {
      const nextWord = sessionDeck[nextIndex];
      setCurrentIndex(nextIndex);
      if (topic?.id && nextWord) {
        setTopicLastPosition(topic.id, nextIndex, nextWord.id);
      }
    } else {
      setIsFinished(true);
      if (topic?.id) {
        setTopicLastPosition(topic.id, 0, null);
      }
    }
  }, [currentWord, currentIndex, sessionDeck, topic?.id, gradeWordFsrs, setTopicLastPosition, playEffect]);

  // Next Word (Đã thuộc hoặc Chưa nhớ) - Maps to FSRS Good (2) or Again (0)
  const handleNextWord = useCallback((mastered) => {
    handleFsrsGrade(mastered ? 2 : 0);
  }, [handleFsrsGrade]);

  // Previous Card Navigation - Saves both index and word ID!
  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      const prevIdx = currentIndex - 1;
      const prevWord = sessionDeck[prevIdx];
      setCurrentIndex(prevIdx);
      if (topic?.id && prevWord) {
        setTopicLastPosition(topic.id, prevIdx, prevWord.id);
      }
    }
  }, [currentIndex, sessionDeck, topic?.id, setTopicLastPosition]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        handleFsrsGrade(0);
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        handleFsrsGrade(1);
      } else if (e.code === 'Digit3' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleFsrsGrade(2); // Nhớ tốt
      } else if (e.code === 'Digit4') {
        e.preventDefault();
        handleFsrsGrade(3); // Quá dễ
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleFsrsGrade(0); // Quên hẳn
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
  }, [handleFlip, handleFsrsGrade, handlePrevCard, currentWord, isFinished, speakWord]);

  const handleRestart = () => {
    stopAutoPlay();
    setCurrentIndex(0);
    const firstWord = sessionDeck[0];
    if (topic?.id) {
      setTopicLastPosition(topic.id, 0, firstWord?.id || null);
    }
    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCount(0);
    setReviewCount(0);
  };

  const handleShuffle = () => {
    stopAutoPlay();
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
            <span>Ôn Tập Toàn Bộ ({words.length})</span>
          </button>
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Học Lại Chủ Đề Từ Đầu</span>
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
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/60 text-[#0071e3] dark:text-sky-400 font-bold text-xs">
            <Sparkles size={13} />
            <span>+{Math.max(10, (learnedCount * 3) + (reviewCount * 1))} XP Thưởng Hoàn Thành</span>
          </div>
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

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
          {remainingUnmastered > 0 ? (
            <button
              onClick={() => handleSwitchFilter('unmastered')}
              className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <RotateCw size={15} />
              <span>Tiếp Tục Học ({remainingUnmastered} từ)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Học Lại Chủ Đề Từ Đầu</span>
            </button>
          )}

          <button
            onClick={handleRestart}
            className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw size={15} />
            <span>Luyện Lại Bộ Thẻ Này</span>
          </button>

          {remainingUnmastered > 0 && (
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="py-3 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/60 dark:border-amber-800/40"
              title="Đặt lại toàn bộ tiến độ chủ đề này để học lại từ đầu"
            >
              <RotateCcw size={14} />
              <span>Reset từ đầu</span>
            </button>
          )}

          {onSwitchToQuiz && (
            <button
              onClick={onSwitchToQuiz}
              className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
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

  const progressPercent = sessionDeck.length > 0 
    ? Math.min(100, Math.round(((currentIndex + 1) / sessionDeck.length) * 100)) 
    : 0;

  return (
    <div className="max-w-xl mx-auto space-y-3 sm:space-y-4">
      
      {/* 1. Deck Filter Tabs (Apple Pill Design) */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] sm:text-xs">
        <button
          onClick={() => handleSwitchFilter('unmastered')}
          className={`flex-1 py-1.5 px-2 sm:px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
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
          className={`flex-1 py-1.5 px-2 sm:px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
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
          className={`flex-1 py-1.5 px-2 sm:px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            filterMode === 'starred'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={starredList.length === 0 ? 'Chưa có từ nào được đánh dấu sao' : 'Danh sách từ vựng bạn đã đánh dấu sao'}
        >
          <Star size={12} fill={starredList.length > 0 ? 'currentColor' : 'none'} className={`shrink-0 ${starredList.length > 0 ? 'text-amber-500' : ''}`} />
          <span className="sm:hidden">Gắn sao</span>
          <span className="hidden sm:inline">Đã gắn sao</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            filterMode === 'starred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-800'
          }`}>
            {starredList.length}
          </span>
        </button>
      </div>

      {/* 2. Top Controls: Session progress, Continuous Play & Settings */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 pt-0.5 sm:pt-1">
        <div className="flex-1">
          <div className="flex justify-between items-center text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Thẻ {currentIndex + 1} / {sessionDeck.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
              <ArrowLeft size={15} />
            </button>
          )}
          <button
            onClick={toggleContinuousPlay}
            title={isAutoPlaying ? 'Dừng phát liên tục' : 'Phát liên tục toàn bộ thẻ'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm animate-pulse'
                : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#0071e3] dark:text-sky-400 border border-blue-200/60 dark:border-blue-800/60'
            }`}
          >
            {isAutoPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            <span>{isAutoPlaying ? 'Dừng' : 'Phát liên tục'}</span>
          </button>
          <button
            onClick={handleShuffle}
            title="Đảo ngẫu nhiên danh sách"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
          >
            <Shuffle size={15} />
          </button>
          {words.length - unmasteredList.length > 0 && (
            <button
              onClick={() => setShowResetConfirmModal(true)}
              title="Đặt lại toàn bộ tiến độ chủ đề này để học lại từ đầu"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>
          )}
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

      {/* FSRS DSR Memory Model Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
          <Brain size={13} />
          <span>FSRS AI • {fsrsMetrics.statusLabel}</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
          <span title="Stability (S): Độ bền trí nhớ (ngày)">
            Độ bền S: <strong className="text-slate-800 dark:text-slate-200">{fsrsMetrics.stability > 0 ? `${fsrsMetrics.stability}d` : 'Mới'}</strong>
          </span>
          <span title="Difficulty (D): Độ khó của từ (1-10)">
            Độ khó D: <strong className="text-slate-800 dark:text-slate-200">{fsrsMetrics.difficulty}/10</strong>
          </span>
          <span title="Retrievability (R): Xác suất gợi nhớ hiện tại">
            Nhớ R: <strong className="text-emerald-600 dark:text-emerald-400">{fsrsMetrics.retrievability}%</strong>
          </span>
        </div>
      </div>

      {/* 3. 3D Flip Card Container (Instant, Snappy Flip - No Lag) */}
      <div 
        onClick={handleFlip}
        className="relative h-[260px] sm:h-[360px] w-full cursor-pointer select-none perspective-[1200px]"
      >
        <motion.div
          className="w-full h-full relative [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.50, ease: [0.30, 1, 0.8, 1] }}
        >
          {/* Card Front: English Word & Audio */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_35px_rgb(0,0,0,0.06)] flex flex-col justify-between [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] dark:text-sky-400 border border-blue-200/60 dark:border-blue-900/60">
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
            <div className="text-center space-y-2 sm:space-y-3 my-auto">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentWord.word}
              </h2>
              {currentWord.ipa && (
                <p className="text-xs sm:text-base font-medium text-slate-500 dark:text-slate-400 font-mono tracking-wide">
                  {currentWord.ipa}
                </p>
              )}
            </div>

            {/* Bottom Actions of Front */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(currentWord.word);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer active:scale-95"
              >
                <Volume2 size={15} />
                <span>Nghe phát âm</span>
              </button>

              <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 font-medium">
                <RotateCw size={13} />
                <span>Chạm để lật nghĩa</span>
              </span>
            </div>
          </div>

          {/* Card Back: Vietnamese Meaning & IPA */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-white/10 text-sky-300 border border-white/10">
                Nghĩa tiếng Việt
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentWord.ipa}</span>
            </div>

            {/* Meaning Center */}
            <div className="text-center space-y-2 sm:space-y-3 my-auto px-2 sm:px-4">
              <span className="text-xs text-sky-400 font-bold uppercase tracking-widest block">
                {currentWord.word} ({currentWord.pos})
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-amber-300 leading-snug">
                {currentWord.meaning}
              </h3>
            </div>

            <div className="flex items-center justify-center pt-3 sm:pt-4 border-t border-white/10 text-[11px] sm:text-xs text-slate-400 gap-1">
              <span>Chọn mức độ nhớ bên dưới để FSRS lên lịch ôn tối ưu</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. FSRS 4-Grade Decision Buttons with Live Next-Interval Previews */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <button
          onClick={() => handleFsrsGrade(0)}
          className="py-2.5 sm:py-3 px-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold flex flex-col items-center gap-0.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="font-black text-xs sm:text-sm">Quên hẳn</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 font-extrabold">
            {fsrsPreviews[0]} [1/←]
          </span>
        </button>

        <button
          onClick={() => handleFsrsGrade(1)}
          className="py-2.5 sm:py-3 px-3 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-bold flex flex-col items-center gap-0.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="font-black text-xs sm:text-sm">Thấy khó</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/50 font-extrabold">
            {fsrsPreviews[1]} [2]
          </span>
        </button>

        <button
          onClick={() => handleFsrsGrade(2)}
          className="py-2.5 sm:py-3 px-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex flex-col items-center gap-0.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="font-black text-xs sm:text-sm">Nhớ tốt ✓</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 font-extrabold">
            {fsrsPreviews[2]} [3/→]
          </span>
        </button>

        <button
          onClick={() => handleFsrsGrade(3)}
          className="py-2.5 sm:py-3 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex flex-col items-center gap-0.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="font-black text-xs sm:text-sm">Quá dễ ⚡</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 font-extrabold">
            {fsrsPreviews[3]} [4]
          </span>
        </button>
      </div>

      {/* Keyboard Shortcut Tips */}
      <div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">Space</kbd> Lật thẻ</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">A / ↑</kbd> Nghe đọc</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">1-4</kbd> Mức độ FSRS</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">P / ↓</kbd> Thẻ trước</span>
      </div>

      {/* FLOATING STICKY BOTTOM PLAYBACK BAR WHEN CONTINUOUS FLASHCARD PLAYBACK IS ACTIVE */}
      {isAutoPlaying && currentWord && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl px-4 py-3 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-sky-400 flex items-center justify-center shrink-0">
              <Headphones size={18} className="animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                <span>Đang phát thẻ ({currentIndex + 1}/{sessionDeck.length})</span>
                <span>•</span>
                <span>{speechRate}x</span>
              </div>
              <p className="text-xs sm:text-sm font-black truncate">
                {currentWord.word} <span className="font-normal text-slate-300">— {currentWord.meaning}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrevCard}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Thẻ trước"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % sessionDeck.length)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Thẻ tiếp theo"
            >
              <SkipForward size={15} />
            </button>
            <button
              onClick={stopAutoPlay}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              title="Dừng phát liên tục ngay lập tức"
            >
              <Square size={13} fill="currentColor" />
              <span>Dừng Phát</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div 
            onClick={() => setShowResetConfirmModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Đặt Lại Chủ Đề {topic?.id}?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {topic?.title}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                Toàn bộ từ bạn đã đánh dấu thuộc trong chủ đề này sẽ được chuyển về trạng thái <strong>Chưa thuộc</strong> và vị trí học sẽ quay về thẻ số 1 để bạn luyện tập lại từ đầu.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleResetTopic}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Xác Nhận Đặt Lại</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
