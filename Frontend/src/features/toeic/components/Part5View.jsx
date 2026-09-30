import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Sparkles, RotateCcw, Shuffle, Filter, CheckCircle2, HelpCircle, Key, Eye } from 'lucide-react';
import AiTutorModal from './AiTutorModal';

export default function Part5View({ questions = [], testId, studyProgress }) {
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [isChantingMode, setIsChantingMode] = useState(false);
  const [shuffledList, setShuffledList] = useState(questions);
  const [aiModalData, setAiModalData] = useState(null);

  React.useEffect(() => {
    setShuffledList(questions);
  }, [questions]);

  const {
    isConfident,
    markConfident,
    isRevealed,
    markRevealed,
    selectAnswer,
    getSelectedAnswer,
    resetPart
  } = studyProgress;

  const shuffle = () => {
    setShuffledList((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn làm lại từ đầu phần Part 5 này không?')) {
      resetPart(5);
    }
  };

  const filtered = filterUnsure
    ? shuffledList.filter((q) => isConfident(5, q.id) === false)
    : shuffledList;

  const renderFilledQuestion = (q) => {
    if (!q.options || !q.options[q.correctAnswer]) return q.question;
    const ansText = q.options[q.correctAnswer];
    const correctWord = ansText.includes('(') ? ansText.split('(')[0].trim() : ansText;
    const parts = q.question.split('-------');
    if (parts.length < 2) return q.question;

    return (
      <span>
        {parts[0]}
        <strong className="inline-block px-2 py-0.5 mx-1 rounded-lg bg-[#0071e3]/12 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-extrabold border border-[#0071e3]/25">
          {correctWord}
        </strong>
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* =================================================================== */}
      {/* TOP CONTROL BAR & DIRECTIONS                                        */}
      {/* =================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={shuffle}
              className="px-3.5 py-2 rounded-full text-xs font-bold border border-slate-200/90 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle size={14} className="text-[#0071e3] dark:text-sky-400" />
              <span>Xáo trộn câu</span>
            </button>

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

          <button
            onClick={() => setIsChantingMode(!isChantingMode)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isChantingMode
                ? 'bg-[#0071e3] text-white shadow-[0_4px_14px_rgba(0,113,227,0.28)]'
                : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            {isChantingMode ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
            <span>Chế độ Đọc Ngấm (Chanting)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Part 5 • Incomplete Sentences:</strong> Chọn đáp án (A), (B), (C) hoặc (D) phù hợp nhất để điền vào chỗ trống.
          </p>
          <span className="font-bold text-[#0071e3] dark:text-sky-400 shrink-0">
            Hiển thị {filtered.length} câu hỏi
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* QUESTIONS LIST (APPLE BENTO CARDS)                                  */}
      {/* =================================================================== */}
      <div className="space-y-4">
        {filtered.map((q) => {
          const revealed = isRevealed(5, q.id);
          const selected = getSelectedAnswer(5, q.id);
          const confidentVal = isConfident(5, q.id);
          const isCorrect = selected === q.correctAnswer;

          return (
            <div
              key={q.id}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 transition-colors"
            >
              {isChantingMode ? (
                /* ========================================================= */
                /* CHANTING MODE (ĐỌC NGẤM CẢ CÂU HOÀN CHỈNH)                */
                /* ========================================================= */
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {q.id}
                    </span>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {renderFilledQuestion(q)}
                      </p>
                      {q.translation && (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-vietsub">
                          {q.translation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {q.grammarTag && (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 text-[11px] font-bold">
                          #{q.grammarTag}
                        </span>
                      )}
                      {q.recognitionKey && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/25 text-xs font-bold">
                          <Key size={12} className="text-amber-500" />
                          <span>Dấu hiệu 3s: {q.recognitionKey}</span>
                        </span>
                      )}
                    </div>
                    {q.explanation && (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => markConfident(5, q.id, true)}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                          confidentVal === true
                            ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0071e3]/40'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>Đã nắm chắc</span>
                      </button>
                      <button
                        onClick={() => markConfident(5, q.id, false)}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                          confidentVal === false
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <HelpCircle size={13} />
                        <span>Cần ôn lại</span>
                      </button>
                    </div>

                    {/* <button
                      onClick={() =>
                        setAiModalData({
                          question: q.question,
                          correctAnswer: q.correctAnswer,
                          options: JSON.stringify(q.options),
                          context: q.explanation
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} className="text-amber-400" />
                      <span>Hỏi AI Tutor</span>
                    </button> */}
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* ACTIVE RECALL MODE (CHỌN ĐÁP ÁN & XEM LỜI GIẢI)           */
                /* ========================================================= */
                <div className="space-y-4">
                  {/* Question Stem */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {q.id}
                      </span>
                      <p className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-white leading-relaxed flex-1">
                        {q.question}
                      </p>
                    </div>

                    {!revealed && (
                      <button
                        onClick={() => markRevealed(5, q.id)}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Xem ngay đáp án và lời giải"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Giải thích</span>
                      </button>
                    )}
                  </div>

                  {/* 4 Interactive Option Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:pl-11">
                    {q.options &&
                      Object.entries(q.options).map(([key, text]) => {
                        const isThisCorrect = key === q.correctAnswer;
                        const isThisSelected = key === selected;

                        let cardStyle =
                          'bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#0071e3]/40';
                        let badgeStyle =
                          'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700';

                        if (revealed) {
                          if (isThisCorrect) {
                            cardStyle =
                              'bg-[#0071e3]/10 dark:bg-sky-500/20 border-[#0071e3] dark:border-sky-400 text-[#0071e3] dark:text-sky-200 font-bold shadow-2xs';
                            badgeStyle = 'bg-[#0071e3] text-white border-[#0071e3]';
                          } else if (isThisSelected && !isCorrect) {
                            cardStyle =
                              'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/70 text-rose-600 dark:text-rose-300 line-through opacity-85';
                            badgeStyle = 'bg-rose-500 text-white border-rose-500';
                          } else {
                            cardStyle =
                              'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 opacity-75';
                          }
                        }

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => selectAnswer(5, q.id, key)}
                            className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${cardStyle}`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                            >
                              {key}
                            </span>
                            <span className="text-sm sm:text-[15px] leading-snug">{text}</span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Revealed Analysis Drawer */}
                  {revealed && (
                    <div className="sm:ml-11 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 space-y-3 animate-fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full font-extrabold text-xs ${
                              isCorrect
                                ? 'bg-[#0071e3]/12 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300'
                                : selected
                                ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isCorrect
                              ? '✓ Chính xác'
                              : selected
                              ? `✗ Chưa đúng • Đáp án: (${q.correctAnswer})`
                              : `Đáp án đúng: (${q.correctAnswer})`}
                          </span>

                          {q.grammarTag && (
                            <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                              #{q.grammarTag}
                            </span>
                          )}
                        </div>

                        {/* <button
                          onClick={() =>
                            setAiModalData({
                              question: q.question,
                              correctAnswer: q.correctAnswer,
                              options: JSON.stringify(q.options),
                              context: q.explanation
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white transition-colors cursor-pointer"
                        >
                          <Sparkles size={12} className="text-amber-400" />
                          <span>Hỏi AI Tutor</span>
                        </button> */}
                      </div>

                      {q.recognitionKey && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-start gap-2">
                          <Key size={15} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-extrabold">Dấu hiệu nhận biết nhanh: </strong>
                            <span>{q.recognitionKey}</span>
                          </div>
                        </div>
                      )}

                      {q.explanation && (
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>
                      )}

                      {q.translation && (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-vietsub border-l-2 border-[#0071e3]/40 pl-3">
                          {q.translation}
                        </p>
                      )}

                      <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Đánh dấu mức độ ghi nhớ câu này:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => markConfident(5, q.id, true)}
                            className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                              confidentVal === true
                                ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0071e3]/40'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>Đã nắm chắc</span>
                          </button>
                          <button
                            onClick={() => markConfident(5, q.id, false)}
                            className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                              confidentVal === false
                                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500/40'
                            }`}
                          >
                            <HelpCircle size={13} />
                            <span>Cần ôn lại</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-sm">
            Không có câu hỏi nào trong bộ lọc này (hoặc bạn đã nắm chắc toàn bộ câu hỏi!).
          </div>
        )}
      </div>

      {/* AI Tutor Modal */}
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
