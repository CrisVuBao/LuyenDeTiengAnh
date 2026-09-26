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
import BinoPlaylistModal from './components/BinoPlaylistModal';
import BinoLearningGuideModal from './components/BinoLearningGuideModal';
import toast from 'react-hot-toast';

export default function BinoBookOverviewPage() {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlistInitialIds, setPlaylistInitialIds] = useState(null);
  const [playlistAutoStart, setPlaylistAutoStart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const navigate = useNavigate();

  const openPlaylistWith = (ids = null, autoStart = false) => {
    setPlaylistInitialIds(ids);
    setPlaylistAutoStart(autoStart);
    setIsPlaylistOpen(true);
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
        toast.error('Không thể tải thông tin sách Bino');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

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
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-16 px-1 sm:px-0">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER SÁCH BINO - ULTRA SHARP & FULL RESPONSIVE */}
      {/* ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card p-5 sm:p-8 md:p-10 rounded-3xl relative overflow-hidden bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-blue-600/10 border border-amber-200/80 dark:border-amber-900/40 shadow-xl"
      >
        {/* Glow ambient background circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3.5 max-w-2xl">
            {/* Tag Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1.5 shadow-sm border border-amber-300/60 dark:border-amber-800">
                <Sparkles size={13} className="text-amber-600 dark:text-amber-400 animate-pulse" /> Tác giả Bino
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {book?.totalChapters || 12} Chương • {book?.totalLessonsCount || 72} Bài Học
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-flex">
                Đầy Đủ 12 Chương + Mục B, C & Philosophy
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Chém Tiếng Anh <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Không Cần Động Não</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Phương pháp phản xạ ngôn ngữ tự nhiên: Học từ vựng theo giấy note ghim, luyện nói 1:1 nhập vai với Bino, vận dụng đổi từ Substitution Drilling, kèm đầy đủ Mẫu câu mở rộng (Section B) & Bino's Philosophy cuối mỗi chương.
            </p>

            {/* Quick Action Buttons - Grid 2 cols on mobile, flex on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 pt-2">
              {/* Nút Nghe Toàn Bộ - Tràn rộng nổi bật */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openPlaylistWith(null, true)}
                className="col-span-2 sm:col-span-1 px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
              >
                <ListMusic size={17} className="animate-pulse" />
                <span>Nghe Toàn Bộ ({book?.totalLessonsCount || 72} Bài)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openPlaylistWith(null, false)}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all"
              >
                <ListMusic size={15} />
                <span>Chọn Bài Nghe</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/bino/dialogue/3')}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-sm transition-all"
              >
                <Play size={14} fill="currentColor" className="text-amber-500" />
                <span>Bài Mẫu (Hội thoại 3)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/bino/reader')}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-sm transition-all"
              >
                <BookMarked size={15} className="text-blue-500" />
                <span>Mở Ebook</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/bino/flashcards')}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-sm transition-all"
              >
                <Layers size={15} className="text-emerald-500" />
                <span>Ôn Từ Vựng (SRS)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsGuideModalOpen(true)}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all"
              >
                <Lightbulb size={16} className="text-white animate-pulse" />
                <span>Cách Học 4 Bước 💡</span>
              </motion.button>
            </div>
          </div>

          {/* Progress Mini Card */}
          <div className="w-full lg:w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex flex-col justify-between space-y-4 shrink-0">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiến độ bài học</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {book?.progressPercentage || 0}%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {book?.completedLessonsCount || 0}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ {book?.totalLessonsCount || 72} bài hoàn thành</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${book?.progressPercentage || 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-medium">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>Trọn bộ 12 Chương từ Ebook TiengAnhBi</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. MOBILE HORIZONTAL CHAPTERS SWIPE CAROUSEL (< lg) */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Compass size={14} className="text-blue-500" /> Chọn Chương ({book?.chapters?.length || 12})
          </span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
            Vuốt ngang để chọn ➔
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 custom-scrollbar scroll-smooth snap-x">
          {book?.chapters?.map((chap) => {
            const isSelected = chap.chapterNumber === selectedChapter;
            return (
              <button
                key={chap.id}
                onClick={() => setSelectedChapter(chap.chapterNumber)}
                className={`relative px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 snap-start flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                </span>

                <div className="text-left">
                  <div className="truncate max-w-[120px]">{chap.title}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {chap.completedLessons}/{chap.totalLessons} bài
                  </div>
                </div>

                {isSelected && (
                  <motion.div 
                    layoutId="activeMobilePill"
                    className="absolute inset-0 rounded-2xl border-2 border-blue-400 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
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
                <motion.div
                  key={chap.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedChapter(chap.chapterNumber)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30'
                      : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}
                    </span>
                    <div className="truncate">
                      <h4 className="font-bold text-xs sm:text-sm truncate">{chap.title}</h4>
                      <p className={`text-[11px] truncate font-vietsub ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {chap.titleVi || 'Chào hỏi & Làm quen'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {chap.completedLessons}/{chap.totalLessons}
                    </span>
                    <ChevronRight size={15} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chapter Dialogues (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeChapter && (
            <div className="space-y-4">
              
              {/* Chapter Header Card with Search & Actions */}
              <div className="glass-card p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col gap-3.5">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-vietsub mt-0.5">
                      {activeChapter.titleVi || activeChapter.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const chapterDialogueIds = activeChapter.dialogues?.map(d => d.id) || [];
                        openPlaylistWith(chapterDialogueIds, true);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                      title={`Phát liên tục tất cả bài học Chương ${activeChapter.chapterNumber}`}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Nghe Cả Chương {activeChapter.chapterNumber}</span>
                    </motion.button>

                    {activeChapter.hasBonus && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/bino/chapter/${activeChapter.chapterNumber}/bonus`)}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500/15 to-orange-500/15 dark:from-amber-950/80 dark:to-orange-950/80 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-800 dark:text-amber-300 rounded-xl font-black text-xs border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Star size={13} className="text-amber-500 fill-amber-500" />
                        <span>Mục B, C & Philosophy</span>
                      </motion.button>
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
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Dialogues Grid with Framer Motion Staggered Entrance */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`${activeChapter.chapterNumber}-${searchQuery}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, staggerChildren: 0.05 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                >
                  {filteredDialogues.length === 0 ? (
                    <div className="col-span-full p-8 text-center glass-card rounded-3xl border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 font-bold">Không tìm thấy bài học phù hợp với từ khóa "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredDialogues.map((d, index) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/bino/dialogue/${d.id}`)}
                        className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer group transition-all shadow-sm hover:shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                              {activeChapter.chapterNumber === 12 ? `BÀI HỌC ${d.dialogueNumber}` : `HỘI THOẠI ${d.dialogueNumber}`}
                            </span>
                            {d.isCompleted ? (
                              <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={13} /> Đã xong
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                <Clock size={12} /> {d.vocabularyCount || 5} từ vựng
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                            {d.title}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-vietsub">
                            {d.situationDescription || d.titleVi || 'Tình huống giao tiếp thực tế'}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 text-slate-400 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Video size={12} className="text-blue-500" /> Video 1:1
                            </span>
                            <span className="flex items-center gap-1">
                              <Volume2 size={12} className="text-emerald-500" /> Audio
                            </span>
                          </div>

                          <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                            <span>Học ngay</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Prominent End-of-Chapter Bonus Card (Section B: More expressions, Section C: Practise speaking & Bino's Philosophy) */}
              {activeChapter.hasBonus && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/bino/chapter/${activeChapter.chapterNumber}/bonus`)}
                  className="glass-card p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 border-2 border-amber-300/80 dark:border-amber-700/60 cursor-pointer shadow-md hover:shadow-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                        <Star size={11} className="fill-white" /> Nội Dung Cuối Chương {activeChapter.chapterNumber < 10 ? `0${activeChapter.chapterNumber}` : activeChapter.chapterNumber}
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        Section B (More Expressions) • Section C (Practise Speaking) • Bino's Philosophy #{activeChapter.chapterNumber}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Tổng Hợp Mẫu Câu Mở Rộng, Luyện Nói Cùng Bino & Tâm Sự Cuối Chương {activeChapter.chapterNumber}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-vietsub">
                      Đầy đủ 100% nội dung cuối chương từ sách Ebook: Các cấu trúc mở rộng theo chủ đề, ví dụ song ngữ, hướng dẫn luyện nói và bài viết Bino's Philosophy #{activeChapter.chapterNumber}.
                    </p>
                  </div>

                  <button className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0">
                    <span>Xem Toàn Bộ Cuối Chương</span>
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trình phát Playlist liên tục & Chọn bài nghe */}
      <BinoPlaylistModal
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        book={book}
        initialSelectedIds={playlistInitialIds}
        autoStart={playlistAutoStart}
      />

      {/* Cẩm Nang Hướng Dẫn Cách Học 4 Bước Bino */}
      <BinoLearningGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
