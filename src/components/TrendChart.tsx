import React, { useState } from 'react';
import { Habit } from '../types';
import { computeDailyActivities } from '../utils/statsCalculator';
import { BarChart2, Star, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface TrendChartProps {
  habits: Habit[];
  checkInMap: Map<string, boolean>;
}

type TimeRange = 7 | 14 | 30;

export const TrendChart: React.FC<TrendChartProps> = ({ habits, checkInMap }) => {
  const [daysCount, setDaysCount] = useState<TimeRange>(14);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activities = computeDailyActivities(habits, checkInMap, daysCount);

  // Compute stats for current window
  const totalCompleted = activities.reduce((acc, a) => acc + a.completedCount, 0);
  const totalPossible = activities.reduce((acc, a) => acc + a.totalHabits, 0);
  const averageRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  const perfectDays = activities.filter((a) => a.rate === 1 && a.totalHabits > 0).length;

  const chartHeight = 160;

  return (
    <div id="trend-chart-card" className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
      {/* Header with Title & Timeframe Selector */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">Completion Trend</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 hidden sm:block">
              Daily completion rate over the selected timeframe
            </p>
          </div>

          <div id="timeframe-toggle-group" className="flex items-center bg-stone-100 p-0.5 sm:p-1 rounded-lg shrink-0">
            {( [7, 14, 30] as TimeRange[] ).map((range) => (
              <button
                key={range}
                id={`timeframe-btn-${range}`}
                onClick={() => setDaysCount(range)}
                className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-md transition-all active:scale-95 ${
                  daysCount === range
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-3 sm:my-4 pt-0.5">
          <div className="bg-stone-50 rounded-lg p-2 sm:p-2.5 border border-stone-200/60 text-center sm:text-left">
            <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 block truncate">Avg. Rate</span>
            <span className="text-base sm:text-lg font-bold text-stone-900">{averageRate}%</span>
          </div>
          <div className="bg-stone-50 rounded-lg p-2 sm:p-2.5 border border-stone-200/60 text-center sm:text-left">
            <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 block truncate">Perfect Days</span>
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <span className="text-base sm:text-lg font-bold text-blue-700">{perfectDays}</span>
              <span className="text-[10px] sm:text-xs text-stone-500">/{daysCount}</span>
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg p-2 sm:p-2.5 border border-stone-200/60 text-center sm:text-left">
            <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 block truncate">Check-ins</span>
            <span className="text-base sm:text-lg font-bold text-stone-900">{totalCompleted}</span>
          </div>
        </div>
      </div>

      {/* SVG / Bar Chart Area */}
      <div className="mt-1">
        <div className="relative h-32 sm:h-40">
          {/* 80% Goal Reference Line */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-stone-300 z-0 flex justify-end"
            style={{ top: `${(1 - 0.8) * 100}%` }}
          >
            <span className="text-[9px] sm:text-[10px] font-semibold text-stone-400 -mt-3.5 bg-white px-1">
              80% Goal
            </span>
          </div>

          {/* 50% line */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-stone-200 z-0"
            style={{ top: '50%' }}
          />

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-0.5 sm:gap-2 z-10">
            {activities.map((act, index) => {
              const heightPercent = act.totalHabits > 0 ? Math.max(act.rate * 100, 4) : 4;
              const isHovered = hoveredIndex === index;
              const is100 = act.rate === 1 && act.totalHabits > 0;

              return (
                <div
                  key={act.date}
                  id={`trend-bar-${act.date}`}
                  className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(index)}
                >
                  {/* Perfect day star indicator */}
                  {is100 && (
                    <div className="mb-0.5 sm:mb-1 text-amber-500">
                      <Star className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-amber-400" />
                    </div>
                  )}

                  {/* The bar element */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.4, delay: index * 0.015 }}
                    className={`w-full rounded-t-xs sm:rounded-t-sm transition-colors ${
                      isHovered
                        ? 'bg-blue-700'
                        : is100
                        ? 'bg-blue-600'
                        : act.rate >= 0.7
                        ? 'bg-blue-500'
                        : act.rate >= 0.4
                        ? 'bg-blue-300'
                        : 'bg-stone-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-stone-400 font-medium pt-1.5 border-t border-stone-100 mt-1">
          <span>{activities[0]?.formattedDate}</span>
          <span>{activities[Math.floor(activities.length / 2)]?.formattedDate}</span>
          <span className="font-semibold text-stone-700">Today</span>
        </div>

        {/* Hover / Touch details badge */}
        <div className="min-h-[26px] mt-1.5 flex items-center justify-center">
          {hoveredIndex !== null && activities[hoveredIndex] ? (
            <motion.div
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] sm:text-xs font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md flex items-center gap-1.5 flex-wrap justify-center"
            >
              <span className="font-bold text-stone-900">
                {activities[hoveredIndex].dayShort}, {activities[hoveredIndex].formattedDate}:
              </span>
              <span>
                {activities[hoveredIndex].completedCount}/{activities[hoveredIndex].totalHabits} habits
              </span>
              <span className="font-bold text-blue-700">
                ({Math.round(activities[hoveredIndex].rate * 100)}%)
              </span>
            </motion.div>
          ) : (
            <span className="text-[10px] sm:text-[11px] text-stone-400">
              Tap or hover any bar to view completion stats
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
