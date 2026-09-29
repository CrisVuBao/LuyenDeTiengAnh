import { create } from 'zustand';
import useAuthStore from '../../../store/authStore';
import progressApi from '../../../api/progressApi';
import useGamificationStore from '../../gamification/store/useGamificationStore';

const TOTAL_UNITS = 50;
const SENTENCES_PER_UNIT = 30;

function getUserStorageKey(customUserId) {
  const uid = customUserId ?? useAuthStore.getState().user?.id ?? 'guest';
  return `vbace_reflex50_progress_v1_u_${uid}`;
}

// Lazy-loaded cache cho toàn bộ 1.500 câu (chỉ tải khi vào trang học chi tiết hoặc tìm kiếm sâu)
let fullDataCache = null;
let fullDataPromise = null;

export function peekReflex50FullData() {
  return fullDataCache;
}

export function loadReflex50FullData() {
  if (fullDataCache) return Promise.resolve(fullDataCache);
  if (!fullDataPromise) {
    fullDataPromise = import('../data/reflex50Data.json').then((mod) => {
      fullDataCache = mod.default || mod;
      return fullDataCache;
    });
  }
  return fullDataPromise;
}

// Tạo danh sách 30 ID câu của 1 Unit (u1-s1 .. u50-s30) trong O(1) mà không cần bundle 1.28MB JSON vào Store
function getUnitSentenceIds(unitNumber) {
  const u = Number(unitNumber);
  if (!u || u < 1 || u > TOTAL_UNITS) return [];
  const ids = new Array(SENTENCES_PER_UNIT);
  for (let i = 1; i <= SENTENCES_PER_UNIT; i++) {
    ids[i - 1] = `u${u}-s${i}`;
  }
  return ids;
}

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const loadInitialState = (customUserId) => {
  try {
    const raw = localStorage.getItem(getUserStorageKey(customUserId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

let pendingCloudSyncTimer = null;
let latestPendingState = null;
let latestPendingUserId = null;

const flushStateToStorage = (state, customUserId) => {
  if (!state) return;
  const targetUid = customUserId ?? useAuthStore.getState().user?.id ?? 'guest';
  try {
    const payload = {
      masteredIds: state.masteredIds || {},
      starredIds: state.starredIds || {},
      weakIds: state.weakIds || {},
      writingHistory: state.writingHistory || {},
      speakingHistory: state.speakingHistory || {},
      lastStudiedUnit: state.lastStudiedUnit || 1,
      dailyGoal: state.dailyGoal || 30,
      dailyLog: state.dailyLog || {}
    };
    localStorage.setItem(getUserStorageKey(targetUid), JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
};

const buildCloudPayload = (state) => {
  const s = state || useReflex50Store.getState();
  const masteredKeys = Object.keys(s.masteredIds || {});
  const starredKeys = Object.keys(s.starredIds || {});
  const weakKeys = Object.keys(s.weakIds || {});
  return {
    masteredCount: masteredKeys.length,
    starredCount: starredKeys.length,
    weakCount: weakKeys.length,
    lastStudiedUnit: s.lastStudiedUnit || 1,
    dailyGoal: s.dailyGoal || 30,
    progressDataJson: JSON.stringify({
      masteredIds: s.masteredIds || {},
      starredIds: s.starredIds || {},
      weakIds: s.weakIds || {},
      writingHistory: s.writingHistory || {},
      speakingHistory: s.speakingHistory || {},
      dailyLog: s.dailyLog || {}
    })
  };
};

// Đồng bộ trực tiếp lên SQL Server theo từng tài khoản (Chặn đứng rò rỉ chéo)
const syncStateToCloudImmediate = async (state, customUserId) => {
  const uid = customUserId ?? useAuthStore.getState().user?.id;
  if (!uid || uid === 'guest') return;
  // Chặn tuyệt đối nếu state thuộc về tài khoản khác
  if (state?.currentUserId && state.currentUserId !== uid) return;
  try {
    const payload = buildCloudPayload(state);
    await progressApi.saveReflexProgress(payload);
  } catch (err) {
    console.warn('Reflex 50 Cloud Sync warning:', err?.message || err);
  }
};

// Debounce đồng bộ lên Cloud Database (250ms)
const syncStateToCloudDebounced = (state, customUserId) => {
  const uid = customUserId ?? useAuthStore.getState().user?.id;
  if (!uid || uid === 'guest') return;
  if (state?.currentUserId && state.currentUserId !== uid) return;

  latestPendingState = state;
  latestPendingUserId = uid;

  if (pendingCloudSyncTimer) clearTimeout(pendingCloudSyncTimer);
  pendingCloudSyncTimer = setTimeout(async () => {
    pendingCloudSyncTimer = null;
    const activeUid = useAuthStore.getState().user?.id;
    if (activeUid && activeUid === latestPendingUserId && latestPendingState) {
      await syncStateToCloudImmediate(latestPendingState, latestPendingUserId);
    }
  }, 250);
};

// Ghi tức thì xuống LocalStorage (0ms) và đồng bộ lên Database SQL Server
const saveStateToStorage = (state) => {
  const uid = useAuthStore.getState().user?.id;
  if (!uid || uid === 'guest') {
    flushStateToStorage(state, 'guest');
    return;
  }
  // Chặn tuyệt đối: Không bao giờ lưu state nếu store đang giữ dữ liệu của user khác
  if (state.currentUserId && state.currentUserId !== uid) {
    return;
  }
  latestPendingState = state;
  latestPendingUserId = uid;

  // 1. Lưu ngay lập tức vào LocalStorage (0ms synchronous)
  flushStateToStorage(state, uid);

  // 2. Debounce đồng bộ lên Cloud Database (250ms)
  syncStateToCloudDebounced(state, uid);
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const currentActiveUid = useAuthStore.getState().user?.id;
    if (
      latestPendingState &&
      latestPendingUserId &&
      latestPendingUserId !== 'guest' &&
      latestPendingUserId === currentActiveUid
    ) {
      if (pendingCloudSyncTimer) {
        clearTimeout(pendingCloudSyncTimer);
        pendingCloudSyncTimer = null;
      }
      flushStateToStorage(latestPendingState, latestPendingUserId);
      try {
        const payload = JSON.stringify(buildCloudPayload(latestPendingState));
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/userprogress/reflex', blob);
      } catch {
        syncStateToCloudImmediate(latestPendingState, latestPendingUserId);
      }
    }
  });

  // Hỗ trợ tự động đồng bộ khi chuyển qua lại giữa các tab hoặc các trình duyệt
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      const activeUid = useAuthStore.getState().user?.id;
      if (document.visibilityState === 'visible') {
        if (activeUid && activeUid !== 'guest') {
          useReflex50Store.getState().fetchProgress(activeUid);
        }
      } else if (document.visibilityState === 'hidden') {
        if (
          pendingCloudSyncTimer &&
          latestPendingState &&
          latestPendingUserId === activeUid &&
          activeUid &&
          activeUid !== 'guest'
        ) {
          clearTimeout(pendingCloudSyncTimer);
          pendingCloudSyncTimer = null;
          syncStateToCloudImmediate(latestPendingState, latestPendingUserId);
        }
      }
    });

    window.addEventListener('focus', () => {
      const activeUid = useAuthStore.getState().user?.id;
      if (activeUid && activeUid !== 'guest') {
        useReflex50Store.getState().fetchProgress(activeUid);
      }
    });
  }
}

// Chuẩn hóa tiếng Anh khi chấm điểm viết & nói (chấp nhận viết tắt phổ biến)
export function normalizeEnglishForComparison(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bthat's\b/g, 'that is')
    .replace(/\bthere's\b/g, 'there is')
    .replace(/\bi've\b/g, 'i have')
    .replace(/\byou've\b/g, 'you have')
    .replace(/\bwe've\b/g, 'we have')
    .replace(/\bthey've\b/g, 'they have')
    .replace(/\bi'll\b/g, 'i will')
    .replace(/\byou'll\b/g, 'you will')
    .replace(/\bwe'll\b/g, 'we will')
    .replace(/\bthey'll\b/g, 'they will')
    .replace(/\bhe'll\b/g, 'he will')
    .replace(/\bshe'll\b/g, 'she will')
    .replace(/\bi'd\b/g, 'i would')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bcouldn't\b/g, 'could not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bwouldn't\b/g, 'would not')
    .replace(/\bshouldn't\b/g, 'should not')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/\baren't\b/g, 'are not')
    .replace(/\bwasn't\b/g, 'was not')
    .replace(/\bweren't\b/g, 'were not')
    .replace(/\bhasn't\b/g, 'has not')
    .replace(/\bhaven't\b/g, 'have not')
    .replace(/\ba\.m\./g, 'am')
    .replace(/\bp\.m\./g, 'pm')
    .replace(/\bo'clock\b/g, 'oclock')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

import {
  vietPhoneticSimilarity,
  reconstructSmartTranscript
} from '../../../utils/smartSpeechRecognition';

// Chấm điểm câu viết / nói so với câu chuẩn bản xứ & trả về diff chi tiết từng từ
export function evaluateSentenceAttempt(userText = '', targetText = '', options = {}) {
  const isSpeech = Boolean(options?.isSpeech);
  const effectiveUserText = isSpeech
    ? reconstructSmartTranscript(userText, targetText)
    : userText;

  const normUser = normalizeEnglishForComparison(effectiveUserText);
  const normTarget = normalizeEnglishForComparison(targetText);

  if (!normUser) {
    return {
      score: 0,
      isExact: false,
      isPass: false,
      smartTranscript: '',
      wordDiffs: [],
      missingWords: targetText.split(/\s+/),
      feedback: 'Hãy nhập hoặc nói câu tiếng Anh của bạn.'
    };
  }

  if (normUser === normTarget) {
    const rawTargetWords = targetText.trim().split(/\s+/);
    return {
      score: 100,
      isExact: true,
      isPass: true,
      smartTranscript: targetText.trim(),
      wordDiffs: rawTargetWords.map((w) => ({
        word: w,
        cleanWord: w.toLowerCase().replace(/[^\w]/g, ''),
        status: 'correct'
      })),
      missingWords: [],
      feedback: 'Chính xác tuyệt đối 100%! Phản xạ phát âm rất chuẩn xác.'
    };
  }

  const userWords = normUser.split(' ').filter(Boolean);
  const targetWords = normTarget.split(' ').filter(Boolean);
  const rawTargetWords = targetText.trim().split(/\s+/);

  const isWordMatch = (tWord, uWord) => {
    if (tWord === uWord) return true;
    if (isSpeech && vietPhoneticSimilarity(uWord, tWord) >= 0.60) return true;
    return false;
  };

  // Quy hoạch động LCS (Longest Common Subsequence) để tìm các từ khớp đúng thứ tự
  const m = targetWords.length;
  const n = userWords.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (isWordMatch(targetWords[i - 1], userWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Truy vết để đánh dấu từng từ trong câu chuẩn là 'correct' hay 'missing'
  const matchedTargetIndices = new Set();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (isWordMatch(targetWords[i - 1], userWords[j - 1])) {
      matchedTargetIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // Nếu là chế độ nói (isSpeech), kiểm tra thêm những từ chưa khớp theo vị trí gần (phòng trường hợp đảo nhẹ hoặc tách từ)
  if (isSpeech) {
    for (let idx = 0; idx < m; idx++) {
      if (matchedTargetIndices.has(idx)) continue;
      const tW = targetWords[idx];
      if (userWords.some((uW) => vietPhoneticSimilarity(uW, tW) >= 0.62)) {
        matchedTargetIndices.add(idx);
      }
    }
  }

  const matchedCount = matchedTargetIndices.size;
  // Tính điểm dựa trên độ phủ câu chuẩn (trong chế độ nói ưu tiên độ phủ từ mục tiêu để không phạt nặng nhiễu mic)
  const recall = m > 0 ? matchedCount / m : 0;
  const precision = n > 0 ? Math.min(1, matchedCount / n) : 0;
  const rawScore = isSpeech
    ? recall * 0.85 + precision * 0.15
    : recall + precision > 0
      ? (2 * recall * precision) / (recall + precision)
      : 0;
  const score = Math.min(100, Math.round(rawScore * 100));

  const wordDiffs = rawTargetWords.map((w, idx) => ({
    word: w,
    cleanWord: targetWords[idx] || w.toLowerCase(),
    status: matchedTargetIndices.has(idx) ? 'correct' : 'missing'
  }));

  const missingWords = wordDiffs.filter((d) => d.status === 'missing').map((d) => d.word);
  const isPass = score >= 75;

  let feedback = '';
  if (score >= 90) {
    feedback = 'Rất tuyệt vời! Giọng đọc & cấu trúc câu của bạn cực kỳ chuẩn xác.';
  } else if (score >= 75) {
    feedback = 'Đạt yêu cầu! Bạn đã phát âm rõ ý chính, bấm vào từ màu đỏ để nghe lại nhé.';
  } else if (score >= 50) {
    feedback = 'Đã bắt được một nửa câu! Hãy nghe mẫu chậm 0.7x và đọc liền mạch hơn nhé.';
  } else {
    feedback = 'Hãy bấm nghe chậm 0.7x và đọc to, rõ từng cụm từ gợi ý nhé.';
  }

  return {
    score,
    isExact: score === 100,
    isPass,
    smartTranscript: effectiveUserText,
    wordDiffs,
    missingWords,
    feedback
  };
}

export const getCleanReflexState = (unitNum = 1) => ({
  masteredIds: {},
  starredIds: {},
  weakIds: {},
  writingHistory: {},
  speakingHistory: {},
  lastStudiedUnit: Number(unitNum) || 1,
  dailyGoal: 30,
  dailyLog: {},
  isProgressLoaded: false,
  currentUserId: null
});

function getInitialLoadedReflexState() {
  if (typeof window === 'undefined') return getCleanReflexState(1);
  const authUser = useAuthStore.getState()?.user;
  if (!authUser?.id) {
    const guestData = loadInitialState('guest');
    return {
      ...getCleanReflexState(guestData?.lastStudiedUnit || 1),
      ...(guestData || {}),
      currentUserId: 'guest',
      isProgressLoaded: !!guestData
    };
  }
  const userData = loadInitialState(authUser.id);
  return {
    ...getCleanReflexState(userData?.lastStudiedUnit || 1),
    ...(userData || {}),
    currentUserId: authUser.id,
    isProgressLoaded: !!userData
  };
}

const initialSaved = getInitialLoadedReflexState();

export const useReflex50Store = create((set, get) => ({
  masteredIds: initialSaved.masteredIds,
  starredIds: initialSaved.starredIds,
  weakIds: initialSaved.weakIds,
  writingHistory: initialSaved.writingHistory,
  speakingHistory: initialSaved.speakingHistory,
  lastStudiedUnit: initialSaved.lastStudiedUnit,
  dailyGoal: initialSaved.dailyGoal,
  dailyLog: initialSaved.dailyLog,
  isProgressLoaded: initialSaved.isProgressLoaded,
  currentUserId: initialSaved.currentUserId,

  resetForUser: (targetUid) => {
    if (pendingCloudSyncTimer) {
      clearTimeout(pendingCloudSyncTimer);
      pendingCloudSyncTimer = null;
    }
    latestPendingState = null;
    latestPendingUserId = null;

    if (!targetUid || targetUid === 'guest') {
      const guestSaved = loadInitialState('guest');
      set({
        ...getCleanReflexState(guestSaved?.lastStudiedUnit || 1),
        ...(guestSaved || {}),
        currentUserId: 'guest',
        isProgressLoaded: true
      });
      return;
    }

    const userSaved = loadInitialState(targetUid);
    set({
      ...getCleanReflexState(userSaved?.lastStudiedUnit || 1),
      ...(userSaved || {}),
      currentUserId: targetUid,
      isProgressLoaded: !!userSaved
    });
  },

  setLastStudiedUnit: (unitNumber) => {
    set((state) => {
      const next = { ...state, lastStudiedUnit: Number(unitNumber) || 1 };
      saveStateToStorage(next);
      return next;
    });
  },

  setDailyGoal: (goal) => {
    set((state) => {
      const next = { ...state, dailyGoal: Math.max(10, Number(goal) || 30) };
      saveStateToStorage(next);
      return next;
    });
  },

  toggleMastered: (sentenceId) => {
    let isNewlyMastered = false;
    let alreadyPracticed = false;
    set((state) => {
      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const today = getTodayKey();
      const nextDailyLog = { ...state.dailyLog };

      alreadyPracticed =
        (state.writingHistory?.[sentenceId]?.bestScore || 0) >= 80 ||
        (state.speakingHistory?.[sentenceId]?.bestScore || 0) >= 75;

      if (nextMastered[sentenceId]) {
        delete nextMastered[sentenceId];
      } else {
        nextMastered[sentenceId] = true;
        delete nextWeak[sentenceId];
        nextDailyLog[today] = (nextDailyLog[today] || 0) + 1;
        isNewlyMastered = true;
      }

      const next = {
        ...state,
        masteredIds: nextMastered,
        weakIds: nextWeak,
        dailyLog: nextDailyLog
      };
      saveStateToStorage(next);
      return next;
    });

    if (isNewlyMastered && !alreadyPracticed) {
      try {
        useGamificationStore.getState().earnXP(1, 'reflex_master', `Master câu phản xạ ${sentenceId}`);
      } catch (e) {
        console.error('Lỗi cộng XP câu phản xạ:', e);
      }
    }
  },

  markUnitMastered: (unitNumber, mastered = true) => {
    const ids = getUnitSentenceIds(unitNumber);
    if (ids.length === 0) return;
    let addedCount = 0;
    set((state) => {
      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const today = getTodayKey();
      const nextDailyLog = { ...state.dailyLog };

      for (const id of ids) {
        if (mastered) {
          if (!nextMastered[id]) addedCount++;
          nextMastered[id] = true;
          delete nextWeak[id];
        } else {
          delete nextMastered[id];
        }
      }

      if (addedCount > 0) {
        nextDailyLog[today] = (nextDailyLog[today] || 0) + addedCount;
      }

      const next = {
        ...state,
        masteredIds: nextMastered,
        weakIds: nextWeak,
        dailyLog: nextDailyLog
      };
      saveStateToStorage(next);
      return next;
    });

    if (mastered && addedCount >= 5) {
      try {
        useGamificationStore.getState().earnXP(10, 'reflex_master', `Master trọn bộ Unit ${unitNumber}`);
      } catch (e) {
        console.error('Lỗi cộng XP khi master Unit:', e);
      }
    }
  },

  toggleStarred: (sentenceId) => {
    set((state) => {
      const nextStarred = { ...state.starredIds };
      if (nextStarred[sentenceId]) {
        delete nextStarred[sentenceId];
      } else {
        nextStarred[sentenceId] = true;
      }
      const next = { ...state, starredIds: nextStarred };
      saveStateToStorage(next);
      return next;
    });
  },

  recordWritingAttempt: (sentenceId, userInput, score) => {
    const hasAttempt = typeof userInput === 'string' && userInput.trim().length > 0;
    const prevBest = get().writingHistory?.[sentenceId]?.bestScore || 0;

    set((state) => {
      const prev = state.writingHistory[sentenceId] || { attempts: 0, bestScore: 0 };
      const nextWriting = {
        ...state.writingHistory,
        [sentenceId]: {
          lastInput: userInput,
          score,
          bestScore: Math.max(prev.bestScore || 0, score),
          attempts: (prev.attempts || 0) + 1,
          updatedAt: new Date().toISOString()
        }
      };

      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const today = getTodayKey();
      const nextDailyLog = { ...state.dailyLog };

      if (score >= 80) {
        if (!nextMastered[sentenceId]) {
          nextDailyLog[today] = (nextDailyLog[today] || 0) + 1;
        }
        nextMastered[sentenceId] = true;
        delete nextWeak[sentenceId];
      } else {
        nextWeak[sentenceId] = (nextWeak[sentenceId] || 0) + 1;
      }

      const next = {
        ...state,
        writingHistory: nextWriting,
        masteredIds: nextMastered,
        weakIds: nextWeak,
        dailyLog: nextDailyLog
      };
      saveStateToStorage(next);
      return next;
    });

    // Chỉ thưởng XP khi viết đạt chuẩn (>= 80%). Lần đầu vượt qua câu: 4-6 XP; Ôn lại câu đã đạt: 1 XP
    if (hasAttempt && score >= 80) {
      try {
        const isFirstPass = prevBest < 80;
        const xp = isFirstPass ? (score >= 95 ? 6 : 4) : 1;
        const msg = isFirstPass
          ? `Viết chuẩn xác ${score}% (${sentenceId})`
          : `Ôn tập viết phản xạ (${sentenceId})`;
        useGamificationStore.getState().earnXP(xp, 'reflex_write', msg);
      } catch (e) {
        console.error('Lỗi cộng XP viết phản xạ:', e);
      }
    }
  },

  recordSpeakingAttempt: (sentenceId, transcript, score) => {
    const hasAttempt = (typeof transcript === 'string' && transcript.trim().length > 0) || score > 0;
    const prevBest = get().speakingHistory?.[sentenceId]?.bestScore || 0;

    set((state) => {
      const prev = state.speakingHistory[sentenceId] || { attempts: 0, bestScore: 0 };
      const nextSpeaking = {
        ...state.speakingHistory,
        [sentenceId]: {
          transcript,
          score,
          bestScore: Math.max(prev.bestScore || 0, score),
          attempts: (prev.attempts || 0) + 1,
          updatedAt: new Date().toISOString()
        }
      };

      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const today = getTodayKey();
      const nextDailyLog = { ...state.dailyLog };

      if (score >= 75) {
        if (!nextMastered[sentenceId]) {
          nextDailyLog[today] = (nextDailyLog[today] || 0) + 1;
        }
        nextMastered[sentenceId] = true;
        delete nextWeak[sentenceId];
      } else if (score > 0 && score < 65) {
        nextWeak[sentenceId] = (nextWeak[sentenceId] || 0) + 1;
      }

      const next = {
        ...state,
        speakingHistory: nextSpeaking,
        masteredIds: nextMastered,
        weakIds: nextWeak,
        dailyLog: nextDailyLog
      };
      saveStateToStorage(next);
      return next;
    });

    // Chỉ thưởng XP khi phát âm đạt chuẩn (>= 75%). Lần đầu vượt qua câu: 5-8 XP; Ôn lại câu đã đạt: 1 XP
    if (hasAttempt && score >= 75) {
      try {
        const isFirstPass = prevBest < 75;
        const xp = isFirstPass ? (score >= 90 ? 8 : 5) : 1;
        const msg = isFirstPass
          ? `Phản xạ nói chuẩn ${score}% (${sentenceId})`
          : `Ôn tập nói phản xạ (${sentenceId})`;
        useGamificationStore.getState().earnXP(xp, 'reflex_speak', msg);
      } catch (e) {
        console.error('Lỗi cộng XP nói phản xạ:', e);
      }
    }
  },

  recordListeningAttempt: (sentenceId) => {
    try {
      useGamificationStore.getState().earnXP(1, 'reflex_listen', `Nghe câu phản xạ ${sentenceId || ''}`);
    } catch (e) {}
  },

  resetUnitProgress: (unitNumber) => {
    const ids = getUnitSentenceIds(unitNumber);
    if (ids.length === 0) return;
    set((state) => {
      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const nextWriting = { ...state.writingHistory };
      const nextSpeaking = { ...state.speakingHistory };

      for (const id of ids) {
        delete nextMastered[id];
        delete nextWeak[id];
        delete nextWriting[id];
        delete nextSpeaking[id];
      }

      const next = {
        ...state,
        masteredIds: nextMastered,
        weakIds: nextWeak,
        writingHistory: nextWriting,
        speakingHistory: nextSpeaking
      };
      saveStateToStorage(next);
      return next;
    });
  },

  resetAllProgress: () => {
    const activeUid = get().currentUserId || useAuthStore.getState().user?.id || 'guest';
    const empty = {
      ...getCleanReflexState(1),
      currentUserId: activeUid,
      isProgressLoaded: true
    };
    saveStateToStorage(empty);
    set(empty);
  },

  getUnitStats: (unitNumber) => {
    const state = get();
    const ids = getUnitSentenceIds(unitNumber);
    if (ids.length === 0) {
      return {
        masteredCount: 0,
        starredCount: 0,
        weakCount: 0,
        writtenCount: 0,
        spokenCount: 0,
        total: SENTENCES_PER_UNIT,
        percent: 0,
        isCompleted: false
      };
    }

    let masteredCount = 0;
    let starredCount = 0;
    let weakCount = 0;
    let writtenCount = 0;
    let spokenCount = 0;

    for (const id of ids) {
      if (state.masteredIds[id]) masteredCount++;
      if (state.starredIds[id]) starredCount++;
      if (state.weakIds[id]) weakCount++;
      if (state.writingHistory[id]?.attempts > 0) writtenCount++;
      if (state.speakingHistory[id]?.attempts > 0) spokenCount++;
    }

    const total = ids.length || SENTENCES_PER_UNIT;
    const percent = Math.round((masteredCount / total) * 100);
    return {
      masteredCount,
      starredCount,
      weakCount,
      writtenCount,
      spokenCount,
      total,
      percent,
      isCompleted: masteredCount >= total
    };
  },

  getOverallStats: () => {
    const state = get();
    const totalMastered = Object.keys(state.masteredIds).length;
    const totalStarred = Object.keys(state.starredIds).length;
    const totalWeak = Object.keys(state.weakIds).length;
    const totalWritten = Object.keys(state.writingHistory).length;
    const totalSpoken = Object.keys(state.speakingHistory).length;
    const todayCount = state.dailyLog[getTodayKey()] || 0;

    let completedUnits = 0;
    let activeUnits = 0;
    for (let u = 1; u <= TOTAL_UNITS; u++) {
      let mCount = 0;
      for (let s = 1; s <= SENTENCES_PER_UNIT; s++) {
        if (state.masteredIds[`u${u}-s${s}`]) mCount++;
      }
      if (mCount >= SENTENCES_PER_UNIT) completedUnits++;
      else if (mCount > 0) activeUnits++;
    }

    return {
      totalMastered,
      totalSentences: TOTAL_UNITS * SENTENCES_PER_UNIT,
      overallPercent: Math.round((totalMastered / (TOTAL_UNITS * SENTENCES_PER_UNIT)) * 100),
      completedUnits,
      activeUnits,
      totalUnits: TOTAL_UNITS,
      totalStarred,
      totalWeak,
      totalWritten,
      totalSpoken,
      todayCount,
      dailyGoal: state.dailyGoal
    };
  },

  // Tải lại toàn bộ tiến độ Reflex 50 từ SQL Server và bộ nhớ đệm
  fetchProgress: async (customUserId) => {
    const authState = useAuthStore.getState();
    const uid = customUserId ?? authState.user?.id;
    if (!uid || uid === 'guest') {
      get().resetForUser('guest');
      return;
    }

    // Nếu store đang giữ state của user khác -> Reset ngay tức thì về user này
    if (get().currentUserId !== uid) {
      get().resetForUser(uid);
    }

    // Nạp cục bộ CỦA ĐÚNG USER NÀY (nếu chưa có thì là sạch 100%)
    const local = loadInitialState(uid) || getCleanReflexState(1);

    try {
      const res = await progressApi.getReflexProgress();

      // Đảm bảo không bị race condition khi chuyển tài khoản trong lúc fetch
      const activeUid = useAuthStore.getState().user?.id;
      if (activeUid !== uid) {
        return;
      }

      let cloud = null;
      if (res && typeof res === 'object') {
        if (res.data && typeof res.data === 'object' && ('progressDataJson' in res.data || 'masteredCount' in res.data)) {
          cloud = res.data;
        } else if ('progressDataJson' in res || 'masteredCount' in res) {
          cloud = res;
        } else if (res.data?.data && typeof res.data.data === 'object') {
          cloud = res.data.data;
        }
      }

      if (cloud) {
        let details = {};
        if (cloud.progressDataJson) {
          try {
            details = typeof cloud.progressDataJson === 'string'
              ? JSON.parse(cloud.progressDataJson)
              : (cloud.progressDataJson || {});
          } catch (e) {
            details = {};
          }
        }

        // Hợp nhất writingHistory (giữ điểm cao nhất và số lần thử)
        const mergedWriting = { ...(details.writingHistory || {}) };
        for (const [sId, lItem] of Object.entries(local.writingHistory || {})) {
          const rItem = mergedWriting[sId];
          if (!rItem) {
            mergedWriting[sId] = lItem;
          } else {
            mergedWriting[sId] = {
              lastInput: (lItem.updatedAt || '') >= (rItem.updatedAt || '') ? lItem.lastInput : rItem.lastInput,
              score: (lItem.updatedAt || '') >= (rItem.updatedAt || '') ? lItem.score : rItem.score,
              bestScore: Math.max(rItem.bestScore || 0, lItem.bestScore || 0),
              attempts: Math.max(rItem.attempts || 0, lItem.attempts || 0),
              updatedAt: (lItem.updatedAt || '') >= (rItem.updatedAt || '') ? lItem.updatedAt : rItem.updatedAt
            };
          }
        }

        // Hợp nhất speakingHistory (giữ điểm cao nhất và số lần thử)
        const mergedSpeaking = { ...(details.speakingHistory || {}) };
        for (const [sId, lItem] of Object.entries(local.speakingHistory || {})) {
          const rItem = mergedSpeaking[sId];
          if (!rItem) {
            mergedSpeaking[sId] = lItem;
          } else {
            mergedSpeaking[sId] = {
              transcript: (lItem.updatedAt || '') >= (rItem.updatedAt || '') ? lItem.transcript : rItem.transcript,
              score: (lItem.updatedAt || '') >= (rItem.updatedAt || '') ? lItem.score : rItem.score,
              bestScore: Math.max(rItem.bestScore || 0, lItem.bestScore || 0),
              attempts: Math.max(rItem.attempts || 0, lItem.attempts || 0),
              updatedAt: (lItem.updatedAt || '') >= (rItem.updatedAt || '') ? lItem.updatedAt : rItem.updatedAt
            };
          }
        }

        // Hợp nhất dailyLog theo ngày
        const mergedDailyLog = { ...(details.dailyLog || {}) };
        for (const [day, count] of Object.entries(local.dailyLog || {})) {
          mergedDailyLog[day] = Math.max(mergedDailyLog[day] || 0, count || 0);
        }

        const mergedMastered = { ...(details.masteredIds || {}), ...(local.masteredIds || {}) };
        const mergedStarred = { ...(details.starredIds || {}), ...(local.starredIds || {}) };
        const mergedWeak = { ...(details.weakIds || {}), ...(local.weakIds || {}) };

        const merged = {
          masteredIds: mergedMastered,
          starredIds: mergedStarred,
          weakIds: mergedWeak,
          writingHistory: mergedWriting,
          speakingHistory: mergedSpeaking,
          lastStudiedUnit: cloud.lastStudiedUnit || local.lastStudiedUnit || 1,
          dailyGoal: cloud.dailyGoal || local.dailyGoal || 30,
          dailyLog: mergedDailyLog,
          isProgressLoaded: true,
          currentUserId: uid
        };

        set(merged);
        flushStateToStorage(merged, uid);

        // Chỉ đồng bộ lên cloud nếu local của chính UID có dữ liệu mới hơn server
        const localMasteredLen = Object.keys(local.masteredIds || {}).length;
        const cloudMasteredLen = Object.keys(details.masteredIds || {}).length;
        if (localMasteredLen > cloudMasteredLen && localMasteredLen > 0) {
          syncStateToCloudImmediate(merged, uid);
        }
      } else {
        set({ ...local, currentUserId: uid, isProgressLoaded: true });
      }
    } catch (err) {
      console.warn('Không thể nạp tiến độ Reflex 50 từ máy chủ:', err?.message || err);
      set({ isProgressLoaded: true });
    }
  },

  // Alias tương thích ngược
  loadForUser: (userId) => get().fetchProgress(userId)
}));

// Tự động đồng bộ và tải dữ liệu riêng biệt mỗi khi học viên đăng nhập/đăng xuất
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state, prevState) => {
    const newUid = state.user?.id || null;
    const oldUid = prevState?.user?.id || null;
    if (newUid !== oldUid) {
      if (oldUid && latestPendingState && latestPendingUserId === oldUid) {
        flushStateToStorage(latestPendingState, oldUid);
        syncStateToCloudImmediate(latestPendingState, oldUid);
      }
      if (pendingCloudSyncTimer) {
        clearTimeout(pendingCloudSyncTimer);
        pendingCloudSyncTimer = null;
      }
      latestPendingState = null;
      latestPendingUserId = null;

      useReflex50Store.getState().resetForUser(newUid);
      if (newUid) {
        useReflex50Store.getState().fetchProgress(newUid);
      }
    }
  });

  // Tự động nạp tiến độ từ SQL Server khi tải trang nếu học viên đã đăng nhập
  const currentInitialUid = useAuthStore.getState().user?.id;
  if (currentInitialUid && currentInitialUid !== 'guest') {
    setTimeout(() => {
      useReflex50Store.getState().fetchProgress(currentInitialUid);
    }, 50);
  }
}

export default useReflex50Store;

