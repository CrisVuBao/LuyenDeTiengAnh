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
      className="duo-card p-4 sm:p-6 space-y-4 w-full min-w-0 max-w-full shadow-lg"
    >
      {/* Compact Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular Quest Progress Indicator — Duolingo 3D Chunky Icon */}
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="relative w-12 h-12 rounded-2xl bg-amber-400 border-2 border-amber-300 border-b-4 border-b-amber-600 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md active:translate-y-0.5 active:border-b-2 transition-all"
            title="Bấm để thu gọn / mở rộng nhiệm vụ"
          >
            <Target size={22} className="fill-amber-100/50 drop-shadow-sm animate-duo-wiggle" />
            {claimableQuests.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                {claimableQuests.length}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Nhiệm Vụ Hàng Ngày
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#58cc02]/15 text-[#46a302] dark:text-[#89e219] border border-[#58cc02]/30">
                {completedCount}/{totalQuests} HOÀN THÀNH
              </span>
              {totalPossibleXP > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Sparkles size={12} className="text-amber-500 animate-duo-bounce" />
                  <span>+{totalPossibleXP} XP Thưởng</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-bold">
              Chạm vào nhiệm vụ để vào học ngay và tích lũy XP thăng hạng mỗi ngày!
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {claimableQuests.length > 0 && (
            <button
              onClick={handleClaimAll}
              className="duo-btn duo-btn-yellow duo-btn-sm font-black shadow-md animate-duo-pulse"
            >
              <Gift size={14} className="animate-duo-wiggle" />
              <span>NHẬN HẾT ({claimableQuests.length})</span>
            </button>
          )}

          <button
            onClick={() => navigate('/leaderboard')}
            className="duo-btn duo-btn-green duo-btn-sm font-black shadow-sm"
          >
            <span>BẢNG XẾP HẠNG</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="duo-btn duo-btn-white duo-btn-sm font-black text-xs"
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

              const cardVariant = isCompleted
                ? 'duo-card duo-card-green opacity-90'
                : isClaimable
                ? 'duo-card duo-card-orange hover:scale-[1.02] cursor-pointer'
                : isFlashcard
                ? 'duo-card duo-card-green hover:scale-[1.02] cursor-pointer'
                : isBino
                ? 'duo-card duo-card-blue hover:scale-[1.02] cursor-pointer'
                : 'duo-card duo-card-purple hover:scale-[1.02] cursor-pointer';

              const iconBg = isCompleted
                ? 'bg-[#58cc02] text-white border-b-2 border-[#46a302]'
                : isClaimable
                ? 'bg-[#ff9600] text-white border-b-2 border-[#e07700]'
                : isFlashcard
                ? 'bg-[#58cc02] text-white border-b-2 border-[#46a302]'
                : isBino
                ? 'bg-[#1cb0f6] text-white border-b-2 border-[#1899d6]'
                : 'bg-[#ce82ff] text-white border-b-2 border-[#a54bf2]';

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
                  className={`w-[260px] sm:w-auto shrink-0 snap-start p-3.5 ${cardVariant} flex flex-col justify-between gap-3`}
                >
                  {/* Top Row: Icon + Category Badge + XP Reward */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}
                        >
                          {isCompleted ? <CheckCircle2 size={18} /> : <IconComponent size={18} className="animate-duo-bounce" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 truncate">
                          {categoryLabel}
                        </span>
                      </div>

                      <span className="duo-pill duo-pill-xp text-[10px]">
                        +{quest.xpReward} XP
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-[13px] line-clamp-1">
                        {(quest.title || '').replace(/Bino/gi, 'Giao Tiếp 72')}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-bold">
                        {(quest.description || '').replace(/Bino/gi, 'Giao Tiếp 72')}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Duolingo Chunky Progress Bar + 3D Action Button */}
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                        <span>
                          Tiến độ: {currentCount}/{targetCount}
                        </span>
                        <span className="font-black text-slate-800 dark:text-slate-100">
                          {progressPercent}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-600">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-[#58cc02]'
                              : isClaimable
                              ? 'bg-[#ff9600]'
                              : 'bg-[#1cb0f6]'
                          }`}
                        />
                      </div>
                    </div>

                    {isCompleted ? (
                      <div className="py-1.5 px-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center justify-center gap-1 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 size={14} />
                        <span>ĐÃ NHẬN +{quest.xpReward} XP</span>
                      </div>
                    ) : isClaimable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeQuest(questId);
                        }}
                        className="duo-btn duo-btn-yellow duo-btn-sm w-full font-black animate-duo-pulse"
                      >
                        <Gift size={13} className="animate-duo-wiggle" />
                        <span>NHẬN THƯỞNG +{quest.xpReward} XP</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestAction(quest);
                        }}
                        className="duo-btn duo-btn-blue duo-btn-sm w-full font-black flex items-center justify-between"
                      >
                        <span>LÀM NGAY</span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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
