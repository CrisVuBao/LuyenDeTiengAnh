import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  ChevronDown,
  Zap,
  Compass,
  FileCheck2,
  Activity,
  Play,
  CheckCircle2,
  Flame,
  Trophy,
  Headphones,
  Sparkles,
  Shield,
  BarChart3
} from 'lucide-react';
import { BrandFaviconSvg } from '../../../components/BrandLogo';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import binoApi from '../../../api/binoApi';
import toeicApi from '../../../api/toeicApi';
import { useBinoPlayerStore } from '../../bino/components/BinoPlaylistModal';
import useAuthStore from '../../../store/authStore';
import useReflex50Store, { loadReflex50FullData } from '../../reflex50/store/useReflex50Store';
import reflex50Meta from '../../reflex50/data/reflex50Meta.json';
import useVocabStore from '../../vocab/store/useVocabStore';
import DailyQuestsPanel from '../../gamification/components/DailyQuestsPanel';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import SeoMeta from '../../../components/SeoMeta';
import LuxuryQuickDock from '../../../components/luxury/LuxuryQuickDock';
import LuxuryAppleSlider from '../../../components/luxury/LuxuryAppleSlider';
import LuxuryHeroPavilion from '../../../components/luxury/LuxuryHeroPavilion';
import AnimatedCounter from '../../../components/luxury/AnimatedCounter';

// Progressive Below-the-Fold Lazy Chunks (Zero blocking of initial Home render)
const CompetenceRadarCard = lazy(() => import('../../progress/components/CompetenceRadarCard'));
const FsrsMemoryShieldCard = lazy(() => import('../../vocab/components/FsrsMemoryShieldCard'));
const LuxuryChapterCarousel = lazy(() => import('../../../components/luxury/LuxuryChapterCarousel'));
const ContentModuleExplorer = lazy(() => import('../../../components/ContentModuleExplorer'));
const VocabShowcaseSection = lazy(() => import('./VocabShowcaseSection'));
const MasterLearningGuideModal = lazy(() => import('../../../components/MasterLearningGuideModal'));

function SectionProgressiveFallback({ height = 'h-40' }) {
  return (
    <div
      className={`w-full ${height} rounded-[28px] bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/70 animate-pulse`}
    />
  );
}

// Apple-style Progressive Stagger Variants (120FPS GPU-accelerated transform & opacity)
const pageContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.01
    }
  }
};

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1]
    },
    transitionEnd: {
      transform: 'none'
    }
  }
};

