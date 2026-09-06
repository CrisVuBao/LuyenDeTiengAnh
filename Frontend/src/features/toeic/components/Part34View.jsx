import React from 'react';
import { RotateCcw } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Part34View({ passages = [], testId, studyProgress }) {
  const { isConfident, markConfident, isRevealed, markRevealed, resetPart } = studyProgress;

  const renderHighlight = (text, mapData) => {
    if (!mapData || mapData.length === 0 || !text) return text;
    const keywords = mapData.map(m => m.inTranscript).filter(Boolean);
    if (keywords.length === 0) return text;

    try {
      const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => {
        const matched = mapData.find(m => m.inTranscript.toLowerCase() === part.toLowerCase());
        if (matched) {
          const bg = matched.color === 'blue' ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-950 dark:text-yellow-100';
          return (
            <span key={i} className={`${bg} px-1 mx-0.5 rounded font-bold`}>
              {part}
            </span>
          );
        }
        return part;
      });
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Part 3 & 4: Conversations & Talks (Hội thoại & Bài nói)</span>
        <button
          onClick={() => { if (confirm('Reset Part 3 & 4?')) resetPart(3); }}
          className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>

      <div className="space-y-8">
        {passages.map((p, idx) => (
          <div key={p.id || idx} className="glass-card p-6 rounded-3xl space-y-6">
            
            {/* Audio & Header */}
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">🎧 {p.title}</h3>
              {p.audioUrl && (
                <div className="max-w-md">
                  <AudioPlayer audioUrl={p.audioUrl} />
                </div>
              )}
            </div>

            {/* Transcript with Paraphrase Mapping */}
            {p.transcript && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Transcript & Paraphrase:</span>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {renderHighlight(p.transcript, p.paraphraseMaps)}
                </p>
                {p.transcriptVi && <p className="text-xs italic text-slate-500 dark:text-slate-400 pt-1">{p.transcriptVi}</p>}
              </div>
            )}

            {/* Questions under this passage */}
            <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
              {p.questions.map((q) => {
                const revealed = isRevealed(3, q.id);
                const confidentVal = isConfident(3, q.id);

                return (
                  <div key={q.id} className="pt-6 first:pt-0 space-y-3">
                    <div className="flex gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">Câu {q.id}:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{q.question}</p>
                    </div>

                    {!revealed ? (
                      <button
                        onClick={() => markRevealed(3, q.id)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow transition-all"
                      >
                        🔒 LẬT ĐÁP ÁN
                      </button>
                    ) : (
                      <div className="bg-green-50/70 dark:bg-green-950/40 p-4 rounded-xl border border-green-200 dark:border-green-900/60 space-y-2">
                        <span className="text-[10px] font-bold text-green-800 dark:text-green-400 uppercase tracking-wider block">Đáp án</span>
                        <p className="font-bold text-green-900 dark:text-green-200 text-sm">{q.correctAnswerText}</p>
                        {q.explanation && <p className="text-slate-700 dark:text-slate-300 text-xs">{q.explanation}</p>}

                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => markConfident(3, q.id, true)}
                            className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                              confidentVal === true
                                ? 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-300'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            ✓ Nhớ rồi
                          </button>
                          <button
                            onClick={() => markConfident(3, q.id, false)}
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
        ))}
      </div>
    </div>
  );
}
