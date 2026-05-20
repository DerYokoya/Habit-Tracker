import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateCurrentStreak, 
  calculateLongestStreak, 
  generateMockCompletions,
  HabitCompletions 
} from '../streakUtils';
import { format, subDays } from 'date-fns';

describe('calculateCurrentStreak', () => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const twoDaysAgoStr = format(subDays(today, 2), 'yyyy-MM-dd');
  const threeDaysAgoStr = format(subDays(today, 3), 'yyyy-MM-dd');
  const fourDaysAgoStr = format(subDays(today, 4), 'yyyy-MM-dd');

  it('returns 0 for no completions', () => {
    const completions: HabitCompletions = {};
    expect(calculateCurrentStreak(completions)).toBe(0);
  });

  it('returns 1 for only today completed', () => {
    const completions = generateMockCompletions([todayStr]);
    expect(calculateCurrentStreak(completions)).toBe(1);
  });

  it('returns 5 for five consecutive days', () => {
    const completions = generateMockCompletions([
      todayStr,
      yesterdayStr,
      twoDaysAgoStr,
      threeDaysAgoStr,
      fourDaysAgoStr,
    ]);
    expect(calculateCurrentStreak(completions)).toBe(5);
  });

  it('returns 0 if yesterday completed but not today', () => {
    const completions = generateMockCompletions([yesterdayStr, twoDaysAgoStr]);
    expect(calculateCurrentStreak(completions)).toBe(0);
  });

  it('handles gaps in current streak correctly', () => {
    const completions = generateMockCompletions([
      todayStr,
      yesterdayStr,
      twoDaysAgoStr, // gap here
      format(subDays(today, 4), 'yyyy-MM-dd'),
    ]);
    expect(calculateCurrentStreak(completions)).toBe(3);
  });
});

describe('calculateLongestStreak', () => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const twoDaysAgoStr = format(subDays(today, 2), 'yyyy-MM-dd');
  const threeDaysAgoStr = format(subDays(today, 3), 'yyyy-MM-dd');
  const fourDaysAgoStr = format(subDays(today, 4), 'yyyy-MM-dd');
  const sixDaysAgoStr = format(subDays(today, 6), 'yyyy-MM-dd');
  const sevenDaysAgoStr = format(subDays(today, 7), 'yyyy-MM-dd');

  it('returns 0 for no completions', () => {
    const completions: HabitCompletions = {};
    expect(calculateLongestStreak(completions)).toBe(0);
  });

  it('returns 1 for single completion', () => {
    const completions = generateMockCompletions([todayStr]);
    expect(calculateLongestStreak(completions)).toBe(1);
  });

  it('returns 5 for five consecutive days', () => {
    const completions = generateMockCompletions([
      todayStr,
      yesterdayStr,
      twoDaysAgoStr,
      threeDaysAgoStr,
      fourDaysAgoStr,
    ]);
    expect(calculateLongestStreak(completions)).toBe(5);
  });

  it('handles multiple streaks and returns longest', () => {
    // Streak of 3, then gap, then streak of 5
    const completions = generateMockCompletions([
      todayStr,
      yesterdayStr,
      twoDaysAgoStr,
      threeDaysAgoStr,
      fourDaysAgoStr, // 5-day streak
      sixDaysAgoStr,
      sevenDaysAgoStr, // gap, then 2-day streak
    ]);
    expect(calculateLongestStreak(completions)).toBe(5);
  });

  it('handles non-consecutive dates with gaps', () => {
    const completions = generateMockCompletions([
      todayStr,
      twoDaysAgoStr, // gap
      fourDaysAgoStr,
    ]);
    expect(calculateLongestStreak(completions)).toBe(1);
  });

  it('handles unsorted dates', () => {
    const completions = generateMockCompletions([
      twoDaysAgoStr,
      todayStr,
      yesterdayStr,
    ]);
    expect(calculateLongestStreak(completions)).toBe(3);
  });
});