import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import useStudyState from '../hooks/useStudyState';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function ScanningRadar({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  
  const { isConfident, markConfident, resetConfidenceForQuestions } = useConfidence(testId);
  const { revealed, setRevealed, resetStudyState } = useStudyState(testId, 'part7');
  
  // Note: activeHighlight doesn't need to be persisted to localStorage because it's just a temporary UI effect,
  // but we can persist it or just use standard useState. I'll use standard useState.
  const [activeHighlight, setActiveHighlight] = useState(null);

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
    setActiveHighlight(null);
    resetConfidenceForQuestions(data.map(q => q.id));
  };

  const filteredQuestions = filterUnsure 
    ? questions.filter(q => isConfident(q.id) === false)
    : questions;

  const grouped = {};
  filteredQuestions.forEach(q => {
    const key = q.passageTitle || q.passageText || `q_${q.id}`;
    if (!grouped[key]) {
      grouped[key] = {
        title: q.passageTitle || 'Đoạn văn',
        passageText: q.passageText,
        audioUrl: q.audioUrl,
        questions: []
      };
    }
    grouped[key].questions.push(q);
  });

  const renderPassage = (text, currentActiveHighlight) => {
    if (!text) return null;
    if (!currentActiveHighlight) return <span className="break-words whitespace-pre-wrap">{text}</span>;
    
    try {
      const regex = new RegExp(`(${currentActiveHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => 
        part.toLowerCase() === currentActiveHighlight.toLowerCase() ? 
          <span key={i} className="bg-yellow-300 text-yellow-900 font-bold px-1 rounded shadow-sm break-words whitespace-pre-wrap animate-pulse transition-all duration-300">
            {part}
          </span> : 
          <span key={i} className="break-words whitespace-pre-wrap opacity-50 transition-opacity duration-300">{part}</span>
      );
    } catch {
      return <span className="break-words whitespace-pre-wrap">{text}</span>;
    }
  };

  return (
    <div>
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} onReset={handleReset} />
      
      <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto">
        {Object.values(grouped).map((group, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            <div className="grid lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              
              {/* Cột trái: Bài đọc */}
              <div className="bg-blue-50/50 p-5 md:p-8 flex flex-col min-w-0 h-full">
                <div className="sticky top-4">
                  <h3 className="font-bold text-blue-900 text-lg md:text-xl mb-4 break-words">📖 {group.title}</h3>
                  {group.audioUrl && (
                    <div className="mb-4">
                      <AudioPlayer audioUrl={group.audioUrl} />
                    </div>
                  )}
                  {group.passageText && (
                    <div className="text-gray-800 leading-relaxed font-serif bg-white p-5 md:p-6 rounded-xl border border-blue-100 shadow-sm text-sm md:text-base max-h-[40vh] lg:max-h-[70vh] overflow-y-auto hide-scrollbar break-words">
                      {renderPassage(group.passageText, activeHighlight)}
                    </div>
                  )}
                </div>
              </div>

              {/* Cột phải: Câu hỏi */}
              <div className="p-5 md:p-8 space-y-8">
                {group.questions.map(q => (
                  <div key={q.id} 
                    className={`border-b border-gray-100 pb-8 last:border-0 last:pb-0 transition-all min-w-0 ${activeHighlight === q.evidenceInPassage ? 'ring-2 ring-yellow-300 p-4 rounded-xl bg-yellow-50/30' : ''}`}
                    onMouseEnter={() => revealed[q.id] && q.evidenceInPassage && setActiveHighlight(q.evidenceInPassage)}
                    onMouseLeave={() => setActiveHighlight(null)}
                  >
                    <div className="flex gap-4 items-start min-w-0">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                        {q.id}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-lg md:text-xl text-gray-800 font-medium mb-2 break-words">{q.question}</p>
                        {q.translation && <p className="text-gray-500 italic mb-4 text-sm md:text-base break-words">{q.translation}</p>}
                        
                        {!revealed[q.id] ? (
                          <button 
                            onClick={() => handleReveal(q.id)}
                            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-base md:text-lg font-bold transition-all shadow-md cursor-pointer text-center"
                          >
                            🔒 LẬT ĐÁP ÁN & TÌM DẪN CHỨNG
                          </button>
                        ) : (
                          <div className="bg-green-50 p-5 md:p-6 rounded-xl border border-green-200 animate-fade-in space-y-4 min-w-0">
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">Đáp án đúng</span>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                {q.correctAnswer && <span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded w-max">{q.correctAnswer}</span>}
                                <p className="text-lg md:text-xl font-bold text-green-900 break-words">{q.correctAnswerText || (q.options && q.options[q.correctAnswer])}</p>
                              </div>
                            </div>

                            {/* Dẫn chứng (Evidence Radar) */}
                            {q.evidenceInPassage && (
                              <div className="p-3 md:p-4 bg-yellow-100/50 rounded-lg border border-yellow-300 min-w-0">
                                <span className="font-bold text-yellow-900 flex items-center gap-2 text-sm md:text-base mb-1">
                                  🎯 Dẫn chứng trong bài:
                                </span>
                                <p className="text-yellow-800 italic text-sm md:text-base break-words">"...{q.evidenceInPassage}..."</p>
                              </div>
                            )}

                            {(q.recognitionKey || q.explanation) && (
                              <div className="p-4 bg-white rounded-lg border border-green-100 text-sm md:text-base min-w-0">
                                {q.recognitionKey && <p className="font-bold text-blue-900 mb-2 break-words">🔑 {q.recognitionKey}</p>}
                                {q.explanation && <p className="text-gray-700 break-words">{q.explanation}</p>}
                              </div>
                            )}
                            
                            {q.trap && (
                              <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200 text-sm md:text-base min-w-0">
                                <span className="font-bold text-red-900">⚠️ Bẫy: </span>
                                <span className="text-red-800 break-words">{q.trap}</span>
                              </div>
                            )}

                            <ConfidenceButtons 
                              isConfident={isConfident(q.id)} 
                              onMark={(val) => markConfident(q.id, val)} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
