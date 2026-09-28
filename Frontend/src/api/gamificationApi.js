import axiosClient from './axiosClient';

const gamificationApi = {
  getProfile: () => axiosClient.get('/gamification/profile'),
  addXP: (data) => axiosClient.post('/gamification/xp', data),
  getDailyQuests: () => axiosClient.get('/gamification/daily-quests'),
  completeDailyQuest: (questId) => axiosClient.post(`/gamification/daily-quests/${questId}/complete`),
  getLeaderboard: () => axiosClient.get('/gamification/leaderboard'),
  getAchievements: () => axiosClient.get('/gamification/achievements'),
};

export default gamificationApi;
