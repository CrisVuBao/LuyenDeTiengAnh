import React from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw, Repeat1, Headphones, Square, Volume2
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
  if (!dialogueLines || dialogueLines.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span>Kịch Bản Hội Thoại Song Ngữ</span>
          <span className="text-xs text-slate-400 font-semibold">({dialogueLines.length} lượt thoại)</span>
        </h3>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {dialogueLines.map((line, idx) => {
          const isActive = activeLineIndex === idx;
          const upperChar = (line.characterName || '').toUpperCase();
          const isBino = upperChar.includes('LEO') || upperChar.includes('VBACE') || upperChar.includes('BINO');

          return (
            <motion.div
              key={line.id}
              ref={(el) => { if (el && lineRefs?.current) lineRefs.current[idx] = el; }}
              layout
              transition={{ duration: 0.2 }}
              className={`p-3.5 sm:p-5 rounded-2xl transition-all duration-300 border relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-amber-50/95 via-white to-amber-50/70 dark:from-amber-950/60 dark:via-slate-800 dark:to-slate-800 border-amber-400 dark:border-amber-600 shadow-xl ring-2 ring-amber-400/40 animate-pulse-glow'
                  : isBino
                  ? 'bg-orange-50/30 dark:bg-slate-800/80 border-orange-200/50 dark:border-slate-700/80 hover:border-orange-300 shadow-sm'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500" />
              )}

              {/* Top Row: Character Badge + Live Status + Audio Buttons */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                    isBino
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}>
                    {line.characterName}
                  </span>

                  {/* Equalizer when this specific line is being spoken */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => stopPlayback(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 hover:bg-rose-100 dark:bg-amber-950/80 dark:hover:bg-rose-950/80 text-amber-900 hover:text-rose-700 dark:text-amber-200 dark:hover:text-rose-300 text-[10px] font-black transition-colors cursor-pointer"
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

                  {/* Repeat counter badge */}
                  {isActive && isPlayingAll && (checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-sm flex items-center gap-1">
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

                {/* Line Audio Play & Speaking Practice Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (isPlayingAll) stopPlayback();
                      setActiveLineIndex(idx);
                      speakText(line.englishText, line.characterName, 0.7);
                    }}
                    className="px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/70 transition-all active:scale-90 flex items-center gap-1 cursor-pointer"
                    title="Nghe chậm rãi câu này (0.7x) để nghe kỹ từng từ"
                  >
                    <Headphones size={12} />
                    <span>Chậm</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isActive) {
                        stopPlayback(true);
                        return;
                      }
                      if (isPlayingAll) stopPlayback(true);
                      setActiveLineIndex(idx);
                      speakText(line.englishText, line.characterName);
                    }}
                    className={`transition-all shrink-0 active:scale-90 cursor-pointer flex items-center justify-center gap-1.5 rounded-xl ${
                      isActive
                        ? 'px-2.5 sm:px-3 py-1.5 text-[11px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/30 ring-2 ring-rose-300 dark:ring-rose-800'
                        : 'p-2 text-slate-500 bg-slate-100/80 dark:bg-slate-700/60 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={
                      isActive
                        ? 'Dừng phát ngay tại câu này'
                        : `Nghe riêng câu này theo giọng nhân vật (${audioSpeed}x)`
                    }
                  >
                    {isActive ? (
                      <>
                        <Square size={13} fill="currentColor" />
                        <span>Dừng</span>
                      </>
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Full-width Dialogue Text (English + Vietnamese) */}
              <div className="space-y-1.5">
                <p className="text-[15px] sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed tracking-tight">
                  "{line.englishText}"
                </p>

                {showVietsub && line.vietnameseText && (
                  <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-semibold leading-relaxed tracking-normal">
                    ({line.vietnameseText})
                  </p>
                )}
              </div>

              {/* Inline Speaking Recognition Drawer */}
              {inlineSpeakIndex === idx && (isListening || inlineSpeakTranscript || inlineSpeakEval) && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      🎙️ {isListening ? 'Đang nghe giọng đọc của bạn...' : 'Giọng đọc nhận diện:'}{' '}
                      <strong className="text-[#0071e3] dark:text-sky-400">
                        "{inlineSpeakTranscript || '...'}"
                      </strong>
                    </span>
                    <button
                      onClick={() => {
                        setInlineSpeakIndex(null);
                        setInlineSpeakTranscript('');
                        setInlineSpeakEval(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  {inlineSpeakEval && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span
                          className={`text-xs font-extrabold ${
                            inlineSpeakEval.isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          Điểm phát âm: {inlineSpeakEval.score}% — {inlineSpeakEval.feedback}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {inlineSpeakEval.wordDiffs.map((wd, wIdx) => (
                          <button
                            key={wIdx}
                            onClick={() => speakText(wd.cleanWord || wd.word, line.characterName, 0.7)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold cursor-pointer ${
                              wd.status === 'correct'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                            }`}
                            title="Bấm để nghe phát âm từ này chậm 0.7x"
                          >
                            {wd.word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sentence Pattern Substitution Card */}
              <BinoSentenceExpansionCard
                expansionData={getExpansionsForLine(line.englishText, idx)}
                lineIndex={idx}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
