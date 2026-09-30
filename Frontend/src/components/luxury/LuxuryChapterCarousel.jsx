import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
import binoApi from '../../api/binoApi';

/**
 * LuxuryChapterCarousel - Apple Store Card Shelf Slider & Bento Grid Switcher.
 * Uses compositor-thread native momentum scroll-snap + Framer Motion spring physics
 * for locked 120FPS performance on both mobile touchscreens and desktop.
 */
function LuxuryChapterCarousel({
  chapters = [],
  onSelectDialogue,
  onNavigateAll,
  onPlayChapter
}) {
  const scrollContainerRef = useRef(null);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'grid'
  const [showAllInGrid, setShowAllInGrid] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  const handleScroll = (dir) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 350;
    scrollContainerRef.current.scrollBy({
      left: dir * scrollAmount,
      behavior: 'smooth'
    });
  };

  const displayedGridChapters = showAllInGrid ? chapters : chapters.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Top Bar: Title + Apple Segmented Mode Toggle + Slider Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#0071e3] dark:text-sky-400">
            <Sparkles size={12} />
            <span>LỘ TRÌNH 12 CHƯƠNG GIAO TIẾP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Khám phá nhanh các chương học thực chiến
          </h2>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Apple Segmented View Switcher (Slider vs Grid) */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('slider')}
              className={`relative px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'slider'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'slider' && (
                <motion.div
                  layoutId="chapterViewModePill"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute inset-0 rounded-full bg-[#0071e3] shadow-xs"
                />
              )}
              <SlidersHorizontal size={12} className="relative z-10" />
              <span className="relative z-10">Trượt Slider</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`relative px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {viewMode === 'grid' && (
                <motion.div
                  layoutId="chapterViewModePill"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute inset-0 rounded-full bg-[#0071e3] shadow-xs"
                />
              )}
              <LayoutGrid size={12} className="relative z-10" />
              <span className="relative z-10">Dạng Lưới</span>
            </button>
          </div>

          {/* Slider Navigation Arrows */}
          {viewMode === 'slider' && (
            <div className="flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleScroll(-1)}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3] hover:text-[#0071e3] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                aria-label="Trượt sang trái"
              >
                <ChevronLeft size={17} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleScroll(1)}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3] hover:text-[#0071e3] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                aria-label="Trượt sang phải"
              >
                <ChevronRight size={17} />
              </motion.button>
            </div>
          )}

          <button
            onClick={onNavigateAll}
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-[#0071e3] dark:text-sky-400 hover:underline cursor-pointer ml-1"
          >
            <span>Tất cả</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Mode 1: Apple Store Horizontal Momentum Slider */}
      <AnimatePresence mode="wait">
        {viewMode === 'slider' ? (
          <motion.div
            key="slider-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            ref={scrollContainerRef}
            className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 px-1 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {chapters.map((chap) => {
              const firstDialogueId = chap.dialogues?.[0]?.id;
              const chapPercent =
                chap.totalLessons > 0
                  ? Math.round((chap.completedLessons / chap.totalLessons) * 100)
                  : 0;
              const isDone = chapPercent === 100;

              return (
                <motion.div
                  key={chap.id}
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                  onMouseEnter={() => {
                    if (firstDialogueId) binoApi.prefetchDialogue(firstDialogueId);
                  }}
                  onClick={() => onSelectDialogue(firstDialogueId)}
                  className="w-[285px] sm:w-[325px] shrink-0 snap-start p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] hover:border-[#0071e3]/50 dark:hover:border-sky-400/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_34px_rgba(0,113,227,0.1)] flex flex-col justify-between gap-5 cursor-pointer group relative overflow-hidden"
                >
                  {/* Top Specular Highlight */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-xs font-extrabold text-[#0071e3] dark:text-sky-400">
                        Chương {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        {isDone && <CheckCircle2 size={13} className="text-emerald-500" />}
                        <span>{chap.completedLessons}/{chap.totalLessons} bài</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        {chap.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-vietsub leading-relaxed">
                        {chap.titleVi || chap.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(5, chapPercent)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="bg-gradient-to-r from-[#0071e3] to-sky-400 h-full rounded-full"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPlayChapter) onPlayChapter(chap);
                        }}
                        className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-[#0071e3] text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#0071e3] dark:hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={`Nghe thụ động Chương ${chap.chapterNumber}`}
                      >
                        <Headphones size={12} />
                        <span>Nghe chương</span>
                      </button>

                      <span className="text-xs font-bold text-[#0071e3] dark:text-sky-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        <span>Vào học</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Mode 2: Responsive Bento Grid with Expandable Open/Close Drawer */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedGridChapters.map((chap) => {
                const firstDialogueId = chap.dialogues?.[0]?.id;
                const chapPercent =
                  chap.totalLessons > 0
                    ? Math.round((chap.completedLessons / chap.totalLessons) * 100)
                    : 0;

                return (
                  <motion.div
                    key={chap.id}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    onMouseEnter={() => {
                      if (firstDialogueId) binoApi.prefetchDialogue(firstDialogueId);
                    }}
                    onClick={() => onSelectDialogue(firstDialogueId)}
                    className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 hover:border-[#0071e3]/40 dark:hover:border-sky-400/40 cursor-pointer shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgb(0,113,227,0.08)] flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-xs font-bold text-[#0071e3] dark:text-sky-400">
                          Chương {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {chap.completedLessons}/{chap.totalLessons} bài
                        </span>
                      </div>

                      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors line-clamp-1 pt-0.5">
                        {chap.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-vietsub">
                        {chap.titleVi || chap.description}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(4, chapPercent)}%` }}
                          className="bg-gradient-to-r from-[#0071e3] to-sky-400 h-full rounded-full transition-all duration-500"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPlayChapter) onPlayChapter(chap);
                          }}
                          className="text-slate-500 hover:text-[#0071e3] dark:hover:text-sky-400 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Headphones size={12} />
                          <span>Nghe chương</span>
                        </button>
                        <span className="font-bold text-[#0071e3] dark:text-sky-400 flex items-center gap-0.5">
                          <span>Vào học</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {chapters.length > 6 && (
              <div className="flex justify-center pt-1">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAllInGrid((prev) => !prev)}
                  className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0071e3] dark:text-sky-400 shadow-2xs hover:border-[#0071e3]/40 cursor-pointer"
                >
                  {showAllInGrid ? 'Thu gọn danh sách chương' : `Mở rộng toàn bộ ${chapters.length} chương`}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(LuxuryChapterCarousel);
