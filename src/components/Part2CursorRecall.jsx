import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function Part2CursorRecall({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [revealed, setRevealed] = useState({});
  const { isConfident, markConfident } = useConfidence(testId);

  useEffect(() => {
    setQuestions([...data]);
  }, [data]);

  const shuffle = () => {
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleReveal = (id) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
  };

  const filteredQuestions = filterUnsure 
    ? questions.filter(q => isConfident(q.id) === false)
    : questions;

  return (
    <div>
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} />
      
      <div className="grid gap-6 max-w-4xl mx-auto">
        {filteredQuestions.map(q => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
            
            <div className="flex gap-4 items-center border-b border-gray-100 pb-4">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0">
                {q.id}
              </span>
              <div className="flex-1">
                {q.questionText ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-800">{q.questionText}</h3>
                    {q.questionTextVi && <p className="text-gray-500 italic">{q.questionTextVi}</p>}
                  </>
                ) : (
                  <h3 className="text-lg font-bold text-gray-500 italic">Audio only (No text provided)</h3>
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
                  className="w-full py-6 flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-lg font-bold transition-all shadow-md cursor-pointer"
                >
                  🔒 BẤM ĐỂ HIỆN ĐÁP ÁN
                </button>
              ) : (
                <div className="w-full flex flex-col justify-between bg-green-50 p-6 rounded-xl border border-green-200 animate-fade-in">
                  <div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-1">✅</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {q.correctAnswer && <span className="bg-green-600 text-white font-black px-2 py-0.5 rounded">{q.correctAnswer}</span>}
                          <p className="text-xl font-bold text-green-900">{q.correctAnswerText}</p>
                        </div>
                        {q.correctAnswerTextVi && <p className="text-green-700">{q.correctAnswerTextVi}</p>}
                      </div>
                    </div>
                    
                    {q.trap && (
                      <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-yellow-900 font-medium">{q.trap}</p>
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
          <div className="text-center py-20 text-gray-500 font-bold text-xl">
            Không có câu hỏi nào (hoặc bạn đã nhớ hết các câu!)
          </div>
        )}
      </div>
    </div>
  );
}
