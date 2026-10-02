import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  Volume2,
  RefreshCw,
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import speechService from '../../utils/speechService';

const QUICK_DRILL_SLOTS = [
  {
    slotEn: 'the campus layout',
    slotVi: 'sơ đồ khuôn viên trường',
    fullEn: "It's been pretty good. I'm still getting used to the campus layout though."
  },
  {
    slotEn: 'the new project workflow',
    slotVi: 'quy trình dự án mới',
    fullEn: "It's been pretty good. I'm still getting used to the new project workflow though."
  },
  {
    slotEn: 'speaking English daily',
    slotVi: 'việc nói tiếng Anh mỗi ngày',
    fullEn: "It's been pretty good. I'm still getting used to speaking English daily though."
  }
];

/**
 * LuxuryChapterCarousel
 * 1. Top Signature Card: "Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì."
 *    in Tone-on-Tone Glacier Sapphire Pearl × Royal Sapphire Jewel Glass finish.
 * 2. Below: Original clean 12-Chapter Carousel Slider & Bento Grid Switcher (kept untouched).
 */
function LuxuryChapterCarousel({
  chapters = [],
  nextDialogue = null,
  completedLessons = 0,
  totalLessons = 72,
  onSelectDialogue,
  onNavigateAll,
  onPlayChapter
}) {
  const scrollContainerRef = useRef(null);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'grid'
  const [showAllInGrid, setShowAllInGrid] = useState(false);
  const [slotIdx, setSlotIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  const activeSlot = QUICK_DRILL_SLOTS[slotIdx];

  const handleScroll = (dir) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 350;
    scrollContainerRef.current.scrollBy({
      left: dir * scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleSpeakSlot = (e) => {
    e.stopPropagation();
    setIsSpeaking(true);
    speechService.speak(activeSlot.fullEn, {
      rate: 0.96,
      speakerIndex: 0,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const displayedGridChapters = showAllInGrid ? chapters : chapters.slice(0, 6);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* =================================================================== */}
      {/* 1. THẺ "GIAO TIẾP THỰC CHIẾN: PHẢN XẠ TIẾNG ANH TỨC THÌ."          */}
      {/*    (Glacier Sapphire Pearl Silk × Royal Sapphire Jewel Console)     */}
      {/*    Mobile-First Ultra-Compact Layout + Full Desktop Grandeur        */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden p-4 sm:p-8 rounded-[24px] sm:rounded-[34px] bg-gradient-to-br from-[#e9f3ff] via-[#f4f9ff] to-[#ddeeff] dark:from-[#071529] dark:via-[#0b1f3b] dark:to-[#0d284c] border border-[#0071e3]/25 dark:border-sky-400/25 shadow-[0_14px_40px_rgba(0,113,227,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_22px_55px_rgba(0,0,0,0.55)] w-full min-w-0 max-w-full">
        {/* Top Specular Sapphire-Diamond Rim */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3]/65 dark:via-sky-400/60 to-transparent" />

        {/* Ambient Glacier & Azure Silk Orbs */}
        <div className="pointer-events-none absolute -top-28 -right-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-br from-[#0071e3]/20 via-sky-400/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-gradient-to-tr from-cyan-400/20 via-blue-500/12 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-6 min-w-0">
          {/* Left: Glacier Pearl Editorial & Royal Sapphire Substitution Console */}
          <div className="space-y-2.5 sm:space-y-4 max-w-2xl flex-1 min-w-0">
            {/* Single-Row Status Ribbon on Mobile */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-[#0062cc] to-[#0077ed] text-white text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase shadow-[0_4px_14px_rgba(0,113,227,0.26)] min-w-0 truncate">
                <span className="inline-flex items-end gap-0.5 h-2.5 text-cyan-200 shrink-0">
                  <span className="w-0.5 h-1.5 bg-current rounded-full animate-pulse" />
                  <span className="w-0.5 h-2.5 bg-current rounded-full animate-pulse" />
                  <span className="w-0.5 h-2 bg-current rounded-full animate-pulse" />
                </span>
                <span className="sm:hidden truncate">SPEAKING STUDIO • 12 CHƯƠNG</span>
                <span className="hidden sm:inline">SPEAKING STUDIO • 12 CHƯƠNG • {totalLessons} BÀI</span>
              </span>

              <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-md text-[#005bb5] dark:text-sky-300 text-[10px] sm:text-[11px] font-extrabold border border-[#0071e3]/20 dark:border-white/15 shadow-2xs shrink-0">
                {completedLessons}/{totalLessons} bài
              </span>
            </div>

            {/* Sculptural Sapphire Headline */}
            <h2 className="text-[19px] sm:text-3xl font-black tracking-tight leading-[1.2]">
              <span className="text-[#06182c] dark:text-white">
                Giao Tiếp Thực Chiến:
              </span>{' '}
              <span className="bg-gradient-to-r from-[#0058b8] via-[#0071e3] to-[#06b6d4] dark:from-sky-300 dark:via-sky-400 dark:to-cyan-300 bg-clip-text text-transparent">
                Phản Xạ Tiếng Anh Tức Thì.
              </span>
            </h2>

            {/* Jewel Royal Sapphire Interactive Substitution Drilling Console (Compact 2-line layout on mobile) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0055b3] via-[#0071e3] to-[#0284c7] text-white border border-sky-300/35 shadow-[0_10px_28px_rgba(0,113,227,0.22)] space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3.5 min-w-0">
              <div className="min-w-0 space-y-1 flex-1">
                {/* Top Header Row inside Console (Includes controls inline on mobile!) */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-100 min-w-0 truncate">
                    <Sparkles size={11} className="text-white shrink-0" />
                    <span className="truncate">Đổi ruột câu • {activeSlot.slotVi}</span>
                  </div>

                  {/* Mobile Inline Audio & Refresh Controls */}
                  <div className="flex sm:hidden items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleSpeakSlot}
                      className="px-2.5 py-1 rounded-full bg-white text-[#0055b3] text-[10px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Nghe câu mẫu"
                    >
                      <Volume2 size={11} className={isSpeaking ? 'animate-bounce' : ''} />
                      <span>Nghe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotIdx((prev) => (prev + 1) % QUICK_DRILL_SLOTS.length)}
                      className="p-1 rounded-full bg-white/20 text-white border border-white/25 cursor-pointer"
                      title="Đổi cụm từ khác"
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                  &ldquo;It&apos;s been pretty good. I&apos;m still getting used to{' '}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeSlot.slotEn}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block px-2 py-0.5 rounded-md bg-white text-[#0055b3] font-extrabold shadow-2xs"
                    >
                      {activeSlot.slotEn}
                    </motion.span>
                  </AnimatePresence>{' '}
                  though.&rdquo;
                </p>
              </div>

              {/* Desktop Audio & Refresh Controls */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSpeakSlot}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-sky-50 text-[#0055b3] text-[11px] font-extrabold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Nghe câu mẫu"
                >
                  <Volume2 size={13} className={isSpeaking ? 'animate-bounce' : ''} />
                  <span>Nghe thử</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlotIdx((prev) => (prev + 1) % QUICK_DRILL_SLOTS.length)}
                  className="p-2 rounded-full bg-white/18 hover:bg-white/28 text-white border border-white/25 transition-colors cursor-pointer"
                  title="Đổi cụm từ khác"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: 1-Row Side-by-Side Ergonomic Buttons on Mobile, Stacked on Desktop */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between sm:justify-start gap-2 sm:gap-2.5 w-full lg:w-auto min-w-0 shrink-0">
            <button
              onClick={() => {
                if (nextDialogue?.id) {
                  onSelectDialogue(nextDialogue.id);
                } else {
                  onNavigateAll();
                }
              }}
              className="flex-1 sm:flex-none justify-center px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#0062cc] to-[#0077ed] hover:from-[#0058b8] hover:to-[#006be0] text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 sm:gap-2 shadow-[0_8px_22px_rgba(0,113,227,0.30)] transition-all hover:-translate-y-0.5 cursor-pointer min-w-0"
            >
              <Play size={13} fill="currentColor" className="shrink-0" />
              <span className="truncate">
                {nextDialogue
                  ? `Học tiếp Chương ${nextDialogue.chapterNumber}`
                  : 'Vào học Giao Tiếp'}
              </span>
              <ArrowRight size={14} className="shrink-0" />
            </button>

            <button
              onClick={onNavigateAll}
              className="shrink-0 justify-center px-3 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-[#005bb5] dark:text-sky-300 border border-[#0071e3]/25 dark:border-white/20 shadow-2xs text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="sm:hidden">Đủ 12 Chương</span>
              <span className="hidden sm:inline">Khám phá trọn bộ 12 Chương</span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. PHẦN 12 CHƯƠNG HỌC (ĐỂ NGUYÊN THIẾT KẾ GỐC)                      */}
      {/* =================================================================== */}
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
    </div>
  );
}

export default React.memo(LuxuryChapterCarousel);
