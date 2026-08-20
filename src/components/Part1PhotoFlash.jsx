import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function Part1PhotoFlash({ data, testId }) {
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
      
      <div className="grid gap-8">
        {filteredQuestions.map(q => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-center">
            
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-lg w-max">Câu {q.id}</span>
              {q.imageUrl && (
                <img src={q.imageUrl} alt={`Part 1 - ${q.id}`} className="w-full aspect-video object-cover rounded-xl shadow-md border border-gray-200" />
              )}
              {q.audioUrl && (
                <div className="w-full">
                  <AudioPlayer audioUrl={q.audioUrl} />
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              {!revealed[q.id] ? (
                <button 
                  onClick={() => handleReveal(q.id)}
                  className="w-full h-full min-h-[200px] flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg cursor-pointer"
                >
                  🔒 BẤM ĐỂ HIỆN ĐÁP ÁN
                </button>
              ) : (
                <div className="w-full h-full flex flex-col justify-between bg-green-50 p-6 rounded-xl border border-green-200 animate-fade-in">
                  <div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-xl font-bold text-green-900">{q.correctStatement || q.correctAnswerText}</p>
                        {q.correctStatementVi && <p className="text-green-700 mt-1">{q.correctStatementVi}</p>}
                      </div>
                    </div>
                    
                    {q.trap && (
                      <div className="mt-6 p-4 bg-yellow-100 rounded-lg border border-yellow-300 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-yellow-900 font-medium">{q.trap}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
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
