import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2, Award, Sparkles, Filter } from 'lucide-react';
import useGamificationStore from '../store/useGamificationStore';

const DEFAULT_ACHIEVEMENTS = [
  // Streak
  { badgeId: 'first_blood', category: 'streak', title: 'Bước Chân Đầu Tiên', description: 'Hoàn thành bài tập đầu tiên trên VBaceEnglish', icon: '👣', xp: 50 },
  { badgeId: 'streak_3', category: 'streak', title: 'Tia Lửa 3 Ngày', description: 'Duy trì chuỗi học tập 3 ngày liên tiếp', icon: '🔥', xp: 100 },
  { badgeId: 'streak_7', category: 'streak', title: 'Chiến Binh 1 Tuần', description: 'Duy trì chuỗi học tập 7 ngày liên tục', icon: '⚔️', xp: 200 },
  { badgeId: 'streak_30', category: 'streak', title: 'Bất Bại 1 Tháng', description: 'Duy trì chuỗi học tập 30 ngày kiên trì', icon: '🛡️', xp: 600 },
  { badgeId: 'night_owl', category: 'streak', title: 'Cú Đêm Chăm Chỉ', description: 'Hoàn thành bài học sau 22:00 đêm', icon: '🦉', xp: 80 },
  { badgeId: 'early_bird', category: 'streak', title: 'Chim Sớm Siêng Năng', description: 'Học tiếng Anh trước 7:00 sáng', icon: '🐦', xp: 80 },

  // Bino
  { badgeId: 'bino_starter', category: 'bino', title: 'Bắt Đầu Chém Gió', description: 'Hoàn thành bài hội thoại Bino đầu tiên', icon: '📖', xp: 50 },
  { badgeId: 'bino_roleplay_master', category: 'bino', title: 'Diễn Viên Giọng Nói', description: 'Hoàn thành 10 bài luyện đóng vai Roleplay 1:1', icon: '🎭', xp: 250 },
  { badgeId: 'bino_dictation_pro', category: 'bino', title: 'Thư Ký Nhanh Tay', description: 'Đạt 90%+ điểm bài chép chính tả Dictation', icon: '✍️', xp: 150 },
  { badgeId: 'bino_chapter_1', category: 'bino', title: 'Chinh Phục Chương 1', description: 'Hoàn thành tất cả bài hội thoại trong Chương 1', icon: '🎖️', xp: 200 },
  { badgeId: 'bino_srs_collector', category: 'bino', title: 'Nhà Sưu Tập Từ Vựng', description: 'Lưu 50 từ vựng vào bộ thẻ Flashcard SRS', icon: '📇', xp: 120 },
  { badgeId: 'bino_champion', category: 'bino', title: 'Đại Sứ Chém Tiếng Anh', description: 'Hoàn thành trọn bộ 72 bài hội thoại Bino', icon: '👑', xp: 1500 },

  // Reflex 50
  { badgeId: 'reflex_10', category: 'reflex', title: 'Bật Tốc Phản Xạ', description: 'Master 10 câu đầu tiên trong 50 Chủ Đề', icon: '⚡', xp: 60 },
  { badgeId: 'reflex_100', category: 'reflex', title: 'Tia Chớp Phản Xạ', description: 'Master 100 câu phản xạ giao tiếp', icon: '🌩️', xp: 300 },
  { badgeId: 'reflex_king', category: 'reflex', title: 'Vua Phản Xạ 500', description: 'Master 500 câu nói và viết thực chiến', icon: '🌪️', xp: 1000 },
  { badgeId: 'reflex_speaking_pro', category: 'reflex', title: 'Phát Âm Chuẩn Bản Xứ', description: 'Đạt 90%+ bài luyện phản xạ nói 3 giây', icon: '🎙️', xp: 150 },
  { badgeId: 'reflex_perfect_write', category: 'reflex', title: 'Bút Thần Tốc Độ', description: 'Đạt 100% độ chính xác bài tập viết dịch câu', icon: '✒️', xp: 120 },
  { badgeId: 'reflex_legend', category: 'reflex', title: 'Thần Phản Xạ 1500', description: 'Chinh phục toàn bộ 1.500 câu của 50 Chủ Đề', icon: '🔮', xp: 3000 },

  // TOEIC
  { badgeId: 'toeic_first', category: 'toeic', title: 'Chiến Binh Luyện Đề', description: 'Làm đề thi TOEIC đầu tiên', icon: '🎯', xp: 80 },
  { badgeId: 'toeic_part5_master', category: 'toeic', title: 'Khắc Tinh Part 5', description: 'Tự tin 100% câu hỏi Part 5 của 1 đề thi', icon: '🧠', xp: 200 },
  { badgeId: 'toeic_master', category: 'toeic', title: 'Chuyên Gia TOEIC', description: 'Hoàn thành học tập 10 đề thi ETS', icon: '📚', xp: 800 },
  { badgeId: 'toeic_confident_100', category: 'toeic', title: 'Bộ Não Thép', description: 'Đánh dấu chắc chắn 100 câu hỏi TOEIC', icon: '💎', xp: 300 },

  // 3000 Từ Vựng
  { badgeId: 'vocab_starter', category: 'vocab', title: 'Khởi Động 3000 Từ', description: 'Master 10 từ vựng cốt lõi đầu tiên', icon: '🌱', xp: 50 },
  { badgeId: 'vocab_50', category: 'vocab', title: 'Nhập Môn Từ Vựng', description: 'Master 50 từ vựng thông dụng', icon: '🌿', xp: 100 },
  { badgeId: 'vocab_100', category: 'vocab', title: 'Vốn Từ Vững Vàng', description: 'Master 100 từ vựng cốt lõi', icon: '🌳', xp: 200 },
  { badgeId: 'vocab_300', category: 'vocab', title: 'Chiến Thần Tra Từ', description: 'Master 300 từ vựng qua các chủ đề', icon: '📚', xp: 400 },
  { badgeId: 'vocab_500', category: 'vocab', title: 'Kho Báu 500 Từ', description: 'Master 500 từ vựng tiếng Anh', icon: '💎', xp: 800 },
  { badgeId: 'vocab_1000', category: 'vocab', title: 'Bậc Thầy Từ Vựng', description: 'Master 1.000 từ vựng cốt lõi', icon: '🏆', xp: 1500 },
  { badgeId: 'vocab_legend', category: 'vocab', title: 'Huyền Thoại 3000 Từ', description: 'Master toàn bộ kho từ vựng tiếng Anh theo chủ đề', icon: '👑', xp: 3000 },
  { badgeId: 'vocab_quiz_ace', category: 'vocab', title: 'Trắc Nghiệm Hoàn Hảo', description: 'Đạt 100% điểm trong bài kiểm tra trắc nghiệm từ vựng', icon: '🎯', xp: 150 },
  { badgeId: 'vocab_spelling_master', category: 'vocab', title: 'Bậc Thầy Chính Tả', description: 'Luyện tập gõ đúng chính tả từ vựng', icon: '✍️', xp: 150 }
];

