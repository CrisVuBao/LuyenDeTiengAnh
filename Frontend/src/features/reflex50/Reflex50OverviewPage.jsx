import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Search, BookOpen, Headphones, Mic, PenTool, CheckCircle2,
  Star, AlertCircle, ArrowRight, Layers, Volume2, Zap, Play,
  MessageCircle, Users, Briefcase, HeartPulse, HelpCircle, RotateCcw, X,
  ChevronRight
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

// Small Apple Activity / Duolingo style Circular Progress Ring for Mobile Unit Cards
function UnitProgressRing({ radius = 22, stroke = 3, percent = 0, isCompleted = false, unitNumber = 1 }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: radius * 2, height: radius * 2 }}>
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`transition-all duration-500 ${
            isCompleted
              ? 'text-emerald-500'
              : percent > 0
              ? 'text-[#0071e3]'
              : 'text-transparent'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-black text-xs select-none">
        {isCompleted ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <span className={`text-[11px] ${percent > 0 ? 'text-[#0071e3] dark:text-sky-400 font-black' : 'text-slate-600 dark:text-slate-400 font-bold'}`}>
            {unitNumber < 10 ? `0${unitNumber}` : unitNumber}
          </span>
        )}
      </div>
    </div>
  );
}

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

  // Thống kê cho từng nhóm chủ đề lớn (Category 1..5)
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

  // Tìm kiếm trực tiếp trong 1500 câu
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

  // Thông số vòng tròn tiến độ Apple Activity Ring (cho Desktop)
  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (Math.max(3, overall.overallPercent) / 100) * ringCircumference;

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-3 sm:space-y-8 pb-12 sm:pb-14">
      <SeoMeta
        title="Phản Xạ 50 Chủ Đề — 1500 Câu Nói Viết"
        description="Luyện phản xạ 1500 câu tiếng Anh theo 50 chủ đề thông dụng, kỹ thuật Chunking và Collocations bản xứ."
      />

      {/* ===================================================================== */}
      {/* 1A. NATIVE MOBILE APP HERO PAVILION (< sm)                             */}
      {/* ===================================================================== */}
      <div className="sm:hidden space-y-2.5">
        {/* Sticky/Top Header Bar */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-[#d9822b] text-white flex items-center justify-center font-black shadow-sm">
              <Zap size={16} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 dark:text-white leading-tight tracking-tight">
                Phản Xạ 50 Chủ Đề
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                1.500 câu nói viết • Phản xạ 3s
              </p>
            </div>
          </div>

          {/* Quick Utility Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMethodModalOpen(true)}
              className="p-1.5 px-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-[#c2781a] dark:text-[#fcd34d] border border-amber-300/40 dark:border-amber-700/30 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-90 transition-transform"
              title="4 bước phương pháp"
            >
              <Sparkles size={13} />
              <span>Mẹo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 cursor-pointer active:scale-90 transition-transform shadow-2xs"
              title="Giọng đọc AI"
            >
              <Headphones size={15} />
            </button>
          </div>
        </div>

        {/* Unified Hero Continue & Progress Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0f172a] text-white shadow-md shadow-slate-950/20 border border-slate-700/60 relative overflow-hidden space-y-2.5">
          <div className="pointer-events-none absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/15 rounded-full blur-xl" />

          {/* Action: Continue Study */}
          <div
            onClick={() => navigate(`/reflex-50/unit/${lastUnitObj.unitNumber}`)}
            className="flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <Play size={18} fill="currentColor" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>Tiếp tục học</span>
                  <span>•</span>
                  <span>Unit {lastUnitObj.unitNumber < 10 ? `0${lastUnitObj.unitNumber}` : lastUnitObj.unitNumber}</span>
                </div>
                <div className="text-sm font-black text-white truncate leading-snug">
                  {lastUnitObj.titleEn}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {lastUnitObj.titleVi}
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
              <ChevronRight size={15} />
            </div>
          </div>

          {/* Integrated Progress Bar & Stats */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300">
                Đã thuộc: <strong className="text-amber-400">{overall.totalMastered}</strong>/1500 câu
              </span>
              <span className="text-slate-400">
                {overall.overallPercent}% • {overall.completedUnits}/50 Unit ✓
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(3, overall.overallPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Native Horizontal Category / Stage Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers size={12} />
            <span>Tất cả (50 Unit)</span>
          </button>
          {reflex50Meta.categories.map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat.icon] || MessageCircle;
            const active = selectedCategory === cat.id;
            const st = categoryStatsMap[cat.id];
            const shortTitles = {
              'cat-1': 'Giao tiếp (U1-10)',
              'cat-2': 'Đời sống (U11-20)',
              'cat-3': 'Công việc (U21-30)',
              'cat-4': 'Sức khỏe (U31-40)',
              'cat-5': 'Nâng cao (U41-50)'
            };
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  active
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon size={12} />
                <span>Chặng {cat.order} • {shortTitles[cat.id] || cat.titleVi}</span>
                <span className="text-[10px] opacity-75 font-normal">({st?.completedUnits}/10)</span>
              </button>
            );
          })}
        </div>

        {/* Compact Search Bar & 4-Pill Status Filter Strip */}
        <div className="space-y-1.5">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề (Airport, Job...) hoặc câu..."
              className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071e3] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 1-Tap Status Filter Row (Tất cả / Đang học / Đã xong / Lưu sao) */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'in-progress', label: 'Đang học' },
              { id: 'completed', label: 'Đã xong ✓' },
              { id: 'starred', label: '⭐ Lưu sao' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1B. DESKTOP / TABLET HERO BANNER (GIỮ NGUYÊN BẢN DUOLINGO 3D)         */}
      {/* ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden sm:block duo-card p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#fffdf9] via-[#fefbf6] to-[#fbf7f0] dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0f172a] border-2 border-amber-200/50 dark:border-slate-800 border-b-6 border-b-[#d9822b]/80 dark:border-b-[#b46312]/70 shadow-sm w-full min-w-0 max-w-full relative overflow-hidden space-y-4 sm:space-y-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#d9822b]/8 to-amber-300/5 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-amber-400/6 to-yellow-400/5 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d9822b]/35 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-8 min-w-0">
          {/* Left Content */}
          <div className="space-y-2.5 sm:space-y-3.5 max-w-2xl min-w-0 flex-1">
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <div className="duo-pill duo-pill-amber text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0">
                <Zap size={13} className="text-[#d9822b] dark:text-[#fcd34d] shrink-0" />
                <span>TRỤ CỘT 02 • 50 CHỦ ĐỀ • 1.500 CÂU PHẢN XẠ 3 GIÂY</span>
              </div>

              <div className="duo-pill duo-pill-xp text-[10px] sm:text-xs font-black shrink-0">
                <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{overall.totalMastered}/1500 câu ({overall.overallPercent}%)</span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight leading-snug">
                <span className="text-slate-900 dark:text-white">
                  Phản Xạ Nói – Viết
                </span>{' '}
                <span className="text-[#c2781a] dark:text-[#fcd34d]">
                  50 Chủ Đề Tiếng Anh Thông Dụng.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed max-w-xl">
                Bật câu tiếng Anh trong <strong>3 giây</strong>, luyện viết chấm điểm từng từ và làm chủ <strong>3.400+ cụm Collocations bản xứ</strong> chia theo 5 cấp độ.
              </p>
            </div>

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

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(true)}
                  className="duo-btn duo-btn-white duo-btn-sm sm:duo-btn-md font-black text-[#c2781a] dark:text-[#fcd34d] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Zap size={14} className="text-[#c2781a] dark:text-[#fcd34d] shrink-0" />
                  <span>Phương Pháp Học</span>
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

          {/* Right Stats Card */}
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
      {/* 2. STRIP PHƯƠNG PHÁP 4 BƯỚC HỌC (Desktop Grid)                        */}
      {/* ===================================================================== */}
      <section className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3.5 pb-0.5">
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
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/50 transition-all cursor-pointer group shadow-2xs"
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
      {/* 3. BỘ LỌC 5 NHÓM CHỦ ĐỀ LỚN (CATEGORIES) & TÌM KIẾM (Desktop)         */}
      {/* ===================================================================== */}
      <section className="hidden sm:block space-y-3 sm:space-y-4">
        {/* Desktop Category Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 sm:gap-2.5 pb-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề (VD: Interview) hoặc câu tiếng Anh / Việt..."
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
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
      {/* 3.5 KẾT QUẢ TÌM KIẾM TRỰC TIẾP TRONG 1500 CÂU                         */}
      {/* ===================================================================== */}
      {matchingSentences.length > 0 && (
        <section className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-blue-50/50 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#0071e3] shrink-0" />
              <span className="truncate">
                Khớp "{searchQuery}" trong 1.500 câu:
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 shrink-0">{matchingSentences.length} câu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {matchingSentences.map((s) => (
              <div
                key={s.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex items-start justify-between gap-2.5 shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 text-[10px] font-bold shrink-0">
                      Unit {s.unitNumber} • #{s.number}
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
      {/* 4. DANH SÁCH 50 CHỦ ĐỀ                                                */}
      {/* ===================================================================== */}
      <section className="space-y-2.5 sm:space-y-4">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white">
            Danh Sách Chủ Đề ({filteredUnits.length} Unit)
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-[#0071e3] hover:underline cursor-pointer"
            >
              Xem tất cả 50 Unit
            </button>
          )}
        </div>

        {/* 4A. NATIVE MOBILE APP COMPACT UNIT CARD LIST (< sm) */}
        <div className="space-y-3 sm:hidden">
          {/* Helper render function for each mobile unit card */}
          {(() => {
            const renderMobileCard = (unit) => {
              const st = getUnitStats(unit.unitNumber);
              const isDone = st.isCompleted;
              const isStarted = st.masteredCount > 0;
              const topVocab = unit.topVocab || [];

              return (
                <div
                  key={`m-${unit.id}`}
                  className={`p-3 rounded-2xl border transition-all shadow-2xs ${
                    isDone
                      ? 'bg-emerald-500/[0.04] dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-800/60'
                      : isStarted
                      ? 'bg-white dark:bg-slate-900 border-blue-200/90 dark:border-blue-900/50 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Main Tappable Area */}
                  <div
                    onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}`)}
                    className="flex items-center gap-3 cursor-pointer active:opacity-75 transition-opacity"
                  >
                    {/* Apple-style Circular Progress Ring with Unit Number */}
                    <UnitProgressRing
                      radius={22}
                      stroke={3}
                      percent={st.percent}
                      isCompleted={isDone}
                      unitNumber={unit.unitNumber}
                    />

                    {/* Unit Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                          {unit.titleEn}
                        </h3>
                        {st.starredCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                            <Star size={10} className="fill-amber-400" />
                            {st.starredCount}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {unit.titleVi}
                      </p>

                      {/* 2 Key Collocation Preview Chips */}
                      {topVocab.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 overflow-hidden">
                          {topVocab.slice(0, 2).map((v, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[130px]"
                            >
                              {v.term}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-400">
                        <span className={isDone ? 'text-emerald-600 dark:text-emerald-400' : isStarted ? 'text-[#0071e3] dark:text-sky-400' : ''}>
                          {isDone ? 'Hoàn thành 30/30 câu ✓' : isStarted ? `${st.masteredCount}/30 câu (${st.percent}%)` : '30 câu • 3 cấp độ'}
                        </span>
                      </div>
                    </div>

                    {/* Right Chevron */}
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* 3 Instant Quick Mode Pills */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}?mode=study`)}
                      className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-300 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <BookOpen size={11} />
                      <span>30 Câu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}?mode=worksheet`)}
                      className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <PenTool size={11} />
                      <span>Viết</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/reflex-50/unit/${unit.unitNumber}?mode=speaking`)}
                      className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Mic size={11} />
                      <span>Nói 3s</span>
                    </button>
                  </div>
                </div>
              );
            };

            {/* When viewing All without search/filter -> Group by 5 Chapters */}
            if (selectedCategory === 'all' && !searchQuery.trim() && statusFilter === 'all') {
              return reflex50Meta.categories.map((cat) => {
                const catUnits = filteredUnits.filter((u) => u.categoryId === cat.id);
                if (catUnits.length === 0) return null;
                const st = categoryStatsMap[cat.id];
                const Icon = CATEGORY_ICON_MAP[cat.icon] || MessageCircle;

                return (
                  <div key={cat.id} className="space-y-2 pt-2 first:pt-0">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-[#0071e3]/10 dark:bg-sky-400/10 text-[#0071e3] dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Icon size={12} />
                        </div>
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate">
                          Chặng {cat.order}: {cat.titleVi}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        {st?.completedUnits}/10 U • {st?.percent}%
                      </span>
                    </div>

                    {catUnits.map(renderMobileCard)}
                  </div>
                );
              });
            }

            return filteredUnits.map(renderMobileCard);
          })()}
        </div>

        {/* 4B. DESKTOP / TABLET CARDS GRID (sm+) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

                  {/* Sample basic -> advanced preview */}
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
