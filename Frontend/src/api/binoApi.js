import axiosClient from './axiosClient';
import useAuthStore from '../store/authStore';

// Bộ nhớ đệm In-Memory SWR siêu tốc, tự động phân lập theo từng tài khoản học viên (Zero-Latency Navigation & Multi-User Isolation)
const memoryCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 phút

function getScopedCacheKey(rawKey) {
  const currentUserId = useAuthStore.getState().user?.id ?? 'guest';
  return `u${currentUserId}:${rawKey}`;
}

function fetchWithCache(cacheKey, fetcher, forceRefresh = false) {
  const scopedKey = getScopedCacheKey(cacheKey);
  const now = Date.now();
  const cached = memoryCache.get(scopedKey);

  if (!forceRefresh && cached) {
    // Nếu dữ liệu còn mới hoặc đã có trong cache: trả về ngay lập tức (0ms)
    // Nếu đã quá TTL thì âm thầm làm mới ở hậu cảnh (Stale-While-Revalidate)
    if (now - cached.timestamp > CACHE_TTL_MS && !inflightRequests.has(scopedKey)) {
      const bgPromise = fetcher()
        .then((res) => {
          if (res?.data) {
            memoryCache.set(scopedKey, { data: res, timestamp: Date.now() });
          }
          return res;
        })
        .catch(() => {})
        .finally(() => inflightRequests.delete(scopedKey));
      inflightRequests.set(scopedKey, bgPromise);
    }
    return Promise.resolve(cached.data);
  }

  if (inflightRequests.has(scopedKey)) {
    return inflightRequests.get(scopedKey);
  }

  const reqPromise = fetcher()
    .then((res) => {
      if (res?.data) {
        memoryCache.set(scopedKey, { data: res, timestamp: Date.now() });
      }
      return res;
    })
    .finally(() => {
      inflightRequests.delete(scopedKey);
    });

  inflightRequests.set(scopedKey, reqPromise);
  return reqPromise;
}

