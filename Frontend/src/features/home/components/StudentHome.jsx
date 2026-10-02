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
  CheckCircle2
} from 'lucide-react';
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
  const shouldShowRadar = activeFilter === 'analytics' || isRadarOpen;

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 sm:space-y-8 w-full min-w-0 max-w-6xl mx-auto pb-24 md:pb-16"
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
              className="duo-card p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-50/95 via-fuchsia-50/70 to-indigo-50/85 dark:from-[#1a0c30] dark:via-[#150a26] dark:to-[#0c0517] border-2 border-purple-200 dark:border-purple-800/80 border-b-6 border-b-[#8b5cf6] dark:border-b-[#6d28d9] space-y-4 sm:space-y-6 w-full min-w-0 max-w-full shadow-md relative overflow-hidden"
            >
              {/* Soft Ambient Glows & Top Gloss Shimmer */}
              <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#8b5cf6]/20 to-fuchsia-400/15 rounded-full blur-2xl" />
              <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-indigo-500/15 to-purple-400/15 rounded-full blur-2xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#8b5cf6]/60 to-transparent" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
                <div className="space-y-2 sm:space-y-2.5 max-w-2xl min-w-0 flex-1">
                  {/* Duolingo Ribbon Pills */}
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <div className="duo-pill duo-pill-purple text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                      <Zap size={13} className="text-[#8b5cf6] dark:text-[#c084fc] shrink-0" />
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
                      <span className="text-[#7c3aed] dark:text-[#c084fc]">
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
                    className="duo-btn duo-btn-purple duo-btn-sm sm:duo-btn-md font-black shadow-md w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                  >
                    <Play size={15} fill="currentColor" className="shrink-0" />
                    <span className="truncate">Học Unit #{activeUnitObj.unitNumber}</span>
                    <ArrowRight size={15} className="shrink-0 hidden xs:inline" />
                  </button>
                  <button
                    onMouseEnter={() => loadReflex50FullData()}
                    onClick={() => navigate('/reflex-50')}
                    className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black text-xs sm:text-sm w-full sm:w-auto text-[#7c3aed] dark:text-[#c084fc] cursor-pointer shadow-xs whitespace-nowrap"
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
                    className="w-[240px] sm:w-[260px] lg:w-auto shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-purple-200/80 dark:border-purple-800/60 border-b-4 border-b-purple-400 dark:border-b-purple-900 hover:scale-[1.03] transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-black text-[#7c3aed] dark:text-[#c084fc]">
                        <span>
                          UNIT {cat.unitRange[0]} – {cat.unitRange[1]}
                        </span>
                        <span className="text-slate-400 font-extrabold">300 câu</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 group-hover:text-[#7c3aed] dark:group-hover:text-[#c084fc] transition-colors line-clamp-1">
                        {cat.titleVi}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium">
                        {cat.description}
                      </p>
                    </div>
                    <div className="text-[11px] font-black text-[#7c3aed] dark:text-[#c084fc] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
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
