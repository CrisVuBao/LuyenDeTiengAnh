import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionTemplate
} from 'framer-motion';
import {
  Sparkles,
  Flame,
  Trophy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Play,
  Pause,
  Zap,
  Headphones,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Layers,
  Activity,
  Clock,
  Target,
  CheckCircle2,
  Sliders,
  BarChart3
} from 'lucide-react';
import LuxuryTripleActivityRing from './LuxuryTripleActivityRing';
import { BrandFaviconSvg } from '../BrandLogo';
import AnimatedCounter from './AnimatedCounter';
import binoApi from '../../api/binoApi';
import { loadReflex50FullData } from '../../features/reflex50/store/useReflex50Store';

const SLIDE_INTERVAL_MS = 6800;

const STUDY_PACE_PRESETS = [
  {
    minutes: 15,
    label: '15p / ngày',
    tag: 'Duy trì nhẹ nhàng',
    binoPerDay: 0.4,
    reflexPerDay: 8,
    vocabPerDay: 8
  },
  {
    minutes: 30,
    label: '30p / ngày',
    tag: 'Tiến bộ đều đặn',
    binoPerDay: 0.8,
    reflexPerDay: 15,
    vocabPerDay: 15
  },
  {
    minutes: 45,
    label: '45p / ngày',
    tag: 'Chuẩn Tam Giác Vàng ★',
    binoPerDay: 1.2,
    reflexPerDay: 25,
    vocabPerDay: 22
  },
  {
    minutes: 60,
    label: '60p / ngày',
    tag: 'Tăng tốc đột phá',
    binoPerDay: 1.8,
    reflexPerDay: 35,
    vocabPerDay: 30
  },
  {
    minutes: 90,
    label: '90p / ngày',
    tag: 'Cường độ cao VIP',
    binoPerDay: 2.6,
    reflexPerDay: 50,
    vocabPerDay: 45
  }
];

/**
 * LuxuryHeroPavilion - Apple VisionOS & Haute Horlogerie Flagship Hero Card.
 * Features:
 * 1. GPU-accelerated cursor-tracking optical refraction & kinetic shimmer headline.
 * 2. Interactive 4-Slide "Tiến Độ 3 Trụ Cột" (Tri-Pillar Mastery Slider) with touch drag,
 *    auto-rotation, ring-sync highlighting, and AI Bottleneck Diagnosis.
 * 3. Expandable Deep Diagnostic & Study Velocity Simulator Drawer.
 */
