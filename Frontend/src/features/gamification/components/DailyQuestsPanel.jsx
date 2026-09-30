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
  const [isExpanded, setIsExpanded] = React.useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailyQuests();
  }, [fetchDailyQuests]);

  const totalQuests = dailyQuests.length || 4;
  const completedCount = dailyQuests.filter((q) => q.isCompleted).length;
  const allCompleted = dailyQuests.length > 0 && completedCount === dailyQuests.length;

  const claimableQuests = React.useMemo(
    () =>
      dailyQuests.filter(
        (q) => (q.currentCount || 0) >= (q.targetCount || 1) && !q.isCompleted
      ),
    [dailyQuests]
  );

  // Sắp xếp thông minh: Ưu tiên Nhiệm vụ chờ nhận thưởng -> Đang làm -> Đã xong
  const sortedQuests = React.useMemo(() => {
    return [...dailyQuests].sort((a, b) => {
      const aClaim = (a.currentCount || 0) >= (a.targetCount || 1) && !a.isCompleted ? 0 : a.isCompleted ? 2 : 1;
      const bClaim = (b.currentCount || 0) >= (b.targetCount || 1) && !b.isCompleted ? 0 : b.isCompleted ? 2 : 1;
      return aClaim - bClaim;
    });
  }, [dailyQuests]);

  const totalPossibleXP = React.useMemo(
    () => dailyQuests.reduce((acc, q) => acc + (q.xpReward || 20), 0),
    [dailyQuests]
  );

  const handleQuestAction = (quest) => {
    const type = quest.questType || '';
    if (type === 'flashcard_review') {
      navigate('/communication/flashcards');
    } else if (type.startsWith('bino')) {
      navigate('/communication');
    } else if (type.startsWith('reflex')) {
      navigate('/reflex-50');
    } else {
      navigate('/vocab');
    }
  };

  const handleClaimAll = async () => {
    for (const q of claimableQuests) {
      const qId = q.questId || q.id;
      await completeQuest(qId);
    }
  };

  return (
    <div
      id="daily-quests-section"
      className="relative overflow-hidden p-4 sm:p-6 rounded-2xl sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4"
    >
      {/* Top Specular Hairline — Warm Champagne Amber & Emerald Jade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/45 to-transparent" />

      {/* Compact Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular Quest Progress Indicator — Standout Champagne Amber-Orange */}
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-sm shadow-amber-500/25 border border-amber-400/30"
            title="Bấm để thu gọn / mở rộng nhiệm vụ"
          >
            <Target size={20} />
            {claimableQuests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-xs">
                {claimableQuests.length}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Nhiệm Vụ Hàng Ngày
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/25">
                {completedCount}/{totalQuests} hoàn thành
              </span>
              {totalPossibleXP > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Sparkles size={11} className="text-amber-500" />
                  <span>Tổng thưởng +{totalPossibleXP} XP</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Chạm vào nhiệm vụ để vào học ngay và nhận thưởng XP thăng cấp mỗi ngày.
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {claimableQuests.length > 0 && (
            <button
              onClick={handleClaimAll}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/25 cursor-pointer transition-colors"
            >
              <Gift size={13} />
              <span>Nhận ngay ({claimableQuests.length})</span>
            </button>
          )}

          <button
            onClick={() => navigate('/leaderboard')}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-full text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Bảng xếp hạng</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn nhiệm vụ' : 'Mở rộng nhiệm vụ'}
          >
            <span className="hidden sm:inline">{isExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? '-rotate-90' : 'rotate-90'}`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Quests Shelf (Swipeable on Mobile, 4-Column Row on Desktop) */}
      {isExpanded && (
        <>
          <div
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto snap-x snap-mandatory pb-1 sm:pb-0 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sortedQuests.map((quest) => {
              const questId = quest.questId || quest.id;
              const currentCount = quest.currentCount || 0;
              const targetCount = quest.targetCount || 1;
              const isCompleted = !!quest.isCompleted;
              const isClaimable = currentCount >= targetCount && !isCompleted;
              const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
              const IconComponent = QUEST_ICON_MAP[quest.questType] || QUEST_ICON_MAP.default;

              const isFlashcard = quest.questType === 'flashcard_review';
              const isBino = quest.questType?.startsWith('bino') || isFlashcard;
              const categoryLabel = isFlashcard
                ? 'Flashcard SRS'
                : isBino
                ? 'Giao Tiếp 72'
                : 'Phản Xạ 50';

              // Multi-accent luxury palette distinct from blue & zero purple
              const accentTheme = isFlashcard
                ? {
                    cardHover: 'hover:border-teal-500/45',
                    iconBox: 'bg-teal-500/12 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/20',
                    badge: 'bg-teal-500/12 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/20',
                    bar: 'bg-gradient-to-r from-teal-500 to-emerald-500',
                    btn: 'text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600',
                    btnLabel: 'Làm ngay • Flashcard'
                  }
                : isBino
                ? {
                    cardHover: 'hover:border-amber-500/45',
                    iconBox: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/25',
                    badge: 'bg-amber-500/12 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/25',
                    bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
                    btn: 'text-amber-700 dark:text-amber-300 border-amber-500/35 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500',
                    btnLabel: 'Làm ngay • Giao Tiếp'
                  }
                : {
                    cardHover: 'hover:border-rose-500/45',
                    iconBox: 'bg-rose-500/12 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20',
                    badge: 'bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20',
                    bar: 'bg-gradient-to-r from-rose-500 to-orange-500',
                    btn: 'text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600',
                    btnLabel: 'Làm ngay • Phản Xạ'
                  };

              return (
                <div
                  key={questId}
                  onClick={() => {
                    if (isClaimable) {
                      completeQuest(questId);
                    } else if (!isCompleted) {
                      handleQuestAction(quest);
                    }
                  }}
                  className={`w-[260px] sm:w-auto shrink-0 snap-start p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50 opacity-85'
                      : isClaimable
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-sm cursor-pointer hover:-translate-y-0.5'
                      : `bg-slate-50/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 ${accentTheme.cardHover} cursor-pointer hover:-translate-y-0.5`
                  }`}
                >
                  {/* Top Row: Icon + Category Badge + XP Reward */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : isClaimable
                              ? 'bg-amber-500 text-white'
                              : accentTheme.iconBox
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={16} /> : <IconComponent size={16} />}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md truncate ${accentTheme.badge}`}
                        >
                          {categoryLabel}
                        </span>
                      </div>

                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/25">
                        +{quest.xpReward} XP
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] line-clamp-1">
                        {(quest.title || '').replace(/Bino/gi, 'Giao Tiếp 72')}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {(quest.description || '').replace(/Bino/gi, 'Giao Tiếp 72')}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Progress Bar + 1-Tap Action Button */}
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>
                          Tiến độ: {currentCount}/{targetCount}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {progressPercent}%
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : isClaimable
                              ? 'bg-amber-500'
                              : accentTheme.bar
                          }`}
                        />
                      </div>
                    </div>

                    {isCompleted ? (
                      <div className="py-1.5 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>Đã nhận +{quest.xpReward} XP</span>
                      </div>
                    ) : isClaimable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeQuest(questId);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Gift size={13} />
                        <span>Nhận thưởng +{quest.xpReward} XP</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestAction(quest);
                        }}
                        className={`w-full py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border ${accentTheme.btn} text-xs font-bold transition-colors cursor-pointer flex items-center justify-between group/btn`}
                      >
                        <span>{accentTheme.btnLabel}</span>
                        <ChevronRight
                          size={13}
                          className="group-hover/btn:translate-x-0.5 transition-transform"
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {dailyQuests.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs">
              Đang tải nhiệm vụ ngày hôm nay...
            </div>
          )}

          {allCompleted && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md shadow-emerald-600/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    Tuyệt vời! Bạn đã hoàn thành 100% nhiệm vụ hôm nay
                  </h4>
                  <p className="text-[11px] text-white/90">
                    Thói quen phản xạ mỗi ngày của bạn đang được duy trì xuất sắc!
                  </p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-xl font-black text-xs self-start sm:self-center">
                +50 XP Bonus Đã Nhận
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
