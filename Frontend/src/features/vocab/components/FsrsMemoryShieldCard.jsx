import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Volume2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  Flame,
  Award,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useVocabStore from '../store/useVocabStore';
import { calculateMemoryShield } from '../../../utils/fsrsMemoryShieldEngine';
import FsrsShieldRecoveryModal from './FsrsShieldRecoveryModal';
import { BrandFaviconSvg } from '../../../components/BrandLogo';

export default function FsrsMemoryShieldCard({
  className = '',
  compact = false,
  showTitle = true
}) {
  const navigate = useNavigate();
  const [isBodyExpanded, setIsBodyExpanded] = useState(!compact);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [wordsToReview, setWordsToReview] = useState([]);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [previewFilter, setPreviewFilter] = useState('critical'); // 'critical' | 'fading' | 'solid'
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fsrsCards = useVocabStore((s) => s.fsrsCards);
  const masteredWords = useVocabStore((s) => s.masteredWords);
  const speakWord = useVocabStore((s) => s.speakWord);

  // Tính toán trạng thái Lá Chắn Trí Nhớ theo thời gian thực
  const shield = useMemo(() => {
    return calculateMemoryShield(fsrsCards, masteredWords);
  }, [fsrsCards, masteredWords]);

  const handleStartReview = (words) => {
    if (!words || words.length === 0) return;
    setWordsToReview(words);
    setIsRecoveryOpen(true);
  };

  const previewList = useMemo(() => {
    if (previewFilter === 'critical') return shield.criticalWords.slice(0, 15);
    if (previewFilter === 'fading') return shield.fadingWords.slice(0, 15);
    return shield.solidWords.slice(0, 15);
  }, [previewFilter, shield]);

  // Màu sắc động theo cấp bậc sức khỏe
  const isPristine = shield.tier.code === 'pristine';
  const isStable = shield.tier.code === 'stable';

  const shieldTheme = isPristine
    ? {
        border: 'border-emerald-500/25',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        shieldColor: '#10b981',
        glow: 'rgba(16, 185, 129, 0.25)',
        ringBg: 'text-emerald-500'
      }
    : isStable
    ? {
        border: 'border-amber-500/25',
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
        shieldColor: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.25)',
        ringBg: 'text-amber-500'
      }
    : {
        border: 'border-rose-500/25',
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
        shieldColor: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.25)',
        ringBg: 'text-rose-500'
      };

  return (
    <div
      className={`relative overflow-hidden duo-card ${
        isPristine ? 'duo-card-green' : isStable ? 'duo-card-orange' : 'duo-card-red'
      } ${
        isBodyExpanded ? 'p-4 sm:p-7' : 'p-3 sm:p-4'
      } shadow-lg transition-all w-full min-w-0 max-w-full ${className}`}
    >
      {/* Background Decorative Ambient Radial Glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: shieldTheme.shieldColor }}
      />

      {/* 1. Header / Compact Smart HUD Bar */}
      {showTitle && (
        <div
          className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0 ${
            isBodyExpanded ? 'pb-3.5 sm:pb-5 border-b border-slate-200/70 dark:border-slate-800' : ''
          }`}
        >
          {/* Left: Mini Shield Progress Ring + Title + Quick 3-Tier Pills */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mini SVG Health Gauge */}
            <div
              onClick={() => setIsBodyExpanded((prev) => !prev)}
              className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              title="Bấm để đóng/mở chi tiết Lá Chắn Trí Nhớ"
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-slate-200/80 dark:text-slate-800"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke={shieldTheme.shieldColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="113.1"
                  strokeDashoffset={113.1 - (113.1 * shield.healthPercentage) / 100}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10.5px] sm:text-[11px] font-black text-slate-900 dark:text-white">
                {shield.healthPercentage}%
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  Lá Chắn Trí Nhớ FSRS
                </h3>
                <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold border ${shieldTheme.badge}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: shieldTheme.shieldColor }} />
                  <span>{shield.tier.label}</span>
                </span>
              </div>

              {/* Compact 3-Tier Summary Pills */}
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                  <strong className="text-slate-700 dark:text-slate-200">{shield.solidCount}</strong> vững
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" />
                  <strong className="text-slate-700 dark:text-slate-200">{shield.fadingCount}</strong> mờ
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse" />
                  <strong className="text-rose-600 dark:text-rose-400">{shield.criticalCount}</strong> cần ôn
                </span>
              </div>
            </div>
          </div>

          {/* Right: 1-Tap Quick Action + Expand/Collapse Toggle + Info */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 min-w-0 w-full sm:w-auto pt-1 sm:pt-0">
            {!isBodyExpanded && (
              <>
                {shield.criticalCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleStartReview(shield.criticalWords)}
                    className="duo-btn duo-btn-red duo-btn-xs font-black animate-duo-pulse flex-1 sm:flex-initial min-w-0 text-[10.5px] sm:text-xs py-1.5 sm:py-2"
                  >
                    <Shield size={12} className="shrink-0 animate-duo-wiggle" />
                    <span className="truncate">Ôn ngay {shield.criticalCount} từ đỏ (~{shield.estimatedReviewMinutes}p)</span>
                  </button>
                ) : shield.fadingCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleStartReview(shield.fadingWords)}
                    className="duo-btn duo-btn-blue duo-btn-xs font-black flex-1 sm:flex-initial min-w-0 text-[10.5px] sm:text-xs py-1.5 sm:py-2"
                  >
                    <Zap size={12} className="shrink-0 animate-duo-bounce" />
                    <span className="truncate">Củng cố {shield.fadingCount} từ</span>
                  </button>
                ) : (
                  <span className="duo-pill duo-pill-streak text-[10px] sm:text-[11px] truncate py-0.5 px-2">
                    ✓ Bền vững 100%
                  </span>
                )}
              </>
            )}

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0 shrink-0">
              <button
                type="button"
                onClick={() => setIsBodyExpanded((prev) => !prev)}
                className="duo-btn duo-btn-white duo-btn-xs font-black text-[10.5px] sm:text-xs py-1.5 sm:py-2 px-2.5"
              >
                <span>{isBodyExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                {isBodyExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="duo-btn duo-btn-white w-7 h-7 sm:w-8 sm:h-8 rounded-xl p-0 font-black"
                title="Tìm hiểu về cơ chế Lá Chắn Trí Nhớ"
              >
                <Info size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Collapsible Full Hero Body (Shield SVG Graphic + 3 Tiers + Loss Aversion Banner) */}
      <AnimatePresence initial={false}>
        {isBodyExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative z-10 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Interactive Animated Shield Graphic (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <div className="relative w-36 h-36 flex items-center justify-center my-1">
            
            {/* Outer Rotating Energy Ring SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-200/80 dark:text-slate-700/50"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={shieldTheme.shieldColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="276.46"
                initial={{ strokeDashoffset: 276.46 }}
                animate={{ strokeDashoffset: 276.46 - (276.46 * shield.healthPercentage) / 100 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            {/* Inner Shield Badge SVG with Gradient Fill */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <svg width="68" height="78" viewBox="0 0 24 28" fill="none" className="drop-shadow-md">
                <defs>
                  <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={shieldTheme.shieldColor} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={shieldTheme.shieldColor} stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 1L2 5V12C2 18.5 6.2 24.6 12 27C17.8 24.6 22 18.5 22 12V5L12 1Z"
                  fill="url(#shieldGrad)"
                  stroke={shieldTheme.shieldColor}
                  strokeWidth="1.2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-2xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                  {shield.healthPercentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide mt-0.5">
                  Độ Bền
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {shield.totalWords > 0 ? `Bảo vệ ${shield.totalWords} từ vựng` : 'Chưa có từ vựng'}
            </span>
            {shield.hasDecayRisk && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center justify-center gap-1">
                <TrendingDown size={13} />
                <span>Ngày mai còn {shield.projectedTomorrowPercentage}% nếu không ôn</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: 3 Tier Breakdown Cards + Loss Aversion Alert + Action CTA (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 3 Tier Status Cards (Duolingo 3D Chunky Tier Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 select-none">
            
            {/* Green Tier: Solid */}
            <div
              onClick={() => {
                setPreviewFilter('solid');
                setExpandedPreview(true);
              }}
              className={`p-3.5 duo-card duo-card-green cursor-pointer transition-transform hover:scale-[1.02] ${
                previewFilter === 'solid' && expandedPreview ? 'ring-2 ring-[#58cc02]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-3 h-3 rounded-full bg-[#58cc02] shadow-xs" />
                <span className="duo-pill text-[10px] bg-emerald-100 text-[#46a302] dark:bg-emerald-950 dark:text-[#89e219] border-emerald-300">
                  {shield.solidCount} TỪ
                </span>
              </div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-2">
                Nhớ Vững Chắc
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 font-bold">
                Xác suất nhớ &gt; 85%, độ bền an toàn cao
              </p>
            </div>

            {/* Yellow Tier: Fading */}
            <div
              onClick={() => {
                setPreviewFilter('fading');
                setExpandedPreview(true);
              }}
              className={`p-3.5 duo-card duo-card-orange cursor-pointer transition-transform hover:scale-[1.02] ${
                previewFilter === 'fading' && expandedPreview ? 'ring-2 ring-[#ff9600]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-3 h-3 rounded-full bg-[#ff9600] shadow-xs" />
                <span className="duo-pill text-[10px] bg-orange-100 text-[#c2410c] dark:bg-orange-950 dark:text-orange-400 border-orange-300">
                  {shield.fadingCount} TỪ
                </span>
              </div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-2">
                Đến Hạn Ôn Tập
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 font-bold">
                Đến lịch ôn định kỳ hoặc đang mờ dần (70–85%)
              </p>
            </div>

            {/* Red Tier: Critical / Due */}
            <div
              onClick={() => {
                setPreviewFilter('critical');
                setExpandedPreview(true);
              }}
              className={`p-3.5 duo-card duo-card-red cursor-pointer transition-transform hover:scale-[1.02] ${
                previewFilter === 'critical' && expandedPreview ? 'ring-2 ring-[#ff4b4b]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-3 h-3 rounded-full bg-[#ff4b4b] animate-pulse shadow-xs" />
                <span className="duo-pill text-[10px] bg-rose-100 text-[#b91c1c] dark:bg-rose-950 dark:text-rose-400 border-rose-300">
                  {shield.criticalCount} TỪ
                </span>
              </div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-2">
                Nguy Cơ Quên Sạch
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 font-bold">
                Suy giảm sâu (&lt; 70%) hoặc vừa quên, cần cứu ngay!
              </p>
            </div>

          </div>

          {/* Loss Aversion Warning Banner (Duolingo Cute Alert Pill) */}
          <div className="p-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-800 border-b-4 border-b-amber-400 dark:border-b-amber-950 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-extrabold">
              <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 animate-duo-bounce" />
              <span>{shield.warningBanner}</span>
            </div>
            {shield.criticalCount > 0 && (
              <span className="shrink-0 font-black text-amber-700 dark:text-amber-300 hidden sm:inline">
                Ước tính ~{shield.estimatedReviewMinutes} phút
              </span>
            )}
          </div>

          {/* CTA Actions (Duolingo 3D Chunky Push Buttons) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {shield.criticalCount > 0 ? (
              <button
                type="button"
                onClick={() => handleStartReview(shield.criticalWords, shield.healthPercentage)}
                className="duo-btn duo-btn-red duo-btn-md font-black shadow-md animate-duo-pulse flex-1 sm:flex-none"
              >
                <Shield size={16} className="animate-duo-wiggle" />
                <span>BẢO VỆ LÁ CHẮN — ÔN NGAY {shield.criticalCount} TỪ ĐỎ (~{shield.estimatedReviewMinutes}&apos;)</span>
              </button>
            ) : shield.fadingCount > 0 ? (
              <button
                type="button"
                onClick={() => handleStartReview(shield.fadingWords, shield.healthPercentage)}
                className="duo-btn duo-btn-blue duo-btn-md font-black shadow-md flex-1 sm:flex-none"
              >
                <Zap size={16} className="animate-duo-bounce" />
                <span>CỦNG CỐ LÁ CHẮN — ÔN {shield.fadingCount} TỪ MỜ NHẠT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/vocab')}
                className="duo-btn duo-btn-green duo-btn-md font-black shadow-md flex-1 sm:flex-none"
              >
                <Sparkles size={16} className="animate-duo-wiggle" />
                <span>LÁ CHẮN 100% — HỌC TIẾP TỪ MỚI</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpandedPreview((prev) => !prev)}
              className="duo-btn duo-btn-white duo-btn-md font-black text-xs"
            >
              <span>{expandedPreview ? 'Thu gọn danh sách' : 'Xem chi tiết các từ'}</span>
              {expandedPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Assistant Coaching Speech Bubble */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border-2 border-lime-300 dark:border-lime-700/60 border-b-4 border-b-[#7acc15] dark:border-b-[#5ea810] flex items-center justify-center p-1.5 shrink-0 shadow-sm animate-duo-bounce">
          <BrandFaviconSvg className="w-full h-full rounded-xl drop-shadow-xs" />
        </div>
        <div className="duo-bubble flex-1 py-2 px-3.5">
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-bold">
            <strong className="text-[#65a30d] dark:text-[#a3e635]">Hệ Thống Nhắc Nhở:</strong> &ldquo;{shield.tier.mascotMessage}&rdquo;
          </p>
        </div>
      </div>

      {/* 4. Expandable Word Preview Drawer */}
      <AnimatePresence>
        {expandedPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 pt-4 mt-4 border-t border-slate-200/70 dark:border-slate-800 overflow-hidden space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Xem nhanh danh sách từ ({previewFilter === 'critical' ? '🔴 Sắp quên' : previewFilter === 'fading' ? '🟡 Mờ nhạt' : '🟢 Vững chắc'}):
              </span>
              <span className="text-[11px] text-slate-400">Hiển thị tối đa 15 từ</span>
            </div>

            {previewList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {previewList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {item.word}
                        </span>
                        {item.pos && (
                          <span className="text-[10px] text-slate-400">({item.pos})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.meaning}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold ${
                        item.retrievability >= 85
                          ? 'text-emerald-500'
                          : item.retrievability >= 65
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}>
                        {item.retrievability}%
                      </span>
                      <button
                        type="button"
                        onClick={() => speakWord(item.word)}
                        className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-[#0071e3] flex items-center justify-center transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-3">
                Không có từ nào trong danh mục này.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Educational Info Modal explaining Loss Aversion & FSRS */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-[#0071e3] dark:text-sky-400" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Khoa Học Về Lá Chắn Trí Nhớ
                </h4>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>🧠 Hiệu ứng Tâm lý Sở hữu (Endowment Effect):</strong> Khi bạn đã nạp được một lượng từ vựng, chúng trở thành <em>tài sản cá nhân</em> của bạn.
              </p>
              <p>
                <strong>📉 Nỗi đau mất mát (Loss Aversion):</strong> Theo nghiên cứu của Kahneman &amp; Tversky, não người cảm thấy nỗi đau mất đi 10 từ vựng mạnh gấp <strong>2.5 lần</strong> niềm vui học thêm 10 từ mới.
              </p>
              <p>
                <strong>🛡️ Cơ chế FSRS DSR:</strong> Lá chắn tính toán xác suất gợi nhớ <em>Retrievability R(t, S)</em> dựa trên độ bền <em>Stability (S)</em> của từng từ. Chỉ cần 5–8 phút ôn các từ đỏ mỗi ngày, bạn sẽ giữ vững lá chắn ở mức 100% vĩnh viễn!
              </p>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-full bg-[#0071e3] text-white font-bold text-xs cursor-pointer"
            >
              Đã hiểu & Bắt đầu bảo vệ!
            </button>
          </div>
        </div>
      )}

      {/* 6. Active Recovery Flashcard Session Modal */}
      <FsrsShieldRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        wordsToReview={wordsToReview}
        initialHealth={shield.healthPercentage}
        onSuccess={() => {
          // Callback when finished
        }}
      />
    </div>
  );
}
