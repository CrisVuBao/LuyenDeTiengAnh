import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Headphones, Check, X } from 'lucide-react';

export default function BinoKeyVocabSection({
  vocabularies,
  addedVocabs,
  handleAddToSRS,
  togglingVocabId,
  speakVocab,
  audioSpeed
}) {
  if (!vocabularies || vocabularies.length === 0) return null;

  return (
    <div className="relative p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 dark:from-amber-950/40 dark:via-slate-850 dark:to-slate-850 border-2 border-dashed border-amber-300 dark:border-amber-800/80 shadow-md">
      {/* Decorative Pin / Clip Icon */}
      <div className="absolute -top-3 left-4 sm:left-8 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-amber-400 text-amber-950 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
        <span>📎 Note Ghi Nhớ</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-3 sm:mb-4 pt-1">
        <div>
          <h3 className="text-sm sm:text-lg font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
            <span>Key words (Từ khóa)</span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              • {vocabularies.length} từ
            </span>
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 font-medium">
            Bấm loa nghe phát âm hoặc bấm "+" lưu vào bộ Flashcard ôn tập!
          </p>
        </div>
      </div>

      {/* Vocabularies List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
        {vocabularies.map((v) => {
          const isAdded = addedVocabs[v.id];
          return (
            <motion.div
              key={v.id}
              whileHover={{ scale: 1.01 }}
              className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-amber-200/80 dark:border-amber-900/50 shadow-sm flex items-center justify-between gap-2.5 group hover:border-amber-400 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {v.word}
                  </span>
                  {v.phonetic && (
                    <span className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 font-vietsub font-medium">
                      {v.phonetic}
                    </span>
                  )}
                  {v.wordType && (
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                      ({v.wordType})
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 font-vietsub">
                  {v.meaning}
                </p>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={() => speakVocab(v.word)}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors cursor-pointer"
                  title={`Nghe phát âm (${audioSpeed}x)`}
                >
                  <Volume2 size={15} />
                </button>

                <button
                  onClick={() => speakVocab(v.word, 0.65)}
                  className="px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/70 dark:border-emerald-800/60 transition-all active:scale-90 flex items-center gap-1 cursor-pointer"
                  title="Nghe phát âm chậm rãi từng âm tiết (0.65x)"
                >
                  <Headphones size={11} />
                  <span>0.65x</span>
                </button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.91 }}
                  onClick={() => handleAddToSRS(v)}
                  title={isAdded ? 'Bấm lần nữa để thoát / bỏ khỏi Flashcard' : 'Bấm để thêm vào bộ Flashcard ôn tập'}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all select-none shadow-sm border cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500 hover:bg-rose-500 text-white border-emerald-500 hover:border-rose-500 group/btn shadow-emerald-500/20'
                      : 'bg-amber-100 hover:bg-amber-500 hover:text-white dark:bg-amber-900/60 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-200 border-amber-300/70 dark:border-amber-700/70'
                  } ${togglingVocabId === v.id ? 'opacity-90' : ''}`}
                >
                  {isAdded ? (
                    <>
                      <Check size={12} strokeWidth={3} className="group-hover/btn:hidden" />
                      <X size={12} strokeWidth={3} className="hidden group-hover/btn:inline" />
                      <span className="text-[10px] sm:text-[11px] group-hover/btn:hidden">Đã lưu</span>
                      <span className="text-[10px] sm:text-[11px] hidden group-hover/btn:inline">Bỏ lưu</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm leading-none font-black">+</span>
                      <span className="text-[10px] sm:text-[11px] hidden sm:inline">Flashcard</span>
                      <span className="text-[10px] sm:hidden">Thẻ</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
