import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Headphones, Mic, Zap } from 'lucide-react';
import speechService from '../../../utils/speechService';
import { startSmartSpeechSession } from '../../../utils/smartSpeechRecognition';
import { evaluateSentenceAttempt } from '../store/useReflex50Store';
import toast from 'react-hot-toast';

export default function ReflexSpeakingMode({
  filteredSentences,
  playbackSpeed,
  stopAutoPlay,
  masteredIds,
  toggleMastered,
  recordSpeakingAttempt
}) {
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [thinkTimerSeconds, setThinkTimerSeconds] = useState(5); // 3s | 5s | 0 (off)
  const [countdownLeft, setCountdownLeft] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingEval, setSpeakingEval] = useState(null);
  const [showSpeakingAnswer, setShowSpeakingAnswer] = useState(false);
  const recognitionRef = useRef(null);

  const currentSpeakingSentence =
    filteredSentences[Math.min(speakingIndex, Math.max(0, filteredSentences.length - 1))] ||
    filteredSentences[0];

  // Reset bộ đếm mỗi khi sang câu mới
  useEffect(() => {
    setSpokenTranscript('');
    setSpeakingEval(null);
    setShowSpeakingAnswer(false);
    setCountdownLeft(thinkTimerSeconds);
  }, [speakingIndex, thinkTimerSeconds, filteredSentences]);

  useEffect(() => {
    if (thinkTimerSeconds === 0 || isRecording || speakingEval) {
      return undefined;
    }
    if (countdownLeft <= 0) return undefined;
    const t = setTimeout(() => {
      setCountdownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [thinkTimerSeconds, countdownLeft, isRecording, speakingEval]);

  const startVoiceRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    if (!currentSpeakingSentence) return;
    if (stopAutoPlay) stopAutoPlay();

    setSpokenTranscript('');
    setSpeakingEval(null);

    const targetSentence = currentSpeakingSentence;
    const session = startSmartSpeechSession({
      targetText: targetSentence.en,
      onStart: () => {
        setIsRecording(true);
      },
      onInterimResult: (smartText) => {
        setSpokenTranscript(smartText);
      },
      onFinalResult: ({ smartTranscript, hasSpoken }) => {
        setIsRecording(false);
        recognitionRef.current = null;
        if (smartTranscript && hasSpoken) {
          const evalRes = evaluateSentenceAttempt(smartTranscript, targetSentence.en, {
            isSpeech: true
          });
          setSpokenTranscript(evalRes.smartTranscript || smartTranscript);
          setSpeakingEval(evalRes);
          setShowSpeakingAnswer(true);
          recordSpeakingAttempt(targetSentence.id, evalRes.smartTranscript || smartTranscript, evalRes.score);
          if (evalRes.score >= 85) {
            toast.success(`🎙️ Phát âm chuẩn ${evalRes.score}%!`, { id: 'reflex-speak-score' });
          }
          // Đọc lại câu mẫu chuẩn bản xứ để học viên đối chiếu
          speechService.speak(targetSentence.en, { rate: playbackSpeed });
        }
      },
      onError: (_code, message) => {
        setIsRecording(false);
        recognitionRef.current = null;
        if (message) toast.error(message, { id: 'speech-err' });
      }
    });

    recognitionRef.current = session;
  };

  if (!currentSpeakingSentence) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
        Không có câu nào trong bộ lọc này.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
      {/* Top Controls: Think Timer & Progress */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Câu {speakingIndex + 1} / {filteredSentences.length}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-[#0071e3] font-semibold truncate max-w-[180px] sm:max-w-none">
            {currentSpeakingSentence.grammarNote}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar w-full sm:w-auto">
          <span className="text-[11px] sm:text-xs text-slate-500">Đếm giờ:</span>
          {[
            { sec: 3, label: '3s Nhanh' },
            { sec: 5, label: '5s Chuẩn' },
            { sec: 0, label: 'Tắt đếm giờ' }
          ].map((opt) => (
            <button
              key={opt.sec}
              onClick={() => setThinkTimerSeconds(opt.sec)}
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer ${
                thinkTimerSeconds === opt.sec
                  ? 'bg-[#0071e3] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Speaking Card */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-6 text-center">
        {/* Think Countdown Badge */}
        {thinkTimerSeconds > 0 && !speakingEval && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-bold">
            <Zap size={14} className="shrink-0" />
            <span>
              {countdownLeft > 0
                ? `Hãy bật thành tiếng trong ${countdownLeft} giây...`
                : 'Hết giờ suy nghĩ! Hãy bấm Mic và nói to câu tiếng Anh ngay!'}
            </span>
          </div>
        )}

        <div className="space-y-1.5 sm:space-y-2">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Phản xạ dịch nói sang Tiếng Anh câu #{currentSpeakingSentence.number}
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            "{currentSpeakingSentence.vi}"
          </h2>
        </div>

        {/* Hints */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {currentSpeakingSentence.hints.map((h, idx) => (
            <button
              key={idx}
              onClick={() => speechService.speak(h.term.split('/')[0].trim(), { rate: 0.85 })}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#0071e3] flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 size={13} className="text-[#0071e3] shrink-0" />
              <strong className="text-[#0071e3] dark:text-sky-400">{h.term}</strong>
              <span>: {h.meaning}</span>
            </button>
          ))}
        </div>

        {/* Microphone Record Button & Audio Preview */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
          <button
            onClick={startVoiceRecording}
            className={`w-full sm:w-auto justify-center px-6 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-[#0071e3] hover:bg-[#0077ed] text-white'
            }`}
          >
            <Mic size={18} />
            <span>{isRecording ? 'Đang nghe... (Bấm dừng)' : 'Bấm Để Nói Tiếng Anh'}</span>
          </button>

          <button
            onClick={() => {
              setShowSpeakingAnswer(true);
              speechService.speak(currentSpeakingSentence.en, { rate: playbackSpeed });
            }}
            className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-4 py-2.5 sm:py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 size={15} className="text-[#0071e3]" />
            <span>Nghe mẫu ({playbackSpeed}x)</span>
          </button>

          <button
            onClick={() => {
              setShowSpeakingAnswer(true);
              speechService.speak(currentSpeakingSentence.en, { rate: 0.7 });
            }}
            className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-4 py-2.5 sm:py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Headphones size={15} />
            <span>Chậm (0.7x)</span>
          </button>
        </div>

        {/* Live Transcript & Evaluation */}
        {(spokenTranscript || speakingEval || showSpeakingAnswer) && (
          <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2.5 sm:space-y-3">
            {spokenTranscript && (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                🎙️ Giọng nói nhận diện được:{' '}
                <strong className="text-slate-900 dark:text-white">"{spokenTranscript}"</strong>
              </div>
            )}

            {speakingEval && (
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    speakingEval.isPass ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  Điểm phản xạ phát âm: {speakingEval.score}% — {speakingEval.feedback}
                </span>
              </div>
            )}

            <div className="space-y-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700">
              <div className="text-[11px] font-semibold text-slate-400">
                Đáp án chuẩn bản xứ (Bấm vào bất kỳ từ nào để nghe chậm 0.7x):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(speakingEval
                  ? speakingEval.wordDiffs
                  : currentSpeakingSentence.en.split(/\s+/).map((w) => ({
                      word: w,
                      cleanWord: w,
                      status: 'correct'
                    }))
                ).map((wd, idx) => (
                  <button
                    key={idx}
                    onClick={() => speechService.speak(wd.cleanWord, { rate: 0.7 })}
                    className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
                      wd.status === 'correct'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                    }`}
                  >
                    {wd.word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            disabled={speakingIndex <= 0}
            onClick={() => setSpeakingIndex((i) => Math.max(0, i - 1))}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer shrink-0"
          >
            ← Trước
          </button>

          <button
            onClick={() => {
              if (!masteredIds[currentSpeakingSentence.id]) {
                toggleMastered(currentSpeakingSentence.id);
              }
              if (speakingIndex + 1 < filteredSentences.length) {
                setSpeakingIndex((i) => i + 1);
              } else {
                toast.success('Đã hoàn thành lượt luyện nói!');
              }
            }}
            className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 text-white text-[11px] sm:text-xs font-bold cursor-pointer truncate"
          >
            <span className="sm:hidden">Đã nói • Tiếp →</span>
            <span className="hidden sm:inline">Đã bật thành tiếng • Sang câu tiếp →</span>
          </button>

          <button
            disabled={speakingIndex >= filteredSentences.length - 1}
            onClick={() => setSpeakingIndex((i) => Math.min(filteredSentences.length - 1, i + 1))}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer shrink-0"
          >
            Tiếp →
          </button>
        </div>
      </div>
    </div>
  );
}
