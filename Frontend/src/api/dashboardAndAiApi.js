import axiosClient from './axiosClient';

export const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard/stats'),
  getAdminStats: () => axiosClient.get('/dashboard/admin-stats'),
  getAdminStudents: () => axiosClient.get('/dashboard/admin-students')
};

export const aiApi = {
  explainQuestion: (data) => axiosClient.post('/aichat/explain', data),
  chat: (prompt) => axiosClient.post('/aichat/chat', prompt)
};
