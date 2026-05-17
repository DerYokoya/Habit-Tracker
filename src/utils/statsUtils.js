import { format, subDays } from 'date-fns';
import { getDateKey } from './dateUtils';
import { calculateCurrentStreak, calculateLongestStreak } from './streakUtils';

export const calculateHabitStats = (habits, completions) => {
  const stats = {};

  habits.forEach((habit) => {
    const habitCompletions = completions[habit.id] || {};
    const totalCompletions = Object.keys(habitCompletions).length;

    stats[habit.id] = {
      currentStreak: calculateCurrentStreak(habitCompletions),
      longestStreak: calculateLongestStreak(habitCompletions),
      totalCompletions,
      completionRate: totalCompletions > 0 ? (totalCompletions / 365) * 100 : 0,
    };
  });

  return stats;
};

export const getOverallStats = (habits, completions) => {
  const todayKey = getDateKey(new Date());
  let totalCompletions = 0;
  let activeToday = 0;

  habits.forEach((habit) => {
    const habitCompletions = completions[habit.id] || {};
    totalCompletions += Object.keys(habitCompletions).length;
    if (habitCompletions[todayKey]) activeToday++;
  });

  return { totalHabits: habits.length, totalCompletions, activeToday };
};

export const getChartData = (habitId, completions) => {
  if (!habitId) return [];
  const habitCompletions = completions[habitId] || {};

  return Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'MM/dd'),
      completed: habitCompletions[getDateKey(date)] ? 1 : 0,
    };
  });
};
