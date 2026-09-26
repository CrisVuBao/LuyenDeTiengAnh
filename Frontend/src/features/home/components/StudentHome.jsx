import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, ArrowRight, Flame, CheckCircle2, 
  TrendingUp, Play, Headphones, MessageSquare, 
  Layers, BookMarked, ChevronRight, Volume2, RefreshCw
} from 'lucide-react';
import { dashboardApi } from '../../../api/dashboardAndAiApi';
import binoApi from '../../../api/binoApi';
import toeicApi from '../../../api/toeicApi';
import speechService from '../../../utils/speechService';
import { useBinoPlayerStore } from '../../bino/components/BinoPlaylistModal';
import useAuthStore from '../../../store/authStore';
import PageLoader from '../../../components/PageLoader';

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

export default function StudentHome() {
  const cachedStats = dashboardApi.peekStats()?.data || null;
  const cachedBook = binoApi.peekBookOverview() || null;
  const [stats, setStats] = useState(cachedStats);
  const [binoBook, setBinoBook] = useState(cachedBook);
  const [loading, setLoading] = useState(!cachedStats && !cachedBook);
  const [activeDrillIdx, setActiveDrillIdx] = useState(0);
  const [isSpeakingDemo, setIsSpeakingDemo] = useState(false);

  const user = useAuthStore((state) => state.user);
  const openPlaylist = useBinoPlayerStore((state) => state.openPlaylist);
  const isGlobalPlaying = useBinoPlayerStore((state) => state.isOpen);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.getStats().then((res) => {
        if (res?.data) setStats(res.data);
      }),
      binoApi.getBookOverview().then((res) => {
        if (res?.data) setBinoBook(res.data);
      })
    ]).finally(() => setLoading(false));
  }, []);

  // Tự động xoay vòng câu mẫu Substitution Drilling mỗi 3.8 giây tạo hiệu ứng sống động như Apple Showcase
  useEffect(() => {
    if (isSpeakingDemo) return undefined;
    const timer = setInterval(() => {
      setActiveDrillIdx((prev) => (prev + 1) % LIVE_DRILL_SAMPLES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isSpeakingDemo]);

  if (loading) return <PageLoader />;

  const recentTests = stats?.recentTests || [];
  const totalBinoLessons = binoBook?.totalLessons || 72;
  const completedBinoLessons = binoBook?.completedLessons || 0;
  const binoProgressPercent = binoBook?.progressPercentage || 0;
  const featuredChapters = binoBook?.chapters?.slice(0, 6) || [];
  const activeSample = LIVE_DRILL_SAMPLES[activeDrillIdx];

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

  const handlePlaySampleVoice = (e) => {
    e.stopPropagation();
    setIsSpeakingDemo(true);
    speechService.speak(activeSample.fullEn, {
      rate: 0.95,
      speakerIndex: 0,
      onEnd: () => setIsSpeakingDemo(false)
    });
  };

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
      
      {/* ===================================================================== */}
      {/* 1. APPLE-STYLE HERO SECTION — SỐNG ĐỘNG, MƯỢT MÀ, NÚT PHẲNG TINH TẾ  */}
      {/* ===================================================================== */}
      <motion.section
        variants={sectionRevealVariants}
        className="relative overflow-hidden rounded-[30px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 p-7 sm:p-10 lg:p-12 shadow-[0_10px_40px_rgb(0,0,0,0.035)] dark:shadow-none"
      >
        {/* Ambient Apple Breathing Light Orbs (100% GPU Transform Animation) */}
        <motion.div
          animate={{
            x: [0, 24, -12, 0],
            y: [0, -18, 12, 0],
            scale: [1, 1.08, 0.96, 1]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-28 -right-20 w-80 h-80 rounded-full bg-[#0071e3]/[0.07] dark:bg-sky-500/[0.08] blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 16, 0],
            y: [0, 16, -14, 0],
            scale: [1, 0.94, 1.06, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-sky-400/[0.06] dark:bg-blue-500/[0.06] blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          
          {/* Left Column: Clean Typography & Solid Pill Buttons with Spring Physics */}
          <div className="max-w-2xl space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60"
            >
              <span className="inline-flex items-center gap-1.5 text-[#0071e3] dark:text-sky-400 font-semibold">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Flame size={13} className="fill-current" />
                </motion.span>
                {stats?.currentStreakDays ?? 0} ngày liên tiếp
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>Khóa học phản xạ giao tiếp Bino</span>
            </motion.div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-[-0.028em] text-slate-900 dark:text-white leading-[1.14]">
                Chào {user?.fullName || 'bạn'},{' '}
                <span className="text-[#0071e3] dark:text-sky-400">
                  luyện phản xạ nói tiếng Anh tự nhiên mỗi ngày.
                </span>
              </h1>

              <p className="text-sm sm:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-xl">
                Trọng tâm cùng giáo trình <span className="text-slate-800 dark:text-slate-200 font-medium">&ldquo;Chém Tiếng Anh Không Cần Động Não&rdquo;</span> — nghe ngấm ngữ điệu đời thực, biến hóa mẫu câu linh hoạt và bật ra tiếng Anh không cần dịch ngầm.
              </p>
            </div>

            {/* Apple Solid Pill Buttons (No Gradients, Pure Tactile Spring Motion) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onMouseEnter={() => binoApi.prefetchBookOverview()}
                onClick={() => navigate('/bino')}
                className="px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-full shadow-[0_4px_14px_rgba(0,113,227,0.28)] flex items-center gap-2.5 transition-colors text-sm cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                <span>Vào luyện Chém Tiếng Anh</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={() => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })}
                className="px-5 py-3.5 bg-[#0071e3]/10 hover:bg-[#0071e3]/15 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 text-[#0071e3] dark:text-sky-400 font-medium rounded-full flex items-center gap-2 transition-colors text-sm cursor-pointer"
              >
                {isGlobalPlaying ? (
                  <span className="inline-flex items-end gap-0.5 h-3.5">
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                    <span className="equalizer-bar" />
                  </span>
                ) : (
                  <Headphones size={16} />
                )}
                <span>Nghe thụ động Playlist</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={() => navigate('/bino/flashcards')}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium rounded-full flex items-center gap-2 transition-colors text-sm cursor-pointer"
              >
                <Layers size={15} className="text-slate-500 dark:text-slate-400" />
                <span>Ôn Flashcard</span>
              </motion.button>
            </div>
          </div>

          {/* Right Column: Apple Continuity Widget with Animated SVG Activity Ring */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={() => {
              if (nextDialogue?.id) {
                navigate(`/bino/dialogue/${nextDialogue.id}`);
              } else {
                navigate('/bino');
              }
            }}
            className="w-full lg:w-[360px] p-6 rounded-[26px] bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 hover:border-[#0071e3]/40 dark:hover:border-sky-400/40 shadow-[0_4px_20px_rgb(0,0,0,0.025)] cursor-pointer shrink-0 space-y-5 group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  Tiến độ khóa học
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {completedBinoLessons}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    / {totalBinoLessons} bài hội thoại
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  12 chương • 427 từ khóa • 688 câu thoại
                </p>
              </div>

              {/* Animated Apple Activity Ring SVG */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    initial={{ strokeDashoffset: ringCircumference }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[#0071e3] dark:text-sky-400"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-100">
                  {binoProgressPercent}%
                </span>
              </div>
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/70 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, binoProgressPercent)}%` }}
                transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0071e3] dark:bg-sky-400 h-full rounded-full"
              />
            </div>

            {nextDialogue ? (
              <div className="pt-3.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-sky-400 animate-pulse" />
                    <p className="text-[11px] font-semibold text-[#0071e3] dark:text-sky-400 uppercase tracking-wide">
                      Học tiếp • Chương {nextDialogue.chapterNumber}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {nextDialogue.title}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-9 h-9 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform"
                >
                  <ArrowRight size={16} />
                </motion.div>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#0071e3] dark:text-sky-400">
                <span>Mở danh sách 12 chương</span>
                <ArrowRight size={14} />
              </div>
            )}
          </motion.div>

        </div>
      </motion.section>

      {/* ===================================================================== */}
      {/* 2. LIVE INTERACTIVE WIDGET + BENTO PILLARS — SINH ĐỘNG & MƯỢT MÀ      */}
      {/* ===================================================================== */}
      <motion.section variants={sectionRevealVariants} className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
              Phương pháp phản xạ Bino
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              Trải nghiệm học tiếng Anh sống động
            </h2>
          </div>

          <button
            onClick={() => navigate('/bino')}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0071e3] dark:text-sky-400 hover:underline self-start sm:self-auto cursor-pointer group"
          >
            <span>Khám phá trọn bộ 12 chương</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Live Interactive Substitution Drilling Showcase Bar (Auto-animating & Clickable) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onClick={() => navigate('/bino')}
          className="p-6 sm:p-7 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_4px_20px_rgb(0,0,0,0.025)] cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
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
                  transition={{ duration: 0.22 }}
                  className="text-xs text-slate-400 dark:text-slate-500 font-medium"
                >
                  • {activeSample.context}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Animated Sentence with Dynamic Slot Replacement */}
            <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span>&ldquo;It&apos;s been pretty good. I&apos;m still getting used to</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeSample.slotEn}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
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
                transition={{ duration: 0.2 }}
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
            {/* Dots selector */}
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
        </motion.div>

        {/* 4 Apple Bento Cards with Staggered Spring & Hover Lift */}
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
              onClick: () => navigate('/bino')
            },
            {
              icon: Sparkles,
              meta: 'Substitution Drilling',
              title: 'Vận dụng mẫu câu',
              desc: 'Thay thế cụm từ linh hoạt ngay sau mỗi câu thoại để nói theo ý mình.',
              onClick: () => navigate('/bino')
            },
            {
              icon: Headphones,
              meta: 'Hỗ trợ khóa màn hình',
              title: 'Nghe thụ động 24/7',
              desc: 'Chuyển trang hoặc tắt màn hình điện thoại vẫn phát âm thanh mượt mà.',
              onClick: () => openPlaylist({ ids: null, autoStart: true, minimized: false, book: binoBook })
            },
            {
              icon: BookMarked,
              meta: '427 từ khóa • Ebook',
              title: 'Flashcard & Sách gốc',
              desc: 'Lưu nhanh từ vựng một chạm và đọc trọn vẹn mục mở rộng cuối chương.',
              onClick: () => navigate('/bino/reader')
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={cardItemVariants}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                onClick={item.onClick}
                className="p-6 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 hover:border-[#0071e3]/40 dark:hover:border-sky-400/40 cursor-pointer shadow-[0_2px_14px_rgb(0,0,0,0.02)] hover:shadow-[0_14px_32px_rgb(0,113,227,0.07)] flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.4 }}
                      className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 dark:bg-sky-500/15 text-[#0071e3] dark:text-sky-400 flex items-center justify-center group-hover:bg-[#0071e3] group-hover:text-white transition-colors duration-300"
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-medium text-[#0071e3] dark:text-sky-400">
                  <span>Khám phá</span>
                  <ChevronRight size={14} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
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
              onClick={() => navigate('/bino')}
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
                      navigate(`/bino/dialogue/${firstDialogueId}`);
                    } else {
                      navigate('/bino');
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
                onClick: () => navigate('/bino/flashcards')
              },
              {
                icon: BookOpen,
                title: 'Đọc Ebook Bino gốc',
                desc: 'Xem sách trình bày nguyên bản',
                onClick: () => navigate('/bino/reader')
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
            Trình nghe của Bino luôn duy trì ở góc màn hình khi chuyển trang và hỗ trợ phát nền khi khóa màn hình điện thoại.
          </div>
        </div>

      </motion.section>

    </motion.div>
  );
}
