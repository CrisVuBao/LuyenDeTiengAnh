import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Sparkles, Flame, CheckCircle2, Play, 
  ChevronRight, Volume2, Video, ArrowRight, BookMarked,
  Award, Clock, Layers, Star, Compass, ListMusic,
  Search, Filter, Check, Lightbulb
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import { useBinoPlayerStore } from './components/BinoPlaylistModal';
import BinoLearningGuideModal from './components/BinoLearningGuideModal';
import SeoMeta from '../../components/SeoMeta';
import toast from 'react-hot-toast';
import LuxurySpotlightCard from '../../components/luxury/LuxurySpotlightCard';
import AnimatedCounter from '../../components/luxury/AnimatedCounter';

export default function BinoBookOverviewPage() {
  const [book, setBook] = useState(() => binoApi.peekBookOverview());
  const [loading, setLoading] = useState(() => !binoApi.peekBookOverview());
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const navigate = useNavigate();
  const openPlaylist = useBinoPlayerStore((state) => state.openPlaylist);

  const openPlaylistWith = (ids = null, autoStart = false) => {
    openPlaylist({ ids, autoStart, minimized: false, book });
  };

  useEffect(() => {
    binoApi.getBookOverview()
      .then((res) => {
        if (res?.data) {
          setBook(res.data);
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy thông tin sách:', err);
        toast.error('Không thể tải thông tin giáo trình Giao Tiếp Thực Chiến');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading && !book) return <PageLoader />;

  const activeChapter = book?.chapters?.find(c => c.chapterNumber === selectedChapter) || book?.chapters?.[0];

  // Lọc bài học theo tìm kiếm (nếu có nhập)
  const filteredDialogues = activeChapter?.dialogues?.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.titleVi?.toLowerCase().includes(q) ||
      d.situationDescription?.toLowerCase().includes(q) ||
      d.dialogueNumber?.toString() === q
    );
  }) || [];

  return (
    <div className="space-y-4 sm:space-y-8 max-w-6xl mx-auto pb-12 sm:pb-16">
      <SeoMeta
        title="Giao Tiếp Thực Chiến"
        description="Chinh phục 12 chương, 72 bài hội thoại tiếng Anh đời thực với phương pháp phản xạ tương tác 1:1, Substitution Drilling và Flashcard FSRS."
      />

      {loading && <PageLoader />}
      
      {/* ========================================================================= */}
      {/* 1. HAUTE COUTURE HERO PAVILION — APPLE x DIOR x HERMÈS AESTHETIC          */}
      {/* ========================================================================= */}
      <LuxurySpotlightCard
        spotlightColor="rgba(0, 113, 227, 0.08)"
        borderColor="rgba(0, 113, 227, 0.22)"
        hoverLift={false}
        className="rounded-2xl sm:rounded-[38px] p-4 sm:p-9 lg:p-10 shadow-[0_12px_45px_rgb(0,0,0,0.03)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] mb-1 sm:mb-2"
      >
        {/* Subtle decorative background circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-blue-500/[0.06] dark:bg-blue-500/[0.04] rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-sky-400/[0.06] dark:bg-sky-400/[0.04] rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-8 relative z-10">
          <div className="space-y-2.5 sm:space-y-4 max-w-2xl w-full">
            
            {/* Atelier Monogram Ribbon Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/90 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/90 dark:border-white/10 shadow-2xs">
                <span className="text-[#0071e3] font-serif">✦</span>
                <span className="tracking-[0.2em] text-[10px] uppercase font-bold text-[#0071e3] dark:text-sky-400">
                  ENGLISH
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Édition 2026</span>
              </div>

              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-slate-100/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {book?.totalChapters || 12} Chương • {book?.totalLessonsCount || 72} Bài Học
              </span>

              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-[#0071e3] dark:text-sky-400 border border-blue-500/20 hidden sm:inline-flex">
                Mục B, C &amp; Mindset
              </span>
            </div>

            {/* Apple Pro Blue Typography */}
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.18]">
              <span className="text-slate-950 dark:text-white">
                Giao Tiếp Thực Chiến:
              </span>{' '}
              <span className="bg-gradient-to-r from-[#0071e3] to-sky-500 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent font-bold">
                Phản Xạ Tiếng Anh Tức Thì.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-xl line-clamp-2 sm:line-clamp-none">
              Phương pháp phản xạ ngôn ngữ tự nhiên: Học từ vựng theo giấy note ghim, luyện nói 1:1 nhập vai với Leo, vận dụng đổi từ Substitution Drilling, kèm đầy đủ Mẫu câu mở rộng (Section B) &amp; VBaceEnglish Mindset cuối mỗi chương.
            </p>

            {/* Tactile Button Row (Sapphire Blue #0071e3 + Glass Pills) */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Nút Nghe Toàn Bộ - Sapphire Blue */}
                <button
                  onClick={() => openPlaylistWith(null, true)}
                  className="px-5 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-xs sm:text-sm shadow-[0_4px_18px_rgba(0,113,227,0.32)] border border-white/20 dark:border-transparent flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <ListMusic size={16} className="shrink-0" />
                  <span>Nghe Toàn Bộ ({book?.totalLessonsCount || 72} Bài)</span>
                </button>

                {/* Nút Hướng Dẫn - Blue Tint Capsule */}
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="px-4 py-3 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-[#0071e3] dark:text-sky-400 border border-blue-500/30 font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Lightbulb size={15} className="text-[#0071e3] dark:text-sky-400 fill-current" />
                  <span>Cách Học 4 Bước 💡</span>
                </button>

                {/* Secondary Pill Buttons */}
                <button
                  onClick={() => openPlaylistWith(null, false)}
                  className="px-4 py-3 rounded-full bg-white/90 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all cursor-pointer"
                >
                  <ListMusic size={14} className="shrink-0 inline mr-1 text-[#0071e3]" />
                  <span>Chọn Bài Nghe</span>
                </button>

                <button
                  onClick={() => navigate('/communication/flashcards')}
                  className="hidden sm:inline-flex px-4 py-3 rounded-full bg-white/90 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all cursor-pointer items-center gap-1.5"
                >
                  <Layers size={14} className="text-[#0071e3]" />
                  <span>Ôn Từ Vựng (SRS)</span>
                </button>

                <button
                  onClick={() => navigate('/communication/dialogue/3')}
                  className="hidden sm:inline-flex px-4 py-3 rounded-full bg-white/90 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all cursor-pointer items-center gap-1.5"
                >
                  <Play size={13} fill="currentColor" className="text-[#0071e3]" />
                  <span>Bài Mẫu #3</span>
                </button>
              </div>

              {/* Mobile Swipe Strip for Secondary Actions */}
              <div className="flex sm:hidden items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar pb-0.5 pt-1">
                <button
                  onClick={() => navigate('/communication/flashcards')}
                  className="px-3.5 py-2 rounded-full bg-white/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-white/10 flex items-center gap-1.5 shrink-0"
                >
                  <Layers size={12} className="text-[#0071e3]" />
                  <span>Ôn Từ Vựng SRS</span>
                </button>
                <button
                  onClick={() => navigate('/communication/dialogue/3')}
                  className="px-3.5 py-2 rounded-full bg-white/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-white/10 flex items-center gap-1.5 shrink-0"
                >
                  <Play size={12} fill="currentColor" className="text-[#0071e3]" />
                  <span>Bài Mẫu #3</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Mini Capsule (Apple Activity Style - Sapphire Blue) */}
          <div className="w-full lg:w-72 rounded-[28px] bg-white/90 dark:bg-white/[0.04] backdrop-blur-xl p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Tiến độ lộ trình
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-[#0071e3] dark:text-sky-400 border border-blue-500/20">
                {book?.progressPercentage || 0}%
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                <AnimatedCounter value={book?.completedLessonsCount || 0} />
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {book?.totalLessonsCount || 72} bài hoàn tất
              </span>
            </div>

            {/* Apple Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, book?.progressPercentage || 0)}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-[#0071e3] to-sky-400 h-full rounded-full"
                />
              </div>
            </div>

            <div className="flex text-[11px] text-slate-500 dark:text-slate-400 items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.06] font-medium">
              <CheckCircle2 size={13} className="text-[#0071e3] shrink-0" />
              <span>12 Chương • 72 Bài Chuẩn Thực Chiến</span>
            </div>
          </div>
        </div>
      </LuxurySpotlightCard>


      {/* ========================================================================= */}
      {/* 2. MOBILE HORIZONTAL CHAPTERS SWIPE CAROUSEL (< lg) - LUXURY PILLS */}
      {/* ========================================================================= */}
      <div className="block lg:hidden sticky top-14 z-30 -mx-3 px-3 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Compass size={13} className="text-[#0071e3]" /> Chọn Chương ({book?.chapters?.length || 12})
          </span>
          <span className="text-[10px] text-[#0071e3] dark:text-sky-400 font-bold">
            Vuốt ngang ➔
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar scroll-smooth snap-x">
          {book?.chapters?.map((chap) => {
            const isSelected = chap.chapterNumber === selectedChapter;
            return (
              <button
                key={chap.id}
                onClick={() => setSelectedChapter(chap.chapterNumber)}
                className={`relative px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 snap-start flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-[0_4px_16px_rgba(0,113,227,0.3)]'
                    : 'bg-white/90 dark:bg-[#0c101a]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                }`}>
                  {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                </span>

                <div className="text-left">
                  <div className="truncate max-w-[110px] text-[11px] font-medium leading-tight">{chap.title}</div>
                  <div className={`text-[9px] font-mono leading-tight ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {chap.completedLessons}/{chap.totalLessons} bài
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CURRICULUM LAYOUT (Desktop 2 cols, Mobile 1 col) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 12 Chapters Vertical List (Visible on lg: screens) */}
        <div className="hidden lg:block lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Compass size={15} className="text-blue-500" /> 12 Chương Học Tập
            </h2>
            <span className="text-xs text-slate-400 font-bold">{book?.chapters?.length || 12} chương</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1.5 custom-scrollbar">
            {book?.chapters?.map((chap) => {
              const isSelected = chap.chapterNumber === selectedChapter;
              return (
                <div
                  key={chap.id}
                  onClick={() => setSelectedChapter(chap.chapterNumber)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-150 hover:-translate-y-0.5 border flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                    </span>
                    <div className="truncate">
                      <h4 className="font-bold text-xs sm:text-sm truncate">{chap.title}</h4>
                      <p className={`text-[11px] truncate font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {chap.titleVi || 'Chào hỏi & Làm quen'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {chap.completedLessons}/{chap.totalLessons}
                    </span>
                    <ChevronRight size={15} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chapter Dialogues (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeChapter && (
            <div className="space-y-4">
              
              {/* Chapter Header Card with Search & Actions */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <span>CHƯƠNG {activeChapter.chapterNumber < 10 ? `0${activeChapter.chapterNumber}` : activeChapter.chapterNumber}</span>
                      <span>•</span>
                      <span>
                        {activeChapter.dialogues?.length || 6} {activeChapter.chapterNumber === 12 ? 'BÀI CHUYÊN ĐỀ TỪ VỰNG' : 'BÀI HỘI THOẠI'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {activeChapter.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                      {activeChapter.titleVi || activeChapter.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        const chapterDialogueIds = activeChapter.dialogues?.map(d => d.id) || [];
                        openPlaylistWith(chapterDialogueIds, true);
                      }}
                      className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 bg-[#0071e3] hover:bg-[#0077ED] dark:bg-sky-500 dark:hover:bg-sky-400 text-white rounded-xl font-bold text-xs shadow-[0_4px_14px_rgba(0,113,227,0.25)] flex items-center gap-1.5 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                      title={`Phát liên tục tất cả bài học Chương ${activeChapter.chapterNumber}`}
                    >
                      <Play size={13} fill="currentColor" className="shrink-0" />
                      <span className="truncate">Nghe Chương {activeChapter.chapterNumber}</span>
                    </button>

                    {activeChapter.hasBonus && (
                      <button
                        onMouseEnter={() => binoApi.prefetchBonus(activeChapter.chapterNumber)}
                        onClick={() => navigate(`/communication/chapter/${activeChapter.chapterNumber}/bonus`)}
                        className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 rounded-xl font-black text-xs border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 transition-all duration-150 hover:-translate-y-0.5 shadow-2xs cursor-pointer"
                      >
                        <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                        <span className="truncate">Mục B, C & Mindset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Search filter bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh bài học theo tên, số bài hoặc tình huống..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Dialogues Grid - Siêu nét, rõ ràng, không mờ chữ hay sương mù */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredDialogues.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Không tìm thấy bài học phù hợp với từ khóa "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredDialogues.map((d) => (
                    <div
                      key={d.id}
                      onMouseEnter={() => binoApi.prefetchDialogue(d.id)}
                      onClick={() => navigate(`/communication/dialogue/${d.id}`)}
                      className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-400 cursor-pointer group transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {activeChapter.chapterNumber === 12 ? `BÀI HỌC ${d.dialogueNumber}` : `HỘI THOẠI ${d.dialogueNumber}`}
                          </span>
                          {d.isCompleted ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={13} className="text-emerald-500" /> Đã xong
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" /> {d.vocabularyCount || 5} từ vựng
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                          {d.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {d.situationDescription || d.titleVi || 'Tình huống giao tiếp thực tế'}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                          <span className="flex items-center gap-1">
                            <Video size={12} className="text-blue-500" /> Video 1:1
                          </span>
                          <span className="flex items-center gap-1">
                            <Volume2 size={12} className="text-emerald-500" /> Audio
                          </span>
                        </div>

                        <button className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 shadow-2xs border border-amber-200/80 dark:border-amber-800/80 group-hover:border-transparent">
                          <span>Học ngay</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Prominent End-of-Chapter Bonus Card */}
              {activeChapter.hasBonus && (
                <div
                  onMouseEnter={() => binoApi.prefetchBonus(activeChapter.chapterNumber)}
                  onClick={() => navigate(`/communication/chapter/${activeChapter.chapterNumber}/bonus`)}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300/80 dark:border-amber-700/60 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                        <Star size={11} className="fill-white" /> Nội Dung Cuối Chương {activeChapter.chapterNumber < 10 ? `0${activeChapter.chapterNumber}` : activeChapter.chapterNumber}
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        Section B (More Expressions) • Section C (Practise Speaking) • VBace&apos;s Mindset #{activeChapter.chapterNumber}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Tổng Hợp Mẫu Câu Mở Rộng, Luyện Nói Cùng Leo &amp; Góc Tư Duy Cuối Chương {activeChapter.chapterNumber}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Đầy đủ 100% nội dung cuối chương từ giáo trình Ebook: Các cấu trúc mở rộng theo chủ đề, ví dụ song ngữ, hướng dẫn luyện nói và bài viết VBace&apos;s Mindset #{activeChapter.chapterNumber}.
                    </p>
                  </div>

                  <button className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <span>Xem Toàn Bộ Cuối Chương</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cẩm Nang Hướng Dẫn Cách Học 4 Bước VBace */}
      <BinoLearningGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
