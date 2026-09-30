import React from 'react';
import { RotateCcw, CheckCircle2, HelpCircle, Eye, Headphones } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Part2View({ questions = [], testId, studyProgress }) {
  const { isConfident, markConfident, isRevealed, markRevealed, resetPart } = studyProgress;

  return (
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Headphones size={16} className="text-[#0071e3] dark:text-sky-400" />
            <span>Part 2 • Question – Response (Phản xạ Hỏi & Đáp)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Nghe câu hỏi và bắt từ khóa đầu câu (Who, Where, When, Why...) để chọn lời đáp tự nhiên nhất.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Làm lại phần Part 2 này?')) resetPart(2);
          }}
          className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw size={14} />
          <span>Làm lại</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q) => {
          const revealed = isRevealed(2, q.id);
          const confidentVal = isConfident(2, q.id);

          return (
            <div
              key={q.id}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="w-8 h-8 rounded-xl bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {q.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    {q.questionText ? (
                      <>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {q.questionText}
                        </h4>
                        {q.questionTextVi && (
                          <p className="text-slate-500 dark:text-slate-400 font-vietsub text-xs mt-0.5">
                            {q.questionTextVi}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">
                        Bấm nghe audio bên dưới để bắt từ khóa câu hỏi
                      </span>
                    )}
                  </div>
                </div>

                {q.audioUrl && <AudioPlayer audioUrl={q.audioUrl} />}
              </div>

              {!revealed ? (
                <button
                  onClick={() => markRevealed(2, q.id)}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Eye size={14} />
                  <span>Xem đáp án & Giải thích</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#0071e3] text-white font-extrabold text-xs">
                      {q.correctAnswer}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {q.correctAnswerText}
                    </span>
                  </div>
                  {q.explanation && (
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      {q.explanation}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-end gap-2">
                    <button
                      onClick={() => markConfident(2, q.id, true)}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                        confidentVal === true
                          ? 'bg-[#0071e3] border-[#0071e3] text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 size={12} />
                      <span>Đã nắm chắc</span>
                    </button>
                    <button
                      onClick={() => markConfident(2, q.id, false)}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                        confidentVal === false
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
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
  );
}
