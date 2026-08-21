import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import useStudyState from '../hooks/useStudyState';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function ParaphraseMapper({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  
  const { isConfident, markConfident, resetConfidenceForQuestions } = useConfidence(testId);
  const { revealed, setRevealed, resetStudyState } = useStudyState(testId, 'part34');

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
    resetConfidenceForQuestions(data.map(q => q.id));
  };

  const filteredQuestions = filterUnsure 
    ? questions.filter(q => isConfident(q.id) === false)
    : questions;

  const renderHighlight = (text, mapData) => {
    if (!mapData || mapData.length === 0 || !text) return text;
    
    const keywords = mapData.map(m => m.inTranscript).filter(Boolean);
    if(keywords.length === 0) return text;

    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const matchedMap = mapData.find(m => m.inTranscript.toLowerCase() === part.toLowerCase());
      if (matchedMap) {
        const color = matchedMap.color === 'blue' ? '#93c5fd' : '#fde047'; 
        return (
          <span key={i} style={{ backgroundColor: color }} className="text-gray-900 px-1 mx-0.5 rounded font-bold break-words">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const grouped = {};
  filteredQuestions.forEach(q => {
    const key = q.passageId || q.audioUrl || `q_${q.id}`;
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        audioUrl: q.audioUrl,
        questions: []
      };
    }
    grouped[key].questions.push(q);
  });

  return (
    <div>
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} onReset={handleReset} />
      
      <div className="space-y-8 md:space-y-12">
        {Object.values(grouped).map(group => (
          <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {group.audioUrl && (
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-center">
                <div className="w-full max-w-md">
                  <AudioPlayer audioUrl={group.audioUrl} />
                </div>
              </div>
            )}

            <div className="p-5 md:p-8 space-y-8">
              {group.questions.map(q => (
                <div key={q.id} className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                  
                  {/* Cột trái: Đề bài */}
                  <div className="flex flex-col gap-4 min-w-0">
                    <div className="flex gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {q.id}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 break-words">{q.question}</h3>
                        {q.questionVi && <p className="text-gray-500 italic mt-1 text-sm md:text-base break-words">{q.questionVi}</p>}
                      </div>
                    </div>

                    {!revealed[q.id] ? (
                      <button 
                        onClick={() => handleReveal(q.id)}
                        className="mt-4 w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-base md:text-lg font-bold transition-all shadow-md px-4 text-center"
                      >
                        🔒 LẬT ĐÁP ÁN & ĐỒNG NGHĨA
                      </button>
                    ) : (
                      <div className="mt-4 flex flex-col h-full bg-green-50 p-4 md:p-5 rounded-xl border border-green-200 animate-fade-in min-w-0">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">Đáp án đúng</span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            {q.correctAnswer && <span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded text-sm w-max">{q.correctAnswer}</span>}
                            <p className="text-lg md:text-xl font-bold text-green-900 break-words">{q.correctAnswerText}</p>
                          </div>
                          {q.correctAnswerTextVi && <p className="text-green-700 mt-1 text-sm md:text-base break-words">{q.correctAnswerTextVi}</p>}

                          {/* Paraphrase Map */}
                          {q.paraphraseMap && q.paraphraseMap.length > 0 && (
                            <div className="mt-4 space-y-2 bg-white p-3 rounded-lg border border-green-100 overflow-x-auto hide-scrollbar">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cặp đồng nghĩa:</p>
                              {q.paraphraseMap.map((p, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                  <span style={{ backgroundColor: p.color === 'blue' ? '#93c5fd' : '#fde047' }} className="px-2 py-0.5 rounded text-gray-900 break-words max-w-[45%]">
                                    {p.inTranscript}
                                  </span>
                                  <span className="text-gray-400">⟶</span>
                                  <span style={{ backgroundColor: p.color === 'blue' ? '#93c5fd' : '#fde047' }} className="px-2 py-0.5 rounded text-gray-900 break-words max-w-[45%]">
                                    {p.inAnswer}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.trap && (
                            <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300 text-sm md:text-base">
                              <span className="font-bold text-yellow-900">⚠️ Bẫy: </span>
                              <span className="text-yellow-800 break-words">{q.trap}</span>
                            </div>
                          )}
                          
                          {q.recognitionKey && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm md:text-base">
                              <span className="font-bold text-blue-900">🔑 Khóa: </span>
                              <span className="text-blue-800 break-words">{q.recognitionKey}</span>
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

                  {/* Cột phải: Transcript giấu mặt */}
                  <div className="relative group p-5 md:p-6 bg-gray-900 rounded-xl overflow-hidden flex flex-col justify-center min-h-[150px] lg:min-h-full">
                    {!revealed[q.id] ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-center px-4">
                        Bấm "Lật đáp án" để xem Transcript
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-black/80 lg:group-hover:opacity-0 transition-opacity duration-500 z-10 flex items-center justify-center pointer-events-none opacity-0 lg:opacity-100">
                          <span className="text-white font-bold tracking-widest uppercase bg-black/50 px-4 py-2 rounded-lg text-sm text-center">Di chuột để đọc Transcript</span>
                        </div>
                        
                        <div className="text-base md:text-lg leading-relaxed text-gray-200 lg:group-hover:text-gray-800 lg:group-hover:bg-white p-4 md:p-6 -m-4 md:-m-6 transition-all duration-500 lg:blur-md lg:group-hover:blur-none h-full flex items-center bg-gray-800 lg:bg-transparent">
                          <p className="break-words">{renderHighlight(q.transcript, q.paraphraseMap)}</p>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              ))}
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
