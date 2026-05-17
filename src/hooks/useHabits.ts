import { useState, useMemo } from 'react';
import useStorage from './useStorage';
import { getDateKey } from '../utils/dateUtils';
import { calculateHabitStats, getOverallStats } from '../utils/statsUtils';

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

interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

interface OverallStats {
  totalHabits: number;
  totalCompletions: number;
  activeToday: number;
}

interface UseHabitsReturn {
  habits: Habit[];
  completions: Completions;
  stats: Record<string, HabitStats>;
  overall: OverallStats;
  selectedHabitId: string | null;
  setSelectedHabitId: (id: string | null) => void;
  toggleHabit: (habitId: string, date: Date) => void;
  addHabit: (name: string) => void;
  deleteHabit: (habitId: string) => void;
  reorderHabits: (sourceIndex: number, destinationIndex: number) => void;
}

const useHabits = (): UseHabitsReturn => {
  const { habits, setHabits, completions, setCompletions } = useStorage();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const stats = useMemo(
    () => calculateHabitStats(habits, completions),
    [habits, completions]
  );

  const overall = useMemo(
    () => getOverallStats(habits, completions),
    [habits, completions]
  );

  const toggleHabit = (habitId: string, date: Date): void => {
    const dateKey = getDateKey(date);
    setCompletions((prev: Completions) => {
      const existing = prev[habitId] || {};
      const updated = { ...existing };
      if (updated[dateKey]) {
        delete updated[dateKey];
      } else {
        updated[dateKey] = true;
      }
      return { ...prev, [habitId]: updated };
    });
  };

  const addHabit = (name: string): void => {
    if (!name.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: name.trim(),
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      order: habits.length,
    };
    setHabits((prev: Habit[]) => [...prev, newHabit]);
  };

  const deleteHabit = (habitId: string): void => {
    if (!window.confirm('Delete this habit? All progress will be lost.')) return;
    setHabits((prev: Habit[]) => prev.filter((h) => h.id !== habitId));
    setCompletions((prev: Completions) => {
      const next = { ...prev };
      delete next[habitId];
      return next;
    });
  };

  const reorderHabits = (sourceIndex: number, destinationIndex: number): void => {
    const items = Array.from(habits);
    const [moved] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, moved);
    setHabits(items.map((item, index) => ({ ...item, order: index })));
  };

  return {
    habits,
    completions,
    stats,
    overall,
    selectedHabitId,
    setSelectedHabitId,
    toggleHabit,
    addHabit,
    deleteHabit,
    reorderHabits,
  };
};

export default useHabits;