function LuxuryHeroPavilion({
  timeGreeting,
  profile,
  stats,
  binoBook,
  completedBinoLessons = 0,
  totalBinoLessons = 72,
  binoProgressPercent = 0,
  reflexCompletedCount = 0,
  reflexPercent = 0,
  activeReflexUnit,
  vocabMasteredCount = 0,
  vocabPercent = 0,
  maisonMasteryScore = 0,
  nextDialogue,
  isGlobalPlaying = false,
  onNavigate,
  onOpenPlaylist,
  onOpenGuide
}) {
  const pavilionRef = useRef(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Slider state for "Tiến Độ 3 Trụ Cột" (0: Tổng hợp, 1: Hội thoại, 2: Phản xạ, 3: Từ vựng)
  const [pillarSlide, setPillarSlide] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [isSliderAuto, setIsSliderAuto] = useState(true);
  const [isSliderHovered, setIsSliderHovered] = useState(false);

  // Expandable Deep Analysis & Velocity Simulator Drawer
  const [isDeepAnalysisOpen, setIsDeepAnalysisOpen] = useState(false);
  const [selectedPaceIdx, setSelectedPaceIdx] = useState(2); // Default 45 mins/day

  const handleMouseMove = useCallback(
    (e) => {
      if (!pavilionRef.current) return;
      const { left, top } = pavilionRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-1000);
    mouseY.set(-1000);
  }, [mouseX, mouseY]);

  const ambientFollowGlow = useMotionTemplate`radial-gradient(680px circle at ${mouseX}px ${mouseY}px, rgba(0, 113, 227, 0.085), transparent 80%)`;
  const borderFollowGlow = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, rgba(0, 113, 227, 0.3), transparent 75%)`;

  const paginatePillar = useCallback((dir) => {
    setSlideDir(dir);
    setPillarSlide((prev) => (prev + dir + 4) % 4);
  }, []);

  const goToPillarSlide = useCallback(
    (idx) => {
      setSlideDir(idx > pillarSlide ? 1 : -1);
      setPillarSlide(idx);
    },
    [pillarSlide]
  );

  useEffect(() => {
    if (!isSliderAuto || isSliderHovered) return undefined;
    const timer = setInterval(() => {
      paginatePillar(1);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isSliderAuto, isSliderHovered, paginatePillar]);

  // AI Diagnosis of the 3 Pillars
  const aiDiagnosis = useMemo(() => {
    const pillars = [
      {
        id: 'bino',
        slideIdx: 1,
        name: 'Giao Tiếp Thực Chiến',
        shortName: 'Hội thoại',
        percent: binoProgressPercent,
        countText: `${completedBinoLessons}/${totalBinoLessons} bài`,
        weight: '45%',
        color: '#0071E3',
        advice:
          'Ưu tiên nghe ngấm & đổi ruột câu trong 72 bài hội thoại để tạo khung ngữ cảnh tự nhiên.',
        actionLabel: nextDialogue
          ? `Học tiếp Chương ${nextDialogue.chapterNumber}`
          : 'Vào học Giao Tiếp',
        onAction: () => {
          if (nextDialogue?.id) {
            onNavigate(`/communication/dialogue/${nextDialogue.id}`);
          } else {
            onNavigate('/communication');
          }
        }
      },
      {
        id: 'reflex',
        slideIdx: 2,
        name: 'Phản Xạ 50 Chủ Đề',
        shortName: 'Phản xạ 3s',
        percent: reflexPercent,
        countText: `${reflexCompletedCount}/1500 câu`,
        weight: '35%',
        color: '#8B5CF6',
        advice:
          'Dành 15–20 phút ép xung phản xạ nói – viết 3 giây để xóa bỏ hoàn toàn thói quen dịch ngầm.',
        actionLabel: activeReflexUnit
          ? `Luyện Unit ${activeReflexUnit.unitNumber}`
          : 'Vào luyện Phản Xạ 50',
        onAction: () => {
          if (activeReflexUnit?.unitNumber) {
            onNavigate(`/reflex-50/unit/${activeReflexUnit.unitNumber}`);
          } else {
            onNavigate('/reflex-50');
          }
        }
      },
      {
        id: 'vocab',
        slideIdx: 3,
        name: '3000 Từ Vựng FSRS',
        shortName: 'Từ FSRS',
        percent: vocabPercent,
        countText: `${vocabMasteredCount}/1760 từ`,
        weight: '20%',
        color: '#10B981',
        advice:
          'Bổ sung nguyên liệu từ vựng cốt lõi Oxford và quét Lá Chắn FSRS để không bị bí từ khi nói.',
        actionLabel: 'Nạp từ vựng FSRS',
        onAction: () => onNavigate('/vocab')
      }
    ];

    const sortedAsc = [...pillars].sort((a, b) => a.percent - b.percent);
    const sortedDesc = [...pillars].sort((a, b) => b.percent - a.percent);
    const bottleneck = sortedAsc[0];
    const strongest = sortedDesc[0];

    // Calculate balance index (100 - max diff)
    const spread = Math.max(0, strongest.percent - bottleneck.percent);
    const balanceScore = Math.max(40, Math.min(100, 100 - Math.round(spread * 0.7)));

    return {
      pillars,
      bottleneck,
      strongest,
      balanceScore
    };
  }, [
    binoProgressPercent,
    completedBinoLessons,
    totalBinoLessons,
    reflexPercent,
    reflexCompletedCount,
    vocabPercent,
    vocabMasteredCount,
    nextDialogue,
    activeReflexUnit,
    onNavigate
  ]);

  // Velocity Simulator Calculations
  const currentPace = STUDY_PACE_PRESETS[selectedPaceIdx] || STUDY_PACE_PRESETS[2];
  const velocityForecast = useMemo(() => {
    const remBino = Math.max(0, totalBinoLessons - completedBinoLessons);
    const remReflex = Math.max(0, 1500 - reflexCompletedCount);
    const remVocab = Math.max(0, 1760 - vocabMasteredCount);

    const daysBino = Math.ceil(remBino / currentPace.binoPerDay);
    const daysReflex = Math.ceil(remReflex / currentPace.reflexPerDay);
    const daysVocab = Math.ceil(remVocab / currentPace.vocabPerDay);

    return {
      remBino,
      remReflex,
      remVocab,
      daysBino,
      daysReflex,
      daysVocab,
      totalDays: Math.max(daysBino, daysReflex, daysVocab, 1)
    };
  }, [
    totalBinoLessons,
    completedBinoLessons,
    reflexCompletedCount,
    vocabMasteredCount,
    currentPace
  ]);

  // Map slide index to ring index (null for Slide 0, 0 for Slide 1, 1 for Slide 2, 2 for Slide 3)
  const activeRingIndex = pillarSlide === 0 ? null : pillarSlide - 1;

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 24 : -24,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1]
      },
      transitionEnd: {
        transform: 'none'
      }
    },
    exit: (dir) => ({
      x: dir < 0 ? 24 : -24,
      opacity: 0,
      transition: { duration: 0.16 }
    })
  };

  return (
    <section
      ref={pavilionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group/pavilion relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-[#f0f7ff] dark:bg-[#07162b] border-2 border-[#1cb0f6]/40 dark:border-blue-700/50 border-b-6 border-b-[#0071e3] dark:border-b-[#1e40af] p-4 sm:p-6 lg:p-7 shadow-[0_14px_40px_rgba(0,113,227,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
    >
      {/* Dynamic Cursor-Tracking Specular Spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover/pavilion:opacity-100 transition-opacity duration-500"
        style={{ background: ambientFollowGlow }}
      />

      {/* Top Diamond Rim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent" />

      {/* =================================================================== */}
      {/* MAIN HERO 2-COLUMN ARCHITECTURAL SPLIT (COMPACT & SLEEK)           */}
      {/* =================================================================== */}
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: COMPACT HEADLINE, MASCOT, PILLS & TACTILE BUTTONS    */}
        {/* ================================================================= */}
        <div className="flex-1 max-w-2xl space-y-3 sm:space-y-3.5 min-w-0">
          
          {/* Top Status & Companion Bar: Mascot Bubble + Fixed Level & Streak Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
            {/* Mascot + Motivation Speech Bubble */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#1cb0f6] border-b-4 border-b-[#0071e3] flex items-center justify-center p-1.5 shadow-xs shrink-0 animate-duo-bounce">
                <BrandFaviconSvg className="w-full h-full rounded-xl drop-shadow-xs" />
              </div>
              <div className="duo-bubble text-xs font-bold text-slate-800 dark:text-slate-100 py-1 px-3 min-w-0 flex-1 truncate shadow-2xs">
                {profile?.currentStreak > 0
                  ? (profile?.hasStudiedToday 
                      ? `Tuyệt đỉnh! Chuỗi ${profile.currentStreak} ngày đã thắp lửa an toàn. 🔥` 
                      : `Chuỗi ${profile.currentStreak} ngày đang chờ bạn ôn bài để giữ lửa! ⚡`)
                  : 'Học ngay hôm nay để thắp lửa chuỗi phản xạ nào! 🚀'}
              </div>
            </div>

            {/* Level & Streak Gamified Pills (Always side-by-side, perfectly balanced on mobile) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
              {/* Level & XP Pill */}
              <button
                type="button"
                onClick={() => onNavigate('/leaderboard')}
                className="duo-pill duo-pill-xp text-[11px] sm:text-xs font-black shrink-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap py-1 sm:py-1.5"
                title="Xem Bảng Xếp Hạng & Cấp Độ"
              >
                <Trophy size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                <span>Cấp {profile?.currentLevel ?? 1}</span>
                <span className="text-amber-400 opacity-60">|</span>
                <span>
                  <AnimatedCounter value={profile?.totalXP ?? 0} suffix=" XP" />
                </span>
                <ChevronRight size={12} className="opacity-70 shrink-0" />
              </button>

              {/* Streak Pill */}
              <div
                className="duo-pill duo-pill-streak text-[11px] sm:text-xs font-black shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap py-1 sm:py-1.5"
                title={profile?.hasStudiedToday ? 'Đã học hôm nay - Ngọn lửa an toàn' : 'Chưa học hôm nay - Cần vào học để giữ chuỗi'}
              >
                <Flame 
                  size={14} 
                  className={profile?.hasStudiedToday ? "fill-orange-500 text-orange-500 animate-duo-wiggle shrink-0" : "text-amber-500 shrink-0"} 
                />
                <span>
                  <AnimatedCounter
                    value={profile?.currentStreak ?? stats?.currentStreakDays ?? 0}
                    suffix=" ngày"
                  />
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  profile?.hasStudiedToday 
                    ? 'bg-orange-200/80 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300' 
                    : 'bg-amber-200/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                }`}>
                  {profile?.hasStudiedToday ? 'Đã giữ' : 'Cần giữ'}
                </span>
              </div>
            </div>
          </div>

          {/* Duolingo Chunky Headline & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-tight">
              <span className="text-slate-900 dark:text-white">
                {timeGreeting.title},
              </span>{' '}
              <span className="text-[#0071e3] dark:text-[#1cb0f6]">
                bật phản xạ Tiếng Anh tự nhiên.
              </span>
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
              Đồng bộ <strong className="text-[#0071e3] dark:text-sky-400 font-black">72 Bài Giao Tiếp</strong>, <strong className="text-[#0071e3] dark:text-sky-400 font-black">1.500 Câu Phản Xạ 3s</strong> &amp; <strong className="text-[#0071e3] dark:text-sky-400 font-black">3.000 Từ Oxford FSRS</strong>.
            </p>
          </div>

          {/* Smart Next-Lesson Resume Bar */}
          {nextDialogue && (
            <div
              onClick={() => onNavigate(`/communication/dialogue/${nextDialogue.id}`)}
              className="duo-card p-2 sm:p-2.5 rounded-xl flex items-center gap-2 cursor-pointer hover:border-[#0071e3] transition-all group max-w-full"
            >
              <span className="px-2 py-0.5 rounded-lg bg-[#0071e3] text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                Học tiếp Ch.{nextDialogue.chapterNumber}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                {nextDialogue.title}
              </span>
              <ChevronRight
                size={14}
                className="text-slate-400 group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition-all shrink-0 ml-auto"
              />
            </div>
          )}

          {/* Tactile Duolingo Command Buttons */}
          <div className="pt-0.5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full min-w-0">
            {/* Primary Sapphire 3D Push Button */}
            <button
              onMouseEnter={() => binoApi.prefetchBookOverview()}
              onClick={() => onNavigate('/communication')}
              className="duo-btn duo-btn-sapphire duo-btn-md flex items-center justify-center gap-2 w-full sm:w-auto font-black shadow-md cursor-pointer"
            >
              <Play size={15} fill="currentColor" className="shrink-0" />
              <span>Vào Luyện Giao Tiếp Thực Chiến</span>
            </button>

            {/* Secondary 3-Button Row */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
              {/* Secondary Reflex Button */}
              <button
                onMouseEnter={() => loadReflex50FullData()}
                onClick={() => onNavigate('/reflex-50')}
                className="duo-btn duo-btn-white duo-btn-md font-black flex items-center justify-center gap-1.5 text-[#0071e3] dark:text-sky-400 cursor-pointer"
              >
                <Zap size={14} className="shrink-0 text-[#0071e3] dark:text-sky-400" />
                <span className="truncate">Phản Xạ 50</span>
              </button>

              {/* Passive Audio 24/7 Button */}
              <button
                onClick={onOpenPlaylist}
                className="duo-btn duo-btn-white duo-btn-md font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isGlobalPlaying ? (
                  <span className="inline-flex items-end gap-0.5 h-3.5 text-[#0071e3] dark:text-sky-400 shrink-0">
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                  </span>
                ) : (
                  <Headphones size={14} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                )}
                <span className="truncate">Đài nghe</span>
              </button>

              {/* Deep Analysis Toggle Button */}
              <button
                onClick={() => setIsDeepAnalysisOpen((prev) => !prev)}
                className={`duo-btn duo-btn-md font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDeepAnalysisOpen ? 'duo-btn-blue' : 'duo-btn-white'
                }`}
              >
                <BarChart3 size={14} className="shrink-0" />
                <span className="truncate">Phân tích</span>
                <ChevronDown
                  size={13}
                  className={`shrink-0 transition-transform duration-300 ${
                    isDeepAnalysisOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: DUOLINGO 3D TRI-PILLAR MASTERY ENGINE (COMPACT)     */}
        {/* ================================================================= */}
        <div
          onMouseEnter={() => setIsSliderHovered(true)}
          onMouseLeave={() => setIsSliderHovered(false)}
          className="w-full min-w-0 max-w-full lg:w-[370px] xl:w-[390px] shrink-0 duo-card p-3 sm:p-4 rounded-3xl border-2 border-blue-200 dark:border-blue-900 border-b-6 border-b-[#0071e3] dark:border-b-[#1e40af] flex flex-col justify-between gap-2.5 relative overflow-hidden bg-white dark:bg-[#0c182c] shadow-sm"
        >
          {/* Top Diamond Rim */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent" />

          {/* Header Row 1: Title Badge & Duolingo 3D Prev/Next Controls */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400 animate-duo-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                Chỉ số 3 Trụ Cột
              </span>
            </div>

            {/* Duolingo 3D Tactile Prev/Next Controls (Fully visible, zero cut-off) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsSliderAuto((prev) => !prev)}
                className="duo-btn duo-btn-white duo-btn-xs p-1 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0071e3] cursor-pointer"
                title={isSliderAuto ? 'Tạm dừng tự chuyển' : 'Bật tự chuyển'}
              >
                {isSliderAuto ? <Pause size={11} /> : <Play size={11} className="ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => paginatePillar(-1)}
                className="duo-btn duo-btn-white duo-btn-xs p-1 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                aria-label="Trụ cột trước"
                title="Trụ cột trước"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => paginatePillar(1)}
                className="duo-btn duo-btn-sapphire duo-btn-xs p-1 rounded-lg flex items-center justify-center text-white cursor-pointer"
                aria-label="Trụ cột tiếp theo"
                title="Trụ cột tiếp theo"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Header Row 2: Full-width Segmented Duolingo Pills */}
          <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 w-full">
            {[
              { idx: 0, label: 'Tổng quan' },
              { idx: 1, label: 'Hội thoại' },
              { idx: 2, label: 'Phản xạ' },
              { idx: 3, label: 'Từ vựng' }
            ].map((tab) => {
              const isActive = pillarSlide === tab.idx;
              return (
                <button
                  key={tab.idx}
                  onClick={() => goToPillarSlide(tab.idx)}
                  className={`relative py-1 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-black transition-all cursor-pointer text-center truncate ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="triPillarSliderTab"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-lg bg-[#0071e3] shadow-xs"
                    />
                  )}
                  <span className="relative z-10 truncate block">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Middle Section: Interactive Triple Ring + Dynamic Slide Content */}
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 py-0.5 min-w-0">
            {/* Left of Card: Dynamic Slide Info (Swipeable) */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait" custom={slideDir}>
                <motion.div
                  key={pillarSlide}
                  custom={slideDir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, { offset }) => {
                    if (offset.x < -40) paginatePillar(1);
                    else if (offset.x > 40) paginatePillar(-1);
                  }}
                  className="space-y-1 sm:space-y-1.5"
                >
                  {/* SLIDE 0: TỔNG HỢP 3 TRỤ CỘT */}
                  {pillarSlide === 0 && (
                    <>
                      <div className="duo-pill duo-pill-gem text-[10px] font-black uppercase tracking-wider">
                        <Activity size={11} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                        <span>ĐỒNG BỘ 3 TRỤ CỘT</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                        Cân bằng: <span className="text-[#0071e3] dark:text-sky-400">{aiDiagnosis.balanceScore}%</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                        Ưu tiên bồi đắp <strong className="text-slate-900 dark:text-white font-black">{aiDiagnosis.bottleneck.shortName}</strong> để bứt phá phản xạ tự nhiên.
                      </p>
                    </>
                  )}

                  {/* SLIDE 1: TRỤ CỘT 1 - GIAO TIẾP THỰC CHIẾN */}
                  {pillarSlide === 1 && (
                    <>
                      <div className="duo-pill duo-pill-gem text-[10px] font-black uppercase tracking-wider">
                        <MessageSquare size={11} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                        <span>TRỤ CỘT 1 • 45%</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                        {completedBinoLessons}/{totalBinoLessons} bài học
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                        Làm chủ ~{completedBinoLessons * 6} mẫu câu đổi ruột trong ngữ cảnh bản xứ 12 chương.
                      </p>
                    </>
                  )}

                  {/* SLIDE 2: TRỤ CỘT 2 - PHẢN XẠ 50 CHỦ ĐỀ */}
                  {pillarSlide === 2 && (
                    <>
                      <div className="duo-pill duo-pill-gem text-[10px] font-black uppercase tracking-wider">
                        <Zap size={11} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                        <span>TRỤ CỘT 2 • 35%</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                        {reflexCompletedCount}/1500 câu
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                        Tốc độ bật nói &amp; viết 3 giây cùng ~{reflexCompletedCount * 2} cụm Collocations.
                      </p>
                    </>
                  )}

                  {/* SLIDE 3: TRỤ CỘT 3 - 3000 TỪ VỰNG FSRS */}
                  {pillarSlide === 3 && (
                    <>
                      <div className="duo-pill duo-pill-gem text-[10px] font-black uppercase tracking-wider">
                        <Layers size={11} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                        <span>TRỤ CỘT 3 • 20%</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                        {vocabMasteredCount}/1760 từ FSRS
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                        Ghi nhớ dài hạn từ vựng Oxford cốt lõi qua 60 chủ đề đời sống.
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right of Card: Interactive Triple Activity Ring */}
            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
              <LuxuryTripleActivityRing
                ring1={{ label: 'Hội Thoại', percent: binoProgressPercent, color: '#0071E3' }}
                ring2={{ label: 'Phản Xạ', percent: reflexPercent, color: '#38BDF8' }}
                ring3={{ label: 'Từ Vựng', percent: vocabPercent, color: '#10B981' }}
                overallScore={maisonMasteryScore}
                activeRingIndex={activeRingIndex}
                onSelectRing={(ringIdx) => {
                  if (ringIdx === null) goToPillarSlide(0);
                  else goToPillarSlide(ringIdx + 1);
                }}
                size={102}
              />
            </div>
          </div>

          {/* Dynamic Context Action Bar at Bottom of Slider Card (Compact) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={pillarSlide}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.12 }}
                className="min-w-0 flex-1"
              >
                {pillarSlide === 0 && (
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    Đề xuất: {nextDialogue ? `Ch.${nextDialogue.chapterNumber}: ${nextDialogue.title}` : aiDiagnosis.bottleneck.advice}
                  </p>
                )}

                {pillarSlide === 1 && (
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    {nextDialogue ? `Bài tiếp: ${nextDialogue.title}` : 'Khám phá 72 bài hội thoại'}
                  </p>
                )}

                {pillarSlide === 2 && (
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    {activeReflexUnit ? `Đang luyện: Unit ${activeReflexUnit.unitNumber}` : 'Phản Xạ 50 Chủ Đề'}
                  </p>
                )}

                {pillarSlide === 3 && (
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    3000 Từ Oxford • Ôn Flashcard FSRS
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeepAnalysisOpen((prev) => !prev)}
                className="duo-btn duo-btn-white duo-btn-xs font-black text-slate-700 dark:text-slate-200 cursor-pointer py-1 px-2"
                title="Xem chi tiết phân tích"
              >
                Chi tiết
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pillarSlide === 0 || pillarSlide === 1) {
                    aiDiagnosis.pillars[0].onAction();
                  } else if (pillarSlide === 2) {
                    aiDiagnosis.pillars[1].onAction();
                  } else {
                    aiDiagnosis.pillars[2].onAction();
                  }
                }}
                className="duo-btn duo-btn-sapphire duo-btn-xs p-1.5 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-xs"
                title="Vào học ngay"
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* EXPANDABLE DEEP DIAGNOSTIC & VELOCITY SIMULATOR SUITE               */}
      {/* =================================================================== */}
      <AnimatePresence initial={false}>
        {isDeepAnalysisOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 290, damping: 28 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-200/80 dark:border-white/[0.08] space-y-5 sm:space-y-6">
              {/* Header of Deep Analysis Suite */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[#0071e3] dark:text-sky-400">
                    <Sparkles size={13} className="shrink-0" />
                    <span>TRUNG TÂM PHÂN TÍCH & DỰ PHÓNG TIẾN ĐỘ 3 TRỤ CỘT</span>
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    Chẩn đoán cân bằng năng lực & Giả lập lộ trình hoàn thành
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onOpenGuide}
                    className="px-3.5 py-2 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 hover:bg-[#0071e3] hover:text-white transition-colors cursor-pointer"
                  >
                    <Lightbulb size={13} />
                    <span>Phương pháp Tam Giác Vàng</span>
                  </button>
                </div>
              </div>

              {/* 3 Detailed Pillar Diagnostic Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                {aiDiagnosis.pillars.map((pillar) => {
                  const isBottleneck = aiDiagnosis.bottleneck.id === pillar.id;
                  return (
                    <div
                      key={pillar.id}
                      className={`p-4 sm:p-5 rounded-[22px] sm:rounded-[24px] border transition-all flex flex-col justify-between gap-4 ${
                        isBottleneck
                          ? 'bg-blue-50/50 dark:bg-[#0071e3]/10 border-[#0071e3]/40 shadow-sm'
                          : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/[0.07]'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: pillar.color }}
                            />
                            {pillar.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 shrink-0">
                            Tỷ trọng {pillar.weight}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {pillar.percent}%
                          </span>
                          <span className="text-xs font-bold text-[#0071e3] dark:text-sky-400">
                            {pillar.countText}
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(4, pillar.percent)}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: pillar.color }}
                          />
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                          {pillar.advice}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        {isBottleneck ? (
                          <span className="text-[11px] font-extrabold text-[#0071e3] dark:text-sky-400">
                            ★ Khuyên ưu tiên hôm nay
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">
                            Đang duy trì tốt
                          </span>
                        )}

                        <button
                          onClick={pillar.onAction}
                          className="text-xs font-bold text-[#0071e3] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{pillar.actionLabel}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Study Velocity Simulator Slider */}
              <div className="p-4 sm:p-6 rounded-[22px] sm:rounded-[26px] bg-white/95 dark:bg-slate-900/90 border border-slate-200/85 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-extrabold text-[#0071e3] dark:text-sky-400">
                      <Clock size={14} className="shrink-0" />
                      <span>TRÌNH GIẢ LẬP TỐC ĐỘ CHINH PHỤC (VELOCITY SIMULATOR)</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chọn quỹ thời gian học mỗi ngày để hệ thống tính toán số ngày hoàn thành phần còn lại của 3 trụ cột:
                    </p>
                  </div>

                  {/* Interactive Time Slider Pills */}
                  <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700">
                    {STUDY_PACE_PRESETS.map((preset, idx) => {
                      const isSelected = selectedPaceIdx === idx;
                      return (
                        <button
                          key={preset.minutes}
                          onClick={() => setSelectedPaceIdx(idx)}
                          className={`relative px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="velocityPacePill"
                              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                              className="absolute inset-0 rounded-xl bg-[#0071e3] shadow-xs"
                            />
                          )}
                          <span className="relative z-10">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Forecast Output Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border border-[#0071e3]/25">
                    <p className="text-[10px] font-bold uppercase text-[#0071e3] dark:text-sky-400">
                      Chế độ đang chọn
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {currentPace.minutes} phút / ngày
                    </p>
                    <p className="text-[11px] font-semibold text-[#0071e3] dark:text-sky-300 mt-0.5">
                      {currentPace.tag}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      72 Bài Hội Thoại (Còn {velocityForecast.remBino} bài)
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {velocityForecast.remBino === 0 ? (
                        'Đã hoàn tất ✓'
                      ) : (
                        <>
                          ~<AnimatedCounter value={velocityForecast.daysBino} suffix=" ngày nữa" />
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mục tiêu: ~{currentPace.binoPerDay} bài/ngày
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      1.500 Câu Phản Xạ (Còn {velocityForecast.remReflex} câu)
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {velocityForecast.remReflex === 0 ? (
                        'Đã hoàn tất ✓'
                      ) : (
                        <>
                          ~<AnimatedCounter value={velocityForecast.daysReflex} suffix=" ngày nữa" />
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mục tiêu: {currentPace.reflexPerDay} câu/ngày
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Từ Vựng Oxford (Còn {velocityForecast.remVocab} từ)
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {velocityForecast.remVocab === 0 ? (
                        'Đã hoàn tất ✓'
                      ) : (
                        <>
                          ~<AnimatedCounter value={velocityForecast.daysVocab} suffix=" ngày nữa" />
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mục tiêu: {currentPace.vocabPerDay} từ mới/ngày
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default React.memo(LuxuryHeroPavilion);
