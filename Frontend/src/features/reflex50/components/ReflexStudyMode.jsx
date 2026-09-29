import React, { useState, useRef } from 'react';
import {
  Eye, EyeOff, Layers, Play, Pause, Volume2, Headphones,
  PenTool, Star, CheckCircle2, Square, Mic
} from 'lucide-react';
import speechService from '../../../utils/speechService';
import { startSmartSpeechSession } from '../../../utils/smartSpeechRecognition';
import { evaluateSentenceAttempt } from '../store/useReflex50Store';
import toast from 'react-hot-toast';

export default function ReflexStudyMode({
  filteredSentences,
  tierFilter,
  setTierFilter,
  masteredIds,
  starredIds,
  writingHistory,
  toggleMastered,
  toggleStarred,
  recordWritingAttempt,
  recordSpeakingAttempt,
  playbackSpeed,
  activePlayingId,
  isAutoPlaying,
  shadowingPause,
  setShadowingPause,
  toggleAutoPlayLoop,
  stopAutoPlay,
  speakSentence
}) {
  const [hideEnglishGlobal, setHideEnglishGlobal] = useState(false);
  const [hideHintsGlobal, setHideHintsGlobal] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState({});
  const [inlinePracticeId, setInlinePracticeId] = useState(null);
  const [inlineInput, setInlineInput] = useState('');
  const [inlineResult, setInlineResult] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Active Recall & Auto-Play Control Strip */}
      <div className="p-3 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setHideEnglishGlobal((prev) => !prev);
              setRevealedCardIds({});
            }}
            className={`justify-center px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              hideEnglishGlobal
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {hideEnglishGlobal ? <EyeOff size={14} className="shrink-0" /> : <Eye size={14} className="shrink-0" />}
            <span className="hidden sm:inline">
              {hideEnglishGlobal
                ? 'Đang Ẩn Đáp Án Tiếng Anh (Chế độ Tự Phản Xạ 3s)'
                : 'Ẩn Đáp Án Tiếng Anh (Để tự nhẩm nói trước)'}
            </span>
            <span className="sm:hidden truncate">
              {hideEnglishGlobal ? 'Đang ẩn Tiếng Anh' : 'Ẩn Tiếng Anh'}
            </span>
          </button>

          <button
            onClick={() => setHideHintsGlobal((prev) => !prev)}
            className={`justify-center px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              hideHintsGlobal
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers size={14} className="shrink-0" />
            <span className="truncate">{hideHintsGlobal ? 'Đang ẩn Gợi ý' : 'Ẩn Gợi Ý Từ Vựng'}</span>
          </button>
        </div>

        {/* Auto-Play 30 Sentences Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-blue-200/50 dark:border-slate-800">
          <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shadowingPause}
              onChange={(e) => setShadowingPause(e.target.checked)}
              className="rounded text-[#0071e3]"
            />
            <span className="hidden sm:inline">Nghỉ 3.5s giữa mỗi câu để nhại theo</span>
            <span className="sm:hidden">Nghỉ 3.5s nhại theo</span>
          </label>

          <button
            onClick={toggleAutoPlayLoop}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              isAutoPlaying
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs'
            }`}
          >
            {isAutoPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>
              {isAutoPlaying
                ? 'Dừng Phát'
                : `Phát Liên Tục (${filteredSentences.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Sentences List */}
      {filteredSentences.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Không có câu nào trong bộ lọc này.
          </p>
          <button
            onClick={() => setTierFilter('all')}
            className="px-4 py-2 rounded-full bg-[#0071e3] text-white text-xs font-semibold cursor-pointer"
          >
            Xem toàn bộ 30 câu
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-3.5">
          {filteredSentences.map((s) => {
            const isMastered = Boolean(masteredIds[s.id]);
            const isStarred = Boolean(starredIds[s.id]);
            const isPlayingThis = activePlayingId === s.id;
            const isEnglishHidden = hideEnglishGlobal && !revealedCardIds[s.id];
            const isInlineOpen = inlinePracticeId === s.id;

            const tierBadge =
              s.number <= 10
                ? { label: 'Tầng 1 • Cơ bản', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' }
                : s.number <= 20
                ? { label: 'Tầng 2 • Mở rộng', cls: 'bg-blue-50 text-[#0071e3] dark:bg-blue-950/50 dark:text-sky-300' }
                : { label: 'Tầng 3 • Nâng cao', cls: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' };

            return (
              <div
                key={s.id}
                id={`reflex-card-${s.id}`}
                className={`rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border p-3.5 sm:p-5 transition-all ${
                  isPlayingThis
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-md'
                    : isMastered
                    ? 'border-emerald-300/80 dark:border-emerald-800/60'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 sm:gap-4">
                  {/* Left Content */}
                  <div className="space-y-2.5 sm:space-y-3 flex-1">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center shrink-0">
                        {s.number}
                      </span>
                      <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${tierBadge.cls}`}>
                        {tierBadge.label}
                      </span>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-medium">
                        {s.grammarNote}
                      </span>
                    </div>

                    {/* Vietnamese Prompt */}
                    <div className="text-[15px] sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {s.vi}
                    </div>

                    {/* Clickable Vocabulary & Phrase Hints */}
                    {!hideHintsGlobal && s.hints.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                          Cụm từ gợi ý (bấm để nghe):
                        </span>
                        {s.hints.map((h, hIdx) => (
                          <button
                            key={hIdx}
                            onClick={() => speechService.speak(h.term.split('/')[0].trim(), { rate: 0.88 })}
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700 text-[11px] sm:text-xs transition-colors cursor-pointer group text-left"
                            title="Bấm để nghe phát âm cụm từ gợi ý"
                          >
                            <Volume2 size={11} className="text-[#0071e3] opacity-80 group-hover:scale-110 transition-transform shrink-0" />
                            <span>
                              <strong className="font-bold text-[#0071e3] dark:text-sky-400">{h.term}</strong>
                              {h.pos && (
                                <span className="text-[10px] italic text-slate-400 ml-0.5">({h.pos})</span>
                              )}
                              {h.meaning && (
                                <span className="text-slate-600 dark:text-slate-300">: {h.meaning}</span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Target English Answer (or Active Recall Reveal Button) */}
                    <div className="pt-0.5">
                      {isEnglishHidden ? (
                        <button
                          onClick={() => {
                            setRevealedCardIds((prev) => ({ ...prev, [s.id]: true }));
                            speakSentence(s, playbackSpeed);
                          }}
                          className="w-full sm:w-auto px-3.5 sm:px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-[#0071e3] dark:text-sky-400 flex items-center justify-center sm:justify-start gap-2 transition-all cursor-pointer"
                        >
                          <Eye size={14} className="shrink-0" />
                          <span>Tự bật ra tiếng Anh trong 3s → Bấm mở đáp án</span>
                        </button>
                      ) : (
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                          <div className="text-sm sm:text-base font-bold text-[#0071e3] dark:text-sky-300">
                            → {s.en}
                          </div>
                          {hideEnglishGlobal && (
                            <button
                              onClick={() =>
                                setRevealedCardIds((prev) => {
                                  const next = { ...prev };
                                  delete next[s.id];
                                  return next;
                                })
                              }
                              className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              Ẩn lại
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Buttons - Clean single row on mobile */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-1.5 sm:gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (isPlayingThis) {
                            stopAutoPlay();
                            return;
                          }
                          speakSentence(s, playbackSpeed);
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isPlayingThis
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-300 dark:ring-rose-800'
                            : 'bg-blue-50 dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 hover:bg-blue-100'
                        }`}
                        title={isPlayingThis ? 'Bấm để dừng phát ngay tại câu này' : 'Nghe câu chuẩn'}
                      >
                        {isPlayingThis ? (
                          <>
                            <Square size={12} fill="currentColor" />
                            <span>Dừng</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} />
                            <span>Nghe</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => speakSentence(s, 0.7)}
                        className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Nghe chậm rãi 0.7x để bắt rõ từng âm"
                      >
                        <Headphones size={13} />
                        <span>Chậm</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (isInlineOpen) {
                            setInlinePracticeId(null);
                          } else {
                            setInlinePracticeId(s.id);
                            setInlineInput(writingHistory[s.id]?.lastInput || '');
                            setInlineResult(null);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isInlineOpen
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Mở dòng viết thực hành ngay dưới câu này"
                      >
                        <PenTool size={12} />
                        <span>Viết thử</span>
                      </button>

                      <button
                        onClick={() => toggleStarred(s.id)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          isStarred
                            ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40 dark:border-amber-700'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                        }`}
                        title="Đánh dấu Sao (Câu cần ôn kỹ)"
                      >
                        <Star size={14} className={isStarred ? 'fill-amber-400' : ''} />
                      </button>

                      <button
                        onClick={() => toggleMastered(s.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                          isMastered
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isMastered ? 'Đã thuộc' : 'Thuộc'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Quick Writing & Speaking Practice Drawer */}
                {isInlineOpen && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={inlineInput}
                          onChange={(e) => setInlineInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const res = evaluateSentenceAttempt(inlineInput, s.en);
                              setInlineResult(res);
                              recordWritingAttempt(s.id, inlineInput, res.score);
                              speakSentence(s, playbackSpeed);
                            }
                          }}
                          placeholder="→ Gõ hoặc bấm Mic để đọc câu tiếng Anh..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (isRecording && recognitionRef.current) {
                              recognitionRef.current.stop();
                              return;
                            }
                            stopAutoPlay();
                            setInlineResult(null);
                            const session = startSmartSpeechSession({
                              targetText: s.en,
                              onStart: () => setIsRecording(true),
                              onInterimResult: (smartText) => setInlineInput(smartText),
                              onFinalResult: ({ smartTranscript, hasSpoken }) => {
                                setIsRecording(false);
                                recognitionRef.current = null;
                                if (smartTranscript && hasSpoken) {
                                  const evalRes = evaluateSentenceAttempt(smartTranscript, s.en, {
                                    isSpeech: true
                                  });
                                  setInlineInput(evalRes.smartTranscript || smartTranscript);
                                  setInlineResult(evalRes);
                                  recordSpeakingAttempt(s.id, evalRes.smartTranscript || smartTranscript, evalRes.score);
                                  speakSentence(s, playbackSpeed);
                                }
                              },
                              onError: (_code, message) => {
                                setIsRecording(false);
                                recognitionRef.current = null;
                                if (message) toast.error(message, { id: 'speech-err' });
                              }
                            });
                            recognitionRef.current = session;
                          }}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                            isRecording
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title="Bấm để nói câu này bằng giọng của bạn"
                        >
                          <Mic size={15} />
                          <span>{isRecording ? 'Đang nghe...' : 'Bấm Nói'}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const res = evaluateSentenceAttempt(inlineInput, s.en);
                          setInlineResult(res);
                          recordWritingAttempt(s.id, inlineInput, res.score);
                          speakSentence(s, playbackSpeed);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#0071e3] text-white text-xs font-bold hover:bg-[#0077ed] cursor-pointer"
                      >
                        Chấm câu này
                      </button>
                    </div>

                    {inlineResult && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              inlineResult.isPass ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            Điểm chính xác: {inlineResult.score}% — {inlineResult.feedback}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {inlineResult.wordDiffs.map((wd, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                wd.status === 'correct'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                              }`}
                            >
                              {wd.word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