export default function StudentHome() {
  const cachedStats = dashboardApi.peekStats()?.data || null;
  const cachedBook = binoApi.peekBookOverview() || null;
  const [stats, setStats] = useState(cachedStats);
  const [binoBook, setBinoBook] = useState(cachedBook);
  const [isLearningGuideOpen, setIsLearningGuideOpen] = useState(false);

  // Apple Interactive Workspace Filter & Clean Collapsible Radar Drawer
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reflex' | 'analytics' | 'vocab'
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const openPlaylist = useBinoPlayerStore((state) => state.openPlaylist);
  const isGlobalPlaying = useBinoPlayerStore((state) => state.isOpen);
  const navigate = useNavigate();
  const { profile, fetchProfile } = useGamificationStore();

  // Reactive subscription to Reflex 50 store
  const reflexMasteredIds = useReflex50Store((s) => s.masteredIds);
  const reflexLastStudiedUnit = useReflex50Store((s) => s.lastStudiedUnit);
  const reflexStats = useMemo(() => {
    return useReflex50Store.getState().getOverallStats();
  }, [reflexMasteredIds]);

  const vocabMasteredMap = useVocabStore((s) => s.masteredWords);
  const vocabMasteredCount = useMemo(() => {
    return Object.values(vocabMasteredMap || {}).filter(Boolean).length;
  }, [vocabMasteredMap]);

  useEffect(() => {
    fetchProfile();
    useVocabStore.getState().fetchProgress();
    useReflex50Store.getState().fetchProgress();
    Promise.allSettled([
      dashboardApi.getStats().then((res) => {
        if (res?.data) setStats(res.data);
      }),
      binoApi.getBookOverview().then((res) => {
        if (res?.data) setBinoBook(res.data);
      })
    ]);
  }, [fetchProfile]);

  const recentTests = stats?.recentTests || [];
  const totalBinoLessons = binoBook?.totalLessons || 72;
  const completedBinoLessons = binoBook?.completedLessons || 0;
  const binoProgressPercent = binoBook?.progressPercentage || 0;
  const allChapters = binoBook?.chapters || [];

  const reflexCompletedCount = reflexStats?.totalMastered || 0;
  const reflexPercent = reflexStats?.overallPercent || 0;
  const vocabPercent = Math.min(100, Math.round((vocabMasteredCount / 1760) * 100));
  const maisonMasteryScore = Math.round(
    binoProgressPercent * 0.45 + reflexPercent * 0.35 + vocabPercent * 0.2
  );

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.fullName || 'bạn';
    if (hour >= 5 && hour < 11) {
      return {
        prefix: 'Chào buổi sáng',
        title: `Chào buổi sáng, ${name}`,
        subtitle: 'Khoảnh khắc hoàn hảo để đánh thức phản xạ và mài sắc ngữ điệu bản ngữ.'
      };
    } 
    else if (hour >= 11 && hour < 13) {
      return {
        prefix: 'Chào buổi trưa',
        title: `Chào buổi trưa, ${name}`,
        subtitle: 'Duy trì phong độ thanh lịch cùng 15 phút rèn phản xạ câu không cần dịch ngầm.'
      };
    } else if (hour >= 13 && hour < 18) {
      return {
        prefix: 'Chào buổi chiều',
        title: `Chào buổi chiều, ${name}`,
        subtitle: 'Duy trì phong độ thanh lịch cùng 15 phút rèn phản xạ câu không cần dịch ngầm.'
      };
    } else {
      return {
        prefix: 'Chào buổi tối',
        title: `Chào buổi tối, ${name}`,
        subtitle: 'Thư thái ngấm âm thanh đời thực và kích hoạt lá chắn bảo vệ trí nhớ.'
      };
    }
  }, [user?.fullName]);

  // Tìm bài học tiếp theo chưa hoàn thành để học viên bấm 1 chạm là vào học tiếp
  const nextDialogue = useMemo(() => {
    if (!binoBook?.chapters) return null;
    for (const chap of binoBook.chapters) {
      for (const d of chap.dialogues || []) {
        if (!d.isCompleted) return { ...d, chapterNumber: chap.chapterNumber };
      }
    }
    const firstChap = binoBook.chapters[0];
    return firstChap?.dialogues?.[0]
      ? { ...firstChap.dialogues[0], chapterNumber: firstChap.chapterNumber }
      : null;
  }, [binoBook]);

  const handleSelectDialogue = useCallback(
    (dialogueId) => {
      if (dialogueId) {
        navigate(`/communication/dialogue/${dialogueId}`);
      } else {
        navigate('/communication');
      }
    },
    [navigate]
  );

  const handlePlayChapter = useCallback(
    (chap) => {
      const ids = (chap.dialogues || []).map((d) => d.id);
      openPlaylist({
        ids: ids.length > 0 ? ids : null,
        autoStart: true,
        minimized: false,
        book: binoBook
      });
    },
    [openPlaylist, binoBook]
  );

  const showSection = (group) => activeFilter === 'all' || activeFilter === group;
  const shouldShowRadar = activeFilter === 'analytics' || isRadarOpen;

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="w-full min-w-0 max-w-6xl mx-auto pb-24 md:pb-16"
    >
      <SeoMeta
        title="Trang Chủ Học Tập"
        description="Luyện phản xạ giao tiếp tiếng Anh thực chiến, 3000 từ vựng Oxford FSRS và rèn luyện kỹ năng nói tiếng Anh tự nhiên mỗi ngày cùng VBaceEnglish."
      />

      {/* ===================================================================== */}
      {/* 📱 1. MOBILE NATIVE APP VIEW (< 768px / md:hidden)                   */}
      {/* Gọn nhẹ, trực quan, 0 rối mắt — Trải nghiệm chuẩn App Mobile thực thụ */}
      {/* ===================================================================== */}
      <div className="block md:hidden space-y-4 px-1 pb-4">
        {/* 1.1 Mobile App Top Bar: Greeting + Streak + XP */}
        <div className="flex items-center justify-between gap-2.5 pt-1 pb-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#1cb0f6] border-b-4 border-b-[#0071e3] flex items-center justify-center p-1.5 shadow-xs shrink-0">
              <BrandFaviconSvg className="w-full h-full rounded-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                {timeGreeting.prefix},
              </p>
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {user?.fullName || 'Học viên'} 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Streak Pill */}
            <div
              className="duo-pill duo-pill-streak text-[11px] font-black px-2.5 py-1 flex items-center gap-1 shadow-2xs"
              title={profile?.hasStudiedToday ? 'Đã học hôm nay - Ngọn lửa an toàn' : 'Chưa học hôm nay - Cần giữ chuỗi'}
            >
              <Flame size={13} className={profile?.hasStudiedToday ? "fill-orange-500 text-orange-500 animate-duo-wiggle" : "text-amber-500"} />
              <span>
                <AnimatedCounter value={profile?.currentStreak ?? stats?.currentStreakDays ?? 0} />
              </span>
            </div>

            {/* Level / XP Pill */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="duo-pill duo-pill-xp text-[11px] font-black px-2.5 py-1 flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              title="Xem Bảng Xếp Hạng & Cấp Độ"
            >
              <Trophy size={12} className="text-amber-500 fill-amber-500 shrink-0" />
              <span>Cấp {profile?.currentLevel ?? 1}</span>
              <span className="text-amber-400 opacity-60 font-normal">|</span>
              <span>
                <AnimatedCounter value={profile?.totalXP ?? stats?.totalXpEarned ?? 0} suffix=" XP" />
              </span>
            </button>
          </div>
        </div>

        {/* 1.2 Thẻ Tiếp Tục Bài Học (Hero 1 Chạm Thông Minh) */}
        <div className="duo-card p-4 rounded-3xl bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 border-2 border-blue-200 dark:border-blue-800/80 border-b-6 border-b-[#0071e3] shadow-md space-y-3 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent" />

          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={11} className="animate-duo-bounce" />
              <span>BÀI HỌC TIẾP THEO</span>
            </div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              Tổng quan: <strong className="text-[#0071e3] dark:text-sky-400">{maisonMasteryScore}%</strong>
            </span>
          </div>

          {nextDialogue ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#0071e3] text-white text-[9px] font-black uppercase tracking-wider shrink-0">
                  Chương {nextDialogue.chapterNumber}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  {nextDialogue.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Giao tiếp phản xạ tự nhiên 1:1 không cần dịch ngầm
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Sẵn sàng cho bài học hôm nay!
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Duy trì 15 phút rèn phản xạ mỗi ngày
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (nextDialogue?.id) navigate(`/communication/dialogue/${nextDialogue.id}`);
              else navigate('/communication');
            }}
            className="duo-btn duo-btn-sapphire duo-btn-md w-full font-black shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
          >
            <Play size={15} fill="currentColor" className="shrink-0" />
            <span>TIẾP TỤC HỌC NGAY</span>
            <ArrowRight size={15} className="shrink-0" />
          </button>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })}
              className="duo-btn duo-btn-white duo-btn-xs font-black flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200"
            >
              {isGlobalPlaying ? (
                <span className="inline-flex items-end gap-0.5 h-3 text-[#0071e3] dark:text-sky-400 shrink-0">
                  <span className="equalizer-bar" />
                  <span className="equalizer-bar" />
                  <span className="equalizer-bar" />
                </span>
              ) : (
                <Headphones size={13} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
              )}
              <span className="truncate">{isGlobalPlaying ? 'Đang phát đài' : 'Đài nghe 24/7'}</span>
            </button>
            <button
              onClick={() => navigate('/reflex-50')}
              className="duo-btn duo-btn-white duo-btn-xs font-black flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200"
            >
              <Zap size={13} className="text-[#d9822b] shrink-0" />
              <span className="truncate">Phản xạ nhanh 3s</span>
            </button>
          </div>
        </div>

        {/* 1.3 4 Trụ Cột Học Tập (App Grid 2x2 Cực Kỳ Trực Quan) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Compass size={13} className="text-[#0071e3]" /> 4 TRỤ CỘT HỌC TẬP
            </span>
            <span className="text-[10px] font-bold text-slate-400">1 chạm vào học</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Pillar 1: Giao Tiếp Thực Chiến */}
            <div
              onClick={() => navigate('/communication')}
              className="duo-card duo-card-sapphire p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-2xs">
                    <BookOpen size={16} />
                  </div>
                  <span className="text-[10px] font-black text-[#0071e3] dark:text-sky-400">
                    {binoProgressPercent}%
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    Giao Tiếp
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {completedBinoLessons}/{totalBinoLessons} bài
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0071e3] rounded-full transition-all duration-500" style={{ width: `${binoProgressPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-[#0071e3] dark:text-sky-400 pt-0.5">
                  <span>72 Hội thoại</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>

            {/* Pillar 2: Phản Xạ 50 Chủ Đề */}
            <div
              onClick={() => navigate('/reflex-50')}
              className="duo-card duo-card-amber p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#d9822b] text-white flex items-center justify-center shadow-2xs">
                    <Zap size={16} />
                  </div>
                  <span className="text-[10px] font-black text-[#d9822b] dark:text-amber-400">
                    {reflexPercent}%
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    Phản Xạ 3 Giây
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {reflexCompletedCount}/1500 câu
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-amber-100 dark:bg-amber-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d9822b] rounded-full transition-all duration-500" style={{ width: `${reflexPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-[#d9822b] dark:text-amber-400 pt-0.5">
                  <span>50 Chủ đề</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>

            {/* Pillar 3: 3.000 Từ Vựng Oxford FSRS */}
            <div
              onClick={() => navigate('/vocab')}
              className="duo-card duo-card-green p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#7acc15] text-white flex items-center justify-center shadow-2xs">
                    <Layers size={16} />
                  </div>
                  <span className="text-[10px] font-black text-[#5ea810] dark:text-lime-400">
                    {vocabPercent}%
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    3000 Từ Vựng
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {vocabMasteredCount} từ vững
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-lime-100 dark:bg-lime-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7acc15] rounded-full transition-all duration-500" style={{ width: `${vocabPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-[#5ea810] dark:text-lime-400 pt-0.5">
                  <span>Thẻ FSRS</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>

            {/* Pillar 4: Luyện Đề TOEIC */}
            <div
              onClick={() => navigate('/toeic')}
              className="duo-card duo-card-red p-3 rounded-2xl flex flex-col justify-between gap-2.5 cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#ff4b4b] text-white flex items-center justify-center shadow-2xs">
                    <FileCheck2 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-[#ea2b2b] dark:text-rose-400">
                    ETS
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    Luyện Đề TOEIC
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {stats?.totalCompletedTests || 0} đề hoàn thành
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-rose-100 dark:bg-rose-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff4b4b] rounded-full" style={{ width: `${Math.min(100, ((stats?.totalCompletedTests || 0) / 10) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-[#ea2b2b] dark:text-rose-400 pt-0.5">
                  <span>Part 1 – 7</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1.4 Nhiệm Vụ Hàng Ngày (Compact Shelf) */}
        <section className="w-full min-w-0 max-w-full">
          <DailyQuestsPanel />
        </section>

        {/* 1.5 Tiện Ích Nhanh (Clean 3-Button Strip) */}
        <div className="p-3 rounded-2xl duo-card bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            TIỆN ÍCH HỌC TẬP NHANH
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate('/vocab')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-lime-50 dark:hover:bg-lime-950/40 text-center transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/60"
            >
              <Shield size={16} className="mx-auto text-[#7acc15]" />
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block mt-1">
                Lá chắn FSRS
              </span>
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-center transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/60"
            >
              <TrendingUp size={16} className="mx-auto text-[#0071e3]" />
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block mt-1">
                Tiến độ học
              </span>
            </button>
            <button
              onClick={() => setIsLearningGuideOpen(true)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-center transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/60"
            >
              <Sparkles size={16} className="mx-auto text-[#f59e0b]" />
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block mt-1">
                Lộ trình vàng
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 💻 2. DESKTOP & TABLET VIEW (>= 768px / hidden md:block)              */}
      {/* Giữ trọn vẹn Pavillon sang trọng, 3D sliders và trạm phân tích sâu    */}
      {/* ===================================================================== */}
      <div className="hidden md:block space-y-6 lg:space-y-8">
        {/* ===================================================================== */}
        {/* 1. APPLE FLAGSHIP HERO PAVILION & TRI-PILLAR MASTERY ENGINE SLIDER    */}
        {/* ===================================================================== */}
      <LuxuryHeroPavilion
        timeGreeting={timeGreeting}
        profile={profile}
        stats={stats}
        binoBook={binoBook}
        completedBinoLessons={completedBinoLessons}
        totalBinoLessons={totalBinoLessons}
        binoProgressPercent={binoProgressPercent}
        reflexCompletedCount={reflexCompletedCount}
        reflexPercent={reflexPercent}
        activeReflexUnit={
          reflex50Meta.units.find((u) => u.unitNumber === reflexLastStudiedUnit) ||
          reflex50Meta.units[0]
        }
        vocabMasteredCount={vocabMasteredCount}
        vocabPercent={vocabPercent}
        maisonMasteryScore={maisonMasteryScore}
        nextDialogue={nextDialogue}
        isGlobalPlaying={isGlobalPlaying}
        onNavigate={navigate}
        onOpenPlaylist={() =>
          openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })
        }
        onOpenGuide={() => setIsLearningGuideOpen(true)}
      />

      {/* ===================================================================== */}
      {/* 2. NHIỆM VỤ HÀNG NGÀY — ĐẶT NGAY DƯỚI HERO ĐỂ THAO TÁC 1 CHẠM        */}
      {/* ===================================================================== */}
      <motion.section variants={sectionRevealVariants} className="w-full min-w-0 max-w-full">
        <DailyQuestsPanel />
      </motion.section>

      {/* ===================================================================== */}
      {/* 3. THANH LỌC KHÔNG GIAN HỌC TẬP & TRẠM PHÂN TÍCH GỌN NHẸ (COMPACT HUD)*/}
      {/* ===================================================================== */}
      <motion.div
        variants={sectionRevealVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-0.5 sm:px-1 w-full min-w-0 max-w-full"
      >
        <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <Compass size={16} className="text-[#1cb0f6] animate-duo-bounce shrink-0" />
          <span>KHÔNG GIAN HỌC TẬP TRỌNG TÂM:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0 max-w-full">
          <div
            className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-950 overflow-x-auto w-full sm:w-auto max-w-full no-scrollbar shadow-xs"
            style={{ scrollbarWidth: 'none' }}
          >
            {[
              { id: 'all', label: '✦ Tất cả' },
              { id: 'reflex', label: 'Giao Tiếp & Phản Xạ' },
              { id: 'vocab', label: '3000 Từ & TOEIC' },
              { id: 'analytics', label: 'Radar & FSRS' }
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`duo-btn duo-btn-xs font-black transition-all ${
                    isActive
                      ? 'duo-btn-blue'
                      : 'duo-btn-white'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeFilter === 'all' && (
            <button
              type="button"
              onClick={() => setIsRadarOpen((prev) => !prev)}
              className="duo-btn duo-btn-white duo-btn-xs font-black flex items-center gap-1.5"
            >
              <Activity size={14} className="text-[#1cb0f6]" />
              <span>{isRadarOpen ? 'Ẩn Radar' : 'Mở Radar'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${isRadarOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </motion.div>

      {/* Compact FSRS Shield Bar (Always compact by default so it never clutters vertical scroll) */}
      {showSection('analytics') && (
        <motion.section variants={sectionRevealVariants} className="space-y-4 w-full min-w-0 max-w-full">
          <div id="shield-section">
            <Suspense fallback={<SectionProgressiveFallback height="h-20" />}>
              <FsrsMemoryShieldCard compact={activeFilter !== 'analytics'} />
            </Suspense>
          </div>

          <AnimatePresence initial={false}>
            {shouldShowRadar && (
              <motion.div
                id="radar-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transitionEnd: { transform: 'none' } }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <Suspense fallback={<SectionProgressiveFallback height="h-64" />}>
                  <CompetenceRadarCard
                    wordsMastered={vocabMasteredCount}
                    reflexMastered={reflexStats?.totalMastered || 0}
                    binoLessonsCompleted={completedBinoLessons}
                    toeicCompleted={
                      stats?.totalConfidentQuestions || stats?.totalCompletedQuestions || 0
                    }
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 4. TRỤ CỘT 01: GIAO TIẾP THỰC CHIẾN — PHẢN XẠ TIẾNG ANH TỨC THÌ       */}
      {/*    (Signature Studio Card with Live Substitution Bar & 12 Chapters)   */}
      {/* ===================================================================== */}
      {showSection('reflex') && allChapters.length > 0 && (
        <motion.section variants={sectionRevealVariants} className="w-full min-w-0 max-w-full">
          <Suspense fallback={<SectionProgressiveFallback height="h-64" />}>
            <LuxuryChapterCarousel
              chapters={allChapters}
              nextDialogue={nextDialogue}
              completedLessons={completedBinoLessons}
              totalLessons={totalBinoLessons}
              onSelectDialogue={handleSelectDialogue}
              onNavigateAll={() => navigate('/communication')}
              onPlayChapter={handlePlayChapter}
            />
          </Suspense>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 5. TRỤ CỘT 02: PHẢN XẠ NÓI – VIẾT 50 CHỦ ĐỀ (1.500 CÂU THỰC CHIẾN)    */}
      {/* ===================================================================== */}
      {showSection('reflex') &&
        (() => {
          const activeUnitObj =
            reflex50Meta.units.find((u) => u.unitNumber === reflexLastStudiedUnit) ||
            reflex50Meta.units[0];

          return (
            <motion.section
              variants={sectionRevealVariants}
              className="duo-card p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50/95 via-yellow-50/70 to-orange-50/85 dark:from-[#261503] dark:via-[#201102] dark:to-[#120800] border-2 border-amber-200 dark:border-amber-800/80 border-b-6 border-b-[#f59e0b] dark:border-b-[#d97706] space-y-4 sm:space-y-6 w-full min-w-0 max-w-full shadow-md relative overflow-hidden"
            >
              {/* Soft Ambient Glows & Top Gloss Shimmer */}
              <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#f59e0b]/20 to-orange-400/15 rounded-full blur-2xl" />
              <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-yellow-500/15 to-amber-400/15 rounded-full blur-2xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b]/60 to-transparent" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
                <div className="space-y-2 sm:space-y-2.5 max-w-2xl min-w-0 flex-1">
                  {/* Duolingo Ribbon Pills */}
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <div className="duo-pill duo-pill-amber text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                      <Zap size={13} className="text-[#f59e0b] dark:text-[#fbbf24] shrink-0" />
                      <span className="sm:hidden">50 CHỦ ĐỀ • 1.500 CÂU PHẢN XẠ 3S</span>
                      <span className="hidden sm:inline">TRỤ CỘT 02 • 50 CHỦ ĐỀ • 1.500 CÂU PHẢN XẠ 3 GIÂY</span>
                    </div>

                    <div className="duo-pill duo-pill-xp text-[10px] sm:text-xs font-black shrink-0">
                      <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
                      <span>{reflexStats.totalMastered}/1500 câu ({reflexStats.percent}%)</span>
                    </div>
                  </div>

                  {/* Duolingo Chunky Headline */}
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-snug">
                      <span className="text-slate-900 dark:text-white">
                        Phản Xạ Nói – Viết
                      </span>{' '}
                      <span className="text-[#d97706] dark:text-[#fbbf24]">
                        50 Chủ Đề Tiếng Anh Thông Dụng.
                      </span>
                    </h2>
                    <p className="line-clamp-1 sm:line-clamp-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold max-w-xl">
                      Bật câu tiếng Anh trong <strong>3 giây</strong>, luyện viết chấm điểm từng từ và nắm vững <strong>3.400+ cụm Collocations bản xứ</strong> chia theo 5 cấp độ.
                    </p>
                  </div>
                </div>

                {/* Tactile Duolingo Action Buttons (2-col grid on mobile, row on tablet/desktop) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0 shrink-0">
                  <button
                    onMouseEnter={() => loadReflex50FullData()}
                    onClick={() => navigate(`/reflex-50/unit/${activeUnitObj.unitNumber}`)}
                    className="duo-btn duo-btn-amber duo-btn-sm sm:duo-btn-md font-black shadow-md w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                  >
                    <Play size={15} fill="currentColor" className="shrink-0" />
                    <span className="truncate">Học Unit #{activeUnitObj.unitNumber}</span>
                    <ArrowRight size={15} className="shrink-0 hidden xs:inline" />
                  </button>
                  <button
                    onMouseEnter={() => loadReflex50FullData()}
                    onClick={() => navigate('/reflex-50')}
                    className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black text-xs sm:text-sm w-full sm:w-auto text-[#d97706] dark:text-[#fbbf24] cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <span className="truncate">Đủ 50 Chủ Đề</span>
                  </button>
                </div>
              </div>

              {/* 5 Category Cards Preview (Duolingo 3D Chunky Cards) */}
              <div
                className="flex lg:grid lg:grid-cols-5 gap-3 sm:gap-3.5 overflow-x-auto snap-x snap-mandatory pb-1 lg:pb-0 no-scrollbar relative z-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {reflex50Meta.categories.map((cat) => (
                  <div
                    key={cat.id}
                    onMouseEnter={() => loadReflex50FullData()}
                    onClick={() => navigate(`/reflex-50/unit/${cat.unitRange[0]}`)}
                    className="w-[240px] sm:w-[260px] lg:w-auto shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-amber-200/80 dark:border-amber-800/60 border-b-4 border-b-amber-400 dark:border-b-amber-900 hover:scale-[1.03] transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-black text-[#d97706] dark:text-[#fbbf24]">
                        <span>
                          UNIT {cat.unitRange[0]} – {cat.unitRange[1]}
                        </span>
                        <span className="text-slate-400 font-extrabold">300 câu</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 group-hover:text-[#d97706] dark:group-hover:text-[#fbbf24] transition-colors line-clamp-1">
                        {cat.titleVi}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium">
                        {cat.description}
                      </p>
                    </div>
                    <div className="text-[11px] font-black text-[#d97706] dark:text-[#fbbf24] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Vào luyện phản xạ</span>
                      <ChevronRight size={13} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          );
        })()}

      {/* ===================================================================== */}
      {/* 6. TRỤ CỘT 03: 3000 TỪ VỰNG TIẾNG ANH OXFORD THEO 60 CHỦ ĐỀ           */}
      {/* ===================================================================== */}
      {showSection('vocab') && (
        <Suspense fallback={<SectionProgressiveFallback height="h-64" />}>
          <VocabShowcaseSection sectionRevealVariants={sectionRevealVariants} />
        </Suspense>
      )}

      {/* ===================================================================== */}
      {/* 7. PHÒNG LUYỆN ĐỀ TOEIC ETS STUDIO & CÔNG CỤ ÔN TẬP NHANH             */}
      {/* ===================================================================== */}
      {showSection('vocab') && (
        <motion.section
          variants={sectionRevealVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {/* Left 2 Columns: Apple Flagship ETS TOEIC Studio Card */}
          <div className="relative overflow-hidden lg:col-span-2 p-5 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_6px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/35 to-transparent" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-[#0071e3] dark:text-sky-400 text-[11px] font-extrabold border border-[#0071e3]/20">
                  <FileCheck2 size={13} />
                  <span>ETS TOEIC® STUDIO • PART 1 – 7</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Phòng Luyện Đề TOEIC Thực Chiến Chuẩn ETS
                </h3>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                    🎧 Listening Part 1 – 4
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                    📖 Reading Part 5 – 7
                  </span>
                </div>
              </div>

              <button
                onMouseEnter={() => toeicApi.prefetchAllTests()}
                onClick={() => navigate('/toeic')}
                className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 self-start shadow-[0_6px_16px_rgba(0,113,227,0.24)] cursor-pointer"
              >
                <span>Vào phòng luyện đề</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTests.map((test) => (
                <div
                  key={test.toeicTestId}
                  onClick={() => navigate(`/toeic?test=${test.testId}`)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/75 dark:border-slate-800 hover:border-[#0071e3]/45 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-all group"
                >
                  <div className="min-w-0 space-y-1.5 flex-1 w-full">
                    <div className="flex items-center justify-between sm:justify-start gap-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 text-[11px] font-extrabold">
                        {test.testId}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {test.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Đã nắm chắc:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {test.confidentQuestions}/{test.totalQuestions} câu
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Tiến độ:{' '}
                        <strong className="text-[#0071e3] dark:text-sky-400">
                          {test.percentCompleted}%
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="hidden sm:block w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0071e3] to-sky-400 rounded-full"
                        style={{ width: `${test.percentCompleted || 0}%` }}
                      />
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-[#0071e3] dark:text-sky-400 group-hover:bg-[#0071e3] group-hover:text-white transition-colors flex items-center gap-1">
                      <span>Làm tiếp</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              ))}

              {recentTests.length === 0 && (
                <div
                  onClick={() => navigate('/toeic')}
                  className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 hover:border-[#0071e3]/40 text-center cursor-pointer transition-colors space-y-1.5"
                >
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    Sẵn sàng chinh phục bộ đề TOEIC ETS thực chiến
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bấm vào đây hoặc nút{' '}
                    <strong className="text-[#0071e3] dark:text-sky-400">
                      &ldquo;Vào phòng luyện đề&rdquo;
                    </strong>{' '}
                    để bắt đầu giải đề kèm lời giải chi tiết từng câu.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Column: Clean Apple Settings-Style Quick Links */}
          <div className="p-5 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_6px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#0071e3] dark:text-sky-400 uppercase tracking-wider">
                Tiện ích nhanh
              </p>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Công cụ ôn tập
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {[
                {
                  icon: Layers,
                  title: 'Ôn tập Flashcard SRS',
                  desc: 'Ôn các từ đã bấm + Flashcard',
                  onClick: () => navigate('/communication/flashcards')
                },
                {
                  icon: BookOpen,
                  title: 'Đọc Ebook Giáo Trình',
                  desc: 'Xem giáo trình trình bày nguyên bản',
                  onClick: () => navigate('/communication/reader')
                },
                {
                  icon: TrendingUp,
                  title: 'Thống kê tiến độ',
                  desc: 'Biểu đồ & lịch sử học tập',
                  onClick: () => navigate('/progress')
                }
              ].map((tool, idx) => {
                const ToolIcon = tool.icon;
                return (
                  <div
                    key={idx}
                    onClick={tool.onClick}
                    className="py-3.5 flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-[#0071e3] group-hover:text-white flex items-center justify-center transition-colors duration-200">
                        <ToolIcon size={17} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                          {tool.title}
                        </h4>
                        <p className="text-xs text-slate-400">{tool.desc}</p>
                      </div>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-slate-300 dark:text-slate-600 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trình nghe thụ động luôn duy trì ở góc màn hình khi chuyển trang và hỗ trợ phát nền
              khi khóa màn hình điện thoại.
            </div>
          </div>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 8. APPLE INTERACTIVE SHOWCASE SLIDER & LỘ TRÌNH MỞ RỘNG THU GỌN       */}
      {/* ===================================================================== */}
      {showSection('reflex') && (
        <motion.section variants={sectionRevealVariants}>
          <LuxuryAppleSlider
            onNavigateCommunication={() => navigate('/communication')}
            onNavigateReflex={() => navigate('/reflex-50')}
            onNavigateVocab={() => navigate('/vocab')}
            onOpenGuide={() => setIsLearningGuideOpen(true)}
            binoProgressPercent={binoProgressPercent}
            reflexCompletedCount={reflexCompletedCount}
            vocabMasteredCount={vocabMasteredCount}
          />
        </motion.section>
      )}

      {/* Collapsible Expansion Tracks (Compact by default to keep Home clean) */}
      {showSection('all') && (
        <motion.section variants={sectionRevealVariants}>
          <Suspense fallback={<SectionProgressiveFallback height="h-24" />}>
            <ContentModuleExplorer compact />
          </Suspense>
        </motion.section>
      )}
      </div>

      {/* Master Learning Guide Modal */}
      {isLearningGuideOpen && (
        <Suspense fallback={null}>
          <MasterLearningGuideModal
            isOpen={isLearningGuideOpen}
            onClose={() => setIsLearningGuideOpen(false)}
          />
        </Suspense>
      )}

      {/* Apple VisionOS / iOS 18 Adaptive Floating Quick-Dock */}
      <LuxuryQuickDock
        onOpenPlaylist={() =>
          openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })
        }
        isPlaylistPlaying={isGlobalPlaying}
      />
    </motion.div>
  );
}
