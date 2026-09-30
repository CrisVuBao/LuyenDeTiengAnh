import React, { useState } from 'react';
import { RotateCcw, Filter, Sparkles, CheckCircle2, HelpCircle, Key, Eye, FileText } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';
import AiTutorModal from './AiTutorModal';

export default function Part6View({ passages = [], testId, studyProgress }) {
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [aiModalData, setAiModalData] = useState(null);

  const {
    isConfident,
    markConfident,
    isRevealed,
    markRevealed,
    resetPart
  } = studyProgress;

  const handleReset = () => {
    if (confirm('Bạn có chắc muốn làm lại phần Part 6 này không?')) {
      resetPart(6);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Control Bar */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            Part 6 • Text Completion (Điền khuyết đoạn văn)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đọc văn bản bên trái và hoàn thành các khoảng trống tương ứng bên phải.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFilterUnsure((prev) => !prev)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterUnsure
                ? 'bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Filter size={14} className={filterUnsure ? 'text-amber-500' : 'text-slate-400'} />
            <span>Chỉ câu cần ôn lại</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Làm lại</span>
          </button>
        </div>
      </div>

      {/* Passages Split-Screen Studio */}
      <div className="space-y-6">
        {passages.map((p, idx) => {
          const visibleQuestions = filterUnsure
            ? p.questions.filter((q) => isConfident(6, q.id) === false)
            : p.questions;

          if (filterUnsure && visibleQuestions.length === 0) return null;

          return (
            <div
              key={p.id || idx}
              className="p-5 sm:p-7 rounded-2xl sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                {/* Passage Document Box (Left, Sticky on Desktop) */}
                <div className="w-full lg:w-1/2 lg:sticky lg:top-32 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                    <FileText size={14} />
                    <span>{p.passageTitle || `Đoạn văn ${idx + 1}`}</span>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/85 dark:border-slate-800/90 leading-relaxed text-sm sm:text-base text-slate-800 dark:text-slate-200 space-y-2">
                    {(p.passageContext || '').split('\n').map((line, i) => (
                      <p key={i} className="min-h-[1rem]">
                        {line}
                      </p>
                    ))}
                  </div>

                  {p.audioUrl && (
                    <div className="pt-1 max-w-sm">
                      <AudioPlayer audioUrl={p.audioUrl} />
                    </div>
                  )}
                </div>

                {/* Questions Column (Right) */}
                <div className="w-full lg:w-1/2 space-y-4">
                  {visibleQuestions.map((q) => {
                    const revealed = isRevealed(6, q.id);
                    const confidentVal = isConfident(6, q.id);

                    return (
                      <div
                        key={q.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {q.id}
                          </span>
                          <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed flex-1">
                            {q.question || q.text || `Chọn đáp án điền vào vị trí [${q.id}]`}
                          </div>
                        </div>

                        {!revealed ? (
                          <button
                            type="button"
                            onClick={() => markRevealed(6, q.id)}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye size={14} />
                            <span>Xem đáp án & Phân tích ngữ cảnh</span>
                          </button>
                        ) : (
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 space-y-3 animate-fade-in">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-[#0071e3] text-white font-extrabold text-xs">
                                  {q.correctAnswer}
                                </span>
                                <span className="font-bold text-sm text-[#0071e3] dark:text-sky-300">
                                  {q.correctAnswerText || (q.options && q.options[q.correctAnswer])}
                                </span>
                              </div>

                              {/* <button
                                onClick={() =>
                                  setAiModalData({
                                    question: q.question || q.text,
                                    correctAnswer: q.correctAnswer,
                                    options: JSON.stringify(q.options),
                                    context: p.passageContext
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white transition-colors cursor-pointer"
                              >
                                <Sparkles size={12} className="text-amber-400" />
                                <span>Hỏi AI Tutor</span>
                              </button> */}
                            </div>

                            {q.translation && (
                              <p className="text-slate-500 dark:text-slate-400 font-vietsub text-xs border-l-2 border-[#0071e3]/40 pl-2.5">
                                {q.translation}
                              </p>
                            )}
                            {q.correctAnswerTextVi && (
                              <p className="text-slate-500 dark:text-slate-400 font-vietsub text-xs">
                                {q.correctAnswerTextVi}
                              </p>
                            )}

                            {(q.recognitionKey || q.explanation) && (
                              <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1.5 text-xs">
                                {q.recognitionKey && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 font-bold">
                                    <Key size={12} className="text-amber-500 shrink-0" />
                                    <span>{q.recognitionKey}</span>
                                  </div>
                                )}
                                {q.explanation && (
                                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-end gap-2">
                              <button
                                onClick={() => markConfident(6, q.id, true)}
                                className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  confidentVal === true
                                    ? 'bg-[#0071e3] border-[#0071e3] text-white'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <CheckCircle2 size={12} />
                                <span>Đã nắm chắc</span>
                              </button>
                              <button
                                onClick={() => markConfident(6, q.id, false)}
                                className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  confidentVal === false
                                    ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <HelpCircle size={12} />
                                <span>Cần ôn lại</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {aiModalData && (
        <AiTutorModal
          isOpen={!!aiModalData}
          onClose={() => setAiModalData(null)}
          question={aiModalData.question}
          correctAnswer={aiModalData.correctAnswer}
          options={aiModalData.options}
          context={aiModalData.context}
        />
      )}
    </div>
  );
}
