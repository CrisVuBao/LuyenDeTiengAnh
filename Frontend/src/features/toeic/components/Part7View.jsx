import React, { useState } from 'react';
import { RotateCcw, Filter, Sparkles, AlertTriangle, CheckCircle2, HelpCircle, Key, Eye, Radar, FileText } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';
import AiTutorModal from './AiTutorModal';

export default function Part7View({ passages = [], testId, studyProgress }) {
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [aiModalData, setAiModalData] = useState(null);

  const {
    isConfident,
    markConfident,
    isRevealed,
    markRevealed,
    resetPart
  } = studyProgress;

  const handleReset = () => {
    if (confirm('Bạn có chắc muốn làm lại phần Part 7 này không?')) {
      resetPart(7);
      setActiveHighlight(null);
    }
  };

  const renderPassage = (text, currentHighlight) => {
    if (!text) return null;
    if (!currentHighlight) return <span className="whitespace-pre-wrap">{text}</span>;

    try {
      const regex = new RegExp(`(${currentHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        part.toLowerCase() === currentHighlight.toLowerCase() ? (
          <span
            key={i}
            className="bg-amber-300 text-slate-950 font-bold px-1.5 py-0.5 rounded-md shadow-2xs"
          >
            {part}
          </span>
        ) : (
          <span key={i} className="opacity-55 transition-opacity">
            {part}
          </span>
        )
      );
    } catch {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Control Bar */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Part 7 • Reading Comprehension (Đọc hiểu & Radar Dẫn Chứng)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chạm hoặc di chuột vào câu hỏi đã mở lời giải để làm sáng dẫn chứng trực tiếp trong văn bản.
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

      {/* Passages & Evidence Radar Studio */}
      <div className="space-y-6">
        {passages.map((p, idx) => {
          const visibleQuestions = filterUnsure
            ? p.questions.filter((q) => isConfident(7, q.id) === false)
            : p.questions;

          if (filterUnsure && visibleQuestions.length === 0) return null;

          return (
            <div
              key={p.id || idx}
              className="p-5 sm:p-7 rounded-2xl sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                {/* Left Column: Passage Document Reader (Sticky on Desktop) */}
                <div className="w-full lg:w-1/2 lg:sticky lg:top-32 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                      <FileText size={14} />
                      <span>{p.passageTitle || `Văn bản đọc hiểu ${idx + 1}`}</span>
                    </div>
                    {activeHighlight && (
                      <button
                        type="button"
                        onClick={() => setActiveHighlight(null)}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Bỏ tô sáng dẫn chứng
                      </button>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/85 dark:border-slate-800/90 leading-relaxed text-sm sm:text-base text-slate-800 dark:text-slate-200">
                    {renderPassage(p.passageText, activeHighlight)}
                  </div>

                  {p.audioUrl && (
                    <div className="pt-1 max-w-sm">
                      <AudioPlayer audioUrl={p.audioUrl} />
                    </div>
                  )}
                </div>

                {/* Right Column: Questions & Evidence Radar */}
                <div className="w-full lg:w-1/2 space-y-4">
                  {visibleQuestions.map((q) => {
                    const revealed = isRevealed(7, q.id);
                    const confidentVal = isConfident(7, q.id);
                    const isHovered = activeHighlight && activeHighlight === q.evidenceInPassage;

                    return (
                      <div
                        key={q.id}
                        onMouseEnter={() => revealed && q.evidenceInPassage && setActiveHighlight(q.evidenceInPassage)}
                        onMouseLeave={() => setActiveHighlight(null)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                          isHovered
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400 dark:border-amber-500/60 shadow-xs'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {q.id}
                          </span>
                          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed flex-1">
                            {q.question}
                          </p>
                        </div>

                        {!revealed ? (
                          <button
                            type="button"
                            onClick={() => markRevealed(7, q.id)}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye size={14} />
                            <span>Xem đáp án & Bật Radar Dẫn Chứng</span>
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
{/* 
                              <button
                                onClick={() =>
                                  setAiModalData({
                                    question: q.question,
                                    correctAnswer: q.correctAnswer,
                                    options: JSON.stringify(q.options),
                                    context: p.passageText
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

                            {/* Evidence Radar Box (Tap on mobile or hover on desktop to highlight in passage) */}
                            {q.evidenceInPassage && (
                              <div
                                onClick={() =>
                                  setActiveHighlight((prev) =>
                                    prev === q.evidenceInPassage ? null : q.evidenceInPassage
                                  )
                                }
                                className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 cursor-pointer space-y-1"
                                title="Bấm để tô sáng câu dẫn chứng trong bài đọc"
                              >
                                <div className="flex items-center justify-between text-xs font-extrabold text-amber-800 dark:text-amber-300">
                                  <span className="flex items-center gap-1.5">
                                    <Radar size={13} className="text-amber-500" />
                                    <span>Dẫn chứng trong bài đọc (Chạm để định vị):</span>
                                  </span>
                                </div>
                                <p className="text-amber-900 dark:text-amber-200 italic text-xs leading-relaxed">
                                  &ldquo;...{q.evidenceInPassage}...&rdquo;
                                </p>
                              </div>
                            )}

                            {(q.recognitionKey || q.explanation) && (
                              <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1.5 text-xs">
                                {q.recognitionKey && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <Key size={12} className="text-[#0071e3] shrink-0" />
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

                            {q.trap && (
                              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                                <span>
                                  <strong>Bẫy đề thi:</strong> {q.trap}
                                </span>
                              </div>
                            )}

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-end gap-2">
                              <button
                                onClick={() => markConfident(7, q.id, true)}
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
                                onClick={() => markConfident(7, q.id, false)}
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
