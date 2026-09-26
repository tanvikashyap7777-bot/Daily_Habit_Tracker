import React from 'react';
import { Habit } from '../types';
import { computeHabitStats, CATEGORY_META } from '../utils/statsCalculator';
import { HabitIcon } from './HabitIcon';
import { Flame, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HabitPerformanceListProps {
  habits: Habit[];
  checkInMap: Map<string, boolean>;
  onSelectHabit: (habit: Habit) => void;
  selectedHabitId?: string | null;
}

export const HabitPerformanceList: React.FC<HabitPerformanceListProps> = ({
  habits,
  checkInMap,
  onSelectHabit,
  selectedHabitId,
}) => {
  const activeHabits = habits.filter((h) => !h.archived);

  return (
    <div id="habit-performance-card" className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-stone-200/80 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">Habit Consistency Breakdown</h2>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
            Individual 30-day performance and streak records
          </p>
        </div>
        <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 shrink-0">
          {activeHabits.length} Active
        </span>
      </div>

      <div className="space-y-2.5">
        {activeHabits.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-stone-200 rounded-xl">
            <p className="text-xs sm:text-sm font-medium text-stone-500">
              No habit statistics available yet. Add your habits to start tracking consistency.
            </p>
          </div>
        ) : (
          activeHabits.map((habit) => {
            const stats = computeHabitStats(habit, checkInMap);
            const meta = CATEGORY_META[habit.category] || CATEGORY_META.routine;
            const isSelected = selectedHabitId === habit.id;

          // Status label based on 30-day rate
          let statusText = 'Starting out';
          let statusColor = 'text-stone-600 bg-stone-100';
          if (stats.completionRate30d >= 85) {
            statusText = 'Unstoppable';
            statusColor = 'text-blue-700 bg-blue-50 border border-blue-200/60';
          } else if (stats.completionRate30d >= 65) {
            statusText = 'Consistent';
            statusColor = 'text-sky-700 bg-sky-50 border border-sky-200/60';
          } else if (stats.completionRate30d >= 40) {
            statusText = 'Building rhythm';
            statusColor = 'text-amber-700 bg-amber-50 border border-amber-200/60';
          }

          return (
            <motion.div
              key={habit.id}
              id={`performance-row-${habit.id}`}
              whileHover={{ scale: 1.005 }}
              onClick={() => onSelectHabit(habit)}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 active:scale-[0.99] ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600'
                  : 'border-stone-200/70 hover:border-stone-300 hover:bg-stone-50/50 bg-white'
              }`}
            >
              {/* Left Habit Info */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                >
                  <HabitIcon name={habit.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                      {habit.title}
                    </h3>
                    <span
                      className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${meta.badgeBg} ${meta.textColor}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-500 truncate mt-0.5">
                    Target: {habit.targetDaysPerWeek}d/wk • {stats.totalCompletions} total check-ins
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 sm:hidden shrink-0" />
              </div>

              {/* Right Stats & Progress */}
              <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                {/* 30-day Progress bar */}
                <div className="w-32 sm:w-36 flex-1 sm:flex-none">
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-medium mb-1">
                    <span className="text-stone-500">30d Rate</span>
                    <span className="font-bold text-stone-800">{stats.completionRate30d}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionRate30d}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                </div>

                {/* Streaks */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div
                    title={`Current streak: ${stats.currentStreak} days`}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded bg-orange-50 text-orange-700 border border-orange-100"
                  >
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500/20" />
                    <span>{stats.currentStreak}d</span>
                  </div>

                  <div
                    title={`Best streak: ${stats.bestStreak} days`}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded bg-stone-100 text-stone-600"
                  >
                    <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                    <span>{stats.bestStreak}d</span>
                  </div>

                  <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full hidden md:inline-block ${statusColor}`}>
                    {statusText}
                  </span>

                  <ChevronRight className="w-4 h-4 text-stone-400 hidden sm:block" />
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
