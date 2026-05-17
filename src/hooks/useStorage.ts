import { useState, useEffect } from 'react';
import { loadData, saveData } from '../services/storageService';

// Define types
interface Habit {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Completions {
  [habitId: string]: {
    [dateKey: string]: boolean;
  };
}

interface StorageData {
  habits: Habit[];
  completions: Completions;
}

const initialHabits: Habit[] = [
  { id: '1', name: 'Morning Meditation', color: '#6366f1', order: 0 },
  { id: '2', name: 'Drink 8 Glasses Water', color: '#10b981', order: 1 },
  { id: '3', name: 'Read 30 mins', color: '#f59e0b', order: 2 },
  { id: '4', name: 'Exercise', color: '#ef4444', order: 3 },
];

interface UseStorageReturn {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  completions: Completions;
  setCompletions: React.Dispatch<React.SetStateAction<Completions>>;
}

// You need to actually define the useStorage function
const useStorage = (): UseStorageReturn => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const [loaded, setLoaded] = useState<boolean>(false);

  // Load on mount
  useEffect(() => {
    loadData().then((data: StorageData | null) => {
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