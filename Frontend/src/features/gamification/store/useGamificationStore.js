import { create } from 'zustand';
import gamificationApi from '../../../api/gamificationApi';
import useAuthStore from '../../../store/authStore';

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
      const res = await gamificationApi.addXP({ amount, source, description });
      const newProfile = res?.data?.profile || res?.data || res;
      const oldProfile = get().profile;
      
      if (newProfile && (newProfile.totalXP !== undefined || newProfile.currentLevel !== undefined)) {
        const quests = filterNonToeicQuests(newProfile.dailyQuests);
        set({ profile: newProfile, dailyQuests: quests });

        const oldLevel = oldProfile?.currentLevel || oldProfile?.level || 1;
        const newLevel = newProfile?.currentLevel || newProfile?.level || 1;

        if (newLevel > oldLevel) {
          get().triggerCelebration('level_up', { oldLevel, newLevel });
        } else {
          get().triggerCelebration('xp_earned', { amount, description });
        }
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
      await gamificationApi.completeDailyQuest(questId);
      get().triggerCelebration('quest_completed', { questId });
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
