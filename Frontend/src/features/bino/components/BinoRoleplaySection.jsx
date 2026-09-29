import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, RotateCcw, Mic, Volume2, Headphones, ChevronRight
} from 'lucide-react';
import binoApi from '../../../api/binoApi';
import { invalidateStatsCache } from '../../../api/dashboardAndAiApi';
import useGamificationStore from '../../gamification/store/useGamificationStore';
import toast from 'react-hot-toast';

export default function BinoRoleplaySection({
  lesson,
  id,
  availableRoles,
  selectedRole,
  setSelectedRole,
  roleplayStep,
  setRoleplayStep,
  showVietsub,
  audioSpeed,
  isListening,
  userTranscript,
  setUserTranscript,
  roleplayEval,
  setRoleplayEval,
  startSpeechRecognition,
  speakText,
  rewardedRoleplayLinesRef,
  rewardedRoleplayFinishRef,
  consumeElapsedSeconds
}) {
  const currentLine = lesson?.dialogueLines?.[roleplayStep];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl"
    >
      <div className="max-w-xl space-y-2">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" />
          <span>Luyện Phản Xạ Đóng Vai 1:1 Cùng Leo</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
          Hệ thống sẽ đóng vai <strong>LEO</strong> và đọc thoại trước. Đến lượt thoại của bạn, hãy đọc to câu thoại bằng tiếng Anh để luyện phản xạ tự nhiên không cần dịch ngầm!
        </p>
      </div>

      {/* Role selector */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-bold text-slate-500">Bạn muốn đóng vai:</span>
        {availableRoles.map(r => (
          <button
            key={r}
            onClick={() => { setSelectedRole(r); setRoleplayStep(0); setUserTranscript(''); setRoleplayEval(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === r
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Interactive Roleplay Step Box */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/60 to-blue-50/60 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Lượt thoại {roleplayStep + 1} / {lesson.dialogueLines?.length || 8}</span>
          <button
            onClick={() => { setRoleplayStep(0); setUserTranscript(''); setRoleplayEval(null); }}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw size={13} /> Làm lại từ đầu
          </button>
        </div>

        {currentLine && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${
                currentLine.characterName === selectedRole
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-orange-500 text-white'
              }`}>
                {currentLine.characterName}
                {currentLine.characterName === selectedRole && ' (LƯỢT CỦA BẠN!)'}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                "{currentLine.englishText}"
              </p>
              {showVietsub && (
                <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-vietsub font-semibold mt-1.5">
                  ({currentLine.vietnameseText})
                </p>
              )}
            </div>

            {/* Microphone / Speech & Audio Buttons */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  {isListening && (
                    <div className="absolute inset-0 rounded-2xl bg-red-500 animate-radar pointer-events-none" />
                  )}
                  <button
                    onClick={() => startSpeechRecognition(currentLine.englishText)}
                    className={`relative z-10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                    }`}
                  >
                    <Mic size={16} />
                    <span>
                      {isListening
                        ? 'Đang nghe bạn nói... (Bấm dừng)'
                        : currentLine.characterName === selectedRole
                          ? 'Bấm Nói Câu Này (Speech AI)'
                          : 'Bấm Nhại Theo Câu Này'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => speakText(currentLine.englishText, currentLine.characterName)}
                  className="px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Volume2 size={15} className="text-[#0071e3]" />
                  <span>Nghe mẫu ({audioSpeed}x)</span>
                </button>

                <button
                  onClick={() => speakText(currentLine.englishText, currentLine.characterName, 0.7)}
                  className="px-4 py-2.5 sm:py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Headphones size={15} />
                  <span>Nghe chậm (0.7x)</span>
                </button>
              </div>

              {(isListening || userTranscript || roleplayEval) && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      🎙️ {isListening ? 'Đang nghe bạn đọc: ' : 'Giọng đọc nhận diện: '}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      "{userTranscript || '...'}"
                    </span>
                  </div>

                  {roleplayEval && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                      <div className="text-xs font-extrabold">
                        <span className={roleplayEval.isPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                          Điểm phản xạ phát âm: {roleplayEval.score}% — {roleplayEval.feedback}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold">
                        Chi tiết từng từ (Bấm vào từ bất kỳ để nghe phát âm chậm 0.7x):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {roleplayEval.wordDiffs.map((wd, wIdx) => (
                          <button
                            key={wIdx}
                            onClick={() => speakText(wd.cleanWord || wd.word, currentLine.characterName, 0.7)}
                            className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
                              wd.status === 'correct'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 underline'
                            }`}
                          >
                            {wd.word}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation in roleplay */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 dark:border-slate-700">
              <button
                disabled={roleplayStep === 0}
                onClick={() => { setRoleplayStep(prev => prev - 1); setUserTranscript(''); setRoleplayEval(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                Câu Trước
              </button>

              <button
                onClick={() => {
                  if (roleplayStep < lesson.dialogueLines.length - 1) {
                    setRoleplayStep(prev => prev + 1);
                    setUserTranscript('');
                    setRoleplayEval(null);
                  } else {
                    binoApi.markProgress({
                      dialogueLessonId: parseInt(id),
                      roleplayCompleted: true,
                      timeSpentSeconds: consumeElapsedSeconds()
                    }).then(() => invalidateStatsCache()).catch(() => {});
                    const practicedCount = Object.keys(rewardedRoleplayLinesRef?.current || {}).filter((k) =>
                      k.startsWith(`${id}_rp_`)
                    ).length;
                    if (!rewardedRoleplayFinishRef?.current?.[id] && practicedCount >= 1) {
                      if (rewardedRoleplayFinishRef?.current) rewardedRoleplayFinishRef.current[id] = true;
                      toast.success('Xuất sắc! Đã ghi nhận hoàn thành luyện đóng vai 1:1 (+10 XP)! 🎉');
                      useGamificationStore.getState().earnXP(10, 'bino_roleplay', `Hoàn thành đóng vai bài #${id}`);
                    } else {
                      toast.success('Đã ghi nhận hoàn thành lượt đóng vai 1:1 cho bài này! 🎉');
                    }
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>{roleplayStep < lesson.dialogueLines.length - 1 ? 'Câu Tiếp Theo' : 'Hoàn Thành! 🎉'}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
