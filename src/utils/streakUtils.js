import { subDays } from 'date-fns';
import { getDateKey } from './dateUtils';

export const calculateCurrentStreak = (habitCompletions) => {
  let streak = 0;
  let date = new Date();
  date.setHours(0, 0, 0, 0);

  while (habitCompletions[getDateKey(date)]) {
    streak++;
    date = subDays(date, 1);
  }

  return streak;
};

export const calculateLongestStreak = (habitCompletions) => {
  const dates = Object.keys(habitCompletions).sort();
  let longest = 0;
  let temp = 0;

  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const prev = i > 0 ? new Date(dates[i - 1]) : null;

    if (prev && current - prev === 86400000) {
      temp++;
    } else {
      temp = 1;
    }
    longest = Math.max(longest, temp);
  }

  return longest;
};
