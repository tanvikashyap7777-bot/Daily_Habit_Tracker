import React, { useState, useEffect, useMemo } from 'react';
import { Habit, CheckInRecord } from './types';
import {
  loadHabits,
  saveHabits,
  loadCheckIns,
  saveCheckIns,
  resetToDefaults,
} from './utils/storage';
import {
  buildCheckInMap,
  computeHabitStats,
} from './utils/statsCalculator';
import { getTodayKey, formatDateKey, subDays } from './utils/dateUtils';
import { Header } from './components/Header';
import { OverviewMetrics } from './components/OverviewMetrics';
import { ConsistencyHeatmap } from './components/ConsistencyHeatmap';
import { TrendChart } from './components/TrendChart';
import { DailyHabitTracker } from './components/DailyHabitTracker';
import { HabitPerformanceList } from './components/HabitPerformanceList';
import { HabitModal } from './components/HabitModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { MonthCalendarView } from './components/MonthCalendarView';
import { NotificationToast, NotificationModal } from './components/NotificationToast';
import {
  checkDueHabitReminders,
  triggerTestNotification,
  syncCapacitorNotifications,
  setupNotificationChannel,
  playNotificationChime,
  ActiveReminderPayload,
} from './utils/notificationService';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { formatTime12h } from './utils/dateUtils';
import { CheckCircle2, BarChart2, Layers, Plus, Trophy, Calendar as CalendarIcon } from 'lucide-react';
import { useBackButton, MobileTab } from './utils/useBackButton';

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => loadCheckIns());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [selectedHeatmapHabitId, setSelectedHeatmapHabitId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('today');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getTodayKey());

  // Notification states
  const [activeReminder, setActiveReminder] = useState<ActiveReminderPayload | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Back button integration (Android hardware/gesture back + Browser back button)
  const {
    pushModalHistory,
    closeModalWithHistory,
    closeDetailWithHistory,
    switchTabWithHistory,
  } = useBackButton({
    isModalOpen,
    onCloseModal: () => {
      setIsModalOpen(false);
      setEditingHabit(null);
    },
    detailHabit,
    onCloseDetail: () => setDetailHabit(null),
    mobileTab,
    onSelectTab: (tab) => setMobileTab(tab),
  });

  const handleOpenAddModal = (habitToEdit?: Habit | null) => {
    setEditingHabit(habitToEdit || null);
    setIsModalOpen(true);
    pushModalHistory('modal');
  };

  const handleOpenDetailModal = (habit: Habit) => {
    setDetailHabit(habit);
    pushModalHistory('detail');
  };

  // Sync to localStorage
  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveCheckIns(checkIns);
  }, [checkIns]);

  // Complete habit directly from notification action
  const handleCompleteHabitFromNotification = (habitId: string) => {
    const today = getTodayKey();
    setCheckIns((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.habitId === habitId && item.date === today
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], completed: true };
        return updated;
      } else {
        return [...prev, { habitId, date: today, completed: true }];
      }
    });
  };

  // Sync Capacitor notifications on habit changes & initialize channel
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
    syncCapacitorNotifications(habits).catch(() => {});
  }, [habits]);

  // Fast check-in lookup map
  const checkInMap = useMemo(() => buildCheckInMap(checkIns), [checkIns]);

  // Capacitor native notification listeners for foreground & lockscreen actions
  useEffect(() => {
    let removeReceived: (() => void) | null = null;
    let removeAction: (() => void) | null = null;

    const setupListeners = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const receivedHandle = await LocalNotifications.addListener(
            'localNotificationReceived',
            (notification) => {
              playNotificationChime();
              const habitId = notification.extra?.habitId;
              const habit = habits.find((h) => h.id === habitId);
              if (habit) {
                setActiveReminder({
                  habit,
                  timeFormatted: habit.reminderTime ? formatTime12h(habit.reminderTime) : 'Now',
                });
              }
            }
          );
          removeReceived = () => receivedHandle.remove();

          const actionHandle = await LocalNotifications.addListener(
            'localNotificationActionPerformed',
            (action) => {
              const habitId = action.notification.extra?.habitId;
              if (action.actionId === 'mark_done' && habitId) {
                handleCompleteHabitFromNotification(habitId);
              } else if (habitId) {
                const habit = habits.find((h) => h.id === habitId);
                if (habit) {
                  handleOpenDetailModal(habit);
                }
              }
            }
          );
          removeAction = () => actionHandle.remove();
        } catch (err) {
          console.warn('Could not register notification listeners:', err);
        }
      }
    };

    setupListeners();

    return () => {
      if (removeReceived) removeReceived();
      if (removeAction) removeAction();
    };
  }, [habits]);

  // Periodic habit reminder checking & resume listener
  useEffect(() => {
    const runCheck = () => {
      checkDueHabitReminders(habits, checkInMap, (payload) => {
        setActiveReminder(payload);
      });
    };

    runCheck();
    const interval = setInterval(runCheck, 20000);

    const handleResume = () => {
      runCheck();
      syncCapacitorNotifications(habits).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [habits, checkInMap]);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const todayKey = getTodayKey();

  // Metrics calculations
  const todayCompletedCount = useMemo(() => {
    return activeHabits.filter((h) => checkInMap.get(`${h.id}_${todayKey}`)).length;
  }, [activeHabits, checkInMap, todayKey]);

  // Calculate streaks across habits
  const { currentActiveStreak, bestStreakEver } = useMemo(() => {
    let maxCurrent = 0;
    let maxBest = 0;
    for (const h of activeHabits) {
      const stats = computeHabitStats(h, checkInMap);
      if (stats.currentStreak > maxCurrent) maxCurrent = stats.currentStreak;
      if (stats.bestStreak > maxBest) maxBest = stats.bestStreak;
    }
    return { currentActiveStreak: maxCurrent, bestStreakEver: maxBest };
  }, [activeHabits, checkInMap]);

  // 30-day overall consistency rate
  const consistencyRate30d = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    let completedTotal = 0;
    const totalPossible = activeHabits.length * 30;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const dStr = formatDateKey(subDays(today, i));
      for (const h of activeHabits) {
        if (checkInMap.get(`${h.id}_${dStr}`)) {
          completedTotal++;
        }
      }
    }

    return Math.round((completedTotal / totalPossible) * 100);
  }, [activeHabits, checkInMap]);

  // Total check-ins ever logged
  const totalCheckInsCount = useMemo(() => {
    return checkIns.filter((c) => c.completed).length;
  }, [checkIns]);

  // Toggle habit check-in
  const handleToggleCheckIn = (habitId: string, dateStr: string) => {
    setCheckIns((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.habitId === habitId && item.date === dateStr
      );

      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        const updated = [...prev];
        updated[existingIndex] = { ...item, completed: !item.completed };
        return updated;
      } else {
        return [...prev, { habitId, date: dateStr, completed: true }];
      }
    });
  };

  // Add / Edit habit
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (editingHabit) {
      setHabits((prev) =>
        prev.map((h) => (h.id === editingHabit.id ? ({ ...h, ...habitData } as Habit) : h))
      );
      if (detailHabit && detailHabit.id === editingHabit.id) {
        setDetailHabit((prev) => (prev ? ({ ...prev, ...habitData } as Habit) : null));
      }
    } else {
      const newHabit: Habit = {
        id: habitData.id || `habit-${Date.now()}`,
        title: habitData.title || 'Untitled Habit',
        description: habitData.description || '',
        category: habitData.category || 'health',
        icon: habitData.icon || 'Activity',
        color: habitData.color || '#2563eb',
        targetDaysPerWeek: habitData.targetDaysPerWeek || 7,
        createdAt: formatDateKey(new Date()),
      };
      setHabits((prev) => [...prev, newHabit]);
    }
    setEditingHabit(null);
  };

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCheckIns((prev) => prev.filter((c) => c.habitId !== habitId));
    if (detailHabit && detailHabit.id === habitId) {
      setDetailHabit(null);
    }
  };

  // Reset to default seed data
  const handleResetData = () => {
    const { habits: newHabits, checkIns: newCheckIns } = resetToDefaults();
    setHabits(newHabits);
    setCheckIns(newCheckIns);
  };

  return (
    <div id="habit-tracker-app-root" className="min-h-screen w-full overflow-x-hidden bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        onResetData={handleResetData}
        onOpenAddModal={() => handleOpenAddModal()}
        totalActiveHabits={activeHabits.length}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        hasActiveReminders={habits.some((h) => !h.archived && h.reminderEnabled && h.reminderTime)}
      />

      {/* Main Content Dashboard */}
      <main id="main-content-area" className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6 pb-28 lg:pb-8">
        {/* Metric Cards (visible in all views) */}
        <OverviewMetrics
          todayCompletedCount={todayCompletedCount}
          todayTotalHabits={activeHabits.length}
          currentActiveStreak={currentActiveStreak}
          bestStreakEver={bestStreakEver}
          consistencyRate30d={consistencyRate30d}
          totalCheckInsCount={totalCheckInsCount}
        />

        {/* Dedicated Calendar View Tab */}
        <div className={mobileTab === 'calendar' ? 'block' : 'hidden'}>
          <MonthCalendarView
            habits={habits}
            checkInMap={checkInMap}
            onToggleCheckIn={handleToggleCheckIn}
            onSelectHabit={(habit) => handleOpenDetailModal(habit)}
            selectedDate={selectedCalendarDate}
            onSelectDate={setSelectedCalendarDate}
          />
        </div>

        {/* Daily Habit Interaction & Tracking Section */}
        <div className={mobileTab === 'today' || mobileTab === 'all' ? 'block' : 'hidden lg:block'}>
          <DailyHabitTracker
            habits={habits}
            checkInMap={checkInMap}
            onToggleCheckIn={handleToggleCheckIn}
            onOpenAddModal={() => handleOpenAddModal()}
            onSelectHabit={(habit) => handleOpenDetailModal(habit)}
          />
        </div>

        {/* Visual Statistics Row: Trend Chart & Heatmap */}
        <div
          id="visual-statistics-section"
          className={`grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 ${
            mobileTab === 'analytics' || mobileTab === 'all' ? 'grid' : 'hidden lg:grid'
          }`}
        >
          <TrendChart habits={habits} checkInMap={checkInMap} />
          <ConsistencyHeatmap
            habits={habits}
            checkInMap={checkInMap}
            selectedHabitId={selectedHeatmapHabitId}
          />
        </div>

        {/* Breakdown of Habit Consistency & Streaks */}
        <div className={mobileTab === 'habits' || mobileTab === 'all' ? 'block' : 'hidden lg:block'}>
          <HabitPerformanceList
            habits={habits}
            checkInMap={checkInMap}
            onSelectHabit={(habit) => handleOpenDetailModal(habit)}
            selectedHabitId={selectedHeatmapHabitId}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Sticky with safe-area support) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200/80 z-40 px-2 py-1.5 pb-safe shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => switchTabWithHistory('today')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors active:scale-95 ${
              mobileTab === 'today' ? 'text-blue-600 font-bold' : 'text-stone-500 font-medium'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Today</span>
          </button>

          <button
            onClick={() => switchTabWithHistory('calendar')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors active:scale-95 ${
              mobileTab === 'calendar' ? 'text-blue-600 font-bold' : 'text-stone-500 font-medium'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Calendar</span>
          </button>

          {/* Quick Add FAB in center */}
          <button
            onClick={() => handleOpenAddModal()}
            title="Create new habit"
            className="w-11 h-11 -mt-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/35 border-2 border-white transition-all shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => switchTabWithHistory('analytics')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors active:scale-95 ${
              mobileTab === 'analytics' ? 'text-blue-600 font-bold' : 'text-stone-500 font-medium'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Analytics</span>
          </button>

          <button
            onClick={() => switchTabWithHistory('habits')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors active:scale-95 ${
              mobileTab === 'habits' ? 'text-blue-600 font-bold' : 'text-stone-500 font-medium'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Habits</span>
          </button>

          <button
            onClick={() => switchTabWithHistory('all')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors active:scale-95 ${
              mobileTab === 'all' ? 'text-blue-600 font-bold' : 'text-stone-500 font-medium'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">All</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-4 text-center text-xs text-stone-500 hidden lg:block">
        <p>Daily Habit Tracker • Visual progress and daily consistency analytics</p>
      </footer>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={closeModalWithHistory}
        onSave={(data) => {
          handleSaveHabit(data);
          closeModalWithHistory();
        }}
        editingHabit={editingHabit}
      />

      {/* Habit In-Depth Detail Modal */}
      <HabitDetailModal
        habit={detailHabit}
        checkInMap={checkInMap}
        onClose={closeDetailWithHistory}
        onEdit={(habit) => {
          closeDetailWithHistory();
          handleOpenAddModal(habit);
        }}
        onDelete={(habitId) => {
          handleDeleteHabit(habitId);
          closeDetailWithHistory();
        }}
        onToggleDate={handleToggleCheckIn}
      />

      {/* Interactive In-App Notification Toast */}
      <NotificationToast
        activeReminder={activeReminder}
        onDismiss={() => setActiveReminder(null)}
        onComplete={(habitId) => {
          handleToggleCheckIn(habitId, getTodayKey());
          setActiveReminder(null);
        }}
      />

      {/* Notification Settings & Testing Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        habits={habits}
        onTriggerTest={() => {
          triggerTestNotification(habits[0], (payload) => {
            setActiveReminder(payload);
          });
        }}
      />
    </div>
  );
}
