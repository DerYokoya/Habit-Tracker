import { describe, it, expect } from 'vitest';
import { 
  getDateKey, 
  getDaysForView, 
  navigateDate, 
  getViewTitle 
} from '../dateUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

describe('getDateKey', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(getDateKey(date)).toBe('2024-01-15');
  });
});

describe('getDaysForView', () => {
  const currentDate = new Date(2024, 0, 15); // Jan 15, 2024

  it('returns single day for daily view', () => {
    const days = getDaysForView('daily', currentDate);
    expect(days).toHaveLength(1);
    expect(days[0]).toEqual(currentDate);
  });

  it('returns 7 days for weekly view', () => {
    const days = getDaysForView('weekly', currentDate);
    expect(days).toHaveLength(7);
  });

  it('returns monthly view with padding for full weeks', () => {
    const days = getDaysForView('monthly', currentDate);
    // January 2024 starts on Monday, has 31 days, padded to 5 weeks = 35 days
    expect(days.length).toBeGreaterThanOrEqual(35);
    expect(days.length).toBeLessThanOrEqual(42);
  });
});

describe('navigateDate', () => {
  const currentDate = new Date(2024, 0, 15); // Jan 15, 2024

  it('navigates prev/next for daily view', () => {
    const prev = navigateDate('daily', currentDate, 'prev');
    const next = navigateDate('daily', currentDate, 'next');
    expect(format(prev, 'yyyy-MM-dd')).toBe('2024-01-14');
    expect(format(next, 'yyyy-MM-dd')).toBe('2024-01-16');
  });

  it('navigates prev/next for weekly view', () => {
    const prev = navigateDate('weekly', currentDate, 'prev');
    const next = navigateDate('weekly', currentDate, 'next');
    expect(format(prev, 'yyyy-MM-dd')).toBe('2024-01-08');
    expect(format(next, 'yyyy-MM-dd')).toBe('2024-01-22');
  });

  it('navigates prev/next for monthly view', () => {
    const prev = navigateDate('monthly', currentDate, 'prev');
    const next = navigateDate('monthly', currentDate, 'next');
    expect(format(prev, 'yyyy-MM')).toBe('2023-12');
    expect(format(next, 'yyyy-MM')).toBe('2024-02');
  });
});

describe('getViewTitle', () => {
  const date = new Date(2024, 0, 15);

  it('returns formatted daily title', () => {
    const title = getViewTitle('daily', date);
    expect(title).toContain('Monday');
    expect(title).toContain('January 15, 2024');
  });

  it('returns week range for weekly view', () => {
    const title = getViewTitle('weekly', date);
    expect(title).toMatch(/Jan \d+ - Jan \d+, 2024/);
  });

  it('returns month/year for monthly view', () => {
    const title = getViewTitle('monthly', date);
    expect(title).toBe('January 2024');
  });
});