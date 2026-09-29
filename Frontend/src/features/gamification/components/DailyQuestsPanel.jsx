import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Clock, Gift, Target, ArrowRight, 
  Sparkles, Headphones, Mic, PenTool, Layers, MessageSquare, Zap, BookOpen, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useGamificationStore from '../store/useGamificationStore';

const QUEST_ICON_MAP = {
  bino_listen: Headphones,
  bino_dialogue: MessageSquare,
  bino_roleplay: Mic,
  bino_dictation: PenTool,
  flashcard_review: Layers,
  reflex_speak: Mic,
  reflex_write: PenTool,
  reflex_listen: Headphones,
  reflex_master: Zap,
  default: Target
};

export default function DailyQuestsPanel() {
  const { dailyQuests, fetchDailyQuests, completeQuest } = useGamificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailyQuests();
  }, [fetchDailyQuests]);

  const allCompleted = dailyQuests.length > 0 && dailyQuests.every(q => q.isCompleted);
  const completedCount = dailyQuests.filter(q => q.isCompleted).length;

  const handleQuestAction = (quest) => {
    const type = quest.questType;
    if (type === 'flashcard_review') {
      navigate('/communication/flashcards');
    } else if (type.startsWith('bino')) {
      navigate('/communication');
    } else if (type.startsWith('reflex')) {
      navigate('/reflex-50');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="p-7 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_2px_16px_rgb(0,0,0,0.03)] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <Sparkles size={13} />
            <span>Nhiệm vụ hôm nay • Giao Tiếp 72 &amp; Phản Xạ 50 Chủ Đề</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Nhiệm Vụ Hàng Ngày ({completedCount}/{dailyQuests.length || 4})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hoàn thành nhiệm vụ giao tiếp và phản xạ để tích lũy XP, thăng cấp và nhận thưởng bonus mỗi ngày.
          </p>
        </div>

        <button
          onClick={() => navigate('/leaderboard')}
          className="self-start sm:self-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Xem Bảng Xếp Hạng & Huy Hiệu</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {dailyQuests.map((quest) => {
          const questId = quest.questId || quest.id;
          const currentCount = quest.currentCount || 0;
          const targetCount = quest.targetCount || 1;
          const isCompleted = !!quest.isCompleted;
          const isClaimable = currentCount >= targetCount && !isCompleted;
          const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
          const IconComponent = QUEST_ICON_MAP[quest.questType] || QUEST_ICON_MAP.default;

          // Categorize quest: Giao Tiếp 72 vs Reflex 50
          const isBino = quest.questType.startsWith('bino') || quest.questType === 'flashcard_review';
          const categoryLabel = isBino ? 'Giao Tiếp Thực Chiến' : 'Phản Xạ 50 Chủ Đề';

          return (
            <div 
              key={questId} 
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isCompleted 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50' 
                  : isClaimable
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 shadow-sm'
                    : 'bg-slate-50/90 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompleted 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' 
                      : isBino
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-blue-100 text-[#0071e3] dark:bg-blue-950 dark:text-sky-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <IconComponent size={20} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-md ${
                        isBino
                          ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                          : 'bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                      }`}>
                        {categoryLabel}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {(quest.title || '').replace(/Bino/gi, 'Giao Tiếp 72')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {(quest.description || '').replace(/Bino/gi, 'Giao Tiếp 72')}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-400/20 dark:text-sky-400">
                  +{quest.xpReward} XP
                </span>
              </div>

              {/* Progress bar + Action button */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span>Tiến độ: {currentCount} / {targetCount}</span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : isBino ? 'bg-amber-500' : 'bg-[#0071e3] dark:bg-sky-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>

                {/* Button controls */}
                <div className="pt-1">
                  {isCompleted ? (
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Đã nhận +{quest.xpReward} XP</span>
                    </div>
                  ) : isClaimable ? (
                    <button
                      onClick={() => completeQuest(questId)}
                      className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <Gift size={14} />
                      <span>Nhận thưởng +{quest.xpReward} XP ngay!</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleQuestAction(quest)}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between group/btn"
                    >
                      <span>{isBino ? 'Vào luyện Giao Tiếp 72' : 'Vào Luyện Phản Xạ 50'}</span>
                      <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading state */}
      {dailyQuests.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-xs">
          Đang cập nhật nhiệm vụ ngày hôm nay...
        </div>
      )}

      {/* All completed banner */}
      {allCompleted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-lg shadow-emerald-600/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm">Tuyệt vời! Đã hoàn thành 100% nhiệm vụ hôm nay</h4>
              <p className="text-xs text-white/90">Bạn đã duy trì thói quen học giao tiếp và phản xạ xuất sắc!</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-xl font-black text-xs">
            +50 XP Bonus Đã Nhận
          </div>
        </motion.div>
      )}

    </div>
  );
}
