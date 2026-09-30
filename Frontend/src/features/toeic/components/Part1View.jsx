import React from 'react';
import { RotateCcw, CheckCircle2, HelpCircle, Eye, Image as ImageIcon } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Part1View({ questions = [], testId, studyProgress }) {
  const { isConfident, markConfident, isRevealed, markRevealed, resetPart } = studyProgress;

  return (
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon size={16} className="text-[#0071e3] dark:text-sky-400" />
            <span>Part 1 • Photographs (Tranh mô tả)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quan sát bức tranh, nghe 4 phương án và chọn câu mô tả chính xác nhất.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Làm lại phần Part 1 này?')) resetPart(1);
          }}
          className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw size={14} />
          <span>Làm lại</span>
        </button>
      </div>

      <div className="grid gap-5">
        {questions.map((q) => {
          const revealed = isRevealed(1, q.id);
          const confidentVal = isConfident(1, q.id);

          return (
            <div
              key={q.id}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row gap-6 items-center"
            >
              <div className="w-full lg:w-1/2 space-y-3.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-extrabold text-xs">
                  Câu {q.id}
                </span>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt={`Part 1 - ${q.id}`}
                    className="w-full aspect-video object-cover rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800"
                  />
                )}
                {q.audioUrl && <AudioPlayer audioUrl={q.audioUrl} />}
              </div>

              <div className="flex-1 w-full min-w-0">
                {!revealed ? (
                  <button
                    onClick={() => markRevealed(1, q.id)}
                    className="w-full min-h-[140px] bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white rounded-2xl font-bold text-sm sm:text-base shadow-sm transition-colors flex flex-col items-center justify-center gap-2 p-5 cursor-pointer"
                  >
                    <Eye size={20} className="text-sky-400" />
                    <span>Chạm để mở Đáp án & Transcript</span>
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 space-y-3 animate-fade-in">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#0071e3]/12 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 text-xs font-extrabold uppercase tracking-wider">
                      Đáp án đúng
                    </span>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {q.correctAnswerText}
                    </p>
                    {q.translation && (
                      <p className="text-slate-500 dark:text-slate-400 font-vietsub text-xs sm:text-sm border-l-2 border-[#0071e3]/40 pl-3">
                        {q.translation}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {q.explanation}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => markConfident(1, q.id, true)}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                          confidentVal === true
                            ? 'bg-[#0071e3] border-[#0071e3] text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>Đã nắm chắc</span>
                      </button>
                      <button
                        onClick={() => markConfident(1, q.id, false)}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                          confidentVal === false
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <HelpCircle size={13} />
                        <span>Cần ôn lại</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
