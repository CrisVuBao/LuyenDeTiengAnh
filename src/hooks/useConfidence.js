import { useState, useEffect } from 'react';

export default function useConfidence(testId) {
  const [confidenceData, setConfidenceData] = useState({});

  useEffect(() => {
    const localData = localStorage.getItem(`confidence_${testId}`);
    if (localData) {
      try {
        setConfidenceData(JSON.parse(localData));
      } catch (e) {
        console.error("Lỗi parse confidence data", e);
      }
    }
  }, [testId]);

  const markConfident = (questionId, isConfident) => {
    const newData = { ...confidenceData, [questionId]: isConfident };
    setConfidenceData(newData);
    localStorage.setItem(`confidence_${testId}`, JSON.stringify(newData));
  };

  const getProgress = () => {
    const totalMarked = Object.keys(confidenceData).length;
    if (totalMarked === 0) return 0;
    const confidentCount = Object.values(confidenceData).filter(v => v).length;
    return Math.round((confidentCount / totalMarked) * 100);
  };

  const isConfident = (questionId) => {
    return !!confidenceData[questionId];
  };

  return { confidenceData, markConfident, getProgress, isConfident };
}
