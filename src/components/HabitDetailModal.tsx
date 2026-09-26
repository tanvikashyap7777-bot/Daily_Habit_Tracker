import React from 'react';
import { Habit } from '../types';
import { computeHabitStats, CATEGORY_META } from '../utils/statsCalculator';
import { HabitIcon } from './HabitIcon';
import {
  X,
  Flame,
  Trophy,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Target,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateKey, subDays, formatTime12h } from '../utils/dateUtils';

interface HabitDetailModalProps {
  habit: Habit | null;
  checkInMap: Map<string, boolean>;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleDate: (habitId: string, dateStr: string) => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  checkInMap,
  onClose,
  onEdit,
  onDelete,
  onToggleDate,
}) => {
  if (!habit) return null;

  const stats = computeHabitStats(habit, checkInMap);
  const meta = CATEGORY_META[habit.category] || CATEGORY_META.routine;

  // Render past 35 days calendar grid for this habit
  const calendarDays = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = formatDateKey(d);
    const isDone = Boolean(checkInMap.get(`${habit.id}_${dateStr}`));
    const isToday = i === 0;

    calendarDays.push({
      dateStr,
      dayNum: d.getDate(),
      dayShort: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isDone,
      isToday,
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/40 backdrop-blur-xs">
        <motion.div
          id={`habit-detail-modal-${habit.id}`}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
              >
                <HabitIcon name={habit.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">{habit.title}</h2>
                  <span
                    className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badgeBg} ${meta.textColor}`}
                  >
                    {meta.label}
                  </span>
                  {habit.reminderEnabled && habit.reminderTime && (
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Bell className="w-2.5 h-2.5" />
                      {formatTime12h(habit.reminderTime)}
                    </span>
                  )}
                </div>
                {habit.description && (
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1">{habit.description}</p>
                )}
              </div>
            </div>

            <button
              id="close-habit-detail-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-95 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center text-orange-600 mb-1">
                  <Flame className="w-4 h-4 fill-orange-500/20" />
                </div>
                <div className="text-xl font-bold text-stone-900">{stats.currentStreak}d</div>
                <div className="text-[11px] font-medium text-stone-500">Current Streak</div>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center text-amber-600 mb-1">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-stone-900">{stats.bestStreak}d</div>
                <div className="text-[11px] font-medium text-stone-500">Best Streak</div>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center text-blue-600 mb-1">
                  <Target className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-stone-900">{stats.completionRate30d}%</div>
                <div className="text-[11px] font-medium text-stone-500">30-Day Rate</div>
              </div>
            </div>

            {/* 35-Day Visual Check-in Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                  <Calendar className="w-4 h-4 text-stone-500" />
                  <span>Past 35 Days Activity</span>
                </div>
                <span className="text-[11px] text-stone-500">
                  {stats.totalCompletions} total completions
                </span>
              </div>

              <p className="text-[11px] text-stone-500">
                Click any day cell to toggle completion for that date:
              </p>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 bg-stone-50 p-2.5 sm:p-3 rounded-xl border border-stone-200/70">
                {calendarDays.map((d) => (
                  <button
                    key={d.dateStr}
                    id={`detail-day-${habit.id}-${d.dateStr}`}
                    onClick={() => onToggleDate(habit.id, d.dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all active:scale-90 ${
                      d.isDone
                        ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    } ${d.isToday ? 'ring-2 ring-stone-900' : ''}`}
                    title={`${d.dateStr}: ${d.isDone ? 'Completed' : 'Not completed'}`}
                  >
                    <span>{d.dayNum}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency Target & Reminder row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
              <div className="flex items-center justify-between bg-stone-50 p-2.5 sm:p-3 rounded-lg border border-stone-200/60">
                <span>Goal Frequency</span>
                <span className="font-semibold text-stone-900">
                  {habit.targetDaysPerWeek} days / week
                </span>
              </div>

              <div className="flex items-center justify-between bg-stone-50 p-2.5 sm:p-3 rounded-lg border border-stone-200/60">
                <span className="flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-stone-500" /> Daily Reminder
                </span>
                <span className="font-semibold text-stone-900 font-mono">
                  {habit.reminderEnabled && habit.reminderTime ? formatTime12h(habit.reminderTime) : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between p-3.5 sm:px-6 sm:py-4 border-t border-stone-100 bg-stone-50/50 shrink-0 pb-safe">
            <button
              id="delete-habit-btn"
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${habit.title}"?`)) {
                  onDelete(habit.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                id="edit-habit-btn"
                onClick={() => {
                  onClose();
                  onEdit(habit);
                }}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                id="done-habit-detail-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-colors active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
