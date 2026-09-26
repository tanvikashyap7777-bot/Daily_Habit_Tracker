import React, { useState, useRef, useEffect } from 'react';
import { Habit } from '../types';
import { formatDateKey, subDays, addDays } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from 'lucide-react';

interface ConsistencyHeatmapProps {
  habits: Habit[];
  checkInMap: Map<string, boolean>;
  selectedHabitId?: string | null;
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({
  habits,
  checkInMap,
  selectedHabitId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    completed: number;
    total: number;
    rate: number;
    x: number;
    y: number;
  } | null>(null);

  // Auto scroll to recent weeks on mobile mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // We show 14 weeks back up to the end of the current week (Sunday)
  const today = new Date();
  const todayStr = formatDateKey(today);

  // Find ending Sunday
  const todayDay = today.getDay(); // 0 is Sun, 1 is Mon
  const daysUntilSunday = todayDay === 0 ? 0 : 7 - todayDay;
  const endSunday = addDays(today, daysUntilSunday);

  // 14 weeks total (14 * 7 = 98 days)
  const totalWeeks = 14;
  const startDate = subDays(endSunday, totalWeeks * 7 - 1);

  // Filter habits if specific habit is selected
  const activeHabits = selectedHabitId
    ? habits.filter((h) => h.id === selectedHabitId)
    : habits.filter((h) => !h.archived);

  // Generate grid matrix: weeks as columns (totalWeeks), days as rows (0..6 representing Mon..Sun)
  // Let 0 = Monday, ..., 6 = Sunday
  const weeks: Array<Array<{ date: Date; dateStr: string; completed: number; total: number; rate: number; isFuture: boolean }>> = [];

  for (let w = 0; w < totalWeeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d);
      const dateStr = formatDateKey(date);
      const isFuture = date > today;

      let completed = 0;
      if (!isFuture) {
        for (const h of activeHabits) {
          if (checkInMap.get(`${h.id}_${dateStr}`)) {
            completed++;
          }
        }
      }

      const total = activeHabits.length;
      const rate = total > 0 ? completed / total : 0;

      weekDays.push({
        date,
        dateStr,
        completed,
        total,
        rate,
        isFuture,
      });
    }
    weeks.push(weekDays);
  }

  // Get month labels for the top row
  const monthLabels: Array<{ label: string; weekIndex: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    // Check first day of week
    const m = week[0].date.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        label: week[0].date.toLocaleDateString('en-US', { month: 'short' }),
        weekIndex: index,
      });
      lastMonth = m;
    }
  });

  const getCellColor = (rate: number, isFuture: boolean) => {
    if (isFuture) return 'bg-stone-100/50 border-transparent';
    if (rate === 0) return 'bg-stone-100 hover:ring-2 hover:ring-stone-300 border border-stone-200/50';
    if (rate <= 0.35) return 'bg-blue-200 hover:ring-2 hover:ring-blue-400 border border-blue-300/60';
    if (rate <= 0.7) return 'bg-blue-400 hover:ring-2 hover:ring-blue-500 border border-blue-500/60';
    if (rate < 1.0) return 'bg-blue-600 hover:ring-2 hover:ring-blue-700 border border-blue-600';
    return 'bg-blue-700 hover:ring-2 hover:ring-blue-800 border border-blue-800';
  };

  const dayLabels = ['Mon', 'Wed', 'Fri', 'Sun'];

  return (
    <div id="consistency-heatmap-card" className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-stone-200/80 shadow-xs relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 sm:pb-4 mb-2 sm:mb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-stone-900">Consistency Matrix</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
            {selectedHabitId
              ? `Density for "${activeHabits[0]?.title || 'selected habit'}"`
              : `Completion density across past ${totalWeeks} weeks`}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-stone-500 self-start sm:self-auto">
          <span>Less</span>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-stone-100 border border-stone-200/50" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-blue-200" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-blue-400" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-blue-600" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-blue-700" />
          <span>100%</span>
        </div>
      </div>

      {/* Heatmap Grid Container with mobile swipe indicator & auto-scroll to latest */}
      <div ref={scrollRef} className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <div className="min-w-[560px] sm:min-w-[620px]">
          {/* Month headers */}
          <div className="flex text-[10px] sm:text-xs text-stone-400 font-medium pl-8 mb-1.5 relative h-4">
            {monthLabels.map((ml, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${32 + ml.weekIndex * 22}px` }}
              >
                {ml.label}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Day of week labels: Mon, Wed, Fri, Sun */}
            <div className="flex flex-col justify-between text-[9px] sm:text-[10px] text-stone-400 font-medium w-6 py-0.5 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5 flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                  {week.map((cell, dIdx) => {
                    const isToday = cell.dateStr === todayStr;
                    return (
                      <div
                        key={dIdx}
                        id={`heatmap-cell-${cell.dateStr}`}
                        className={`aspect-square w-full rounded-xs transition-all duration-150 cursor-pointer relative ${getCellColor(
                          cell.rate,
                          cell.isFuture
                        )} ${isToday ? 'ring-2 ring-stone-900 ring-offset-1' : ''}`}
                        onMouseEnter={(e) => {
                          if (!cell.isFuture) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              dateStr: cell.dateStr,
                              completed: cell.completed,
                              total: cell.total,
                              rate: cell.rate,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        onTouchStart={(e) => {
                          if (!cell.isFuture) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              dateStr: cell.dateStr,
                              completed: cell.completed,
                              total: cell.total,
                              rate: cell.rate,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {activeHabits.length === 0 && (
        <p className="text-[11px] text-stone-400 text-center py-2 mt-1 border-t border-stone-100">
          No habits added yet. Create a habit to begin tracking your consistency heatmap.
        </p>
      )}
      <p className="text-[10px] text-stone-400 text-center sm:hidden pt-1">
        Swipe horizontally to view older weeks • Tap any cell for details
      </p>

      {/* Tooltip Overlay */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full bg-stone-900 text-stone-100 text-xs px-2.5 py-1.5 rounded-lg shadow-lg"
            style={{ left: hoveredCell.x, top: hoveredCell.y }}
          >
            <div className="font-semibold">{hoveredCell.dateStr}</div>
            <div className="text-stone-300 text-[11px] mt-0.5">
              {hoveredCell.completed} of {hoveredCell.total} habits (
              {Math.round(hoveredCell.rate * 100)}%)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
