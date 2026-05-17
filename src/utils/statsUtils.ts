import { format, subDays } from 'date-fns';
import { getDateKey } from './dateUtils';
import { calculateCurrentStreak, calculateLongestStreak } from './streakUtils';

// Define types
interface Habit {
  id: string;
  name: string;
  color: string;
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

interface ChartDataPoint {
  date: string;
  completed: number; // 0 or 1
}

export const calculateHabitStats = (
  habits: Habit[], 
  completions: Completions
): Record<string, HabitStats> => {
  const stats: Record<string, HabitStats> = {};

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

export const getOverallStats = (
  habits: Habit[], 
  completions: Completions
): OverallStats => {
  const todayKey = getDateKey(new Date());
  let totalCompletions = 0;
  let activeToday = 0;

  habits.forEach((habit) => {
    const habitCompletions = completions[habit.id] || {};
    totalCompletions += Object.keys(habitCompletions).length;
    if (habitCompletions[todayKey]) activeToday++;
  });

  return { 
    totalHabits: habits.length, 
    totalCompletions, 
    activeToday 
  };
};

export const getChartData = (
  habitId: string | null, 
  completions: Completions
): ChartDataPoint[] => {
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