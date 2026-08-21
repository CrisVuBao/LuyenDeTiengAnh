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
      
      <div className="bg-white max-w-5xl mx-auto border-2 border-black p-4 md:p-8 shadow-xl mb-12 font-serif text-gray-900">
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">PART 7</h3>
          <p className="text-sm md:text-base leading-relaxed">
            <span className="font-bold">Directions:</span> In this part you will read a selection of texts, such as magazine and newspaper articles, e-mails, and instant messages. Each text or set of texts is followed by several questions. Select the best answer for each question and mark the letter (A), (B), (C), or (D) on your answer sheet.
          </p>
        </div>

        <div className="space-y-12">
          {Object.values(grouped).map((group, idx) => (
            <div key={idx} className="mb-12">
              <div className="flex flex-col gap-6">
                
                {/* Passage */}
                <div className="w-full">
                  <h4 className="font-bold mb-2 uppercase text-sm text-center">{group.title}</h4>
                  <div className="border-2 border-black p-5 md:p-6 bg-white leading-loose text-base md:text-lg text-justify mx-auto max-w-3xl">
                    {group.passageText && renderPassage(group.passageText, activeHighlight)}
                  </div>
                  {group.audioUrl && (
                    <div className="mt-4 max-w-sm mx-auto">
                      <AudioPlayer audioUrl={group.audioUrl} />
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div className="w-full space-y-8 mt-6">
                  {group.questions.map(q => (
                    <div key={q.id} 
                      className={`relative transition-all min-w-0 ${activeHighlight === q.evidenceInPassage ? 'bg-yellow-50/50 outline outline-2 outline-yellow-200 p-2 -m-2' : ''}`}
                      onMouseEnter={() => revealed[q.id] && q.evidenceInPassage && setActiveHighlight(q.evidenceInPassage)}
                      onMouseLeave={() => setActiveHighlight(null)}
                    >
                      <div className="flex gap-2">
                        <span className="font-bold text-lg">{q.id}.</span>
                        <div className="text-lg leading-relaxed break-words w-full">
                          {q.question}
                          
                          {!revealed[q.id] ? (
                            <div 
                              onClick={() => handleReveal(q.id)}
                              className="mt-4 border border-dashed border-gray-400 p-3 text-center text-gray-500 cursor-pointer hover:bg-gray-50 text-sm font-sans w-full max-w-md"
                            >
                              [ Click to Reveal Answer & Evidence ]
                            </div>
                          ) : (
                            <div className="mt-4 p-4 border border-gray-300 bg-gray-50/80 font-sans text-sm md:text-base shadow-inner w-full">
                              <div className="mb-3">
                                <span className="font-bold uppercase text-green-700 block mb-1">Correct Answer</span>
                                <div className="flex items-center gap-2">
                                  {q.correctAnswer && <span className="font-bold border border-green-600 text-green-700 px-1.5">[ {q.correctAnswer} ]</span>}
                                  <span className="font-bold text-gray-800">{q.correctAnswerText || (q.options && q.options[q.correctAnswer])}</span>
                                </div>
                              </div>
                              
                              {q.translation && <p className="text-gray-600 italic mb-3">{q.translation}</p>}

                              {q.evidenceInPassage && (
                                <div className="mt-3 p-3 bg-yellow-100/50 border border-yellow-300">
                                  <span className="font-bold text-yellow-900 block mb-1">🎯 Evidence in text:</span>
                                  <p className="text-yellow-900 italic">"...{q.evidenceInPassage}..."</p>
                                </div>
                              )}

                              {(q.recognitionKey || q.explanation) && (
                                <div className="mt-3 border-t border-gray-200 pt-3">
                                  {q.recognitionKey && <p className="font-bold text-gray-900 mb-1">🔑 {q.recognitionKey}</p>}
                                  {q.explanation && <p className="text-gray-700">{q.explanation}</p>}
                                </div>
                              )}
                              
                              {q.trap && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 text-red-800">
                                  <span className="font-bold text-red-900">⚠️ Trap: </span>{q.trap}
                                </div>
                              )}

                              <div className="border-t border-gray-200 pt-3 mt-3">
                                <ConfidenceButtons 
                                  isConfident={isConfident(q.id)} 
                                  onMark={(val) => markConfident(q.id, val)} 
                                />
                              </div>
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
            <div className="text-center py-20 text-gray-500 font-bold text-xl font-sans">
              No questions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
