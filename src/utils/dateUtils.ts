import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';

type ViewType = 'daily' | 'weekly' | 'monthly';
type NavigationDirection = 'prev' | 'next';

export const getDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

export const getDaysForView = (view: ViewType, currentDate: Date): Date[] => {
  if (view === 'daily') {
    return [currentDate];
  }

  if (view === 'weekly') {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }

  // monthly — padded to full weeks
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfWeek = getDay(start);
  const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const paddedStart = subDays(start, daysToAdd);
  const paddedEnd = addDays(end, 42 - days.length - daysToAdd);
  return eachDayOfInterval({ start: paddedStart, end: paddedEnd });
};

export const navigateDate = (
  view: ViewType, 
  currentDate: Date, 
  direction: NavigationDirection
): Date => {
  const delta = direction === 'prev' ? -1 : 1;
  if (view === 'daily') return delta === -1 ? subDays(currentDate, 1) : addDays(currentDate, 1);
  if (view === 'weekly') return delta === -1 ? subDays(currentDate, 7) : addDays(currentDate, 7);
  return delta === -1 ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
};

export const getViewTitle = (view: ViewType, currentDate: Date): string => {
  if (view === 'daily') return format(currentDate, 'EEEE, MMMM d, yyyy');
  if (view === 'weekly') {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  return format(currentDate, 'MMMM yyyy');
};