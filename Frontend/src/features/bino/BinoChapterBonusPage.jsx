import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Sparkles, Star, BookOpen, Volume2, 
  MessageCircle, Lightbulb, Compass, ArrowRight
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import speechService from '../../utils/speechService';
import toast from 'react-hot-toast';

export default function BinoChapterBonusPage() {
  const { chapterNumber } = useParams();
  const navigate = useNavigate();
  const [bonus, setBonus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    binoApi.getChapterBonus(chapterNumber)
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
  }, [chapterNumber]);

  const speakSlang = (slang) => {
    speechService.speakWord(slang);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-16 px-2 sm:px-0">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/bino')}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Về Lộ Trình Sách</span>
        </motion.button>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center gap-1.5 shadow-sm border border-amber-300/80 dark:border-amber-800">
          <Star size={14} className="text-amber-500 fill-amber-500" />
          <span>Bonus Cuối Chương {chapterNumber < 10 ? `0${chapterNumber}` : chapterNumber}</span>
        </span>
      </div>

      {/* Main Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-purple-600/10 border border-amber-300/70 dark:border-amber-900/40 space-y-4 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Lightbulb size={16} />
          <span>Bí Kíp Giao Tiếp Bản Xứ Bino</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {bonus?.title || `Góc Tiếng Lóng & Mẹo Văn Hóa Tây - Chương ${chapterNumber}`}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
          Người bản xứ không bao giờ dùng các mẫu câu đơ cứng trong sách ngữ pháp cũ. Dưới đây là những cụm từ "chém gió" thực chiến và mẹo ứng xử tự nhiên nhất!
        </p>
      </motion.div>

      {/* Slang List Grid */}
      {bonus?.slangList?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>Top Cụm Từ "Chém Gió" Cần Nhớ:</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">{bonus.slangList.length} cụm từ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bonus.slangList.map((slang, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -2, scale: 1.01 }}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-amber-400 transition-all"
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
                  onClick={() => speakSlang(slang)}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Content HTML */}
      {bonus?.contentHtml && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-vietsub shadow-sm"
        >
          <div dangerouslySetInnerHTML={{ __html: bonus.contentHtml }} />
        </motion.div>
      )}

      {/* CTA Footer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-inner">
        <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
          Sẵn Sàng Cho Chương Tiếp Theo Chưa Bác?
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Hãy tiếp tục ôn tập từ vựng hoặc bước sang chương tiếp theo để phản xạ tự nhiên hơn nhé!
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/bino')}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 mx-auto"
        >
          <span>Trở Về Lộ Trình 12 Chương</span>
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}
