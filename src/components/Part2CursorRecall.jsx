import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import useStudyState from '../hooks/useStudyState';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function Part2CursorRecall({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  
  const { isConfident, markConfident } = useConfidence(testId);
  const { revealed, setRevealed, resetStudyState } = useStudyState(testId, 'part2');

  useEffect(() => {
    setQuestions([...data]);
  }, [data]);

  const shuffle = () => {
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleReveal = (id) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
  };

  const handleReset = () => {
    resetStudyState();
  };

  const filteredQuestions = filterUnsure 
    ? questions.filter(q => isConfident(q.id) === false)
    : questions;

  return (
    <div>
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} onReset={handleReset} />
      
      <div className="grid gap-6 max-w-4xl mx-auto">
        {filteredQuestions.map(q => (
          <div key={q.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 min-w-0">
            
            <div className="flex gap-3 md:gap-4 items-center border-b border-gray-100 pb-4">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0">
                {q.id}
              </span>
              <div className="flex-1 min-w-0">
                {q.questionText ? (
                  <>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 break-words">{q.questionText}</h3>
                    {q.questionTextVi && <p className="text-gray-500 italic text-sm md:text-base mt-1 break-words">{q.questionTextVi}</p>}
                  </>
                ) : (
                  <h3 className="text-base md:text-lg font-bold text-gray-500 italic break-words">Audio only (No text provided)</h3>
                )}
              </div>
            </div>

            {q.audioUrl && (
              <div className="w-full flex justify-center">
                <div className="w-full max-w-md">
                  <AudioPlayer audioUrl={q.audioUrl} />
                </div>
              </div>
            )}

            <div className="w-full">
              {!revealed[q.id] ? (
                <button 
                  onClick={() => handleReveal(q.id)}
                  className="w-full py-5 md:py-6 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-base md:text-lg font-bold transition-all shadow-md cursor-pointer p-4 text-center"
                >
                  🔒 BẤM ĐỂ HIỆN ĐÁP ÁN
                </button>
              ) : (
                <div className="w-full flex flex-col justify-between bg-green-50 p-5 md:p-6 rounded-xl border border-green-200 animate-fade-in min-w-0">
                  <div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-1 flex-shrink-0">✅</span>
                      <div className="min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          {q.correctAnswer && <span className="bg-green-600 text-white font-black px-2 py-0.5 rounded w-max">{q.correctAnswer}</span>}
                          <p className="text-lg md:text-xl font-bold text-green-900 break-words">{q.correctAnswerText}</p>
                        </div>
                        {q.correctAnswerTextVi && <p className="text-green-700 text-sm md:text-base break-words mt-1 sm:mt-0">{q.correctAnswerTextVi}</p>}
                      </div>
                    </div>
                    
                    {q.trap && (
                      <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300 flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">⚠️</span>
                        <p className="text-yellow-900 font-medium text-sm md:text-base break-words">{q.trap}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <ConfidenceButtons 
                      isConfident={isConfident(q.id)} 
                      onMark={(val) => markConfident(q.id, val)} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-bold text-xl px-4">
            Không có câu hỏi nào (hoặc bạn đã nhớ hết các câu!)
          </div>
        )}
      </div>
    </div>
  );
}
