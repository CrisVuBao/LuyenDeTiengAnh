import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function GrammarReflex({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [isChantingMode, setIsChantingMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const { isConfident, markConfident } = useConfidence(testId);

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

  const renderFilledQuestion = (question, options, correctAnswer) => {
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} />
        
        <button 
          onClick={() => setIsChantingMode(!isChantingMode)}
          className="flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold hover:bg-purple-200 transition-colors"
        >
          {isChantingMode ? <ToggleRight size={24} className="text-purple-600" /> : <ToggleLeft size={24} />}
          Chế độ đọc tụng (Chanting)
        </button>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {filteredQuestions.map(q => {
          const isAnswered = !!selectedAnswers[q.id];
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctAnswer;

          return (
            <div key={q.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                {q.id}
              </span>
              
              <div className="flex-1 w-full">
                {isChantingMode ? (
                  // CHANTING MODE
                  <div className="space-y-4">
                    <p className="text-xl text-gray-800 font-medium leading-relaxed">
                      {renderFilledQuestion(q.question, q.options, q.correctAnswer)}
                    </p>
                    {q.translation && <p className="text-gray-500 italic">{q.translation}</p>}
                    
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      {q.grammarTag && <span className="inline-block bg-blue-200 text-blue-900 text-xs font-bold px-2 py-1 rounded mb-2">#{q.grammarTag}</span>}
                      {q.recognitionKey && (
                        <p className="font-bold text-blue-900 text-lg mb-2">🔑 {q.recognitionKey}</p>
                      )}
                      {q.explanation && <p className="text-blue-800 text-sm">{q.explanation}</p>}
                    </div>

                    <ConfidenceButtons 
                      isConfident={isConfident(q.id)} 
                      onMark={(val) => markConfident(q.id, val)} 
                    />
                  </div>
                ) : (
                  // ACTIVE RECALL MODE
                  <div className="space-y-6">
                    <p className="text-xl text-gray-800 font-medium leading-relaxed">
                      {q.question}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(q.options).map(([key, text]) => {
                        let btnClass = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                        if (isAnswered) {
                          if (key === q.correctAnswer) {
                            btnClass = "bg-green-100 border-green-500 text-green-800 shadow-md ring-2 ring-green-400";
                          } else if (key === selected && !isCorrect) {
                            btnClass = "bg-red-50 border-red-300 text-red-600 line-through opacity-70";
                          } else {
                            btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={key}
                            onClick={() => handleSelect(q.id, key)}
                            disabled={isAnswered}
                            className={`p-4 rounded-xl border text-left font-medium transition-all ${btnClass}`}
                          >
                            <span className="font-bold mr-2">{key}.</span> {text}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="animate-fade-in space-y-4 mt-6">
                        <div className={`p-5 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <h4 className={`text-xl font-black mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {isCorrect ? '✅ CHÍNH XÁC!' : `❌ SAI RỒI! Đáp án là ${q.correctAnswer}`}
                          </h4>
                          
                          {q.recognitionKey && (
                            <p className="font-bold text-gray-900 text-lg mb-2">🔑 {q.recognitionKey}</p>
                          )}
                          {q.explanation && <p className="text-gray-700">{q.explanation}</p>}
                        </div>

                        <ConfidenceButtons 
                          isConfident={isConfident(q.id)} 
                          onMark={(val) => markConfident(q.id, val)} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-bold text-xl">
            Không có câu hỏi nào (hoặc bạn đã nhớ hết các câu!)
          </div>
        )}
      </div>
    </div>
  );
}
