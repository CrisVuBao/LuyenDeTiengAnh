import axiosClient from './axiosClient';

export const binoApi = {
  // Sách & Chương trình học
  getBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao') =>
    axiosClient.get(`/bino/book?slug=${encodeURIComponent(slug)}`),

  getChapterDetail: (chapterNumber) =>
    axiosClient.get(`/bino/chapter/${chapterNumber}`),

  getChapterBonus: (chapterNumber) =>
    axiosClient.get(`/bino/chapter/${chapterNumber}/bonus`),

  getDialogueDetail: (id) =>
    axiosClient.get(`/bino/dialogue/${id}`),

  getDialogueByNumber: (chapterNumber, dialogueNumber) =>
    axiosClient.get(`/bino/chapter/${chapterNumber}/dialogue/${dialogueNumber}`),

  // Tiến độ học tập
  markProgress: (data) =>
    axiosClient.post('/bino/progress/mark', data),

  // Flashcards SRS (Spaced Repetition System SM-2)
  addWordToSRS: (vocabularyId) =>
    axiosClient.post('/bino/srs/add-word', { vocabularyId }),

  getDueSRSCards: () =>
    axiosClient.get('/bino/srs/due-words'),

  submitSRSReview: (vocabularyId, grade) =>
    axiosClient.post('/bino/srs/review', { vocabularyId, grade }),

  // Quản lý Media (Admin)
  uploadMedia: (formData, folder = 'audios') =>
    axiosClient.post(`/admin/bino/media/upload?folder=${encodeURIComponent(folder)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMedia: (fileUrl) =>
    axiosClient.delete(`/admin/bino/media`, { params: { fileUrl } }),
};

export default binoApi;
