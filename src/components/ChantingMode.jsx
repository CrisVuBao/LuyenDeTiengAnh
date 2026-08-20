import React, { useState } from 'react';

export default function ChantingMode({ data }) {
  const [showExplanation, setShowExplanation] = useState(false);
  
  const parts = [...(data.part5 || []), ...(data.part6 || [])];

  const renderFilledQuestion = (question, options, correctAnswer) => {
    const correctFullText = options[correctAnswer];
    // Tách lấy từ tiếng Anh trước dấu ngoặc (nếu có)
    const correctWord = correctFullText.includes('(') 
      ? correctFullText.split('(')[0].trim() 
      : correctFullText;

    const parts = question.split('-------');
    if (parts.length < 2) return <span>{question}</span>;

    return (
      <span>
        {parts[0]}
        <strong className="text-green-600 font-bold mx-1">
          [{correctWord}]
        </strong>
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Part 5 & 6: Chanting Mode</h2>
          <p className="text-gray-500 text-sm mt-1">Luyện đọc nguyên cụm (Collocation)</p>
        </div>
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          {showExplanation ? 'Ẩn giải thích' : 'Hiện giải thích'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {parts.map(q => (
          <div key={q.id} className="p-6 md:p-8 hover:bg-gray-50 transition-colors">
            {q.passage && (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 border-l-4 border-gray-300">
                <span className="font-bold mr-2">Context:</span>
                {q.passage}
              </div>
            )}
            
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                {q.id}
              </span>
              <div className="flex-1">
                <p className="text-xl text-gray-800 leading-relaxed font-medium">
                  {renderFilledQuestion(q.question, q.options, q.correctAnswer)}
                </p>
                <p className="text-gray-500 italic mt-3 text-sm">{q.translation}</p>
                
                {showExplanation && q.explanation && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-gray-700 animate-fade-in">
                    <strong className="text-yellow-800 block mb-1">💡 Giải thích:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
