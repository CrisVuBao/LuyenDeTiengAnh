import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Sparkles, RotateCcw, Shuffle, Filter } from 'lucide-react';
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
    setShuffledList(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn làm lại từ đầu phần Part 5 này không?')) {
      resetPart(5);
    }
  };

  const filtered = filterUnsure
    ? shuffledList.filter(q => isConfident(5, q.id) === false)
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
        <strong className="text-green-600 font-bold mx-1 border-b-2 border-green-600 pb-0.5">
          {correctWord}
        </strong>
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={shuffle}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Shuffle size={14} className="text-blue-500" /> Xáo trộn
          </button>

          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <Filter size={14} className={filterUnsure ? "text-orange-500" : "text-slate-400"} />
            <span>Chỉ câu Chưa chắc</span>
            <input
              type="checkbox"
              className="hidden"
              checked={filterUnsure}
              onChange={(e) => setFilterUnsure(e.target.checked)}
            />
          </label>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-all flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Làm lại
          </button>
        </div>

        <button
          onClick={() => setIsChantingMode(!isChantingMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            isChantingMode
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
          }`}
        >
          {isChantingMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          <span>Chế độ Đọc Tụng (Chanting)</span>
        </button>
      </div>

      {/* Questions Container (Paper Exam Frame) */}
      <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 p-5 md:p-10 font-serif text-slate-900 dark:text-slate-100 shadow-xl rounded-sm">
        
        {/* Directions */}
        <div className="mb-8 border-b-2 border-black dark:border-slate-700 pb-6 font-serif">
          <h3 className="text-xl font-bold mb-2">PART 5</h3>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="font-bold">Directions:</span> A word or phrase is missing in each of the sentences below. Four answer choices are given below each sentence. Select the best answer to complete the sentence. Then mark the letter (A), (B), (C), or (D) on your answer sheet.
          </p>
        </div>

        <div className="space-y-10">
          {filtered.map((q) => {
            const revealed = isRevealed(5, q.id);
            const selected = getSelectedAnswer(5, q.id);
            const confidentVal = isConfident(5, q.id);
            const isCorrect = selected === q.correctAnswer;

            return (
              <div key={q.id} className="relative pb-8 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                {isChantingMode ? (
                  /* Chanting Mode */
                  <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded">
                    <div className="flex gap-3 mb-2 font-serif">
                      <span className="font-bold text-lg">{q.id}.</span>
                      <p className="text-lg leading-relaxed">{renderFilledQuestion(q)}</p>
                    </div>
                    {q.translation && <p className="text-slate-600 dark:text-slate-400 italic text-sm pl-8 mb-3">{q.translation}</p>}

                    <div className="pl-8 mb-4 space-y-1 font-sans text-sm">
                      {q.grammarTag && <span className="inline-block border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-xs font-bold rounded mb-1">#{q.grammarTag}</span>}
                      {q.recognitionKey && <p className="font-bold text-slate-900 dark:text-slate-100">🔑 {q.recognitionKey}</p>}
                      {q.explanation && <p className="text-slate-700 dark:text-slate-300">{q.explanation}</p>}
                    </div>

                    <div className="pl-8 flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => markConfident(5, q.id, true)}
                          className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                            confidentVal === true
                              ? 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-300'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          ✓ Nhớ rồi
                        </button>
                        <button
                          onClick={() => markConfident(5, q.id, false)}
                          className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                            confidentVal === false
                              ? 'bg-orange-100 dark:bg-orange-950 border-orange-500 text-orange-800 dark:text-orange-300'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          ? Chưa chắc
                        </button>
                      </div>

                      <button
                        onClick={() => setAiModalData({
                          question: q.question,
                          correctAnswer: q.correctAnswer,
                          options: JSON.stringify(q.options),
                          context: q.explanation
                        })}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 rounded border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100"
                      >
                        <Sparkles size={13} /> Hỏi AI Tutor
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Recall Mode */
                  <div>
                    <div className="flex gap-3 mb-3">
                      <span className="font-bold text-lg">{q.id}.</span>
                      <p className="text-lg leading-relaxed flex-1">{q.question}</p>
                    </div>

                    <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                      {q.options && Object.entries(q.options).map(([key, text]) => {
                        let btnClass = "hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer";
                        let keyText = `(${key})`;

                        if (revealed) {
                          if (key === q.correctAnswer) {
                            btnClass = "bg-green-100 dark:bg-green-950/60 font-bold text-green-900 dark:text-green-300";
                            keyText = `[ ${key} ]`;
                          } else if (key === selected && !isCorrect) {
                            btnClass = "bg-slate-200 dark:bg-slate-800 text-slate-400 line-through";
                            keyText = `( X )`;
                          } else {
                            btnClass = "text-slate-400 dark:text-slate-600";
                          }
                        }

                        return (
                          <div
                            key={key}
                            onClick={() => selectAnswer(5, q.id, key)}
                            className={`p-2 rounded transition-all text-base ${btnClass}`}
                          >
                            <span className="font-bold mr-2">{keyText}</span> {text}
                          </div>
                        );
                      })}
                    </div>

                    {revealed && (
                      <div className="mt-5 ml-8 p-4 border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 font-sans rounded text-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs uppercase tracking-wider ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {isCorrect ? '✓ CHÍNH XÁC' : `✗ SAI RỒI (Đáp án đúng: ${q.correctAnswer})`}
                          </span>

                          <button
                            onClick={() => setAiModalData({
                              question: q.question,
                              correctAnswer: q.correctAnswer,
                              options: JSON.stringify(q.options),
                              context: q.explanation
                            })}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded border border-purple-200 dark:border-purple-800"
                          >
                            <Sparkles size={12} /> Hỏi AI Tutor
                          </button>
                        </div>

                        {q.translation && <p className="text-slate-600 dark:text-slate-400 italic">{q.translation}</p>}
                        {q.recognitionKey && <p className="font-bold text-slate-900 dark:text-slate-100">🔑 {q.recognitionKey}</p>}
                        {q.explanation && <p className="text-slate-700 dark:text-slate-300">{q.explanation}</p>}

                        <div className="border-t border-slate-200 dark:border-slate-700/80 pt-3 flex gap-2">
                          <button
                            onClick={() => markConfident(5, q.id, true)}
                            className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                              confidentVal === true
                                ? 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-300'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            ✓ Nhớ rồi
                          </button>
                          <button
                            onClick={() => markConfident(5, q.id, false)}
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
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-sans">
              Không có câu hỏi nào (hoặc bạn đã nhớ hết các câu!)
            </div>
          )}
        </div>

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
