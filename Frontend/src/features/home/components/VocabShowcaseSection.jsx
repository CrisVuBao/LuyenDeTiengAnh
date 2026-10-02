import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, ChevronRight, Sparkles, CheckCircle2, Play } from 'lucide-react';
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
      className="duo-card p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f7fee7] via-[#f4fce3] to-[#edfbd8] dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0f172a] border-2 border-lime-200/60 dark:border-slate-800 border-b-6 border-b-[#7acc15] dark:border-b-[#5ea810] space-y-5 sm:space-y-6 w-full min-w-0 max-w-full shadow-sm relative overflow-hidden"
    >
      {/* Soft Ambient Glows & Top Gloss Shimmer (Xanh nõn chuối tươi mát, dịu êm) */}
      <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#7acc15]/10 to-lime-300/5 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-lime-400/8 to-lime-300/5 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#7acc15]/40 to-transparent" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
        <div className="space-y-2 sm:space-y-2.5 max-w-2xl min-w-0 flex-1">
          {/* Duolingo Ribbon Pills */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <div className="duo-pill duo-pill-green text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#7acc15] dark:bg-lime-400 animate-duo-pulse" />
              <span className="truncate">3000 TỪ OXFORD • FLASHCARD 3D • 60 CHỦ ĐỀ</span>
            </div>

            <div className="duo-pill duo-pill-xp text-[10px] sm:text-xs font-black shrink-0">
              <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
              <span>{masteredCount}/{totalWords || 1760} từ • {vocabPercent}%</span>
            </div>
          </div>

          {/* Duolingo Chunky Headline */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-snug">
              <span className="text-slate-900 dark:text-white">
                3000 Từ Vựng Tiếng Anh
              </span>{' '}
              <span className="text-[#65a30d] dark:text-[#a3e635]">
                Theo 60 Chủ Đề.
              </span>
            </h2>
            <p className="line-clamp-1 sm:line-clamp-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold max-w-xl">
              Phương pháp học Flashcard 3D thông minh, phản xạ 2 chiều và thử thách gõ chính tả giúp bạn ghi nhớ từ vựng sâu gấp 3 lần!
            </p>
          </div>
        </div>

        {/* Tactile Duolingo Action Buttons (2-col grid on mobile, row on tablet/desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0 shrink-0">
          <button
            onClick={() => navigate(`/vocab/${activeTopic.id}`)}
            className="duo-btn duo-btn-green duo-btn-sm sm:duo-btn-md font-black shadow-sm w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <Play size={15} fill="currentColor" className="shrink-0" />
            <span className="truncate">Học Chủ Đề #{activeTopic.id}</span>
            <ArrowRight size={15} className="shrink-0 hidden xs:inline" />
          </button>
          <button
            onClick={() => navigate('/vocab')}
            className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black text-xs sm:text-sm w-full sm:w-auto text-[#65a30d] dark:text-[#a3e635] cursor-pointer shadow-xs whitespace-nowrap"
          >
            <span className="truncate">Đủ 60 Chủ Đề</span>
          </button>
        </div>
      </div>

      {/* 5 Topic Cards Preview (Horizontal Swipe Shelf on Mobile, 5-Col Grid on Desktop) */}
      <div
        className="flex lg:grid lg:grid-cols-5 gap-3 sm:gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 lg:pb-0 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {previewTopics.map((top) => {
          const topWords = top.words || [];
          const topMastered = topWords.filter((w) => !!masteredWords?.[w.id]).length;
          const topPercent = topWords.length > 0 ? Math.round((topMastered / topWords.length) * 100) : 0;

          return (
            <div
              key={top.id}
              onClick={() => navigate(`/vocab/${top.id}`)}
              className="w-[240px] sm:w-[260px] lg:w-auto shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border-2 border-emerald-200/80 dark:border-emerald-800/60 border-b-4 border-b-emerald-400 dark:border-b-emerald-900 hover:scale-[1.03] transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-black text-[#059669] dark:text-[#34d399]">
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg group-hover:scale-125 transition-transform">{top.icon || '📖'}</span>
                    <span>Chủ đề {top.id}</span>
                  </span>
                  <span className="text-slate-400 font-extrabold">{topWords.length} từ</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2 group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-1">
                  {top.title}
                </h3>
                {top.titleVi && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-bold">
                    {top.titleVi}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600">
                  <div
                    className="h-full rounded-full bg-[#10b981] dark:bg-[#34d399] transition-all duration-500"
                    style={{ width: `${Math.max(4, topPercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>Đã thuộc: {topMastered}/{topWords.length}</span>
                  <span className="font-black text-[#059669] dark:text-[#34d399] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    HỌC NGAY <ChevronRight size={12} />
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
