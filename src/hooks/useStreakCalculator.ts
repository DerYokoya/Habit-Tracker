import { useMemo } from 'react';
import { Habit, HabitStats } from '../types';
import { eachDayOfInterval, subDays, format, isBefore, startOfDay } from 'date-fns';

export const useStreakCalculator = (habits: Habit[]) => {
  const calculateStreakForHabit = (habit: Habit): HabitStats => {
    const today = startOfDay(new Date());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCompletions = 0;

    // Get last 365 days of completions
    const dates = eachDayOfInterval({
      start: subDays(today, 365),
      end: today,
    });

    // Sort dates descending for streak calculation
    const sortedDates = [...dates].reverse();

    for (const date of sortedDates) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isCompleted = habit.completions[dateStr] || false;
      
      if (isCompleted) {
        totalCompletions++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        // Check if this is today or consecutive with today
        if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          currentStreak = tempStreak;
        }
      } else {
        // Break streak if not completed and date is before or equal to today
        if (!isBefore(date, today)) {
          tempStreak = 0;
        }
      }
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