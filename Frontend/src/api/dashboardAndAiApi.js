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
    axiosClient.delete(`/dashboard/admin-students/${userId}`),
  createStudent: (data) =>
    axiosClient.post('/dashboard/admin-students/create', data),
  updateStudent: (userId, data) =>
    axiosClient.put(`/dashboard/admin-students/${userId}`, data),
  resetPassword: (userId, newPassword) =>
    axiosClient.post(`/dashboard/admin-students/${userId}/reset-password`, { newPassword }),
  getStudentDetail: (userId) =>
    axiosClient.get(`/dashboard/admin-students/${userId}/detail`),
  adjustGamification: (userId, data) =>
    axiosClient.post(`/dashboard/admin-students/${userId}/adjust-gamification`, data)
};

export const aiApi = {
  explainQuestion: (data) => axiosClient.post('/aichat/explain', data),
  chat: (prompt) => axiosClient.post('/aichat/chat', prompt)
};

export const notificationApi = {
  getMyNotifications: (limit = 40) => axiosClient.get(`/notifications?limit=${limit}`),
  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/notifications/read-all'),

  // Admin endpoints
  sendNotification: (data) => axiosClient.post('/notifications/send', data),
  getAdminHistory: () => axiosClient.get('/notifications/admin/history'),
  getAdminStats: () => axiosClient.get('/notifications/admin/stats'),
  deleteNotification: (idOrBatchKey) => axiosClient.delete(`/notifications/admin/${idOrBatchKey}`)
};

export const settingsApi = {
  getPublicBranding: () => axiosClient.get('/settings/public'),
  uploadBrandingAsset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/settings/upload-branding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAllSettings: () => axiosClient.get('/settings'),
  updateSettings: (settingsMap) => axiosClient.put('/settings', { settings: settingsMap }),
  resetToDefaults: () => axiosClient.post('/settings/reset'),
  getSystemInfo: () => axiosClient.get('/settings/system-info'),
  cleanupOldData: (data) => axiosClient.post('/settings/cleanup', data),
  clearCache: () => axiosClient.post('/settings/clear-cache')
};

export const activityLogApi = {
  getLogs: ({ action = 'all', entityType = 'all', search = '', page = 1, pageSize = 50 } = {}) =>
    axiosClient.get('/activity-log', {
      params: { action, entityType, search, page, pageSize }
    }),
  getStats: () => axiosClient.get('/activity-log/stats')
};

export const analyticsApi = {
  getOverview: (period = '30d') => axiosClient.get(`/analytics/overview?period=${period}`)
};

