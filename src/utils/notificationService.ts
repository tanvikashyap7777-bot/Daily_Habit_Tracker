import { Habit } from '../types';
import { getTodayKey, formatTime12h } from './dateUtils';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIFIED_CACHE_KEY = 'daily_habits_notified_cache';
export const HABIT_ALARM_CHANNEL_ID = 'habit_alarm_channel_v2';
export const HABIT_ACTION_TYPE_ID = 'HABIT_REMINDER_ACTIONS';

// Load memory cache of already alerted habit IDs for today
function getAlertedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markAlerted(habitId: string, dateStr: string) {
  try {
    const map = getAlertedMap();
    map[`${habitId}_${dateStr}`] = new Date().toISOString();
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Graceful fallback
  }
}

export function hasBeenAlerted(habitId: string, dateStr: string): boolean {
  const map = getAlertedMap();
  return Boolean(map[`${habitId}_${dateStr}`]);
}

/**
 * Deterministically generates a unique positive 32-bit integer for habit notifications
 */
export function getHabitNotificationId(habitId: string): number {
  let hash = 0;
  for (let i = 0; i < habitId.length; i++) {
    hash = (hash << 5) - hash + habitId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash % 2000000000) + 100;
}

/**
 * Synthesizes an audible, pleasant multi-tone alarm melody and triggers haptic vibration
 */
export function playNotificationChime(): void {
  // Trigger physical vibration pattern on mobile devices (alarm buzz-buzz-buzz)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([280, 100, 280, 100, 450]);
    } catch {
      // Ignored if device does not support or policy blocked
    }
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Helper to play a chime pulse with pleasant envelope
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // Richer, warmer tone like an alarm chime
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Melodic alarm pattern (D5 -> F#5 -> A5 -> D6)
    playNote(587.33, now, 0.28);
    playNote(739.99, now + 0.14, 0.28);
    playNote(880.00, now + 0.28, 0.35);
    playNote(1174.66, now + 0.44, 0.65);

    // Second rhythmic burst after a short breath
    playNote(587.33, now + 0.80, 0.28);
    playNote(880.00, now + 0.94, 0.35);
    playNote(1174.66, now + 1.10, 0.85);
  } catch {
    // AudioContext blocked or unsupported in background tab
  }
}

/**
 * Configure Android notification channels and interactive action buttons
 */
export async function setupNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Create max priority channel for alarm-like heads up banner & vibration
    await LocalNotifications.createChannel({
      id: HABIT_ALARM_CHANNEL_ID,
      name: 'Habit Reminder Alarms',
      description: 'High-priority habit reminder alarms that pop up and sound even when the app is closed',
      importance: 5, // IMPORTANCE_HIGH / MAX
      visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
      vibration: true,
      lights: true,
      lightColor: '#2563eb',
    });

    // Register interactive quick actions
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: HABIT_ACTION_TYPE_ID,
          actions: [
            {
              id: 'mark_done',
              title: 'Mark as Done',
              foreground: false,
            },
            {
              id: 'dismiss',
              title: 'Dismiss',
              destructive: true,
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.warn('Failed to configure native notification channel:', err);
  }
}

/**
 * Check permission status for notifications across Capacitor and Web
 */
export async function checkNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display;
    } catch {
      return 'prompt';
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  return 'prompt';
}

/**
 * Check Android exact alarm setting permission (Android 12+)
 */
export async function checkExactAlarmPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      const result = await LocalNotifications.checkExactNotificationSetting();
      return result.exact_alarm === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'unsupported';
    }
  }
  return 'unsupported';
}

/**
 * Open system screen to grant Exact Alarms permission on Android 12+
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.changeExactNotificationSetting();
    } catch (err) {
      console.warn('Cannot open exact alarm settings:', err);
    }
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 1. Capacitor native platform
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('Native requestPermissions failed:', err);
    }
  }

  // 2. Web Notifications API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Schedule or update local notifications on Capacitor native platform
 */
export async function syncCapacitorNotifications(habits: Habit[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Ensure channel and actions exist
    await setupNotificationChannel();

    // 2. Clear old pending habit notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }

    // 3. Build scheduled notifications list
    const scheduled = [];
    for (let i = 0; i < habits.length; i++) {
      const habit = habits[i];
      if (habit.reminderEnabled && habit.reminderTime && !habit.archived) {
        const [hours, minutes] = habit.reminderTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const id = getHabitNotificationId(habit.id);
          const timeFormatted = formatTime12h(habit.reminderTime);

          scheduled.push({
            id,
            title: `⏰ Habit Reminder: ${habit.title}`,
            body: habit.description || `It's ${timeFormatted}! Time to complete "${habit.title}" and maintain your streak.`,
            channelId: HABIT_ALARM_CHANNEL_ID,
            actionTypeId: HABIT_ACTION_TYPE_ID,
            autoCancel: true,
            foreground: true, // Display heads-up banner even when app is open
            isExactNotification: true, // Use exact AlarmManager trigger
            schedule: {
              on: {
                hour: hours,
                minute: minutes,
                second: 0,
              },
              allowWhileIdle: true, // Critical: wakes up device CPU in Doze mode
            },
            extra: {
              habitId: habit.id,
              habitTitle: habit.title,
              reminderTime: habit.reminderTime,
            },
          });
        }
      }
    }

    if (scheduled.length > 0) {
      await LocalNotifications.schedule({ notifications: scheduled });
    }
  } catch (err) {
    console.warn('Error syncing Capacitor notifications:', err);
  }
}

