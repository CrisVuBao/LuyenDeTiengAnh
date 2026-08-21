import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import useStudyState from '../hooks/useStudyState';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function ContextFlow({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  
  const { isConfident, markConfident, resetConfidenceForQuestions } = useConfidence(testId);
  const { revealed, setRevealed, resetStudyState } = useStudyState(testId, 'part6');

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

  const grouped = {};
  filteredQuestions.forEach(q => {
    const key = q.passageTitle || q.passage || `q_${q.id}`;
    if (!grouped[key]) {
      grouped[key] = {
        title: key,
        passageContext: q.passageContext,
        audioUrl: q.audioUrl,
        questions: []
      };
    }
    grouped[key].questions.push(q);
  });

  return (
    <div>
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} onReset={handleReset} />
      
      <div className="bg-white max-w-4xl mx-auto border-2 border-black p-4 md:p-8 shadow-xl mb-12 font-serif text-gray-900">
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">PART 6</h3>
          <p className="text-sm md:text-base leading-relaxed">
            <span className="font-bold">Directions:</span> Read the texts that follow. A word, phrase, or sentence is missing in parts of each text. Four answer choices for each question are given below the text. Select the best answer to complete the text. Then mark the letter (A), (B), (C), or (D) on your answer sheet.
          </p>
        </div>

        <div className="space-y-12">
          {Object.values(grouped).map((group, idx) => (
            <div key={idx} className="mb-12">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Passage Column */}
                <div className="w-full md:w-1/2">
                  <h4 className="font-bold mb-2 uppercase text-sm">{group.title}</h4>
                  <div className="border-2 border-black p-5 md:p-6 bg-white leading-loose text-base md:text-lg text-justify">
                    {group.passageContext ? group.passageContext.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    )) : ""}
                  </div>
                  {group.audioUrl && (
                    <div className="mt-4 max-w-sm">
                      <AudioPlayer audioUrl={group.audioUrl} />
                    </div>
                  )}
                </div>

                {/* Questions Column */}
                <div className="w-full md:w-1/2 space-y-8">
                  {group.questions.map(q => (
                    <div key={q.id} className="relative">
                      
                      <div className="flex gap-2 mb-2">
                        <span className="font-bold text-lg">{q.id}.</span>
                        <div className="text-lg leading-relaxed break-words w-full">
                          {q.question || q.text}
                          
                          {!revealed[q.id] ? (
                            <div 
                              onClick={() => handleReveal(q.id)}
                              className="mt-4 border border-dashed border-gray-400 p-3 text-center text-gray-500 cursor-pointer hover:bg-gray-50 text-sm font-sans"
                            >
                              [ Click to Reveal Answer & Analysis ]
                            </div>
                          ) : (
                            <div className="mt-4 p-4 border border-gray-300 bg-gray-50/80 font-sans text-sm md:text-base shadow-inner">
                              <div className="mb-3">
                                <span className="font-bold uppercase text-green-700 block mb-1">Correct Answer</span>
                                <div className="flex items-center gap-2">
                                  {q.correctAnswer && <span className="font-bold border border-green-600 text-green-700 px-1.5">[ {q.correctAnswer} ]</span>}
                                  <span className="font-bold text-gray-800">{q.correctAnswerText || (q.options && q.options[q.correctAnswer])}</span>
                                </div>
                              </div>
                              
                              {q.translation && <p className="text-gray-600 italic mb-3">{q.translation}</p>}
                              {q.correctAnswerTextVi && <p className="text-gray-600 italic mb-3">{q.correctAnswerTextVi}</p>}

                              {(q.recognitionKey || q.explanation) && (
                                <div className="mt-2 border-t border-gray-200 pt-2">
                                  {q.recognitionKey && <p className="font-bold text-gray-900 mb-1">🔑 {q.recognitionKey}</p>}
                                  {q.explanation && <p className="text-gray-700">{q.explanation}</p>}
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
