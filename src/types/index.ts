export interface Habit {
  id: string;
  name: string;
  color: string;
  completions: Record<string, boolean>;
  category?: string;
  tags?: string[];
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

export type ViewType = 'daily' | 'weekly' | 'monthly';

export interface StorageData {
  habits: Habit[];
}

export interface DailyCompletion {
  date: string;
  completed: number;
  total: number;
}

export const DEFAULT_CATEGORIES = [
  'Health',
  'Fitness',
  'Mindfulness',
  'Learning',
  'Productivity',
  'Social',
  'Finance',
  'Creativity',
  'Other',
] as const;
