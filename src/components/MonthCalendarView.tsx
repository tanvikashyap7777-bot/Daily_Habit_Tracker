import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import {
  getMonthCalendarDays,
  MONTH_NAMES,
  getTodayKey,
  formatFriendlyDate,
  formatDateKey,
  formatTime12h,
} from '../utils/dateUtils';
import { CATEGORY_META, computeHabitStats } from '../utils/statsCalculator';
import { HabitIcon } from './HabitIcon';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  Sparkles,
  Flame,
  Info,
  Bell,
  Clock,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface MonthCalendarViewProps {
  habits: Habit[];
  checkInMap: Map<string, boolean>;
  onToggleCheckIn: (habitId: string, dateStr: string) => void;
  onSelectHabit?: (habit: Habit) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  habits,
  checkInMap,
  onToggleCheckIn,
  onSelectHabit,
  selectedDate,
  onSelectDate,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = getTodayKey();

  // Selected view month & year
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[0], 10) : today.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[1], 10) - 1 : today.getMonth();
  });

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  // Generate calendar days for current month/year
  const calendarDays = useMemo(
    () => getMonthCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onSelectDate(todayKey);
  };

  // Monthly stats calculations
  const monthStats = useMemo(() => {
    if (activeHabits.length === 0) {
      return { totalCompletions: 0, perfectDays: 0, rate: 0, daysCount: 0 };
    }

    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let completions = 0;
    let perfectDays = 0;
    let eligibleDays = 0;

    for (const cell of calendarDays) {
      if (!cell.isCurrentMonth) continue;
      eligibleDays++;
      const doneCount = activeHabits.filter((h) =>
        checkInMap.get(`${h.id}_${cell.dateStr}`)
      ).length;

      completions += doneCount;
      if (doneCount === activeHabits.length) {
        perfectDays++;
      }
    }

    const totalPossible = eligibleDays * activeHabits.length;
    const rate = totalPossible > 0 ? Math.round((completions / totalPossible) * 100) : 0;

    return { totalCompletions: completions, perfectDays, rate, daysCount: eligibleDays };
  }, [activeHabits, checkInMap, currentYear, currentMonth, calendarDays]);

  // Selected date statistics
  const selectedDateHabitsDone = useMemo(() => {
    return activeHabits.filter((h) => checkInMap.get(`${h.id}_${selectedDate}`)).length;
  }, [activeHabits, checkInMap, selectedDate]);

  const isSelectedDateAllDone =
    activeHabits.length > 0 && selectedDateHabitsDone === activeHabits.length;

  const handleToggle = (habitId: string, dateStr: string) => {
    const isCurrentlyDone = Boolean(checkInMap.get(`${habitId}_${dateStr}`));
    onToggleCheckIn(habitId, dateStr);

    if (!isCurrentlyDone && selectedDateHabitsDone + 1 === activeHabits.length) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch {
        // Fallback
      }
    }
  };

  return (
    <div id="month-calendar-view" className="space-y-4 sm:space-y-6">
      {/* Calendar Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
        {/* Top Controls: Month/Year title & Prev/Next buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Full month view • Click any date to view and check off habits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleJumpToToday}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 active:scale-95 transition-all mr-1"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              id="calendar-prev-month-btn"
              className="p-1.5 sm:p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors active:scale-95"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              id="calendar-next-month-btn"
              className="p-1.5 sm:p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors active:scale-95"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monthly Summary Statistics Banner */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          <div className="bg-stone-50 rounded-xl p-2.5 sm:p-3 border border-stone-200/60 text-center">
            <div className="text-base sm:text-xl font-extrabold text-stone-900">
              {monthStats.totalCompletions}
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-stone-500 truncate">
              Total Completions
            </div>
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-2.5 sm:p-3 border border-emerald-100 text-center">
            <div className="text-base sm:text-xl font-extrabold text-emerald-800 flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
              <span>{monthStats.perfectDays}</span>
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-emerald-700 truncate">
              Perfect Days
            </div>
          </div>
          <div className="bg-blue-50/70 rounded-xl p-2.5 sm:p-3 border border-blue-100 text-center">
            <div className="text-base sm:text-xl font-extrabold text-blue-800">
              {monthStats.rate}%
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-blue-700 truncate">
              Month Consistency
            </div>
          </div>
        </div>

        {/* Weekday column headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2 border-t border-stone-100 text-center">
          {WEEKDAY_NAMES.map((name, idx) => (
            <div
              key={name}
              className={`text-[10px] sm:text-xs font-bold uppercase py-1 ${
                idx >= 5 ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const habitsDone = activeHabits.filter((h) =>
              checkInMap.get(`${h.id}_${cell.dateStr}`)
            ).length;
            const isAllDone = activeHabits.length > 0 && habitsDone === activeHabits.length;
            const hasPartial = habitsDone > 0 && !isAllDone;

            return (
              <button
                key={cell.dateStr}
                onClick={() => onSelectDate(cell.dateStr)}
                id={`calendar-cell-${cell.dateStr}`}
                className={`min-h-[52px] sm:min-h-[68px] p-1 sm:p-2 rounded-xl flex flex-col justify-between items-center transition-all border text-center active:scale-95 relative ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40 z-10'
                    : isAllDone
                    ? 'bg-emerald-50/80 border-emerald-200 text-stone-900 hover:bg-emerald-100/70'
                    : hasPartial
                    ? 'bg-blue-50/50 border-blue-200/60 text-stone-900 hover:bg-blue-100/50'
                    : cell.isCurrentMonth
                    ? 'bg-stone-50/70 border-stone-200/60 text-stone-700 hover:bg-stone-100'
                    : 'bg-stone-50/30 border-transparent text-stone-300 hover:bg-stone-100/50'
                }`}
              >
                {/* Day Header */}
                <div className="w-full flex items-center justify-between px-0.5">
                  <span
                    className={`text-[11px] sm:text-xs font-bold ${
                      isSelected
                        ? 'text-white'
                        : cell.isToday
                        ? 'text-blue-600 font-extrabold'
                        : cell.isCurrentMonth
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {cell.isToday && (
                    <span
                      className={`text-[8px] sm:text-[9px] font-bold px-1 rounded-sm ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      Today
                    </span>
                  )}
                </div>

                {/* Habit indicator */}
                <div className="w-full flex flex-col items-center gap-0.5 my-auto">
                  {isAllDone ? (
                    <div
                      className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span className="hidden sm:inline">Done</span>
                    </div>
                  ) : hasPartial ? (
                    <div
                      className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100/80 text-blue-800'
                      }`}
                    >
                      {habitsDone}/{activeHabits.length}
                    </div>
                  ) : cell.isCurrentMonth && activeHabits.length > 0 ? (
                    <div className="h-1 w-1 rounded-full bg-stone-300 my-1 opacity-60" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Checklist Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
        {/* Header with Selected Date Title */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Habits for {formatFriendlyDate(selectedDate)}
              </h3>
              {isSelectedDateAllDone && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5" /> All Done!
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedDateHabitsDone} of {activeHabits.length} habits completed for this date
            </p>
          </div>

          <span className="text-xs font-bold text-stone-400 font-mono">
            {selectedDate}
          </span>
        </div>

        {/* Habits Checklist for the selected date */}
        {activeHabits.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-400">
            No habits active. Create your first habit to track progress.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeHabits.map((habit) => {
              const isDone = Boolean(checkInMap.get(`${habit.id}_${selectedDate}`));
              const stats = computeHabitStats(habit, checkInMap);
              const meta = CATEGORY_META[habit.category] || CATEGORY_META.routine;

              return (
                <motion.div
                  key={habit.id}
                  layout
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'border-blue-200/80 bg-blue-50/20'
                      : 'border-stone-200/80 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Toggle check button */}
                    <button
                      onClick={() => handleToggle(habit.id, selectedDate)}
                      id={`calendar-check-${habit.id}-${selectedDate}`}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        isDone
                          ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                          : 'bg-stone-100 border-2 border-stone-300 text-transparent hover:border-blue-600'
                      }`}
                      title={isDone ? 'Mark incomplete' : 'Mark completed'}
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                    </button>

                    {/* Habit icon */}
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                      <HabitIcon name={habit.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* Title and details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isDone ? 'text-stone-900' : 'text-stone-800'
                          }`}
                        >
                          {habit.title}
                        </h4>
                        <span
                          className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badgeBg} ${meta.textColor}`}
                        >
                          {meta.label}
                        </span>
                        {habit.reminderEnabled && habit.reminderTime && (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime12h(habit.reminderTime)}
                          </span>
                        )}
                      </div>
                      {habit.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side streaks badge & details button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200/50">
                      <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
                      <span>{stats.currentStreak}d</span>
                    </div>

                    {onSelectHabit && (
                      <button
                        onClick={() => onSelectHabit(habit)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                        title="View habit statistics"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
