import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Headphones,
  MessageSquare,
  Layers,
  Zap,
  BookOpen,
  Brain,
  Trophy,
  Flame,
  ShieldCheck,
  Volume2,
  RotateCw,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Target,
  Compass,
  Award,
  Clock,
  Repeat,
  Wand2,
  Check,
  RefreshCw,
  Radio,
  BarChart3
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

// ============================================================================
// REAL PROJECT DATA FOR INTERACTIVE LIVE STUDIO
// ============================================================================

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

const PILLARS = [
  {
    id: 'bino',
    badge: 'TRỤ CỘT 01 • GIAO TIẾP THỰC CHIẾN',
    title: 'Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì',
    subtitle: '12 Chương • 72 Bài Hội Thoại • 688 Câu Thoại Đời Thực',
    description:
      'Giáo trình hội thoại tương tác độc quyền của VBaceEnglish. Không học vẹt từng câu rời rạc — bạn được đặt vào 72 ngữ cảnh đời thực, đóng vai 1:1 cùng AI Studio, biến hóa 1 mẫu câu gốc thành hàng chục câu giao tiếp và tắm ngôn ngữ thụ động mọi lúc.',
    accent: 'from-[#0071e3] to-sky-500',
    lightBg: 'bg-blue-500/10 text-[#0071e3] dark:text-sky-400',
    borderHover: 'hover:border-[#0071e3]/50',
    stats: [
      { label: 'Chương học', value: '12' },
      { label: 'Bài hội thoại', value: '72' },
      { label: 'Câu thoại chuẩn', value: '688' },
      { label: 'VBace Mindset', value: '12' }
    ],
    features: [
      'Substitution Drilling: Thay thế cụm từ linh hoạt để nói hàng chục câu từ 1 cấu trúc gốc',
      'Nghe thụ động (Passive Listening): Tự động phát liên tục ngay cả khi khóa màn hình điện thoại',
      'Lưu từ & mẫu câu khó vào bộ thẻ nhớ ngắt quãng SM-2 chỉ với 1 chạm',
      '12 chuyên đề Góc Tư Duy VBace (VBace’s Mindset) về ngữ pháp ứng dụng & văn hóa bản xứ'
    ]
  },
  {
    id: 'reflex',
    badge: 'TRỤ CỘT 02 • PHẢN XẠ TỐC ĐỘ CAO',
    title: 'Phản Xạ Nói - Viết 50 Chủ Đề (1.500 Câu)',
    subtitle: '5 Chuyên Đề Lớn • 50 Units • Thử Thách 3 Giây Vàng',
    description:
      'Xóa bỏ hoàn toàn căn bệnh "dịch từng từ trong đầu rồi mới dám nói". Hệ thống ép não bộ bật ra câu tiếng Anh trong vòng 3 giây đếm ngược kết hợp phương pháp Chunking (tư duy theo cụm từ), giúp miệng bạn nói nhanh như phản xạ tiếng Việt.',
    accent: 'from-indigo-600 to-violet-500',
    lightBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    borderHover: 'hover:border-indigo-500/50',
    stats: [
      { label: 'Chuyên đề', value: '05' },
      { label: 'Chủ đề (Units)', value: '50' },
      { label: 'Câu thông dụng', value: '1.500' },
      { label: 'Phản xạ chuẩn', value: '3 Giây' }
    ],
    features: [
      'Phòng Phản Xạ Nói 3 Giây: Nhìn câu tiếng Việt, bật câu tiếng Anh trước khi hết giờ',
      'Phương pháp Chunking: Tách câu dài thành các cụm ý nghĩa dễ nhớ, dễ ghép nối',
      'Chế độ Luyện Viết & Dịch Câu: Kiểm tra độ chính xác từng từ và cấu trúc câu',
      'Tích hợp chấm điểm tự đánh giá mức độ trôi chảy & theo dõi tiến độ từng Unit'
    ]
  },
  {
    id: 'vocab',
    badge: 'TRỤ CỘT 03 • TỪ VỰNG CỐT LÕI',
    title: '3000 Từ Vựng Tiếng Anh Oxford Theo 60 Chủ Đề',
    subtitle: '60 Chủ Đề Thiết Thực • Flashcard 3D • Trắc Nghiệm Tốc Độ',
    description:
      'Hệ thống hóa kho từ vựng cốt lõi nhất theo chuẩn Oxford thành 60 chủ đề đời sống & công việc. Kết hợp hình ảnh 3D Flashcard lật mượt mà, phiên âm IPA, âm thanh bản xứ và bài kiểm tra Quiz giúp bạn nhớ sâu mà không bao giờ nhàm chán.',
    accent: 'from-emerald-600 to-teal-500',
    lightBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-500/50',
    stats: [
      { label: 'Chủ đề Oxford', value: '60' },
      { label: 'Từ vựng cốt lõi', value: '1.760+' },
      { label: 'Chế độ học', value: '3D + Quiz' },
      { label: 'Phát âm', value: 'AI Native' }
    ],
    features: [
      'Flashcard 3D Flip tương tác mượt mà với đầy đủ IPA, từ loại, nghĩa và câu ví dụ thực tế',
      'Bộ lọc thông minh: Học từ chưa thuộc, ôn tập từ đã thuộc hoặc Reset từng chủ đề độc lập',
      'Chế độ Quiz trắc nghiệm tức thì giúp củng cố trí nhớ ngắn hạn sang dài hạn',
      'Tự động lưu trạng thái bộ lọc và tiến độ % hoàn thành trên từng chủ đề'
    ]
  },
  {
    id: 'toeic',
    badge: 'TRỤ CỘT 04 • LUYỆN ĐỀ',
    title: 'Phòng Luyện Đề TOEIC Chuẩn ETS',
    subtitle: 'Trọn Bộ Parts 1–7 • Paraphrase Mapping',
    description:
      'Mô phỏng phòng thi TOEIC thực tế với đầy đủ 7 Parts (Listening & Reading).',
    accent: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-500/50',
    stats: [
      { label: 'Cấu trúc đề', value: 'Parts 1-7' },
      // { label: 'Gia sư hỗ trợ', value: 'Gemini AI' },
      { label: 'Bóc tách bẫy', value: 'Paraphrase' },
      { label: 'Đánh dấu câu', value: '2 Chế độ' }
    ],
    features: [
      'Giao diện làm bài chia đôi màn hình (Split-Screen) chuẩn kỳ thi TOEIC quốc tế',
      'Đánh dấu câu hỏi thông minh: Phân loại câu "Chắc chắn" và câu "Phân vân" cần xem lại',
      'Paraphrase Mapping: Đối chiếu trực quan cụm từ trong câu hỏi và cụm từ đồng nghĩa trong bài'
      // 'Hỏi Gia sư AI Gemini ngay tại câu sai để nhận giải thích ngữ pháp & từ vựng chi tiết'
    ]
  }
];

