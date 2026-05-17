import { useState, useMemo } from 'react';
import useStorage from './useStorage';
import { getDateKey } from '../utils/dateUtils';
import { calculateHabitStats, getOverallStats } from '../utils/statsUtils';

const useHabits = () => {
  const { habits, setHabits, completions, setCompletions } = useStorage();
  const [selectedHabitId, setSelectedHabitId] = useState(null);

  const stats = useMemo(
    () => calculateHabitStats(habits, completions),
    [habits, completions]
  );

  const overall = useMemo(
    () => getOverallStats(habits, completions),
    [habits, completions]
  );

  const toggleHabit = (habitId, date) => {
    const dateKey = getDateKey(date);
    setCompletions((prev) => {
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

  const addHabit = (name) => {
    if (!name.trim()) return;
    const newHabit = {
      id: Date.now().toString(),
      name: name.trim(),
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      order: habits.length,
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const deleteHabit = (habitId) => {
    if (!window.confirm('Delete this habit? All progress will be lost.')) return;
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCompletions((prev) => {
      const next = { ...prev };
      delete next[habitId];
      return next;
    });
  };

  const reorderHabits = (sourceIndex, destinationIndex) => {
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
