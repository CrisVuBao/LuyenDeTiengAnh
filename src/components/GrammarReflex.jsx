import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import useStudyState from '../hooks/useStudyState';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function GrammarReflex({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [isChantingMode, setIsChantingMode] = useState(false);
  
  const { isConfident, markConfident, resetConfidenceForQuestions } = useConfidence(testId);
  const { selectedAnswers, setSelectedAnswers, resetStudyState } = useStudyState(testId, 'part5');

  useEffect(() => {
    setQuestions([...data]);
  }, [data]);

  const shuffle = () => {
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const filteredQuestions = filterUnsure 
    ? questions.filter(q => isConfident(q.id) === false)
    : questions;

  const handleSelect = (qId, optionKey) => {
    if (!selectedAnswers[qId]) {
      setSelectedAnswers(prev => ({ ...prev, [qId]: optionKey }));
    }
  };

  const handleReset = () => {
    resetStudyState();
    resetConfidenceForQuestions(data.map(q => q.id));
  };

  const renderFilledQuestion = (question, options, correctAnswer) => {
    if (!options || !options[correctAnswer]) return <span>{question}</span>;
    const correctFullText = options[correctAnswer];
    const correctWord = correctFullText.includes('(') 
      ? correctFullText.split('(')[0].trim() 
      : correctFullText;

    const parts = question.split('-------');
    if (parts.length < 2) return <span>{question}</span>;

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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} onReset={handleReset} />
        
        <button 
          onClick={() => setIsChantingMode(!isChantingMode)}
          className="w-full md:w-auto flex justify-center items-center gap-2 bg-purple-100 text-purple-800 px-5 py-2.5 rounded-none border-2 border-purple-800 font-bold hover:bg-purple-200 transition-colors"
        >
          {isChantingMode ? <ToggleRight size={24} className="text-purple-600" /> : <ToggleLeft size={24} />}
          Chế độ Đọc Tụng (Chanting)
        </button>
      </div>

      <div className="bg-white max-w-4xl mx-auto border-2 border-black p-4 md:p-8 font-serif text-gray-900 shadow-xl mb-12">
        {/* TOEIC Directions Box */}
        <div className="mb-8 border-b-2 border-black pb-6">
          <h2 className="text-2xl font-bold mb-2">READING TEST</h2>
          <p className="text-sm md:text-base leading-relaxed mb-4">
            In the Reading test, you will read a variety of texts and answer several different types of reading comprehension questions. The entire Reading test will last 75 minutes. There are three parts, and directions are given for each part. You are encouraged to answer as many questions as possible within the time allowed.
          </p>
          <p className="text-sm md:text-base leading-relaxed">
            You must mark your answers on the separate answer sheet. Do not write your answers in your test book.
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold mb-2">PART 5</h3>
          <p className="text-sm md:text-base leading-relaxed">
            <span className="font-bold">Directions:</span> A word or phrase is missing in each of the sentences below. Four answer choices are given below each sentence. Select the best answer to complete the sentence. Then mark the letter (A), (B), (C), or (D) on your answer sheet.
          </p>
        </div>

        <div className="space-y-10">
          {filteredQuestions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id];
            const selected = selectedAnswers[q.id];
            const isCorrect = selected === q.correctAnswer;

            return (
              <div key={q.id} className="relative">
                {isChantingMode ? (
                  // CHANTING MODE (Paper overlay)
                  <div className="p-4 bg-yellow-50/50 border border-yellow-200">
                    <div className="flex gap-2 mb-3">
                      <span className="font-bold text-lg">{q.id}.</span>
                      <p className="text-lg leading-relaxed break-words">
                        {renderFilledQuestion(q.question, q.options, q.correctAnswer)}
                      </p>
                    </div>
                    {q.translation && <p className="text-gray-600 italic text-sm md:text-base pl-8 mb-4">{q.translation}</p>}
                    
                    <div className="pl-8 mb-4">
                      {q.grammarTag && <span className="inline-block border border-gray-400 text-gray-700 text-xs font-bold px-2 py-1 mb-2">#{q.grammarTag}</span>}
                      {q.recognitionKey && (
                        <p className="font-bold text-gray-900 text-base mb-1">🔑 {q.recognitionKey}</p>
                      )}
                      {q.explanation && <p className="text-gray-800 text-sm">{q.explanation}</p>}
                    </div>

                    <div className="pl-8">
                      <ConfidenceButtons 
                        isConfident={isConfident(q.id)} 
                        onMark={(val) => markConfident(q.id, val)} 
                      />
                    </div>
                  </div>
                ) : (
                  // ACTIVE RECALL MODE (Paper test style)
                  <div>
                    <div className="flex gap-2 mb-2">
                      <span className="font-bold text-lg">{q.id}.</span>
                      <p className="text-lg leading-relaxed break-words">
                        {q.question}
                      </p>
                    </div>

                    <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                      {q.options && Object.entries(q.options).map(([key, text]) => {
                        let btnClass = "hover:bg-gray-100 cursor-pointer";
                        let keyText = `(${key})`;
                        
                        if (isAnswered) {
                          if (key === q.correctAnswer) {
                            btnClass = "bg-green-100 font-bold text-green-900";
                            keyText = `[ ${key} ]`; // Checkmark style
                          } else if (key === selected && !isCorrect) {
                            btnClass = "bg-gray-200 text-gray-400 line-through";
                            keyText = `( X )`;
                          } else {
                            btnClass = "text-gray-400";
                          }
                        }

                        return (
                          <div
                            key={key}
                            onClick={() => handleSelect(q.id, key)}
                            className={`p-1.5 -ml-1.5 transition-all text-base md:text-lg break-words ${btnClass}`}
                          >
                            <span className="font-bold mr-2">{keyText}</span> {text}
                          </div>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="mt-6 ml-8 p-4 border border-gray-300 bg-gray-50/80 font-sans shadow-inner">
                        <h4 className={`text-sm md:text-base font-bold mb-2 uppercase ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                          {isCorrect ? '✓ CORRECT' : `✗ INCORRECT (Correct: ${q.correctAnswer})`}
                        </h4>
                        
                        {q.recognitionKey && (
                          <p className="font-bold text-gray-900 text-sm md:text-base mb-2">🔑 {q.recognitionKey}</p>
                        )}
                        {q.explanation && <p className="text-gray-700 text-sm md:text-base mb-4">{q.explanation}</p>}
                        
                        <div className="border-t border-gray-200 pt-4 mt-2">
                          <ConfidenceButtons 
                            isConfident={isConfident(q.id)} 
                            onMark={(val) => markConfident(q.id, val)} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
