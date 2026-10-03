import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, BookOpen, Layers, CheckCircle2, TrendingUp,
  Star, Trophy, ArrowRight, Play, Volume2, Filter, Zap, RotateCcw,
  ChevronRight, X, Shield, Info,
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
import FsrsShieldRecoveryModal from './components/FsrsShieldRecoveryModal';
import { calculateMemoryShield } from '../../utils/fsrsMemoryShieldEngine';

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

// 5 Chặng học cho 60 chủ đề Oxford 3000
const STAGES = [
  { id: 'all', label: 'Tất cả (60)', shortLabel: 'Tất cả', range: [1, 60] },
  { id: 'stage1', label: 'Chặng 1 (1–12)', shortLabel: 'Chặng 1', title: 'Đời sống & Cơ bản', range: [1, 12] },
  { id: 'stage2', label: 'Chặng 2 (13–24)', shortLabel: 'Chặng 2', title: 'Xã hội & Sức khỏe', range: [13, 24] },
  { id: 'stage3', label: 'Chặng 3 (25–36)', shortLabel: 'Chặng 3', title: 'Ẩm thực & Cảm xúc', range: [25, 36] },
  { id: 'stage4', label: 'Chặng 4 (37–48)', shortLabel: 'Chặng 4', title: 'Thiên nhiên & Gia đình', range: [37, 48] },
  { id: 'stage5', label: 'Chặng 5 (49–60)', shortLabel: 'Chặng 5', title: 'Công việc & Quốc tế', range: [49, 60] },
];

