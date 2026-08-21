import { useState, useEffect, useCallback } from 'react';

export default function useConfidence(testId) {
  const [confidenceData, setConfidenceData] = useState({});

  const loadData = useCallback(() => {
    const localData = localStorage.getItem(`confidence_${testId}`);
    if (localData) {
      try {
        setConfidenceData(JSON.parse(localData));
      } catch (e) {
        console.error("Lỗi parse confidence data", e);
      }
    } else {
      setConfidenceData({});
    }
  }, [testId]);

  useEffect(() => {
    loadData();
    
    // Lắng nghe sự kiện để đồng bộ giữa các component
    const handleSync = () => loadData();
    window.addEventListener('confidence_sync', handleSync);
    
    return () => window.removeEventListener('confidence_sync', handleSync);
  }, [loadData]);

  const markConfident = (questionId, isConfidentVal) => {
    const newData = { ...confidenceData };
    
    // Toggle logic: if clicking the same button, remove the selection
    if (newData[questionId] === isConfidentVal) {
      delete newData[questionId];
    } else {
      newData[questionId] = isConfidentVal;
    }
    
    setConfidenceData(newData);
    localStorage.setItem(`confidence_${testId}`, JSON.stringify(newData));
    
    // Phát sự kiện để App.jsx (và các nơi khác) cập nhật Progress Bar ngay lập tức
    window.dispatchEvent(new Event('confidence_sync'));
  };

  // Reset confidence for a test
  const resetConfidence = () => {
    setConfidenceData({});
    localStorage.removeItem(`confidence_${testId}`);
    window.dispatchEvent(new Event('confidence_sync'));
  };

  // Reset confidence for specific questions (used when resetting a specific Part)
  const resetConfidenceForQuestions = (questionIds) => {
    const newData = { ...confidenceData };
    let hasChanges = false;
    
    questionIds.forEach(id => {
      if (newData[id] !== undefined) {
        delete newData[id];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setConfidenceData(newData);
      localStorage.setItem(`confidence_${testId}`, JSON.stringify(newData));
      window.dispatchEvent(new Event('confidence_sync'));
    }
  };

  const getProgress = () => {
    const totalMarked = Object.keys(confidenceData).length;
    if (totalMarked === 0) return 0;
    const confidentCount = Object.values(confidenceData).filter(v => v).length;
    return Math.round((confidentCount / totalMarked) * 100);
  };

  const getProgressOutOfTotal = (totalQuestionsCount) => {
    if (!totalQuestionsCount) return 0;
    const confidentCount = Object.values(confidenceData).filter(v => v === true).length;
    return Math.round((confidentCount / totalQuestionsCount) * 100);
  };

  const isConfident = (questionId) => {
    if (confidenceData[questionId] === undefined) return null;
    return !!confidenceData[questionId];
  };

  return { 
    confidenceData, 
    markConfident, 
    getProgress, 
    getProgressOutOfTotal, 
    isConfident, 
    resetConfidence,
    resetConfidenceForQuestions 
  };
}
