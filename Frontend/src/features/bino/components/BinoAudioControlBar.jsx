import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, Eye, EyeOff, ListMusic, Headphones,
  Repeat, Repeat1, Infinity as InfinityIcon, ChevronDown, X, Check, RotateCcw,
  Sparkles, Lightbulb
} from 'lucide-react';
import { SPEECH_SPEED_PRESETS } from '../../../utils/speechService';
import toast from 'react-hot-toast';

const checkIsInfinite = (val) => {
  if (val === 'infinite' || val === 'Infinity' || val === Infinity || val === '∞') return true;
  if (val === 0 || val === '0' || val === -1 || val === '-1') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'infinite' || s === 'infinity' || s === '∞' || s.includes('inf') || s.includes('vô hạn') || s === '0' || s === 'all';
  }
  return false;
};

export default function BinoAudioControlBar({
  isPlayingAll,
  playAllLines,
  stopPlayback,
  activeLineIndex,
  lesson,
  repeatCount,
  setRepeatCount,
  repeatScope,
  setRepeatScope,
  currentLoopCycle,
  showVietsub,
  setShowVietsub,
  audioSpeed,
  handleChangeSpeed,
  openPlaylist,
  book,
  setIsVoiceSettingsOpen,
  setIsGuideModalOpen
}) {
  const [isRepeatMenuOpen, setIsRepeatMenuOpen] = useState(false);
  const [customRepeatInput, setCustomRepeatInput] = useState('');
  const repeatMenuRef = useRef(null);

  // Click outside to close repeat popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (repeatMenuRef.current && !repeatMenuRef.current.contains(e.target)) {
        setIsRepeatMenuOpen(false);
      }
    };
    if (isRepeatMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRepeatMenuOpen]);

  const handleSelectRepeatCount = (count) => {
    const isInf = checkIsInfinite(count);
    const finalVal = isInf ? 'infinite' : parseInt(count);
    setRepeatCount(finalVal);
    localStorage.setItem('bino_repeat_count', finalVal.toString());
    if (isInf) {
      toast.success('Đã chọn chế độ Lặp Vô Hạn (∞) ✨', { icon: '♾️' });
    } else {
      toast.success(`Đã chọn lặp lại ${finalVal} lần`);
    }
  };

  const handleSelectRepeatScope = (scope) => {
    setRepeatScope(scope);
    localStorage.setItem('bino_repeat_scope', scope);
  };

  const handleApplyCustomRepeat = () => {
    const trimmed = customRepeatInput.trim().toLowerCase();
    if (checkIsInfinite(trimmed)) {
      handleSelectRepeatCount('infinite');
      setIsRepeatMenuOpen(false);
      return;
    }
    const val = parseInt(trimmed);
    if (!isNaN(val) && val > 0) {
      handleSelectRepeatCount(val);
      setIsRepeatMenuOpen(false);
    } else {
      toast.error('Vui lòng nhập số hợp lệ lớn hơn 0 hoặc "vô hạn"');
    }
  };

  const handleCycleSpeed = () => {
    const commonSpeeds = [0.75, 0.85, 0.95, 1.0, 1.15];
    const curIdx = commonSpeeds.findIndex(s => Math.abs(s - audioSpeed) < 0.05);
    const nextIdx = (curIdx + 1) % commonSpeeds.length;
    handleChangeSpeed(commonSpeeds[nextIdx]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 sm:p-5 rounded-2xl sm:rounded-[28px] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] bg-white/95 dark:bg-[#0c101a]/95 backdrop-blur-2xl relative ${
        isRepeatMenuOpen ? 'z-40' : 'z-20'
      }`}
    >
      {/* ============================================================== */}
      {/* 📱 MOBILE VIEW: COMPACT NATIVE AUDIO CONTROLLER (block sm:hidden) */}
      {/* ============================================================== */}
      <div className="block sm:hidden space-y-2.5">
        {/* Row 1: Play/Pause button with live progress */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={playAllLines}
          className={`w-full py-2.5 px-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-md cursor-pointer ${
            isPlayingAll
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-500/25 ring-2 ring-sky-300'
              : 'bg-gradient-to-r from-[#0071e3] to-sky-600 text-white shadow-blue-500/25'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {isPlayingAll ? <Pause size={14} /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </div>

          <div className="min-w-0 text-left flex-1">
            <div className="text-xs font-black tracking-wide truncate">
              {isPlayingAll ? 'TẠM DỪNG HỘI THOẠI' : 'NGHE TOÀN BỘ HỘI THOẠI'}
            </div>
            <div className="text-[10px] font-medium opacity-90 truncate">
              {isPlayingAll
                ? activeLineIndex !== null
                  ? `Đang đọc câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0} • ${checkIsInfinite(repeatCount) ? `Vòng ${currentLoopCycle}/∞` : `Vòng ${currentLoopCycle}/${repeatCount}`}`
                  : 'Đang đọc...'
                : `${lesson?.dialogueLines?.length || 0} câu • Giọng kịch tính Studio AI`}
            </div>
          </div>

          {isPlayingAll && (
            <div className="flex items-end gap-0.5 h-3.5 shrink-0 pr-1">
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
              <span className="equalizer-bar" />
            </div>
          )}
        </motion.button>

        {/* Row 2: Touch-optimized Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {/* Vietsub Toggle Chip */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowVietsub(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
              showVietsub
                ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-400 border-blue-500/30 shadow-2xs'
                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400 border-slate-200 dark:border-white/10'
            }`}
          >
            {showVietsub ? <Eye size={12} className="text-[#0071e3] dark:text-sky-400" /> : <EyeOff size={12} />}
            <span>{showVietsub ? 'Sub: Bật' : 'Sub: Tắt'}</span>
          </motion.button>

          {/* Speed Cycle Chip */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleCycleSpeed}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
            title="Bấm để chuyển nhanh tốc độ"
          >
            <Headphones size={12} className="text-[#0071e3]" />
            <span>{audioSpeed}x</span>
          </motion.button>

          {/* Repeat Popover Trigger */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsRepeatMenuOpen(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
              checkIsInfinite(repeatCount) || repeatCount !== 1
                ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-400 border-blue-500/30'
                : 'bg-slate-100/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10'
            }`}
          >
            {checkIsInfinite(repeatCount) ? (
              <InfinityIcon size={12} className="text-[#0071e3]" />
            ) : (
              <Repeat size={12} className={repeatCount !== 1 ? 'text-[#0071e3]' : 'text-slate-400'} />
            )}
            <span>{checkIsInfinite(repeatCount) ? 'Lặp: ∞' : `Lặp: ${repeatCount}x`}</span>
          </motion.button>

          {/* Voice AI */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsVoiceSettingsOpen(true)}
            className="px-2.5 py-1.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#0071e3] dark:text-sky-300 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Sparkles size={12} />
            <span>Giọng AI</span>
          </motion.button>

          {/* Playlist */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (isPlayingAll) stopPlayback(false);
              openPlaylist({
                ids: lesson ? [lesson.id] : null,
                autoStart: false,
                minimized: false,
                book
              });
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <ListMusic size={12} className="text-[#0071e3]" />
            <span>DS phát</span>
          </motion.button>

          {/* Guide */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsGuideModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Lightbulb size={12} />
            <span>Mẹo</span>
          </motion.button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 💻 DESKTOP VIEW: FULL STUDIO TOOLBAR (hidden sm:block space-y-3) */}
      {/* ============================================================== */}
      <div className="hidden sm:block space-y-3">
        {/* TẦNG 1: NÚT PLAY/PAUSE CHÍNH & LIVE SOUNDWAVE */}
        <div className="flex flex-row items-center justify-between gap-3">
          {/* Main Big Play/Pause Button - Apple Sapphire Blue #0071e3 */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={playAllLines}
            className={`px-5 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer ${
              isPlayingAll
                ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-[0_4px_20px_rgba(14,165,233,0.35)]'
                : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_4px_20px_rgba(0,113,227,0.3)]'
            }`}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white/20 text-white">
              {isPlayingAll ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            </div>

            <div className="text-left min-w-0">
              <div className="text-xs font-black tracking-wide truncate">
                {isPlayingAll ? 'TẠM DỪNG BÀI HỘI THOẠI' : 'NGHE TOÀN BỘ HỘI THOẠI'}
              </div>
              <div className="text-[11px] font-medium opacity-90 truncate">
                {isPlayingAll
                  ? activeLineIndex !== null
                    ? `Đang đọc câu ${activeLineIndex + 1}/${lesson?.dialogueLines?.length || 0} • ${checkIsInfinite(repeatCount) ? `Vòng ${currentLoopCycle}/∞` : `Vòng ${currentLoopCycle}/${repeatCount}`}`
                    : 'Đang đọc...'
                  : `${lesson?.dialogueLines?.length || 0} lượt thoại • Giọng kịch tính Studio AI`}
              </div>
            </div>

            {isPlayingAll && (
              <div className="flex items-end gap-0.5 h-4 ml-1 shrink-0">
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
              </div>
            )}
          </motion.button>

          {/* Quick Info & Playlist Shortcut on the right */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVietsub(prev => !prev)}
              className={`px-3.5 py-2.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                showVietsub 
                  ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-400 border-blue-500/30'
                  : 'bg-white/60 dark:bg-white/[0.03] text-slate-400 border-slate-200 dark:border-white/10'
              }`}
              title={showVietsub ? 'Tắt dịch tiếng Việt' : 'Bật dịch tiếng Việt'}
            >
              {showVietsub ? <Eye size={13} className="text-[#0071e3] dark:text-sky-400 shrink-0" /> : <EyeOff size={13} className="shrink-0" />}
              <span className="font-vietsub truncate">{showVietsub ? 'Vietsub: Bật' : 'Vietsub: Tắt'}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isPlayingAll) stopPlayback(false);
                openPlaylist({
                  ids: lesson ? [lesson.id] : null,
                  autoStart: false,
                  minimized: false,
                  book
                });
              }}
              className="px-3.5 py-2.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.06] hover:bg-slate-200/60 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Mở trình phát liên tục tất cả các bài"
            >
              <ListMusic size={13} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
              <span className="truncate">Phát Nhiều Bài 🎧</span>
            </motion.button>
          </div>
        </div>

      {/* TẦNG 2: THANH ACTION CHUYÊN NGHIỆP */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar rounded-full bg-slate-100/90 dark:bg-white/[0.05] p-1 text-[11px] font-semibold border border-slate-200/60 dark:border-white/[0.08] gap-0.5">
            <span className="text-[10px] text-slate-400 px-2 font-bold uppercase shrink-0 flex items-center gap-1">
              Tốc độ:
            </span>
            {SPEECH_SPEED_PRESETS.map((preset) => {
              const isSelected = Math.abs(audioSpeed - preset.value) < 0.02;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleChangeSpeed(preset.value)}
                  title={preset.desc}
                  className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0071e3] text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {preset.isSlow && <Headphones size={11} className={isSelected ? 'text-white' : 'text-slate-400'} />}
                  <span>{preset.label}</span>
                  {isSelected && (
                    <span className="text-[10px] hidden md:inline opacity-80">
                      ({preset.shortTag})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Repeat + Voice AI + 4-Step Guide */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative z-50 shrink-0" ref={repeatMenuRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRepeatMenuOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs border cursor-pointer ${
                  checkIsInfinite(repeatCount)
                    ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-300 border-blue-500/30'
                    : repeatCount !== 1
                    ? 'bg-blue-500/10 text-[#0071e3] dark:text-sky-300 border-blue-500/30'
                    : 'bg-white/90 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                {checkIsInfinite(repeatCount) ? (
                  <InfinityIcon size={13} className="text-[#0071e3] animate-pulse shrink-0" />
                ) : (
                  <Repeat size={12} className={repeatCount !== 1 ? 'text-[#0071e3] shrink-0' : 'text-slate-400 shrink-0'} />
                )}
                <span className="whitespace-nowrap">
                  {checkIsInfinite(repeatCount)
                    ? 'Lặp: ∞'
                    : `Lặp: ${repeatCount}x`}
                </span>
                {(checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                  <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#0071e3] text-white">
                    {repeatScope === 'all' ? 'Toàn bài' : 'Từng câu'}
                  </span>
                )}
                <ChevronDown size={12} className={`text-slate-400 transition-transform shrink-0 ${isRepeatMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsVoiceSettingsOpen(true)}
              className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/40 text-[#0071e3] dark:text-sky-300 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer truncate"
              title="Tùy chỉnh giọng đọc Studio Neural"
            >
              <Sparkles size={12} className="text-[#0071e3] dark:text-sky-400 shrink-0" />
              <span className="truncate">Giọng AI 🎙️</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsGuideModalOpen(true)}
              className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-300/50 dark:border-blue-700/60 bg-gradient-to-r from-[#0071e3] to-sky-500 hover:from-[#0077ed] hover:to-sky-400 text-white text-[11px] sm:text-xs font-black flex items-center gap-1 transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer truncate"
              title="Xem cẩm nang hướng dẫn phương pháp học 4 bước"
            >
              <Lightbulb size={12} className="text-white shrink-0" />
              <span className="truncate">Cách Học 💡</span>
            </motion.button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-bold hidden md:block">
          Giọng kịch tính & Ngắt nghỉ tự nhiên
        </div>
      </div>
    </div>

      {/* ============================================================== */}
      {/* 🔄 SHARED REPEAT SETTINGS MODAL/POPOVER (Mobile Modal / Desktop Dropdown) */}
      {/* ============================================================== */}
      {isRepeatMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:absolute sm:inset-auto sm:top-full sm:left-4 sm:mt-2">
          <div
            ref={repeatMenuRef}
            className="w-full max-w-sm sm:w-80 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in ring-1 ring-black/10 dark:ring-white/10"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Repeat size={16} className="text-[#0071e3]" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Cài Đặt Lặp Lại Hội Thoại
                </span>
              </div>
              <button
                onClick={() => setIsRepeatMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kiểu lặp lại:</span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => handleSelectRepeatScope('all')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    repeatScope === 'all'
                      ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-sky-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <RotateCcw size={12} />
                  <span>Lặp Toàn Bài</span>
                </button>
                <button
                  onClick={() => handleSelectRepeatScope('line')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    repeatScope === 'line'
                      ? 'bg-white dark:bg-slate-700 text-[#0071e3] dark:text-sky-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Repeat1 size={13} />
                  <span>Lặp Từng Câu</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Số lần lặp lại:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '1 lần', value: 1 },
                  { label: '2 lần', value: 2 },
                  { label: '3 lần', value: 3 },
                  { label: '5 lần', value: 5 },
                  { label: '10 lần', value: 10 },
                  { label: 'Vô hạn ∞', value: 'infinite', isSpecial: true },
                ].map(opt => {
                  const isSelected = opt.isSpecial
                    ? checkIsInfinite(repeatCount)
                    : (!checkIsInfinite(repeatCount) && repeatCount === opt.value);
                  return (
                    <button
                      type="button"
                      key={String(opt.value)}
                      onClick={() => handleSelectRepeatCount(opt.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                        isSelected
                          ? opt.isSpecial
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/40'
                            : 'bg-[#0071e3] text-white border-[#0071e3] shadow-md ring-2 ring-blue-400/40'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hoặc tự nhập số lần tùy thích:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: 15, 20 hoặc vô hạn..."
                  value={customRepeatInput}
                  onChange={(e) => setCustomRepeatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomRepeat();
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomRepeat}
                  className="px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  Áp Dụng
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRepeatMenuOpen(false);
                if (checkIsInfinite(repeatCount)) {
                  toast.success('Đã lưu: Lặp Vô Hạn (∞) ✨', { icon: '♾️' });
                } else {
                  toast.success(`Đã lưu: Lặp ${repeatCount} lần!`);
                }
              }}
              className="w-full py-2 bg-gradient-to-r from-[#0071e3] to-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Xong & Đóng Menu</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
