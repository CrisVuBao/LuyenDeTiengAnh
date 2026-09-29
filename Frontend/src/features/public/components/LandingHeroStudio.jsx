import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Headphones,
  MessageSquare,
  Layers,
  Zap,
  RotateCw,
  RefreshCw,
  Radio,
  Brain,
  Volume2,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Repeat,
  Compass
} from 'lucide-react';

const REFLEX_SAMPLES = [
  {
    id: 1,
    topic: 'Unit 04 • Giao tiếp nơi công sở',
    vi: 'Để tôi kiểm tra lại lịch trình rồi báo lại cho bạn ngay nhé.',
    chunks: ['Let me double-check', 'my schedule', 'and get back to you', 'right away.'],
    en: 'Let me double-check my schedule and get back to you right away.',
    ipa: '/let miː ˈdʌb.əl tʃek maɪ ˈʃed.juːl ænd ɡet bæk tuː juː raɪt əˈweɪ/',
    tip: 'Dùng cụm "get back to someone" tự nhiên hơn nhiều so với "answer you again".'
  },
  {
    id: 2,
    topic: 'Unit 12 • Đàm phán & Thảo luận',
    vi: 'Thành thật mà nói, phương án đó vượt quá ngân sách hiện tại của chúng tôi.',
    chunks: ['To be honest,', 'that option is', 'way over', 'our current budget.'],
    en: 'To be honest, that option is way over our current budget.',
    ipa: '/tuː biː ˈɒn.ɪst ðæt ˈɒp.ʃən ɪz weɪ ˈəʊ.vər aʊər ˈkʌr.ənt ˈbʌdʒ.ɪt/',
    tip: 'Cụm "way over" nhấn mạnh mức độ vượt quá xa so với giới hạn.'
  },
  {
    id: 3,
    topic: 'Unit 27 • Tình huống đời sống hàng ngày',
    vi: 'Đừng hiểu lầm ý tôi, tôi chỉ muốn chắc chắn mọi thứ đi đúng hướng.',
    chunks: ["Don't get me wrong,", 'I just want to', 'make sure everything', 'is on the right track.'],
    en: "Don't get me wrong, I just want to make sure everything is on the right track.",
    ipa: '/dəʊnt ɡet miː rɒŋ aɪ dʒʌst wɒnt tuː meɪk ʃɔːr ˈev.ri.θɪŋ ɪz ɒn ðə raɪt træk/',
    tip: '"On the right track" là thành ngữ cực kỳ phổ biến để chỉ việc đi đúng lộ trình.'
  },
  {
    id: 4,
    topic: 'Unit 39 • Thuyết trình & Báo cáo',
    vi: 'Chúng ta hãy đi thẳng vào vấn đề chính của cuộc họp hôm nay nhé.',
    chunks: ["Let's get straight", 'to the point', 'of today’s meeting.'],
    en: "Let's get straight to the point of today's meeting.",
    ipa: '/lets ɡet streɪt tuː ðə pɔɪnt ɒv təˈdeɪz ˈmiː.tɪŋ/',
    tip: '"Get straight to the point" = Đi thẳng vào trọng tâm, không vòng vo.'
  }
];

const BINO_SUBSTITUTION_DATA = {
  chapter: 'Chương 03 • Bài 18: Thói quen & Lời đề nghị lịch sự',
  dialogueContext: [
    { speaker: 'Leo', en: "Hey Sarah, we're grabbing some coffee. Do you want to join us?", vi: 'Chào Sarah, tụi mình đang đi mua cà phê. Cậu có muốn đi cùng không?' },
    { speaker: 'Sarah', en: "I'd love to, but I'm tied up with this report right now.", vi: 'Mình thích lắm, nhưng hiện tại mình đang bận tối mắt với bản báo cáo này rồi.' }
  ],
  patternTitle: 'Mẫu câu biến hóa: "I’m tied up with + [Danh từ / V-ing]" (Đang rất bận với...)',
  baseStem: "I'd love to, but I'm tied up with",
  baseVi: 'Mình rất muốn, nhưng mình đang bận',
  variations: [
    {
      id: 'v1',
      chip: 'this report right now',
      chipVi: 'bản báo cáo này ngay lúc này',
      fullEn: "I'd love to, but I'm tied up with this report right now.",
      fullVi: 'Mình thích lắm, nhưng hiện tại mình đang bận làm bản báo cáo này rồi.'
    },
    {
      id: 'v2',
      chip: 'an urgent client meeting',
      chipVi: 'cuộc họp khách hàng khẩn cấp',
      fullEn: "I'd love to, but I'm tied up with an urgent client meeting.",
      fullVi: 'Mình rất muốn, nhưng mình đang bận một cuộc họp khách hàng khẩn cấp.'
    },
    {
      id: 'v3',
      chip: 'preparing for the TOEIC exam',
      chipVi: 'ôn thi TOEIC',
      fullEn: "I'd love to, but I'm tied up with preparing for the TOEIC exam.",
      fullVi: 'Mình rất muốn, nhưng mình đang bận chuẩn bị cho kỳ thi TOEIC.'
    },
    {
      id: 'v4',
      chip: 'some family matters today',
      chipVi: 'chuyện gia đình hôm nay',
      fullEn: "I'd love to, but I'm tied up with some family matters today.",
      fullVi: 'Mình rất muốn, nhưng hôm nay mình đang bận chút việc gia đình.'
    }
  ]
};

