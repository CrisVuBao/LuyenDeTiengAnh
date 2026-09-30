import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Zap,
  Layers,
  MessageSquare,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  Lightbulb,
  Eye,
  EyeOff
} from 'lucide-react';
import speechService from '../../utils/speechService';

const SLIDE_DURATION_MS = 7500;

const DRILL_CHIPS = [
  {
    slotEn: 'getting used to the new workflow',
    slotVi: 'làm quen với quy trình làm việc mới',
    fullEn: "Everything is going well. I'm just getting used to the new workflow.",
    fullVi: 'Mọi thứ đang tiến triển tốt. Mình chỉ đang làm quen với quy trình làm việc mới thôi.'
  },
  {
    slotEn: 'adapting to the fast pace here',
    slotVi: 'thích nghi với nhịp độ nhanh ở đây',
    fullEn: "Everything is going well. I'm just adapting to the fast pace here.",
    fullVi: 'Mọi thứ đang tiến triển tốt. Mình chỉ đang thích nghi với nhịp độ nhanh ở đây thôi.'
  },
  {
    slotEn: 'practicing speaking English daily',
    slotVi: 'luyện nói tiếng Anh mỗi ngày',
    fullEn: "Everything is going well. I'm just practicing speaking English daily.",
    fullVi: 'Mọi thứ đang tiến triển tốt. Mình chỉ đang luyện nói tiếng Anh mỗi ngày thôi.'
  }
];

const REFLEX_CHALLENGES = [
  {
    vi: 'Để mình kiểm tra lại lịch trình rồi báo lại cho bạn ngay nhé.',
    en: 'Let me double-check my schedule and get back to you right away.',
    collocation: 'get back to someone • double-check'
  },
  {
    vi: 'Mình hoàn toàn đồng ý với quan điểm của bạn về dự án này.',
    en: 'I estamos... → I couldn’t agree more with your point on this project.',
    cleanEn: "I couldn't agree more with your point on this project.",
    collocation: "couldn't agree more • on this project"
  },
  {
    vi: 'Dạo này công việc của bạn thế nào, có bận lắm không?',
    en: 'How has work been lately, have you been keeping busy?',
    cleanEn: 'How has work been lately, have you been keeping busy?',
    collocation: 'lately • keep busy'
  }
];

const MINI_FLASHCARDS = [
  {
    word: 'Resilient',
    ipa: '/rɪˈzɪl.jənt/',
    type: 'Adjective • C1',
    meaning: 'Kiên cường, có khả năng phục hồi nhanh',
    example: 'She remained resilient despite all the unexpected challenges.',
    retention: '98% Độ bền FSRS'
  },
  {
    word: 'Articulate',
    ipa: '/ɑːˈtɪk.jə.lət/',
    type: 'Adjective / Verb • C1',
    meaning: 'Diễn đạt lưu loát, rõ ràng, mạch lạc',
    example: 'He is an articulate speaker who captures everyone’s attention.',
    retention: '96% Độ bền FSRS'
  },
  {
    word: 'Breakthrough',
    ipa: '/ˈbreɪk.θruː/',
    type: 'Noun • B2',
    meaning: 'Bước đột phá quan trọng',
    example: 'Consistent daily practice leads to a real fluency breakthrough.',
    retention: '99% Độ bền FSRS'
  }
];

/**
 * LuxuryAppleSlider - Inspired by Apple.com Flagship Product Showcases & Apple TV+ Carousels.
 * Features interactive live widgets inside each slide, spring physics transitions,
 * touch swipe gestures, and Apple's signature segmented progress pill controller.
 */
