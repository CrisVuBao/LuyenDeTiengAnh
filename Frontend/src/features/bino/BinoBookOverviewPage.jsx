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
    <div className="w-full min-w-0 max-w-6xl mx-auto pb-24 md:pb-16">
      <SeoMeta
        title="Giao Tiếp Thực Chiến"
        description="Chinh phục 12 chương, 72 bài hội thoại tiếng Anh đời thực với phương pháp phản xạ tương tác 1:1, Substitution Drilling và Flashcard FSRS."
      />

      {loading && <PageLoader />}

      {/* ========================================================================= */}
      {/* 📱 1. MOBILE NATIVE APP VIEW (< lg / block lg:hidden)                    */}
      {/* Gọn nhẹ, trực quan, 0 rối mắt — Trải nghiệm chuẩn App Mobile thực thụ    */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-4 px-1 pb-4">
        {/* 1.1 Mobile Hero Card: Compact & Glanceable */}
        <div className="duo-card p-4 rounded-3xl bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 border-2 border-blue-200 dark:border-blue-800/80 border-b-6 border-b-[#0071e3] shadow-md space-y-3 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent" />

          {/* Header row: Badge + Progress */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 dark:bg-sky-500/20 text-[#0071e3] dark:text-sky-300 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={11} className="animate-duo-bounce" />
              <span>12 CHƯƠNG • 72 HỘI THOẠI</span>
            </div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              Đã học: <strong className="text-[#0071e3] dark:text-sky-400">{book?.completedLessonsCount || 0}/{book?.totalLessonsCount || 72}</strong> ({book?.progressPercentage || 0}%)
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              Giao Tiếp Thực Chiến
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Luyện nói 1:1 nhập vai cùng Leo &amp; phản xạ câu tự nhiên
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="bg-[#0071e3] dark:bg-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, book?.progressPercentage || 0)}%` }}
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => openPlaylistWith(null, true)}
              className="duo-btn duo-btn-sapphire duo-btn-sm font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <ListMusic size={14} className="shrink-0" />
              <span className="truncate">Nghe 72 Bài</span>
            </button>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="duo-btn duo-btn-white duo-btn-sm font-black flex items-center justify-center gap-1.5 text-[#0071e3] dark:text-sky-400 cursor-pointer shadow-xs"
            >
              <Lightbulb size={14} className="shrink-0" />
              <span>Cách Học 4 Bước</span>
            </button>
          </div>
        </div>

        {/* 1.2 Sticky Chapter Selector Carousel */}
        <div className="sticky top-14 z-30 -mx-1 px-1 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Compass size={13} className="text-[#0071e3]" /> CHỌN CHƯƠNG ({book?.chapters?.length || 12})
            </span>
            <span className="text-[10px] text-[#0071e3] dark:text-sky-400 font-black">
              Vuốt ngang ➔
            </span>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth snap-x w-full"
            style={{ scrollbarWidth: 'none' }}
          >
            {book?.chapters?.map((chap) => {
              const isSelected = chap.chapterNumber === selectedChapter;
              return (
                <button
                  key={chap.id}
                  onClick={() => setSelectedChapter(chap.chapterNumber)}
                  className={`relative px-3 py-1.5 rounded-2xl text-xs font-black transition-all shrink-0 snap-start flex items-center gap-2 cursor-pointer border-2 border-b-4 ${
                    isSelected
                      ? 'bg-[#0071e3] text-white border-[#0055b3] border-b-[#003d80] shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 border-b-slate-300 dark:border-b-slate-950 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                  </span>

                  <div className="text-left">
                    <div className="truncate max-w-[100px] text-[11px] font-black leading-tight">
                      {chap.title}
                    </div>
                    <div
                      className={`text-[9px] font-bold leading-tight ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {chap.completedLessons}/{chap.totalLessons} bài
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1.3 Chapter Focus Card (Tiêu điểm chương đang chọn) */}
        {activeChapter && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-950 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#0071e3] dark:text-sky-400 uppercase tracking-wider">
                  <span>CHƯƠNG {activeChapter.chapterNumber < 10 ? `0${activeChapter.chapterNumber}` : activeChapter.chapterNumber}</span>
                  <span>•</span>
                  <span>{activeChapter.completedLessons || 0}/{activeChapter.totalLessons || 6} BÀI XONG</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                  {activeChapter.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  {activeChapter.titleVi || activeChapter.description}
                </p>
              </div>

              <button
                onClick={() => {
                  const chapterDialogueIds = activeChapter.dialogues?.map((d) => d.id) || [];
                  openPlaylistWith(chapterDialogueIds, true);
                }}
                className="duo-btn duo-btn-sapphire duo-btn-xs font-black shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                title={`Phát liên tục Chương ${activeChapter.chapterNumber}`}
              >
                <Play size={12} fill="currentColor" />
                <span className="whitespace-nowrap">Nghe Ch.{activeChapter.chapterNumber}</span>
              </button>
            </div>

            {/* Compact Search Bar */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học theo tên hoặc số bài..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* 1.4 Danh Sách Bài Học Dạng Mobile App Rows */}
        <div className="space-y-2">
          {filteredDialogues.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                Không tìm thấy bài học nào phù hợp với "{searchQuery}"
              </p>
            </div>
          ) : (
            filteredDialogues.map((d) => (
              <div
                key={d.id}
                onMouseEnter={() => binoApi.prefetchDialogue(d.id)}
                onClick={() => navigate(`/communication/dialogue/${d.id}`)}
                className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer active:translate-y-0.5 active:border-b-2 shadow-xs ${
                  d.isCompleted
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 border-b-4 border-b-emerald-400 dark:border-b-emerald-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-950 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                      d.isCompleted
                        ? 'bg-[#58cc02] text-white border-b-2 border-[#46a302]'
                        : 'bg-[#0071e3] text-white border-b-2 border-[#0055b3]'
                    }`}
                  >
                    {d.isCompleted ? (
                      <CheckCircle2 size={18} className="text-white" />
                    ) : (
                      <span>{d.dialogueNumber < 10 ? `0${d.dialogueNumber}` : d.dialogueNumber}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {d.title}
                      </h4>
                      {d.isCompleted && (
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 shrink-0">
                          Xong
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                      {d.titleVi || d.situationDescription || 'Tình huống giao tiếp thực tế'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      <span>{d.vocabularyCount || 5} từ vựng</span>
                      <span>•</span>
                      <span className="text-[#0071e3] dark:text-sky-400">Video 1:1 &amp; Audio</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${
                      d.isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-950 text-[#0071e3] dark:text-sky-400'
                    }`}
                  >
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 1.5 Thẻ Mở Rộng Cuối Chương (Bonus Card Tinh Gọn) */}
        {activeChapter?.hasBonus && (
          <div
            onMouseEnter={() => binoApi.prefetchBonus(activeChapter.chapterNumber)}
            onClick={() => navigate(`/communication/chapter/${activeChapter.chapterNumber}/bonus`)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-200 dark:border-amber-800/80 border-b-4 border-b-[#f59e0b] dark:border-b-[#d97706] flex items-center justify-between gap-3 cursor-pointer shadow-xs active:translate-y-0.5 active:border-b-2 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0 border-b-2 border-amber-600 shadow-2xs">
                <Star size={17} className="fill-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                  GÓC CUỐI CHƯƠNG {activeChapter.chapterNumber}
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  Mẫu Câu Mở Rộng &amp; Mindset Leo
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Section B, C &amp; bài viết tư duy giao tiếp
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-300">
              <span>Xem</span>
              <ArrowRight size={13} />
            </div>
          </div>
        )}

        {/* 1.6 Tiện Ích Nhanh Đáy Trang */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => navigate('/communication/flashcards')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-950 flex items-center gap-2.5 text-left cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-lime-500 text-white flex items-center justify-center shrink-0 border-b-2 border-lime-700">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                Ôn Từ Vựng
              </h5>
              <p className="text-[10px] text-slate-400 truncate">Thẻ FSRS</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/communication/reader')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-950 flex items-center gap-2.5 text-left cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shrink-0 border-b-2 border-[#0055b3]">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                Đọc Ebook
              </h5>
              <p className="text-[10px] text-slate-400 truncate">Giáo trình gốc</p>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 2. DESKTOP & TABLET VIEW (>= lg / hidden lg:block)                     */}
      {/* Giữ nguyên toàn bộ Hero Pavilion, 12 Chương Sidebar và Card Chi Tiết      */}
      {/* ========================================================================= */}
      <div className="hidden lg:block space-y-6 lg:space-y-8">
        {/* ========================================================================= */}
        {/* 1. HAUTE COUTURE HERO PAVILION — GLACIER SAPPHIRE PEARL × ROYAL SAPPHIRE  */}
        {/* ========================================================================= */}
        <div
          className="relative overflow-hidden rounded-3xl sm:rounded-[36px] p-4 sm:p-7 lg:p-8 bg-[#f0f7ff] dark:bg-[#07162b] border-2 border-[#1cb0f6]/40 dark:border-blue-700/50 border-b-6 border-b-[#0071e3] dark:border-b-[#1e40af] shadow-[0_14px_40px_rgba(0,113,227,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] mb-3 sm:mb-4 w-full min-w-0 max-w-full"
        >
        {/* Top Diamond Rim */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent" />

        {/* Subtle Ambient Orbs */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#1cb0f6]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#0071e3]/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6 relative z-10 min-w-0">
          <div className="space-y-3 sm:space-y-3.5 max-w-2xl w-full min-w-0">
            
            {/* Badges Ribbon */}
            <div className="flex items-center justify-between sm:justify-start sm:flex-wrap gap-2 min-w-0">
              <div className="duo-pill duo-pill-gem text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                <Sparkles size={12} className="text-[#0071e3] dark:text-sky-400" />
                <span>SPEAKING • 12 CHƯƠNG</span>
              </div>

              <div className="duo-pill duo-pill-xp text-[10px] sm:text-xs font-black shrink-0">
                <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{book?.totalLessonsCount || 72} Bài Luyện Phản Xạ</span>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 dark:bg-blue-950 text-[#0062cc] dark:text-sky-300 border border-blue-200 dark:border-blue-900">
                Mục B, C &amp; Mindset
              </span>
            </div>

            {/* Duolingo Chunky Headline & Concise Description */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-[32px] font-black tracking-tight leading-snug">
                <span className="text-slate-900 dark:text-white">
                  Giao Tiếp Thực Chiến:
                </span>{' '}
                <span className="text-[#0071e3] dark:text-[#1cb0f6]">
                  Phản Xạ Tiếng Anh Tức Thì.
                </span>
              </h1>

              <p className="line-clamp-1 sm:line-clamp-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
                Phương pháp phản xạ ngôn ngữ tự nhiên: Học từ vựng theo giấy note ghim, luyện nói 1:1 nhập vai với Leo, đổi ruột câu thông minh &amp; nắm vững trọn bộ mẫu câu giao tiếp đời thực.
              </p>
            </div>

            {/* Mobile-Only Compact Duolingo Progress Card (< lg) */}
            <div className="flex lg:hidden items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0c182c] border-2 border-blue-200 dark:border-blue-900 border-b-4 border-b-blue-300 dark:border-b-blue-950 shadow-xs min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <CheckCircle2 size={15} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {book?.completedLessonsCount || 0}/{book?.totalLessonsCount || 72} bài
                </span>
              </div>

              <div className="flex-1 max-w-[150px] bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 min-w-[50px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, book?.progressPercentage || 0)}%` }}
                  className="bg-[#0071e3] dark:bg-sky-400 h-full rounded-full"
                />
              </div>

              <span className="duo-pill duo-pill-xp text-[10px] font-black shrink-0">
                {book?.progressPercentage || 0}%
              </span>
            </div>

            {/* Tactile 3D Action Buttons */}
            <div className="space-y-2 pt-0.5 min-w-0">
              {/* Primary Action Row: 2-col on mobile, side-by-side on sm+ */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center sm:flex-wrap gap-2 min-w-0">
                {/* Nút Nghe Toàn Bộ - Sapphire 3D Push Button */}
                <button
                  onClick={() => openPlaylistWith(null, true)}
                  className="duo-btn duo-btn-sapphire duo-btn-sm sm:duo-btn-md font-black flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md w-full sm:w-auto min-w-0"
                >
                  <ListMusic size={15} className="shrink-0" />
                  <span className="truncate sm:hidden">Nghe Toàn Bộ</span>
                  <span className="truncate hidden sm:inline">Nghe Toàn Bộ ({book?.totalLessonsCount || 72} Bài)</span>
                </button>

                {/* Nút Hướng Dẫn - White 3D Push Button */}
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black flex items-center justify-center gap-1.5 text-[#0071e3] dark:text-sky-400 cursor-pointer shadow-xs whitespace-nowrap w-full sm:w-auto shrink-0"
                >
                  <Lightbulb size={15} className="shrink-0" />
                  <span>Cách Học</span>
                </button>

                {/* Desktop Secondary Buttons */}
                <button
                  onClick={() => openPlaylistWith(null, false)}
                  className="hidden sm:inline-flex duo-btn duo-btn-white duo-btn-md font-black items-center gap-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ListMusic size={14} className="shrink-0 text-[#0071e3] dark:text-sky-400" />
                  <span>Chọn Bài Nghe</span>
                </button>

                <button
                  onClick={() => navigate('/communication/flashcards')}
                  className="hidden sm:inline-flex duo-btn duo-btn-white duo-btn-md font-black items-center gap-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Layers size={14} className="text-[#0071e3] dark:text-sky-400" />
                  <span>Ôn Từ Vựng (SRS)</span>
                </button>

                <button
                  onClick={() => navigate('/communication/dialogue/3')}
                  className="hidden sm:inline-flex duo-btn duo-btn-white duo-btn-md font-black items-center gap-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Play size={13} fill="currentColor" className="text-[#0071e3] dark:text-sky-400" />
                  <span>Bài Mẫu #3</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right (Desktop lg: only): Compact Duolingo 3D Progress Card */}
          <div className="hidden lg:flex w-72 rounded-2xl bg-white dark:bg-[#0c182c] border-2 border-blue-200 dark:border-blue-900 border-b-6 border-b-blue-400 dark:border-b-blue-950 p-5 flex-col justify-between space-y-3.5 shrink-0 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tiến độ lộ trình
              </span>
              <span className="duo-pill duo-pill-xp text-xs font-black">
                {book?.progressPercentage || 0}%
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <AnimatedCounter value={book?.completedLessonsCount || 0} />
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                / {book?.totalLessonsCount || 72} bài hoàn tất
              </span>
            </div>

            {/* Chunky Duolingo Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, book?.progressPercentage || 0)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="bg-[#0071e3] dark:bg-sky-400 h-full rounded-full"
              />
            </div>

            <div className="flex text-xs text-slate-600 dark:text-slate-400 items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
              <CheckCircle2 size={14} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
              <span>12 Chương • 72 Bài Chuẩn Thực Chiến</span>
            </div>
          </div>
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
      </div>

      {/* Cẩm Nang Hướng Dẫn Cách Học 4 Bước VBace */}
      <BinoLearningGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
