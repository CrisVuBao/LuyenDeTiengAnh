import React, { useState } from 'react';
import { RotateCcw, Shuffle, Filter, Sparkles, Volume2 } from 'lucide-react';
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
    <div className="space-y-6">
      
      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
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
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 p-5 md:p-10 font-serif text-slate-900 dark:text-slate-100 shadow-xl rounded-sm">
        
        {/* Directions */}
        <div className="mb-8 border-b-2 border-black dark:border-slate-700 pb-6">
          <h3 className="text-xl font-bold mb-2">PART 6</h3>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="font-bold">Directions:</span> Read the texts that follow. A word, phrase, or sentence is missing in parts of each text. Four answer choices for each question are given below the text. Select the best answer to complete the text. Then mark the letter (A), (B), (C), or (D) on your answer sheet.
          </p>
        </div>

        <div className="space-y-12">
          {passages.map((p, idx) => {
            const visibleQuestions = filterUnsure
              ? p.questions.filter(q => isConfident(6, q.id) === false)
              : p.questions;

            if (filterUnsure && visibleQuestions.length === 0) return null;

            return (
              <div key={p.id || idx} className="border-b-2 border-slate-200 dark:border-slate-800 pb-12 last:border-0 last:pb-0">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  
                  {/* Passage Box (Left) */}
                  <div className="w-full lg:w-1/2">
                    <h4 className="font-bold mb-2 uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400">{p.passageTitle}</h4>
                    <div className="border-2 border-black dark:border-slate-700 p-5 bg-white dark:bg-slate-950 leading-loose text-base md:text-lg text-justify shadow-inner">
                      {p.passageContext.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </div>
                    {p.audioUrl && (
                      <div className="mt-4 max-w-sm">
                        <AudioPlayer audioUrl={p.audioUrl} />
                      </div>
                    )}
                  </div>

                  {/* Questions (Right) */}
                  <div className="w-full lg:w-1/2 space-y-8">
                    {visibleQuestions.map((q) => {
                      const revealed = isRevealed(6, q.id);
                      const confidentVal = isConfident(6, q.id);

                      return (
                        <div key={q.id} className="relative">
                          <div className="flex gap-2 mb-2">
                            <span className="font-bold text-lg">{q.id}.</span>
                            <div className="text-lg leading-relaxed flex-1">
                              {q.question || q.text}

                              {!revealed ? (
                                <div
                                  onClick={() => markRevealed(6, q.id)}
                                  className="mt-4 border border-dashed border-slate-400 dark:border-slate-600 p-3 text-center text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-sans rounded"
                                >
                                  [ Click to Reveal Answer & Analysis ]
                                </div>
                              ) : (
                                <div className="mt-4 p-4 border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 font-sans text-sm rounded shadow-inner space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-bold uppercase text-green-700 dark:text-green-400 text-xs block mb-1">Đáp án đúng</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold border border-green-600 text-green-700 dark:text-green-300 px-1.5 rounded">[ {q.correctAnswer} ]</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          {q.correctAnswerText || (q.options && q.options[q.correctAnswer])}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => setAiModalData({
                                        question: q.question || q.text,
                                        correctAnswer: q.correctAnswer,
                                        options: JSON.stringify(q.options),
                                        context: p.passageContext
                                      })}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded border border-purple-200 dark:border-purple-800"
                                    >
                                      <Sparkles size={12} /> Hỏi AI Tutor
                                    </button>
                                  </div>

                                  {q.translation && <p className="text-slate-600 dark:text-slate-400 italic text-xs">{q.translation}</p>}
                                  {q.correctAnswerTextVi && <p className="text-slate-600 dark:text-slate-400 italic text-xs">{q.correctAnswerTextVi}</p>}

                                  {(q.recognitionKey || q.explanation) && (
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                                      {q.recognitionKey && <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">🔑 {q.recognitionKey}</p>}
                                      {q.explanation && <p className="text-slate-700 dark:text-slate-300 text-xs">{q.explanation}</p>}
                                    </div>
                                  )}

                                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex gap-2">
                                    <button
                                      onClick={() => markConfident(6, q.id, true)}
                                      className={`px-3 py-1 font-bold text-xs border rounded transition-all ${
                                        confidentVal === true
                                          ? 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-300'
                                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                                      }`}
                                    >
                                      ✓ Nhớ rồi
                                    </button>
                                    <button
                                      onClick={() => markConfident(6, q.id, false)}
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
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

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