const OXFORD_CARDS = [
  {
    word: 'Resilient',
    ipa: '/rɪˈzɪl.i.ənt/',
    pos: 'Adjective • C1',
    topic: 'Chủ đề 14: Tính cách & Bản lĩnh',
    meaning: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn',
    exampleEn: 'She is a resilient leader who stays calm under extreme pressure.',
    exampleVi: 'Cô ấy là một nhà lãnh đạo kiên cường luôn giữ bình tĩnh dưới áp lực cao.',
    synonyms: ['Tough', 'Adaptable', 'Strong']
  },
  {
    word: 'Prerequisite',
    ipa: '/ˌpriːˈrek.wɪ.zɪt/',
    pos: 'Noun • C1',
    topic: 'Chủ đề 28: Giáo dục & Sự nghiệp',
    meaning: 'Điều kiện tiên quyết, yếu tố bắt buộc phải có trước',
    meaningShort: 'Điều kiện tiên quyết',
    exampleEn: 'Fluency in English is a prerequisite for this international position.',
    exampleVi: 'Thành thạo tiếng Anh là điều kiện tiên quyết cho vị trí quốc tế này.',
    synonyms: ['Requirement', 'Precondition', 'Must-have']
  },
  {
    word: 'Negotiate',
    ipa: '/nɪˈɡəʊ.ʃi.eɪt/',
    pos: 'Verb • B2',
    topic: 'Chủ đề 09: Kinh doanh & Thương mại',
    meaning: 'Đàm phán, thương lượng để đạt được thỏa thuận',
    exampleEn: 'We managed to negotiate a mutually beneficial contract.',
    exampleVi: 'Chúng tôi đã đàm phán thành công một hợp đồng đôi bên cùng có lợi.',
    synonyms: ['Bargain', 'Discuss terms', 'Mediate']
  },
  {
    word: 'Sustainable',
    ipa: '/səˈsteɪ.nə.bəl/',
    pos: 'Adjective • B2',
    topic: 'Chủ đề 42: Môi trường & Phát triển',
    meaning: 'Bền vững, duy trì lâu dài mà không gây tổn hại',
    exampleEn: 'Building a daily habit is the most sustainable way to master English.',
    exampleVi: 'Xây dựng thói quen hàng ngày là cách bền vững nhất để làm chủ tiếng Anh.',
    synonyms: ['Viable', 'Long-lasting', 'Renewable']
  }
];

const TOEIC_MINI_SAMPLE = {
  part: 'TOEIC ETS • Part 5 (Incomplete Sentences)',
  questionNumber: 118,
  question: 'All department heads are required to submit their quarterly budget proposals _______ Friday afternoon.',
  translation: 'Tất cả các trưởng phòng được yêu cầu nộp đề xuất ngân sách hàng quý của họ muộn nhất vào chiều thứ Sáu.',
  options: [
    { key: 'A', text: 'until', reason: 'Sai: "until" chỉ hành động kéo dài liên tục đến một thời điểm (예: wait until Friday), không đi với động từ hoàn tất một lần như "submit".' },
    { key: 'B', text: 'by', reason: 'Chính xác! Giới từ "by + mốc thời gian" mang nghĩa "trước hoặc muộn nhất là vào lúc", cực kỳ phổ biến trong TOEIC khi nói về hạn chót (deadline: submit, complete, return).' },
    { key: 'C', text: 'during', reason: 'Sai: "during" dùng cho một khoảng thời gian/sự kiện (during the meeting, during summer), ít dùng với mốc hạn chót cụ thể kèm động từ "submit".' },
    { key: 'D', text: 'within', reason: 'Sai: "within" phải đi kèm một khoảng thời gian (within 3 days, within a week), không đi trực tiếp với một thời điểm cố định như "Friday afternoon".' }
  ],
  correctKey: 'B',
  paraphrase: {
    original: 'are required to submit ... by Friday',
    mapped: 'must turn in ... no later than Friday',
    note: 'Cặp Paraphrase kinh điển thường xuất hiện ở Part 7!'
  }
};

