import { useState, useEffect } from 'react';

export default function useStudyState(testId, partId) {
  const revealedKey = `revealed_${testId}_${partId}`;
  const answersKey = `answers_${testId}_${partId}`;

  // Trạng thái lật thẻ
  const [revealed, setRevealedState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(revealedKey)) || {};
    } catch { return {}; }
  });

  // Trạng thái đáp án đã chọn (dùng cho Part 5)
  const [selectedAnswers, setSelectedAnswersState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(answersKey)) || {};
    } catch { return {}; }
  });

  const setRevealed = (newRevealed) => {
    // Cho phép truyền function như setState thông thường
    const valueToStore = typeof newRevealed === 'function' ? newRevealed(revealed) : newRevealed;
    setRevealedState(valueToStore);
    localStorage.setItem(revealedKey, JSON.stringify(valueToStore));
  };

  const setSelectedAnswers = (newAnswers) => {
    const valueToStore = typeof newAnswers === 'function' ? newAnswers(selectedAnswers) : newAnswers;
    setSelectedAnswersState(valueToStore);
    localStorage.setItem(answersKey, JSON.stringify(valueToStore));
  };

  const resetStudyState = () => {
    setRevealedState({});
    setSelectedAnswersState({});
    localStorage.removeItem(revealedKey);
    localStorage.removeItem(answersKey);
  };

  return { 
    revealed, setRevealed, 
    selectedAnswers, setSelectedAnswers, 
    resetStudyState 
  };
}
