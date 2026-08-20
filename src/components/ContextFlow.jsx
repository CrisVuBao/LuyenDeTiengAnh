import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function ContextFlow({ data, testId }) {
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

  // Nhóm theo passageTitle hoặc passage
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
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} />
      
      <div className="space-y-12 max-w-5xl mx-auto">
        {Object.values(grouped).map((group, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            <div className="bg-blue-50 border-b border-blue-100 p-6">
              <h3 className="font-bold text-blue-900 text-lg mb-2">📖 {group.title}</h3>
              {group.passageContext && (
                <div className="text-gray-800 leading-relaxed italic bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                  {group.passageContext}
                </div>
              )}
              {group.audioUrl && (
                <div className="mt-4 max-w-md">
                  <AudioPlayer audioUrl={group.audioUrl} />
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 space-y-8 divide-y divide-gray-100">
              {group.questions.map(q => (
                <div key={q.id} className="pt-8 first:pt-0 flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                    {q.id}
                  </span>
                  
                  <div className="flex-1">
                    <p className="text-lg text-gray-800 font-medium mb-4">{q.question || q.text}</p>
                    {q.translation && <p className="text-gray-500 italic mb-4">{q.translation}</p>}
                    
                    {!revealed[q.id] ? (
                      <button 
                        onClick={() => handleReveal(q.id)}
                        className="w-full md:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-lg font-bold transition-all shadow-md cursor-pointer"
                      >
                        🔒 LẬT ĐÁP ÁN
                      </button>
                    ) : (
                      <div className="bg-green-50 p-6 rounded-xl border border-green-200 animate-fade-in space-y-4">
                        <div>
                          <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">Đáp án đúng</span>
                          <div className="flex items-center gap-2">
                            {q.correctAnswer && <span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded">{q.correctAnswer}</span>}
                            <p className="text-xl font-bold text-green-900">{q.correctAnswerText || (q.options && q.options[q.correctAnswer])}</p>
                          </div>
                          {q.correctAnswerTextVi && <p className="text-green-700 mt-1">{q.correctAnswerTextVi}</p>}
                        </div>

                        {(q.recognitionKey || q.explanation) && (
                          <div className="p-4 bg-white rounded-lg border border-green-100">
                            {q.recognitionKey && <p className="font-bold text-blue-900 mb-2">🔑 {q.recognitionKey}</p>}
                            {q.explanation && <p className="text-gray-700">{q.explanation}</p>}
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
              ))}
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
