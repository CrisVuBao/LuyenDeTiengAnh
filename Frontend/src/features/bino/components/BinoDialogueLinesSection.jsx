import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Repeat1, Headphones, Square, Volume2,
  MessageCircle, Target, Columns2, Mic, MicOff,
  ChevronLeft, ChevronRight, User, Sparkles, Check
} from 'lucide-react';
import BinoSentenceExpansionCard from './BinoSentenceExpansionCard';
import { getExpansionsForLine } from '../data/binoSentenceExpansions';

const checkIsInfinite = (val) => {
  if (val === 'infinite' || val === 'Infinity' || val === Infinity || val === '∞') return true;
  if (val === 0 || val === '0' || val === -1 || val === '-1') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'infinite' || s === 'infinity' || s === '∞' || s.includes('inf') || s.includes('vô hạn') || s === '0' || s === 'all';
  }
  return false;
};

// Reusable speech result evaluation drawer
function InlineSpeechDrawer({
  line,
  idx,
  inlineSpeakIndex,
  isListening,
  inlineSpeakTranscript,
  inlineSpeakEval,
  setInlineSpeakIndex,
  setInlineSpeakTranscript,
  setInlineSpeakEval,
  speakText
}) {
  if (inlineSpeakIndex !== idx || (!isListening && !inlineSpeakTranscript && !inlineSpeakEval)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/80 dark:bg-slate-800/90 border border-blue-200/80 dark:border-blue-800/60 space-y-2 mt-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
          <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-[#0071e3]'}`} />
          <span>{isListening ? 'Đang nghe giọng đọc của bạn...' : 'Giọng đọc nhận diện:'}</span>
          <strong className="text-[#0071e3] dark:text-sky-400 break-all">
            "{inlineSpeakTranscript || '...'}"
          </strong>
        </span>
        <button
          type="button"
          onClick={() => {
            setInlineSpeakIndex(null);
            setInlineSpeakTranscript('');
            setInlineSpeakEval(null);
          }}
          className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
        >
          Đóng
        </button>
      </div>

      {inlineSpeakEval && (
        <div className="space-y-1.5 pt-1.5 border-t border-blue-200/60 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span
              className={`text-xs font-black ${
                inlineSpeakEval.isPass
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Điểm phát âm: {inlineSpeakEval.score}% — {inlineSpeakEval.feedback}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inlineSpeakEval.wordDiffs.map((wd, wIdx) => (
              <button
                key={wIdx}
                type="button"
                onClick={() => speakText(wd.cleanWord || wd.word, line.characterName, 0.7)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  wd.status === 'correct'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline underline-offset-2'
                }`}
                title="Bấm để nghe phát âm từ này chậm 0.7x"
              >
                {wd.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function BinoDialogueLinesSection({
  dialogueLines,
  activeLineIndex,
  setActiveLineIndex,
  lineRefs,
  isPlayingAll,
  stopPlayback,
  repeatCount,
  repeatScope,
  currentLoopCycle,
  currentLineRepeat,
  showVietsub,
  speakText,
  audioSpeed,
  inlineSpeakIndex,
  setInlineSpeakIndex,
  isListening,
  inlineSpeakTranscript,
  setInlineSpeakTranscript,
  inlineSpeakEval,
  setInlineSpeakEval,
  startInlineLineSpeech
}) {
  // View mode state with localStorage persistence: 'chat' | 'focus' | 'split'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('bino_dialogue_view_mode') || 'chat';
    } catch {
      return 'chat';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('bino_dialogue_view_mode', mode);
    } catch (e) {
      console.warn('Cannot write bino_dialogue_view_mode', e);
    }
  };

  // Focus mode line index
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Sync focusedIndex with active playback line
  useEffect(() => {
    if (activeLineIndex !== null && activeLineIndex !== undefined && activeLineIndex >= 0) {
      setFocusedIndex(activeLineIndex);
    }
  }, [activeLineIndex]);

  // Extract distinct speakers to style 2-party chat
  const distinctCharacters = useMemo(() => {
    if (!dialogueLines || dialogueLines.length === 0) return [];
    const list = [];
    dialogueLines.forEach((l) => {
      const name = (l.characterName || '').trim();
      if (name && !list.includes(name)) {
        list.push(name);
      }
    });
    return list;
  }, [dialogueLines]);

  // Speaker helper providing high-contrast metadata (Primary: Blue, Partner: Warm Amber/Orange)
  const getSpeakerMeta = (characterName) => {
    const raw = (characterName || '').trim();
    const up = raw.toUpperCase();
    const isPrimary = up.includes('LEO') || up.includes('VBACE') || up.includes('BINO') ||
      (distinctCharacters.length > 0 && raw === distinctCharacters[0]);

    const name = raw || (isPrimary ? 'Leo' : 'Đối tác');
    const initial = name.charAt(0).toUpperCase();
    const roleTag = isPrimary ? '👤 BẠN' : '👥 ĐỐI TÁC';
    const roleDesc = isPrimary ? 'Nhân vật chính' : 'Người đối thoại';

    return {
      isPrimary,
      name,
      initial,
      roleTag,
      roleDesc
    };
  };

  if (!dialogueLines || dialogueLines.length === 0) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. SECTION HEADER & SEGMENTED VIEW MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <MessageCircle size={16} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Kịch Bản Hội Thoại Song Ngữ</span>
              <span className="text-[11px] sm:text-xs text-[#0071e3] dark:text-sky-400 font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/50">
                {dialogueLines.length} câu
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Tùy biến góc nhìn: Hội thoại 2 chiều, Luyện từng câu hoặc Bảng đối chiếu
            </p>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center p-1 bg-slate-100/90 dark:bg-white/[0.06] backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => handleSetViewMode('chat')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'chat'
                ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Hiển thị dạng tin nhắn đối thoại 2 chiều sinh động"
          >
            <MessageCircle size={13} />
            <span>Hội thoại</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetViewMode('focus')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'focus'
                ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Tập trung sâu vào từng câu, dễ dàng lặp lại và luyện nói"
          >
            <Target size={13} />
            <span>Từng câu</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Bảng đối chiếu song ngữ trực quan cho màn hình lớn"
          >
            <Columns2 size={13} />
            <span>Song ngữ</span>
          </button>
        </div>
      </div>

      {/* 2. MODE 1: CHAT / CONVERSATION BUBBLES */}
      {viewMode === 'chat' && (
        <div className="space-y-2 p-2 sm:p-4 rounded-3xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
          {dialogueLines.map((line, idx) => {
            const isActive = activeLineIndex === idx;
            const speaker = getSpeakerMeta(line.characterName);
            const isPrimary = speaker.isPrimary;
            const prevLine = idx > 0 ? dialogueLines[idx - 1] : null;
            const isSpeakerChange = prevLine && prevLine.characterName !== line.characterName;

            return (
              <React.Fragment key={line.id || idx}>
                {/* Natural breathing space when the speaker changes */}
                {isSpeakerChange && <div className="pt-3 sm:pt-4" />}

                <motion.div
                  ref={(el) => {
                    if (el && lineRefs?.current) lineRefs.current[idx] = el;
                  }}
                  layout
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col w-[86%] sm:w-[76%] max-w-[86%] sm:max-w-[76%] ${
                    isPrimary ? 'mr-auto items-start' : 'ml-auto items-end'
                  }`}
                >
                  {/* Speaker Header Row: Clearly tells who is speaking */}
                  <div
                    className={`flex items-center gap-1.5 mb-1 px-1 select-none ${
                      isPrimary ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {isPrimary ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white font-black text-[10px] flex items-center justify-center shadow-xs ring-1 ring-blue-300 dark:ring-blue-800">
                          {speaker.initial}
                        </div>
                        <span className="text-xs font-black text-[#0071e3] dark:text-sky-400 tracking-tight">
                          {speaker.name}
                        </span>
                        <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 border border-blue-200/70 dark:border-blue-800/70 shadow-2xs">
                          {speaker.roleTag}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
                          {speaker.roleTag}
                        </span>
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 tracking-tight">
                          {speaker.name}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs ring-1 ring-amber-300 dark:ring-amber-800">
                          {speaker.initial}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Asymmetric Chat Bubble with High-Contrast Theming */}
                  <div
                    className={`w-full p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-200 border relative overflow-hidden shadow-2xs ${
                      isPrimary
                        ? 'rounded-tl-xs bg-white dark:bg-[#0c1424] border-blue-200/90 dark:border-blue-900/60 border-l-[5px] border-l-[#0071e3]'
                        : 'rounded-tr-xs bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/40 dark:bg-[#1f170c] border-amber-200/90 dark:border-amber-900/60 border-r-[5px] border-r-amber-500'
                    } ${
                      isActive
                        ? isPrimary
                          ? 'ring-2 ring-[#0071e3] border-transparent shadow-[0_4px_24px_rgba(0,113,227,0.22)] scale-[1.01]'
                          : 'ring-2 ring-amber-500 border-transparent shadow-[0_4px_24px_rgba(245,158,11,0.22)] scale-[1.01]'
                        : ''
                    }`}
                  >
                    {/* Bubble Top Action Row */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      {/* Status / Equalizer */}
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {/* Equalizer indicator */}
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => stopPlayback(true)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black transition-colors cursor-pointer ${
                              isPrimary
                                ? 'bg-blue-100 hover:bg-rose-100 dark:bg-blue-950/80 dark:hover:bg-rose-950/80 text-[#0071e3] hover:text-rose-700 dark:text-sky-300'
                                : 'bg-amber-100 hover:bg-rose-100 dark:bg-amber-950/80 dark:hover:bg-rose-950/80 text-amber-900 hover:text-rose-700 dark:text-amber-300'
                            }`}
                            title="Đang phát câu này • Bấm để dừng ngay"
                          >
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="equalizer-bar" />
                              <span className="equalizer-bar" />
                              <span className="equalizer-bar" />
                            </div>
                            <span>Đang đọc</span>
                          </button>
                        )}

                        {/* Repeat counter */}
                        {isActive && isPlayingAll && (checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow-2xs flex items-center gap-1 ${
                              isPrimary ? 'bg-[#0071e3]' : 'bg-amber-500'
                            }`}
                          >
                            {repeatScope === 'all' ? (
                              <>
                                <RotateCcw size={10} />
                                <span>Vòng {currentLoopCycle}/{checkIsInfinite(repeatCount) ? '∞' : repeatCount}</span>
                              </>
                            ) : (
                              <>
                                <Repeat1 size={11} />
                                <span>Lần {currentLineRepeat}/{checkIsInfinite(repeatCount) ? '∞' : repeatCount}</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Compact Audio & Mic Controls */}
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        {/* 0.7x Slow audio */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isPlayingAll) stopPlayback();
                            setActiveLineIndex(idx);
                            speakText(line.englishText, line.characterName, 0.7);
                          }}
                          className="px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-white/[0.08] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70 transition-all active:scale-90 flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Nghe chậm câu này (0.7x)"
                        >
                          <Headphones size={11} />
                          <span>0.7x</span>
                        </button>

                        {/* Normal Audio / Stop */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              stopPlayback(true);
                              return;
                            }
                            if (isPlayingAll) stopPlayback(true);
                            setActiveLineIndex(idx);
                            speakText(line.englishText, line.characterName);
                          }}
                          className={`transition-all shrink-0 active:scale-90 cursor-pointer flex items-center justify-center gap-1 rounded-xl shadow-2xs ${
                            isActive
                              ? 'px-2.5 py-1 text-[11px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-300 dark:ring-rose-800'
                              : isPrimary
                              ? 'p-1.5 sm:p-2 text-[#0071e3] bg-blue-50 dark:bg-white/[0.08] hover:bg-blue-100 dark:hover:bg-white/[0.12] border border-blue-200/60 dark:border-blue-800/60'
                              : 'p-1.5 sm:p-2 text-amber-800 dark:text-amber-300 bg-white dark:bg-white/[0.08] hover:bg-amber-50 dark:hover:bg-white/[0.12] border border-amber-200/80 dark:border-amber-800/60'
                          }`}
                          title={isActive ? 'Dừng phát câu này' : `Nghe câu này (${audioSpeed}x)`}
                        >
                          {isActive ? (
                            <>
                              <Square size={12} fill="currentColor" />
                              <span>Dừng</span>
                            </>
                          ) : (
                            <Volume2 size={15} />
                          )}
                        </button>

                        {/* Mic check */}
                        <button
                          type="button"
                          onClick={() => startInlineLineSpeech(line, idx)}
                          className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 cursor-pointer shadow-2xs ${
                            inlineSpeakIndex === idx && isListening
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.08] hover:text-indigo-600 hover:bg-slate-50 border border-slate-200/70 dark:border-white/10'
                          }`}
                          title="Luyện nói và nhận diện giọng đọc cho câu này"
                        >
                          <Mic size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Main Dialogue Content */}
                    <div className="space-y-1.5">
                      <p className="text-[15px] sm:text-base md:text-[17px] font-bold text-slate-950 dark:text-white leading-relaxed tracking-tight">
                        "{line.englishText}"
                      </p>

                      {showVietsub && line.vietnameseText && (
                        <div
                          className={`pt-1 text-xs sm:text-sm font-vietsub font-medium leading-relaxed ${
                            isPrimary
                              ? 'text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-blue-300 dark:border-blue-700/60'
                              : 'text-amber-950/85 dark:text-amber-200/90 pl-2 border-l-2 border-amber-400 dark:border-amber-600/60'
                          }`}
                        >
                          {line.vietnameseText}
                        </div>
                      )}
                    </div>

                    {/* Inline Speech Result Drawer */}
                    <InlineSpeechDrawer
                      line={line}
                      idx={idx}
                      inlineSpeakIndex={inlineSpeakIndex}
                      isListening={isListening}
                      inlineSpeakTranscript={inlineSpeakTranscript}
                      inlineSpeakEval={inlineSpeakEval}
                      setInlineSpeakIndex={setInlineSpeakIndex}
                      setInlineSpeakTranscript={setInlineSpeakTranscript}
                      setInlineSpeakEval={setInlineSpeakEval}
                      speakText={speakText}
                    />

                    {/* Sentence Pattern Substitution Card */}
                    <BinoSentenceExpansionCard
                      expansionData={getExpansionsForLine(line.englishText, idx)}
                      lineIndex={idx}
                    />
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 3. MODE 2: FOCUS THEATER / 1 SENTENCE AT A TIME */}
      {viewMode === 'focus' && (() => {
        const safeIndex = Math.min(Math.max(0, focusedIndex), dialogueLines.length - 1);
        const line = dialogueLines[safeIndex];
        const isActive = activeLineIndex === safeIndex;
        const speaker = getSpeakerMeta(line.characterName);
        const isPrimary = speaker.isPrimary;

        return (
          <div
            ref={(el) => {
              if (el && lineRefs?.current) lineRefs.current[safeIndex] = el;
            }}
            className="space-y-3"
          >
            {/* Horizontal Sentence Navigator Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5">
              {dialogueLines.map((l, i) => {
                const isCur = safeIndex === i;
                const isSpeaking = activeLineIndex === i;
                const sp = getSpeakerMeta(l.characterName);

                return (
                  <button
                    key={l.id || i}
                    type="button"
                    onClick={() => {
                      setFocusedIndex(i);
                      if (lineRefs?.current && lineRefs.current[i]) {
                        lineRefs.current[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCur
                        ? sp.isPrimary
                          ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300 dark:ring-blue-700'
                          : 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-300 dark:ring-amber-700'
                        : isSpeaking
                        ? sp.isPrimary
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-[#0071e3] dark:text-sky-300 border border-blue-300 dark:border-blue-700 animate-pulse'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
                        : 'bg-white dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10'
                    }`}
                  >
                    <span>{i + 1}</span>
                    <span className="text-[10px] opacity-80 font-semibold truncate max-w-[55px] sm:max-w-none">
                      {sp.name}
                    </span>
                    {isSpeaking && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full animate-ping shrink-0 ${
                          sp.isPrimary ? 'bg-sky-400' : 'bg-amber-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Central Focus Card */}
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`p-4 sm:p-6 rounded-3xl border transition-all duration-200 bg-white/95 dark:bg-slate-900/95 shadow-sm ${
                isPrimary
                  ? 'border-l-[5px] border-l-[#0071e3] border-blue-200/80 dark:border-blue-900/50'
                  : 'border-r-[5px] border-r-amber-500 border-amber-200/80 dark:border-amber-900/50'
              } ${
                isActive
                  ? isPrimary
                    ? 'ring-2 ring-[#0071e3] shadow-lg shadow-blue-500/15'
                    : 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/15'
                  : ''
              }`}
            >
              {/* Card Header: Character Chip + Prev/Next Controls */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-xs ${
                      isPrimary
                        ? 'bg-gradient-to-tr from-[#0071e3] to-sky-400 ring-2 ring-blue-100 dark:ring-blue-900'
                        : 'bg-gradient-to-tr from-amber-500 to-orange-500 ring-2 ring-amber-100 dark:ring-amber-900'
                    }`}
                  >
                    {speaker.initial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {speaker.name}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isPrimary
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {speaker.roleTag}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      Lượt thoại {safeIndex + 1} / {dialogueLines.length}
                    </span>
                  </div>
                </div>

                {/* Step controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeIndex === 0}
                    onClick={() => setFocusedIndex((prev) => Math.max(0, prev - 1))}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="Câu trước đó"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  <button
                    type="button"
                    disabled={safeIndex === dialogueLines.length - 1}
                    onClick={() => setFocusedIndex((prev) => Math.min(dialogueLines.length - 1, prev + 1))}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="Câu tiếp theo"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Big English Line & Vietsub */}
              <div className="space-y-3 py-2">
                <div className="relative">
                  <p className="text-lg sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white leading-snug sm:leading-relaxed tracking-tight">
                    "{line.englishText}"
                  </p>
                </div>

                {showVietsub && line.vietnameseText && (
                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl border ${
                      isPrimary
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
                    }`}
                  >
                    <p
                      className={`text-xs sm:text-sm md:text-base font-vietsub font-semibold leading-relaxed ${
                        isPrimary
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-amber-950 dark:text-amber-200'
                      }`}
                    >
                      💡 {line.vietnameseText}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Deck: Big Play, 0.7x, Mic Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Primary Play Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      stopPlayback(true);
                      return;
                    }
                    if (isPlayingAll) stopPlayback(true);
                    setActiveLineIndex(safeIndex);
                    speakText(line.englishText, line.characterName);
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm ${
                    isActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 ring-2 ring-rose-300 dark:ring-rose-800'
                      : isPrimary
                      ? 'bg-gradient-to-r from-[#0071e3] to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white shadow-blue-500/25'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Square size={14} fill="currentColor" />
                      <span>Dừng phát</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>Nghe câu này ({audioSpeed}x)</span>
                    </>
                  )}
                </button>

                {/* 0.7x Slow audio */}
                <button
                  type="button"
                  onClick={() => {
                    if (isPlayingAll) stopPlayback();
                    setActiveLineIndex(safeIndex);
                    speakText(line.englishText, line.characterName, 0.7);
                  }}
                  className="px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/70 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Nghe câu này ở tốc độ chậm 0.7x"
                >
                  <Headphones size={14} />
                  <span>Nghe chậm 0.7x</span>
                </button>

                {/* Practice Pronunciation Mic */}
                <button
                  type="button"
                  onClick={() => startInlineLineSpeech(line, safeIndex)}
                  className={`px-3.5 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                    inlineSpeakIndex === safeIndex && isListening
                      ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                      : 'bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-white/10'
                  }`}
                  title="Kiểm tra phát âm giọng đọc của bạn"
                >
                  <Mic size={14} />
                  <span>Luyện phát âm</span>
                </button>

                {/* Equalizer & loop badges if active */}
                {isActive && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isPrimary
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-300'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                      }`}
                    >
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="equalizer-bar" />
                        <span className="equalizer-bar" />
                        <span className="equalizer-bar" />
                      </div>
                      <span>Đang phát</span>
                    </span>

                    {isPlayingAll && (checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-xl text-white ${
                          isPrimary ? 'bg-[#0071e3]' : 'bg-amber-500'
                        }`}
                      >
                        {repeatScope === 'all' ? `Vòng ${currentLoopCycle}` : `Lần ${currentLineRepeat}`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Inline Speech Result */}
              <InlineSpeechDrawer
                line={line}
                idx={safeIndex}
                inlineSpeakIndex={inlineSpeakIndex}
                isListening={isListening}
                inlineSpeakTranscript={inlineSpeakTranscript}
                inlineSpeakEval={inlineSpeakEval}
                setInlineSpeakIndex={setInlineSpeakIndex}
                setInlineSpeakTranscript={setInlineSpeakTranscript}
                setInlineSpeakEval={setInlineSpeakEval}
                speakText={speakText}
              />

              {/* Sentence Pattern Substitution Card */}
              <BinoSentenceExpansionCard
                expansionData={getExpansionsForLine(line.englishText, safeIndex)}
                lineIndex={safeIndex}
              />
            </motion.div>
          </div>
        );
      })()}

      {/* 4. MODE 3: SPLIT COMPARATIVE TABLE */}
      {viewMode === 'split' && (
        <div className="space-y-2.5">
          {/* Table Header (visible on sm+) */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-slate-100/80 dark:bg-white/[0.04] rounded-2xl text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">STT</div>
            <div className="col-span-6">Lời Thoại Tiếng Anh & Thao Tác</div>
            <div className="col-span-5">Bản Dịch Tiếng Việt & Mở Rộng</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2.5">
            {dialogueLines.map((line, idx) => {
              const isActive = activeLineIndex === idx;
              const speaker = getSpeakerMeta(line.characterName);
              const isPrimary = speaker.isPrimary;

              return (
                <div
                  key={line.id || idx}
                  ref={(el) => {
                    if (el && lineRefs?.current) lineRefs.current[idx] = el;
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 border ${
                    isPrimary
                      ? 'border-l-[5px] border-l-[#0071e3]'
                      : 'border-l-[5px] border-l-amber-500'
                  } ${
                    isActive
                      ? isPrimary
                        ? 'bg-blue-500/[0.06] dark:bg-blue-500/[0.12] border-[#0071e3]/60 dark:border-sky-400/50 shadow-md ring-1 ring-[#0071e3]/30'
                        : 'bg-amber-500/[0.06] dark:bg-amber-500/[0.12] border-amber-500/60 dark:border-amber-400/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-white/95 dark:bg-[#0c101a]/95 border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* STT on Desktop, Header on Mobile */}
                    <div className="sm:col-span-1 flex items-center sm:justify-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-mono text-xs font-black flex items-center justify-center">
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <span
                        className={`sm:hidden text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPrimary
                            ? 'bg-blue-100 dark:bg-blue-950 text-[#0071e3] dark:text-sky-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {speaker.roleTag} • {speaker.name}
                      </span>
                    </div>

                    {/* English Column */}
                    <div className="sm:col-span-6 space-y-2">
                      <div className="hidden sm:flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isPrimary
                              ? 'bg-blue-100 dark:bg-blue-950 text-[#0071e3] dark:text-sky-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                          }`}
                        >
                          {speaker.roleTag} • {speaker.name}
                        </span>
                        {isActive && (
                          <span
                            className={`flex items-center gap-1 text-[10px] font-black ${
                              isPrimary ? 'text-[#0071e3]' : 'text-amber-600'
                            }`}
                          >
                            <div className="flex items-end gap-0.5 h-2.5">
                              <span className="equalizer-bar" />
                              <span className="equalizer-bar" />
                              <span className="equalizer-bar" />
                            </div>
                            <span>Đang đọc</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[15px] sm:text-base font-bold text-slate-950 dark:text-white leading-relaxed">
                        "{line.englishText}"
                      </p>

                      {/* Controls Row */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              stopPlayback(true);
                              return;
                            }
                            if (isPlayingAll) stopPlayback(true);
                            setActiveLineIndex(idx);
                            speakText(line.englishText, line.characterName);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                            isActive
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {isActive ? <Square size={12} fill="currentColor" /> : <Volume2 size={13} />}
                          <span>{isActive ? 'Dừng' : `${audioSpeed}x`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isPlayingAll) stopPlayback();
                            setActiveLineIndex(idx);
                            speakText(line.englishText, line.characterName, 0.7);
                          }}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Headphones size={12} />
                          <span>0.7x</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startInlineLineSpeech(line, idx)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                            inlineSpeakIndex === idx && isListening
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Mic size={12} />
                          <span>Luyện nói</span>
                        </button>
                      </div>

                      {/* Inline Speech Result */}
                      <InlineSpeechDrawer
                        line={line}
                        idx={idx}
                        inlineSpeakIndex={inlineSpeakIndex}
                        isListening={isListening}
                        inlineSpeakTranscript={inlineSpeakTranscript}
                        inlineSpeakEval={inlineSpeakEval}
                        setInlineSpeakIndex={setInlineSpeakIndex}
                        setInlineSpeakTranscript={setInlineSpeakTranscript}
                        setInlineSpeakEval={setInlineSpeakEval}
                        speakText={speakText}
                      />
                    </div>

                    {/* Vietnamese Column + Expansion */}
                    <div className="sm:col-span-5 space-y-2 pt-2 sm:pt-0 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-3">
                      {showVietsub && line.vietnameseText ? (
                        <p className="text-xs sm:text-sm font-vietsub font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {line.vietnameseText}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          (Đã ẩn phụ đề tiếng Việt)
                        </p>
                      )}

                      {/* Pattern Expansion */}
                      <BinoSentenceExpansionCard
                        expansionData={getExpansionsForLine(line.englishText, idx)}
                        lineIndex={idx}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
