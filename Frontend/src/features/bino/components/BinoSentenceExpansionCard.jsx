import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Volume2, Copy, Check, ChevronDown, ChevronUp, 
  Lightbulb, ArrowRight, RefreshCw, Layers, Compass, Play
} from 'lucide-react';
import speechService from '../../../utils/speechService';
import toast from 'react-hot-toast';

export default function BinoSentenceExpansionCard({ expansionData, lineIndex = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [playingSentence, setPlayingSentence] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [customSlotInput, setCustomSlotInput] = useState('');

  if (!expansionData) return null;

  const {
    corePattern,
    patternMeaningVi,
    grammarTip,
    fixedPrefix = '',
    fixedSuffix = '',
    defaultSlot = '',
    quickSuggestions = [],
    variations = []
  } = expansionData;

  // Xử lý phát âm audio qua speechService
  const handlePlayAudio = (text, key) => {
    setPlayingSentence(key);
    try {
      speechService.speakWord(text, 0.95);
      setTimeout(() => {
        setPlayingSentence(null);
      }, 3000);
    } catch {
      setPlayingSentence(null);
    }
  };

  // Sao chép câu vào clipboard
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Đã chép câu vào bộ nhớ tạm!', { icon: '📋', duration: 2000 });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Ghép câu tùy chỉnh từ người học
  const activeCustomSlot = customSlotInput.trim() || defaultSlot;
  const customConstructedSentence = `${fixedPrefix}${activeCustomSlot}${fixedSuffix}`;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          isOpen
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30'
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/60'
        }`}
      >
        <Sparkles size={14} className={isOpen ? 'text-white' : 'text-amber-500 animate-pulse'} />
        <span>🎯 Vận dụng vào thực tế ({variations.length} tình huống)</span>
        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Expandable Content Area */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden mt-3"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-slate-50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-950 border border-amber-200/80 dark:border-amber-900/40 space-y-4 shadow-sm">
              
              {/* 1. MẪU CÂU CỐT LÕI (CORE PATTERN FORMULA) */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-amber-100 dark:border-slate-700/80 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    <Compass size={14} />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Mẫu Câu Cốt Lõi (Core Sentence Pattern)
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-1 text-xs sm:text-sm font-black font-mono">
                  {fixedPrefix && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg">
                      {fixedPrefix}
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-xs flex items-center gap-1 animate-pulse">
                    <span>🎯 [{defaultSlot || 'Vị trí thay thế'}]</span>
                  </span>
                  {fixedSuffix && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg">
                      {fixedSuffix}
                    </span>
                  )}
                </div>

                {patternMeaningVi && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    👉 Ý nghĩa: <span className="text-amber-700 dark:text-amber-300 font-bold">{patternMeaningVi}</span>
                  </p>
                )}

                {grammarTip && (
                  <div className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700/60">
                    <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Mẹo phản xạ Bino:</strong> {grammarTip}</span>
                  </div>
                )}
              </div>

              {/* 2. DANH SÁCH TÌNH HUỐNG ĐỜI THỰC (REAL-LIFE SITUATIONS) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-amber-500" />
                    <span>Vận Dụng Vào Từng Hoàn Cảnh Đời Thực:</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Bấm loa để nghe giọng đọc bản xứ</span>
                </div>

                <div className="grid gap-2.5">
                  {variations.map((item, idx) => {
                    const isItemPlaying = playingSentence === `var-${idx}`;
                    const isItemCopied = copiedIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Context Tag */}
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px]">
                              {item.context}
                            </span>
                            {item.slotReplaced && (
                              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                Thay thế: <strong className="text-orange-600 dark:text-orange-400">"{item.slotReplaced}"</strong>
                              </span>
                            )}
                          </div>

                          {/* English Text with highlight */}
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white leading-relaxed">
                            {item.slotReplaced ? (
                              <span>
                                "{item.englishText.split(item.slotReplaced).map((part, pIdx, arr) => (
                                  <React.Fragment key={pIdx}>
                                    {part}
                                    {pIdx < arr.length - 1 && (
                                      <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-black underline decoration-amber-500 decoration-2">
                                        {item.slotReplaced}
                                      </span>
                                    )}
                                  </React.Fragment>
                                ))}"
                              </span>
                            ) : (
                              `"${item.englishText}"`
                            )}
                          </p>

                          {/* Vietnamese Text */}
                          {item.vietnameseText && (
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                              ({item.vietnameseText})
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(item.englishText, `var-${idx}`)}
                            className={`p-2 rounded-xl transition-all ${
                              isItemPlaying
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-slate-600'
                            }`}
                            title="Nghe câu này"
                          >
                            <Volume2 size={16} className={isItemPlaying ? 'animate-pulse' : ''} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(item.englishText, idx)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                            title="Sao chép câu"
                          >
                            {isItemCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. THỬ TÀI BIẾN THỂ (INTERACTIVE DIY PRACTICE) */}
              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-500" />
                    <span>Tự Chế Câu Theo Hoàn Cảnh Của Bạn:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Gõ cụm từ bạn muốn lắp vào</span>
                </div>

                {/* Input slot */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customSlotInput}
                    onChange={(e) => setCustomSlotInput(e.target.value)}
                    placeholder={`Ví dụ: ${defaultSlot || 'my new job, the cold weather...'}`}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {customSlotInput && (
                    <button
                      type="button"
                      onClick={() => setCustomSlotInput('')}
                      className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Quick chip suggestions */}
                {quickSuggestions.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400">Gợi ý nhanh:</span>
                    {quickSuggestions.map((sug, sIdx) => (
                      <button
                        type="button"
                        key={sIdx}
                        onClick={() => setCustomSlotInput(sug)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          customSlotInput === sug
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-amber-400'
                        }`}
                      >
                        +{sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Output & Play button */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50/80 to-purple-50/80 dark:from-slate-900 dark:to-slate-850 border border-amber-200/60 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 overflow-hidden text-ellipsis">
                    "{fixedPrefix}
                    <span className="text-amber-600 dark:text-amber-400 underline font-black">
                      {activeCustomSlot}
                    </span>
                    {fixedSuffix}"
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(customConstructedSentence, 'custom')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                  >
                    <Volume2 size={14} className={playingSentence === 'custom' ? 'animate-pulse' : ''} />
                    <span>Nghe câu của bạn</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
