import { useState, useEffect } from 'react';

export function useWrongAnswers() {
  const [wrongAnswers, setWrongAnswers] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('toeic_wrong_answers');
    if (saved) {
      setWrongAnswers(JSON.parse(saved));
    }
  }, []);

  const addWrongAnswer = (questionId, part) => {
    setWrongAnswers(prev => {
      const exists = prev.find(item => item.id === questionId);
      if (exists) return prev;
      
      const newWrong = [...prev, { id: questionId, part, date: new Date().toISOString() }];
      localStorage.setItem('toeic_wrong_answers', JSON.stringify(newWrong));
      return newWrong;
    });
  };

  return { wrongAnswers, addWrongAnswer };
}