export default function LandingHeroStudio({ onStartLearning, scrollToSection, isAuthenticated }) {
  const [activeStudioTab, setActiveStudioTab] = useState('reflex');

  // 1. Reflex 3s Simulator State
  const [reflexIndex, setReflexIndex] = useState(0);
  const [reflexTimeLeft, setReflexTimeLeft] = useState(3);
  const [reflexCounting, setReflexCounting] = useState(false);
  const [reflexRevealed, setReflexRevealed] = useState(false);

  // 2. Bino Substitution State
  const [selectedVariationId, setSelectedVariationId] = useState('v1');
  const [isPassivePlaying, setIsPassivePlaying] = useState(false);

  // 3. Oxford 3D Flashcard State
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // 4. TOEIC State
  const [selectedToeicOption, setSelectedToeicOption] = useState('B');

  const speakEnglish = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!reflexCounting) return;
    if (reflexTimeLeft <= 0) {
      setReflexCounting(false);
      setReflexRevealed(true);
      speakEnglish(REFLEX_SAMPLES[reflexIndex].en);
      return;
    }
    const timer = setTimeout(() => {
      setReflexTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [reflexCounting, reflexTimeLeft, reflexIndex, speakEnglish]);

  const startReflexChallenge = () => {
    setReflexRevealed(false);
    setReflexTimeLeft(3);
    setReflexCounting(true);
  };

  const nextReflexSample = () => {
    const nextIdx = (reflexIndex + 1) % REFLEX_SAMPLES.length;
    setReflexIndex(nextIdx);
    setReflexCounting(false);
    setReflexRevealed(false);
    setReflexTimeLeft(3);
  };

  const currentReflex = REFLEX_SAMPLES[reflexIndex];
  const currentVariation =
    BINO_SUBSTITUTION_DATA.variations.find((v) => v.id === selectedVariationId) ||
    BINO_SUBSTITUTION_DATA.variations[0];
  const currentCard = OXFORD_CARDS[cardIndex];

  return (
    <section id="live-studio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-16 lg:pb-28">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Hero Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hệ sinh thái Phản xạ Giao tiếp
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-[56px] font-black tracking-[-0.035em] leading-[1.08] text-slate-900 dark:text-white">
            Bật Tiếng Anh Tự Nhiên{' '}
            <span className="bg-gradient-to-r from-[#0071e3] via-sky-500 to-indigo-600 dark:from-sky-400 dark:via-[#38bdf8] dark:to-indigo-400 bg-clip-text text-transparent">
              Không Cần Dịch Ngầm.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
            Kết hợp trọn bộ <strong className="font-semibold text-slate-900 dark:text-white">72 bài hội thoại Giao Tiếp Thực Chiến</strong>, phòng luyện <strong className="font-semibold text-slate-900 dark:text-white">1.500 câu phản xạ Nói - Viết</strong>, kho <strong className="font-semibold text-slate-900 dark:text-white">3000 từ vựng Oxford 3D</strong> và <strong className="font-semibold text-slate-900 dark:text-white">Phòng luyện tập TOEIC ETS tích hợp</strong>.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { icon: Headphones, text: 'Nghe thụ động khi tắt màn hình' },
              { icon: Zap, text: 'Phản xạ nói 3 giây & Chunking' },
              { icon: RotateCw, text: 'Flashcard 3D & Lặp lại ngắt quãng FSRS' }
            ].map((pill, i) => {
              const Icon = pill.icon;
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <Icon size={13} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                  <span>{pill.text}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartLearning}
              className="px-7 py-4 bg-gradient-to-r from-[#0071e3] to-sky-500 hover:from-[#0077ED] hover:to-sky-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-[0_12px_28px_-6px_rgba(0,113,227,0.45)] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>{isAuthenticated ? 'Tiếp tục lộ trình học' : 'Bắt đầu học ngay miễn phí'}</span>
              <ArrowRight size={18} />
            </motion.button>

            <button
              onClick={() => scrollToSection('four-pillars')}
              className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#0071e3]/40 text-slate-700 dark:text-slate-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Compass size={17} className="text-[#0071e3] dark:text-sky-400" />
              <span>Khám phá 4 trụ cột</span>
            </button>
          </div>

          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: '72 Bài', label: 'Giao tiếp thực chiến', sub: '12 Chương & 688 câu' },
              { value: '1.500 Câu', label: 'Phản xạ Nói - Viết', sub: '50 Chủ đề thông dụng' },
              { value: '60 Chủ Đề', label: 'Từ vựng Oxford 3D', sub: '1.760+ từ cốt lõi' },
              { value: 'Parts 1–7', label: 'Đề thi TOEIC ETS', sub: 'Giải thích & Paraphrase' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800/90 shadow-2xs"
              >
                <div className="text-lg sm:text-xl font-black text-[#0071e3] dark:text-sky-400 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {stat.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Interactive Live Learning Studio */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6"
        >
          <div className="rounded-[28px] bg-white/95 dark:bg-[#0d1424]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_24px_60px_-15px_rgba(0,113,227,0.14)] overflow-hidden backdrop-blur-xl">
            <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
                <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Radio size={13} className="text-[#0071e3] dark:text-sky-400 animate-pulse" />
                  Phòng Trải Nghiệm Tương Tác Trực Tiếp
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400">
                Bấm để thử ngay
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200/70 dark:border-slate-800/80">
              {[
                { id: 'reflex', label: 'Phản Xạ 3 Giây', icon: Zap },
                { id: 'bino', label: 'Giao Tiếp Thực Chiến', icon: MessageSquare },
                { id: 'vocab', label: 'Flashcard 3D', icon: Layers },
                { id: 'toeic', label: 'TOEIC', icon: Brain }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeStudioTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStudioTab(tab.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0071e3] text-white shadow-[0_4px_12px_rgba(0,113,227,0.3)]'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 sm:p-6 min-h-[390px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeStudioTab === 'reflex' && (
                  <motion.div
                    key="reflex-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex-1 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                        {currentReflex.topic}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Câu {reflexIndex + 1}/{REFLEX_SAMPLES.length}</span>
                        <button
                          onClick={nextReflexSample}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Đổi câu thử thách khác"
                        >
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Thử thách: Hãy bật ra câu tiếng Anh trong 3 giây
                      </div>
                      <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        “{currentReflex.vi}”
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#0071e3]" />
                        <span>Gợi ý tư duy theo cụm từ (Chunking):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentReflex.chunks.map((chunk, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-[#0071e3] dark:text-sky-300"
                          >
                            {chunk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0071e3]/8 via-indigo-500/5 to-transparent border border-[#0071e3]/25 dark:border-sky-500/25">
                      {!reflexRevealed ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${
                                reflexCounting
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-[#0071e3]/15 text-[#0071e3] dark:text-sky-400'
                              }`}
                            >
                              {reflexTimeLeft}s
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {reflexCounting
                                  ? 'Đếm ngược! Bật câu bằng miệng ngay...'
                                  : 'Bấm nút để kích hoạt đồng hồ 3 giây'}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Ép não phản xạ không dịch ngầm
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={startReflexChallenge}
                            disabled={reflexCounting}
                            className="w-full sm:w-auto px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {reflexCounting ? 'Đang đếm...' : 'Bắt đầu 3 giây'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                <span>Đáp án bản xứ chuẩn:</span>
                              </div>
                              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
                                {currentReflex.en}
                              </p>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {currentReflex.ipa}
                              </div>
                            </div>
                            <button
                              onClick={() => speakEnglish(currentReflex.en)}
                              className="p-2.5 rounded-xl bg-[#0071e3]/15 text-[#0071e3] dark:text-sky-400 hover:bg-[#0071e3]/25 transition-colors shrink-0 cursor-pointer"
                              title="Nghe phát âm chuẩn AI"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                            💡 <strong>Mẹo bản xứ:</strong> {currentReflex.tip}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeStudioTab === 'bino' && (
                  <motion.div
                    key="bino-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex-1 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0071e3] dark:text-sky-400 bg-[#0071e3]/10 px-3 py-1 rounded-full">
                        {BINO_SUBSTITUTION_DATA.chapter}
                      </span>
                      <button
                        onClick={() => {
                          const nextState = !isPassivePlaying;
                          setIsPassivePlaying(nextState);
                          if (nextState) {
                            speakEnglish(currentVariation.fullEn);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isPassivePlaying
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isPassivePlaying ? <Pause size={12} /> : <Play size={12} />}
                        <span>{isPassivePlaying ? 'Đang phát thụ động' : 'Bật nghe thụ động'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Ngữ cảnh hội thoại 2 nhân vật
                      </div>
                      <div className="space-y-2 text-xs">
                        {BINO_SUBSTITUTION_DATA.dialogueContext.map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="font-extrabold text-[#0071e3] dark:text-sky-400 w-12 shrink-0">
                              {line.speaker}:
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                {line.en}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                                {line.vi}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Repeat size={13} className="text-[#0071e3]" />
                        <span>Chọn cụm từ để biến hóa câu nói (Substitution Drilling):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {BINO_SUBSTITUTION_DATA.variations.map((v) => {
                          const isSel = v.id === selectedVariationId;
                          return (
                            <button
                              key={v.id}
                              onClick={() => {
                                setSelectedVariationId(v.id);
                                speakEnglish(v.fullEn);
                              }}
                              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-[#0071e3]/12 border-[#0071e3] text-slate-900 dark:text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0071e3]/40'
                              }`}
                            >
                              <div className="text-xs font-bold text-[#0071e3] dark:text-sky-400">
                                + {v.chip}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {v.chipVi}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          "{currentVariation.fullEn}"
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {currentVariation.fullVi}
                        </div>
                      </div>
                      <button
                        onClick={() => speakEnglish(currentVariation.fullEn)}
                        className="p-2.5 rounded-xl bg-[#0071e3] text-white hover:bg-[#0077ED] transition-colors shrink-0 cursor-pointer shadow-xs"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeStudioTab === 'vocab' && (
                  <motion.div
                    key="vocab-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex-1 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                        {currentCard.topic}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{cardIndex + 1}/{OXFORD_CARDS.length}</span>
                        <button
                          onClick={() => {
                            setCardIndex((prev) => (prev + 1) % OXFORD_CARDS.length);
                            setIsCardFlipped(false);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </div>

                    <div
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-[#0d1424] dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-md cursor-pointer hover:border-emerald-500/50 transition-all min-h-[170px] flex flex-col justify-center text-center space-y-2 relative"
                    >
                      <div className="absolute top-3 right-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {isCardFlipped ? 'Mặt sau (Nghĩa)' : 'Mặt trước (Bấm lật)'}
                      </div>

                      {!isCardFlipped ? (
                        <>
                          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currentCard.word}
                          </div>
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {currentCard.ipa}
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {currentCard.pos}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-base font-extrabold text-slate-900 dark:text-white">
                            {currentCard.meaning}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 italic">
                            "{currentCard.exampleEn}"
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {currentCard.exampleVi}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Quên (1)', time: 'Ngay', color: 'bg-rose-500/10 text-rose-600' },
                        { label: 'Khó (2)', time: '1 ngày', color: 'bg-amber-500/10 text-amber-600' },
                        { label: 'Tốt (3)', time: '4 ngày', color: 'bg-sky-500/10 text-[#0071e3]' },
                        { label: 'Dễ (4)', time: '10 ngày', color: 'bg-emerald-500/10 text-emerald-600' }
                      ].map((btn, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl text-center text-xs font-bold ${btn.color}`}
                        >
                          <div>{btn.label}</div>
                          <div className="text-[10px] opacity-80">{btn.time}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeStudioTab === 'toeic' && (
                  <motion.div
                    key="toeic-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex-1 flex flex-col justify-between text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                        {TOEIC_MINI_SAMPLE.part} • Câu {TOEIC_MINI_SAMPLE.questionNumber}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {TOEIC_MINI_SAMPLE.question}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {TOEIC_MINI_SAMPLE.options.map((opt) => {
                        const isSelected = selectedToeicOption === opt.key;
                        const isCorrect = opt.key === TOEIC_MINI_SAMPLE.correctKey;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setSelectedToeicOption(opt.key)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="mr-2 font-mono">({opt.key})</span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedToeicOption && (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {TOEIC_MINI_SAMPLE.options.find((o) => o.key === selectedToeicOption)?.reason}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
