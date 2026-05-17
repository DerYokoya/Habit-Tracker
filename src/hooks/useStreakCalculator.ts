import { useMemo } from 'react';
import { Habit, HabitStats } from '../types';
import { subDays, format, startOfDay } from 'date-fns';

export const useStreakCalculator = (habits: Habit[]) => {
  const calculateStreakForHabit = (habit: Habit): HabitStats => {
    const today = startOfDay(new Date());
    const completions = habit.completions;

    // Count total completions
    const totalCompletions = Object.values(completions).filter(Boolean).length;

    // Current streak: walk backwards from today (or yesterday if today not done)
    let currentStreak = 0;
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    // Start from today if completed, otherwise from yesterday (grace for habits done yesterday)
    const startFrom = completions[todayStr] ? 0 : completions[yesterdayStr] ? 1 : null;

    if (startFrom !== null) {
      let i = startFrom;
      while (true) {
        const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
        if (completions[dateStr]) {
          currentStreak++;
          i++;
        } else {
          break;
        }
      }
    }

    // Longest streak: walk all completion dates sorted ascending
    const sortedDates = Object.keys(completions)
      .filter(k => completions[k])
      .sort();

    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak, totalCompletions };
  };

  const habitStats = useMemo(() => {
    const stats: Record<string, HabitStats> = {};
    habits.forEach(habit => {
      stats[habit.id] = calculateStreakForHabit(habit);
    });
    return stats;
  }, [habits]);

  return { habitStats, calculateStreakForHabit };
};