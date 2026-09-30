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
        color: '#38BDF8',
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
      className="group/pavilion relative overflow-hidden rounded-[24px] sm:rounded-[40px] bg-gradient-to-br from-white via-[#f9fbff] to-blue-50/35 dark:from-[#070b14] dark:via-[#0b101d] dark:to-[#080c17] border border-slate-200/85 dark:border-white/[0.09] p-4 sm:p-9 lg:p-11 shadow-[0_16px_55px_rgba(0,113,227,0.06)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
    >
      {/* 1. Dynamic Cursor-Tracking Specular Spotlight (0 React Re-renders) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover/pavilion:opacity-100 transition-opacity duration-500"
        style={{ background: ambientFollowGlow }}
      />

      {/* Interactive Border Rim Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 group-hover/pavilion:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: 'inset 0 0 0 1px transparent',
          background: borderFollowGlow,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px'
        }}
      />

      {/* 2. Ambient Silk Breathing Orbs */}
      <div className="pointer-events-none absolute -top-36 -right-24 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#0071e3]/[0.09] via-sky-400/[0.06] to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-sky-500/[0.06] via-blue-500/[0.04] to-transparent blur-3xl" />

      {/* Top Specular Diamond Rim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#0071e3]/45 dark:via-sky-400/35 to-transparent" />

      {/* =================================================================== */}
      {/* MAIN HERO 2-COLUMN ARCHITECTURAL SPLIT                              */}
      {/* =================================================================== */}
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 sm:gap-8 lg:gap-10">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: KINETIC APPLE FLAGSHIP HEADLINE & COMMAND BUTTONS    */}
        {/* ================================================================= */}
        <div className="flex-1 max-w-2xl space-y-3.5 sm:space-y-6 min-w-0">
          
          {/* Top Luxury Status Ribbon (Single-row swipeable on mobile, wrapped on desktop) */}
          <div className="flex items-center sm:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
            {/* Apple Studio Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/90 dark:border-white/10 shadow-2xs shrink-0">
              {/* <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]" />
              </span> */}
              <span className="tracking-[0.14em] text-[10px] sm:text-[10.5px] uppercase font-extrabold text-[#0071e3] dark:text-sky-400">
                HOME STUDIO
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Edition
              </span>
            </div>

            {/* XP & Level Pill — Apple Midnight Titanium & Champagne Gold Trophy */}
            <button
              onClick={() => onNavigate('/leaderboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold border border-slate-800 dark:border-white/20 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Xem Bảng Xếp Hạng & Thành Tích"
            >
              <Trophy size={13} className="text-amber-400 dark:text-amber-500 fill-amber-400/20 shrink-0" />
              <span>Cấp {profile?.currentLevel ?? 1}</span>
              <span className="text-slate-500 dark:text-slate-400">•</span>
              <span className="text-amber-300 dark:text-amber-600">
                <AnimatedCounter value={profile?.totalXP ?? 0} suffix=" XP" />
              </span>
              <ChevronRight size={12} className="opacity-70" />
            </button>

            {/* Streak Pill — Warm Amber-Orange Flame */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/12 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 shadow-2xs shrink-0">
              <Flame size={13} className="fill-orange-500 text-orange-500 animate-pulse" />
              <span>
                <AnimatedCounter
                  value={profile?.currentStreak ?? stats?.currentStreakDays ?? 0}
                  suffix=" ngày chuỗi"
                />
              </span>
              <span className="hidden sm:inline text-amber-400/70">•</span>
              <span className="hidden sm:inline text-[11px] font-semibold text-amber-700/80 dark:text-amber-200/80">
                {profile?.hasStudiedToday ? 'Đã giữ chuỗi' : 'Cần giữ chuỗi'}
              </span>
            </div>

            {/* Quick Jump to Daily Quests Pill — Synchronized Apple Slate & Sapphire */}
            <button
              onClick={() => {
                const el = document.getElementById('daily-quests-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/90 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Di chuyển tới Nhiệm Vụ Hàng Ngày"
            >
              <Target size={13} className="text-[#0071e3] dark:text-sky-400" />
              <span>Nhiệm vụ hôm nay</span>
            </button>
          </div>

          {/* Sculptural Apple Display Headline (100% Vector ClearType Sharp) */}
          <div className="space-y-2 sm:space-y-3.5">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#0071e3] dark:text-sky-400">
              <span>Hệ Sinh Thái Phản Xạ Thực Chiến</span>
            </div>

            <h1 className="text-xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight leading-[1.22]">
              <span className="text-slate-900 dark:text-white">
                {timeGreeting.title},
              </span>{' '}
              <span className="bg-gradient-to-r from-[#0071e3] to-sky-500 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent font-bold">
                bật phản xạ Tiếng Anh tự nhiên.
              </span>
            </h1>

            <p className="text-xs sm:text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-xl line-clamp-2 sm:line-clamp-none">
              {timeGreeting.subtitle} Kết hợp đồng bộ{' '}
              <strong className="text-slate-900 dark:text-slate-200 font-semibold">
                72 Bài Giao Tiếp Thực Chiến
              </strong>
              ,{' '}
              <strong className="text-slate-900 dark:text-slate-200 font-semibold">
                1.500 Câu Phản Xạ 3 Giây
              </strong>{' '}
              và{' '}
              <strong className="text-slate-900 dark:text-slate-200 font-semibold">
                3.000 Từ Vựng Oxford FSRS
              </strong>
              .
            </p>
          </div>

          {/* Smart Next-Lesson Resume Bar (Clean, zero duplication with Right Tri-Pillar Card) */}
          {nextDialogue && (
            <div
              onClick={() => onNavigate(`/communication/dialogue/${nextDialogue.id}`)}
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50/90 hover:bg-blue-50/60 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-white/[0.08] hover:border-[#0071e3]/40 transition-all cursor-pointer group max-w-full"
            >
              <span className="px-2 py-0.5 rounded-lg bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-400 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                Học tiếp Chương {nextDialogue.chapterNumber}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                {nextDialogue.title}
              </span>
              <ChevronRight
                size={14}
                className="text-slate-400 group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </div>
          )}

          {/* Tactile Apple Command Buttons (Ergonomic Mobile Layout + Desktop Row) */}
          <div className="pt-0.5 sm:pt-1 flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Primary Sapphire Button (Full-width on mobile for 1-thumb tap) */}
            <button
              onMouseEnter={() => binoApi.prefetchBookOverview()}
              onClick={() => onNavigate('/communication')}
              className="w-full sm:w-auto justify-center relative px-5 sm:px-7 py-3 sm:py-3.5 bg-[#0071e3] hover:bg-[#0077ed] hover:-translate-y-0.5 text-white font-bold rounded-full shadow-[0_10px_28px_rgba(0,113,227,0.34)] flex items-center gap-2 transition-all text-xs sm:text-sm cursor-pointer group overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/35" />
              <Play
                size={15}
                fill="currentColor"
                className="group-hover:translate-x-0.5 transition-transform shrink-0"
              />
              <span>Vào luyện Giao Tiếp Thực Chiến</span>
            </button>

            {/* Secondary Sky-Sapphire Pill Button */}
            <button
              onMouseEnter={() => loadReflex50FullData()}
              onClick={() => onNavigate('/reflex-50')}
              className="flex-1 sm:flex-none justify-center px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-[#0071e3]/10 hover:bg-[#0071e3]/18 hover:-translate-y-0.5 text-[#0071e3] dark:text-sky-400 border border-[#0071e3]/25 font-bold rounded-full flex items-center gap-1.5 sm:gap-2 transition-all text-xs sm:text-sm cursor-pointer shadow-2xs"
            >
              <Zap size={14} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
              <span className="truncate">Phản Xạ 50</span>
            </button>

            {/* Passive Audio 24/7 Pill */}
            <button
              onClick={onOpenPlaylist}
              className="flex-1 sm:flex-none justify-center px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 hover:-translate-y-0.5 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 font-semibold rounded-full flex items-center gap-1.5 sm:gap-2 transition-all text-xs sm:text-sm cursor-pointer"
            >
              {isGlobalPlaying ? (
                <span className="inline-flex items-end gap-0.5 h-3.5 text-[#0071e3] dark:text-sky-400">
                  <span className="equalizer-bar" />
                  <span className="equalizer-bar" />
                  <span className="equalizer-bar" />
                </span>
              ) : (
                <Headphones size={14} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
              )}
              <span className="truncate">Đài nghe</span>
            </button>

            {/* Expandable Deep Tri-Pillar Diagnostic Toggle */}
            <button
              onClick={() => setIsDeepAnalysisOpen((prev) => !prev)}
              className={`px-3.5 sm:px-4 py-2.5 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                isDeepAnalysisOpen
                  ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-md shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-900 text-[#0071e3] dark:text-sky-400 border-[#0071e3]/25 hover:border-[#0071e3]/50'
              }`}
            >
              <BarChart3 size={14} />
              <span className="hidden sm:inline">Phân tích 3 Trụ Cột</span>
              <span className="sm:hidden">Phân tích</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-300 ${
                  isDeepAnalysisOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE 4-SLIDE TRI-PILLAR MASTERY ENGINE       */}
        {/* ================================================================= */}
        <div
          onMouseEnter={() => setIsSliderHovered(true)}
          onMouseLeave={() => setIsSliderHovered(false)}
          className="w-full lg:w-[440px] xl:w-[465px] shrink-0 rounded-[24px] sm:rounded-[30px] bg-white dark:bg-[#0d1322] border border-slate-200/90 dark:border-white/[0.1] shadow-[0_12px_40px_rgba(0,113,227,0.08)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] p-4 sm:p-6 flex flex-col justify-between gap-3.5 sm:gap-4 relative overflow-hidden"
        >
          {/* Subtle Top Rim */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/40 to-transparent" />

          {/* Top Bar of Tri-Pillar Card: Segmented Tabs + Play/Pause & Arrows */}
          <div className="flex items-center justify-between gap-2">
            {/* 4 Segmented Pillar Pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70">
              {[
                { idx: 0, label: 'Tổng hợp' },
                { idx: 1, label: 'Hội thoại' },
                { idx: 2, label: 'Phản xạ' },
                { idx: 3, label: 'Từ FSRS' }
              ].map((tab) => {
                const isActive = pillarSlide === tab.idx;
                return (
                  <button
                    key={tab.idx}
                    onClick={() => goToPillarSlide(tab.idx)}
                    className={`relative px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="triPillarSliderTab"
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="absolute inset-0 rounded-full bg-[#0071e3] shadow-2xs"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Auto-Play & Prev/Next Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSliderAuto((prev) => !prev)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#0071e3] flex items-center justify-center transition-colors cursor-pointer"
                title={isSliderAuto ? 'Tạm dừng chuyển slide' : 'Tự động chuyển slide'}
              >
                {isSliderAuto ? <Pause size={11} /> : <Play size={11} className="ml-0.5" />}
              </button>
              <button
                onClick={() => paginatePillar(-1)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#0071e3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Trụ cột trước"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => paginatePillar(1)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#0071e3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Trụ cột tiếp theo"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Middle Section: Interactive Triple Ring + Dynamic Slide Content */}
          <div className="flex items-center justify-between gap-4 pt-1">
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
                  className="space-y-2.5"
                >
                  {/* SLIDE 0: TỔNG HỢP 3 TRỤ CỘT */}
                  {pillarSlide === 0 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0071e3] dark:text-sky-400 tracking-[0.16em] uppercase">
                        <Activity size={12} />
                        <span>CHỈ SỐ ĐỒNG BỘ 3 TRỤ CỘT</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                        Tiến Độ 3 Trụ Cột
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Độ cân bằng hệ thống:{' '}
                        <strong className="text-[#0071e3] dark:text-sky-400">
                          {aiDiagnosis.balanceScore}%
                        </strong>
                        . Ưu tiên bồi đắp{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {aiDiagnosis.bottleneck.shortName}
                        </strong>{' '}
                        để tối ưu tốc độ phản xạ.
                      </p>
                    </>
                  )}

                  {/* SLIDE 1: TRỤ CỘT 1 - GIAO TIẾP THỰC CHIẾN */}
                  {pillarSlide === 1 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0071e3] dark:text-sky-400 tracking-[0.16em] uppercase">
                        <MessageSquare size={12} />
                        <span>TRỤ CỘT 01 • TỶ TRỌNG 45%</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                        Hội Thoại Thực Chiến
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Đã chinh phục{' '}
                        <strong className="text-[#0071e3] dark:text-sky-400">
                          {completedBinoLessons}/{totalBinoLessons} bài
                        </strong>{' '}
                        (~{completedBinoLessons * 6} mẫu câu đổi ruột & ngữ cảnh bản xứ).
                      </p>
                    </>
                  )}

                  {/* SLIDE 2: TRỤ CỘT 2 - PHẢN XẠ 50 CHỦ ĐỀ */}
                  {pillarSlide === 2 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-sky-500 dark:text-sky-400 tracking-[0.16em] uppercase">
                        <Zap size={12} />
                        <span>TRỤ CỘT 02 • TỶ TRỌNG 35%</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                        Phản Xạ Câu 3 Giây
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Làm chủ{' '}
                        <strong className="text-sky-600 dark:text-sky-400">
                          {reflexCompletedCount}/1500 câu
                        </strong>{' '}
                        nói – viết tức thì cùng ~{reflexCompletedCount * 2} cụm Collocations.
                      </p>
                    </>
                  )}

                  {/* SLIDE 3: TRỤ CỘT 3 - 3000 TỪ VỰNG FSRS */}
                  {pillarSlide === 3 && (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-[0.16em] uppercase">
                        <Layers size={12} />
                        <span>TRỤ CỘT 03 • TỶ TRỌNG 20%</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                        3000 Từ Vựng FSRS
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Đã ghi nhớ dài hạn{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {vocabMasteredCount}/1760 từ
                        </strong>{' '}
                        cốt lõi Oxford qua 60 chủ đề thực tế.
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right of Card: Interactive Triple Activity Ring (Click ring to switch slide!) */}
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
              size={118}
            />
          </div>

          {/* Interactive 3-Pillar Progress Strip (Click any pillar to inspect its slide) */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 text-[11px]">
            {aiDiagnosis.pillars.map((p, idx) => {
              const isFocused = pillarSlide === idx + 1;
              return (
                <button
                  key={p.id}
                  onClick={() => goToPillarSlide(isFocused ? 0 : idx + 1)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    isFocused
                      ? 'bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border-[#0071e3]/40'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate font-semibold">{p.shortName}</span>
                    </span>
                  </div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                    {p.countText}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Dynamic Context Action Bar at Bottom of Slider Card */}
          <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={pillarSlide}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.16 }}
                className="min-w-0 flex-1"
              >
                {pillarSlide === 0 && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
                      <p className="text-[10px] font-extrabold text-[#0071e3] dark:text-sky-400 uppercase tracking-wider">
                        Đề xuất AI • Ưu tiên {aiDiagnosis.bottleneck.shortName}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      {nextDialogue
                        ? `Chương ${nextDialogue.chapterNumber}: ${nextDialogue.title}`
                        : aiDiagnosis.bottleneck.advice}
                    </p>
                  </div>
                )}

                {pillarSlide === 1 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-[#0071e3] dark:text-sky-400 uppercase tracking-wider">
                      {nextDialogue
                        ? `Bài tiếp theo • Chương ${nextDialogue.chapterNumber}`
                        : 'Lộ trình 12 Chương Giao Tiếp'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      {nextDialogue ? nextDialogue.title : 'Khám phá trọn bộ 72 bài hội thoại'}
                    </p>
                  </div>
                )}

                {pillarSlide === 2 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      {activeReflexUnit
                        ? `Đang luyện • Unit ${activeReflexUnit.unitNumber}`
                        : 'Phản Xạ 50 Chủ Đề'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      {activeReflexUnit
                        ? `${activeReflexUnit.titleEn} (${activeReflexUnit.titleVi})`
                        : 'Rèn tốc độ bật câu trong 3 giây'}
                    </p>
                  </div>
                )}

                {pillarSlide === 3 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Kho Từ Vựng Oxford • 60 Chủ Đề
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      Ôn tập Flashcard 3D & Bảo vệ trí nhớ FSRS
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsDeepAnalysisOpen((prev) => !prev)}
                className="px-2.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0071e3] text-[11px] font-bold cursor-pointer"
                title="Mở bảng phân tích & giả lập tốc độ chinh phục"
              >
                Chi tiết
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08, x: 1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  if (pillarSlide === 0 || pillarSlide === 1) {
                    aiDiagnosis.pillars[0].onAction();
                  } else if (pillarSlide === 2) {
                    aiDiagnosis.pillars[1].onAction();
                  } else {
                    aiDiagnosis.pillars[2].onAction();
                  }
                }}
                className="w-9 h-9 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center justify-center shadow-sm shadow-blue-500/30 cursor-pointer"
                title="Vào học ngay"
              >
                <ArrowRight size={15} />
              </motion.button>
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
            <div className="pt-8 mt-8 border-t border-slate-200/80 dark:border-white/[0.08] space-y-6">
              {/* Header of Deep Analysis Suite */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0071e3] dark:text-sky-400">
                    <Sparkles size={13} />
                    <span>TRUNG TÂM PHÂN TÍCH & DỰ PHÓNG TIẾN ĐỘ 3 TRỤ CỘT</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    Chẩn đoán cân bằng năng lực & Giả lập lộ trình hoàn thành
                  </h3>
                </div>

                <div className="flex items-center gap-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiDiagnosis.pillars.map((pillar) => {
                  const isBottleneck = aiDiagnosis.bottleneck.id === pillar.id;
                  return (
                    <div
                      key={pillar.id}
                      className={`p-5 rounded-[24px] border transition-all flex flex-col justify-between gap-4 ${
                        isBottleneck
                          ? 'bg-blue-50/50 dark:bg-[#0071e3]/10 border-[#0071e3]/40 shadow-sm'
                          : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/[0.07]'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: pillar.color }}
                            />
                            {pillar.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
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
              <div className="p-5 sm:p-6 rounded-[26px] bg-white/95 dark:bg-slate-900/90 border border-slate-200/85 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#0071e3] dark:text-sky-400">
                      <Clock size={14} />
                      <span>TRÌNH GIẢ LẬP TỐC ĐỘ CHINH PHỤC (VELOCITY SIMULATOR)</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chọn quỹ thời gian học mỗi ngày để hệ thống tính toán số ngày hoàn thành phần còn lại của 3 trụ cột:
                    </p>
                  </div>

                  {/* Interactive Time Slider Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700">
                    {STUDY_PACE_PRESETS.map((preset, idx) => {
                      const isSelected = selectedPaceIdx === idx;
                      return (
                        <button
                          key={preset.minutes}
                          onClick={() => setSelectedPaceIdx(idx)}
                          className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
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
