import React, { useState, useEffect } from 'react';
import { Volume2, Headphones, Gauge } from 'lucide-react';
import speechService from '../../../utils/speechService';
import { evaluateSentenceAttempt } from '../store/useReflex50Store';

export default function ReflexDictationMode({
  filteredSentences,
  playbackSpeed,
  speakSentence,
  recordWritingAttempt
}) {
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationInput, setDictationInput] = useState('');
  const [dictationEval, setDictationEval] = useState(null);
  const [showFirstLetterHint, setShowFirstLetterHint] = useState(false);

  const currentDictationSentence =
    filteredSentences[Math.min(dictationIndex, Math.max(0, filteredSentences.length - 1))] ||
    filteredSentences[0];

  useEffect(() => {
    setDictationInput('');
    setDictationEval(null);
    setShowFirstLetterHint(false);
  }, [dictationIndex, filteredSentences]);

  const handleCheckDictation = () => {
    if (!currentDictationSentence) return;
    const res = evaluateSentenceAttempt(dictationInput, currentDictationSentence.en);
    setDictationEval(res);
    recordWritingAttempt(currentDictationSentence.id, dictationInput, res.score);
    speechService.speak(currentDictationSentence.en, { rate: playbackSpeed });
  };

  if (!currentDictationSentence) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500">
        Không có câu nào trong bộ lọc này.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 text-[11px] sm:text-xs font-bold">
            Chép Chính Tả • Câu {dictationIndex + 1} / {filteredSentences.length}
          </span>
          <button
            onClick={() => setShowFirstLetterHint((prev) => !prev)}
            className="text-[11px] sm:text-xs font-semibold text-[#0071e3] hover:underline cursor-pointer"
          >
            {showFirstLetterHint ? 'Ẩn gợi ý' : '💡 Gợi ý chữ đầu & nghĩa'}
          </button>
        </div>

        {/* Audio Trigger Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 sm:py-4">
          <button
            onClick={() => speakSentence(currentDictationSentence, 0.95)}
            className="w-full sm:w-auto justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Volume2 size={18} />
            <span>Nghe Tốc Độ Chuẩn (0.95x)</span>
          </button>

          <button
            onClick={() => speakSentence(currentDictationSentence, 0.75)}
            className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Headphones size={15} className="text-[#0071e3]" />
            <span>Chậm (0.75x)</span>
          </button>

          <button
            onClick={() => speakSentence(currentDictationSentence, 0.6)}
            className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Gauge size={15} className="text-amber-500" />
            <span>Rất Chậm (0.6x)</span>
          </button>
        </div>

        {showFirstLetterHint && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 text-xs space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Nghĩa tiếng Việt: "{currentDictationSentence.vi}"
            </div>
            <div className="font-mono text-amber-700 dark:text-amber-300">
              Gợi ý khung từ:{' '}
              {currentDictationSentence.en
                .split(/\s+/)
                .map((w) => w[0] + '_'.repeat(Math.max(1, w.length - 1)))
                .join('  ')}
            </div>
          </div>
        )}

        {/* Dictation Input */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
          <input
            type="text"
            value={dictationInput}
            onChange={(e) => setDictationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCheckDictation();
            }}
            placeholder="Nhập chính xác câu tiếng Anh bạn vừa nghe được..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0071e3]"
          />
          <button
            onClick={handleCheckDictation}
            className="px-6 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold cursor-pointer"
          >
            Kiểm tra chính tả
          </button>
        </div>

        {dictationEval && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold ${
                  dictationEval.isPass ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                Độ chính xác: {dictationEval.score}% — {dictationEval.feedback}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nghĩa: {currentDictationSentence.vi}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dictationEval.wordDiffs.map((wd, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
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

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            disabled={dictationIndex <= 0}
            onClick={() => setDictationIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            ← Câu trước
          </button>
          <button
            disabled={dictationIndex >= filteredSentences.length - 1}
            onClick={() => setDictationIndex((i) => Math.min(filteredSentences.length - 1, i + 1))}
            className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            Câu tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
