import React, { useState, useEffect } from 'react';
import {
  ActiveReminderPayload,
  checkNotificationPermissionStatus,
  checkExactAlarmPermission,
  openExactAlarmSettings,
  requestNotificationPermission,
  scheduleQuickTestAlarm,
  triggerTestNotification,
} from '../utils/notificationService';
import { Habit } from '../types';
import { HabitIcon } from './HabitIcon';
import {
  Bell,
  Check,
  X,
  Volume2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';

interface NotificationToastProps {
  activeReminder: ActiveReminderPayload | null;
  onDismiss: () => void;
  onComplete: (habitId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  activeReminder,
  onDismiss,
  onComplete,
}) => {
  if (!activeReminder) return null;

  const { habit, timeFormatted } = activeReminder;

  return (
    <AnimatePresence>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="pointer-events-auto bg-stone-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-700/80 backdrop-blur-md flex items-center gap-3.5"
        >
          {/* Left Icon with pulse effect */}
          <div className="relative shrink-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: habit.color || '#2563eb' }}
            >
              <HabitIcon name={habit.icon} className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-[9px] font-extrabold ring-2 ring-stone-900 animate-pulse">
              <Bell className="w-2.5 h-2.5 fill-current" />
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Habit Alarm • {timeFormatted}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate mt-0.5">
              {habit.title}
            </h4>
            {habit.description && (
              <p className="text-xs text-stone-300 line-clamp-1 mt-0.5">
                {habit.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="notification-toast-complete-btn"
              onClick={() => {
                onComplete(habit.id);
                onDismiss();
              }}
              title="Mark habit complete"
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Done</span>
            </button>
            <button
              id="notification-toast-dismiss-btn"
              onClick={onDismiss}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors active:scale-95"
              title="Dismiss reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onTriggerTest: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  habits,
  onTriggerTest,
}) => {
  const [permission, setPermission] = useState<string>('prompt');
  const [exactAlarmStatus, setExactAlarmStatus] = useState<string>('unsupported');
  const [requesting, setRequesting] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  const refreshPermissions = async () => {
    const perm = await checkNotificationPermissionStatus();
    setPermission(perm);
    const exact = await checkExactAlarmPermission();
    setExactAlarmStatus(exact);
  };

  useEffect(() => {
    if (isOpen) {
      refreshPermissions();
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    const exact = await checkExactAlarmPermission();
    setExactAlarmStatus(exact);
    setRequesting(false);
  };

  const handleOpenAlarmSettings = async () => {
    await openExactAlarmSettings();
    setTimeout(refreshPermissions, 1500);
  };

  const handleScheduleBackgroundTest = async () => {
    const firstHabit = habits.find((h) => !h.archived && h.reminderEnabled) || habits[0];
    setTestCountdown(5);
    await scheduleQuickTestAlarm(5, firstHabit);

    let count = 5;
    const timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(timer);
        setTestCountdown(null);
      } else {
        setTestCountdown(count);
      }
    }, 1000);
  };

  if (!isOpen) return null;

  const habitsWithReminders = habits.filter((h) => !h.archived && h.reminderEnabled && h.reminderTime);
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Habit Alarms & Notifications</h3>
              <p className="text-[11px] text-stone-500">Wake-up alerts whether app is open or closed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Permission card */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Notification Permission</span>
              {permission === 'granted' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Enabled
                </span>
              ) : permission === 'denied' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <AlertCircle className="w-3 h-3" /> Blocked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <AlertCircle className="w-3 h-3" /> Not Configured
                </span>
              )}
            </div>

            {/* Android Exact Alarm Status */}
            {isAndroid && exactAlarmStatus !== 'unsupported' && (
              <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                <span className="text-xs font-medium text-stone-600">Exact Alarm Mode</span>
                {exactAlarmStatus === 'granted' ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Exact Timing Active
                  </span>
                ) : (
                  <button
                    onClick={handleOpenAlarmSettings}
                    className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1"
                  >
                    <Settings className="w-2.5 h-2.5" /> Enable in Settings
                  </button>
                )}
              </div>
            )}

            <p className="text-[11px] text-stone-500 leading-relaxed">
              When enabled, habit reminders trigger like a true alarm with sound chime and heads-up banner at your set time, waking up your device even when the app is closed.
            </p>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                disabled={requesting}
                className="w-full mt-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{requesting ? 'Requesting...' : 'Enable System Notifications'}</span>
              </button>
            )}
          </div>

          {/* Test 5s Background Alarm */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600 fill-blue-600/20" />
                <span className="text-xs font-bold text-stone-900">Background Alarm Verification</span>
              </div>
              {testCountdown !== null && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold animate-pulse">
                  Firing in {testCountdown}s...
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Test closing the app: Click the button below, then immediately lock your phone or press Home. The alarm will fire in 5 seconds with sound and heads-up banner!
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleScheduleBackgroundTest}
                disabled={testCountdown !== null}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 active:scale-95 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Schedule 5-Second Alarm</span>
              </button>
              <button
                onClick={() => {
                  onTriggerTest();
                  onClose();
                }}
                className="py-2 px-3 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors active:scale-95 flex items-center gap-1"
                title="Preview sound tone right now"
              >
                <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Preview Tone</span>
              </button>
            </div>
          </div>

          {/* Active Reminders List */}
          <div>
            <h4 className="text-xs font-bold text-stone-800 mb-2 flex items-center justify-between">
              <span>Active Habit Alarms</span>
              <span className="text-[11px] font-normal text-stone-500">
                {habitsWithReminders.length} scheduled
              </span>
            </h4>

            {habitsWithReminders.length === 0 ? (
              <div className="p-4 border border-dashed border-stone-200 rounded-xl text-center">
                <p className="text-xs text-stone-500">
                  No habits have reminder times set yet. Edit or create a habit to assign a daily reminder time!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {habitsWithReminders.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                        style={{ backgroundColor: habit.color }}
                      >
                        <HabitIcon name={habit.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-stone-900 truncate">
                        {habit.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0">
                      ⏰ {habit.reminderTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 sm:py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-200 rounded-lg active:scale-95 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
