import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Sparkles, Star, BookOpen, Volume2, 
  MessageCircle, Lightbulb, Compass, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

export default function BinoChapterBonusPage() {
  const { chapterNumber } = useParams();
  const currentChapNum = parseInt(chapterNumber, 10) || 1;
  const navigate = useNavigate();
  const [bonus, setBonus] = useState(() => binoApi.peekChapterBonus(currentChapNum));
  const [loading, setLoading] = useState(() => !binoApi.peekChapterBonus(currentChapNum));

  useEffect(() => {
    const cached = binoApi.peekChapterBonus(currentChapNum);
    if (cached) {
      setBonus(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    binoApi.getChapterBonus(currentChapNum)
      .then((res) => {
        if (res?.data) {
          setBonus(res.data);
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy nội dung bonus:', err);
        toast.error('Không tìm thấy nội dung bổ sung');
      })
      .finally(() => setLoading(false));

    // Prefetch chương kế tiếp và chương trước để bấm qua lại mượt 0ms
    if (currentChapNum < 12) binoApi.prefetchBonus(currentChapNum + 1);
    if (currentChapNum > 1) binoApi.prefetchBonus(currentChapNum - 1);
  }, [currentChapNum]);

  const speakSlang = (slang) => {
    speechService.speakWord(slang);
  };

  // Cho phép bấm trực tiếp vào câu tiếng Anh trong nội dung sách để nghe phát âm
  const handleContentClick = (e) => {
    const target = e.target.closest('.eng, .expression-content, li strong');
    if (!target) return;
    const rawText = target.innerText || target.textContent || '';
    const cleaned = rawText
      .replace(/^[►•⭐\d.)\-\s]+/, '')
      .replace(/:$/, '')
      .trim();
    if (cleaned && cleaned.length > 1 && cleaned.length < 260) {
      // Nếu có nhiều dòng trong .expression-content, ưu tiên đọc dòng được click hoặc câu đầu
      const firstLine = cleaned.split('\n')[0].trim();
      if (firstLine) {
        speechService.speakWord(firstLine);
        toast.success(`🔊 Đang phát âm: "${firstLine.slice(0, 55)}${firstLine.length > 55 ? '...' : ''}"`, {
          id: 'bonus-tts',
          duration: 2000
        });
      }
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-16 px-2 sm:px-0">
      {/* Scoped CSS cho nội dung gốc từ Ebook TiengAnhBi.epub (tương thích hoàn hảo Light & Dark mode) */}
      <style>{`
        .bino-epub-bonus-content .section-header {
          display: flex;
          align-items: center;
          border-bottom: 2px solid #2b999d;
          padding-bottom: 10px;
          margin-top: 28px;
          margin-bottom: 20px;
        }
        .bino-epub-bonus-content .section-letter {
          background: linear-gradient(135deg, #2b999d, #408d99);
          color: #ffffff;
          font-weight: 900;
          font-size: 1.15rem;
          padding: 4px 12px;
          border-radius: 10px;
          margin-right: 14px;
          box-shadow: 0 2px 6px rgba(43, 153, 157, 0.25);
        }
        .bino-epub-bonus-content .section-text {
          color: #2b999d;
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0;
        }
        .dark .bino-epub-bonus-content .section-text {
          color: #5eead4;
        }
        .bino-epub-bonus-content .main-topic-title {
          text-align: center;
          font-size: 1.35rem;
          font-weight: 900;
          margin: 24px 0 18px 0;
          letter-spacing: 1.5px;
          color: #0f172a;
          background: rgba(245, 158, 11, 0.12);
          padding: 10px 16px;
          border-radius: 14px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .dark .bino-epub-bonus-content .main-topic-title {
          color: #fef3c7;
          background: rgba(245, 158, 11, 0.15);
        }
        .bino-epub-bonus-content .expressions-list {
          margin-top: 16px;
          padding-left: 8px;
        }
        .bino-epub-bonus-content .expression-item {
          border-left: 2px dashed #f59e0b;
          padding-left: 18px;
          margin-bottom: 22px;
          position: relative;
        }
        .bino-epub-bonus-content .expression-item::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 6px;
          width: 10px;
          height: 10px;
          background-color: #f59e0b;
          border-radius: 50%;
        }
        .bino-epub-bonus-content .expression-title {
          font-weight: 800;
          font-size: 1.05rem;
          margin-top: 0;
          margin-bottom: 8px;
          color: #0f172a !important;
        }
        .dark .bino-epub-bonus-content .expression-title {
          color: #f8fafc !important;
        }
        .bino-epub-bonus-content .expression-title .vie {
          font-weight: 600;
          font-style: italic;
          color: #64748b !important;
        }
        .dark .bino-epub-bonus-content .expression-title .vie {
          color: #94a3b8 !important;
        }
        .bino-epub-bonus-content .expression-content {
          margin: 0;
          line-height: 1.85;
          font-weight: 700;
          color: #1e293b;
          background: rgba(248, 250, 252, 0.8);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .bino-epub-bonus-content .expression-content:hover {
          border-color: #f59e0b;
          background: rgba(254, 243, 199, 0.35);
        }
        .dark .bino-epub-bonus-content .expression-content {
          color: #e2e8f0;
          background: rgba(30, 41, 59, 0.65);
          border-color: rgba(51, 65, 85, 0.8);
        }
        .bino-epub-bonus-content .col-2 {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }
        .bino-epub-bonus-content .dialogue-box {
          border: 2px solid #cbd5e1;
          border-radius: 16px;
          padding: 18px;
          margin: 16px 0;
          background: rgba(248, 250, 252, 0.5);
        }
        .dark .bino-epub-bonus-content .dialogue-box {
          border-color: #334155;
          background: rgba(15, 23, 42, 0.45);
        }
        .bino-epub-bonus-content .eng {
          font-weight: 800;
          color: #0f172a !important;
          margin-bottom: 4px;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .bino-epub-bonus-content .eng:hover {
          color: #d97706 !important;
        }
        .dark .bino-epub-bonus-content .eng {
          color: #f8fafc !important;
        }
        .dark .bino-epub-bonus-content .eng:hover {
          color: #fbbf24 !important;
        }
        .bino-epub-bonus-content .vie {
          font-style: italic;
          color: #475569 !important;
        }
        .dark .bino-epub-bonus-content .vie {
          color: #94a3b8 !important;
        }
        .bino-epub-bonus-content .philosophy-box {
          border: 3px double #f59e0b;
          border-radius: 20px;
          padding: 24px;
          margin: 28px 0 16px 0;
          background: linear-gradient(145deg, rgba(254, 243, 199, 0.25), rgba(255, 251, 235, 0.1));
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.08);
        }
        .dark .bino-epub-bonus-content .philosophy-box {
          border-color: #d97706;
          background: linear-gradient(145deg, rgba(120, 53, 15, 0.2), rgba(30, 41, 59, 0.4));
        }
        .bino-epub-bonus-content .philosophy-title {
          text-align: center;
          font-size: 1.45rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-top: 0;
          margin-bottom: 18px;
          border-bottom: 2px solid rgba(245, 158, 11, 0.4);
          padding-bottom: 12px;
          color: #b45309;
          letter-spacing: 1px;
        }
        .dark .bino-epub-bonus-content .philosophy-title {
          color: #fbbf24;
        }
        .bino-epub-bonus-content .philosophy-content p {
          text-align: justify;
          margin-bottom: 14px;
          font-size: 0.98rem;
          line-height: 1.75;
        }
        .bino-epub-bonus-content .philosophy-signature {
          text-align: right;
          font-weight: 800;
          font-style: italic;
          margin-top: 20px;
          color: #d97706;
        }
        .bino-epub-bonus-content .vocab-list {
          list-style: none;
          padding-left: 0;
        }
        .bino-epub-bonus-content .vocab-list li {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(248, 250, 252, 0.7);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .dark .bino-epub-bonus-content .vocab-list li {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(51, 65, 85, 0.7);
        }
        .bino-epub-bonus-content strong,
        .bino-epub-bonus-content span[style*="color: #000"],
        .bino-epub-bonus-content div[style*="color: #333"] {
          color: inherit !important;
        }
        .bino-epub-bonus-content hr.bonus-page-divider {
          border: 0;
          border-top: 1px dashed rgba(148, 163, 184, 0.35);
          margin: 24px 0;
        }
      `}</style>
      
      {/* Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/bino')}
          className="p-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Về Lộ Trình 12 Chương</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <button
            disabled={currentChapNum <= 1}
            onClick={() => navigate(`/bino/chapter/${currentChapNum - 1}/bonus`)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-amber-400 transition-all text-xs font-bold flex items-center gap-1"
            title="Chương trước"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Chương {currentChapNum - 1}</span>
          </button>

          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center gap-1.5 shadow-sm border border-amber-300/80 dark:border-amber-800">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span>Cuối Chương {currentChapNum < 10 ? `0${currentChapNum}` : currentChapNum} / 12</span>
          </span>

          <button
            disabled={currentChapNum >= 12}
            onClick={() => navigate(`/bino/chapter/${currentChapNum + 1}/bonus`)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-amber-400 transition-all text-xs font-bold flex items-center gap-1"
            title="Chương tiếp theo"
          >
            <span className="hidden sm:inline">Chương {currentChapNum + 1}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-purple-600/10 border border-amber-300/70 dark:border-amber-900/40 space-y-4 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Lightbulb size={16} />
          <span>Trọn Vẹn Nội Dung Cuối Chương Sách Ebook (Section B • Section C • Bino's Philosophy)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {bonus?.title || `Mẫu Câu Mở Rộng & Bino's Philosophy - Chương ${currentChapNum}`}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-normal">
          Toàn bộ các mẫu câu mở rộng (More expressions), bài tập thực hành nói cùng Bino (Practise speaking with Bino) và tâm sự triết lý học tiếng Anh của Bino ở cuối Chương {currentChapNum}. 💡 <strong>Mẹo:</strong> Bạn có thể bấm trực tiếp vào bất kỳ câu tiếng Anh nào bên dưới để nghe phát âm chuẩn!
        </p>
      </motion.div>

      {/* Slang / Key Expressions List Grid */}
      {bonus?.slangList?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>Từ Khóa & Cụm Từ Phản Xạ Nhanh Trong Chương {currentChapNum}:</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">{bonus.slangList.length} cụm từ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bonus.slangList.map((slang, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => speakSlang(slang)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    "{slang}"
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakSlang(slang);
                  }}
                  className="p-2 rounded-xl text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 dark:group-hover:bg-slate-700 transition-colors shrink-0"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Full Ebook End-of-Chapter Content HTML (Section B, Section C & Bino's Philosophy) */}
      {bonus?.contentHtml && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleContentClick}
          className="bino-epub-bonus-content glass-card p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-none text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-vietsub shadow-md"
        >
          <div dangerouslySetInnerHTML={{ __html: bonus.contentHtml }} />
        </motion.div>
      )}

      {/* CTA Footer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-inner">
        <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
          Đã Nắm Trọn Tinh Hoa Chương {currentChapNum}!
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Hãy tiếp tục ôn tập từ vựng với Flashcards SRS hoặc bước sang chương tiếp theo để nâng cấp phản xạ giao tiếp nhé!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/bino')}
            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Trở Về Lộ Trình 12 Chương</span>
          </motion.button>

          {currentChapNum < 12 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/bino/chapter/${currentChapNum + 1}/bonus`)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Xem Tiếp Cuối Chương {currentChapNum + 1}</span>
              <ArrowRight size={14} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
