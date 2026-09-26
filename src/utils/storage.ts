import { Habit, CheckInRecord } from '../types';

const HABITS_STORAGE_KEY = 'daily_habits_tracker_habits_v2';
const CHECKINS_STORAGE_KEY = 'daily_habits_tracker_checkins_v2';

// Clean up previous v1 fake/mock seed keys if present in browser localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('daily_habits_tracker_habits_v1');
    localStorage.removeItem('daily_habits_tracker_checkins_v1');
  }
} catch {
  // Graceful fallback for restricted environments
}

export const INITIAL_HABITS: Habit[] = [];

export function loadHabits(): Habit[] {
  try {
    const data = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load habits from localStorage', err);
    return [];
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to localStorage', err);
  }
}

export function loadCheckIns(): CheckInRecord[] {
  try {
    const data = localStorage.getItem(CHECKINS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load check-ins from localStorage', err);
    return [];
  }
}

export function saveCheckIns(records: CheckInRecord[]): void {
  try {
    localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save check-ins to localStorage', err);
  }
}

export function clearAllData(): { habits: Habit[]; checkIns: CheckInRecord[] } {
  try {
    localStorage.removeItem(HABITS_STORAGE_KEY);
    localStorage.removeItem(CHECKINS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear data from localStorage', err);
  }
  return { habits: [], checkIns: [] };
}

// Retain alias for backward compatibility
export const resetToDefaults = clearAllData;
