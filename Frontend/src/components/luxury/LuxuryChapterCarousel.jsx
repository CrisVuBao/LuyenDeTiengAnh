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
      {/*    Duolingo Tactile 3D Chunky Card × Project Sapphire Blue Theme    */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden p-4 sm:p-7 lg:p-8 rounded-3xl sm:rounded-[36px] bg-[#f0f7ff] dark:bg-[#07162b] border-2 border-[#1cb0f6]/40 dark:border-blue-700/50 border-b-6 border-b-[#0071e3] dark:border-b-[#1e40af] shadow-[0_14px_40px_rgba(0,113,227,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full min-w-0 max-w-full">
        {/* Specular Top Rim */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent" />

        {/* Subtle Ambient Orbs */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#1cb0f6]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#0071e3]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
          {/* Left Column: Duolingo Pills, Chunky Headline & Tactile Substitution Console */}
          <div className="space-y-3 sm:space-y-3.5 max-w-2xl flex-1 min-w-0">
            {/* Status Pills Ribbon */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <div className="duo-pill duo-pill-gem text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400 animate-duo-pulse" />
                <span className="sm:hidden">SPEAKING • 12 CHƯƠNG</span>
                <span className="hidden sm:inline">SPEAKING STUDIO • 12 CHƯƠNG</span>
              </div>

              <div className="duo-pill duo-pill-xp text-[10px] sm:text-xs font-black shrink-0">
                <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{completedLessons}/{totalLessons} bài hoàn thành</span>
              </div>
            </div>

            {/* Duolingo Chunky Headline */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-snug">
                <span className="text-slate-900 dark:text-white">
                  Giao Tiếp Thực Chiến:
                </span>{' '}
                <span className="text-[#0071e3] dark:text-[#1cb0f6]">
                  Phản Xạ Tiếng Anh Tức Thì.
                </span>
              </h2>
              <p className="line-clamp-1 sm:line-clamp-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
                Luyện nói hội thoại tình huống thực tế, đổi ruột câu phản xạ 3 giây và ghi nhớ sâu ngữ điệu bản xứ.
              </p>
            </div>

            {/* Tactile Duolingo 3D Substitution Console */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c182c] border-2 border-blue-200 dark:border-blue-900 border-b-4 border-b-blue-300 dark:border-b-blue-950 shadow-sm space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 min-w-0">
              <div className="min-w-0 space-y-1.5 flex-1">
                {/* Console Header Row */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0071e3] dark:text-sky-400 min-w-0 truncate">
                    <Sparkles size={13} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                    <span className="truncate">
                      Đổi ruột câu • <span className="text-slate-600 dark:text-slate-300 font-bold lowercase">{activeSlot.slotVi}</span>
                    </span>
                  </div>

                  {/* Mobile Controls */}
                  <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSpeakSlot}
                      className="duo-btn duo-btn-sapphire duo-btn-xs flex items-center gap-1 font-black cursor-pointer"
                      title="Nghe câu mẫu"
                    >
                      <Volume2 size={12} className={isSpeaking ? 'animate-bounce' : ''} />
                      <span>Nghe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotIdx((prev) => (prev + 1) % QUICK_DRILL_SLOTS.length)}
                      className="duo-btn duo-btn-white duo-btn-xs p-1.5 flex items-center justify-center cursor-pointer"
                      title="Đổi cụm từ khác"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                {/* Interactive Sentence */}
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
                  &ldquo;It&apos;s been pretty good. I&apos;m still getting used to{' '}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeSlot.slotEn}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block px-2.5 py-0.5 rounded-xl bg-[#0071e3] text-white font-black shadow-xs"
                    >
                      {activeSlot.slotEn}
                    </motion.span>
                  </AnimatePresence>{' '}
                  though.&rdquo;
                </p>
              </div>

              {/* Desktop Controls */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSpeakSlot}
                  className="duo-btn duo-btn-sapphire duo-btn-sm flex items-center gap-1.5 font-black cursor-pointer"
                  title="Nghe câu mẫu"
                >
                  <Volume2 size={14} className={isSpeaking ? 'animate-bounce' : ''} />
                  <span>Nghe thử</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlotIdx((prev) => (prev + 1) % QUICK_DRILL_SLOTS.length)}
                  className="duo-btn duo-btn-white duo-btn-sm p-2 flex items-center justify-center cursor-pointer"
                  title="Đổi cụm từ khác"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Duolingo 3D Action Buttons (2-col grid on mobile, row on tablet, column on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-2 sm:gap-3 w-full lg:w-auto min-w-0 shrink-0">
            <button
              onClick={() => {
                if (nextDialogue?.id) {
                  onSelectDialogue(nextDialogue.id);
                } else {
                  onNavigateAll();
                }
              }}
              className="duo-btn duo-btn-sapphire duo-btn-sm sm:duo-btn-lg flex items-center justify-center gap-1.5 sm:gap-2 w-full lg:w-auto font-black cursor-pointer shadow-md"
            >
              <Play size={15} fill="currentColor" className="shrink-0" />
              <span className="truncate">
                {nextDialogue
                  ? `Học tiếp Ch.${nextDialogue.chapterNumber}`
                  : 'Vào học'}
              </span>
              <ArrowRight size={15} className="shrink-0 hidden xs:inline" />
            </button>

            <button
              onClick={onNavigateAll}
              className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-lg flex items-center justify-center gap-1.5 sm:gap-2 w-full lg:w-auto font-black text-[#0071e3] dark:text-sky-400 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <span className="truncate">Đủ 12 chương</span>
              <ChevronRight size={15} className="shrink-0 opacity-70 hidden xs:inline" />
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
