import { create } from 'zustand';
import gamificationApi from '../../../api/gamificationApi';
import useAuthStore from '../../../store/authStore';
import useNotificationStore from '../../../store/useNotificationStore';

const filterNonToeicQuests = (quests) => {
  if (!Array.isArray(quests)) return [];
  return quests.filter(
    (q) =>
      !q.questId?.toLowerCase().includes('toeic') &&
      !q.questType?.toLowerCase().includes('toeic')
  );
};

const useGamificationStore = create((set, get) => ({
  profile: null,
  dailyQuests: [],
  leaderboard: [],
  achievements: [],
  isLoading: false,
  lastCelebration: null,

  fetchProfile: async () => {
    try {
      if (!useAuthStore.getState().isAuthenticated) return;
      set({ isLoading: true });
      const res = await gamificationApi.getProfile();
      const data = res?.data || res;
      const quests = filterNonToeicQuests(data?.dailyQuests);
      set({ profile: data, dailyQuests: quests, isLoading: false });
    } catch (error) {
      console.error('Lỗi khi tải profile gamification:', error);
      set({ isLoading: false });
    }
  },

  earnXP: async (amount, source, description) => {
    try {
      if (!useAuthStore.getState().isAuthenticated) return;
      const oldProfile = get().profile;
      const oldQuests = get().dailyQuests || [];
      const oldBadges = oldProfile?.unlockedBadges || [];

      const res = await gamificationApi.addXP({ amount, source, description });
      const newProfile = res?.data?.profile || res?.data || res;
      
      if (newProfile && (newProfile.totalXP !== undefined || newProfile.currentLevel !== undefined)) {
        const quests = filterNonToeicQuests(newProfile.dailyQuests);
        set({ profile: newProfile, dailyQuests: quests });

        const oldLevel = oldProfile?.currentLevel || oldProfile?.level || 1;
        const newLevel = newProfile?.currentLevel || newProfile?.level || 1;

        // 1. Chỉ chúc mừng khi THĂNG CẤP (Level Up)
        if (newLevel > oldLevel) {
          get().triggerCelebration('level_up', { oldLevel, newLevel });
        }

        // 2. NHIỆM VỤ HÀNG NGÀY:
        // CHỈ THÔNG BÁO KHI VỪA LÀM XONG 1 NHIỆM VỤ (chuyển từ chưa xong -> xong).
        // KHI ĐÃ HOÀN THÀNH XONG RỒI THÌ TUYỆT ĐỐI KHÔNG BÁO VỀ NHIỆM VỤ NÀY NỮA.
        if (oldQuests.length > 0 && quests.length > 0) {
          const newlyCompletedQuests = quests.filter((newQ) => {
            const oldQ = oldQuests.find((oq) => oq.questId === newQ.questId);
            return oldQ && !oldQ.isCompleted && newQ.isCompleted;
          });

          newlyCompletedQuests.forEach((quest, index) => {
            setTimeout(() => {
              get().triggerCelebration('quest_completed', {
                questId: quest.questId,
                title: quest.title,
                rewardXP: quest.xpReward
              });
            }, index * 400);
          });

          // Kiểm tra nếu tất cả 4 nhiệm vụ vừa hoàn thành trọn bộ
          const allCompletedBefore = oldQuests.every((q) => q.isCompleted);
          const allCompletedNow = quests.every((q) => q.isCompleted);
          if (!allCompletedBefore && allCompletedNow) {
            setTimeout(() => {
              get().triggerCelebration('all_quests_completed', { bonusXP: 25 });
            }, (newlyCompletedQuests.length + 1) * 400);
          }
        }

        // 3. Kiểm tra Huy hiệu mới mở khóa (nếu có)
        const newBadges = newProfile.unlockedBadges || [];
        const newlyUnlocked = newBadges.filter((b) => !oldBadges.includes(b));
        if (newlyUnlocked.length > 0 && oldBadges.length > 0) {
          setTimeout(() => {
            get().triggerCelebration('achievement_unlocked', { badgeIds: newlyUnlocked });
          }, 800);
        }

        // Đồng bộ chuông thông báo ngay lập tức (khi có thông báo Level Up / Huy hiệu mới)
        useNotificationStore.getState().fetchNotifications(true);
      }
      return newProfile;
    } catch (error) {
      console.error('Lỗi khi thêm XP:', error);
    }
  },

  fetchDailyQuests: async () => {
    try {
      if (!useAuthStore.getState().isAuthenticated) return;
      const res = await gamificationApi.getDailyQuests();
      const list = res?.data || [];
      const filtered = filterNonToeicQuests(list);
      set({ dailyQuests: filtered });
    } catch (error) {
      console.error('Lỗi khi tải nhiệm vụ hàng ngày:', error);
    }
  },

  completeQuest: async (questId) => {
    try {
      const oldQuests = get().dailyQuests || [];
      const quest = oldQuests.find((q) => q.questId === questId);
      await gamificationApi.completeDailyQuest(questId);
      if (quest && !quest.isCompleted) {
        get().triggerCelebration('quest_completed', {
          questId: quest.questId,
          title: quest.title,
          rewardXP: quest.xpReward
        });
      }
      await get().fetchDailyQuests();
      await get().fetchProfile();
    } catch (error) {
      console.error('Lỗi khi hoàn thành nhiệm vụ:', error);
    }
  },

  fetchLeaderboard: async () => {
    try {
      if (!useAuthStore.getState().isAuthenticated) return;
      const res = await gamificationApi.getLeaderboard();
      const list = res?.data || [];
      set({ leaderboard: Array.isArray(list) ? list : [] });
    } catch (error) {
      console.error('Lỗi khi tải bảng xếp hạng:', error);
    }
  },

  fetchAchievements: async () => {
    try {
      if (!useAuthStore.getState().isAuthenticated) return;
      const res = await gamificationApi.getAchievements();
      const list = res?.data || [];
      set({ achievements: Array.isArray(list) ? list : [] });
    } catch (error) {
      console.error('Lỗi khi tải thành tựu:', error);
    }
  },

  triggerCelebration: (type, data) => set({ lastCelebration: { type, data, timestamp: Date.now() } }),
  clearCelebration: () => set({ lastCelebration: null })
}));

export default useGamificationStore;
