import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, ChevronRight } from 'lucide-react';
import useVocabStore from '../../vocab/store/useVocabStore';

function VocabShowcaseSection({ sectionRevealVariants }) {
  const navigate = useNavigate();

  const topics = useVocabStore((s) => s.topics);
  const totalWords = useVocabStore((s) => s.totalWords);
  const masteredWords = useVocabStore((s) => s.masteredWords);
  const lastTopicId = useVocabStore((s) => s.lastStudiedTopic);

  const activeTopic = useMemo(() => {
    return topics?.find((t) => t.id === lastTopicId) || topics?.[0] || { id: 1, title: 'Con Người & Ngoại Hình' };
  }, [topics, lastTopicId]);

  const masteredCount = useMemo(() => {
    if (!masteredWords) return 0;
    return Object.keys(masteredWords).filter((k) => masteredWords[k]).length;
  }, [masteredWords]);

  const vocabPercent = useMemo(() => {
    const total = totalWords || 1760;
    return Math.min(100, Math.round((masteredCount / total) * 100));
  }, [masteredCount, totalWords]);

  const previewTopics = useMemo(() => {
    if (!topics || topics.length === 0) return [];
    return [
      topics[0] || { id: 1, title: 'Con Người & Ngoại Hình', icon: '👤', words: [] },
      topics[1] || { id: 2, title: 'Gia Đình & Bạn Bè', icon: '👨‍👩‍👧', words: [] },
      topics[7] || { id: 8, title: 'Công Việc & Sự Nghiệp', icon: '💼', words: [] },
      topics[14] || { id: 15, title: 'Mua Sắm & Chi Tiêu', icon: '🛍️', words: [] },
      topics[21] || { id: 22, title: 'Du Lịch & Phương Tiện', icon: '✈️', words: [] }
    ];
  }, [topics]);

  return (
    <motion.section
      variants={sectionRevealVariants}
      className="p-7 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_16px_rgb(0,0,0,0.03)] space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Layers size={13} />
            <span>Kho Từ Vựng Toàn Diện • 3000 Từ Cốt Lõi • 60 Chủ Đề</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            3000 Từ Vựng Tiếng Anh Cốt Lõi Oxford (60 Chủ Đề)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Phương pháp học Flashcard 3D thông minh, luyện phát âm chuẩn bản xứ, kiểm tra trắc nghiệm phản xạ 2 chiều và thử thách gõ chính tả giúp nhớ sâu từ vựng nhanh gấp 3 lần.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate(`/vocab/${activeTopic.id}`)}
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <span>Học Chủ đề {activeTopic.id}: {activeTopic.title}</span>
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/vocab')}
            className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Xem đủ 60 Chủ đề ({masteredCount}/{totalWords || 1760} từ • {vocabPercent}%)
          </button>
        </div>
      </div>

      {/* 5 Topic Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {previewTopics.map((top) => {
          const topWords = top.words || [];
          const topMastered = topWords.filter((w) => !!masteredWords?.[w.id]).length;
          const topPercent = topWords.length > 0 ? Math.round((topMastered / topWords.length) * 100) : 0;

          return (
            <div
              key={top.id}
              onClick={() => navigate(`/vocab/${top.id}`)}
              className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <span>{top.icon || '📖'}</span>
                    <span>Chủ đề {top.id}</span>
                  </span>
                  <span>{topWords.length} từ</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-emerald-600 transition-colors">
                  {top.title}
                </h3>
                {top.titleVi && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {top.titleVi}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${topPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Đã thuộc: {topMastered}/{topWords.length}</span>
                  <span className="font-semibold text-emerald-600 group-hover:underline flex items-center gap-0.5">
                    Học ngay <ChevronRight size={10} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default React.memo(VocabShowcaseSection);
