import { useState, useEffect } from 'react';
import { loadData, saveData } from '../services/storageService';

const initialHabits = [
  { id: '1', name: 'Morning Meditation', color: '#6366f1', order: 0 },
  { id: '2', name: 'Drink 8 Glasses Water', color: '#10b981', order: 1 },
  { id: '3', name: 'Read 30 mins', color: '#f59e0b', order: 2 },
  { id: '4', name: 'Exercise', color: '#ef4444', order: 3 },
];

const useStorage = () => {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    loadData().then((data) => {
      if (data) {
        setHabits(data.habits || []);
        setCompletions(data.completions || {});
      } else {
        setHabits(initialHabits);
      }
      setLoaded(true);
    });
  }, []);

  // Save whenever habits or completions change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    saveData({ habits, completions });
  }, [habits, completions, loaded]);

  return { habits, setHabits, completions, setCompletions };
};

export default useStorage;
