import React from 'react';
import { Flame, Trophy, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface OverviewMetricsProps {
  todayCompletedCount: number;
  todayTotalHabits: number;
  currentActiveStreak: number;
  bestStreakEver: number;
  consistencyRate30d: number;
  totalCheckInsCount: number;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  todayCompletedCount,
  todayTotalHabits,
  currentActiveStreak,
  bestStreakEver,
  consistencyRate30d,
  totalCheckInsCount,
}) => {
  const todayPercentage =
    todayTotalHabits > 0 ? Math.round((todayCompletedCount / todayTotalHabits) * 100) : 0;

  // SVG circular gauge geometry
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayPercentage / 100) * circumference;

  return (
    <div id="overview-metrics-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Today's Completion Card */}
      <motion.div
        id="metric-card-today"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-3.5 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2"
      >
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500 truncate">
            Today's Progress
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-stone-900">{todayCompletedCount}</span>
            <span className="text-xs sm:text-sm font-medium text-stone-500">/{todayTotalHabits}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">
            {todayPercentage === 100 ? (
              <span className="text-blue-700 font-semibold">All done!</span>
            ) : todayPercentage >= 50 ? (
              <span className="text-blue-600 font-medium">&gt;50% done</span>
            ) : (
              <span>In progress</span>
            )}
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative flex items-center justify-center w-11 h-11 sm:w-16 sm:h-16 shrink-0">
          <svg className="w-11 h-11 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 72 72">
            <circle
              cx="36"
              cy="36"
              r={radius}
              className="text-stone-100"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <motion.circle
              cx="36"
              cy="36"
              r={radius}
              className="text-blue-600"
              strokeWidth="6"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[10px] sm:text-xs font-bold text-stone-800">{todayPercentage}%</span>
        </div>
      </motion.div>

      {/* Current Active Streak */}
      <motion.div
        id="metric-card-streak"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-xl p-3.5 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2"
      >
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500 truncate">
            Current Streak
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-stone-900">{currentActiveStreak}</span>
            <span className="text-xs sm:text-sm font-medium text-stone-500">days</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">
            Best: <span className="font-semibold text-stone-800">{bestStreakEver}d</span>
          </p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
          <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-orange-500/20" />
        </div>
      </motion.div>

      {/* 30-Day Consistency Score */}
      <motion.div
        id="metric-card-consistency"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-xl p-3.5 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2"
      >
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500 truncate">
            30d Consistency
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-stone-900">{consistencyRate30d}%</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">Active habits</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </motion.div>

      {/* Total Recorded Check-ins */}
      <motion.div
        id="metric-card-total-checkins"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-xl p-3.5 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2"
      >
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500 truncate">
            Total Logs
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-stone-900">{totalCheckInsCount}</span>
            <span className="text-xs sm:text-sm font-medium text-stone-500">logs</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">Total check-ins</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </motion.div>
    </div>
  );
};
