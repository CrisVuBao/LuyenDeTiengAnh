import React, { useState } from 'react';
import { useWrongAnswers } from '../hooks/useWrongAnswers';

export default function Part5Question({ questionData, isFocusMode }) {
  const { id, question, translation, options, correctAnswer, explanation } = questionData;
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const { addWrongAnswer } = useWrongAnswers();

  // Xử lý Focus Mode: Điền thẳng đáp án đúng vào câu hỏi
  const renderQuestion = () => {
    if (!isFocusMode) {
      return <span>{question}</span>;
    }
    
    // Tìm từ của đáp án đúng (ví dụ options["B"] -> "his (của anh ấy...)")
    // Tách lấy từ tiếng Anh trước dấu ngoặc nếu có
    const correctFullText = options[correctAnswer];
    const correctWord = correctFullText.includes('(') 
      ? correctFullText.split('(')[0].trim() 
      : correctFullText;

    const parts = question.split('-------');
    if (parts.length < 2) return <span>{question}</span>;

    return (
      <span>
        {parts[0]}
        <strong className="text-green-600 bg-green-100 px-2 py-1 rounded mx-1">
          [{correctWord}]
        </strong>
        {parts[1]}
      </span>
    );
  };

  const handleSelect = (key) => {
    setSelectedAnswer(key);
    setShowExplanation(true);
    if (key !== correctAnswer) {
      addWrongAnswer(id, 'part5');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
          {id}
        </div>
        
        <div className="flex-grow">
          <p className="text-lg font-medium text-gray-800 mb-2 leading-relaxed">
            {renderQuestion()}
          </p>
          <p className="text-sm text-gray-500 italic mb-6">{translation}</p>

          {/* Danh sách đáp án */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {Object.entries(options).map(([key, value]) => {
              const isCorrect = key === correctAnswer;
              const isSelected = selectedAnswer === key;
              
              // CSS logic cho Focus Mode
              let btnClass = "text-left p-4 rounded-lg border transition-all ";
              if (isFocusMode && !isCorrect) {
                btnClass += "opacity-40 line-through bg-gray-50 border-gray-200 cursor-not-allowed ";
              } else if (isFocusMode && isCorrect) {
                btnClass += "bg-green-50 border-green-500 text-green-700 font-medium ";
              } else {
                // Normal mode CSS
                if (!selectedAnswer) {
                  btnClass += "border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer ";
                } else {
                  if (isCorrect) {
                    btnClass += "bg-green-100 border-green-500 text-green-800 font-medium ";
                  } else if (isSelected) {
                    btnClass += "bg-red-100 border-red-500 text-red-800 ";
                  } else {
                    btnClass += "opacity-50 bg-gray-50 border-gray-200 ";
                  }
                }
              }

              return (
                <button
                  key={key}
                  disabled={isFocusMode || selectedAnswer !== null}
                  onClick={() => handleSelect(key)}
                  className={btnClass}
                >
                  <span className="font-bold mr-2">{key}.</span> {value}
                </button>
              );
            })}
          </div>

          {/* Giải thích (Hiện khi đã chọn đáp án hoặc đang ở Focus Mode) */}
          {(showExplanation || isFocusMode) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
              <p><strong>Giải thích:</strong> {explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