/**
 * Schedule a quick test alarm to verify background waking and lockscreen delivery
 */
export async function scheduleQuickTestAlarm(seconds = 5, habit?: Habit): Promise<void> {
  // Ensure channel exists
  await setupNotificationChannel();

  const title = habit ? `⏰ Test Alarm: ${habit.title}` : '⏰ Test Alarm: Daily Habit Tracker';
  const body = habit?.description || 'Your alarm notification fired successfully at the exact scheduled second!';
  const fireDate = new Date(Date.now() + seconds * 1000);

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999999,
            title,
            body,
            channelId: HABIT_ALARM_CHANNEL_ID,
            actionTypeId: HABIT_ACTION_TYPE_ID,
            autoCancel: true,
            foreground: true,
            isExactNotification: true,
            schedule: {
              at: fireDate,
              allowWhileIdle: true, // Wakes up phone from sleep
            },
            extra: {
              habitId: habit?.id || 'test',
              habitTitle: habit?.title || 'Test Habit',
              reminderTime: 'Now',
            },
          },
        ],
      });
    } catch (err) {
      console.warn('Failed to schedule native test alarm:', err);
    }
  } else {
    // Web fallback with setTimeout
    setTimeout(() => {
      playNotificationChime();
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icon.png',
            tag: `test-alarm-${Date.now()}`,
          });
        } catch {
          // Ignored
        }
      }
    }, seconds * 1000);
  }
}

export interface ActiveReminderPayload {
  habit: Habit;
  timeFormatted: string;
}

/**
 * Robust check if any habits are due at current time, with throttling tolerance
 */
export function checkDueHabitReminders(
  habits: Habit[],
  checkInMap: Map<string, boolean>,
  onTrigger: (payload: ActiveReminderPayload) => void
): void {
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const todayKey = getTodayKey();

  for (const habit of habits) {
    if (habit.archived) continue;
    if (!habit.reminderEnabled || !habit.reminderTime) continue;

    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) continue;

    const habitTotalMinutes = hours * 60 + minutes;

    // Check if scheduled time was reached today and within the past 45 minutes (handles background tab pauses)
    const diff = currentTotalMinutes - habitTotalMinutes;
    const isDue = diff >= 0 && diff <= 45;

    if (isDue) {
      // Check if already checked in today
      const isAlreadyDone = Boolean(checkInMap.get(`${habit.id}_${todayKey}`));
      if (isAlreadyDone) continue;

      // Check if already alerted today
      if (hasBeenAlerted(habit.id, todayKey)) continue;

      markAlerted(habit.id, todayKey);

      // Play rich audio chime & vibration
      playNotificationChime();

      // Dispatch Web Notification if in browser
      if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`⏰ Reminder: ${habit.title}`, {
            body: habit.description || `It's ${formatTime12h(habit.reminderTime)}! Time to complete your daily habit.`,
            icon: '/icon.png',
            tag: `habit-${habit.id}-${todayKey}`,
          });
        } catch {
          // Ignored
        }
      }

      // In-app interactive toast
      onTrigger({
        habit,
        timeFormatted: formatTime12h(habit.reminderTime),
      });
    }
  }
}

/**
 * Trigger a sample test notification directly
 */
export function triggerTestNotification(
  sampleHabit: Habit | undefined,
  onTrigger: (payload: ActiveReminderPayload) => void
): void {
  playNotificationChime();

  const habit: Habit = sampleHabit || {
    id: 'test-habit',
    title: 'Mindful Breathing',
    description: '10 minutes of calm breathing to reset your focus and energy',
    category: 'mind',
    icon: 'Activity',
    color: '#0284c7',
    targetDaysPerWeek: 7,
    createdAt: getTodayKey(),
    reminderTime: '08:00',
    reminderEnabled: true,
  };

  if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`⏰ Reminder: ${habit.title}`, {
        body: habit.description || 'Test habit reminder is working perfectly!',
        icon: '/icon.png',
        tag: `test-habit-${Date.now()}`,
      });
    } catch {
      // Ignored
    }
  }

  onTrigger({
    habit,
    timeFormatted: formatTime12h(habit.reminderTime || '08:00'),
  });
}
