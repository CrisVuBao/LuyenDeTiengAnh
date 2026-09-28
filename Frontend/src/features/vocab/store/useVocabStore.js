import { create } from 'zustand';
import vocabData from '../../../data/vocab3000Data.json';
import vocabApi from '../../../api/vocabApi';
import useAuthStore from '../../../store/authStore';
import useGamificationStore from '../../gamification/store/useGamificationStore';

// Web Audio API for synthetic UI sounds (Zero network latency, 0 KB external assets)
let audioCtx = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playSoundEffect = (type) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      // Pleasant double chime: 523Hz (C5) -> 659Hz (E5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      // Low gentle buzz: 220Hz -> 180Hz
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'flip') {
      // Crisp click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (e) {
    // Audio context not allowed before user gesture
  }
};

let syncTimer = null;

const useVocabStore = create((set, get) => ({
  topics: vocabData.topics || [],
  totalWords: vocabData.totalWords || 1760,

  // User state
  masteredWords: {},  // { [wordId]: true }
  starredWords: {},   // { [wordId]: true }
  topicScores: {},    // { [topicId]: { bestScore: 90, lastScore: 80, attempts: 2 } }
  topicLastIndex: {}, // { [topicId]: number } - remembers last card studied per topic
  lastStudiedTopic: 1,

  // Preferences
  speechRate: 1.0,     // 0.8 or 1.0
  autoPlayAudio: true,
  isLoading: false,

  // Load progress for current authenticated user
  fetchProgress: async () => {
    const authState = useAuthStore.getState();
    const userId = authState.user?.id || 'guest';
    const localKey = `vbace_vocab_progress_${userId}`;

    // 1. First load from localStorage for 0ms immediate render
    try {
      const localCached = localStorage.getItem(localKey);
      if (localCached) {
        const parsed = JSON.parse(localCached);
        set({
          masteredWords: parsed.masteredWords || {},
          starredWords: parsed.starredWords || {},
          topicScores: parsed.topicScores || {},
          topicLastIndex: parsed.topicLastIndex || {},
          lastStudiedTopic: parsed.lastStudiedTopic || 1
        });
      }
    } catch {}

    // 2. Fetch from Backend Database if authenticated
    if (authState.isAuthenticated) {
      try {
        set({ isLoading: true });
        const res = await vocabApi.getProgress();
        const data = res?.data || res;
        if (data && data.progressDataJson) {
          try {
            const remoteParsed = JSON.parse(data.progressDataJson);
            const mergedMastered = { ...get().masteredWords, ...(remoteParsed.masteredWords || {}) };
            const mergedStarred = { ...get().starredWords, ...(remoteParsed.starredWords || {}) };
            const mergedScores = { ...get().topicScores, ...(remoteParsed.topicScores || {}) };
            const mergedLastIndex = { ...get().topicLastIndex, ...(remoteParsed.topicLastIndex || {}) };
            const lastTopic = data.lastStudiedTopic || remoteParsed.lastStudiedTopic || get().lastStudiedTopic || 1;

            set({
              masteredWords: mergedMastered,
              starredWords: mergedStarred,
              topicScores: mergedScores,
              topicLastIndex: mergedLastIndex,
              lastStudiedTopic: lastTopic,
              isLoading: false
            });

            // Cache merged state to localStorage
            localStorage.setItem(localKey, JSON.stringify({
              masteredWords: mergedMastered,
              starredWords: mergedStarred,
              topicScores: mergedScores,
              topicLastIndex: mergedLastIndex,
              lastStudiedTopic: lastTopic
            }));
          } catch {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        console.error('Lỗi khi tải tiến độ từ vựng:', err);
        set({ isLoading: false });
      }
    }
  },

  // Save progress (with debounce to batch updates)
  saveProgress: () => {
    const state = get();
    const authState = useAuthStore.getState();
    const userId = authState.user?.id || 'guest';
    const localKey = `vbace_vocab_progress_${userId}`;

    const payload = {
      masteredWords: state.masteredWords,
      starredWords: state.starredWords,
      topicScores: state.topicScores,
      topicLastIndex: state.topicLastIndex,
      lastStudiedTopic: state.lastStudiedTopic
    };

    // Save locally immediately
    try {
      localStorage.setItem(localKey, JSON.stringify(payload));
    } catch {}

    // Sync to backend
    if (!authState.isAuthenticated) return;

    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        const masteredCount = Object.keys(state.masteredWords).filter(k => state.masteredWords[k]).length;
        const starredCount = Object.keys(state.starredWords).filter(k => state.starredWords[k]).length;

        await vocabApi.saveProgress({
          masteredCount,
          starredCount,
          lastStudiedTopic: state.lastStudiedTopic,
          progressDataJson: JSON.stringify(payload)
        });
      } catch (e) {
        console.error('Lỗi đồng bộ tiến độ từ vựng lên máy chủ:', e);
      }
    }, 1200);
  },

  // Remember last card index per topic
  setTopicLastIndex: (topicId, index) => {
    set((state) => ({
      topicLastIndex: {
        ...state.topicLastIndex,
        [topicId]: Math.max(0, index)
      }
    }));
    get().saveProgress();
  },

  // Toggle or mark mastered status
  markWordMastered: (wordId, isMastered = true) => {
    set((state) => {
      const nextMastered = { ...state.masteredWords };
      if (isMastered) {
        nextMastered[wordId] = true;
      } else {
        delete nextMastered[wordId];
      }
      return { masteredWords: nextMastered };
    });
    get().saveProgress();
    if (isMastered) {
      try {
        useGamificationStore.getState().earnXP(2, 'vocab_master', 'Ghi nhớ từ vựng mới');
      } catch {}
    }
  },

  // Toggle star / bookmark
  toggleStarred: (wordId) => {
    set((state) => {
      const nextStarred = { ...state.starredWords };
      if (nextStarred[wordId]) {
        delete nextStarred[wordId];
      } else {
        nextStarred[wordId] = true;
      }
      return { starredWords: nextStarred };
    });
    get().saveProgress();
  },

  setLastStudiedTopic: (topicId) => {
    set({ lastStudiedTopic: topicId });
    get().saveProgress();
  },

  setSpeechRate: (rate) => set({ speechRate: rate }),
  toggleAutoPlayAudio: () => set((s) => ({ autoPlayAudio: !s.autoPlayAudio })),

  // Record Quiz Result & award XP
  recordQuizResult: (topicId, correctCount, totalCount) => {
    const accuracy = Math.round((correctCount / totalCount) * 100);
    set((state) => {
      const prev = state.topicScores[topicId] || { bestScore: 0, attempts: 0 };
      const nextScores = {
        ...state.topicScores,
        [topicId]: {
          bestScore: Math.max(prev.bestScore || 0, accuracy),
          lastScore: accuracy,
          attempts: (prev.attempts || 0) + 1,
          updatedAt: Date.now()
        }
      };
      return { topicScores: nextScores };
    });
    get().saveProgress();

    // Reward XP through gamification store quietly
    try {
      const xpAmount = Math.max(5, Math.round(correctCount * 3));
      useGamificationStore.getState().earnXP(xpAmount, 'vocab_quiz', `Luyện tập từ vựng chủ đề ${topicId} (${accuracy}%)`);
    } catch {}
  },

  // Web Speech API: Crystal clear, instant US English pronunciation
  speakWord: (word, speedOverride = null) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = speedOverride || get().speechRate || 1.0;
      utterance.pitch = 1.0;

      // Prefer native English US voices if available
      const voices = window.speechSynthesis.getVoices();
      const usVoice = voices.find((v) => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('English')));
      if (usVoice) utterance.voice = usVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Lỗi phát âm từ vựng:', e);
    }
  },

  playEffect: playSoundEffect
}));

// Auto-fetch vocab progress whenever user authentication status changes
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state, prevState) => {
    if (state.user?.id !== prevState?.user?.id || state.isAuthenticated !== prevState?.isAuthenticated) {
      useVocabStore.getState().fetchProgress();
    }
  });
}

export default useVocabStore;
