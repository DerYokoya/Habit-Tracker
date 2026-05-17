export interface Habit {
  id: string;
  name: string;
  color: string;
}

export interface HabitCompletions {
  [dateKey: string]: boolean;
}

export interface Completions {
  [habitId: string]: HabitCompletions;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

export interface OverallStats {
  totalHabits: number;
  totalCompletions: number;
  activeToday: number;
}

export interface ChartDataPoint {
  date: string;
  completed: number;
}