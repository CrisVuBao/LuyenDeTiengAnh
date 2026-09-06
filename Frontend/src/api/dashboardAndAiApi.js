import axiosClient from './axiosClient';

export const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard/stats')
};

export const aiApi = {
  explainQuestion: (data) => axiosClient.post('/aichat/explain', data),
  chat: (prompt) => axiosClient.post('/aichat/chat', prompt)
};
