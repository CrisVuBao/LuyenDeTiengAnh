import React from 'react';
import { RotateCcw } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Part2View({ questions = [], testId, studyProgress }) {
  const { isConfident, markConfident, isRevealed, markRevealed, resetPart } = studyProgress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Part 2: Question - Response (Hỏi & Đáp)</span>
        <button
          onClick={() => { if (confirm('Reset Part 2?')) resetPart(2); }}
          className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>

      <div className="grid gap-6 max-w-3xl mx-auto">
        {questions.map((q) => {
          const revealed = isRevealed(2, q.id);
          const confidentVal = isConfident(2, q.id);

          return (
            <div key={q.id} className="glass-card p-5 md:p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                  {q.id}
                </span>
                <div className="flex-1 min-w-0">
                  {q.questionText ? (
                    <>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">{q.questionText}</h4>
                      {q.questionTextVi && <p className="text-slate-500 dark:text-slate-400 italic text-xs mt-0.5">{q.questionTextVi}</p>}
                    </>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Nghe audio để bắt từ khóa hỏi</span>
                  )}
                </div>
              </div>

              {q.audioUrl && <AudioPlayer audioUrl={q.audioUrl} />}

              {!revealed ? (
                <button
                  onClick={() => markRevealed(2, q.id)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  🔒 LẬT ĐÁP ÁN
                </button>
              ) : (
                <div className="bg-green-50/70 dark:bg-green-950/40 p-4 rounded-xl border border-green-200 dark:border-green-900/60 space-y-2">
                  <span className="text-[10px] font-bold text-green-800 dark:text-green-400 uppercase tracking-wider block">Đáp án</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded text-xs">({q.correctAnswer})</span>
                    <span className="font-bold text-green-900 dark:text-green-200 text-sm">{q.correctAnswerText}</span>
                  </div>
                  {q.explanation && <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">{q.explanation}</p>}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => markConfident(2, q.id, true)}
                      className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                        confidentVal === true
                          ? 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-300'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      ✓ Nhớ rồi
                    </button>
                    <button
                      onClick={() => markConfident(2, q.id, false)}
                      className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                        confidentVal === false
                          ? 'bg-orange-100 dark:bg-orange-950 border-orange-500 text-orange-800 dark:text-orange-300'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      ? Chưa chắc
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
