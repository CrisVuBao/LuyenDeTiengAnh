import { create } from 'zustand';
import reflex50Data from '../data/reflex50Data.json';

const STORAGE_KEY = 'vbace_reflex50_progress_v1';

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveStateToStorage = (state) => {
  try {
    const payload = {
      masteredIds: state.masteredIds,
      starredIds: state.starredIds,
      weakIds: state.weakIds,
      writingHistory: state.writingHistory,
      speakingHistory: state.speakingHistory,
      lastStudiedUnit: state.lastStudiedUnit,
      dailyGoal: state.dailyGoal,
      dailyLog: state.dailyLog
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
};

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

// Chấm điểm câu viết / nói so với câu chuẩn bản xứ & trả về diff chi tiết từng từ
export function evaluateSentenceAttempt(userText = '', targetText = '') {
  const normUser = normalizeEnglishForComparison(userText);
  const normTarget = normalizeEnglishForComparison(targetText);

  if (!normUser) {
    return {
      score: 0,
      isExact: false,
      isPass: false,
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
      wordDiffs: rawTargetWords.map((w) => ({ word: w, status: 'correct' })),
      missingWords: [],
      feedback: 'Chính xác tuyệt đối 100%! Phản xạ rất chuẩn xác.'
    };
  }

  const userWords = normUser.split(' ').filter(Boolean);
  const targetWords = normTarget.split(' ').filter(Boolean);
  const rawTargetWords = targetText.trim().split(/\s+/);

  // Quy hoạch động LCS (Longest Common Subsequence) để tìm các từ khớp đúng thứ tự
  const m = targetWords.length;
  const n = userWords.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetWords[i - 1] === userWords[j - 1]) {
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
    if (targetWords[i - 1] === userWords[j - 1]) {
      matchedTargetIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const lcsLen = dp[m][n];
  // Tính điểm dựa trên độ phủ câu chuẩn và độ chênh lệch độ dài
  const recall = m > 0 ? lcsLen / m : 0;
  const precision = n > 0 ? lcsLen / n : 0;
  const f1 = recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0;
  const score = Math.round(f1 * 100);

  const wordDiffs = rawTargetWords.map((w, idx) => ({
    word: w,
    cleanWord: targetWords[idx] || w.toLowerCase(),
    status: matchedTargetIndices.has(idx) ? 'correct' : 'missing'
  }));

  const missingWords = wordDiffs.filter((d) => d.status === 'missing').map((d) => d.word);
  const isPass = score >= 80;

  let feedback = '';
  if (score >= 90) {
    feedback = 'Rất tuyệt vời! Câu của bạn gần như hoàn hảo, chỉ lệch một chi tiết nhỏ.';
  } else if (score >= 80) {
    feedback = 'Đạt yêu cầu! Bạn đã nắm được cấu trúc chính, chú ý các từ được tô màu.';
  } else if (score >= 55) {
    feedback = 'Đã đúng được ý cơ bản. Hãy xem kỹ các từ còn thiếu và thử lại nhé!';
  } else {
    feedback = 'Câu chưa khớp cấu trúc. Hãy bấm nghe chậm 0.75x và nhìn gợi ý cụm từ nhé.';
  }

  return {
    score,
    isExact: score === 100,
    isPass,
    wordDiffs,
    missingWords,
    feedback
  };
}

const saved = loadInitialState();

export const useReflex50Store = create((set, get) => ({
  masteredIds: saved?.masteredIds || {},
  starredIds: saved?.starredIds || {},
  weakIds: saved?.weakIds || {},
  writingHistory: saved?.writingHistory || {},
  speakingHistory: saved?.speakingHistory || {},
  lastStudiedUnit: saved?.lastStudiedUnit || 1,
  dailyGoal: saved?.dailyGoal || 30,
  dailyLog: saved?.dailyLog || {},

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
    set((state) => {
      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const today = getTodayKey();
      const nextDailyLog = { ...state.dailyLog };

      if (nextMastered[sentenceId]) {
        delete nextMastered[sentenceId];
      } else {
        nextMastered[sentenceId] = true;
        delete nextWeak[sentenceId];
        nextDailyLog[today] = (nextDailyLog[today] || 0) + 1;
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
  },

  markUnitMastered: (unitNumber, mastered = true) => {
    const unit = reflex50Data.units.find((u) => u.unitNumber === Number(unitNumber));
    if (!unit) return;
    set((state) => {
      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const today = getTodayKey();
      const nextDailyLog = { ...state.dailyLog };
      let addedCount = 0;

      for (const s of unit.sentences) {
        if (mastered) {
          if (!nextMastered[s.id]) addedCount++;
          nextMastered[s.id] = true;
          delete nextWeak[s.id];
        } else {
          delete nextMastered[s.id];
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

      if (score >= 85) {
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
  },

  recordSpeakingAttempt: (sentenceId, transcript, score) => {
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

      if (score >= 80) {
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
  },

  resetUnitProgress: (unitNumber) => {
    const unit = reflex50Data.units.find((u) => u.unitNumber === Number(unitNumber));
    if (!unit) return;
    set((state) => {
      const nextMastered = { ...state.masteredIds };
      const nextWeak = { ...state.weakIds };
      const nextWriting = { ...state.writingHistory };
      const nextSpeaking = { ...state.speakingHistory };

      for (const s of unit.sentences) {
        delete nextMastered[s.id];
        delete nextWeak[s.id];
        delete nextWriting[s.id];
        delete nextSpeaking[s.id];
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
    const empty = {
      masteredIds: {},
      starredIds: {},
      weakIds: {},
      writingHistory: {},
      speakingHistory: {},
      lastStudiedUnit: 1,
      dailyGoal: 30,
      dailyLog: {}
    };
    saveStateToStorage(empty);
    set(empty);
  },

  getUnitStats: (unitNumber) => {
    const state = get();
    const unit = reflex50Data.units.find((u) => u.unitNumber === Number(unitNumber));
    if (!unit) {
      return {
        masteredCount: 0,
        starredCount: 0,
        weakCount: 0,
        writtenCount: 0,
        spokenCount: 0,
        total: 30,
        percent: 0,
        isCompleted: false
      };
    }

    let masteredCount = 0;
    let starredCount = 0;
    let weakCount = 0;
    let writtenCount = 0;
    let spokenCount = 0;

    for (const s of unit.sentences) {
      if (state.masteredIds[s.id]) masteredCount++;
      if (state.starredIds[s.id]) starredCount++;
      if (state.weakIds[s.id]) weakCount++;
      if (state.writingHistory[s.id]?.attempts > 0) writtenCount++;
      if (state.speakingHistory[s.id]?.attempts > 0) spokenCount++;
    }

    const total = unit.sentences.length || 30;
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
    for (const u of reflex50Data.units) {
      const mCount = u.sentences.filter((s) => state.masteredIds[s.id]).length;
      if (mCount >= u.sentences.length) completedUnits++;
      else if (mCount > 0) activeUnits++;
    }

    return {
      totalMastered,
      totalSentences: 1500,
      overallPercent: Math.round((totalMastered / 1500) * 100),
      completedUnits,
      activeUnits,
      totalUnits: 50,
      totalStarred,
      totalWeak,
      totalWritten,
      totalSpoken,
      todayCount,
      dailyGoal: state.dailyGoal
    };
  }
}));

export default useReflex50Store;
