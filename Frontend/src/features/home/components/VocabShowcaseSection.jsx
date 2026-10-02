import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="relative overflow-hidden p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-white dark:bg-slate-900/95 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_6px_28px_rgba(0,0,0,0.03)] space-y-5 sm:space-y-6 w-full min-w-0 max-w-full"
    >
      {/* Top Specular Hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/30 to-transparent" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
        <div className="space-y-2 max-w-2xl min-w-0">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-[#0071e3] dark:text-sky-400 text-[10px] sm:text-xs font-bold border border-[#0071e3]/20 max-w-full">
            <Layers size={12} className="shrink-0" />
            <span className="truncate">KHO TỪ VỰNG TOÀN DIỆN • 3000 TỪ OXFORD • 60 CHỦ ĐỀ</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            3000 Từ Vựng Tiếng Anh Cốt Lõi Oxford (60 Chủ Đề)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Phương pháp học Flashcard 3D thông minh, luyện phát âm chuẩn bản xứ, kiểm tra trắc nghiệm phản xạ 2 chiều và thử thách gõ chính tả giúp nhớ sâu từ vựng nhanh gấp 3 lần.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0 shrink-0">
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => navigate(`/vocab/${activeTopic.id}`)}
            className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_6px_18px_rgba(0,113,227,0.26)] min-w-0"
          >
            <span className="truncate">Học Chủ đề {activeTopic.id}: {activeTopic.title}</span>
            <ArrowRight size={15} className="shrink-0" />
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => navigate('/vocab')}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center truncate"
          >
            Xem đủ 60 Chủ đề ({masteredCount}/{totalWords || 1760} từ • {vocabPercent}%)
          </motion.button>
        </div>
      </div>

      {/* 5 Topic Cards Preview (Horizontal Swipe Shelf on Mobile, 5-Col Grid on Desktop) */}
      <div
        className="flex lg:grid lg:grid-cols-5 gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 lg:pb-0 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {previewTopics.map((top) => {
          const topWords = top.words || [];
          const topMastered = topWords.filter((w) => !!masteredWords?.[w.id]).length;
          const topPercent = topWords.length > 0 ? Math.round((topMastered / topWords.length) * 100) : 0;

          return (
            <motion.div
              key={top.id}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              onClick={() => navigate(`/vocab/${top.id}`)}
              className="w-[240px] sm:w-[260px] lg:w-auto shrink-0 snap-start p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-[#0071e3]/50 hover:shadow-[0_10px_24px_rgba(0,113,227,0.08)] transition-all cursor-pointer group flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#0071e3] dark:text-sky-400">
                  <span className="flex items-center gap-1.5">
                    <span>{top.icon || '📖'}</span>
                    <span>Chủ đề {top.id}</span>
                  </span>
                  <span className="text-slate-400">{topWords.length} từ</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                  {top.title}
                </h3>
                {top.titleVi && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {top.titleVi}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0071e3] to-sky-400 transition-all duration-500"
                    style={{ width: `${Math.max(4, topPercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Đã thuộc: {topMastered}/{topWords.length}</span>
                  <span className="font-bold text-[#0071e3] dark:text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Học ngay <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default React.memo(VocabShowcaseSection);
