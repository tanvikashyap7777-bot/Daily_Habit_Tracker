import React from 'react';
import { Activity, RotateCcw, Plus, Sparkles, Bell } from 'lucide-react';

interface HeaderProps {
  onResetData: () => void;
  onOpenAddModal: () => void;
  onOpenNotifications?: () => void;
  hasActiveReminders?: boolean;
  totalActiveHabits: number;
}

export const Header: React.FC<HeaderProps> = ({
  onResetData,
  onOpenAddModal,
  onOpenNotifications,
  hasActiveReminders,
  totalActiveHabits,
}) => {
  return (
    <header id="app-header" className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 pt-safe">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src="/icon.png"
            alt="Daily Habit Tracker"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-xs shrink-0 object-cover border border-stone-200/60"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-stone-900 tracking-tight truncate">
                Daily Habit Tracker
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                Visual Analytics
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden lg:block">
              Daily habit logging with consistency heatmaps and progress analytics
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {totalActiveHabits > 0 && (
            <button
              id="clear-all-data-btn"
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to clear all habits and check-in records? This cannot be undone.'
                  )
                ) {
                  onResetData();
                }
              }}
              title="Clear all habits and progress"
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-stone-200/80 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}

          {onOpenNotifications && (
            <button
              id="header-notifications-btn"
              onClick={onOpenNotifications}
              title="Habit Reminders & Notifications"
              className="relative p-2 sm:px-2.5 sm:py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200/80 active:scale-95 flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">Reminders</span>
              {hasActiveReminders && (
                <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white" />
              )}
            </button>
          )}

          <button
            id="header-new-habit-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-colors active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add<span className="hidden sm:inline"> Habit</span></span>
          </button>
        </div>
      </div>
    </header>
  );
};
