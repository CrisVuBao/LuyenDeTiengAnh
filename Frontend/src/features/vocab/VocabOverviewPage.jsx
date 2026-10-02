import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, BookOpen, Layers, CheckCircle2, 
  Star, Trophy, ArrowRight, Play, Volume2, Filter, Zap, RotateCcw,
  Activity, Sun, Compass, Hash, ShoppingBag, Moon, HeartHandshake,
  UtensilsCrossed, TreePine, Sofa, Cross, Laptop, Home, Store,
  Gamepad2, Plane, MoonStar, Building2, Heart, PlaneTakeoff, HeartPulse,
  Salad, Clock, Car, Smile, UserCheck, Coffee, Flower2, Film, Award,
  Gift, Utensils, Music, Hotel, GraduationCap, Palette, CloudSun, Shirt,
  Footprints, School, Users, Apple, Cat, Bug, BookMarked, Sprout,
  Globe2, Fish, Briefcase, Flame, Navigation, BedDouble, Mail, Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import useVocabStore from './store/useVocabStore';
import SeoMeta from '../../components/SeoMeta';
import FsrsMemoryShieldCard from './components/FsrsMemoryShieldCard';

// Map icon string to Lucide component
const ICON_COMPONENT_MAP = {
  BookOpen, Activity, Sun, Compass, Hash, ShoppingBag, Moon, HeartHandshake,
  UtensilsCrossed, Sparkles, TreePine, Sofa, Cross, Laptop, Home, Store,
  Gamepad2, Plane, MoonStar, Trophy, Building2, Heart, PlaneTakeoff, HeartPulse,
  Salad, Clock, Car, Smile, UserCheck, Coffee, Flower2, Film, Award,
  Gift, Utensils, Music, Hotel, GraduationCap, Palette, CloudSun, Shirt,
  Footprints, School, Users, Apple, Cat, Bug, BookMarked, Sprout,
  Globe2, Fish, Zap, Briefcase, Flame, Navigation, BedDouble, Mail, Landmark
};

