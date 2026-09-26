import axiosClient from './axiosClient';

// Bộ nhớ đệm In-Memory SWR siêu tốc giúp chuyển trang 0ms (Zero-Latency Navigation)
const memoryCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 phút

function fetchWithCache(cacheKey, fetcher, forceRefresh = false) {
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (!forceRefresh && cached) {
    // Nếu dữ liệu còn mới hoặc đã có trong cache: trả về ngay lập tức (0ms)
    // Nếu đã quá TTL thì âm thầm làm mới ở hậu cảnh (Stale-While-Revalidate)
    if (now - cached.timestamp > CACHE_TTL_MS && !inflightRequests.has(cacheKey)) {
      const bgPromise = fetcher()
        .then((res) => {
          if (res?.data) {
            memoryCache.set(cacheKey, { data: res, timestamp: Date.now() });
          }
          return res;
        })
        .catch(() => {})
        .finally(() => inflightRequests.delete(cacheKey));
      inflightRequests.set(cacheKey, bgPromise);
    }
    return Promise.resolve(cached.data);
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const reqPromise = fetcher()
    .then((res) => {
      if (res?.data) {
        memoryCache.set(cacheKey, { data: res, timestamp: Date.now() });
      }
      return res;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, reqPromise);
  return reqPromise;
}

export function invalidateBinoCache(prefix = '') {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export const binoApi = {
  // Đọc đồng bộ từ RAM (0ms) để khởi tạo state React không cần hiện PageLoader
  peekBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao') =>
    memoryCache.get(`book:${slug}`)?.data?.data || null,

  peekDialogueDetail: (id) =>
    memoryCache.get(`dialogue:${id}`)?.data?.data || null,

  peekChapterBonus: (chapterNumber) =>
    memoryCache.get(`bonus:${chapterNumber}`)?.data?.data || null,

  // Prefetch khi di chuột (Hover Prefetching)
  prefetchBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao') => {
    fetchWithCache(`book:${slug}`, () =>
      axiosClient.get(`/bino/book?slug=${encodeURIComponent(slug)}`)
    ).catch(() => {});
  },

  prefetchDialogue: (id) => {
    if (!id) return;
    fetchWithCache(`dialogue:${id}`, () =>
      axiosClient.get(`/bino/dialogue/${id}`)
    ).catch(() => {});
  },

  prefetchBonus: (chapterNumber) => {
    if (!chapterNumber) return;
    fetchWithCache(`bonus:${chapterNumber}`, () =>
      axiosClient.get(`/bino/chapter/${chapterNumber}/bonus`)
    ).catch(() => {});
  },

  // Sách & Chương trình học (Học viên)
  getBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao', forceRefresh = false) =>
    fetchWithCache(
      `book:${slug}`,
      () => axiosClient.get(`/bino/book?slug=${encodeURIComponent(slug)}`),
      forceRefresh
    ),

  getChapterDetail: (chapterNumber) =>
    fetchWithCache(`chapter:${chapterNumber}`, () =>
      axiosClient.get(`/bino/chapter/${chapterNumber}`)
    ),

  getChapterBonus: (chapterNumber) =>
    fetchWithCache(`bonus:${chapterNumber}`, () =>
      axiosClient.get(`/bino/chapter/${chapterNumber}/bonus`)
    ),

  getDialogueDetail: (id, forceRefresh = false) =>
    fetchWithCache(
      `dialogue:${id}`,
      () => axiosClient.get(`/bino/dialogue/${id}`),
      forceRefresh
    ),

  getDialogueByNumber: (chapterNumber, dialogueNumber) =>
    fetchWithCache(`dialogue_num:${chapterNumber}:${dialogueNumber}`, () =>
      axiosClient.get(`/bino/chapter/${chapterNumber}/dialogue/${dialogueNumber}`)
    ),

  getPlaylistDialogues: (ids = null) =>
    fetchWithCache(`playlist:${ids || 'all'}`, () =>
      axiosClient.get('/bino/playlist', { params: ids ? { ids } : {} })
    ),

  // Tiến độ học tập (Tự động làm mới cache tiến độ sách & bài học)
  markProgress: (data) =>
    axiosClient.post('/bino/progress/mark', data).then((res) => {
      invalidateBinoCache('book:');
      if (data?.dialogueLessonId) {
        invalidateBinoCache(`dialogue:${data.dialogueLessonId}`);
      }
      return res;
    }),

  // Flashcards SRS (Spaced Repetition System SM-2) + Instant Optimistic Cache Sync
  addWordToSRS: (vocabularyId) => {
    // Cập nhật ngay trong RAM cache để chuyển trang quay lại vẫn giữ trạng thái tức thì
    for (const [key, entry] of memoryCache.entries()) {
      if (key.startsWith('dialogue:') && entry?.data?.data?.vocabularies) {
        entry.data.data.vocabularies = entry.data.data.vocabularies.map(v =>
          v.id === vocabularyId ? { ...v, isInFlashcards: true } : v
        );
      }
    }
    return axiosClient.post('/bino/srs/add-word', { vocabularyId });
  },

  removeWordFromSRS: (vocabularyId) => {
    for (const [key, entry] of memoryCache.entries()) {
      if (key.startsWith('dialogue:') && entry?.data?.data?.vocabularies) {
        entry.data.data.vocabularies = entry.data.data.vocabularies.map(v =>
          v.id === vocabularyId ? { ...v, isInFlashcards: false } : v
        );
      }
    }
    return axiosClient.post('/bino/srs/remove-word', { vocabularyId });
  },

  getDueSRSCards: () =>
    axiosClient.get('/bino/srs/due-words'),

  submitSRSReview: (vocabularyId, grade) =>
    axiosClient.post('/bino/srs/review', { vocabularyId, grade }),

  // ================= ADMIN CMS API =================
  adminGetChapters: () =>
    axiosClient.get('/admin/bino/chapters'),

  adminGetChapter: (id) =>
    axiosClient.get(`/admin/bino/chapter/${id}`),

  adminCreateChapter: (data) =>
    axiosClient.post('/admin/bino/chapter', data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminUpdateChapter: (id, data) =>
    axiosClient.put(`/admin/bino/chapter/${id}`, data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminDeleteChapter: (id) =>
    axiosClient.delete(`/admin/bino/chapter/${id}`).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  // Quản lý Bài Hội Thoại (Admin)
  adminGetDialogue: (id) =>
    axiosClient.get(`/admin/bino/dialogue/${id}`),

  adminCreateDialogue: (data) =>
    axiosClient.post('/admin/bino/dialogue', data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminUpdateDialogue: (id, data) =>
    axiosClient.put(`/admin/bino/dialogue/${id}`, data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminDeleteDialogue: (id) =>
    axiosClient.delete(`/admin/bino/dialogue/${id}`).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  // Đồng bộ dữ liệu thật từ TiengAnhBi.epub
  adminSyncRealData: () =>
    axiosClient.post('/admin/bino/sync-real-data').then((res) => {
      invalidateBinoCache();
      return res;
    }),

  // Quản lý Media (Admin)
  uploadMedia: (formData, folder = 'audios') =>
    axiosClient.post(`/admin/bino/media/upload?folder=${encodeURIComponent(folder)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMedia: (fileUrl) =>
    axiosClient.delete(`/admin/bino/media`, { params: { fileUrl } }),
};

export default binoApi;
