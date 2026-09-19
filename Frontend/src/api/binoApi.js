import axiosClient from './axiosClient';

export const binoApi = {
  // Sách & Chương trình học (Học viên)
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

  getPlaylistDialogues: (ids = null) =>
    axiosClient.get('/bino/playlist', { params: ids ? { ids } : {} }),

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

  // ================= ADMIN CMS API =================
  // Quản lý Chương (Admin)
  adminGetChapters: () =>
    axiosClient.get('/admin/bino/chapters'),

  adminGetChapter: (id) =>
    axiosClient.get(`/admin/bino/chapter/${id}`),

  adminCreateChapter: (data) =>
    axiosClient.post('/admin/bino/chapter', data),

  adminUpdateChapter: (id, data) =>
    axiosClient.put(`/admin/bino/chapter/${id}`, data),

  adminDeleteChapter: (id) =>
    axiosClient.delete(`/admin/bino/chapter/${id}`),

  // Quản lý Bài Hội Thoại (Admin)
  adminGetDialogue: (id) =>
    axiosClient.get(`/admin/bino/dialogue/${id}`),

  adminCreateDialogue: (data) =>
    axiosClient.post('/admin/bino/dialogue', data),

  adminUpdateDialogue: (id, data) =>
    axiosClient.put(`/admin/bino/dialogue/${id}`, data),

  adminDeleteDialogue: (id) =>
    axiosClient.delete(`/admin/bino/dialogue/${id}`),

  // Đồng bộ dữ liệu thật từ TiengAnhBi.epub
  adminSyncRealData: () =>
    axiosClient.post('/admin/bino/sync-real-data'),

  // Quản lý Media (Admin)
  uploadMedia: (formData, folder = 'audios') =>
    axiosClient.post(`/admin/bino/media/upload?folder=${encodeURIComponent(folder)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMedia: (fileUrl) =>
    axiosClient.delete(`/admin/bino/media`, { params: { fileUrl } }),
};

export default binoApi;
