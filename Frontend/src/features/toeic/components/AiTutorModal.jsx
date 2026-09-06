import React, { useState } from 'react';
import { Sparkles, X, Bot, Loader2, BookOpen } from 'lucide-react';
import { aiApi } from '../../../api/dashboardAndAiApi';

export default function AiTutorModal({ isOpen, onClose, question, correctAnswer, options, context }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && question) {
      setLoading(true);
      setExplanation('');
      aiApi.explainQuestion({ question, correctAnswer, options, context })
        .then(res => {
          if (res?.data?.explanation) {
            setExplanation(res.data.explanation);
          } else {
            setExplanation("Không nhận được phản hồi từ AI.");
          }
        })
        .catch(err => {
          setExplanation("Không thể kết nối tới AI Tutor: " + err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, question, correctAnswer, options, context]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-lg w-full max-h-[85vh] flex flex-col p-6 rounded-3xl shadow-2xl border border-white/60 dark:border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                Gemini AI Tutor <Sparkles size={14} className="text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Chuyên gia giải thích ngữ pháp & bẫy TOEIC</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Câu hỏi:</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{question}</p>
            <div className="mt-2 text-xs font-bold text-green-600 dark:text-green-400">
              Đáp án đúng: {correctAnswer}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen size={14} className="text-purple-500" /> Phân tích chuyên sâu:
            </span>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-purple-600" />
                <span className="text-xs">AI đang đọc đề và phân tích điểm mấu chốt...</span>
              </div>
            ) : (
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                {explanation}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
