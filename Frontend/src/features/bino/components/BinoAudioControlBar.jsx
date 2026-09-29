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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg space-y-2.5 bg-gradient-to-br from-amber-500/10 via-white to-blue-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 relative ${
        isRepeatMenuOpen ? 'z-40' : 'z-20'
      }`}
    >
      {/* TẦNG 1: NÚT PLAY/PAUSE CHÍNH & LIVE SOUNDWAVE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
        {/* Main Big Play/Pause Button with Pulse Glow */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={playAllLines}
          className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 sm:gap-3 transition-all shadow-md cursor-pointer ${
            isPlayingAll
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 animate-pulse-glow'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {isPlayingAll ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          </div>

          <div className="text-left flex-1 sm:flex-none min-w-0">
            <div className="text-xs font-black tracking-wide truncate">
              {isPlayingAll ? 'TẠM DỪNG BÀI HỘI THOẠI' : 'NGHE TOÀN BỘ HỘI THOẠI'}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold opacity-90 truncate">
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
        <div className="grid grid-cols-2 sm:flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVietsub(prev => !prev)}
            className={`px-3 py-2 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              showVietsub 
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
            title={showVietsub ? 'Tắt dịch tiếng Việt' : 'Bật dịch tiếng Việt'}
          >
            {showVietsub ? <Eye size={14} className="text-rose-500 shrink-0" /> : <EyeOff size={14} className="shrink-0" />}
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
            className="px-3 py-2 rounded-xl sm:rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Mở trình phát liên tục tất cả các bài"
          >
            <ListMusic size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Phát Nhiều Bài 🎧</span>
          </motion.button>
        </div>
      </div>

      {/* TẦNG 2: THANH ACTION CHUYÊN NGHIỆP */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center overflow-x-auto whitespace-nowrap hide-scrollbar rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[11px] font-bold border border-slate-200/60 dark:border-slate-700 gap-0.5">
            <span className="text-[10px] text-slate-400 px-1.5 font-extrabold uppercase shrink-0 flex items-center gap-1">
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
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    isSelected
                      ? preset.isSlow
                        ? 'bg-emerald-600 text-white shadow-sm font-black'
                        : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {preset.isSlow && <Headphones size={11} className={isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />}
                  <span>{preset.label}</span>
                  {isSelected && (
                    <span className="text-[10px] hidden md:inline opacity-90">
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
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs border cursor-pointer ${
                  checkIsInfinite(repeatCount)
                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                    : repeatCount !== 1
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {checkIsInfinite(repeatCount) ? (
                  <InfinityIcon size={14} className="text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
                ) : (
                  <Repeat size={12} className={repeatCount !== 1 ? 'text-amber-600 dark:text-amber-400 shrink-0' : 'text-slate-400 shrink-0'} />
                )}
                <span className="whitespace-nowrap">
                  {checkIsInfinite(repeatCount)
                    ? 'Lặp: ∞'
                    : `Lặp: ${repeatCount}x`}
                </span>
                {(checkIsInfinite(repeatCount) || repeatCount !== 1) && (
                  <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded font-black bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200">
                    {repeatScope === 'all' ? 'Toàn bài' : 'Từng câu'}
                  </span>
                )}
                <ChevronDown size={12} className={`text-slate-400 transition-transform shrink-0 ${isRepeatMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {isRepeatMenuOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in ring-1 ring-black/10 dark:ring-white/10">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Repeat size={16} className="text-amber-500" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Cài Đặt Lặp Lại Hội Thoại
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRepeatMenuOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kiểu lặp lại:</span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        onClick={() => handleSelectRepeatScope('all')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          repeatScope === 'all'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <RotateCcw size={12} />
                        <span>Lặp Toàn Bài</span>
                      </button>
                      <button
                        onClick={() => handleSelectRepeatScope('line')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          repeatScope === 'line'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
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
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                              isSelected
                                ? opt.isSpecial
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/40'
                                  : 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-400/40'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
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
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomRepeat}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
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
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Xong & Đóng Menu</span>
                  </button>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsVoiceSettingsOpen(true)}
              className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer truncate"
              title="Tùy chỉnh giọng đọc Studio Neural"
            >
              <Sparkles size={12} className="text-amber-500 shrink-0" />
              <span className="truncate">Giọng AI 🎙️</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsGuideModalOpen(true)}
              className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-400/80 dark:border-amber-700 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] sm:text-xs font-black flex items-center gap-1 transition-all shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer truncate"
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
    </motion.div>
  );
}
