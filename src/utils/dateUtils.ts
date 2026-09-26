/**
 * Date utility helpers for Habit Tracking and Consistency Statistics
 */

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function isSameDay(d1: string, d2: string): boolean {
  return d1 === d2;
}

/**
 * Returns an array of date strings from (today - count + 1) up to today
 */
export function getDateRange(count: number, endDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = subDays(endDate, i);
    dates.push(formatDateKey(d));
  }
  return dates;
}

/**
 * Returns the current week's 7 days (Monday to Sunday)
 */
export function getCurrentWeekDays(referenceDate: Date = new Date()): Array<{ dateStr: string; dayShort: string; dayNum: number; isToday: boolean }> {
  const ref = new Date(referenceDate);
  const dayOfWeek = ref.getDay(); // 0 is Sunday, 1 is Monday...
  // Calculate distance to Monday
  const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDays(ref, distToMonday);

  const days = [];
  const todayStr = getTodayKey();

  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const dateStr = formatDateKey(d);
    const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    days.push({
      dateStr,
      dayShort,
      dayNum,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

/**
 * Format readable date, e.g. "Today", "Yesterday", or "Monday, Sep 17"
 */
export function formatFriendlyDate(dateStr: string): string {
  const todayStr = getTodayKey();
  const yesterdayStr = formatDateKey(subDays(new Date(), 1));

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const d = parseDateKey(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate streaks for a given set of completed date strings
 */
export function calculateStreaks(completedDates: Set<string>): { currentStreak: number; bestStreak: number } {
  if (completedDates.size === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const todayStr = getTodayKey();
  const yesterdayStr = formatDateKey(subDays(new Date(), 1));

  // Determine current streak
  let currentStreak = 0;
  let checkDate = new Date();

  // If today is completed, start counting backwards from today
  // If today is NOT completed, check if yesterday was completed; if so, streak is active ending yesterday
  if (completedDates.has(todayStr)) {
    while (completedDates.has(formatDateKey(checkDate))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  } else if (completedDates.has(yesterdayStr)) {
    checkDate = subDays(checkDate, 1);
    while (completedDates.has(formatDateKey(checkDate))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // Calculate best streak across all history
  const sortedDates = Array.from(completedDates)
    .map((d) => parseDateKey(d).getTime())
    .sort((a, b) => a - b);

  let bestStreak = 0;
  let tempStreak = 0;
  let prevTime: number | null = null;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  for (const time of sortedDates) {
    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diff = Math.round((time - prevTime) / ONE_DAY_MS);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevTime = time;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
  };
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface CalendarDayCell {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  date: Date;
}

/**
 * Returns a 35 or 42 day grid (Monday-aligned) for the given month & year
 */
export function getMonthCalendarDays(year: number, monthIndex: number): CalendarDayCell[] {
  const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
  const lastDay = new Date(year, monthIndex + 1, 0, 12, 0, 0);

  // Day of week: 0 for Sun -> convert to Monday-first (0 = Mon, 6 = Sun)
  const firstDayWeekIndex = (firstDay.getDay() + 6) % 7;
  
  // Start from the preceding Monday
  const startDate = subDays(firstDay, firstDayWeekIndex);

  const todayStr = getTodayKey();
  const cells: CalendarDayCell[] = [];

  // Always generate either 35 or 42 cells depending on trailing space
  let curr = new Date(startDate);
  while (true) {
    const dateStr = formatDateKey(curr);
    const isCurrentMonth = curr.getMonth() === monthIndex;
    const isToday = dateStr === todayStr;
    const dayOfWeek = (curr.getDay() + 6) % 7;

    cells.push({
      dateStr,
      dayNum: curr.getDate(),
      isCurrentMonth,
      isToday,
      dayOfWeek,
      date: new Date(curr),
    });

    curr = addDays(curr, 1);

    // Stop when we've passed the month end and finished the week (or reached at least 35 days)
    if (curr > lastDay && (curr.getDay() + 6) % 7 === 0) {
      if (cells.length >= 35) break;
    }
    if (cells.length >= 42) break;
  }

  return cells;
}

/**
 * Format 24-hour "HH:mm" time string into friendly 12-hour format e.g. "8:30 AM"
 */
export function formatTime12h(time24?: string): string {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m} ${ampm}`;
}