export default function AchievementGallery() {
  const { achievements, fetchAchievements, profile } = useGamificationStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockedBadgeIds = useMemo(() => {
    const list = new Set();
    // From profile unlockedBadges
    if (profile?.unlockedBadges && Array.isArray(profile.unlockedBadges)) {
      profile.unlockedBadges.forEach(id => list.add(id));
    }
    // From achievements API list
    if (achievements && Array.isArray(achievements)) {
      achievements.forEach(a => {
        if (a.isUnlocked) list.add(a.badgeId);
      });
    }
    // Auto unlock first_blood if user has any streak or XP
    if ((profile?.totalXP ?? 0) > 0 || (profile?.currentStreak ?? 0) > 0) {
      list.add('first_blood');
    }
    if ((profile?.currentStreak ?? 0) >= 3) list.add('streak_3');
    if ((profile?.currentStreak ?? 0) >= 7) list.add('streak_7');
    if ((profile?.currentStreak ?? 0) >= 30) list.add('streak_30');

    return list;
  }, [profile, achievements]);

  const displayList = useMemo(() => {
    // Merge API achievements with default list
    const apiMap = new Map();
    if (achievements && Array.isArray(achievements)) {
      achievements.forEach(a => apiMap.set(a.badgeId, a));
    }

    return DEFAULT_ACHIEVEMENTS.map(item => {
      const apiItem = apiMap.get(item.badgeId);
      const isUnlocked = unlockedBadgeIds.has(item.badgeId) || (apiItem?.isUnlocked ?? false);
      return {
        ...item,
        title: apiItem?.title || item.title,
        description: apiItem?.description || item.description,
        isUnlocked
      };
    });
  }, [achievements, unlockedBadgeIds]);

  const filteredList = useMemo(() => {
    if (selectedCategory === 'all') return displayList;
    return displayList.filter(a => a.category === selectedCategory);
  }, [displayList, selectedCategory]);

  const totalUnlocked = displayList.filter(a => a.isUnlocked).length;
  const progressPercent = Math.round((totalUnlocked / displayList.length) * 100);

  return (
    <div className="space-y-6">
      
      {/* Banner Summary */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Trophy size={14} /> Huy hiệu vinh danh
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Bộ Sưu Tập Thành Tựu ({totalUnlocked}/{displayList.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chinh phục các thử thách để mở khóa huy hiệu độc quyền và nhận thêm điểm thưởng XP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-28 sm:w-36 space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Đã mở</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-800"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'streak', label: 'Chuỗi ngày' },
          { id: 'vocab', label: '3000 Từ Vựng' },
          { id: 'bino', label: 'Chém Tiếng Anh' },
          { id: 'reflex', label: 'Phản Xạ 50' },
          { id: 'toeic', label: 'Luyện đề TOEIC' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#0071e3] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredList.map(b => (
          <motion.div
            key={b.badgeId}
            whileHover={{ y: -3 }}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
              b.isUnlocked
                ? 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-700/60 shadow-[0_4px_20px_rgb(245,158,11,0.08)]'
                : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
            }`}
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
              b.isUnlocked
                ? 'bg-amber-100/80 dark:bg-amber-950/60 ring-2 ring-amber-400/40'
                : 'bg-slate-200/80 dark:bg-slate-800 grayscale'
            }`}>
              {b.icon}
            </div>

            {/* Info */}
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-xs font-bold truncate ${
                  b.isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {b.title}
                </h4>
                {b.isUnlocked ? (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Đã mở
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 shrink-0">
                    <Lock size={10} /> Khóa
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {b.description}
              </p>

              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#0071e3] dark:text-sky-400">
                  +{b.xp} XP
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
