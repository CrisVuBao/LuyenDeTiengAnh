import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, ArrowRight, Flame, 
  TrendingUp, Play, Headphones, MessageSquare, 
  Layers, BookMarked, ChevronRight, ChevronDown, Volume2, RefreshCw, Zap, Trophy, Lightbulb, Compass, CheckCircle2, FileCheck2
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
import DailyQuestsPanel from '../../gamification/components/DailyQuestsPanel';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import SeoMeta from '../../../components/SeoMeta';
import LuxurySpotlightCard from '../../../components/luxury/LuxurySpotlightCard';
import LuxuryQuickDock from '../../../components/luxury/LuxuryQuickDock';
import LuxuryAppleSlider from '../../../components/luxury/LuxuryAppleSlider';
import LuxuryHeroPavilion from '../../../components/luxury/LuxuryHeroPavilion';

// Progressive Below-the-Fold Lazy Chunks (Zero blocking of initial Home render)
const CompetenceRadarCard = lazy(() => import('../../progress/components/CompetenceRadarCard'));
const FsrsMemoryShieldCard = lazy(() => import('../../vocab/components/FsrsMemoryShieldCard'));
const LuxuryChapterCarousel = lazy(() => import('../../../components/luxury/LuxuryChapterCarousel'));
const ContentModuleExplorer = lazy(() => import('../../../components/ContentModuleExplorer'));
const VocabShowcaseSection = lazy(() => import('./VocabShowcaseSection'));
const MasterLearningGuideModal = lazy(() => import('../../../components/MasterLearningGuideModal'));

function SectionProgressiveFallback({ height = 'h-48' }) {
  return (
    <div className={`w-full ${height} rounded-[28px] bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/70 animate-pulse`} />
  );
}

// Apple-style Progressive Stagger Variants (120FPS GPU-accelerated transform & opacity)
const pageContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.01
    }
  }
};

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1]
    },
    transitionEnd: {
      transform: 'none'
    }
  }
};

const cardGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
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
  const [isLearningGuideOpen, setIsLearningGuideOpen] = useState(false);

  // Apple Interactive Workspace Filter & Collapsible Drawers
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reflex' | 'analytics' | 'vocab'
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(true);

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

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 sm:space-y-10 max-w-6xl mx-auto pb-24 md:pb-16"
    >
      <SeoMeta
        title="Trang Chủ Học Tập"
        description="Luyện phản xạ giao tiếp tiếng Anh thực chiến, 3000 từ vựng Oxford FSRS và rèn luyện kỹ năng nói tiếng Anh tự nhiên mỗi ngày cùng VBaceEnglish."
      />

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
      {/* 1.1. NHIỆM VỤ HÀNG NGÀY — ĐẶT NGAY DƯỚI HERO ĐỂ THAO TÁC 1 CHẠM       */}
      {/* ===================================================================== */}
      <motion.section variants={sectionRevealVariants}>
        <DailyQuestsPanel />
      </motion.section>

      {/* ===================================================================== */}
      {/* 1.2. APPLE VISIONOS SEGMENTED FOCUS FILTER BAR                        */}
      {/* ===================================================================== */}
      <motion.div
        variants={sectionRevealVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 px-1"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Compass size={15} className="text-[#0071e3] dark:text-sky-400" />
          <span>Chế độ hiển thị không gian học tập:</span>
        </div>

        <div
          className="flex items-center gap-1 p-1 sm:p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/10 shadow-2xs overflow-x-auto max-w-full no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {[
            { id: 'all', label: '✦ Tất cả trải nghiệm' },
            { id: 'reflex', label: 'Giao Tiếp & Phản Xạ' },
            { id: 'analytics', label: 'Radar & Lá Chắn FSRS' },
            { id: 'vocab', label: '3000 Từ & TOEIC' }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="homeWorkspaceFilterPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-[#0071e3] shadow-[0_4px_14px_rgba(0,113,227,0.3)]"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ===================================================================== */}
      {/* 1.5. APPLE FLAGSHIP INTERACTIVE CAROUSEL SLIDER                       */}
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

      {/* ===================================================================== */}
      {/* F1 & F5. COLLAPSIBLE DEEP ANALYTICS SUITE (RADAR + FSRS SHIELD)       */}
      {/* ===================================================================== */}
      {showSection('analytics') && (
        <motion.section variants={sectionRevealVariants} className="space-y-4">
          {/* Apple Accordion Toggle Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0071e3] dark:text-sky-400">
                CHỈ SỐ NĂNG LỰC & TRÍ NHỚ DÀI HẠN
              </p>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Radar Bao Phủ Thế Giới & Lá Chắn FSRS
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsAnalyticsExpanded((prev) => !prev)}
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-[#0071e3] dark:text-sky-400 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>{isAnalyticsExpanded ? 'Thu gọn phân tích' : 'Mở rộng phân tích'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${isAnalyticsExpanded ? 'rotate-180' : ''}`}
              />
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {isAnalyticsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="space-y-8 overflow-hidden"
              >
                <div id="radar-section">
                  <Suspense fallback={<SectionProgressiveFallback height="h-64" />}>
                    <CompetenceRadarCard
                      wordsMastered={vocabMasteredCount}
                      reflexMastered={reflexStats?.totalMastered || 0}
                      binoLessonsCompleted={completedBinoLessons}
                      toeicCompleted={stats?.totalConfidentQuestions || stats?.totalCompletedQuestions || 0}
                    />
                  </Suspense>
                </div>

                <div id="shield-section">
                  <Suspense fallback={<SectionProgressiveFallback height="h-32" />}>
                    <FsrsMemoryShieldCard />
                  </Suspense>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 2. LIVE INTERACTIVE WIDGET + BENTO PILLARS — SINH ĐỘNG & MƯỢT MÀ      */}
      {/* ===================================================================== */}
      {showSection('reflex') && (
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

          {/* Live Interactive Substitution Drilling Showcase Bar */}
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
                spotlightColor: 'rgba(14, 165, 233, 0.12)',
                borderColor: 'rgba(14, 165, 233, 0.25)',
                iconBg: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 group-hover:bg-[#0071e3] group-hover:text-white',
                onClick: () => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })
              },
              {
                icon: BookMarked,
                meta: '427 từ khóa • Ebook',
                title: 'Flashcard & Sách gốc',
                desc: 'Lưu nhanh từ vựng một chạm và đọc trọn vẹn mục mở rộng cuối chương.',
                spotlightColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.25)',
                iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
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
      )}

      {/* ===================================================================== */}
      {/* 3. APPLE STORE CHAPTER CAROUSEL SLIDER & BENTO GRID SWITCHER          */}
      {/* ===================================================================== */}
      {showSection('reflex') && allChapters.length > 0 && (
        <motion.section variants={sectionRevealVariants}>
          <Suspense fallback={<SectionProgressiveFallback height="h-64" />}>
            <LuxuryChapterCarousel
              chapters={allChapters}
              onSelectDialogue={handleSelectDialogue}
              onNavigateAll={() => navigate('/communication')}
              onPlayChapter={handlePlayChapter}
            />
          </Suspense>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 3.5. PHẢN XẠ NÓI - VIẾT 50 CHỦ ĐỀ (1.500 CÂU THÔNG DỤNG THỰC CHIẾN)   */}
      {/* ===================================================================== */}
      {showSection('reflex') && (() => {
        const activeUnitObj =
          reflex50Meta.units.find((u) => u.unitNumber === reflexLastStudiedUnit) || reflex50Meta.units[0];

        return (
          <motion.section
            variants={sectionRevealVariants}
            className="relative overflow-hidden p-6 sm:p-8 rounded-[32px] bg-white dark:bg-slate-900/95 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_6px_28px_rgb(0,0,0,0.03)] space-y-6"
          >
            {/* Top Specular Hairline */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/30 to-transparent" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0071e3] dark:text-sky-400 text-xs font-bold border border-[#0071e3]/20">
                  <Zap size={13} />
                  <span>50 CHỦ ĐỀ GIAO TIẾP • 1.500 CÂU NÓI & VIẾT PHẢN XẠ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Phản Xạ Nói – Viết 50 Chủ Đề (1.500 Câu Thông Dụng)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Luyện phản xạ dịch nói trong <strong>3 giây</strong>, làm bài tập viết chấm điểm từng từ và học <strong>3.400+ cụm từ gợi ý & Collocations bản xứ</strong> chia theo 5 nhóm chủ đề từ Cơ bản đến Nâng cao.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={() => loadReflex50FullData()}
                  onClick={() => navigate(`/reflex-50/unit/${activeUnitObj.unitNumber}`)}
                  className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_6px_18px_rgba(0,113,227,0.26)]"
                >
                  <span>Học Unit {activeUnitObj.unitNumber}: {activeUnitObj.titleEn}</span>
                  <ArrowRight size={15} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={() => loadReflex50FullData()}
                  onClick={() => navigate('/reflex-50')}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Xem đủ 50 Chủ đề ({reflexStats.totalMastered}/1500 câu)
                </motion.button>
              </div>
            </div>

            {/* 5 Category Cards Preview (Horizontal Swipe Shelf on Mobile, 5-Col Grid on Desktop) */}
            <div
              className="flex lg:grid lg:grid-cols-5 gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 lg:pb-0 no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reflex50Meta.categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onMouseEnter={() => loadReflex50FullData()}
                  onClick={() => navigate(`/reflex-50/unit/${cat.unitRange[0]}`)}
                  className="w-[240px] sm:w-[260px] lg:w-auto shrink-0 snap-start p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-[#0071e3]/50 hover:shadow-[0_10px_24px_rgba(0,113,227,0.08)] transition-all cursor-pointer group flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#0071e3] dark:text-sky-400">
                      <span>UNIT {cat.unitRange[0]} – {cat.unitRange[1]}</span>
                      <span>300 câu</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 transition-colors">
                      {cat.titleVi}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {cat.description}
                    </p>
                  </div>
                  <div className="text-[11px] font-bold text-[#0071e3] dark:text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 pt-1">
                    <span>Vào luyện phản xạ</span>
                    <ChevronRight size={13} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })()}

      {/* MULTILINGUAL CONTENT MODULES SYSTEM (M4) */}
      {showSection('all') && (
        <motion.section variants={sectionRevealVariants}>
          <Suspense fallback={<SectionProgressiveFallback height="h-44" />}>
            <ContentModuleExplorer />
          </Suspense>
        </motion.section>
      )}

      {/* ===================================================================== */}
      {/* 3.8. CHƯƠNG TRÌNH TRỌNG TÂM: 3000 TỪ VỰNG TIẾNG ANH THEO 60 CHỦ ĐỀ  */}
      {/* ===================================================================== */}
      {showSection('vocab') && (
        <Suspense fallback={<SectionProgressiveFallback height="h-64" />}>
          <VocabShowcaseSection sectionRevealVariants={sectionRevealVariants} />
        </Suspense>
      )}

      {/* ===================================================================== */}
      {/* 4. KHU VỰC BỔ TRỢ: LUYỆN ĐỀ TOEIC STUDIO & TIỆN ÍCH HỌC TẬP          */}
      {/* ===================================================================== */}
      {showSection('vocab') && (
        <motion.section
          variants={sectionRevealVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          
          {/* Left 2 Columns: Apple Flagship ETS TOEIC Studio Card */}
          <div className="relative overflow-hidden lg:col-span-2 p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_6px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/35 to-transparent" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/15 text-[#0071e3] dark:text-sky-400 text-[11px] font-extrabold border border-[#0071e3]/20">
                  <FileCheck2 size={13} />
                  <span>ETS TOEIC® STUDIO • PART 1 – 7</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Phòng Luyện Đề TOEIC Thực Chiến Chuẩn ETS
                </h3>
                {/* <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                  Giải đề có lời giải chi tiết, dấu hiệu nhận biết 3 giây, chế độ đọc ngấm (Chanting), Radar dẫn chứng Part 7 và trợ lý AI Tutor giải đáp từng câu.
                </p> */}

                {/* Quick Feature Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                    🎧 Listening Part 1 – 4
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                    📖 Reading Part 5 – 7
                  </span>
                  {/* <span className="px-2.5 py-1 rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/20">
                    ✨ AI Tutor & Radar Dẫn Chứng
                  </span> */}
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
                      <span>Đã nắm chắc: <strong className="text-slate-800 dark:text-slate-200">{test.confidentQuestions}/{test.totalQuestions} câu</strong></span>
                      <span>•</span>
                      <span>Tiến độ: <strong className="text-[#0071e3] dark:text-sky-400">{test.percentCompleted}%</strong></span>
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
                    Bấm vào đây hoặc nút <strong className="text-[#0071e3] dark:text-sky-400">&ldquo;Vào phòng luyện đề&rdquo;</strong> để bắt đầu giải đề kèm lời giải chi tiết từng câu.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Column: Clean Apple Settings-Style Quick Links */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_6px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
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
                        <p className="text-xs text-slate-400">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-[#0071e3] dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trình nghe thụ động VBace luôn duy trì ở góc màn hình khi chuyển trang và hỗ trợ phát nền khi khóa màn hình điện thoại.
            </div>
          </div>

        </motion.section>
      )}

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
        onOpenPlaylist={() => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })}
        isPlaylistPlaying={isGlobalPlaying}
      />

    </motion.div>
  );
}
