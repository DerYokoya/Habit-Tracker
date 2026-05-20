import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStreakCalculator } from '../useStreakCalculator';
import { format, subDays } from 'date-fns';

// Mock date-fns to have consistent dates in tests
const mockToday = new Date(2024, 0, 15); // Jan 15, 2024
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    startOfDay: () => mockToday,
    subDays: (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() - days);
      return result;
    },
  };
});

describe('useStreakCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero streak for habit with no completions', () => {
    const habit = {
      id: '1',
      name: 'Test Habit',
      color: '#6366f1',
      completions: {},
    };
    const { result } = renderHook(() => useStreakCalculator([habit]));
    expect(result.current.habitStats['1']).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
    });
  });

  it('calculates streak correctly for 5 consecutive days', () => {
    const todayStr = format(mockToday, 'yyyy-MM-dd');
    const completions: Record<string, boolean> = {};
    for (let i = 0; i < 5; i++) {
      const date = subDays(mockToday, i);
      completions[format(date, 'yyyy-MM-dd')] = true;
    }

    const habit = {
      id: '1',
      name: 'Test Habit',
      color: '#6366f1',
      completions,
    };
    const { result } = renderHook(() => useStreakCalculator([habit]));
    expect(result.current.habitStats['1'].currentStreak).toBe(5);
    expect(result.current.habitStats['1'].longestStreak).toBe(5);
    expect(result.current.habitStats['1'].totalCompletions).toBe(5);
  });

  it('handles gap in completions correctly', () => {
    const completions: Record<string, boolean> = {};
    // Today completed
    completions[format(mockToday, 'yyyy-MM-dd')] = true;
    // Yesterday NOT completed
    // Day before yesterday completed (gap)
    const twoDaysAgo = subDays(mockToday, 2);
    completions[format(twoDaysAgo, 'yyyy-MM-dd')] = true;

    const habit = {
      id: '1',
      name: 'Test Habit',
      color: '#6366f1',
      completions,
    };
    const { result } = renderHook(() => useStreakCalculator([habit]));
    // Current streak should be 1 (only today)
    expect(result.current.habitStats['1'].currentStreak).toBe(1);
  });

  it('calculates longest streak correctly across multiple streaks', () => {
    const completions: Record<string, boolean> = {};
    // Streak of 3 (days 0,1,2)
    for (let i = 0; i < 3; i++) {
      const date = subDays(mockToday, i);
      completions[format(date, 'yyyy-MM-dd')] = true;
    }
    // Gap at day 3
    // Streak of 2 (days 4,5)
    for (let i = 4; i < 6; i++) {
      const date = subDays(mockToday, i);
      completions[format(date, 'yyyy-MM-dd')] = true;
    }

    const habit = {
      id: '1',
      name: 'Test Habit',
      color: '#6366f1',
      completions,
    };
    const { result } = renderHook(() => useStreakCalculator([habit]));
    expect(result.current.habitStats['1'].longestStreak).toBe(3);
  });
});