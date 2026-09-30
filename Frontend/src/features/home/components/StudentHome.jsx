import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, ArrowRight, Flame, CheckCircle2, 
  TrendingUp, Play, Headphones, MessageSquare, 
  Layers, BookMarked, ChevronRight, Volume2, RefreshCw, Zap, PenTool, Mic, Trophy, Lightbulb
} from 'lucide-react';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import binoApi from '../../../api/binoApi';
import toeicApi from '../../../api/toeicApi';
import speechService from '../../../utils/speechService';
import { useBinoPlayerStore } from '../../bino/components/BinoPlaylistModal';
import useAuthStore from '../../../store/authStore';
import useReflex50Store, { loadReflex50FullData } from '../../reflex50/store/useReflex50Store';
import reflex50Meta from '../../reflex50/data/reflex50Meta.json';
import useVocabStore from '../../vocab/store/useVocabStore';
import PageLoader from '../../../components/PageLoader';
import DailyQuestsPanel from '../../gamification/components/DailyQuestsPanel';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import VocabShowcaseSection from './VocabShowcaseSection';
import SeoMeta from '../../../components/SeoMeta';
import ContentModuleExplorer from '../../../components/ContentModuleExplorer';
import MasterLearningGuideModal from '../../../components/MasterLearningGuideModal';
import CompetenceRadarCard from '../../progress/components/CompetenceRadarCard';
import FsrsMemoryShieldCard from '../../vocab/components/FsrsMemoryShieldCard';
import LuxurySpotlightCard from '../../../components/luxury/LuxurySpotlightCard';
import LuxuryTripleActivityRing from '../../../components/luxury/LuxuryTripleActivityRing';
import LuxuryQuickDock from '../../../components/luxury/LuxuryQuickDock';
import AnimatedCounter from '../../../components/luxury/AnimatedCounter';

// Apple-style Spring Variants (120FPS GPU-accelerated transform & opacity)
const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03
    }
  }
};

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 240,
      damping: 26,
      mass: 0.85
    }
  }
};

const cardGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24
    }
  }
};

// Mẫu câu thực tế tự động chuyển động sinh động trên trang Home (Substitution Drilling Demo)
const LIVE_DRILL_SAMPLES = [
  {
    context: 'Khi mới chuyển đến trường đại học',
    slotEn: 'the campus layout',
    slotVi: 'sơ đồ khuôn viên trường',
    fullEn: "It's been pretty good. I'm still getting used to the campus layout though.",
    fullVi: 'Mọi thứ khá ổn. Dù vậy mình vẫn đang làm quen với sơ đồ khuôn viên trường.'
  },
  {
    context: 'Khi mới bắt đầu công việc mới',
    slotEn: 'the new work schedule',
    slotVi: 'lịch làm việc mới',
    fullEn: "It's been pretty good. I'm still getting used to the new work schedule though.",
    fullVi: 'Mọi thứ khá ổn. Dù vậy mình vẫn đang làm quen với lịch làm việc mới.'
  },
  {
    context: 'Khi mới sang nước ngoài sinh sống',
    slotEn: 'the local weather here',
    slotVi: 'thời tiết địa phương ở đây',
    fullEn: "It's been pretty good. I'm still getting used to the local weather here though.",
    fullVi: 'Mọi thứ khá ổn. Dù vậy mình vẫn đang làm quen với thời tiết địa phương ở đây.'
  },
  {
    context: 'Khi nói chuyện bằng tiếng Anh mỗi ngày',
    slotEn: 'speaking English daily',
    slotVi: 'việc nói tiếng Anh hàng ngày',
    fullEn: "It's been pretty good. I'm still getting used to speaking English daily though.",
    fullVi: 'Mọi thứ khá ổn. Dù vậy mình vẫn đang làm quen với việc nói tiếng Anh hàng ngày.'
  }
];

