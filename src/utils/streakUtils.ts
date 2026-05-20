import { subDays, differenceInDays, parseISO } from "date-fns";
import { getDateKey } from "./dateUtils";

export interface HabitCompletions {
  [dateKey: string]: boolean;
}

export const calculateCurrentStreak = (
  habitCompletions: HabitCompletions,
): number => {
  let streak = 0;
  let date = new Date();
  date.setHours(0, 0, 0, 0);

  while (habitCompletions[getDateKey(date)]) {
    streak++;
    date = subDays(date, 1);
  }

  return streak;
};

export const calculateLongestStreak = (
  habitCompletions: HabitCompletions,
): number => {
  const completionDates = Object.keys(habitCompletions)
    .filter((date) => habitCompletions[date])
    .sort();

  if (completionDates.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completionDates.length; i++) {
    const prevDate = parseISO(completionDates[i - 1]);
    const currDate = parseISO(completionDates[i]);
    const diffDays = differenceInDays(currDate, prevDate);

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
};

// New utility function for testing
export const generateMockCompletions = (dates: string[]): HabitCompletions => {
  const completions: HabitCompletions = {};
  dates.forEach((date) => {
    completions[date] = true;
  });
  return completions;
};
