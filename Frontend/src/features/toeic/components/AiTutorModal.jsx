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
      aiApi
        .explainQuestion({ question, correctAnswer, options, context })
        .then((res) => {
          if (res?.data?.explanation) {
            setExplanation(res.data.explanation);
          } else {
            setExplanation('Không nhận được phản hồi từ AI.');
          }
        })
        .catch((err) => {
          setExplanation('Không thể kết nối tới AI Tutor: ' + err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, question, correctAnswer, options, context]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-lg w-full max-h-[85vh] flex flex-col p-6 rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shadow-sm border border-slate-800 dark:border-slate-700">
              <Bot size={20} />
            </div>
            <div>
              {/* <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                <span>AI Tutor Chuyên Sâu</span>
                <Sparkles size={14} className="text-amber-500" />
              </h3> */}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân tích cấu trúc ngữ pháp, từ vựng & bẫy đề thi ETS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Câu hỏi đang phân tích:
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {question}
            </p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 text-xs font-extrabold">
              Đáp án đúng: {correctAnswer}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <BookOpen size={14} className="text-[#0071e3] dark:text-sky-400" />
              <span>Lời giải & Mẹo phản xạ từ AI:</span>
            </span>

            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <Loader2 size={24} className="animate-spin text-[#0071e3]" />
                <span className="text-xs font-medium">
                  AI Tutor đang phân tích ngữ cảnh và điểm ngữ pháp mấu chốt...
                </span>
              </div>
            ) : (
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-blue-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-[#0071e3]/20 dark:border-slate-700">
                {explanation}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-[#0071e3] dark:bg-slate-800 dark:hover:bg-[#0071e3] text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
