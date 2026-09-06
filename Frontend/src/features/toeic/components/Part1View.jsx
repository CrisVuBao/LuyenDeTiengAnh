import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Part1View({ questions = [], testId, studyProgress }) {
  const { isConfident, markConfident, isRevealed, markRevealed, resetPart } = studyProgress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Part 1: Photographs (Tranh mô tả)</span>
        <button
          onClick={() => { if (confirm('Reset Part 1?')) resetPart(1); }}
          className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>

      <div className="grid gap-6">
        {questions.map((q) => {
          const revealed = isRevealed(1, q.id);
          const confidentVal = isConfident(1, q.id);

          return (
            <div key={q.id} className="glass-card p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row gap-6 items-center">
              <div className="w-full lg:w-1/2 space-y-3">
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-3 py-1 rounded-lg text-xs">
                  Câu {q.id}
                </span>
                {q.imageUrl && (
                  <img src={q.imageUrl} alt={`Part 1 - ${q.id}`} className="w-full aspect-video object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-800" />
                )}
                {q.audioUrl && <AudioPlayer audioUrl={q.audioUrl} />}
              </div>

              <div className="flex-1 w-full min-w-0">
                {!revealed ? (
                  <button
                    onClick={() => markRevealed(1, q.id)}
                    className="w-full min-h-[160px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center p-4"
                  >
                    🔒 LẬT ĐÁP ÁN
                  </button>
                ) : (
                  <div className="bg-green-50/70 dark:bg-green-950/40 p-5 rounded-2xl border border-green-200 dark:border-green-900/60 space-y-3">
                    <span className="text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider block">Đáp án đúng</span>
                    <p className="text-base md:text-lg font-bold text-green-900 dark:text-green-200">{q.correctAnswerText}</p>
                    {q.translation && <p className="text-slate-600 dark:text-slate-400 italic text-xs">{q.translation}</p>}
                    {q.explanation && <p className="text-slate-700 dark:text-slate-300 text-xs">{q.explanation}</p>}

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => markConfident(1, q.id, true)}
                        className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                          confidentVal === true
                            ? 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-300'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        ✓ Nhớ rồi
                      </button>
                      <button
                        onClick={() => markConfident(1, q.id, false)}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
