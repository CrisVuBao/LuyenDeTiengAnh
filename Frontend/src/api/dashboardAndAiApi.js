import axiosClient from './axiosClient';

const statsCache = new Map();
const STATS_TTL_MS = 2 * 60 * 1000;

function getCachedStats(key, fetcher) {
  const now = Date.now();
  const cached = statsCache.get(key);
  if (cached?.data && now - cached.timestamp < STATS_TTL_MS) {
    return Promise.resolve(cached.data);
  }
  const promise = fetcher().then((res) => {
    statsCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  });
  return cached?.data ? Promise.resolve(cached.data) : promise;
}

export const dashboardApi = {
  peekStats: () => statsCache.get('student:stats')?.data || null,
  getStats: () => getCachedStats('student:stats', () => axiosClient.get('/dashboard/stats')),
  getAdminStats: () => axiosClient.get('/dashboard/admin-stats'),
  getAdminStudents: () => axiosClient.get('/dashboard/admin-students')
};

export const aiApi = {
  explainQuestion: (data) => axiosClient.post('/aichat/explain', data),
  chat: (prompt) => axiosClient.post('/aichat/chat', prompt)
};

