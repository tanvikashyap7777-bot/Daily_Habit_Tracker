import { Habit, CheckInRecord, HabitStats, DayActivity, HabitCategory } from '../types';
import { formatDateKey, subDays, calculateStreaks, parseDateKey, getTodayKey } from './dateUtils';

export interface CategoryStat {
  category: HabitCategory;
  label: string;
  totalHabits: number;
  totalCompletionsLast30d: number;
  rateLast30d: number;
  color: string;
}

export const CATEGORY_META: Record<HabitCategory, { label: string; color: string; badgeBg: string; textColor: string }> = {
  health: { label: 'Health', color: '#0284c7', badgeBg: 'bg-sky-50', textColor: 'text-sky-700' },
  mind: { label: 'Mind', color: '#6366f1', badgeBg: 'bg-indigo-50', textColor: 'text-indigo-700' },
  fitness: { label: 'Fitness', color: '#1d4ed8', badgeBg: 'bg-blue-50', textColor: 'text-blue-700' },
  productivity: { label: 'Productivity', color: '#2563eb', badgeBg: 'bg-blue-50', textColor: 'text-blue-700' },
  learning: { label: 'Learning', color: '#0891b2', badgeBg: 'bg-cyan-50', textColor: 'text-cyan-700' },
  routine: { label: 'Routine', color: '#4338ca', badgeBg: 'bg-indigo-50', textColor: 'text-indigo-700' },
};

/**
 * Builds a fast lookup map: `${habitId}_${date}` -> boolean
 */
export function buildCheckInMap(records: CheckInRecord[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const r of records) {
    if (r.completed) {
      map.set(`${r.habitId}_${r.date}`, true);
    }
  }
  return map;
}

/**
 * Calculate per-habit stats
 */
export function computeHabitStats(
  habit: Habit,
  checkInMap: Map<string, boolean>,
  todayKey: string = getTodayKey()
): HabitStats {
  const completedDates = new Set<string>();
  const historyMap: Record<string, boolean> = {};

  // Check last 90 days for streaks and history
  const today = parseDateKey(todayKey);
  for (let i = 0; i < 90; i++) {
    const d = subDays(today, i);
    const dateStr = formatDateKey(d);
    const isDone = Boolean(checkInMap.get(`${habit.id}_${dateStr}`));
    if (isDone) {
      completedDates.add(dateStr);
    }
    historyMap[dateStr] = isDone;
  }

  const { currentStreak, bestStreak } = calculateStreaks(completedDates);

  // 7-day rate
  let count7 = 0;
  for (let i = 0; i < 7; i++) {
    const dStr = formatDateKey(subDays(today, i));
    if (checkInMap.get(`${habit.id}_${dStr}`)) count7++;
  }
  const completionRate7d = Math.round((count7 / 7) * 100);

  // 30-day rate
  let count30 = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = formatDateKey(subDays(today, i));
    if (checkInMap.get(`${habit.id}_${dStr}`)) count30++;
  }
  const completionRate30d = Math.round((count30 / 30) * 100);

  return {
    habitId: habit.id,
    currentStreak,
    bestStreak,
    totalCompletions: completedDates.size,
    completionRate7d,
    completionRate30d,
    historyMap,
  };
}

/**
 * Compute daily activity timeline for heatmaps and charts
 */
export function computeDailyActivities(
  habits: Habit[],
  checkInMap: Map<string, boolean>,
  daysCount: number = 30
): DayActivity[] {
  const activeHabits = habits.filter((h) => !h.archived);
  const totalCount = activeHabits.length;
  const result: DayActivity[] = [];
  const today = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const dateObj = subDays(today, i);
    const dateStr = formatDateKey(dateObj);
    let completed = 0;

    for (const h of activeHabits) {
      if (checkInMap.get(`${h.id}_${dateStr}`)) {
        completed++;
      }
    }

    const rate = totalCount > 0 ? completed / totalCount : 0;
    const dayOfWeek = dateObj.getDay();

    result.push({
      date: dateStr,
      totalHabits: totalCount,
      completedCount: completed,
      rate,
      dayOfWeek,
      formattedDate: dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dayShort: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  return result;
}

/**
 * Compute Category statistics
 */
export function computeCategoryStats(
  habits: Habit[],
  checkInMap: Map<string, boolean>
): CategoryStat[] {
  const activeHabits = habits.filter((h) => !h.archived);
  const categories = Object.keys(CATEGORY_META) as HabitCategory[];
  const today = new Date();

  return categories
    .map((cat) => {
      const catHabits = activeHabits.filter((h) => h.category === cat);
      if (catHabits.length === 0) {
        return null;
      }

      let totalCompletions = 0;
      const totalPossible = catHabits.length * 30;

      for (let i = 0; i < 30; i++) {
        const dStr = formatDateKey(subDays(today, i));
        for (const h of catHabits) {
          if (checkInMap.get(`${h.id}_${dStr}`)) {
            totalCompletions++;
          }
        }
      }

      const rate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

      return {
        category: cat,
        label: CATEGORY_META[cat].label,
        totalHabits: catHabits.length,
        totalCompletionsLast30d: totalCompletions,
        rateLast30d: rate,
        color: CATEGORY_META[cat].color,
      };
    })
    .filter((stat): stat is CategoryStat => stat !== null);
}