// Tách riêng Widget tự động xoay vòng 3.8s bằng React.memo để không gây re-render toàn bộ trang Home
const LiveSubstitutionDrillShowcase = React.memo(function LiveSubstitutionDrillShowcase({ onNavigateBino }) {
  const [activeDrillIdx, setActiveDrillIdx] = useState(0);
  const [isSpeakingDemo, setIsSpeakingDemo] = useState(false);
  const activeSample = LIVE_DRILL_SAMPLES[activeDrillIdx];

  useEffect(() => {
    if (isSpeakingDemo) return undefined;
    const timer = setInterval(() => {
      setActiveDrillIdx((prev) => (prev + 1) % LIVE_DRILL_SAMPLES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isSpeakingDemo]);

  const handlePlaySampleVoice = (e) => {
    e.stopPropagation();
    setIsSpeakingDemo(true);
    speechService.speak(activeSample.fullEn, {
      rate: 0.95,
      speakerIndex: 0,
      onEnd: () => setIsSpeakingDemo(false),
      onError: () => setIsSpeakingDemo(false)
    });
  };

  return (
    <LuxurySpotlightCard
      spotlightColor="rgba(0, 113, 227, 0.12)"
      borderColor="rgba(0, 113, 227, 0.28)"
      className="p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
      contentClassName="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      onClick={onNavigateBino}
    >
      <div className="space-y-2.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/15 dark:text-sky-400 text-[11px] font-semibold">
            Vận dụng mẫu câu thực tế
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeSample.context}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-slate-400 dark:text-slate-500 font-medium"
            >
              • {activeSample.context}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Animated Sentence with Dynamic Slot Replacement (100% GPU Transform + Opacity) */}
        <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span>&ldquo;It&apos;s been pretty good. I&apos;m still getting used to</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeSample.slotEn}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="inline-block px-2.5 py-0.5 rounded-xl bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 font-bold"
            >
              {activeSample.slotEn}
            </motion.span>
          </AnimatePresence>
          <span>though.&rdquo;</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={activeSample.fullVi}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-vietsub"
          >
            {activeSample.fullVi}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Interactive Controls on the Right */}
      <div
        className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch lg:self-center justify-between lg:justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 mr-1">
          {LIVE_DRILL_SAMPLES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDrillIdx(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeDrillIdx
                  ? 'w-6 bg-[#0071e3] dark:bg-sky-400'
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
              }`}
              title={`Tình huống ${idx + 1}`}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlaySampleVoice}
          className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Volume2 size={15} className={isSpeakingDemo ? 'text-[#0071e3] animate-bounce' : 'text-[#0071e3] dark:text-sky-400'} />
          <span>Nghe thử câu này</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveDrillIdx((prev) => (prev + 1) % LIVE_DRILL_SAMPLES.length)}
          className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Đổi tình huống khác"
        >
          <RefreshCw size={14} />
        </motion.button>
      </div>
    </LuxurySpotlightCard>
  );
});

export default function StudentHome() {
  const cachedStats = dashboardApi.peekStats()?.data || null;
  const cachedBook = binoApi.peekBookOverview() || null;
  const [stats, setStats] = useState(cachedStats);
  const [binoBook, setBinoBook] = useState(cachedBook);
  const [loading, setLoading] = useState(!cachedStats && !cachedBook);
  const [isLearningGuideOpen, setIsLearningGuideOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const openPlaylist = useBinoPlayerStore((state) => state.openPlaylist);
  const isGlobalPlaying = useBinoPlayerStore((state) => state.isOpen);
  const navigate = useNavigate();
  const { profile, fetchProfile } = useGamificationStore();

  // Reactive subscription to Reflex 50 store so progress updates immediately across browsers
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
    ]).finally(() => setLoading(false));
  }, [fetchProfile]);

  const recentTests = stats?.recentTests || [];
  const totalBinoLessons = binoBook?.totalLessons || 72;
  const completedBinoLessons = binoBook?.completedLessons || 0;
  const binoProgressPercent = binoBook?.progressPercentage || 0;
  const featuredChapters = binoBook?.chapters?.slice(0, 6) || [];

  const reflexCompletedCount = reflexStats?.totalMastered || 0;
  const reflexPercent = reflexStats?.overallPercent || 0;
  const vocabPercent = Math.min(100, Math.round((vocabMasteredCount / 1760) * 100));
  const maisonMasteryScore = Math.round(
    binoProgressPercent * 0.45 + reflexPercent * 0.35 + vocabPercent * 0.20
  );

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.fullName || 'bạn';
    if (hour >= 5 && hour < 12) {
      return {
        prefix: 'Bonjour',
        title: `Chào buổi sáng, ${name}`,
        subtitle: 'Khoảnh khắc hoàn hảo để đánh thức phản xạ và mài sắc ngữ điệu bản ngữ.'
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        prefix: 'Bon après-midi',
        title: `Chào buổi chiều, ${name}`,
        subtitle: 'Duy trì phong độ thanh lịch cùng 15 phút rèn phản xạ câu không cần dịch ngầm.'
      };
    } else {
      return {
        prefix: 'Bonsoir',
        title: `Chào buổi tối, ${name}`,
        subtitle: 'Thư thái ngấm âm thanh đời thực và kích hoạt lá chắn bảo vệ trí nhớ.'
      };
    }
  }, [user?.fullName]);

  // Tìm bài học tiếp theo chưa hoàn thành để học viên bấm 1 chạm là vào học tiếp
  const nextDialogue = (() => {
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
  })();

  // Thông số vòng tròn SVG tiến độ phong cách Apple Activity Ring
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (Math.max(4, binoProgressPercent) / 100) * ringCircumference;

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 max-w-6xl mx-auto pb-10"
    >
      <SeoMeta
        title="Trang Chủ Học Tập"
        description="Luyện phản xạ giao tiếp tiếng Anh thực chiến, 3000 từ vựng Oxford FSRS và rèn luyện kỹ năng nói tiếng Anh tự nhiên mỗi ngày cùng VBaceEnglish."
      />

      {loading && <PageLoader />}
      
      {/* ===================================================================== */}
      {/* 1. HAUTE COUTURE HERO PAVILION — APPLE x DIOR x HERMÈS AESTHETIC      */}
      {/* ===================================================================== */}
      <motion.section
        variants={sectionRevealVariants}
        className="relative overflow-hidden rounded-[32px] sm:rounded-[38px] bg-gradient-to-br from-white via-[#fafafc] to-slate-50 dark:from-[#090d16] dark:via-[#0c101b] dark:to-[#080b12] border border-slate-200/80 dark:border-white/[0.08] p-7 sm:p-10 lg:p-12 shadow-[0_12px_45px_rgb(0,0,0,0.035)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] mb-8"
      >
        {/* Ambient Couture Breathing Light Orbs (Champagne & Sapphire Silk) */}
        <motion.div
          animate={{
            x: [0, 26, -14, 0],
            y: [0, -20, 14, 0],
            scale: [1, 1.09, 0.95, 1]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-32 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-[#0071e3]/[0.08] via-sky-400/[0.06] to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -22, 18, 0],
            y: [0, 18, -16, 0],
            scale: [1, 0.93, 1.07, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -bottom-36 left-1/4 w-88 h-88 rounded-full bg-gradient-to-tr from-sky-500/[0.05] via-blue-400/[0.05] to-transparent blur-3xl"
        />

        {/* Delicate hairline top specular rim highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/30 dark:via-[#0071e3]/20 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          
          {/* Left Column: Haute Couture Typography & Tactile Pill Buttons */}
          <div className="max-w-2xl space-y-6">
            
            {/* Atelier Monogram Ribbon */}
            <div className="flex flex-wrap items-center gap-2.5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/90 dark:border-white/10 shadow-2xs backdrop-blur-md"
              >
                <span className="text-[#0071e3] font-serif">✦</span>
                <span className="tracking-[0.2em] text-[11px] uppercase font-bold text-[#0071e3] dark:text-sky-400">
                  ENGLISH
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Édition 2026</span>
              </motion.div>

              {/* Luxury Streak Badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 text-[#0071e3] dark:text-sky-400 text-xs font-bold border border-blue-500/25 shadow-2xs backdrop-blur-md"
              >
                <Flame size={13} className="fill-current text-[#0071e3] animate-pulse" />
                <span>
                  <AnimatedCounter value={profile?.currentStreak ?? stats?.currentStreakDays ?? 0} suffix=" ngày chuỗi" />
                </span>
                <span className="text-blue-400/60 dark:text-blue-500/60">•</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {profile?.hasStudiedToday ? 'Đã thắp lửa 🔥' : 'Cần giữ lửa'}
                </span>
              </motion.div>

              {/* Luxury XP Level Badge */}
              <button
                onClick={() => navigate('/leaderboard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 text-xs font-bold border border-sky-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs backdrop-blur-md"
                title="Bấm để xem Bảng Xếp Hạng & Thành Tích"
              >
                <Trophy size={13} className="text-[#0071e3]" />
                <span>Cấp {profile?.currentLevel ?? 1}</span>
                <span className="opacity-50">•</span>
                <span><AnimatedCounter value={profile?.totalXP ?? 0} suffix=" XP" /></span>
                <ChevronRight size={12} className="opacity-70" />
              </button>
            </div>

            {/* Haute Couture Headline with Sapphire Blue / Crisp White Contrast */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0071e3] dark:text-sky-400">
                <span>{timeGreeting.prefix}</span>
                <span>•</span>
                <span>Phản Xạ Tiếng Anh Đời Thực</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-[-0.035em] leading-[1.14]">
                <span className="text-slate-900 dark:text-white">
                  {timeGreeting.title},
                </span>{' '}
                <span className="bg-gradient-to-r from-[#0071e3] to-sky-500 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent font-medium">
                  bật phản xạ tự nhiên không cần dịch ngầm.
                </span>
              </h1>

              <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-xl">
                {timeGreeting.subtitle} Giáo trình <strong className="text-slate-900 dark:text-slate-200 font-semibold">&ldquo;Giao Tiếp Thực Chiến: Phản Xạ Tức Thì&rdquo;</strong> kết hợp cùng 50 Chủ đề phản xạ 3 giây và 3000 từ vựng FSRS.
              </p>
            </div>

            {/* Apple Solid Tactile Buttons with Specular Bevel (#0071e3 Sapphire Theme) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              
              {/* Primary Action Button (#0071e3 Sapphire Blue) */}
              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.965 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                onMouseEnter={() => binoApi.prefetchBookOverview()}
                onClick={() => navigate('/communication')}
                className="relative px-7 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-full shadow-[0_8px_24px_rgba(0,113,227,0.32)] flex items-center gap-2.5 transition-all text-sm cursor-pointer group overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
                <Play size={15} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" />
                <span>Vào luyện Giao Tiếp Thực Chiến</span>
              </motion.button>

              {/* Secondary Blue Pill Button */}
              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.965 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                onClick={() => navigate('/reflex-50')}
                className="px-5 py-3.5 bg-blue-500/10 hover:bg-blue-500/20 text-[#0071e3] dark:text-sky-400 border border-blue-500/30 font-bold rounded-full flex items-center gap-2 transition-all text-sm cursor-pointer shadow-2xs"
              >
                <Zap size={15} className="text-[#0071e3]" />
                <span>Phản Xạ 50 Chủ Đề</span>
              </motion.button>

              {/* Apple Frosted Glass: Audio Playlist 24/7 */}
              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.965 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                onClick={() => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-white/10 font-medium rounded-full flex items-center gap-2 transition-all text-sm cursor-pointer"
              >
                {isGlobalPlaying ? (
                  <span className="inline-flex items-end gap-0.5 h-3.5">
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                  </span>
                ) : (
                  <Headphones size={15} />
                )}
                <span>Nghe thụ động Playlist</span>
              </motion.button>

              {/* Guide Button */}
              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.965 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                onClick={() => setIsLearningGuideOpen(true)}
                className="px-4 py-3.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lightbulb size={15} className="text-[#0071e3] shrink-0" />
                <span>Lộ trình học 💡</span>
              </motion.button>

            </div>
          </div>

          {/* Right Column: Luxury Triple Activity Ring Pavillon */}
          <LuxurySpotlightCard
            onClick={() => {
              if (nextDialogue?.id) {
                navigate(`/communication/dialogue/${nextDialogue.id}`);
              } else {
                navigate('/communication');
              }
            }}
            spotlightColor="rgba(0, 113, 227, 0.08)"
            borderColor="rgba(0, 113, 227, 0.22)"
            className="w-full lg:w-[380px] p-6 sm:p-7 shrink-0 space-y-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#0071e3] dark:text-sky-400 tracking-[0.2em] uppercase">
                    HAUTE HORLOGERIE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Tiến Độ 3 Trụ Cột
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hội thoại • Phản xạ câu • Từ vựng FSRS
                </p>
              </div>

              {/* Apple Watch & Hermès Concentric Triple Activity Ring */}
              <LuxuryTripleActivityRing
                ring1={{ label: 'Hội Thoại', percent: binoProgressPercent, color: '#0071E3' }}
                ring2={{ label: 'Phản Xạ', percent: reflexPercent, color: '#38BDF8' }}
                ring3={{ label: 'Từ Vựng', percent: vocabPercent, color: '#10B981' }}
                overallScore={maisonMasteryScore}
                size={120}
              />
            </div>

            {/* 3 Micro-Legends with Pure Luxury Alignment */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 text-[11px]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#0071E3]" />
                  <span>Hội thoại</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {completedBinoLessons}/{totalBinoLessons}
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <span>Phản xạ 50</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {reflexCompletedCount}/1500
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Từ FSRS</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {vocabMasteredCount}/1760
                </p>
              </div>
            </div>

            {/* Next Lesson Jump Bar */}
            {nextDialogue ? (
              <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400 animate-pulse" />
                    <p className="text-[10px] font-bold text-[#0071e3] dark:text-sky-400 uppercase tracking-widest">
                      Bài học tiếp theo • Chương {nextDialogue.chapterNumber}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {nextDialogue.title}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform"
                >
                  <ArrowRight size={15} />
                </motion.div>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#0071e3] dark:text-sky-400">
                <span>Khám phá toàn bộ 12 chương</span>
                <ArrowRight size={14} />
              </div>
            )}
          </LuxurySpotlightCard>

        </div>
      </motion.section>

      {/* GAMIFICATION: DAILY QUESTS */}
      <motion.section variants={sectionRevealVariants}>
        <DailyQuestsPanel />
      </motion.section>

      {/* ===================================================================== */}
      {/* F1. RADAR NĂNG LỰC THỰC TẾ — "BẠN HIỂU BAO NHIÊU % THẾ GIỚI?"         */}
      {/* ===================================================================== */}
      <motion.section id="radar-section" variants={sectionRevealVariants}>
        <CompetenceRadarCard
          wordsMastered={vocabMasteredCount}
          reflexMastered={reflexStats?.totalMastered || 0}
          binoLessonsCompleted={completedBinoLessons}
          toeicCompleted={stats?.totalConfidentQuestions || stats?.totalCompletedQuestions || 0}
        />
      </motion.section>

      {/* ===================================================================== */}
      {/* F5. LÁ CHẮN TRÍ NHỚ — FSRS MEMORY HEALTH SHIELD                      */}
      {/* ===================================================================== */}
      <motion.section id="shield-section" variants={sectionRevealVariants}>
        <FsrsMemoryShieldCard />
      </motion.section>

      {/* ===================================================================== */}
      {/* 1.5. LỘ TRÌNH KẾT HỢP 3 CHƯƠNG TRÌNH: TAM GIÁC VÀNG PHẢN XẠ           */}
      {/* ===================================================================== */}
      <motion.section variants={sectionRevealVariants}>
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 border border-blue-500/20 shadow-xl shadow-blue-950/20">
          {/* Subtle glow orb */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-[#0071e3]/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-bold border border-blue-400/30">
                <Sparkles size={13} className="text-sky-300" />
                <span>Phương Pháp Chuẩn Sư Phạm 45–60 Phút/Ngày</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                Bị rối giữa Từ Vựng, Phản Xạ 50 & Giao Tiếp? Hãy học theo <span className="bg-gradient-to-r from-sky-300 via-blue-300 to-sky-200 bg-clip-text text-transparent">Tam Giác Vàng Phản Xạ</span>!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Đừng học rời rạc từng phần! Hãy phối hợp theo mô hình 3 Tầng tuần hoàn: <strong>15&apos; Nạp từ vựng Oxford (FSRS)</strong> → <strong>20&apos; Rèn phản xạ câu 3 giây (Reflex 50)</strong> → <strong>25&apos; Nhập vai thực tế & đổi ruột câu (Giao Tiếp 72 Bài)</strong> để giao tiếp tự nhiên không cần dịch ngầm.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsLearningGuideOpen(true)}
                className="px-6 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
              >
                <Lightbulb size={16} className="text-white fill-current" />
                <span>Xem Hướng Dẫn & Lộ Trình Học 💡</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MULTILINGUAL CONTENT MODULES SYSTEM (M4) */}
      <motion.section variants={sectionRevealVariants}>
        <ContentModuleExplorer />
      </motion.section>

      {/* ===================================================================== */}
      {/* 2. LIVE INTERACTIVE WIDGET + BENTO PILLARS — SINH ĐỘNG & MƯỢT MÀ      */}
      {/* ===================================================================== */}
      <motion.section variants={sectionRevealVariants} className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
              Phương pháp phản xạ VBace Flow
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              Trải nghiệm học tiếng Anh sống động
            </h2>
          </div>

          <button
            onClick={() => navigate('/communication')}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0071e3] dark:text-sky-400 hover:underline self-start sm:self-auto cursor-pointer group"
          >
            <span>Khám phá trọn bộ 12 chương</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Live Interactive Substitution Drilling Showcase Bar (Auto-animating & Clickable) */}
        <LiveSubstitutionDrillShowcase onNavigateBino={() => navigate('/communication')} />

        {/* 4 Apple Bento Cards with Staggered Spring & Luxury Sheen */}
        <motion.div
          variants={cardGridVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              icon: MessageSquare,
              meta: '12 chương • 72 bài',
              title: 'Hội thoại đời thực',
              desc: 'Tình huống giao tiếp tự nhiên khi du học, đi làm và sinh hoạt hàng ngày.',
              spotlightColor: 'rgba(0, 113, 227, 0.12)',
              borderColor: 'rgba(0, 113, 227, 0.25)',
              iconBg: 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/15 dark:text-sky-400 group-hover:bg-[#0071e3] group-hover:text-white',
              onClick: () => navigate('/communication')
            },
            {
              icon: Sparkles,
              meta: 'Substitution Drilling',
              title: 'Vận dụng mẫu câu',
              desc: 'Thay thế cụm từ linh hoạt ngay sau mỗi câu thoại để nói theo ý mình.',
              spotlightColor: 'rgba(0, 113, 227, 0.12)',
              borderColor: 'rgba(0, 113, 227, 0.25)',
              iconBg: 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/15 dark:text-sky-400 group-hover:bg-[#0071e3] group-hover:text-white',
              onClick: () => navigate('/communication')
            },
            {
              icon: Headphones,
              meta: 'Hỗ trợ khóa màn hình',
              title: 'Nghe thụ động 24/7',
              desc: 'Chuyển trang hoặc tắt màn hình điện thoại vẫn phát âm thanh mượt mà.',
              spotlightColor: 'rgba(139, 92, 246, 0.12)',
              borderColor: 'rgba(139, 92, 246, 0.25)',
              iconBg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white',
              onClick: () => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })
            },
            {
              icon: BookMarked,
              meta: '427 từ khóa • Ebook',
              title: 'Flashcard & Sách gốc',
              desc: 'Lưu nhanh từ vựng một chạm và đọc trọn vẹn mục mở rộng cuối chương.',
              spotlightColor: 'rgba(16, 185, 129, 0.12)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
              onClick: () => navigate('/communication/reader')
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <LuxurySpotlightCard
                key={idx}
                spotlightColor={item.spotlightColor}
                borderColor={item.borderColor}
                onClick={item.onClick}
                className="p-6 rounded-[28px] cursor-pointer"
                contentClassName="flex flex-col justify-between h-full gap-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.4 }}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-300 ${item.iconBg}`}
                    >
                      <Icon size={19} />
                    </motion.div>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {item.meta}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-medium text-[#0071e3] dark:text-sky-400">
                  <span>Khám phá</span>
                  <ChevronRight size={14} className="ml-0.5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </LuxurySpotlightCard>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ===================================================================== */}
      {/* 3. DANH SÁCH CHƯƠNG HỌC TIÊU BIỂU — HIỆU ỨNG NỔI MƯỢT MÀ             */}
      {/* ===================================================================== */}
      {featuredChapters.length > 0 && (
        <motion.section variants={sectionRevealVariants} className="space-y-5">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Lộ trình 12 chương
              </p>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                Chọn nhanh chương học giao tiếp
              </h2>
            </div>

            <button
              onClick={() => navigate('/communication')}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0071e3] dark:text-sky-400 hover:underline cursor-pointer group"
            >
              <span>Tất cả 12 chương</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <motion.div
            variants={cardGridVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {featuredChapters.map((chap) => {
              const firstDialogueId = chap.dialogues?.[0]?.id;
              const chapPercent = chap.totalLessons > 0
                ? Math.round((chap.completedLessons / chap.totalLessons) * 100)
                : 0;

              return (
                <motion.div
                  key={chap.id}
                  variants={cardItemVariants}
                  whileHover={{ y: -5, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  onMouseEnter={() => {
                    if (firstDialogueId) binoApi.prefetchDialogue(firstDialogueId);
                  }}
                  onClick={() => {
                    if (firstDialogueId) {
                      navigate(`/communication/dialogue/${firstDialogueId}`);
                    } else {
                      navigate('/communication');
                    }
                  }}
                  className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 hover:border-[#0071e3]/40 dark:hover:border-sky-400/40 cursor-pointer shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgb(0,113,227,0.06)] flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-xs font-semibold text-[#0071e3] dark:text-sky-400">
                        Chương {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {chap.completedLessons}/{chap.totalLessons} bài
                      </span>
                    </div>

                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors line-clamp-1 pt-0.5">
                      {chap.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-vietsub">
                      {chap.titleVi || chap.description}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(4, chapPercent)}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="bg-[#0071e3] dark:bg-sky-400 h-full rounded-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {chap.totalLessons} hội thoại & mở rộng
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 flex items-center gap-0.5 transition-colors">
                        <span>Vào học</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 3.5. PHẢN XẠ NÓI - VIẾT 50 CHỦ ĐỀ (1.500 CÂU THÔNG DỤNG THỰC CHIẾN)   */}
      {/* ===================================================================== */}
      {(() => {
        const activeUnitObj =
          reflex50Meta.units.find((u) => u.unitNumber === reflexLastStudiedUnit) || reflex50Meta.units[0];

        return (
          <motion.section
            variants={sectionRevealVariants}
            className="p-7 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_16px_rgb(0,0,0,0.03)] space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] dark:text-sky-400 text-xs font-semibold">
                  <Zap size={13} />
                  <span>Tính năng mới • 50 Chủ Đề Giao Tiếp • 1.500 Câu Nói & Viết</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Phản Xạ Nói – Viết 50 Chủ Đề (1.500 Câu Thông Dụng)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Luyện phản xạ dịch nói trong <strong>3 giây</strong>, làm bài tập viết chấm điểm từng từ và học <strong>3.400+ cụm từ gợi ý & Collocations bản xứ</strong> chia theo 5 nhóm chủ đề từ Cơ bản đến Nâng cao.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onMouseEnter={() => loadReflex50FullData()}
                  onClick={() => navigate(`/reflex-50/unit/${activeUnitObj.unitNumber}`)}
                  className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span>Học Unit {activeUnitObj.unitNumber}: {activeUnitObj.titleEn}</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  onMouseEnter={() => loadReflex50FullData()}
                  onClick={() => navigate('/reflex-50')}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Xem đủ 50 Chủ đề ({reflexStats.totalMastered}/1500 câu)
                </button>
              </div>
            </div>

            {/* 5 Category Cards Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {reflex50Meta.categories.map((cat) => (
                <div
                  key={cat.id}
                  onMouseEnter={() => loadReflex50FullData()}
                  onClick={() => navigate(`/reflex-50/unit/${cat.unitRange[0]}`)}
                  className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-[#0071e3]/50 transition-all cursor-pointer group flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#0071e3] dark:text-sky-400">
                      <span>UNIT {cat.unitRange[0]} – {cat.unitRange[1]}</span>
                      <span>300 câu</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-[#0071e3] transition-colors">
                      {cat.titleVi}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {cat.description}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#0071e3] flex items-center gap-1 pt-1">
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
      {/* 3.5. CHƯƠNG TRÌNH TRỌNG TÂM: 3000 TỪ VỰNG TIẾNG ANH THEO 60 CHỦ ĐỀ  */}
      {/* ===================================================================== */}
      <VocabShowcaseSection sectionRevealVariants={sectionRevealVariants} />

      {/* ===================================================================== */}
      {/* 4. KHU VỰC BỔ TRỢ: LUYỆN ĐỀ TOEIC & TIỆN ÍCH HỌC TẬP                 */}
      {/* ===================================================================== */}
      <motion.section
        variants={sectionRevealVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        
        {/* Left 2 Columns: Clean TOEIC Practice Card */}
        <div className="lg:col-span-2 p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_14px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Kỹ năng bổ trợ
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Luyện đề TOEIC chuẩn ETS (Part 1 – 7)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ôn luyện cấu trúc ngữ pháp, từ vựng và phản xạ làm đề thi thực chiến.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onMouseEnter={() => toeicApi.prefetchAllTests()}
              onClick={() => navigate('/toeic')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-[#0071e3] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0071e3] text-slate-800 dark:text-slate-200 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
            >
              <span>Mở phòng luyện đề</span>
              <ChevronRight size={14} />
            </motion.button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentTests.map((test) => (
              <motion.div
                key={test.toeicTestId}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                onClick={() => navigate(`/toeic?test=${test.testId}`)}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-3 -mx-3 rounded-2xl transition-colors group"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-[#0071e3] dark:text-sky-400">
                      {test.testId}
                    </span>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                      {test.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Đã thuộc: <span className="text-slate-600 dark:text-slate-300 font-medium">{test.confidentQuestions}/{test.totalQuestions} câu</span></span>
                    <span>•</span>
                    <span>Hoàn thành: <span className="text-slate-600 dark:text-slate-300 font-medium">{test.percentCompleted}%</span></span>
                  </div>
                </div>

                <span className="text-xs font-medium text-slate-500 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 flex items-center gap-1 self-end sm:self-center transition-colors">
                  <span>Làm tiếp</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.div>
            ))}

            {recentTests.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có lịch sử làm đề. Bấm <span className="text-slate-600 dark:text-slate-300 font-medium">&ldquo;Mở phòng luyện đề&rdquo;</span> khi bạn muốn luyện thêm TOEIC.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Clean Apple Settings-Style Quick Links with Hover Motion */}
        <div className="p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_14px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tiện ích nhanh
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
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
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onClick={tool.onClick}
                  className="py-3.5 flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-[#0071e3] group-hover:text-white flex items-center justify-center transition-colors duration-200">
                      <ToolIcon size={17} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                </motion.div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Trình nghe thụ động VBace luôn duy trì ở góc màn hình khi chuyển trang và hỗ trợ phát nền khi khóa màn hình điện thoại.
          </div>
        </div>

      </motion.section>

      {/* Master Learning Guide Modal */}
      <MasterLearningGuideModal
        isOpen={isLearningGuideOpen}
        onClose={() => setIsLearningGuideOpen(false)}
      />

      {/* Luxury Haute Couture Floating Quick-Dock (Apple / Hermès Quick Capsule) */}
      <LuxuryQuickDock
        onOpenPlaylist={() => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })}
        isPlaylistPlaying={isGlobalPlaying}
      />

    </motion.div>
  );
}