export default function VocabOverviewPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStage, setActiveStage] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'learning', 'completed', 'starred'
  const [topicToReset, setTopicToReset] = useState(null);
  const [showMobileFilterDrawer, setShowMobileFilterDrawer] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryWords, setRecoveryWords] = useState([]);
  const [showFsrsInfoModal, setShowFsrsInfoModal] = useState(false);

  const { 
    topics, 
    totalWords, 
    masteredWords, 
    starredWords, 
    topicScores, 
    lastStudiedTopic, 
    fetchProgress, 
    speakWord,
    resetTopicProgress,
    fsrsCards
  } = useVocabStore();

  const shield = useMemo(() => calculateMemoryShield(fsrsCards, masteredWords), [fsrsCards, masteredWords]);

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

  // Count learning topics
  const learningTopicsCount = useMemo(() => {
    return topics.filter((t) => {
      const words = t.words || [];
      const mCount = words.filter((w) => masteredWords[w.id]).length;
      return mCount > 0 && mCount < words.length;
    }).length;
  }, [topics, masteredWords]);

  // Count topics with starred words
  const starredTopicsCount = useMemo(() => {
    return topics.filter((t) => {
      const words = t.words || [];
      return words.some((w) => starredWords[w.id]);
    }).length;
  }, [topics, starredWords]);

  // Stage Stats (how many topics completed per stage)
  const stageStats = useMemo(() => {
    const stats = {};
    STAGES.forEach((s) => {
      if (s.id === 'all') {
        stats[s.id] = { completed: completedTopicsCount, total: 60 };
      } else {
        const [start, end] = s.range;
        const stageTopics = topics.filter((t) => t.id >= start && t.id <= end);
        const completed = stageTopics.filter((t) => {
          const w = t.words || [];
          return w.length > 0 && w.every((word) => masteredWords[word.id]);
        }).length;
        stats[s.id] = { completed, total: stageTopics.length };
      }
    });
    return stats;
  }, [topics, completedTopicsCount, masteredWords]);

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

  // Filter topics by Stage and Status
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      // 1. Stage filter
      if (activeStage !== 'all') {
        const currentStageObj = STAGES.find((s) => s.id === activeStage);
        if (currentStageObj) {
          const [start, end] = currentStageObj.range;
          if (t.id < start || t.id > end) return false;
        }
      }

      // 2. Status filter
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
  }, [topics, activeStage, activeFilter, masteredWords, starredWords]);

  const activeResumeTopic = useMemo(() => {
    return topics.find((t) => t.id === lastStudiedTopic) || topics[0] || { id: 1, title: 'Con Người & Ngoại Hình' };
  }, [topics, lastStudiedTopic]);

  const resumeTopicWords = activeResumeTopic?.words || [];
  const resumeTopicMastered = resumeTopicWords.filter((w) => masteredWords[w.id]).length;
  const resumeTopicPercent = resumeTopicWords.length > 0 ? Math.round((resumeTopicMastered / resumeTopicWords.length) * 100) : 0;
  const ResumeTopicIcon = ICON_COMPONENT_MAP[activeResumeTopic?.icon] || BookOpen;

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-3.5 sm:space-y-5">
      <SeoMeta
        title="3000 Từ Vựng Tiếng Anh Cốt Lõi"
        description="Học 3000 từ vựng Oxford thông dụng nhất theo 60 chủ đề cốt lõi với flashcard tương tác và phát âm chuẩn."
      />
      
      {/* ========================================================
          1A. MOBILE APP HEADER & RESUME BAR (sm:hidden)
          Native App Minimalist Architecture: Zero Clutter, Ultra-Fast Resume
          ======================================================== */}
      <div className="sm:hidden space-y-2.5">
        {/* App Top Line: Title + Overall Mastery */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              3000 Từ Vựng
            </h1>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              60 Chủ đề Oxford cốt lõi
            </span>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lime-500/15 dark:bg-lime-950/40 text-[#4d7c0f] dark:text-lime-400 text-xs font-black">
              <CheckCircle2 size={13} className="text-[#65a30d] dark:text-lime-400 shrink-0" />
              <span>{masteredCount}/{totalWords} từ</span>
              <span className="opacity-60 font-semibold">• {totalProgressPercent}%</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Resume Card: High Contrast CTA Button */}
        <div 
          onClick={() => navigate(`/vocab/${activeResumeTopic.id}`)}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-lime-500/15 via-emerald-500/10 to-transparent dark:from-lime-950/40 dark:via-emerald-950/20 border border-lime-300/80 dark:border-lime-900/40 flex items-center justify-between gap-2.5 active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#65a30d] text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <ResumeTopicIcon size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-lime-800 dark:text-lime-400 tracking-wider">
                  Tiếp tục học
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Chủ đề #{activeResumeTopic.id}
                </span>
              </div>
              <h3 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate">
                {activeResumeTopic.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-[#65a30d] dark:bg-lime-400 rounded-full" 
                    style={{ width: `${resumeTopicPercent}%` }} 
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {resumeTopicMastered}/{resumeTopicWords.length} từ ({resumeTopicPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Green CTA Button with high-contrast text */}
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-[#65a30d] hover:bg-[#7acc15] text-white font-black text-xs flex items-center gap-1 shadow-sm shrink-0 border-b-2 border-[#4d7c0f] active:scale-95 transition-transform"
          >
            <Play size={12} fill="white" className="text-white" />
            <span className="text-white font-black">Học ngay</span>
            <ChevronRight size={12} className="text-white" />
          </button>
        </div>

        {/* ========================================================
            FSRS MEMORY SHIELD: Mobile Lean & Intuitive Pavilion
            Always visible, compact ~48px, real-time health gauge + 3 tiers
            ======================================================== */}
        <div
          onClick={() => {
            if (shield.criticalCount > 0) {
              setRecoveryWords(shield.criticalWords);
              setIsRecoveryOpen(true);
            } else if (shield.fadingCount > 0) {
              setRecoveryWords(shield.fadingWords);
              setIsRecoveryOpen(true);
            } else {
              setShowFsrsInfoModal(true);
            }
          }}
          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] shadow-2xs ${
            shield.healthPercentage >= 90
              ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white/90 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-300/80 dark:border-emerald-800/60'
              : shield.healthPercentage >= 70
              ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white/90 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-amber-300/80 dark:border-amber-800/60'
              : 'bg-gradient-to-r from-rose-500/10 via-red-500/5 to-white/90 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 border-rose-300/80 dark:border-rose-800/60'
          }`}
        >
          {/* Left: Mini SVG Health Ring (36x36px) */}
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-200/80 dark:text-slate-800"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={
                  shield.healthPercentage >= 90
                    ? '#10b981'
                    : shield.healthPercentage >= 70
                    ? '#f59e0b'
                    : '#f43f5e'
                }
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="87.96"
                strokeDashoffset={87.96 - (87.96 * shield.healthPercentage) / 100}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900 dark:text-white">
              {shield.healthPercentage}%
            </span>
          </div>

          {/* Center: Title + Tier Label + 3-Tier Counts */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black text-slate-900 dark:text-white">
                Lá Chắn Trí Nhớ
              </span>
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold border ${
                shield.healthPercentage >= 90
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : shield.healthPercentage >= 70
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              }`}>
                {shield.tier.label}
              </span>
            </div>

            {/* 3-Tier Summary in 1 sleek line */}
            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <strong className="text-slate-700 dark:text-slate-200">{shield.solidCount}</strong> vững
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <strong className="text-slate-700 dark:text-slate-200">{shield.fadingCount}</strong> mờ
              </span>
              <span className="inline-flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full bg-rose-500 ${shield.criticalCount > 0 ? 'animate-pulse' : ''}`} />
                <strong className={shield.criticalCount > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-700 dark:text-slate-200'}>
                  {shield.criticalCount}
                </strong> cần ôn
              </span>
            </div>
          </div>

          {/* Right: Quick Action Pill */}
          <div className="shrink-0">
            {shield.criticalCount > 0 ? (
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center gap-1 shadow-sm animate-pulse active:scale-95"
              >
                <span>Ôn ngay</span>
                <ChevronRight size={12} />
              </button>
            ) : shield.fadingCount > 0 ? (
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-[11px] flex items-center gap-1 shadow-sm active:scale-95"
              >
                <span>Củng cố</span>
                <ChevronRight size={12} />
              </button>
            ) : (
              <span className="px-2.5 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10.5px] flex items-center gap-0.5 border border-emerald-300/60 dark:border-emerald-800/40">
                ✓ 100% <ChevronRight size={11} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2A. MOBILE STICKY CONTROL BAR (sm:hidden)
          Clean 36px Search + Quick Filter + Smooth Stage Pills
          ======================================================== */}
      <div className="sm:hidden sticky top-[52px] z-20 -mx-3 px-3 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 space-y-1.5">
        {/* Row 1: Search + Filter Toggle Button */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm từ vựng hoặc chủ đề..."
              className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium outline-none focus:border-[#0071e3] shadow-2xs text-slate-900 dark:text-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilterDrawer((prev) => !prev)}
            className={`h-9 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${
              activeFilter !== 'all'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-[#0071e3]'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="Bộ lọc trạng thái"
          >
            <Filter size={13} />
            <span className="text-[11px]">
              {activeFilter === 'all' ? 'Lọc' : activeFilter === 'learning' ? 'Đang học' : activeFilter === 'completed' ? 'Đã xong' : 'Đánh dấu'}
            </span>
            {activeFilter !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
            )}
          </button>
        </div>

        {/* Filter Drawer / Quick Options (when open) */}
        {showMobileFilterDrawer && (
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar pt-1 pb-0.5">
            {[
              { id: 'all', label: `Tất cả (60)` },
              { id: 'learning', label: `Đang học (${learningTopicsCount})` },
              { id: 'completed', label: `Đã xong (${completedTopicsCount})` },
              { id: 'starred', label: `Đánh dấu (${starredTopicsCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setShowMobileFilterDrawer(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 transition-all ${
                  activeFilter === tab.id
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Row 2: Stage Navigation Pills (Chặng 1 -> Chặng 5) */}
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap hide-scrollbar pt-0.5">
          {STAGES.map((s) => {
            const isSelected = activeStage === s.id;
            const stat = stageStats[s.id] || { completed: 0, total: 12 };
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(s.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#65a30d] dark:bg-lime-500 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{s.shortLabel}</span>
                {s.id !== 'all' && (
                  <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected 
                      ? 'bg-black/20 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {stat.completed}/{stat.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          1B. DESKTOP TACTILE HERO PAVILION (hidden sm:block)
          Integrated FSRS Memory Shield HUD + Oxford 3000 Pavilion
          ======================================================== */}
      <div className="hidden sm:block duo-card p-6 lg:p-7 rounded-3xl bg-gradient-to-br from-[#f7fee7] via-[#f4fce3] to-[#edfbd8] dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0f172a] border-2 border-lime-200/60 dark:border-slate-800 border-b-6 border-b-[#7acc15] dark:border-b-[#5ea810] shadow-sm w-full min-w-0 max-w-full relative overflow-hidden">
        {/* Soft Ambient Glows & Top Gloss Shimmer */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#7acc15]/10 to-lime-300/5 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-lime-400/8 to-lime-300/5 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#7acc15]/40 to-transparent" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (7 cols): Title, Subtitle, Actions, Micro-stats */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="duo-pill duo-pill-green text-xs font-black uppercase tracking-wider shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#7acc15] dark:bg-lime-400 animate-duo-pulse" />
                  <span>OXFORD 3000 CỐT LÕI • 60 CHỦ ĐỀ FLASHCARD 3D</span>
                </div>
                <div className="duo-pill duo-pill-xp text-xs font-black shrink-0">
                  <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
                  <span>{masteredCount}/{totalWords} từ đã thuộc</span>
                </div>
              </div>

              <h1 className="text-2xl lg:text-[28px] font-black tracking-tight leading-snug">
                <span className="text-slate-900 dark:text-white">
                  3000 Từ Vựng Tiếng Anh
                </span>{' '}
                <span className="text-[#65a30d] dark:text-[#a3e635]">
                  Theo 60 Chủ Đề.
                </span>
              </h1>

              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
                Học nhanh nhớ lâu qua Flashcard 3D, trắc nghiệm phản xạ 2 chiều, luyện gõ chính tả và thuật toán ngắt quãng FSRS DSR tiên tiến.
              </p>
            </div>

            {/* Tactile Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate(`/vocab/${activeResumeTopic.id}`)}
                className="duo-btn duo-btn-green duo-btn-lg flex items-center justify-center gap-2 font-black cursor-pointer shadow-sm text-white"
              >
                <Play size={15} fill="white" className="shrink-0 text-white" />
                <span className="truncate text-white font-black">
                  Học tiếp Ch.{activeResumeTopic.id}: {activeResumeTopic.title}
                </span>
                <ArrowRight size={15} className="shrink-0 text-white" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('vocab-topics-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="duo-btn duo-btn-white duo-btn-lg flex items-center justify-center gap-2 font-black text-[#65a30d] dark:text-[#a3e635] cursor-pointer whitespace-nowrap shadow-xs"
              >
                <span>60 chủ đề</span>
              </button>
            </div>

            {/* Micro 4-Stat Strip */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-lime-200/60 dark:border-slate-800/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#7acc15] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Đã thuộc</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate block">{masteredCount}/{totalWords}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Tiến độ</span>
                  <span className="text-xs font-black text-teal-600 dark:text-teal-400 truncate block">{totalProgressPercent}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Chủ đề xong</span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 truncate block">{completedTopicsCount}/60</span>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">Đánh dấu</span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 truncate block">{starredCount} từ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Integrated FSRS Memory Shield HUD */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-lime-200/80 dark:border-slate-800 shadow-sm space-y-3">
            {/* HUD Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                  shield.healthPercentage >= 90
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : shield.healthPercentage >= 70
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}>
                  <Shield size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Lá Chắn Trí Nhớ FSRS
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFsrsInfoModal(true)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Tìm hiểu về thuật toán FSRS & Hiệu ứng Sở hữu"
                    >
                      <Info size={13} />
                    </button>
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                    Thuật toán ghi nhớ ngắt quãng AI
                  </span>
                </div>
              </div>

              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-black border ${
                shield.healthPercentage >= 90
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : shield.healthPercentage >= 70
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              }`}>
                {shield.healthPercentage}% • {shield.tier.label}
              </span>
            </div>

            {/* Health Meter & 3 Status Pills */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span>Độ bền lá chắn</span>
                <span className="font-black text-slate-900 dark:text-white">{shield.healthPercentage}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    shield.healthPercentage >= 90
                      ? 'bg-emerald-500'
                      : shield.healthPercentage >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${shield.healthPercentage}%` }}
                />
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="p-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase block">Vững vàng</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{shield.solidCount} từ</span>
                </div>
                <div className="p-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase block">Đang mờ</span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">{shield.fadingCount} từ</span>
                </div>
                <div className="p-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase block">Cần ôn</span>
                  <span className={`text-xs font-black ${shield.criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'}`}>{shield.criticalCount} từ</span>
                </div>
              </div>
            </div>

            {/* Quick FSRS Action Button */}
            {shield.criticalCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setRecoveryWords(shield.criticalWords);
                  setIsRecoveryOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Ôn khẩn cấp {shield.criticalCount} từ cần cứu</span>
                <ChevronRight size={13} />
              </button>
            ) : shield.fadingCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setRecoveryWords(shield.fadingWords);
                  setIsRecoveryOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Củng cố {shield.fadingCount} từ đang mờ</span>
                <ChevronRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowFsrsInfoModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>✓ Lá chắn kiên cố 100% • Xem chi tiết</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          2B. DESKTOP UNIFIED STICKY NAVIGATION BAR (hidden sm:block)
          Single sleek 44px row: Stage Pills + Search + Filter Capsule
          ======================================================== */}
      <div className="hidden sm:block sticky top-0 z-20 w-full min-w-0 max-w-full py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Left: Stage Navigation Pills (Tất cả, Chặng 1 -> 5) */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar min-w-0 flex-1">
            {STAGES.map((s) => {
              const isSelected = activeStage === s.id;
              const stat = stageStats[s.id] || { completed: 0, total: 12 };
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#65a30d] dark:bg-lime-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.label}</span>
                  {s.id !== 'all' && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected 
                        ? 'bg-black/20 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {stat.completed}/{stat.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Instant Search (w-52) + Status Capsule */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative w-48 lg:w-56 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tra cứu 3000 từ..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium outline-none focus:border-[#0071e3] shadow-2xs text-slate-900 dark:text-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Segmented Control */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'learning', label: `Học (${learningTopicsCount})` },
                { id: 'completed', label: `Xong (${completedTopicsCount})` },
                { id: 'starred', label: `⭐ (${starredTopicsCount})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-[#0071e3] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Global Search Results (Instant Dropdown Grid) */}
      {globalSearchResults && (
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xl space-y-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {globalSearchResults.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
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

      {/* ========================================================
          4A. MOBILE TOPICS LIST: Native App Row Cards (sm:hidden)
          Ultra-lean, thumb-friendly rows with crystal clear state
          ======================================================== */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
          <span>
            {filteredTopics.length} chủ đề {activeStage !== 'all' ? `• ${STAGES.find(s => s.id === activeStage)?.label}` : ''}
          </span>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-[#0071e3] font-bold cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {filteredTopics.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-500 text-xs">
            Không tìm thấy chủ đề nào theo bộ lọc đã chọn.
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const words = topic.words || [];
            const mCount = words.filter((w) => masteredWords[w.id]).length;
            const isAllMastered = words.length > 0 && mCount === words.length;
            const percent = words.length > 0 ? Math.round((mCount / words.length) * 100) : 0;
            const scoreObj = topicScores[topic.id];
            const IconComp = ICON_COMPONENT_MAP[topic.icon] || Layers;

            return (
              <div
                key={topic.id}
                onClick={() => navigate(`/vocab/${topic.id}`)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] select-none ${
                  isAllMastered
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/50 shadow-2xs'
                    : mCount > 0
                    ? 'bg-white dark:bg-slate-900 border-lime-300/80 dark:border-lime-900/40 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                }`}
              >
                {/* Left: 40px Squircle Icon */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    isAllMastered
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : mCount > 0
                      ? 'bg-lime-100 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    <IconComp size={18} />
                  </div>
                  {isAllMastered && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black border border-white dark:border-slate-900">
                      ✓
                    </div>
                  )}
                </div>

                {/* Center: Title + Inline Progress */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                      #{topic.id}
                    </span>
                    <h3 className="font-extrabold text-[13px] text-slate-900 dark:text-white truncate">
                      {topic.title}
                    </h3>
                  </div>

                  {isAllMastered ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Đã thuộc 100% ({words.length} từ)
                      </span>
                      {scoreObj && scoreObj.bestScore > 0 && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          • 🏆 {scoreObj.bestScore}%
                        </span>
                      )}
                    </div>
                  ) : mCount > 0 ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#65a30d] dark:bg-lime-400"
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                        {mCount}/{words.length} từ ({percent}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      {words.length} từ vựng
                    </span>
                  )}
                </div>

                {/* Right: Action CTA with high contrast button */}
                <div className="flex items-center gap-1 shrink-0">
                  {isAllMastered ? (
                    <span className="px-2 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-black">
                      Hoàn thành
                    </span>
                  ) : mCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-[#65a30d] text-white font-black text-[11px] flex items-center gap-0.5 shadow-2xs border-b border-[#4d7c0f] active:scale-95">
                      Học tiếp <ChevronRight size={11} className="text-white" />
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10.5px] flex items-center gap-0.5">
                      Học <ChevronRight size={11} />
                    </span>
                  )}

                  {mCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTopicToReset(topic);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                      title="Đặt lại tiến độ chủ đề này"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          4B. DESKTOP TOPICS GRID: 3D Duolingo Cards (hidden sm:grid)
          ======================================================== */}
      <div id="vocab-topics-grid" className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 select-none ${
                isAllMastered
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/60 hover:shadow-lg hover:shadow-blue-500/5'
              }`}
            >
              {/* Header: Icon & Topic # */}
              <div className="flex items-start justify-between gap-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isAllMastered
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400'
                }`}>
                  <IconComp size={22} />
                </div>

                <div className="flex items-center gap-1">
                  {scoreObj && scoreObj.bestScore > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/40">
                      🏆 {scoreObj.bestScore}%
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold">
                    #{topic.id}
                  </span>
                </div>
              </div>

              {/* Title & Word count */}
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                  {topic.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {words.length} từ vựng
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <span>{mCount}/{words.length}</span>
                    {mCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopicToReset(topic);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
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

      {/* Mobile FSRS Recovery Modal */}
      <FsrsShieldRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        wordsToReview={recoveryWords}
        initialHealth={shield.healthPercentage}
      />

      {/* Educational Info Modal explaining Loss Aversion & FSRS for Mobile */}
      <AnimatePresence>
        {showFsrsInfoModal && (
          <div 
            onClick={() => setShowFsrsInfoModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Khoa Học Lá Chắn Trí Nhớ FSRS
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Sức bền hiện tại: {shield.healthPercentage}% ({shield.tier.label})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFsrsInfoModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status pills breakdown */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Vững vàng</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{shield.solidCount} từ</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Đang mờ</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">{shield.fadingCount} từ</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Cần ôn</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">{shield.criticalCount} từ</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>
                  <strong>🧠 Hiệu ứng Sở hữu & Nỗi đau mất mát:</strong> Não bộ coi từ vựng bạn đã nạp là <em>tài sản cá nhân</em>. Nỗi đau quên đi 10 từ mạnh gấp <strong>2.5 lần</strong> niềm vui học thêm từ mới!
                </p>
                <p>
                  <strong>🛡️ Thuật toán FSRS DSR:</strong> Hệ thống tự động tính toán chính xác chu kỳ quên theo thuật toán lặp lại ngắt quãng hiện đại nhất thế giới. Chỉ cần duy trì lá chắn trên 90%, bạn sẽ ghi nhớ từ vựng vĩnh viễn!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFsrsInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#65a30d] hover:bg-[#7acc15] text-white font-black text-xs cursor-pointer border-b-2 border-[#4d7c0f] active:scale-95 transition-all"
              >
                Đã hiểu & Tiếp tục học!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
