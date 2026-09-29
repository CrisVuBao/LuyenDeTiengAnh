import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Volume2, Headphones, Gauge } from 'lucide-react';
import binoApi from '../../../api/binoApi';
import { invalidateStatsCache } from '../../../api/dashboardAndAiApi';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import toast from 'react-hot-toast';

export default function BinoDictationSection({
  lesson,
  id,
  dictationIndex,
  setDictationIndex,
  dictationInput,
  setDictationInput,
  dictationChecked,
  setDictationChecked,
  speakText,
  consumeElapsedSeconds,
  rewardedDictationLinesRef
}) {
  const currentDictationLine = lesson?.dialogueLines?.[dictationIndex];
  if (!currentDictationLine) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl"
    >
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-emerald-500" />
          <span>Luyện Nghe & Chép Chính Tả (Dictation)</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
          Bấm nghe câu thoại và gõ lại đúng từng từ tiếng Anh để luyện khả năng nghe âm nối và nhớ chính tả.
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-slate-400">
            Câu {dictationIndex + 1} / {lesson.dialogueLines.length}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.95)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Volume2 size={15} /> Nghe Tự Nhiên (0.95x)
            </button>

            <button
              onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.75)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Headphones size={15} />
              <span>Nghe Chậm Rãi (0.75x)</span>
            </button>

            <button
              onClick={() => speakText(currentDictationLine.englishText, currentDictationLine.characterName, 0.6)}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Gauge size={15} />
              <span>Rất Chậm (0.6x)</span>
            </button>
          </div>
        </div>

        {/* Input area */}
        <textarea
          value={dictationInput}
          onChange={(e) => { setDictationInput(e.target.value); setDictationChecked(false); }}
          placeholder="Gõ lại câu tiếng Anh bạn vừa nghe vào đây..."
          rows={3}
          className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        {/* Check button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setDictationChecked(true);
              const normalizeWords = (str) =>
                (str || '')
                  .toLowerCase()
                  .replace(/[^a-z0-9'\s]/g, ' ')
                  .split(/\s+/)
                  .filter(Boolean);
              const targetWords = normalizeWords(currentDictationLine.englishText);
              const typedWords = normalizeWords(dictationInput);
              const typedSet = new Set(typedWords);
              const matched = targetWords.filter(w => typedSet.has(w)).length;
              const score = targetWords.length > 0
                ? Math.min(100, Math.round((matched / targetWords.length) * 100))
                : 0;
              binoApi.markProgress({
                dialogueLessonId: parseInt(id),
                dictationScore: score,
                timeSpentSeconds: consumeElapsedSeconds()
              }).then(() => {
                invalidateStatsCache();
                const dictKey = `${id}_dict_${dictationIndex}`;
                if (score >= 70 && !rewardedDictationLinesRef?.current?.[dictKey]) {
                  if (rewardedDictationLinesRef?.current) rewardedDictationLinesRef.current[dictKey] = true;
                  const xp = score >= 90 ? 5 : 3;
                  const msg = `Chép chính tả đạt ${score}% (Bài #${id} câu ${dictationIndex + 1})`;
                  useGamificationStore.getState().earnXP(xp, 'bino_dictation', msg);
                  toast.success(`✍️ Đạt ${score}% chính xác (+${xp} XP)!`, { id: 'bino-dict-xp' });
                } else if (score < 70) {
                  toast(`Đạt ${score}% — Hãy nghe kỹ và gõ đúng từ 70% trở lên để nhận XP nhé!`, {
                    icon: '🎧',
                    id: 'bino-dict-xp'
                  });
                }
              }).catch(() => {});
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            Kiểm Tra Đáp Án
          </button>

          <button
            onClick={() => {
              if (dictationIndex < lesson.dialogueLines.length - 1) {
                setDictationIndex(prev => prev + 1);
                setDictationInput('');
                setDictationChecked(false);
              }
            }}
            disabled={dictationIndex >= lesson.dialogueLines.length - 1}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
          >
            Câu Kế Tiếp ➔
          </button>
        </div>

        {/* Verification Result */}
        {dictationChecked && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
          >
            <span className="text-xs font-bold text-slate-400 block uppercase">Đáp án chuẩn:</span>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {currentDictationLine.englishText}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-vietsub font-semibold">
              ({currentDictationLine.vietnameseText})
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