export default function VocabOverviewPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'learning', 'completed', 'starred'
  const [topicToReset, setTopicToReset] = useState(null);

  const { 
    topics, 
    totalWords, 
    masteredWords, 
    starredWords, 
    topicScores, 
    lastStudiedTopic, 
    fetchProgress, 
    speakWord,
    resetTopicProgress
  } = useVocabStore();

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Overall Stats
  const masteredCount = Object.keys(masteredWords).filter((k) => masteredWords[k]).length;
  const starredCount = Object.keys(starredWords).filter((k) => starredWords[k]).length;
  const totalProgressPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  // Count fully mastered topics
  const completedTopicsCount = useMemo(() => {
    return topics.filter((t) => {
      const words = t.words || [];
      return words.length > 0 && words.every((w) => masteredWords[w.id]);
    }).length;
  }, [topics, masteredWords]);

  // Global Word Search (Searches across all 1760 words instantly)
  const globalSearchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return null;
    const term = searchTerm.trim().toLowerCase();
    const results = [];

    for (const t of topics) {
      for (const w of t.words) {
        if (w.word.toLowerCase().includes(term) || w.meaning.toLowerCase().includes(term)) {
          results.push({ ...w, topicId: t.id, topicTitle: t.title });
          if (results.length >= 12) break; // Limit to 12 quick results for speed
        }
      }
      if (results.length >= 12) break;
    }
    return results;
  }, [searchTerm, topics]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const words = t.words || [];
      const mCount = words.filter((w) => masteredWords[w.id]).length;
      const sCount = words.filter((w) => starredWords[w.id]).length;

      if (activeFilter === 'completed') {
        return words.length > 0 && mCount === words.length;
      }
      if (activeFilter === 'learning') {
        return mCount > 0 && mCount < words.length;
      }
      if (activeFilter === 'starred') {
        return sCount > 0;
      }
      return true;
    });
  }, [topics, activeFilter, masteredWords, starredWords]);

  const activeResumeTopic = useMemo(() => {
    return topics.find((t) => t.id === lastStudiedTopic) || topics[0] || { id: 1, title: 'Con Người & Ngoại Hình' };
  }, [topics, lastStudiedTopic]);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-3.5 sm:space-y-5">
      <SeoMeta
        title="3000 Từ Vựng Tiếng Anh Cốt Lõi"
        description="Học 3000 từ vựng Oxford thông dụng nhất theo 60 chủ đề cốt lõi với flashcard tương tác và phát âm chuẩn."
      />
      
      {/* 1. Compact Apple-Style Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-6 lg:p-7 border border-slate-800 shadow-xl w-full min-w-0 max-w-full">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 min-w-0">
          {/* Left: Title + Quick Resume CTA */}
          <div className="space-y-2 sm:space-y-3 max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-sky-300 text-[11px] font-bold border border-blue-400/30 max-w-full">
                <Sparkles size={12} className="shrink-0" />
                <span className="truncate">Oxford &amp; Cambridge • 60 Chủ Đề Cốt Lõi</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/vocab/${activeResumeTopic.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer max-w-full min-w-0"
              >
                <Play size={11} fill="currentColor" className="shrink-0" />
                <span className="truncate">Học tiếp Chủ đề #{activeResumeTopic.id}: {activeResumeTopic.title}</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              3000 Từ Vựng Tiếng Anh{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#0071e3]">
                Theo 60 Chủ Đề
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl hidden sm:block">
              Học nhanh nhớ lâu qua Flashcard 3D, Trắc nghiệm phản xạ 2 chiều, Luyện gõ chính tả và thuật toán lặp lại ngắt quãng FSRS.
            </p>
          </div>

          {/* Right: Compact 4-Stat Strip */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 lg:w-[420px] shrink-0 min-w-0">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center sm:text-left min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 block truncate">Đã thuộc</span>
              <span className="text-sm sm:text-xl font-black text-amber-300">
                {masteredCount}
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">/{totalWords}</span>
              </span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center sm:text-left min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 block truncate">Tiến độ</span>
              <span className="text-sm sm:text-xl font-black text-sky-400">{totalProgressPercent}%</span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center sm:text-left min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 block truncate">Chủ đề xong</span>
              <span className="text-sm sm:text-xl font-black text-emerald-400">
                {completedTopicsCount}<span className="text-[10px] font-bold text-slate-400">/60</span>
              </span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center sm:text-left min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 block truncate">Đánh dấu</span>
              <span className="text-sm sm:text-xl font-black text-purple-400">{starredCount}</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* F5. LÁ CHẮN TRÍ NHỚ FSRS — Chế độ Thanh Gọn Thông Minh (Bấm Chi Tiết để mở rộng) */}
      <FsrsMemoryShieldCard compact />

      {/* 2. Sticky Global Search & Filter Bar (Luôn nổi trên đầu khi cuộn trên Mobile) */}
      <div className="sticky top-[56px] z-20 w-full min-w-0 max-w-full py-2 sm:static sm:py-0 bg-slate-50/95 dark:bg-slate-950/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-b border-slate-200/60 dark:border-slate-800/70 sm:border-none flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        {/* Instant Search Bar */}
        <div className="relative w-full sm:w-96 min-w-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tra cứu nhanh trong 3000 từ vựng..."
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs sm:text-sm font-medium outline-none focus:border-[#0071e3] shadow-2xs transition-all text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar w-full sm:w-auto max-w-full">
          {[
            { id: 'all', label: `Tất cả (60)` },
            { id: 'learning', label: 'Đang học' },
            { id: 'completed', label: `Đã xong (${completedTopicsCount})` },
            { id: 'starred', label: `Đánh dấu (${starredCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeFilter === tab.id
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Global Search Results (Instant Dropdown Grid) */}
      {globalSearchResults && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0071e3] uppercase tracking-wider">
              Kết quả tra cứu nhanh ({globalSearchResults.length} từ)
            </span>
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:underline cursor-pointer"
            >
              Đóng kết quả
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {globalSearchResults.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.word}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase">
                      {item.pos}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.meaning}
                  </p>
                  <span className="text-[10px] text-blue-500 font-semibold block mt-1">
                    Thuộc: {item.topicTitle}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speakWord(item.word)}
                    className="p-2 rounded-xl text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                    title="Nghe đọc"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    onClick={() => navigate(`/vocab/${item.topicId}`)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Vào bài học"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Topics 60 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
        {filteredTopics.map((topic) => {
          const words = topic.words || [];
          const mCount = words.filter((w) => masteredWords[w.id]).length;
          const isAllMastered = words.length > 0 && mCount === words.length;
          const percent = words.length > 0 ? Math.round((mCount / words.length) * 100) : 0;
          const scoreObj = topicScores[topic.id];
          const IconComp = ICON_COMPONENT_MAP[topic.icon] || Layers;

          return (
            <motion.div
              key={topic.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate(`/vocab/${topic.id}`)}
              className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 sm:gap-4 select-none ${
                isAllMastered
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/60 hover:shadow-lg hover:shadow-blue-500/5'
              }`}
            >
              {/* Header: Icon & Topic # */}
              <div className="flex items-start justify-between gap-2">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                  isAllMastered
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400'
                }`}>
                  <IconComp size={18} className="sm:w-[22px] sm:h-[22px]" />
                </div>

                <div className="flex items-center gap-1">
                  {scoreObj && scoreObj.bestScore > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/40">
                      🏆 {scoreObj.bestScore}%
                    </span>
                  )}
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold">
                    #{topic.id}
                  </span>
                </div>
              </div>

              {/* Title & Word count */}
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="font-bold text-[13px] sm:text-lg text-slate-900 dark:text-white line-clamp-1">
                  {topic.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {words.length} từ vựng
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 sm:space-y-1.5 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <span>{mCount}/{words.length}</span>
                    {mCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopicToReset(topic);
                        }}
                        className="p-0.5 sm:p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title="Đặt lại tiến độ chủ đề này để học lại từ đầu"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                  </div>
                  <span className={isAllMastered ? 'text-emerald-600 font-bold' : ''}>
                    {percent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isAllMastered ? 'bg-emerald-500' : 'bg-[#0071e3]'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {topicToReset && (
          <div 
            onClick={() => setTopicToReset(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Đặt Lại Chủ Đề {topicToReset.id}?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {topicToReset.title}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                Toàn bộ từ bạn đã đánh dấu thuộc trong chủ đề này sẽ được chuyển về trạng thái <strong>Chưa thuộc</strong> và vị trí học sẽ quay về thẻ số 1 để bạn luyện tập lại từ đầu.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTopicToReset(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = topicToReset.id;
                    const title = topicToReset.title;
                    resetTopicProgress(id);
                    setTopicToReset(null);
                    toast.success(`Đã đặt lại Chủ đề ${id}: ${title}! Bạn có thể học lại từ đầu.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Xác Nhận Đặt Lại</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
