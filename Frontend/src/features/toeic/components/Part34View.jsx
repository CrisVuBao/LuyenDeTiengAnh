import React from 'react';
import { RotateCcw, CheckCircle2, HelpCircle, Eye, Volume2 } from 'lucide-react';
import AudioPlayer from '../../../components/AudioPlayer';

export default function Part34View({ passages = [], testId, studyProgress }) {
  const { isConfident, markConfident, isRevealed, markRevealed, resetPart } = studyProgress;

  const renderHighlight = (text, mapData) => {
    if (!mapData || mapData.length === 0 || !text) return text;
    const keywords = mapData.map((m) => m.inTranscript).filter(Boolean);
    if (keywords.length === 0) return text;

    try {
      const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => {
        const matched = mapData.find((m) => m.inTranscript.toLowerCase() === part.toLowerCase());
        if (matched) {
          const bg =
            matched.color === 'blue'
              ? 'bg-[#0071e3]/15 text-[#0071e3] dark:bg-sky-500/25 dark:text-sky-300 border border-[#0071e3]/25'
              : 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30';
          return (
            <span key={i} className={`${bg} px-1.5 py-0.5 mx-0.5 rounded-md font-bold`}>
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
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Volume2 size={16} className="text-[#0071e3] dark:text-sky-400" />
            <span>Part 3 & 4 • Conversations & Talks (Hội thoại & Bài nói ngắn)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Nghe đoạn hội thoại kết hợp đối chiếu từ đồng nghĩa (Paraphrase Mapping) trong Transcript.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Làm lại phần Part 3 & 4 này?')) resetPart(3);
          }}
          className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw size={14} />
          <span>Làm lại</span>
        </button>
      </div>

      <div className="space-y-6">
        {passages.map((p, idx) => (
          <div
            key={p.id || idx}
            className="p-5 sm:p-7 rounded-2xl sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5"
          >
            {/* Audio & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Volume2 size={18} />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  {p.title}
                </h3>
              </div>
              {p.audioUrl && (
                <div className="w-full sm:max-w-md">
                  <AudioPlayer audioUrl={p.audioUrl} />
                </div>
              )}
            </div>

            {/* Transcript with Paraphrase Mapping */}
            {p.transcript && (
              <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-950/60 rounded-2xl border border-slate-200/85 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0071e3] dark:text-sky-400 block">
                  Transcript & Paraphrase Mapping
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {renderHighlight(p.transcript, p.paraphraseMaps)}
                </p>
                {p.transcriptVi && (
                  <p className="text-xs sm:text-sm font-vietsub text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    {p.transcriptVi}
                  </p>
                )}
              </div>
            )}

            {/* Questions under this passage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {p.questions.map((q) => {
                const revealed = isRevealed(3, q.id);
                const confidentVal = isConfident(3, q.id);

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 font-extrabold text-xs">
                        Câu {q.id}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm leading-relaxed">
                        {q.question}
                      </p>
                    </div>

                    {!revealed ? (
                      <button
                        onClick={() => markRevealed(3, q.id)}
                        className="w-full py-2.5 px-3.5 bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Xem đáp án</span>
                      </button>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 space-y-2.5 animate-fade-in">
                        <span className="text-[10px] font-extrabold text-[#0071e3] dark:text-sky-400 uppercase tracking-wider block">
                          Đáp án đúng
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {q.correctAnswerText}
                        </p>
                        {q.explanation && (
                          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                            {q.explanation}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => markConfident(3, q.id, true)}
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] border transition-all flex items-center gap-1 cursor-pointer ${
                              confidentVal === true
                                ? 'bg-[#0071e3] border-[#0071e3] text-white'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <CheckCircle2 size={11} />
                            <span>Đã nhớ</span>
                          </button>
                          <button
                            onClick={() => markConfident(3, q.id, false)}
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] border transition-all flex items-center gap-1 cursor-pointer ${
                              confidentVal === false
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <HelpCircle size={11} />
                            <span>Ôn lại</span>
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
