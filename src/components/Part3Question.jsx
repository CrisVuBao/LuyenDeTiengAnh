import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import { useWrongAnswers } from '../hooks/useWrongAnswers';

export default function Part3Question({ questionData, isFocusMode }) {
  const { id, audioUrl, question, options, transcript, paraphrase } = questionData;
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const { addWrongAnswer } = useWrongAnswers();

  const handleSelect = (letter, isCorrect) => {
    setSelectedAnswer(letter);
    if (!isCorrect) {
      addWrongAnswer(id, 'part3');
    }
  };

  // Xử lý highligh keyword trong transcript
  const renderTranscript = () => {
    if (!paraphrase) return transcript;

    let highlightedText = transcript;
    Object.keys(paraphrase).forEach((keyword) => {
      // Dùng regex để thay thế và thêm thẻ span, lưu ý dùng một placeholder an toàn nếu có nhiều keyword
      // Ở đây code đơn giản cho 1 keyword
      const regex = new RegExp(`(${keyword})`, 'gi');
      
      const parts = transcript.split(regex);
      highlightedText = parts.map((part, i) => {
        if (part.toLowerCase() === keyword.toLowerCase()) {
          return (
            <span 
              key={i}
              className="bg-yellow-300 text-black px-1 rounded cursor-pointer relative group"
              onClick={() => setActiveTooltip(activeTooltip === keyword ? null : keyword)}
            >
              {part}
              {/* Tooltip */}
              {activeTooltip === keyword && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-800 text-white text-xs px-3 py-1 rounded shadow-lg z-10">
                  =&gt; {paraphrase[keyword]}
                  {/* Mũi tên tooltip */}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
                </span>
              )}
            </span>
          );
        }
        return part;
      });
    });

    return <>{highlightedText}</>;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
      {/* Cột trái: Audio & Script */}
      <div className="flex-1 space-y-6">
        <AudioPlayer audioUrl={audioUrl} />
        
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Transcript (Nghe mù):</h3>
          {/* Transcript bị che đen, hover vào sẽ hiện */}
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-transparent bg-black hover:bg-transparent hover:text-gray-800 transition-colors duration-300 select-none hover:select-auto cursor-help leading-relaxed rounded">
              {renderTranscript()}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">* Di chuột vào vùng đen để xem transcript. Bấm vào chữ bôi vàng để xem bẫy đồng nghĩa.</p>
        </div>
      </div>

      {/* Cột phải: Câu hỏi & Đáp án */}
      <div className="flex-1">
        <div className="flex gap-3 items-start mb-4">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
            {id}
          </div>
          <p className="text-lg font-medium text-gray-800">{question}</p>
        </div>

        <div className="space-y-3">
          {options.map((opt, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            const isCorrect = opt.isCorrect;
            const isSelected = selectedAnswer === letter;
            
            // Xử lý Focus Mode
            let btnClass = "w-full text-left p-3 rounded-lg border transition-all ";
            if (isFocusMode) {
              if (isCorrect) {
                btnClass += "bg-green-50 border-green-500 text-green-700 font-medium ";
              } else {
                btnClass += "opacity-30 line-through bg-gray-50 border-gray-200 pointer-events-none ";
              }
            } else {
              if (!selectedAnswer) {
                btnClass += "border-gray-300 hover:bg-blue-50 cursor-pointer ";
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
                key={index} 
                disabled={isFocusMode || selectedAnswer !== null}
                onClick={() => handleSelect(letter, isCorrect)}
                className={btnClass}
              >
                <span className="font-bold mr-2">{letter}.</span> {opt.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
