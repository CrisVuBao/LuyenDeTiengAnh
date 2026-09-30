import axiosClient from './axiosClient';

const progressApi = {
  getProgress: (testId) => axiosClient.get(`/userprogress/by-test/${testId}`),
  getAllSummaries: () => axiosClient.get('/userprogress/all-summaries'),
  getUnsureQuestions: (testId) => axiosClient.get('/userprogress/unsure-questions', { params: testId ? { testId } : {} }),
  markProgress: (data) => axiosClient.post('/userprogress/mark', data),
  resetProgress: (data) => axiosClient.post('/userprogress/reset', data),
  getReflexProgress: () => axiosClient.get('/userprogress/reflex'),
  saveReflexProgress: (data) => axiosClient.post('/userprogress/reflex', data),
  getEbookProgress: (bookSlug) => axiosClient.get('/userprogress/ebook', { params: bookSlug ? { bookSlug } : {} }),
  saveEbookProgress: (data) => axiosClient.post('/userprogress/ebook', data),
  getCompetenceRadar: () => axiosClient.get('/userprogress/competence-radar'),
  getMemoryShield: () => axiosClient.get('/userprogress/memory-shield')
};

export default progressApi;
