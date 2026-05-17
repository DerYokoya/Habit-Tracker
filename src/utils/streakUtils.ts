import { subDays } from 'date-fns';
import { getDateKey } from './dateUtils';

// Define type for habit completions object
interface HabitCompletions {
  [dateKey: string]: boolean;
}

export const calculateCurrentStreak = (habitCompletions: HabitCompletions): number => {
  let streak = 0;
  let date = new Date();
  date.setHours(0, 0, 0, 0);

  while (habitCompletions[getDateKey(date)]) {
    streak++;
    date = subDays(date, 1);
  }

  return streak;
};

export const calculateLongestStreak = (habitCompletions: HabitCompletions): number => {
  const dates = Object.keys(habitCompletions).sort();
  let longest = 0;
  let temp = 0;

  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const prev = i > 0 ? new Date(dates[i - 1]) : null;

    if (prev && current.getTime() - prev.getTime() === 86400000) {
      temp++;
    } else {
      temp = 1;
    }
    longest = Math.max(longest, temp);
  }

  return longest;
};