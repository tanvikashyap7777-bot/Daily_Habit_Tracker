import React, { useState } from 'react';
import { Habit, HabitCategory } from '../types';
import { getCurrentWeekDays, formatFriendlyDate, getTodayKey, formatDateKey, addDays, subDays, formatTime12h } from '../utils/dateUtils';
import { CATEGORY_META, computeHabitStats } from '../utils/statsCalculator';
import { HabitIcon } from './HabitIcon';
import { MonthCalendarView } from './MonthCalendarView';
import {
  Check,
  Plus,
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface DailyHabitTrackerProps {
  habits: Habit[];
  checkInMap: Map<string, boolean>;
  onToggleCheckIn: (habitId: string, dateStr: string) => void;
  onOpenAddModal: () => void;
  onSelectHabit: (habit: Habit) => void;
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({
  habits,
  checkInMap,
  onToggleCheckIn,
  onOpenAddModal,
  onSelectHabit,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'calendar'>('week');

  const todayKey = getTodayKey();
  const weekDays = getCurrentWeekDays(referenceDate);

  // Navigate week
  const handlePrevWeek = () => {
    setReferenceDate((prev) => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setReferenceDate((prev) => addDays(prev, 7));
  };

  const handleResetToToday = () => {
    setReferenceDate(new Date());
    setSelectedDate(todayKey);
  };

  // Filter habits
  const activeHabits = habits.filter((h) => !h.archived);
  const filteredHabits = activeHabits.filter((h) => {
    const matchesCat = selectedCategory === 'all' || h.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate stats for selected date
  const completedForDate = activeHabits.filter((h) => checkInMap.get(`${h.id}_${selectedDate}`)).length;
  const isAllDone = activeHabits.length > 0 && completedForDate === activeHabits.length;

  const handleToggle = (habitId: string, dateStr: string) => {
    const isCurrentlyDone = Boolean(checkInMap.get(`${habitId}_${dateStr}`));
    onToggleCheckIn(habitId, dateStr);

    // If this action completes all habits for this date, trigger celebratory confetti!
    if (!isCurrentlyDone && completedForDate + 1 === activeHabits.length) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#3b82f6', '#60a5fa', '#0ea5e9', '#38bdf8'],
        });
      } catch {
        // Fallback gracefully if canvas-confetti is not available
      }
    }
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Habits' },
    { id: 'health', label: 'Health' },
    { id: 'mind', label: 'Mind' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'learning', label: 'Learning' },
    { id: 'routine', label: 'Routine' },
  ];

  if (viewMode === 'calendar') {
    return (
      <div className="space-y-4">
        {/* View Switcher Banner */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Week View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-xs transition-all"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month Calendar</span>
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </button>
        </div>

        {/* Full Month Calendar View */}
        <MonthCalendarView
          habits={habits}
          checkInMap={checkInMap}
          onToggleCheckIn={handleToggle}
          onSelectHabit={onSelectHabit}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    );
  }

  return (
    <div id="daily-habit-tracker-section" className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4 sm:space-y-6">
      {/* Top Header: Title & Actions */}
      <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-stone-100 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 truncate">Daily Habit Check-in</h2>
            {isAllDone && (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                <Sparkles className="w-3.5 h-3.5" /> All Done!
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 hidden sm:block">
            Log today's repetitions or click any day to backfill consistent records
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle pill */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-600 shadow-xs"
              title="7-day horizontal strip"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Week</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900"
              title="Full interactive monthly calendar"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            id="add-habit-btn"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span><span className="hidden sm:inline">New </span>Habit</span>
          </button>
        </div>
      </div>

      {/* Week Date Picker Strip */}
      <div id="week-date-navigator" className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-stone-900">
              {formatFriendlyDate(selectedDate)}
            </span>
            <span className="text-[11px] sm:text-xs text-stone-500">
              ({completedForDate}/{activeHabits.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {selectedDate !== todayKey && (
              <button
                id="reset-today-btn"
                onClick={handleResetToToday}
                className="text-[11px] sm:text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-100 mr-0.5 active:scale-95"
              >
                Today
              </button>
            )}
            <button
              id="prev-week-btn"
              onClick={handlePrevWeek}
              className="p-1 sm:p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors active:scale-95"
              title="Previous Week"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              id="next-week-btn"
              onClick={handleNextWeek}
              className="p-1 sm:p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors active:scale-95"
              title="Next Week"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* 7-day pill strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const completedCount = activeHabits.filter((h) => checkInMap.get(`${h.id}_${day.dateStr}`)).length;
            const isDayComplete = activeHabits.length > 0 && completedCount === activeHabits.length;

            return (
              <button
                key={day.dateStr}
                id={`date-pill-${day.dateStr}`}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex flex-col items-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-xl transition-all border text-center active:scale-95 select-none ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/25'
                    : isDayComplete
                    ? 'bg-blue-50/80 border-blue-200/80 text-blue-950 hover:bg-blue-100/80'
                    : 'bg-stone-50 border-stone-200/60 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span
                  className={`text-[10px] sm:text-[11px] font-medium uppercase ${
                    isSelected ? 'text-blue-100' : 'text-stone-400'
                  }`}
                >
                  {day.dayShort}
                </span>
                <span
                  className={`text-sm sm:text-base font-bold my-0.5 ${
                    isSelected ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {day.dayNum}
                </span>
                {/* Status dot or indicator */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  {isDayComplete ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-blue-200' : 'bg-blue-600'
                      }`}
                    />
                  ) : completedCount > 0 ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-blue-200' : 'bg-stone-400'
                      }`}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Category Pills with smooth horizontal scrolling */}
        <div id="category-filter-strip" className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`filter-cat-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="habit-search-input"
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:bg-white text-stone-800 placeholder-stone-400"
          />
        </div>
      </div>

      {/* Habit List */}
      <div id="habits-list-container" className="space-y-2.5 pt-1">
        {filteredHabits.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-stone-200 rounded-xl">
            <p className="text-sm font-semibold text-stone-700">No habits found</p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `No habits match "${searchQuery}". Try a different search term.`
                : 'Get started by creating your first daily habit.'}
            </p>
            <button
              id="empty-add-habit-btn"
              onClick={onOpenAddModal}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-colors active:scale-95"
            >
              Add First Habit
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isCompletedForSelectedDate = Boolean(
              checkInMap.get(`${habit.id}_${selectedDate}`)
            );
            const stats = computeHabitStats(habit, checkInMap);
            const meta = CATEGORY_META[habit.category] || CATEGORY_META.routine;

            return (
              <motion.div
                key={habit.id}
                id={`habit-card-${habit.id}`}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border transition-all p-3 sm:p-4 ${
                  isCompletedForSelectedDate
                    ? 'border-blue-200/80 bg-blue-50/20'
                    : 'border-stone-200/80 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5 sm:gap-4">
                  {/* Left Habit Identity & Action Checkbox */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                    {/* Big primary check toggle for currently selected date */}
                    <button
                      id={`checkin-toggle-${habit.id}-${selectedDate}`}
                      onClick={() => handleToggle(habit.id, selectedDate)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        isCompletedForSelectedDate
                          ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700 shadow-blue-500/25'
                          : 'bg-stone-100 border-2 border-stone-300 text-transparent hover:border-blue-600 hover:text-blue-600/40'
                      }`}
                      title={
                        isCompletedForSelectedDate
                          ? 'Mark incomplete'
                          : `Complete for ${formatFriendlyDate(selectedDate)}`
                      }
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                    </button>

                    {/* Icon */}
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                      <HabitIcon name={habit.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* Titles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isCompletedForSelectedDate
                              ? 'text-stone-900'
                              : 'text-stone-800'
                          }`}
                        >
                          {habit.title}
                        </h3>
                        <span
                          className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${meta.badgeBg} ${meta.textColor}`}
                        >
                          {meta.label}
                        </span>
                        {habit.reminderEnabled && habit.reminderTime && (
                          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60 shrink-0">
                            <Clock className="w-2.5 h-2.5 text-blue-600" />
                            {formatTime12h(habit.reminderTime)}
                          </span>
                        )}
                      </div>
                      {habit.description && (
                        <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1 mt-0.5">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Streaks + Mini 7-day strip + Details button */}
                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {/* Streak Badge */}
                    <div
                      title={`Active Streak: ${stats.currentStreak} days`}
                      className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200/50"
                    >
                      <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500/20" />
                      <span>{stats.currentStreak}d</span>
                    </div>

                    {/* Mini 7-day Quick-toggle Row on the Card itself (large screen only) */}
                    <div className="hidden lg:flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200/50">
                      {weekDays.map((day) => {
                        const isDayDone = Boolean(checkInMap.get(`${habit.id}_${day.dateStr}`));
                        const isToday = day.dateStr === todayKey;

                        return (
                          <button
                            key={day.dateStr}
                            id={`quick-check-${habit.id}-${day.dateStr}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(habit.id, day.dateStr);
                            }}
                            title={`${day.dayShort}, ${day.dayNum}: ${
                              isDayDone ? 'Completed (Click to uncheck)' : 'Click to check off'
                            }`}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors ${
                              isDayDone
                                ? 'bg-blue-600 text-white'
                                : 'text-stone-400 hover:bg-stone-200/70 hover:text-stone-700'
                            } ${isToday ? 'ring-1 ring-stone-900' : ''}`}
                          >
                            {isDayDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : day.dayShort[0]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Inspect Details Button */}
                    <button
                      id={`inspect-habit-btn-${habit.id}`}
                      onClick={() => onSelectHabit(habit)}
                      className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 active:bg-stone-200 transition-colors"
                      title="View habit statistics & history"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