const FAQ_ITEMS = [
  {
    q: 'Mình mất gốc hoặc biết từ vựng nhưng không phản xạ nói được thì nên bắt đầu từ đâu?',
    a: 'Bạn nên bắt đầu ngay với Trụ cột 1 (Giáo trình 72 Bài Hội Thoại Thực Chiến) kết hợp Trụ cột 2 (Phản xạ 3 giây). Mỗi ngày chỉ cần nghe thụ động 1 bài hội thoại thực tế và luyện bật câu trong 3 giây với 15–20 câu thông dụng, não bộ sẽ hình thành phản xạ nói tự nhiên mà không cần ghép ngữ pháp phức tạp.'
  },
  {
    q: 'Tính năng "Nghe thụ động khi tắt màn hình" hoạt động như thế nào?',
    a: 'VBaceEnglish tích hợp công nghệ Media Session API hiện đại. Khi bạn bật chế độ Nghe Thụ Động trong Giáo trình 72 Hội Thoại, hệ thống sẽ tự động đọc tuần tự câu tiếng Anh và nghĩa tiếng Việt, tự chuyển câu tiếp theo ngay cả khi bạn chuyển sang ứng dụng khác hoặc khóa màn hình điện thoại bỏ vào túi.'
  },
  {
    q: 'Phương pháp Substitution Drilling (Biến hóa mẫu câu) có tác dụng gì?',
    a: 'Thay vì học thuộc lòng 1 câu cố định, hệ thống giữ nguyên khung cấu trúc câu chuẩn của người bản xứ và cho phép bạn thay thế các cụm từ (danh từ, động từ, hoàn cảnh). Nhờ đó, học 1 câu bạn có thể tự tin nói được 10–20 câu khác nhau trong đời thực.'
  },
  {
    q: 'Hệ thống Gamification (Streak, XP, Nhiệm vụ ngày) giúp ích gì cho việc học?',
    a: 'Kẻ thù lớn nhất của việc học tiếng Anh là sự bỏ cuộc giữa chừng. Hệ thống Chuỗi ngày học (Streak), Lá chắn bảo vệ chuỗi, 50 Cấp độ từ Tân Binh đến Huyền Thoại, 4 Nhiệm vụ hàng ngày và Bảng xếp hạng Tuần sẽ biến mỗi buổi học 15 phút thành một thói quen gây nghiện đầy hứng khởi.'
  }
];

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mode, toggleTheme } = useThemeStore();

  // Interactive Studio State
  const [activeStudioTab, setActiveStudioTab] = useState('reflex'); // 'reflex' | 'bino' | 'vocab' | 'toeic'

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

  // 4. TOEIC + AI State
  const [selectedToeicOption, setSelectedToeicOption] = useState('B');

  // 5. Gamification Quests Interactive Demo State
  const [completedQuests, setCompletedQuests] = useState([1, 2]);

  // 6. FAQ State
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // Web Speech API Helper (GPU/CPU lightweight native TTS)
  const speakEnglish = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore TTS errors on unsupported browsers
    }
  }, []);

  // Cleanup speech & intervals on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Reflex 3-second countdown effect
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

  const handlePrimaryAction = () => {
    navigate(isAuthenticated ? '/home' : '/auth');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleQuestDemo = (id) => {
    setCompletedQuests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060913] text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-[#0071e3]/20 selection:text-[#0071e3] dark:selection:text-sky-400">
      {/* =====================================================================
          GPU-ACCELERATED ARCHITECTURAL AMBIENT BACKDROP
         ===================================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Subtle Architectural Grid */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.16]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(0, 113, 227, 0.16) 1px, transparent 0)',
            backgroundSize: '36px 36px'
          }}
        />
        {/* Top Radial Spotlight */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[980px] h-[520px] rounded-full bg-gradient-to-tr from-[#0071e3]/15 via-sky-400/10 to-indigo-500/10 blur-3xl will-change-transform" />
        <div className="absolute top-[38%] -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-emerald-500/10 via-sky-500/8 to-transparent blur-3xl will-change-transform" />
        <div className="absolute bottom-10 -left-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-[#0071e3]/8 to-transparent blur-3xl will-change-transform" />
      </div>

      {/* =====================================================================
          STICKY GLASSMORPHIC HEADER
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b101e]/80 backdrop-blur-xl border-b border-slate-200/75 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071e3] to-sky-500 text-white flex items-center justify-center shadow-[0_6px_18px_rgba(0,113,227,0.32)] group-hover:scale-105 transition-transform duration-200">
              <Sparkles size={19} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                VBaceEnglish
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">
                By Vũ Bảo Software
              </span>
            </div>
          </div>

          {/* Center Navigation Pills (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800">
            {[
              { label: 'Trải nghiệm Live', id: 'live-studio' },
              { label: '4 Trụ cột học tập', id: 'four-pillars' },
              { label: 'Công nghệ phản xạ', id: 'signature-tech' },
              { label: 'Đấu trường XP', id: 'gamification' }
              // { label: 'Lộ trình 15p/ngày', id: 'daily-roadmap' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800/90 transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Chuyển đổi giao diện Sáng/Tối"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-sky-400 transition-colors cursor-pointer"
              title={mode === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            >
              {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePrimaryAction}
              className="px-4 sm:px-5 py-2 bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs sm:text-sm font-semibold rounded-full shadow-[0_6px_20px_rgba(0,113,227,0.3)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isAuthenticated ? 'Vào phòng học' : 'Học ngay miễn phí'}</span>
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT
         ===================================================================== */}
      <main className="flex-1 relative z-10">
        {/* -------------------------------------------------------------------
            SECTION 1: ASYMMETRIC HERO + INTERACTIVE LIVE LEARNING STUDIO
           ------------------------------------------------------------------- */}
        <section id="live-studio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-16 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Narrative & Architectural Value Prop (7 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6 text-left"
            >
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                {/* <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]" />
                </span> */}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hệ sinh thái Phản xạ Giao tiếp
                </span>
              </div>

              {/* Breakthrough Headline */}
              <h1 className="text-4xl sm:text-5xl xl:text-[56px] font-black tracking-[-0.035em] leading-[1.08] text-slate-900 dark:text-white">
                Bật Tiếng Anh Tự Nhiên{' '}
                <span className="bg-gradient-to-r from-[#0071e3] via-sky-500 to-indigo-600 dark:from-sky-400 dark:via-[#38bdf8] dark:to-indigo-400 bg-clip-text text-transparent">
                  Không Cần Dịch Ngầm.
                </span>
                {/* <span className="block mt-2 text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-700 dark:text-slate-200 tracking-[-0.02em]">
                  Phản xạ trong 3 giây. Làm chủ mọi kỳ thi.
                </span> */}
              </h1>

              {/* Accurate Project Description */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
                Kết hợp trọn bộ <strong className="font-semibold text-slate-900 dark:text-white">72 bài hội thoại Giao Tiếp Thực Chiến</strong>, phòng luyện <strong className="font-semibold text-slate-900 dark:text-white">1.500 câu phản xạ Nói - Viết</strong>, kho <strong className="font-semibold text-slate-900 dark:text-white">3000 từ vựng Oxford 3D</strong> và <strong className="font-semibold text-slate-900 dark:text-white">Phòng luyện tập TOEIC ETS tích hợp</strong>
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: Headphones, text: 'Nghe thụ động khi tắt màn hình' },
                  { icon: Zap, text: 'Phản xạ nói 3 giây & Chunking' },
                  { icon: RotateCw, text: 'Flashcard 3D & Lặp lại ngắt quãng SM-2' }
                  // { icon: Wand2, text: 'Giải thích TOEIC bằng AI Gemini' }
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

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePrimaryAction}
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

              {/* Live Project Metrics Strip */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: '72 Bài', label: 'Giao tiếp thực chiến', sub: '12 Chương & 688 câu' },
                  { value: '1.500 Câu', label: 'Phản xạ Nói - Viết', sub: '50 Chủ đề thông dụng' },
                  { value: '60 Chủ Đề', label: 'Từ vựng Oxford 3D', sub: '1.760+ từ cốt lõi' }
                  // { value: 'Parts 1–7', label: 'Đề thi TOEIC ETS', sub: 'Trợ lý AI Gemini 24/7' }
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

            {/* Right Column: Interactive Live Learning Studio (6 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="rounded-[28px] bg-white/95 dark:bg-[#0d1424]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-[0_24px_60px_-15px_rgba(0,113,227,0.14)] overflow-hidden backdrop-blur-xl">
                {/* Studio Window Header */}
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

                {/* 4-Mode Interactive Switcher Tabs */}
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

                {/* Interactive Studio Body */}
                <div className="p-5 sm:p-6 min-h-[390px] flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {/* =========================================================
                        TAB 1: 3-SECOND SPEAKING REFLEX SIMULATOR
                       ========================================================= */}
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

                        {/* Vietnamese Prompt Box */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Thử thách: Hãy bật ra câu tiếng Anh trong 3 giây
                          </div>
                          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                            “{currentReflex.vi}”
                          </p>
                        </div>

                        {/* Chunking Hints */}
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

                        {/* Timer / Answer Reveal Box */}
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
                                      ? 'Đang đếm ngược... Hãy nói to bằng tiếng Anh!'
                                      : 'Sẵn sàng kiểm tra tốc độ phản xạ của bạn?'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Hệ thống sẽ tự động mở đáp án & phát âm mẫu sau 3 giây
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  onClick={startReflexChallenge}
                                  disabled={reflexCounting}
                                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Play size={13} />
                                  <span>{reflexCounting ? 'Đang chạy...' : 'Bắt đầu 3s'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setReflexCounting(false);
                                    setReflexRevealed(true);
                                    speakEnglish(currentReflex.en);
                                  }}
                                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                  Mở đáp án
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    Đáp án chuẩn bản xứ
                                  </div>
                                  <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                                    {currentReflex.en}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                    {currentReflex.ipa}
                                  </p>
                                </div>
                                <button
                                  onClick={() => speakEnglish(currentReflex.en)}
                                  className="p-2.5 rounded-xl bg-[#0071e3] text-white hover:bg-[#0077ED] shrink-0 cursor-pointer"
                                  title="Nghe phát âm chuẩn"
                                >
                                  <Volume2 size={16} />
                                </button>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                                <span className="text-slate-600 dark:text-slate-300">
                                  💡 {currentReflex.tip}
                                </span>
                                <button
                                  onClick={nextReflexSample}
                                  className="font-bold text-[#0071e3] dark:text-sky-400 hover:underline shrink-0 ml-2 cursor-pointer"
                                >
                                  Câu tiếp →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* =========================================================
                        TAB 2: BINO DIALOGUE & SUBSTITUTION DRILLING
                       ========================================================= */}
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
                              } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isPassivePlaying
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isPassivePlaying ? <Pause size={12} /> : <Headphones size={12} />}
                            <span>{isPassivePlaying ? 'Đang phát thụ động' : 'Nghe mẫu câu'}</span>
                          </button>
                        </div>

                        {/* Mini Dialogue Context */}
                        <div className="space-y-2">
                          {BINO_SUBSTITUTION_DATA.dialogueContext.map((line, idx) => (
                            <div
                              key={idx}
                              onClick={() => speakEnglish(line.en)}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-2 hover:border-[#0071e3]/40 transition-colors cursor-pointer"
                            >
                              <div className="text-xs space-y-0.5">
                                <span className="font-extrabold text-[#0071e3] dark:text-sky-400 mr-1.5">
                                  {line.speaker}:
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {line.en}
                                </span>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                  {line.vi}
                                </p>
                              </div>
                              <Volume2 size={14} className="text-slate-400 hover:text-[#0071e3] shrink-0 mt-0.5" />
                            </div>
                          ))}
                        </div>

                        {/* Interactive Substitution Drilling Matrix */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0071e3]/10 via-sky-500/5 to-transparent border border-[#0071e3]/25 space-y-3">
                          <div className="text-[11px] font-bold text-[#0071e3] dark:text-sky-400 uppercase tracking-wider">
                            ⚡ Substitution Drilling — Bấm cụm từ bên dưới để biến hóa câu:
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {BINO_SUBSTITUTION_DATA.variations.map((v) => {
                              const active = v.id === selectedVariationId;
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => {
                                    setSelectedVariationId(v.id);
                                    speakEnglish(v.fullEn);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    active
                                      ? 'bg-[#0071e3] text-white shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0071e3]/50'
                                  }`}
                                >
                                  + {v.chip}
                                </button>
                              );
                            })}
                          </div>

                          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                “{BINO_SUBSTITUTION_DATA.baseStem}{' '}
                                <span className="underline decoration-[#0071e3] decoration-2 text-[#0071e3] dark:text-sky-400">
                                  {currentVariation.chip}
                                </span>
                                .”
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                → {currentVariation.fullVi}
                              </p>
                            </div>
                            <button
                              onClick={() => speakEnglish(currentVariation.fullEn)}
                              className="p-2.5 rounded-xl bg-[#0071e3] text-white hover:bg-[#0077ED] shrink-0 cursor-pointer"
                              title="Nghe câu đã biến hóa"
                            >
                              <Volume2 size={15} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* =========================================================
                        TAB 3: 3000 OXFORD 3D FLASHCARD PREVIEW
                       ========================================================= */}
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
                          <div className="flex items-center gap-1.5">
                            {OXFORD_CARDS.map((c, idx) => (
                              <button
                                key={c.word}
                                onClick={() => {
                                  setCardIndex(idx);
                                  setIsCardFlipped(false);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                  idx === cardIndex
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {c.word}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive 3D Flip Card */}
                        <div
                          onClick={() => setIsCardFlipped((prev) => !prev)}
                          className="perspective-1000 w-full h-56 cursor-pointer select-none"
                        >
                          <div
                            className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${
                              isCardFlipped ? 'rotate-y-180' : ''
                            }`}
                          >
                            {/* Front Side */}
                            <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex flex-col justify-between border border-slate-700 shadow-lg">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                  {currentCard.pos}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakEnglish(currentCard.word);
                                  }}
                                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 size={16} />
                                </button>
                              </div>

                              <div className="text-center space-y-1">
                                <div className="text-3xl sm:text-4xl font-black tracking-tight">
                                  {currentCard.word}
                                </div>
                                <div className="text-sm text-sky-300 font-mono">
                                  {currentCard.ipa}
                                </div>
                              </div>

                              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium">
                                <RotateCw size={13} className="text-emerald-400" />
                                <span>Chạm vào thẻ để lật xem nghĩa & ví dụ (3D Flip)</span>
                              </div>
                            </div>

                            {/* Back Side */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 flex flex-col justify-between shadow-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                                  Nghĩa Tiếng Việt & Ngữ Cảnh
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakEnglish(currentCard.exampleEn);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Volume2 size={13} />
                                  <span>Nghe câu ví dụ</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div className="text-lg font-extrabold leading-snug">
                                  {currentCard.meaning}
                                </div>
                                <div className="p-3 rounded-xl bg-black/20 text-xs space-y-1">
                                  <p className="font-semibold text-white">“{currentCard.exampleEn}”</p>
                                  <p className="text-emerald-100">{currentCard.exampleVi}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-100">Đồng nghĩa:</span>
                                  {currentCard.synonyms.map((syn) => (
                                    <span
                                      key={syn}
                                      className="px-2 py-0.5 rounded-md bg-white/15 font-semibold"
                                    >
                                      {syn}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-emerald-100 underline">Chạm để lật lại</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Hỗ trợ đánh dấu "Đã thuộc", lọc từ khó và làm Quiz trắc nghiệm.</span>
                          <button
                            onClick={() => setIsCardFlipped((prev) => !prev)}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {isCardFlipped ? 'Xem mặt trước' : 'Lật mặt sau →'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* =========================================================
                        TAB 4: TOEIC ETS + AI GEMINI TUTOR PREVIEW
                       ========================================================= */}
                    {activeStudioTab === 'toeic' && (
                      <motion.div
                        key="toeic-tab"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3.5 flex-1 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                            {TOEIC_MINI_SAMPLE.part}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Question #{TOEIC_MINI_SAMPLE.questionNumber}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                            {TOEIC_MINI_SAMPLE.question}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {TOEIC_MINI_SAMPLE.options.map((opt) => {
                              const isSelected = selectedToeicOption === opt.key;
                              const isCorrect = opt.key === TOEIC_MINI_SAMPLE.correctKey;
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => setSelectedToeicOption(opt.key)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                                    isSelected
                                      ? isCorrect
                                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0071e3]'
                                  }`}
                                >
                                  <span>
                                    ({opt.key}) {opt.text}
                                  </span>
                                  {isSelected &&
                                    (isCorrect ? (
                                      <CheckCircle2 size={14} className="text-emerald-500" />
                                    ) : (
                                      <XCircle size={14} className="text-rose-500" />
                                    ))}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Instant AI Gemini Explanation + Paraphrase Mapping */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0071e3]/5 to-transparent border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Wand2 size={13} />
                              <span>Giải thích chi tiết đáp án:</span>
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Đáp án đúng: (B) by
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                            {
                              TOEIC_MINI_SAMPLE.options.find((o) => o.key === selectedToeicOption)
                                ?.reason
                            }
                          </p>
                          <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              🔗 Paraphrase Mapping:{' '}
                              <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[#0071e3] dark:text-sky-400">
                                {TOEIC_MINI_SAMPLE.paraphrase.original}
                              </code>{' '}
                              ⇔{' '}
                              <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                                {TOEIC_MINI_SAMPLE.paraphrase.mapped}
                              </code>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 2: THE 4 CORE PILLARS (ASYMMETRIC ARCHITECTURAL BENTO)
           ------------------------------------------------------------------- */}
        <section
          id="four-pillars"
          className="py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 text-xs font-bold uppercase tracking-wider">
                <BookOpen size={13} />
                <span>Hệ Sinh Thái Học Tập Toàn Diện</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                4 Trụ Cột Cốt Lõi Giúp Bạn Làm Chủ Tiếng Anh
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Mọi nội dung trong VBaceEnglish đều được thiết kế khớp nối chặt chẽ với nhau: từ nghe ngấm hội thoại thực tế, bật phản xạ nói trong 3 giây, xây nền từ vựng Oxford 3D đến chinh phục bài thi TOEIC chuẩn quốc tế.
              </p>
            </div>

            {/* 2x2 Architectural Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {PILLARS.map((pillar, index) => (
                <motion.div
                  key={pillar.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className={`group rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800/90 ${pillar.borderHover} p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,113,227,0.08)] transition-all flex flex-col justify-between space-y-6`}
                >
                  <div className="space-y-4">
                    {/* Pillar Badge & Index */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${pillar.lightBg}`}>
                        {pillar.badge}
                      </span>
                      <span className="text-xs font-black text-slate-400 dark:text-slate-600">
                        0{index + 1} / 04
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {pillar.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-[#0071e3] dark:text-sky-400">
                        {pillar.subtitle}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {pillar.description}
                    </p>

                    {/* 4 Mini Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {pillar.stats.map((st, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 text-center"
                        >
                          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            {st.value}
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {st.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Feature Checklist */}
                    <ul className="space-y-2.5 pt-2">
                      {pillar.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer Action */}
                  <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Tích hợp sẵn trong tài khoản học viên
                    </span>
                    <button
                      onClick={handlePrimaryAction}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071e3] dark:text-sky-400 group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <span>Vào học thôi</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 3: SIGNATURE TECHNOLOGY & NEUROSCIENCE METHOD
           ------------------------------------------------------------------- */}
        <section id="signature-tech" className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Brain size={13} />
              <span>Công Nghệ & Phương Pháp Độc Quyền</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Thiết Kế Dựa Trên Cơ Chế Tiếp Thu Ngôn Ngữ Tự Nhiên
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Không nhồi nhét lý thuyết khô khan. VBaceEnglish ứng dụng 4 công nghệ cốt lõi giúp rút ngắn 70% thời gian hình thành phản xạ tiếng Anh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1: Passive Listening Engine (7 cols) */}
            <div className="md:col-span-7 rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0c182d] to-slate-900 text-white p-7 sm:p-8 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
                  <Headphones size={13} />
                  <span>Media Session Background Audio</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">
                  Nghe Thụ Động Liên Tục Ngay Cả Khi Khóa Màn Hình
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tận dụng thời gian đi xe, tập thể dục hay trước khi ngủ để "tắm ngôn ngữ". Trình phát âm thanh thông minh tự động đọc tuần tự câu tiếng Anh và giải nghĩa tiếng Việt của 72 bài hội thoại thực chiến mà không cần bạn phải mở sáng màn hình điện thoại.
                </p>
              </div>

              {/* Animated Equalizer & Player Bar Mockup */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0071e3] flex items-center justify-center shrink-0">
                    <Headphones size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Đang phát: Chương 05 • Bài 29 (Hội thoại Thực Chiến)
                    </div>
                    <div className="text-[11px] text-sky-300">
                      Chế độ: Tự động chuyển câu • Hoạt động khi khóa máy
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-5 shrink-0">
                  <span className="w-1 bg-sky-400 rounded-full equalizer-bar" />
                  <span className="w-1 bg-[#0071e3] rounded-full equalizer-bar" />
                  <span className="w-1 bg-emerald-400 rounded-full equalizer-bar" />
                  <span className="w-1 bg-sky-300 rounded-full equalizer-bar" />
                </div>
              </div>
            </div>

            {/* Feature 2: SM-2 Spaced Repetition (5 cols) */}
            <div className="md:col-span-5 rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 p-7 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Repeat size={22} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Thuật Toán Lặp Lại Ngắt Quãng SM-2
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mọi từ vựng và mẫu câu bạn lưu trong lúc học hội thoại đều được đưa vào hàng đợi SM-2. Hệ thống tự động tính toán thời điểm não bộ sắp quên (1 ngày, 3 ngày, 7 ngày, 21 ngày) để nhắc bạn ôn tập đúng lúc.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { label: 'Quên', sub: 'Lặp lại ngay', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
                  { label: 'Khó', sub: '+1 ngày', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                  { label: 'Tốt', sub: '+4 ngày', color: 'bg-sky-500/10 text-[#0071e3] dark:text-sky-400' },
                  { label: 'Dễ', sub: '+10 ngày', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
                ].map((b, i) => (
                  <div key={i} className={`p-2 rounded-xl text-center ${b.color}`}>
                    <div className="text-xs font-extrabold">{b.label}</div>
                    <div className="text-[10px] opacity-85">{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 3: 3-Second Chunking Reflex (5 cols) */}
            <div className="md:col-span-5 rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 p-7 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock size={22} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Phản Xạ 3 Giây & Tư Duy Cụm Từ (Chunking)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Người bản xứ không ghép từng từ đơn lẻ khi nói — họ nói theo từng cụm cố định (Chunks). Giới hạn 3 giây giúp bạn vượt qua rào cản ngập ngừng và kích hoạt vùng ngôn ngữ phản xạ tức thì.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>Tốc độ bật câu trung bình sau 14 ngày:</span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black">
                  &lt; 2.4 giây
                </span>
              </div>
            </div>

            {/* Feature 4: AI Gemini & Paraphrase Mapping (7 cols) */}
            <div className="md:col-span-7 rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 p-7 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Wand2 size={13} />
                  <span>ETS Paraphrase Engine</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Phân Tích Bẫy Đề Thi TOEIC & Đối Chiếu Từ Đồng Nghĩa Tức Thì
                </h3>
                {/* <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Khi luyện đề TOEIC trên VBaceEnglish, bạn không chỉ biết đáp án Đúng/Sai. Hệ thống chỉ rõ từng cặp Paraphrase giữa bài đọc và câu hỏi, đồng thời cho phép bạn hỏi trực tiếp Gia sư AI Gemini để hiểu sâu bản chất ngữ pháp của từng câu.
                </p> */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: 'Chấm & Giải thích', desc: 'Phân tích lý do chọn và loại trừ từng đáp án A, B, C, D' },
                  { title: 'Paraphrase Mapping', desc: 'Highlight từ khóa tương đương giữa đoạn văn & câu hỏi' },
                  { title: 'Chắc chắn / Phân vân', desc: 'Đánh dấu trạng thái tâm lý khi làm bài để ôn tập trúng đích' }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 4: GAMIFICATION & ARENA SHOWCASE
           ------------------------------------------------------------------- */}
        <section
          id="gamification"
          className="py-20 lg:py-24 border-y border-slate-200/70 dark:border-slate-800/80 bg-gradient-to-b from-white/70 to-slate-100/60 dark:from-[#0a0f1d] dark:to-[#060913]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Gamification Description (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Trophy size={13} />
                  <span>Hệ Thống Gamification Đỉnh Cao</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  Biến Việc Học Tiếng Anh Mỗi Ngày Thành Trò Chơi Đầy Hứng Khởi
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mỗi câu hội thoại bạn đọc, mỗi thẻ từ vựng bạn lật và mỗi đề TOEIC bạn hoàn thành đều được quy đổi thành điểm kinh nghiệm (XP), giúp bạn thăng cấp qua 50 Level và đua Top trên Bảng xếp hạng Tuần.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      icon: Flame,
                      color: 'text-orange-500 bg-orange-500/10',
                      title: 'Chuỗi Ngày Học (Daily Streak) & Streak Freeze',
                      desc: 'Duy trì lửa học tập liên tục mỗi ngày kèm Lá chắn bảo vệ chuỗi khi bạn có việc đột xuất.'
                    },
                    {
                      icon: Award,
                      color: 'text-[#0071e3] bg-[#0071e3]/10',
                      title: '50 Cấp Độ & Danh Hiệu Vinh Quang',
                      desc: 'Thăng tiến từ Tân Binh Ngôn Ngữ → Chiến Binh Phản Xạ → Bậc Thầy Bản Xứ → Huyền Thoại.'
                    },
                    {
                      icon: Target,
                      color: 'text-emerald-500 bg-emerald-500/10',
                      title: '4 Nhiệm Vụ Hàng Ngày (Daily Quests)',
                      desc: 'Mục tiêu rõ ràng, vừa sức mỗi ngày giúp bạn tích lũy XP và xây dựng kỷ luật bền vững.'
                    }
                  ].map((g, i) => {
                    const Icon = g.icon;
                    return (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${g.color}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {g.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {g.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Interactive Gamification HUD Preview (7 cols) */}
              <div className="lg:col-span-7">
                <div className="rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xl space-y-6">
                  {/* Top Player Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0071e3] to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                        LV.18
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">
                            Chiến Binh Phản Xạ
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 text-[11px] font-bold">
                            2.450 / 3.000 XP
                          </span>
                        </div>
                        {/* XP Progress Bar */}
                        <div className="w-48 sm:w-64 h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#0071e3] to-sky-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="px-3.5 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-black text-sm">
                        <Flame size={17} className="fill-orange-500 text-orange-500" />
                        <span>14 Ngày Streak</span>
                      </div>
                      <div
                        className="px-3 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-1.5 text-[#0071e3] dark:text-sky-400 font-bold text-xs"
                        title="Lá chắn bảo vệ chuỗi ngày học"
                      >
                        <ShieldCheck size={16} />
                        <span>2 Freeze</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Daily Quests + Mini Leaderboard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Interactive Quests (7 cols) */}
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nhiệm vụ hàng ngày (Bấm thử để nhận XP)
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Hoàn thành {completedQuests.length}/4
                        </span>
                      </div>

                      {[
                        { id: 1, title: 'Hoàn thành 1 bài Hội thoại Thực Chiến', xp: '+50 XP' },
                        { id: 2, title: 'Vượt qua 15 câu Phản xạ nói 3 giây', xp: '+40 XP' },
                        { id: 3, title: 'Ôn tập 20 thẻ từ vựng Oxford 3D / SRS', xp: '+30 XP' },
                        { id: 4, title: 'Giải 10 câu TOEIC Part 5 không sai', xp: '+60 XP' }
                      ].map((quest) => {
                        const done = completedQuests.includes(quest.id);
                        return (
                          <div
                            key={quest.id}
                            onClick={() => toggleQuestDemo(quest.id)}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              done
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0071e3]/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 text-xs font-bold">
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                                  done
                                    ? 'bg-emerald-500 text-white'
                                    : 'border border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {done && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className={done ? 'line-through opacity-75' : ''}>
                                {quest.title}
                              </span>
                            </div>
                            <span className="text-[11px] font-extrabold text-[#0071e3] dark:text-sky-400 shrink-0">
                              {quest.xp}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Weekly Leaderboard Preview (5 cols) */}
                    <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <BarChart3 size={14} className="text-amber-500" />
                          <span>Đấu Trường Tuần</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Top Học Viên
                        </span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { rank: 1, name: 'Minh Anh', xp: '3.420 XP', badge: '🥇' },
                          { rank: 2, name: 'Hoàng Bảo', xp: '3.180 XP', badge: '🥈' },
                          { rank: 3, name: 'Bạn (Dự kiến)', xp: '2.950 XP', badge: '🥉', highlight: true }
                        ].map((u) => (
                          <div
                            key={u.rank}
                            className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                              u.highlight
                                ? 'bg-[#0071e3]/12 border border-[#0071e3]/30 font-bold text-[#0071e3] dark:text-sky-300'
                                : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{u.badge}</span>
                              <span>{u.name}</span>
                            </div>
                            <span className="font-extrabold">{u.xp}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                        Cập nhật thời gian thực theo từng bài học hoàn thành
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 5: 15-MINUTE DAILY ROUTINE ROADMAP
           ------------------------------------------------------------------- */}
        {/* <section id="daily-roadmap" className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={13} />
              <span>Lộ Trình Học Thông Minh</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Công Thức 15 Phút Mỗi Ngày Để Bứt Phá Toàn Diện
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Không cần ngồi hàng giờ mệt mỏi. Chỉ cần thực hiện đều đặn chu trình 4 bước khép kín dưới đây mỗi ngày trên VBaceEnglish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: 'BƯỚC 01 • 4 PHÚT',
                title: 'Ngấm Hội Thoại Thực Chiến',
                desc: 'Nghe và đọc 1 bài hội thoại đời thực trong bộ 72 bài Giao Tiếp. Dùng Substitution Drilling để biến hóa mẫu câu theo ý bạn.',
                color: 'from-[#0071e3] to-sky-500'
              },
              {
                step: 'BƯỚC 02 • 4 PHÚT',
                title: 'Bật Phản Xạ 3 Giây',
                desc: 'Luyện 15 câu giao tiếp thông dụng với đồng hồ đếm ngược 3 giây để rèn tốc độ bật tiếng Anh không cần dịch.',
                color: 'from-indigo-600 to-violet-500'
              },
              {
                step: 'BƯỚC 03 • 3 PHÚT',
                title: 'Lật Thẻ Từ Oxford 3D',
                desc: 'Chinh phục 10–15 từ vựng mới theo chủ đề Oxford bằng Flashcard 3D và ôn lại các thẻ đến hạn SM-2.',
                color: 'from-emerald-600 to-teal-500'
              },
              {
                step: 'BƯỚC 04 • 4 PHÚT',
                title: 'Luyện TOEIC & Nhận XP',
                desc: 'Giải nhanh 1 cụm câu hỏi TOEIC, xem phân tích từ Gia sư AI Gemini và hoàn thành trọn vẹn 4 Nhiệm vụ ngày.',
                color: 'from-amber-500 to-orange-500'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-[26px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:-translate-y-1 transition-transform"
              >
                <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${item.color}`} />
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="text-xs font-bold text-[#0071e3] dark:text-sky-400 flex items-center gap-1">
                  <span>Chu trình khép kín #{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* -------------------------------------------------------------------
            SECTION 6: FREQUENTLY ASKED QUESTIONS (ACCORDION)
           ------------------------------------------------------------------- */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Giải đáp chi tiết về phương pháp học và các tính năng trên VBaceEnglish
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0071e3]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/70 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 7: HIGH-CONVERSION FINAL CTA BANNER
           ------------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
          <div className="rounded-[32px] bg-gradient-to-r from-[#0071e3] via-sky-600 to-indigo-700 text-white p-8 sm:p-12 lg:p-14 shadow-[0_24px_60px_-15px_rgba(0,113,227,0.45)] relative overflow-hidden">
            <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold">
                <Sparkles size={14} />
                <span>Sẵn sàng nâng cấp phản xạ tiếng Anh của bạn ngay hôm nay?</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Bắt Đầu Hành Trình Bật Tiếng Anh Tự Nhiên Cùng VBaceEnglish
              </h2>
              <p className="text-sm sm:text-base text-sky-100 leading-relaxed max-w-2xl mx-auto">
                Trải nghiệm đầy đủ 72 bài hội thoại Giao Tiếp Thực Chiến, 1.500 câu Phản xạ Nói - Viết, 60 chủ đề từ vựng Oxford 3D và Phòng luyện đề TOEIC.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePrimaryAction}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-[#0071e3] hover:bg-sky-50 font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isAuthenticated ? 'Vào Trang Chủ Học Tập' : 'Tạo Tài Khoản & Học Ngay'}</span>
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          ARCHITECTURAL FOOTER
         ===================================================================== */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#080c17] py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={17} />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                VBaceEnglish
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                By Vũ Bảo Software
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button onClick={() => scrollToSection('live-studio')} className="hover:text-[#0071e3] cursor-pointer">
              Trải nghiệm trực tiếp
            </button>
            <button onClick={() => scrollToSection('four-pillars')} className="hover:text-[#0071e3] cursor-pointer">
              4 Trụ cột học tập
            </button>
            <button onClick={() => scrollToSection('signature-tech')} className="hover:text-[#0071e3] cursor-pointer">
              Công nghệ phản xạ
            </button>
            <button onClick={() => scrollToSection('gamification')} className="hover:text-[#0071e3] cursor-pointer">
              Gamification
            </button>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 text-center sm:text-right">
            © 2026 VBaceEnglish — By Vũ Bảo Software. Thiết kế đột phá & tối ưu hiệu năng.
          </div>
        </div>
      </footer>
    </div>
  );
}
