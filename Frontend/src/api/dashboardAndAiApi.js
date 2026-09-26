import axiosClient from './axiosClient';

const statsCache = new Map();
const STATS_TTL_MS = 60 * 1000;

export function invalidateStatsCache() {
  statsCache.clear();
}

function getCachedStats(key, fetcher, forceRefresh = false) {
  const now = Date.now();
  const cached = statsCache.get(key);
  if (!forceRefresh && cached?.data && now - cached.timestamp < STATS_TTL_MS) {
    return Promise.resolve(cached.data);
  }
  const promise = fetcher().then((res) => {
    statsCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  });
  return !forceRefresh && cached?.data ? Promise.resolve(cached.data) : promise;
}

export const dashboardApi = {
  peekStats: () => statsCache.get('student:stats')?.data || null,
  getStats: (forceRefresh = false) =>
    getCachedStats('student:stats', () => axiosClient.get('/dashboard/stats'), forceRefresh),
  getAdminStats: () => axiosClient.get('/dashboard/admin-stats'),
  getAdminStudents: () => axiosClient.get('/dashboard/admin-students'),
  approveStudent: (userId, isApproved) =>
    axiosClient.post('/dashboard/admin-students/approve', { userId, isApproved }),
  approveAllPendingStudents: () =>
    axiosClient.post('/dashboard/admin-students/approve-all'),
  deleteStudent: (userId) =>
    axiosClient.delete(`/dashboard/admin-students/${userId}`)
};

export const aiApi = {
  explainQuestion: (data) => axiosClient.post('/aichat/explain', data),
  chat: (prompt) => axiosClient.post('/aichat/chat', prompt)
};
