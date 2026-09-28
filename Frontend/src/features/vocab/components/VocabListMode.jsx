import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, Star, CheckCircle2, Search, 
  Play, Square
} from 'lucide-react';
import useVocabStore from '../store/useVocabStore';

export default function VocabListMode({ topic }) {
  const words = topic?.words || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'mastered', 'unmastered', 'starred'
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [singleSpeakingId, setSingleSpeakingId] = useState(null);

  const isAutoPlayingRef = useRef(false);
  const autoPlayTimerRef = useRef(null);
  const singleSpeakTimerRef = useRef(null);
  const rowRefs = useRef({});

  const { 
    masteredWords, 
    starredWords, 
    markWordMastered, 
    toggleStarred, 
    speakWord,
    speechRate
  } = useVocabStore();

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchSearch = 
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const isM = !!masteredWords[w.id];
      const isS = !!starredWords[w.id];

      if (filterType === 'mastered') return isM;
      if (filterType === 'unmastered') return !isM;
      if (filterType === 'starred') return isS;
      return true;
    });
  }, [words, searchTerm, filterType, masteredWords, starredWords]);

  const stopAutoPlay = useCallback(() => {
    isAutoPlayingRef.current = false;
    setIsAutoPlaying(false);
    setSingleSpeakingId(null);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (singleSpeakTimerRef.current) {
      clearTimeout(singleSpeakTimerRef.current);
      singleSpeakTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Stop auto-play on unmount or topic change
  useEffect(() => {
    return () => stopAutoPlay();
  }, [topic?.id, stopAutoPlay]);

  const playWordAtIndex = useCallback((idx, list) => {
    if (!isAutoPlayingRef.current || !list || list.length === 0) {
      stopAutoPlay();
      return;
    }

    const safeIdx = ((idx % list.length) + list.length) % list.length;
    const item = list[safeIdx];
    if (!item) {
      stopAutoPlay();
      return;
    }

    setPlayingIndex(safeIdx);

    // Auto-scroll active word into view smoothly
    const rowEl = rowRefs.current[item.id || safeIdx];
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    speakWord(item.word);

    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    autoPlayTimerRef.current = setTimeout(() => {
      if (!isAutoPlayingRef.current) return;
      const nextIdx = (safeIdx + 1) % list.length;
      playWordAtIndex(nextIdx, list);
    }, speechRate === 0.8 ? 2800 : 2200);
  }, [speakWord, speechRate, stopAutoPlay]);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      if (filteredWords.length === 0) return;
      setSingleSpeakingId(null);
      isAutoPlayingRef.current = true;
      setIsAutoPlaying(true);
      const startIdx = playingIndex < filteredWords.length ? playingIndex : 0;
      playWordAtIndex(startIdx, filteredWords);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Continuous Play & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ trong bài..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium outline-none focus:border-[#0071e3]"
            />
          </div>

          {/* Continuous Auto-Play Button */}
          <button
            onClick={toggleAutoPlay}
            disabled={filteredWords.length === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer disabled:opacity-40 ${
              isAutoPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 animate-pulse'
                : 'bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-blue-500/20'
            }`}
          >
            {isAutoPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            <span>{isAutoPlaying ? 'Dừng Phát' : 'Phát Liên Tục'}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto whitespace-nowrap hide-scrollbar pb-0.5 sm:pb-0 w-full sm:w-auto">
          {[
            { id: 'all', label: `Tất cả (${words.length})` },
            { id: 'mastered', label: 'Đã thuộc' },
            { id: 'unmastered', label: 'Chưa thuộc' },
            { id: 'starred', label: 'Đánh dấu' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Words List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredWords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Không tìm thấy từ vựng phù hợp với tìm kiếm.
          </div>
        ) : (
          filteredWords.map((item, index) => {
            const isM = !!masteredWords[item.id];
            const isS = !!starredWords[item.id];
            const rowKey = item.id || index;
            const isCurrentlyPlaying = (isAutoPlaying && playingIndex === index) || singleSpeakingId === rowKey;

            return (
              <div 
                key={rowKey}
                ref={(el) => { rowRefs.current[rowKey] = el; }}
                className={`p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 transition-colors ${
                  isCurrentlyPlaying
                    ? 'bg-blue-50/90 dark:bg-blue-950/50 ring-1 ring-inset ring-[#0071e3]/40'
                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Left: Speaker/Stop Button + Word, Pos, IPA, Meaning */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    onClick={() => {
                      if (isCurrentlyPlaying) {
                        stopAutoPlay();
                        return;
                      }
                      if (isAutoPlaying) {
                        stopAutoPlay();
                      }
                      setPlayingIndex(index);
                      setSingleSpeakingId(rowKey);
                      speakWord(item.word);
                      if (singleSpeakTimerRef.current) clearTimeout(singleSpeakTimerRef.current);
                      singleSpeakTimerRef.current = setTimeout(() => {
                        setSingleSpeakingId((prev) => (prev === rowKey ? null : prev));
                      }, 1400);
                    }}
                    className={`h-9 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                      isCurrentlyPlaying
                        ? 'px-2.5 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/30 ring-2 ring-rose-300 dark:ring-rose-800'
                        : 'w-9 bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400'
                    }`}
                    title={isCurrentlyPlaying ? 'Bấm để dừng phát ngay tại từ này' : 'Nghe phát âm'}
                  >
                    {isCurrentlyPlaying ? (
                      <>
                        <Square size={12} fill="currentColor" />
                        <span>Dừng</span>
                      </>
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {item.word}
                      </span>
                      {item.pos && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {item.pos}
                        </span>
                      )}
                      {item.ipa && (
                        <span className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">
                          {item.ipa}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                      {item.meaning}
                    </p>
                  </div>
                </div>

                {/* Right: Actions (Star & Mastered toggle) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleStarred(item.id)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isS 
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' 
                        : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isS ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
                  >
                    <Star size={16} fill={isS ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={() => markWordMastered(item.id, !isM)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isM 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={isM ? 'Đã thuộc từ này' : 'Bấm để đánh dấu đã thuộc'}
                  >
                    <CheckCircle2 size={14} />
                    <span className="hidden sm:inline">{isM ? 'Đã thuộc' : 'Thuộc'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
