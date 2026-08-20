import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';

export default function AudioReflexTrainer({ data }) {
  const [selectedBlock, setSelectedBlock] = useState(null);

  return (
    <div className="space-y-12">
      {/* Part 1 */}
      {data.part1 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Part 1: Image Reflex</h2>
          <div className="grid gap-8">
            {data.part1.map(q => (
              <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
                <img src={q.imageUrl} alt="Part 1" className="w-full md:w-1/2 aspect-video object-cover rounded-xl shadow-md" />
                <div className="flex-1 flex flex-col justify-center items-center gap-6 w-full">
                  <div className="w-full max-w-sm">
                    <AudioPlayer audioUrl={q.audioUrl} />
                  </div>
                  <div className="w-full bg-green-50 border border-green-200 text-green-800 text-xl font-bold p-6 rounded-xl text-center">
                    {q.correctAnswerText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Part 2 */}
      {data.part2 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Part 2: Cursor Trick Simulator</h2>
          <div className="grid gap-8">
            {data.part2.map(q => (
              <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto w-full">
                <div className="mb-8 flex justify-center">
                  <AudioPlayer audioUrl={q.audioUrl} />
                </div>
                <div className="flex gap-4 justify-center h-48 w-full">
                  {['A', 'B', 'C'].map(choice => (
                    <button
                      key={choice}
                      className={`flex-1 max-w-[150px] rounded-2xl border-4 text-5xl font-black transition-all duration-300
                        ${selectedBlock === `${q.id}-${choice}` 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' 
                          : 'bg-gray-50 border-gray-200 text-gray-300 hover:bg-blue-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                        }`}
                      onClick={() => setSelectedBlock(`${q.id}-${choice}`)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
