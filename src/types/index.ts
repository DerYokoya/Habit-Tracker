export interface Habit {
  id: string;
  name: string;
  color: string;
  completions: Record<string, boolean>;
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