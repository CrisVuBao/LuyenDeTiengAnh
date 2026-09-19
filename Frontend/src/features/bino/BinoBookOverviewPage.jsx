import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Sparkles, Flame, CheckCircle2, Play, 
  ChevronRight, Volume2, Video, ArrowRight, BookMarked,
  Award, Clock, Layers, Star, Compass, ListMusic
} from 'lucide-react';
import binoApi from '../../api/binoApi';
import PageLoader from '../../components/PageLoader';
import BinoPlaylistModal from './components/BinoPlaylistModal';
import toast from 'react-hot-toast';

export default function BinoBookOverviewPage() {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlistInitialIds, setPlaylistInitialIds] = useState(null);
  const [playlistAutoStart, setPlaylistAutoStart] = useState(false);
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

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Hero Banner Sách Bino */}
      <div className="glass-card p-6 md:p-10 rounded-3xl relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-blue-600/10 border border-amber-200/70 dark:border-amber-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1.5 shadow-sm">
                <Sparkles size={14} className="text-amber-600" /> Tác giả Bino
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                12 Chương • 72 Bài Hội Thoại
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Video 1:1 & Audio Riêng
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Chém Tiếng Anh <span className="text-gradient from-amber-500 to-orange-600">Không Cần Động Não</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Phương pháp phản xạ ngôn ngữ tự nhiên: Học từ vựng theo giấy note ghim, luyện nói 1:1 nhập vai với Bino, nghe ngấm Shadowing và tích hợp bộ thẻ nhớ thông minh Spaced Repetition (SRS).
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => openPlaylistWith(null, true)}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-xs sm:text-sm transition-all active:scale-95"
              >
                <ListMusic size={17} />
                <span>Nghe Toàn Bộ ({book?.totalLessonsCount || 34} Bài)</span>
              </button>

              <button
                onClick={() => openPlaylistWith(null, false)}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md shadow-amber-500/25 flex items-center gap-2 text-xs sm:text-sm transition-all active:scale-95"
              >
                <ListMusic size={16} />
                <span>Chọn Bài Nghe Cùng Lúc</span>
              </button>

              <button
                onClick={() => navigate('/bino/dialogue/3')}
                className="px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs sm:text-sm shadow-sm transition-all active:scale-95"
              >
                <Play size={15} fill="currentColor" className="text-amber-500" /> Bài Mẫu (Hội thoại 3)
              </button>

              <button
                onClick={() => navigate('/bino/reader')}
                className="px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs sm:text-sm shadow-sm transition-all active:scale-95"
              >
                <BookMarked size={16} className="text-blue-500" /> Mở Ebook
              </button>

              <button
                onClick={() => navigate('/bino/flashcards')}
                className="px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs sm:text-sm shadow-sm transition-all active:scale-95"
              >
                <Layers size={16} className="text-emerald-500" /> Ôn Từ Vựng (SRS)
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="w-full md:w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tiến độ của bạn</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {book?.completedLessonsCount || 0}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ {book?.totalLessonsCount || 72} bài</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${book?.progressPercentage || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Hoàn thành</span>
                <span className="text-orange-600 dark:text-orange-400">{book?.progressPercentage || 0}%</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Chương 1 có đủ Video + Audio + Key words</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Layout: Sidebar chapters list + Active chapter dialogues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 12 Chapters Tab List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Compass size={16} className="text-blue-500" /> 12 Chương Học Tập
            </h2>
            <span className="text-xs text-slate-400 font-bold">{book?.chapters?.length || 12} chương</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {book?.chapters?.map((chap) => {
              const isSelected = chap.chapterNumber === selectedChapter;
              return (
                <div
                  key={chap.id}
                  onClick={() => setSelectedChapter(chap.chapterNumber)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
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
                      <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {chap.titleVi || 'Chào hỏi & Làm quen'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
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
              {/* Chapter Header Card */}
              <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>CHƯƠNG {activeChapter.chapterNumber < 10 ? `0${activeChapter.chapterNumber}` : activeChapter.chapterNumber}</span>
                    <span>•</span>
                    <span>6 BÀI HỘI THOẠI</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {activeChapter.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeChapter.titleVi || activeChapter.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const chapterDialogueIds = activeChapter.dialogues?.map(d => d.id) || [];
                      openPlaylistWith(chapterDialogueIds, true);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                    title={`Phát liên tục tất cả các bài hội thoại của Chương ${activeChapter.chapterNumber}`}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Nghe Cả Chương {activeChapter.chapterNumber}</span>
                  </button>

                  {activeChapter.hasBonus && (
                    <button
                      onClick={() => navigate(`/bino/chapter/${activeChapter.chapterNumber}/bonus`)}
                      className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>Góc Tiếng Lóng</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dialogues Grid (6 lessons) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeChapter.dialogues?.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/bino/dialogue/${d.id}`)}
                    className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 cursor-pointer group transition-all shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          HỘI THOẠI {d.dialogueNumber}
                        </span>
                        {d.isCompleted ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} /> Đã xong
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                            <Clock size={12} /> ~3 phút
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {d.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {d.situationDescription || d.titleVi || 'Tình huống giao tiếp thực tế'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Video size={12} className="text-blue-500" /> Video 1:1
                        </span>
                        <span className="flex items-center gap-1">
                          <Volume2 size={12} className="text-emerald-500" /> Audio
                        </span>
                      </div>

                      <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500 group-hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                        <span>Học ngay</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
}
