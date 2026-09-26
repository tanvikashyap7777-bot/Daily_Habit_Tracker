export type HabitCategory = 'health' | 'mind' | 'fitness' | 'productivity' | 'learning' | 'routine';

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  icon: string;
  color: string;
  targetDaysPerWeek: number;
  createdAt: string; // YYYY-MM-DD
  archived?: boolean;
  reminderTime?: string; // "HH:mm" e.g. "08:30"
  reminderEnabled?: boolean;
}

export interface CheckInRecord {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate7d: number;
  completionRate30d: number;
  historyMap: Record<string, boolean>; // date -> completed
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  totalHabits: number;
  completedCount: number;
  rate: number; // 0 to 1
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  formattedDate: string;
  dayShort: string;
}

export type TimeframeOption = '7d' | '14d' | '30d' | '60d';
