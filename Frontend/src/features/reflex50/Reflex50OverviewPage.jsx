import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, BookOpen, Headphones, Mic, PenTool, CheckCircle2,
  Star, AlertCircle, ArrowRight, Layers, FileText, Volume2, Zap,
  MessageCircle, Users, Briefcase, HeartPulse, HelpCircle, RotateCcw, X
} from 'lucide-react';
import reflex50Data from './data/reflex50Data.json';
import useReflex50Store from './store/useReflex50Store';
import Reflex50MethodGuideModal from './components/Reflex50MethodGuideModal';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import speechService from '../../utils/speechService';
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

  const masteredIds = useReflex50Store((s) => s.masteredIds);
  const starredIds = useReflex50Store((s) => s.starredIds);
  const weakIds = useReflex50Store((s) => s.weakIds);
  const writingHistory = useReflex50Store((s) => s.writingHistory);
  const speakingHistory = useReflex50Store((s) => s.speakingHistory);
  const lastStudiedUnit = useReflex50Store((s) => s.lastStudiedUnit);
  const getOverallStats = useReflex50Store((s) => s.getOverallStats);
  const getUnitStats = useReflex50Store((s) => s.getUnitStats);
  const resetAllProgress = useReflex50Store((s) => s.resetAllProgress);

  const overall = getOverallStats();
  const lastUnitObj =
    reflex50Data.units.find((u) => u.unitNumber === lastStudiedUnit) || reflex50Data.units[0];

  // Thống kê cho từng nhóm chủ đề lớn (Category 1..5)
  const categoryStatsMap = useMemo(() => {
    const map = {};
    for (const cat of reflex50Data.categories) {
      const catUnits = reflex50Data.units.filter((u) => u.categoryId === cat.id);
      let masteredSentences = 0;
      let completedUnits = 0;
      for (const u of catUnits) {
        const mCount = u.sentences.filter((s) => masteredIds[s.id]).length;
        masteredSentences += mCount;
        if (mCount >= u.sentences.length) completedUnits++;
      }
      map[cat.id] = {
        masteredSentences,
        totalSentences: catUnits.length * 30,
        completedUnits,
        totalUnits: catUnits.length,
        percent: Math.round((masteredSentences / (catUnits.length * 30)) * 100)
      };
    }
    return map;
  }, [masteredIds]);

  // Lọc danh sách 50 Units
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reflex50Data.units.filter((unit) => {
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
        String(unit.unitNumber) === q;
      if (matchTitle) return true;

      return unit.sentences.some(
        (s) =>
          s.vi.toLowerCase().includes(q) ||
          s.en.toLowerCase().includes(q) ||
          s.hints.some((h) => h.term.toLowerCase().includes(q) || h.meaning.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, statusFilter, searchQuery, masteredIds, starredIds, weakIds, writingHistory, speakingHistory]);

  // Nếu người dùng nhập từ khóa tìm kiếm >= 2 ký tự: trả về tối đa 12 câu khớp trực tiếp trong 1500 câu
  const matchingSentences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results = [];
    for (const unit of reflex50Data.units) {
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
  }, [searchQuery]);

  // Thông số vòng tròn tiến độ Apple Activity Ring
  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (Math.max(3, overall.overallPercent) / 100) * ringCircumference;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-14">
      {/* ===================================================================== */}
      {/* 1. APPLE STUDIO HERO BANNER                                           */}
      {/* ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Content */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/70 text-[#0071e3] dark:text-sky-400 text-xs font-semibold">
              <Sparkles size={13} />
              <span>50 Chủ Đề Giao Tiếp Thực Chiến • 1.500 Câu Phản Xạ Nói - Viết</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Phản Xạ Nói – Viết <span className="text-[#0071e3]">50 Chủ Đề</span> Tiếng Anh Thông Dụng
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Làm chủ trọn bộ <strong>1.500 câu giao tiếp từ Cơ bản đến Chuyên sâu</strong> (30 câu/chủ đề) kết hợp <strong>3.400+ cụm từ gợi ý</strong> và <strong>Collocations bản xứ</strong>. Học theo phương pháp Tư duy Cụm từ (Chunking), Phản xạ Nói 3 Giây và Làm bài Viết chấm điểm từng từ.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => navigate(`/reflex-50/unit/${lastUnitObj.unitNumber}`)}
                className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>
                  Học tiếp Unit {lastUnitObj.unitNumber}: {lastUnitObj.titleEn}
                </span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => setIsMethodModalOpen(true)}
                className="px-4 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap size={15} className="text-amber-400 dark:text-[#0071e3]" />
                <span>Phương Pháp Học & Làm Bài Hiệu Quả</span>
              </button>

              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-3.5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Cài đặt giọng đọc AI Studio & tốc độ đọc"
              >
                <Headphones size={15} className="text-[#0071e3]" />
                <span>Giọng đọc AI</span>
              </button>
            </div>
          </div>

          {/* Right Stats Card */}
          <div className="shrink-0 w-full lg:w-80 p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tiến độ làm chủ 1.500 câu
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {overall.totalMastered} <span className="text-sm font-normal text-slate-400">/ 1500 câu</span>
                </div>
                <div className="text-xs text-[#0071e3] dark:text-sky-400 font-medium mt-0.5">
                  Đã hoàn thành {overall.completedUnits}/50 Unit
                </div>
              </div>

              {/* SVG Progress Ring */}
              <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                <svg className="w-18 h-18 -rotate-90" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r={ringRadius}
                    fill="none"
                    stroke="#0071e3"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900 dark:text-white">
                  {overall.overallPercent}%
                </span>
              </div>
            </div>

            {/* Mini breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{overall.totalWritten}</div>
                <div className="text-[10px] text-slate-500">Đã làm viết</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{overall.totalSpoken}</div>
                <div className="text-[10px] text-slate-500">Đã luyện nói</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {overall.totalStarred + overall.totalWeak}
                </div>
                <div className="text-[10px] text-slate-500">Cần ôn kỹ</div>
              </div>
            </div>

            {/* Daily target bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Mục tiêu hôm nay (1 Unit = 30 câu)
                </span>
                <span className="font-bold text-[#0071e3] dark:text-sky-400">
                  {overall.todayCount}/{overall.dailyGoal} câu
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((overall.todayCount / overall.dailyGoal) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===================================================================== */}
      {/* 2. STRIP PHƯƠNG PHÁP 4 BƯỚC HỌC GIAO TIẾP & LÀM BÀI HIỆU QUẢ         */}
      {/* ===================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#0071e3] transition-colors">
                  {item.step}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.accent}`}>
                  <Icon size={16} />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </section>

      {/* ===================================================================== */}
      {/* 3. BỘ LỌC 5 NHÓM CHỦ ĐỀ LỚN (CATEGORIES) & TÌM KIẾM                  */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        {/* Category Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Tất cả 50 Chủ đề</span>
              <Layers size={15} className="opacity-80" />
            </div>
            <div className="text-lg font-bold mt-1.5">1.500 câu</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              Đã thuộc {overall.totalMastered} câu ({overall.overallPercent}%)
            </div>
          </button>

          {reflex50Data.categories.map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat.icon] || MessageCircle;
            const st = categoryStatsMap[cat.id];
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0071e3]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    Nhóm {cat.order} (U{cat.unitRange[0]}–{cat.unitRange[1]})
                  </span>
                  <Icon size={15} className={active ? 'text-white' : 'text-[#0071e3]'} />
                </div>
                <div className="text-xs font-bold mt-1 line-clamp-1">{cat.titleVi}</div>
                <div className="text-[11px] opacity-80 mt-1">
                  {st.masteredSentences}/300 câu • {st.completedUnits}/10 Unit
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề (VD: Interview, Restaurant, Airport) hoặc tìm bất kỳ mẫu câu tiếng Anh / tiếng Việt nào..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071e3]"
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

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'in-progress', label: 'Đang học' },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'unstarted', label: 'Chưa học' },
              { id: 'starred', label: 'Có câu Lưu Sao / Sai' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
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
                className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
        <section className="p-5 rounded-3xl bg-blue-50/50 dark:bg-slate-900 border border-blue-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={15} className="text-[#0071e3]" />
              <span>
                Tìm thấy nhanh mẫu câu khớp từ khóa "{searchQuery}" trong kho 1.500 câu:
              </span>
            </h3>
            <span className="text-xs text-slate-500">Hiển thị {matchingSentences.length} câu tiêu biểu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {matchingSentences.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-sky-400 text-[10px] font-bold">
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Danh Sách Chủ Đề ({filteredUnits.length} Unit • {filteredUnits.length * 30} câu)
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#0071e3] hover:underline cursor-pointer"
            >
              Xem toàn bộ 50 Unit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const st = getUnitStats(unit.unitNumber);
            const sample1 = unit.sentences[0];
            const sample2 = unit.sentences[29];
            const topVocab = unit.keyVocab.slice(0, 4);

            return (
              <motion.div
                key={unit.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#0071e3]/60 p-5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  {/* Top Row: Unit badge + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          st.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : st.masteredCount > 0
                            ? 'bg-[#0071e3] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        UNIT {unit.unitNumber < 10 ? `0${unit.unitNumber}` : unit.unitNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500">
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
                        <CheckCircle2 size={18} className="text-emerald-500" />
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
                  <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
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
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                        <strong className="text-purple-600 dark:text-purple-400">#30:</strong> {sample2.en}
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
              </motion.div>
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