export function invalidateBinoCache(prefix = '') {
  const currentUserId = useAuthStore.getState().user?.id ?? 'guest';
  const userPrefix = `u${currentUserId}:`;
  if (!prefix) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(userPrefix)) {
        memoryCache.delete(key);
      }
    }
    return;
  }
  const fullPrefix = `${userPrefix}${prefix}`;
  for (const key of memoryCache.keys()) {
    if (key.startsWith(fullPrefix) || key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export function clearAllBinoCaches() {
  memoryCache.clear();
  inflightRequests.clear();
}

export const binoApi = {
  // Đọc đồng bộ từ RAM (0ms) theo đúng tài khoản đang đăng nhập
  peekBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao') =>
    memoryCache.get(getScopedCacheKey(`book:${slug}`))?.data?.data || null,

  peekDialogueDetail: (id) =>
    memoryCache.get(getScopedCacheKey(`dialogue:${id}`))?.data?.data || null,

  peekChapterBonus: (chapterNumber) =>
    memoryCache.get(getScopedCacheKey(`bonus:${chapterNumber}`))?.data?.data || null,

  // Prefetch khi di chuột (Hover Prefetching)
  prefetchBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao') => {
    fetchWithCache(`book:${slug}`, () =>
      axiosClient.get(`/communication/book?slug=${encodeURIComponent(slug)}`)
    ).catch(() => {});
  },

  prefetchDialogue: (id) => {
    if (!id) return;
    fetchWithCache(`dialogue:${id}`, () =>
      axiosClient.get(`/communication/dialogue/${id}`)
    ).catch(() => {});
  },

  prefetchBonus: (chapterNumber) => {
    if (!chapterNumber) return;
    fetchWithCache(`bonus:${chapterNumber}`, () =>
      axiosClient.get(`/communication/chapter/${chapterNumber}/bonus`)
    ).catch(() => {});
  },

  // Sách & Chương trình học (Học viên)
  getBookOverview: (slug = 'chem-tieng-anh-khong-can-dong-nao', forceRefresh = false) =>
    fetchWithCache(
      `book:${slug}`,
      () => axiosClient.get(`/communication/book?slug=${encodeURIComponent(slug)}`),
      forceRefresh
    ),

  getChapterDetail: (chapterNumber) =>
    fetchWithCache(`chapter:${chapterNumber}`, () =>
      axiosClient.get(`/communication/chapter/${chapterNumber}`)
    ),

  getChapterBonus: (chapterNumber) =>
    fetchWithCache(`bonus:${chapterNumber}`, () =>
      axiosClient.get(`/communication/chapter/${chapterNumber}/bonus`)
    ),

  getDialogueDetail: (id, forceRefresh = false) =>
    fetchWithCache(
      `dialogue:${id}`,
      () => axiosClient.get(`/communication/dialogue/${id}`),
      forceRefresh
    ),

  getDialogueByNumber: (chapterNumber, dialogueNumber) =>
    fetchWithCache(`dialogue_num:${chapterNumber}:${dialogueNumber}`, () =>
      axiosClient.get(`/communication/chapter/${chapterNumber}/dialogue/${dialogueNumber}`)
    ),

  getPlaylistDialogues: (ids = null) =>
    fetchWithCache(`playlist:${ids || 'all'}`, () =>
      axiosClient.get('/communication/playlist', { params: ids ? { ids } : {} })
    ),

  // Tiến độ học tập (Tự động làm mới cache tiến độ sách & bài học)
  markProgress: (data) =>
    axiosClient.post('/communication/progress/mark', data).then((res) => {
      invalidateBinoCache('book:');
      invalidateBinoCache('progress:');
      if (data?.dialogueLessonId) {
        invalidateBinoCache(`dialogue:${data.dialogueLessonId}`);
      }
      return res;
    }),

  getProgressSummary: (forceRefresh = false) =>
    fetchWithCache(
      'progress:summary',
      () => axiosClient.get('/communication/progress/summary'),
      forceRefresh
    ),

  resetProgress: (chapterNumber = null) =>
    axiosClient.post('/communication/progress/reset', { chapterNumber }).then((res) => {
      invalidateBinoCache();
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
    invalidateBinoCache('progress:');
    return axiosClient.post('/communication/srs/add-word', { vocabularyId });
  },

  removeWordFromSRS: (vocabularyId) => {
    for (const [key, entry] of memoryCache.entries()) {
      if (key.startsWith('dialogue:') && entry?.data?.data?.vocabularies) {
        entry.data.data.vocabularies = entry.data.data.vocabularies.map(v =>
          v.id === vocabularyId ? { ...v, isInFlashcards: false } : v
        );
      }
    }
    invalidateBinoCache('progress:');
    return axiosClient.post('/communication/srs/remove-word', { vocabularyId });
  },

  getDueSRSCards: () =>
    axiosClient.get('/communication/srs/due-words'),

  submitSRSReview: (vocabularyId, grade) =>
    axiosClient.post('/communication/srs/review', { vocabularyId, grade }).then((res) => {
      invalidateBinoCache('progress:');
      return res;
    }),

  // ================= ADMIN CMS API =================
  adminGetChapters: () =>
    axiosClient.get('/admin/communication/chapters'),

  adminGetChapter: (id) =>
    axiosClient.get(`/admin/communication/chapter/${id}`),

  adminCreateChapter: (data) =>
    axiosClient.post('/admin/communication/chapter', data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminUpdateChapter: (id, data) =>
    axiosClient.put(`/admin/communication/chapter/${id}`, data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminDeleteChapter: (id) =>
    axiosClient.delete(`/admin/communication/chapter/${id}`).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  // Quản lý Bài Hội Thoại (Admin)
  adminGetDialogue: (id) =>
    axiosClient.get(`/admin/communication/dialogue/${id}`),

  adminCreateDialogue: (data) =>
    axiosClient.post('/admin/communication/dialogue', data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminUpdateDialogue: (id, data) =>
    axiosClient.put(`/admin/communication/dialogue/${id}`, data).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  adminDeleteDialogue: (id) =>
    axiosClient.delete(`/admin/communication/dialogue/${id}`).then((res) => {
      invalidateBinoCache();
      return res;
    }),

  // Đồng bộ dữ liệu thật từ TiengAnhBi.epub
  adminSyncRealData: () =>
    axiosClient.post('/admin/communication/sync-real-data').then((res) => {
      invalidateBinoCache();
      return res;
    }),

  // Quản lý Media (Admin)
  uploadMedia: (formData, folder = 'audios') =>
    axiosClient.post(`/admin/communication/media/upload?folder=${encodeURIComponent(folder)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMedia: (fileUrl) =>
    axiosClient.delete(`/admin/communication/media`, { params: { fileUrl } }),
};

export default binoApi;
