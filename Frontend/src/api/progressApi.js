import axiosClient from './axiosClient';

const progressApi = {
  getProgress: (testId) => axiosClient.get(`/userprogress/by-test/${testId}`),
  getAllSummaries: () => axiosClient.get('/userprogress/all-summaries'),
  getUnsureQuestions: (testId) => axiosClient.get('/userprogress/unsure-questions', { params: testId ? { testId } : {} }),
  markProgress: (data) => axiosClient.post('/userprogress/mark', data),
  resetProgress: (data) => axiosClient.post('/userprogress/reset', data)
};

export default progressApi;
