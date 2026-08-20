import React, { useState, useEffect } from 'react';
import useConfidence from '../hooks/useConfidence';
import ConfidenceButtons from './ConfidenceButtons';
import Toolbar from './Toolbar';
import AudioPlayer from './AudioPlayer';

export default function ScanningRadar({ data, testId }) {
  const [questions, setQuestions] = useState([]);
  const [filterUnsure, setFilterUnsure] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [revealed, setRevealed] = useState({});
  const { isConfident, markConfident } = useConfidence(testId);

  useEffect(() => {
    setQuestions([...data]);
  }, [data]);

  const shuffle = () => {
    // For Part 7, shuffling passages makes more sense than shuffling questions within passages
    // But since the current implementation groups by passage on the fly, shuffling questions will just change their order within passage.
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleReveal = (id, evidenceKeyword) => {
    setRevealed(prev => ({ ...prev, [id]: true }));
    if (evidenceKeyword) {
      setActiveHighlight(evidenceKeyword);
    }
  };

  const filteredQuestions = filterUnsure 
    ? questions.filter(q => isConfident(q.id) === false)
    : questions;

  const passages = {};
  filteredQuestions.forEach(q => {
    const passageKey = q.passageId || q.passage || 'Unknown Passage';
    if (!passages[passageKey]) {
      passages[passageKey] = {
        id: passageKey,
        title: q.passageTitle || q.passage || 'Reading Passage',
        text: q.passageText || "(Nội dung đoạn văn gốc chưa có trong file dữ liệu. Bạn hãy vào Nhập Liệu để thêm nhé.)",
        audioUrl: q.audioUrl,
        questions: []
      };
    }
    passages[passageKey].questions.push(q);
  });

  const renderPassageWithHighlight = (text, highlightWord) => {
    if (!highlightWord) return text;
    
    // Safely escape the highlight word for regex
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };
    
    const regex = new RegExp(`(${escapeRegExp(highlightWord)})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (part.toLowerCase() === highlightWord.toLowerCase()) {
        return (
          <span key={i} className="bg-yellow-300 text-yellow-900 font-bold px-1 rounded animate-pulse transition-all">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      <Toolbar onShuffle={shuffle} filterUnsure={filterUnsure} setFilterUnsure={setFilterUnsure} />
      
      <div className="space-y-12">
        {Object.values(passages).map((passage, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-700">{passage.title}</h3>
              {passage.audioUrl && (
                <div className="w-full max-w-sm">
                  <AudioPlayer audioUrl={passage.audioUrl} />
                </div>
              )}
            </div>
            
            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              {/* Cột trái: Đoạn văn */}
              <div className="p-6 md:p-8 bg-gray-50/50 leading-relaxed text-gray-800 text-lg whitespace-pre-wrap">
                {renderPassageWithHighlight(passage.text, activeHighlight)}
              </div>

              {/* Cột phải: Câu hỏi */}
              <div className="p-6 md:p-8 space-y-10">
                {passage.questions.map(q => (
                  <div key={q.id} className="space-y-4">
                    <div className="flex gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold flex-shrink-0 mt-1">
                        {q.id}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-xl">{q.question}</h4>
                        {q.translation && <p className="text-gray-500 italic mt-1">{q.translation}</p>}
                      </div>
                    </div>

                    {!revealed[q.id] ? (
                      <div className="ml-11">
                        <button 
                          onClick={() => handleReveal(q.id, q.evidenceInPassage)}
                          className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-md"
                        >
                          🔒 LẬT ĐÁP ÁN
                        </button>
                      </div>
                    ) : (
                      <div className="ml-11 bg-green-50 p-5 rounded-xl border border-green-200 animate-fade-in space-y-4">
                        <div>
                          <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">Đáp án đúng</span>
                          <div className="flex items-center gap-2">
                            {q.correctAnswer && <span className="bg-green-600 text-white font-bold px-2 py-0.5 rounded">{q.correctAnswer}</span>}
                            <p className="text-xl font-bold text-green-900">{q.correctAnswerText || (q.options && q.options[q.correctAnswer])}</p>
                          </div>
                          {q.correctAnswerTextVi && <p className="text-green-700 mt-1">{q.correctAnswerTextVi}</p>}
                        </div>

                        {q.evidenceInPassage && (
                          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🔍</span>
                              <div>
                                <p className="text-xs font-bold text-yellow-800 uppercase">Evidence (Bằng chứng)</p>
                                <p className="text-yellow-900 font-semibold italic">"{q.evidenceInPassage}"</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setActiveHighlight(q.evidenceInPassage)}
                              className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg hover:bg-yellow-300 font-bold transition-colors"
                            >
                              Hiển thị vị trí
                            </button>
                          </div>
                        )}

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
                ))}
              </div>
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
