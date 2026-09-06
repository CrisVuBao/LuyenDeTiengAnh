import { useState, useEffect, useCallback } from 'react';
import progressApi from '../api/progressApi';
import useAuthStore from '../store/authStore';

export default function useStudyProgress(toeicTestId) {
  const [progressMap, setProgressMap] = useState({}); // key: `${partNumber}_${questionNumber}` -> { isConfident, isRevealed, selectedAnswer }
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Load progress from backend
  const loadProgress = useCallback(async () => {
    if (!toeicTestId || !isAuthenticated) return;
    try {
      setLoading(true);
      const res = await progressApi.getProgress(toeicTestId);
      if (res?.data && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(item => {
          map[`${item.partNumber}_${item.questionNumber}`] = {
            isConfident: item.isConfident,
            isRevealed: item.isRevealed,
            selectedAnswer: item.selectedAnswer
          };
        });
        setProgressMap(map);
      }
    } catch (e) {
      console.warn("Không thể tải tiến độ từ máy chủ, dùng dữ liệu hiện tại:", e.message);
    } finally {
      setLoading(false);
    }
  }, [toeicTestId, isAuthenticated]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Mark confident or toggle
  const markConfident = async (partNumber, questionNumber, isConfidentVal) => {
    const key = `${partNumber}_${questionNumber}`;
    const current = progressMap[key] || {};
    
    // Toggle logic
    let nextVal = isConfidentVal;
    if (current.isConfident === isConfidentVal) {
      nextVal = null;
    }

    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isConfident: nextVal
      }
    }));

    if (isAuthenticated && toeicTestId) {
      try {
        await progressApi.markProgress({
          toeicTestId,
          partNumber,
          questionNumber,
          isConfident: nextVal
        });
      } catch (e) {
        console.error("Lỗi lưu tiến độ:", e);
      }
    }
  };

  // Mark revealed
  const markRevealed = async (partNumber, questionNumber) => {
    const key = `${partNumber}_${questionNumber}`;
    setProgressMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isRevealed: true
      }
    }));

    if (isAuthenticated && toeicTestId) {
      try {
        await progressApi.markProgress({
          toeicTestId,
          partNumber,
          questionNumber,
          isRevealed: true
        });
      } catch (e) {
        console.error("Lỗi lưu trạng thái lật thẻ:", e);
      }
    }
  };

  // Select answer
  const selectAnswer = async (partNumber, questionNumber, answer) => {
    const key = `${partNumber}_${questionNumber}`;
    setProgressMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        selectedAnswer: answer,
        isRevealed: true
      }
    }));

    if (isAuthenticated && toeicTestId) {
      try {
        await progressApi.markProgress({
          toeicTestId,
          partNumber,
          questionNumber,
          selectedAnswer: answer,
          isRevealed: true
        });
      } catch (e) {
        console.error("Lỗi lưu đáp án:", e);
      }
    }
  };

  // Reset part
  const resetPart = async (partNumber) => {
    setProgressMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (partNumber === 0 || k.startsWith(`${partNumber}_`)) {
          delete next[k];
        }
      });
      return next;
    });

    if (isAuthenticated && toeicTestId) {
      try {
        await progressApi.resetProgress({
          toeicTestId,
          partNumber
        });
      } catch (e) {
        console.error("Lỗi reset tiến độ:", e);
      }
    }
  };

  const isConfident = (partNumber, questionNumber) => {
    return progressMap[`${partNumber}_${questionNumber}`]?.isConfident ?? null;
  };

  const isRevealed = (partNumber, questionNumber) => {
    return !!progressMap[`${partNumber}_${questionNumber}`]?.isRevealed;
  };

  const getSelectedAnswer = (partNumber, questionNumber) => {
    return progressMap[`${partNumber}_${questionNumber}`]?.selectedAnswer;
  };

  const getProgressPercentage = (totalQuestions) => {
    if (!totalQuestions) return 0;
    const confidentCount = Object.values(progressMap).filter(v => v.isConfident === true).length;
    return Math.round((confidentCount / totalQuestions) * 100);
  };

  return {
    loading,
    progressMap,
    markConfident,
    markRevealed,
    selectAnswer,
    resetPart,
    isConfident,
    isRevealed,
    getSelectedAnswer,
    getProgressPercentage,
    reloadProgress: loadProgress
  };
}
