import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import { useWrongAnswers } from '../hooks/useWrongAnswers';

export default function Part2Simulator({ questionData }) {
  const { id, audioUrl, correctAnswer, transcript, options } = questionData;
  const [selected, setSelected] = useState(null);
  const { addWrongAnswer } = useWrongAnswers();

  const handleSelect = (choice) => {
    if (!selected) {
      setSelected(choice);
      if (choice !== correctAnswer) {
        addWrongAnswer(id, 'part2');
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-700">Câu {id}</h2>
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Part 2 Simulator</span>
      </div>

      <div className="mb-8 flex justify-center">
        <AudioPlayer audioUrl={audioUrl} />
      </div>

      {/* 3 Blocks to select */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['A', 'B', 'C'].map((choice) => {
          let blockClass = "aspect-square rounded-2xl flex items-center justify-center text-4xl font-bold transition-all duration-300 cursor-pointer border-4 shadow-sm hover:shadow-md hover:-translate-y-1 ";
          
          if (!selected) {
            blockClass += "bg-gray-50 border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50";
          } else {
            if (choice === correctAnswer) {
              blockClass += "bg-green-100 border-green-500 text-green-600";
            } else if (choice === selected) {
              blockClass += "bg-red-100 border-red-500 text-red-600";
            } else {
              blockClass += "bg-gray-50 border-gray-100 text-gray-300 opacity-50";
            }
          }

          return (
            <button
              key={choice}
              disabled={selected !== null}
              onClick={() => handleSelect(choice)}
              className={blockClass}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {/* Kết quả & Transcript (chỉ hiện sau khi đã chọn) */}
      {selected && (
        <div className="animate-fade-in bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded text-sm font-bold mb-2 ${selected === correctAnswer ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {selected === correctAnswer ? '✓ Chính xác!' : '✗ Sai rồi!'}
            </span>
            <p className="text-lg font-medium text-gray-800">Q: {transcript}</p>
          </div>
          
          <div className="space-y-2">
            {['A', 'B', 'C'].map(opt => (
              <p key={opt} className={`${opt === correctAnswer ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
                {opt}: {options[opt]}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