function LuxuryAppleSlider({
  onNavigateCommunication,
  onNavigateReflex,
  onNavigateVocab,
  onOpenGuide,
  binoProgressPercent = 0,
  reflexCompletedCount = 0,
  vocabMasteredCount = 0
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Interactive states inside slides
  const [drillIdx, setDrillIdx] = useState(0);
  const [reflexIdx, setReflexIdx] = useState(0);
  const [showReflexAnswer, setShowReflexAnswer] = useState(false);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [triangleStep, setTriangleStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const totalSlides = 4;

  const paginate = useCallback(
    (newDirection) => {
      setDirection(newDirection);
      setActiveSlide((prev) => (prev + newDirection + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const goToSlide = useCallback(
    (index) => {
      setDirection(index > activeSlide ? 1 : -1);
      setActiveSlide(index);
    },
    [activeSlide]
  );

  useEffect(() => {
    if (!isAutoPlaying || isHovered || isSpeaking) return undefined;
    const timer = setInterval(() => {
      paginate(1);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, isSpeaking, paginate]);

  const speakText = (text, e) => {
    if (e) e.stopPropagation();
    setIsSpeaking(true);
    speechService.speak(text, {
      rate: 0.96,
      speakerIndex: 0,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 36 : -36,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.26,
        ease: [0.22, 1, 0.36, 1]
      },
      transitionEnd: {
        transform: 'none'
      }
    },
    exit: (dir) => ({
      x: dir < 0 ? 36 : -36,
      opacity: 0,
      transition: {
        duration: 0.18,
        ease: 'easeInOut'
      }
    })
  };

  const currentDrill = DRILL_CHIPS[drillIdx];
  const currentReflex = REFLEX_CHALLENGES[reflexIdx];
  const currentCard = MINI_FLASHCARDS[flashcardIdx];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative select-none"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0071e3] dark:text-sky-400">
            <Sparkles size={12} />
            <span>APPLE INTERACTIVE SHOWCASE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Trải nghiệm trực tiếp hệ sinh thái phản xạ
          </h2>
        </div>

        {/* Top Right Navigation Arrows & Slide Counter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 tabular-nums">
            0{activeSlide + 1} / 0{totalSlides}
          </span>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => paginate(-1)}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3] hover:text-[#0071e3] dark:hover:text-sky-400 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            aria-label="Slide trước"
          >
            <ChevronLeft size={17} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => paginate(1)}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3] hover:text-[#0071e3] dark:hover:text-sky-400 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            aria-label="Slide tiếp theo"
          >
            <ChevronRight size={17} />
          </motion.button>
        </div>
      </div>

      {/* Main Carousel Stage */}
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[36px] bg-gradient-to-br from-white via-[#f8fafc] to-blue-50/30 dark:from-[#0b101b] dark:via-[#0d1322] dark:to-[#090d16] border border-slate-200/85 dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,113,227,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[280px] sm:min-h-[320px] flex flex-col justify-between p-4 sm:p-8 lg:p-10">
        {/* Top Specular Hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0071e3]/35 to-transparent" />

        {/* Ambient Sapphire Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#0071e3]/[0.07] dark:bg-[#0071e3]/[0.12] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-400/[0.06] dark:bg-sky-500/[0.08] blur-3xl" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, { offset }) => {
              if (offset.x < -60) paginate(1);
              else if (offset.x > 60) paginate(-1);
            }}
            className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center"
          >
            {/* =============================================================== */}
            {/* SLIDE 0: GIAO TIẾP THỰC CHIẾN & SUBSTITUTION DRILLING            */}
            {/* =============================================================== */}
            {activeSlide === 0 && (
              <>
                <div className="lg:col-span-6 space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-[#0071e3]/20 text-[#0071e3] dark:text-sky-400 text-[11px] sm:text-xs font-bold border border-[#0071e3]/20">
                    <MessageSquare size={13} />
                    <span>TRỤ CỘT 01 • 12 CHƯƠNG • 72 BÀI HỘI THOẠI</span>
                  </div>

                  <h3 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Học 1 câu gốc, biến hóa thành{' '}
                    <span className="bg-gradient-to-r from-[#0071e3] to-sky-500 bg-clip-text text-transparent">
                      10 câu của riêng bạn.
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Phương pháp <strong>Substitution Drilling (Đổi ruột câu)</strong> giúp bạn không học vẹt. Bấm thử các mảnh ghép bên dưới để cảm nhận cách não bộ phản xạ tự nhiên!
                  </p>

                  <div className="pt-0.5 sm:pt-1 flex flex-wrap items-center gap-3">
                    <button
                      onClick={onNavigateCommunication}
                      className="w-full sm:w-auto justify-center px-6 py-2.5 sm:py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(0,113,227,0.28)] flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <span>Vào học Giao Tiếp ({binoProgressPercent}%)</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Right Interactive Sandbox */}
                <div className="lg:col-span-6 p-4 sm:p-6 rounded-2xl sm:rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-md space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                      Bấm chọn cụm từ để đổi ruột câu trực tiếp:
                    </span>
                    <button
                      onClick={(e) => speakText(currentDrill.fullEn, e)}
                      className="px-3 py-1.5 rounded-full bg-[#0071e3]/10 hover:bg-[#0071e3] text-[#0071e3] hover:text-white dark:bg-sky-500/20 dark:text-sky-300 dark:hover:bg-[#0071e3] dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Volume2 size={14} className={isSpeaking ? 'animate-bounce' : ''} />
                      <span>Nghe câu</span>
                    </button>
                  </div>

                  {/* Interactive Formula Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      &ldquo;Everything is going well. I&apos;m just{' '}
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentDrill.slotEn}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="inline-block px-2 py-0.5 rounded-lg bg-[#0071e3] text-white font-extrabold shadow-xs"
                        >
                          {currentDrill.slotEn}
                        </motion.span>
                      </AnimatePresence>
                      .&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-vietsub">
                      {currentDrill.fullVi}
                    </p>
                  </div>

                  {/* 3 Interactive Slot Selector Pills */}
                  <div className="flex flex-wrap gap-2">
                    {DRILL_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDrillIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          drillIdx === idx
                            ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm shadow-blue-500/20'
                            : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent hover:border-[#0071e3]/40'
                        }`}
                      >
                        {idx + 1}. {chip.slotVi}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* =============================================================== */}
            {/* SLIDE 1: PHẢN XẠ 3 GIÂY 50 CHỦ ĐỀ (1.500 CÂU NÓI & VIẾT)        */}
            {/* =============================================================== */}
            {activeSlide === 1 && (
              <>
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-400 text-xs font-bold border border-sky-500/25">
                    <Zap size={13} />
                    <span>TRỤ CỘT 02 • 50 CHỦ ĐỀ • 1.500 CÂU PHẢN XẠ</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Bật ra câu tiếng Anh trong{' '}
                    <span className="bg-gradient-to-r from-[#0071e3] to-sky-500 bg-clip-text text-transparent">
                      3 giây không dịch từng từ.
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Rèn luyện 1.500 câu thông dụng nhất với 3.400+ cụm Collocations bản xứ. Thử sức ngay với thẻ phản xạ nhanh bên cạnh!
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onNavigateReflex}
                      className="px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(0,113,227,0.28)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Luyện Phản Xạ 50 ({reflexCompletedCount}/1500 câu)</span>
                      <ArrowRight size={15} />
                    </motion.button>
                  </div>
                </div>

                {/* Right Interactive 3-Second Challenge Widget */}
                <div className="lg:col-span-6 p-5 sm:p-6 rounded-[26px] bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                      Thử thách phản xạ 3 giây #{reflexIdx + 1}:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setShowReflexAnswer(false);
                          setReflexIdx((prev) => (prev + 1) % REFLEX_CHALLENGES.length);
                        }}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0071e3] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw size={12} />
                        <span>Đổi câu</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Tình huống tiếng Việt:
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        &ldquo;{currentReflex.vi}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-[#0071e3] dark:text-sky-400">
                        Gợi ý: {currentReflex.collocation}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowReflexAnswer((prev) => !prev)}
                          className="px-3 py-1.5 rounded-xl bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {showReflexAnswer ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{showReflexAnswer ? 'Ẩn đáp án' : 'Lật đáp án'}</span>
                        </button>
                        <button
                          onClick={(e) => speakText(currentReflex.cleanEn || currentReflex.en, e)}
                          className="p-1.5 rounded-xl bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 cursor-pointer"
                          title="Nghe câu chuẩn"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showReflexAnswer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border border-[#0071e3]/25 text-xs sm:text-sm font-bold text-[#0071e3] dark:text-sky-300 mt-1">
                            ✓ {currentReflex.cleanEn || currentReflex.en}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}

            {/* =============================================================== */}
            {/* SLIDE 2: 3000 TỪ VỰNG OXFORD & LÁ CHẮN TRÍ NHỚ FSRS             */}
            {/* =============================================================== */}
            {activeSlide === 2 && (
              <>
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/25">
                    <Layers size={13} />
                    <span>TRỤ CỘT 03 • 3000 TỪ OXFORD • THUẬT TOÁN FSRS</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Nhớ từ vựng sâu gấp 3 lần cùng{' '}
                    <span className="bg-gradient-to-r from-[#0071e3] to-emerald-500 bg-clip-text text-transparent">
                      Flashcard 3D & Lá Chắn FSRS.
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Thuật toán lặp lại ngắt quãng FSRS tính toán chính xác thời điểm não bộ sắp quên để nhắc ôn đúng lúc. Chạm vào thẻ bên phải để lật xem nghĩa!
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onNavigateVocab}
                      className="px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(0,113,227,0.28)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Khám phá 60 Chủ Đề ({vocabMasteredCount} từ)</span>
                      <ArrowRight size={15} />
                    </motion.button>
                  </div>
                </div>

                {/* Right Interactive 3D Flashcard Sandbox */}
                <div className="lg:col-span-6 flex flex-col gap-3">
                  <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setIsCardFlipped((prev) => !prev)}
                    className="p-5 sm:p-6 rounded-[26px] bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-lg cursor-pointer space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/20 dark:text-sky-300 text-[11px] font-bold">
                        {currentCard.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {currentCard.retention}
                        </span>
                        <button
                          onClick={(e) => speakText(currentCard.word, e)}
                          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0071e3] dark:text-sky-400 hover:bg-[#0071e3] hover:text-white transition-colors"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {!isCardFlipped ? (
                        <motion.div
                          key="front"
                          initial={{ opacity: 0, rotateX: -15 }}
                          animate={{ opacity: 1, rotateX: 0 }}
                          exit={{ opacity: 0, rotateX: 15 }}
                          transition={{ duration: 0.2 }}
                          className="py-3 space-y-1"
                        >
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                            {currentCard.word}
                          </h4>
                          <p className="text-xs font-mono text-[#0071e3] dark:text-sky-400">
                            {currentCard.ipa}
                          </p>
                          <p className="text-[11px] text-slate-400 pt-2">
                            👆 Chạm vào thẻ để lật xem nghĩa & câu ví dụ
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ opacity: 0, rotateX: 15 }}
                          animate={{ opacity: 1, rotateX: 0 }}
                          exit={{ opacity: 0, rotateX: -15 }}
                          transition={{ duration: 0.2 }}
                          className="py-2 space-y-2"
                        >
                          <p className="text-base font-extrabold text-[#0071e3] dark:text-sky-400">
                            {currentCard.meaning}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                            &ldquo;{currentCard.example}&rdquo;
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {MINI_FLASHCARDS.map((c, idx) => (
                          <button
                            key={c.word}
                            onClick={() => {
                              setIsCardFlipped(false);
                              setFlashcardIdx(idx);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              flashcardIdx === idx
                                ? 'bg-[#0071e3] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {c.word}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-[#0071e3] dark:text-sky-400">
                        {isCardFlipped ? 'Mặt sau' : 'Mặt trước'}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </>
            )}

            {/* =============================================================== */}
            {/* SLIDE 3: TAM GIÁC VÀNG PHẢN XẠ (45–60 PHÚT/NGÀY)                */}
            {/* =============================================================== */}
            {activeSlide === 3 && (
              <>
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071e3]/10 dark:bg-[#0071e3]/20 text-[#0071e3] dark:text-sky-400 text-xs font-bold border border-[#0071e3]/20">
                    <Lightbulb size={13} />
                    <span>LỘ TRÌNH CHUẨN SƯ PHẠM • 45–60 PHÚT MỖI NGÀY</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Kết hợp 3 trụ cột theo{' '}
                    <span className="bg-gradient-to-r from-[#0071e3] to-sky-500 bg-clip-text text-transparent">
                      Tam Giác Vàng Phản Xạ.
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Thay vì học rời rạc, hãy đi theo chu trình khép kín: <strong>Nạp nguyên liệu từ vựng</strong> → <strong>Ép xung phản xạ 3 giây</strong> → <strong>Thực chiến hội thoại & nghe ngấm</strong>.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onOpenGuide}
                      className="px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(0,113,227,0.28)] flex items-center gap-2 cursor-pointer"
                    >
                      <Lightbulb size={15} />
                      <span>Mở Sổ Tay Lộ Trình Chi Tiết</span>
                    </motion.button>
                  </div>
                </div>

                {/* Right Interactive Step-by-Step Selector */}
                <div className="lg:col-span-6 p-5 sm:p-6 rounded-[26px] bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-lg space-y-3">
                  {[
                    {
                      time: '15 Phút Đầu',
                      title: 'Bước 1: Nạp Từ Vựng Cốt Lõi (Oxford FSRS)',
                      desc: 'Học 10–15 từ mới và quét sạch thẻ đến hạn ôn tập trên Lá Chắn Trí Nhớ.'
                    },
                    {
                      time: '20 Phút Giữa',
                      title: 'Bước 2: Phản Xạ Nói – Viết 3 Giây (Reflex 50)',
                      desc: 'Bật ra câu hoàn chỉnh trong 3 giây để phá bỏ thói quen dịch ngầm từng chữ.'
                    },
                    {
                      time: '25 Phút Cuối',
                      title: 'Bước 3: Nhập Vai Hội Thoại & Nghe Thụ Động',
                      desc: 'Đóng vai Leo/Anna trong 72 bài Giao Tiếp và bật Playlist tắm ngôn ngữ.'
                    }
                  ].map((step, idx) => {
                    const isSelected = triangleStep === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setTriangleStep(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border-[#0071e3]/40 shadow-xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 hover:border-[#0071e3]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {step.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#0071e3] text-white text-[10px] font-bold">
                            {step.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Apple Segmented Pill Progress Controller */}
        <div className="relative z-10 flex items-center justify-between pt-6 mt-4 border-t border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            {/* Apple Play/Pause Auto-Rotation Button */}
            <button
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              className="w-7 h-7 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#0071e3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isAutoPlaying ? 'Tạm dừng tự động chuyển slide' : 'Tiếp tục tự động chuyển slide'}
            >
              {isAutoPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>

            {/* Segmented Pills */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/70 backdrop-blur-md">
              {[0, 1, 2, 3].map((idx) => {
                const isActive = activeSlide === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                      isActive ? 'w-9 bg-[#0071e3]/25 dark:bg-sky-400/25' : 'w-2 bg-slate-400/50 hover:bg-slate-500'
                    }`}
                    aria-label={`Chuyển tới slide ${idx + 1}`}
                  >
                    {isActive && (
                      <motion.span
                        key={`${activeSlide}-${isAutoPlaying}-${isHovered}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isAutoPlaying && !isHovered ? 1 : 0.45 }}
                        transition={{
                          duration: isAutoPlaying && !isHovered ? SLIDE_DURATION_MS / 1000 : 0.3,
                          ease: 'linear'
                        }}
                        style={{ transformOrigin: 'left' }}
                        className="absolute inset-0 bg-[#0071e3] dark:bg-sky-400 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Slide Labels on Desktop */}
          <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold">
            {[
              '01. Đổi Ruột Câu',
              '02. Phản Xạ 3 Giây',
              '03. Flashcard FSRS',
              '04. Tam Giác Vàng'
            ].map((label, idx) => (
              <button
                key={label}
                onClick={() => goToSlide(idx)}
                className={`transition-colors cursor-pointer ${
                  activeSlide === idx
                    ? 'text-[#0071e3] dark:text-sky-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(LuxuryAppleSlider);
