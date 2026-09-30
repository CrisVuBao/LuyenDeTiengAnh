import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Tv,
  MessageCircle,
  Newspaper,
  Music,
  Briefcase,
  BookOpen,
  TrendingUp,
  Zap,
  Sliders,
  RotateCcw,
  Share2,
  Check,
  ChevronRight,
  Info,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  calculateCompetenceRadar,
  getRadarCoordinates,
  getLevelBadge
} from '../../../utils/competenceRadarEngine';
import useAuthStore from '../../../store/authStore';

const DOMAIN_ICONS = {
  conversation: MessageCircle,
  netflix: Tv,
  news: Newspaper,
  music: Music,
  workplace: Briefcase,
  literature: BookOpen
};

const DOMAIN_LINKS = {
  conversation: '/reflex-50',
  netflix: '/communication',
  news: '/vocab',
  music: '/communication',
  workplace: '/toeic',
  literature: '/vocab'
};

export default function CompetenceRadarCard({
  wordsMastered = 0,
  reflexMastered = 0,
  binoLessonsCompleted = 0,
  toeicCompleted = 0,
  className = '',
  compact = false
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [extraWords, setExtraWords] = useState(25);
  const [extraReflex, setExtraReflex] = useState(15);
  const [selectedDomainId, setSelectedDomainId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Baseline real data
  const baseData = useMemo(() => {
    return calculateCompetenceRadar({
      wordsMastered,
      reflexMastered,
      binoLessonsCompleted,
      toeicCompleted,
      simulationExtraWords: 0,
      simulationExtraReflex: 0
    });
  }, [wordsMastered, reflexMastered, binoLessonsCompleted, toeicCompleted]);

  // Active displayed data (with simulation if enabled)
  const currentData = useMemo(() => {
    if (!isSimulating) return baseData;
    return calculateCompetenceRadar({
      wordsMastered,
      reflexMastered,
      binoLessonsCompleted,
      toeicCompleted,
      simulationExtraWords: extraWords,
      simulationExtraReflex: extraReflex
    });
  }, [baseData, isSimulating, extraWords, extraReflex, wordsMastered, reflexMastered, binoLessonsCompleted, toeicCompleted]);

  // Radar geometry
  const radarCoords = useMemo(() => {
    return getRadarCoordinates(currentData.domains, 160, 160, 110);
  }, [currentData.domains]);

  // Baseline radar geometry for comparison when simulating
  const baseRadarCoords = useMemo(() => {
    return getRadarCoordinates(baseData.domains, 160, 160, 110);
  }, [baseData.domains]);

  const overallDelta = Math.round((currentData.overall - baseData.overall) * 10) / 10;

  const handleShare = () => {
    const text = `🎯 Radar Năng Lực Tiếng Anh của mình trên ứng dụng:
- 🌍 Tổng thể: Hiểu ${currentData.overall}% Thế Giới!
- 💬 Giao tiếp hàng ngày: ${currentData.domains.find(d => d.id === 'conversation')?.percentage}%
- 📺 Xem phim Netflix không sub: ${currentData.domains.find(d => d.id === 'netflix')?.percentage}%
- 💼 Giao tiếp công sở: ${currentData.domains.find(d => d.id === 'workplace')?.percentage}%
- 📰 Đọc báo quốc tế: ${currentData.domains.find(d => d.id === 'news')?.percentage}%
Cùng luyện tiếng Anh phản xạ thực chiến nhé! 🔥`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép kết quả Radar năng lực vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* ===== 1. TOP HEADER BANNER ===== */}
      <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
              <Zap size={12} className="animate-pulse text-amber-300" />
              <span>F1 • Năng Lực Thực Tế</span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Identity-Based Mastery Tracker
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            🎯 Bạn Hiểu Bao Nhiêu % Thế Giới?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Đo lường năng lực ứng dụng thực chiến trong đời thật thay vì điểm số trừu tượng. Mỗi từ vựng và câu phản xạ bạn thuộc đều mở rộng % hiểu biết thế giới!
          </p>
        </div>

        {/* Global Competence Score Gauge */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 text-center min-w-[130px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-100 block">
              Tổng Thể Thế Giới
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentData.overall}%
              </span>
              {isSimulating && overallDelta > 0 && (
                <span className="text-xs font-black text-emerald-300 animate-pulse">
                  +{overallDelta}%
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-blue-200 block mt-0.5">
              +{currentData.dailyGain}% hôm nay ⚡
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Dự báo tương lai khi học thêm"
            >
              <Sliders size={15} />
              <span className="hidden sm:inline">Giả Lập</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Chia sẻ Radar năng lực"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">Khoe</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== 2. SIMULATION CONTROLLER DRAWER (EXPANDABLE) ===== */}
      <AnimatePresence>
        {isSimulating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20 px-5 sm:px-7 py-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-950 dark:text-amber-200">
                    🔮 Dự Báo Năng Lực: "Nếu bạn học thêm trong tuần này..."
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Kéo thanh trượt để xem % thực tế ngoài đời sẽ tăng vọt ra sao khi bạn tích lũy thêm từ vựng và phản xạ!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Words Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    +{extraWords} Từ mới:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={extraWords}
                    onChange={(e) => setExtraWords(Number(e.target.value))}
                    className="w-24 sm:w-32 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Reflex Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    +{extraReflex} Phản xạ:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={extraReflex}
                    onChange={(e) => setExtraReflex(Number(e.target.value))}
                    className="w-24 sm:w-32 accent-amber-500 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => {
                    setExtraWords(0);
                    setExtraReflex(0);
                  }}
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đặt lại mức thực tế"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 3. MAIN CONTENT: RADAR CHART + DOMAIN METRICS GRID ===== */}
      <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: INTERACTIVE SVG RADAR HEXAGON (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
            
            <svg
              viewBox="0 0 320 320"
              className="w-full h-full overflow-visible drop-shadow-md select-none"
            >
              <defs>
                {/* Glow Radial Gradient for Radar Web */}
                <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#6366f1" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </radialGradient>

                {/* Polygon Area Gradient */}
                <linearGradient id="radarPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                </linearGradient>

                {/* Simulated Polygon Gradient when Active */}
                <linearGradient id="radarSimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Ambient center aura */}
              <circle cx="160" cy="160" r="110" fill="url(#radarCenterGlow)" />

              {/* Concentric Hexagon Background Rings */}
              {radarCoords.rings.map((ringPoints, idx) => (
                <polygon
                  key={idx}
                  points={ringPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={idx === 4 ? '1.5' : '1'}
                  strokeDasharray={idx === 4 ? 'none' : '3 3'}
                  className="text-slate-300/80 dark:text-slate-700/80"
                />
              ))}

              {/* Axis lines from center to outer ring */}
              {radarCoords.axes.map((axis, idx) => (
                <line
                  key={idx}
                  x1={axis.x1}
                  y1={axis.y1}
                  x2={axis.x2}
                  y2={axis.y2}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-800"
                />
              ))}

              {/* Baseline Ghost Polygon (if simulating, show previous shape as dashed outline) */}
              {isSimulating && overallDelta > 0 && (
                <polygon
                  points={baseRadarCoords.polygonString}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
              )}

              {/* Filled Animated Radar Polygon */}
              <motion.polygon
                points={radarCoords.polygonString}
                fill={isSimulating ? 'url(#radarSimGrad)' : 'url(#radarPolygonGrad)'}
                stroke={isSimulating ? '#f59e0b' : '#3b82f6'}
                strokeWidth="2.5"
                strokeLinejoin="round"
                animate={{ points: radarCoords.polygonString }}
                transition={{ type: 'spring', damping: 20, stiffness: 180 }}
                className="transition-colors duration-300"
              />

              {/* Vertex Points & Interactive Pins */}
              {radarCoords.points.map((p, idx) => {
                const isSelected = selectedDomainId === p.domain.id;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onClick={() => setSelectedDomainId(isSelected ? null : p.domain.id)}
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="10"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer marker dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 6 : 4.5}
                      fill="#ffffff"
                      stroke={p.domain.accentColor}
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-125"
                    />
                  </g>
                );
              })}

              {/* Center Dot */}
              <circle cx="160" cy="160" r="3" fill="#64748b" />
            </svg>

            {/* Floating Labels Around SVG */}
            {radarCoords.axes.map((axis) => {
              const Icon = DOMAIN_ICONS[axis.domain.id] || Sparkles;
              const isSelected = selectedDomainId === axis.domain.id;
              return (
                <button
                  key={axis.domain.id}
                  onClick={() => setSelectedDomainId(isSelected ? null : axis.domain.id)}
                  style={{
                    position: 'absolute',
                    left: `${(axis.labelX / 320) * 100}%`,
                    top: `${(axis.labelY / 320) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`p-1.5 rounded-xl border flex items-center gap-1 text-[10px] font-black transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 scale-105 z-20'
                      : 'bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:scale-105 z-10'
                  }`}
                >
                  <Icon size={12} className={isSelected ? 'text-white' : 'text-blue-500'} />
                  <span>{axis.domain.shortName}</span>
                  <span className={isSelected ? 'text-blue-200' : 'text-slate-400 font-extrabold'}>
                    {axis.domain.percentage}%
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-6 text-center">
            💡 Chạm vào các đỉnh hoặc thẻ bên phải để xem phân tích chi tiết từng lĩnh vực
          </p>
        </div>

        {/* RIGHT COLUMN: 6 DOMAIN PROGRESS CARDS (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentData.domains.map((domain) => {
              const Icon = DOMAIN_ICONS[domain.id] || Sparkles;
              const isSelected = selectedDomainId === domain.id;
              const linkTo = DOMAIN_LINKS[domain.id] || '/home';

              return (
                <div
                  key={domain.id}
                  onClick={() => setSelectedDomainId(isSelected ? null : domain.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-slate-800/80'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${domain.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {domain.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {domain.levelLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {domain.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden mb-2">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${domain.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${domain.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Footer / Tip / CTA */}
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium truncate pr-2">
                      {domain.milestone.label}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(linkTo);
                      }}
                      className="font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Học ngay</span>
                      <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== 4. MASCOT BINO MOTIVATIONAL COACHING BAR ===== */}
      <div className="px-5 sm:px-7 py-4 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
            🐱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                Hướng Dẫn & Động Viên:
              </span>
              <span className="px-2 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                Khuyên Học
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
              "{currentData.mascotMessage}"
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const lowest = currentData.lowestDomain;
            const targetLink = DOMAIN_LINKS[lowest?.id] || '/reflex-50';
            navigate(targetLink);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>Luyện {currentData.lowestDomain?.shortName} Ngay</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ===== 5. SHARE RADAR MODAL ===== */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 text-center space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Award size={28} />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-sky-400 block mb-1">
                  Chứng Nhận Năng Lực Tiếng Anh
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {user?.fullName || 'Học Viên'} Hiểu {currentData.overall}% Thế Giới!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đo lường năng lực phản xạ giao tiếp & từ vựng Oxford 3000 thực chiến
                </p>
              </div>

              {/* Domain scores recap list */}
              <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                {currentData.domains.map((d) => (
                  <div key={d.id} className="text-xs">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      {d.shortName}
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {d.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                  <span>{copied ? 'Đã Sao Chép!' : 'Sao Chép Thành Tích'}</span>
                </button>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
