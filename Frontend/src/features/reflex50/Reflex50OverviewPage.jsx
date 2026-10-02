import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Search, BookOpen, Headphones, Mic, PenTool, CheckCircle2,
  Star, AlertCircle, ArrowRight, Layers, Volume2, Zap, Play,
  MessageCircle, Users, Briefcase, HeartPulse, HelpCircle, RotateCcw, X
} from 'lucide-react';
import reflex50Meta from './data/reflex50Meta.json';
import useReflex50Store, { loadReflex50FullData, peekReflex50FullData } from './store/useReflex50Store';
import Reflex50MethodGuideModal from './components/Reflex50MethodGuideModal';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
import SeoMeta from '../../components/SeoMeta';
import toast from 'react-hot-toast';

const CATEGORY_ICON_MAP = {
  MessageCircle,
  Users,
  Briefcase,
  HeartPulse,
  Zap
};

export default function Reflex50OverviewPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in-progress' | 'completed' | 'unstarted' | 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [fullData, setFullData] = useState(() => peekReflex50FullData());

  // Tải ngầm dữ liệu 1.500 câu ở hậu cảnh sau khi trang đã hiển thị tức thì (0ms)
  useEffect(() => {
    if (!fullData) {
      loadReflex50FullData()
        .then((d) => setFullData(d))
        .catch(() => {});
    }
  }, [fullData]);

  const masteredIds = useReflex50Store((s) => s.masteredIds);
  const starredIds = useReflex50Store((s) => s.starredIds);
  const weakIds = useReflex50Store((s) => s.weakIds);
  const writingHistory = useReflex50Store((s) => s.writingHistory);
  const speakingHistory = useReflex50Store((s) => s.speakingHistory);
  const lastStudiedUnit = useReflex50Store((s) => s.lastStudiedUnit);
  const getOverallStats = useReflex50Store((s) => s.getOverallStats);
  const getUnitStats = useReflex50Store((s) => s.getUnitStats);
  const resetAllProgress = useReflex50Store((s) => s.resetAllProgress);
  const fetchProgress = useReflex50Store((s) => s.fetchProgress);

  // Luôn nạp tiến độ mới nhất từ máy chủ SQL Server
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const overall = useMemo(() => getOverallStats(), [getOverallStats, masteredIds]);
  const lastUnitObj =
    reflex50Meta.units.find((u) => u.unitNumber === lastStudiedUnit) || reflex50Meta.units[0];

  // Thống kê cho từng nhóm chủ đề lớn (Category 1..5) — Tính toán O(1) không cần duyệt 1500 object
  const categoryStatsMap = useMemo(() => {
    const map = {};
    for (const cat of reflex50Meta.categories) {
      const [startU, endU] = cat.unitRange;
      const totalUnits = endU - startU + 1;
      let masteredSentences = 0;
      let completedUnits = 0;
      for (let u = startU; u <= endU; u++) {
        let mCount = 0;
        for (let s = 1; s <= 30; s++) {
          if (masteredIds[`u${u}-s${s}`]) mCount++;
        }
        masteredSentences += mCount;
        if (mCount >= 30) completedUnits++;
      }
      map[cat.id] = {
        masteredSentences,
        totalSentences: totalUnits * 30,
        completedUnits,
        totalUnits,
        percent: Math.round((masteredSentences / (totalUnits * 30)) * 100)
      };
    }
    return map;
  }, [masteredIds]);

  // Lọc danh sách 50 Units
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fullUnitsMap = fullData
      ? new Map(fullData.units.map((u) => [u.unitNumber, u]))
      : null;

    return reflex50Meta.units.filter((unit) => {
      if (selectedCategory !== 'all' && unit.categoryId !== selectedCategory) {
        return false;
      }

      const st = getUnitStats(unit.unitNumber);
      if (statusFilter === 'completed' && !st.isCompleted) return false;
      if (statusFilter === 'in-progress' && (st.masteredCount === 0 || st.isCompleted)) return false;
      if (statusFilter === 'unstarted' && st.masteredCount > 0) return false;
      if (statusFilter === 'starred' && st.starredCount === 0 && st.weakCount === 0) return false;

      if (!q) return true;
      const matchTitle =
        unit.titleEn.toLowerCase().includes(q) ||
        unit.titleVi.toLowerCase().includes(q) ||
        `unit ${unit.unitNumber}` === q ||
        String(unit.unitNumber) === q ||
        unit.topVocab.some((v) => v.term.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q));
      if (matchTitle) return true;

      const fullUnit = fullUnitsMap?.get(unit.unitNumber);
      if (!fullUnit) return false;

      return fullUnit.sentences.some(
        (s) =>
          s.vi.toLowerCase().includes(q) ||
          s.en.toLowerCase().includes(q) ||
          s.hints.some((h) => h.term.toLowerCase().includes(q) || h.meaning.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, statusFilter, searchQuery, fullData, masteredIds, starredIds, weakIds, writingHistory, speakingHistory]);

  // Nếu người dùng nhập từ khóa tìm kiếm >= 2 ký tự: trả về tối đa 12 câu khớp trực tiếp trong 1500 câu
  const matchingSentences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2 || !fullData) return [];
    const results = [];
    for (const unit of fullData.units) {
      for (const s of unit.sentences) {
        if (
          s.vi.toLowerCase().includes(q) ||
          s.en.toLowerCase().includes(q) ||
          s.hints.some((h) => h.term.toLowerCase().includes(q) || h.meaning.toLowerCase().includes(q))
        ) {
          results.push({
            ...s,
            unitNumber: unit.unitNumber,
            unitTitleEn: unit.titleEn,
            unitTitleVi: unit.titleVi
          });
          if (results.length >= 12) return results;
        }
      }
    }
    return results;
  }, [searchQuery, fullData]);

  // Thông số vòng tròn tiến độ Apple Activity Ring
  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (Math.max(3, overall.overallPercent) / 100) * ringCircumference;

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-4 sm:space-y-8 pb-12 sm:pb-14">
      <SeoMeta
        title="Phản Xạ 50 Chủ Đề — 1500 Câu Nói Viết"
        description="Luyện phản xạ 1500 câu tiếng Anh theo 50 chủ đề thông dụng, kỹ thuật Chunking và Collocations bản xứ."
      />
      {/* ===================================================================== */}
      {/* 1. ULTRA-TACTILE DUOLINGO 3D HERO BANNER (DỊU MẮT, TẬP TRUNG HỌC TẬP) */}
      {/* ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="duo-card p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#fffdf9] via-[#fefbf6] to-[#fbf7f0] dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0f172a] border-2 border-amber-200/50 dark:border-slate-800 border-b-6 border-b-[#d9822b]/80 dark:border-b-[#b46312]/70 shadow-sm w-full min-w-0 max-w-full relative overflow-hidden space-y-4 sm:space-y-6"
      >
        {/* Soft Ambient Glows & Top Gloss Shimmer (Dịu nhẹ, không gây chói mắt) */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#d9822b]/8 to-amber-300/5 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-amber-400/6 to-yellow-400/5 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d9822b]/35 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-8 min-w-0">
          {/* Left Content */}
          <div className="space-y-2.5 sm:space-y-3.5 max-w-2xl min-w-0 flex-1">
            {/* Duolingo Ribbon Pills */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <div className="duo-pill duo-pill-amber text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                <Zap size={13} className="text-[#d9822b] dark:text-[#fcd34d] shrink-0" />
                <span className="sm:hidden">50 CHỦ ĐỀ • 1.500 CÂU PHẢN XẠ 3S</span>
                <span className="hidden sm:inline">TRỤ CỘT 02 • 50 CHỦ ĐỀ • 1.500 CÂU PHẢN XẠ 3 GIÂY</span>
              </div>

              <div className="duo-pill duo-pill-xp text-[10px] sm:text-xs font-black shrink-0">
                <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{overall.totalMastered}/1500 câu ({overall.overallPercent}%)</span>
              </div>
            </div>

            {/* Duolingo Chunky Headline */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-snug">
                <span className="text-slate-900 dark:text-white">
                  Phản Xạ Nói – Viết
                </span>{' '}
                <span className="text-[#c2781a] dark:text-[#fcd34d]">
                  50 Chủ Đề Tiếng Anh Thông Dụng.
                </span>
              </h1>

              <p className="line-clamp-1 sm:line-clamp-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
                Bật câu tiếng Anh trong <strong>3 giây</strong>, luyện viết chấm điểm từng từ và làm chủ <strong>3.400+ cụm Collocations bản xứ</strong> chia theo 5 cấp độ.
              </p>
            </div>

            {/* Tactile Duolingo Action Buttons (Responsive row on mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/reflex-50/unit/${lastUnitObj.unitNumber}`)}
                className="duo-btn duo-btn-amber duo-btn-sm sm:duo-btn-md font-black shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={15} fill="currentColor" className="shrink-0" />
                <span className="truncate">
                  Học tiếp Unit {lastUnitObj.unitNumber}: {lastUnitObj.titleEn}
                </span>
                <ArrowRight size={15} className="shrink-0 hidden xs:inline" />
              </button>

              <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(true)}
                  className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black text-[#c2781a] dark:text-[#fcd34d] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Zap size={14} className="text-[#c2781a] dark:text-[#fcd34d] shrink-0" />
                  <span className="sm:hidden">Phương Pháp</span>
                  <span className="hidden sm:inline">Phương Pháp Học</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black text-slate-700 dark:text-slate-200 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Cài đặt giọng đọc AI Studio & tốc độ đọc"
                >
                  <Headphones size={14} className="text-[#c2781a] dark:text-[#fcd34d] shrink-0" />
                  <span>Giọng AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Stats Card: Duolingo 3D Chunky Capsule (Màu sắc êm dịu) */}
          <div className="shrink-0 w-full lg:w-80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-2 border-slate-200/80 dark:border-slate-800 border-b-4 border-b-amber-300/80 dark:border-b-amber-800/80 shadow-xs space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tiến độ làm chủ 1.500 câu
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {overall.totalMastered} <span className="text-xs font-bold text-slate-400">/ 1500</span>
                </div>
                <div className="text-xs font-black text-[#c2781a] dark:text-[#fcd34d] mt-0.5">
                  Đã hoàn thành {overall.completedUnits}/50 Unit
                </div>
              </div>

              {/* SVG Progress Ring */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r={ringRadius}
                    fill="none"
                    stroke="#d9822b"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-900 dark:text-white">
                  {overall.overallPercent}%
                </span>
              </div>
            </div>

            {/* Mini breakdown */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-center">
              <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{overall.totalWritten}</div>
                <div className="text-[10px] font-bold text-slate-500">Đã viết</div>
              </div>
              <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{overall.totalSpoken}</div>
                <div className="text-[10px] font-bold text-slate-500">Đã nói</div>
              </div>
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40">
                <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                  {overall.totalStarred + overall.totalWeak}
                </div>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Cần ôn</div>
              </div>
            </div>

            {/* Daily target bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600 dark:text-slate-400">
                  Mục tiêu hôm nay (30 câu)
                </span>
                <span className="text-[#c2781a] dark:text-[#fcd34d] font-black">
                  {overall.todayCount}/{overall.dailyGoal} câu
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full bg-[#d9822b] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((overall.todayCount / overall.dailyGoal) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===================================================================== */}
      {/* 2. STRIP PHƯƠNG PHÁP 4 BƯỚC HỌC (Vuốt ngang mượt trên Mobile)        */}
      {/* ===================================================================== */}
      <section className="flex overflow-x-auto hide-scrollbar snap-x gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3.5 pb-0.5">
        {[
          {
            step: 'Bước 1 • Tư Duy Cụm Từ',
            title: 'Nạp Cụm Gợi Ý (Chunks)',
            desc: 'Không dịch từng chữ rời rạc. Bấm nghe các cụm gợi ý dưới câu tiếng Việt để nạp khối từ chuẩn bản xứ.',
            icon: Layers,
            accent: 'text-[#0071e3] bg-blue-50 dark:bg-blue-950/40'
          },
          {
            step: 'Bước 2 • Phản Xạ 3 Giây',
            title: 'Che Đáp Án & Bật Thành Tiếng',
            desc: 'Bật chế độ "Ẩn đáp án Tiếng Anh", nhìn câu tiếng Việt và tự nói to trong 3–5 giây trước khi mở đáp án.',
            icon: Mic,
            accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
          },
          {
            step: 'Bước 3 • Làm Bài Viết 2 Tầng',
            title: 'Ghép Cụm → Tự Gõ Cả Câu',
            desc: 'Thực hành dòng → _____ bằng cách ghép cụm từ hoặc tự gõ câu. Hệ thống chấm điểm & chỉ rõ từng từ sai.',
            icon: PenTool,
            accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
          },
          {
            step: 'Bước 4 • Nghe Chậm & Nhại',
            title: 'Shadowing 0.75x → 1.0x',
            desc: 'Nghe chậm rãi (0.75x) để bắt chuẩn âm cuối, nhại theo 3 lần rồi bật Auto-Play 30 câu để tắm ngôn ngữ.',
            icon: Headphones,
            accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => setIsMethodModalOpen(true)}
              className="w-[235px] sm:w-auto shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#0071e3] transition-colors">
                  {item.step}
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${item.accent}`}>
                  <Icon size={15} />
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">{item.desc}</p>
            </div>
          );
        })}
      </section>

      {/* ===================================================================== */}
      {/* 3. BỘ LỌC 5 NHÓM CHỦ ĐỀ LỚN (CATEGORIES) & TÌM KIẾM                  */}
      {/* ===================================================================== */}
      <section className="space-y-3 sm:space-y-4">
        {/* Category Cards Strip - Horizontal Swipe on Mobile, 6-col Grid on Desktop */}
        <div className="flex overflow-x-auto hide-scrollbar snap-x gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-6 sm:gap-2.5 pb-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-[165px] sm:w-auto shrink-0 snap-start p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold">Tất cả 50 Chủ đề</span>
              <Layers size={14} className="opacity-80 shrink-0" />
            </div>
            <div className="text-base sm:text-lg font-bold mt-1">1.500 câu</div>
            <div className="text-[10px] sm:text-[11px] opacity-75 mt-0.5 truncate">
              Thuộc {overall.totalMastered} câu ({overall.overallPercent}%)
            </div>
          </button>

          {reflex50Meta.categories.map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat.icon] || MessageCircle;
            const st = categoryStatsMap[cat.id];
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-[175px] sm:w-auto shrink-0 snap-start p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-80">
                    Nhóm {cat.order} (U{cat.unitRange[0]}–{cat.unitRange[1]})
                  </span>
                  <Icon size={14} className={active ? 'text-white shrink-0' : 'text-[#0071e3] shrink-0'} />
                </div>
                <div className="text-xs font-bold mt-1 line-clamp-1">{cat.titleVi}</div>
                <div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5 sm:mt-1 truncate">
                  {st.masteredSentences}/300 câu • {st.completedUnits}/10 Unit
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề (VD: Interview, Airport) hoặc câu tiếng Anh / Việt..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071e3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar pb-0.5 md:pb-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'in-progress', label: 'Đang học' },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'unstarted', label: 'Chưa học' },
              { id: 'starred', label: 'Lưu Sao / Sai' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                {f.label}
              </button>
            ))}

            {overall.totalMastered > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ tiến độ 50 Chủ đề về 0?')) {
                    resetAllProgress();
                    toast.success('Đã đặt lại tiến độ 50 Chủ đề');
                  }
                }}
                className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                title="Đặt lại tiến độ"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3.5 KẾT QUẢ TÌM KIẾM TRỰC TIẾP TRONG 1500 CÂU (NẾU ĐANG TÌM KIẾM)     */}
      {/* ===================================================================== */}
      {matchingSentences.length > 0 && (
        <section className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-blue-50/50 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#0071e3] shrink-0" />
              <span className="truncate">
                Mẫu câu khớp "{searchQuery}" trong 1.500 câu:
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 shrink-0">{matchingSentences.length} câu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {matchingSentences.map((s) => (
              <div
                key={s.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex items-start justify-between gap-2.5"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 text-[10px] font-bold shrink-0">
                      Unit {s.unitNumber} • Câu #{s.number}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">{s.unitTitleVi}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.vi}</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{s.en}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speechService.speak(s.en, { rate: 0.95 })}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-slate-700 text-[#0071e3] dark:text-sky-400 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Nghe chuẩn"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() => speechService.speak(s.en, { rate: 0.72 })}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Nghe chậm 0.75x"
                  >
                    <Headphones size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/reflex-50/unit/${s.unitNumber}`)}
                    className="p-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
                    title="Mở Unit này"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 4. DANH SÁCH 50 CHỦ ĐỀ (UNIT CARDS GRID)                              */}
      {/* ===================================================================== */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
            Danh Sách Chủ Đề ({filteredUnits.length} Unit • {filteredUnits.length * 30} câu)
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#0071e3] hover:underline cursor-pointer"
            >
              Xem tất cả 50 Unit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredUnits.map((unit) => {
            const st = getUnitStats(unit.unitNumber);
            const sample1 = unit.sample1;
            const sample2 = unit.sample2;
            const topVocab = unit.topVocab || [];

            return (
              <div
                key={unit.id}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '260px' }}
                className="group rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/60 p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 shadow-2xs hover:shadow-md transition-all"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Top Row: Unit badge + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className={`px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                          st.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : st.masteredCount > 0
                            ? 'bg-[#0071e3] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        UNIT {unit.unitNumber < 10 ? `0${unit.unitNumber}` : unit.unitNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-[11px] font-medium text-slate-500">
                        30 câu • 3 cấp độ
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {st.starredCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                          <Star size={11} className="fill-amber-400" />
                          {st.starredCount}
                        </span>
                      )}
                      {st.isCompleted ? (
                        <CheckCircle2 size={17} className="text-emerald-500" />
                      ) : (
                        <span className="text-xs font-bold text-[#0071e3] dark:text-sky-400">
                          {st.masteredCount}/30 câu
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Titles */}
                  <div>
                    <h3
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}`)}
                      className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0071e3] transition-colors cursor-pointer"
                    >
                      {unit.titleEn}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {unit.titleVi}
                    </p>
                  </div>

                  {/* Key Collocation / Vocab Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {topVocab.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {v.term}
                      </span>
                    ))}
                  </div>

                  {/* Sample basic -> advanced preview (1 line on mobile, 2 lines on sm+) */}
                  <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                        <strong className="text-emerald-600 dark:text-emerald-400">#1:</strong> {sample1.en}
                      </span>
                      <button
                        onClick={() => speechService.speak(sample1.en, { rate: 0.95 })}
                        className="text-slate-400 hover:text-[#0071e3] shrink-0 cursor-pointer"
                        title="Nghe câu mẫu #1"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                    <div className="hidden sm:flex items-start justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                        <strong className="text-amber-600 dark:text-amber-400">#30:</strong> {sample2.en}
                      </span>
                      <button
                        onClick={() => speechService.speak(sample2.en, { rate: 0.95 })}
                        className="text-slate-400 hover:text-[#0071e3] shrink-0 cursor-pointer"
                        title="Nghe câu mẫu #30"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Action Buttons */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Tiến độ thuộc: {st.percent}%</span>
                      <span>
                        Viết: {st.writtenCount}/30 • Nói: {st.spokenCount}/30
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          st.isCompleted ? 'bg-emerald-500' : 'bg-[#0071e3]'
                        }`}
                        style={{ width: `${st.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}?mode=study`)}
                      className="py-2 px-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <BookOpen size={13} />
                      <span>Học 30 câu</span>
                    </button>
                    <button
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}?mode=worksheet`)}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <PenTool size={13} />
                      <span>Làm bài viết</span>
                    </button>
                    <button
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}?mode=speaking`)}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Mic size={13} />
                      <span>Nói 3 giây</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modals */}
      <Reflex50MethodGuideModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
      />

      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
