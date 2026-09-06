import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Sparkles, Star, BookOpen, Volume2, 
  MessageCircle, Lightbulb, Compass 
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/bino')}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Về Danh Sách Chương</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 shadow-sm">
          <Star size={14} className="text-amber-500 fill-amber-500" />
          <span>Bonus Cuối Chương {chapterNumber < 10 ? `0${chapterNumber}` : chapterNumber}</span>
        </span>
      </div>

      {/* Main Banner */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-purple-600/10 border border-amber-300/70 dark:border-amber-900/40 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Lightbulb size={16} />
          <span>Bí Kíp Giao Tiếp Bino</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {bonus?.title || `Góc Tiếng Lóng & Mẹo Văn Hóa Tây - Chương ${chapterNumber}`}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Người bản xứ không bao giờ dùng các mẫu câu đơ cứng trong sách ngữ pháp cũ. Dưới đây là những cụm từ "chém gió" thực chiến và mẹo ứng xử tự nhiên nhất!
        </p>
      </div>

      {/* Slang List Grid */}
      {bonus?.slangList?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span>Top Cụm Từ "Chém Gió" Cần Nhớ:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bonus.slangList.map((slang, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-amber-400 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    "{slang}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content HTML */}
      {bonus?.contentHtml && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: bonus.contentHtml }} />
        </div>
      )}

      {/* CTA Footer */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <h4 className="font-black text-base text-slate-900 dark:text-white">
          Sẵn Sàng Cho Chương Tiếp Theo Chưa Bác?
        </h4>
        <p className="text-xs text-slate-500">
          Hãy tiếp tục ôn tập từ vựng hoặc bước sang chương tiếp theo để phản xạ tự nhiên hơn nhé!
        </p>
        <button
          onClick={() => navigate('/bino')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          Trở Về Lộ Trình 12 Chương
        </button>
      </div>
    </div>
  );
}
