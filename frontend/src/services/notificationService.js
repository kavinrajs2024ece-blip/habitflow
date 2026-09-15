import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * HabitFlow Android Local Notification Service
 * Powered by @capacitor/local-notifications v8.3.1
 *
 * Implements:
 * - Android 8.0+ High-Importance Notification Channel with sound & vibration
 * - Android 13+ (API 33+) POST_NOTIFICATIONS runtime permissions
 * - Android exact alarms with allowWhileIdle for battery-saving Doze mode
 * - Unique numeric notification IDs: 1000 + habit.id for individual habits, 999999 for overall daily reminder
 * - Local timezone target date calculation and structured console logs
 */

export const REMINDERS_CHANNEL_ID = 'habitflow_reminders';
export const GLOBAL_REMINDER_NOTIFICATION_ID = 999999;

const GLOBAL_REMINDER_STORAGE_KEY_ENABLED = 'habitflow_global_reminder_enabled';
const GLOBAL_REMINDER_STORAGE_KEY_TIME = 'habitflow_global_reminder_time';

let isChannelCreated = false;

/**
 * Checks whether native Capacitor features are available
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/**
 * Generate a deterministic 32-bit positive integer ID for each habit
 * Offset by 1000 to cleanly separate from system IDs and the global reminder (999999)
 */
export function getNotificationIdForHabit(habitId) {
  const num = parseInt(habitId, 10);
  if (!isNaN(num) && num > 0) {
    return (1000 + num) % 2147483647;
  }
  let hash = 0;
  const str = String(habitId);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (1000 + (Math.abs(hash) % 2147482647)) % 2147483647;
}

/**
 * Ensure the Android Notification Channel exists (Mandatory on Android 8.0+ / API 26+)
 * Without this channel, notifications are dropped by the OS and will not display.
 */
export async function ensureNotificationChannel() {
  if (!isNativePlatform()) return;

  if (isChannelCreated) return;

  try {
    await LocalNotifications.createChannel({
      id: REMINDERS_CHANNEL_ID,
      name: 'HabitFlow Reminders',
      description: 'Daily habit reminders and motivational goal alerts',
      importance: 5, // NotificationManager.IMPORTANCE_HIGH -> Heads-up banner with sound
      visibility: 1, // NotificationCompat.VISIBILITY_PUBLIC
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#4f46e5',
    });
    isChannelCreated = true;
    console.log(`[NotificationService] Verified Notification Channel: '${REMINDERS_CHANNEL_ID}' (importance: HIGH)`);
  } catch (err) {
    console.warn('[NotificationService] Error creating notification channel:', err);
  }
}

/**
 * Check permission status without prompting
 * Returns boolean indicating whether display permission is granted
 */
export async function checkNotificationPermission() {
  if (isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      const granted = check.display === 'granted';
      console.log(`[NotificationService] checkNotificationPermission(): ${check.display} (${granted ? 'GRANTED' : 'NOT GRANTED'})`);
      return granted;
    } catch (err) {
      console.warn('[NotificationService] checkPermissions error:', err);
      return false;
    }
  } else {
    // Web fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }
}

/**
 * Request notification permissions gracefully using @capacitor/local-notifications
 * Returns boolean indicating whether notifications can be shown
 */
export async function requestNotificationPermission() {
  if (isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      console.log(`[NotificationService] requestNotificationPermission pre-check: ${check.display}`);

      if (check.display === 'granted') {
        await ensureNotificationChannel();
        return true;
      }

      const request = await LocalNotifications.requestPermissions();
      const granted = request.display === 'granted';
      console.log(`[NotificationService] requestNotificationPermission response: ${request.display} (${granted ? 'GRANTED' : 'DENIED'})`);

      if (granted) {
        await ensureNotificationChannel();
      }
      return granted;
    } catch (err) {
      console.warn('[NotificationService] Capacitor requestPermissions error:', err);
      return false;
    }
  } else {
    // Web fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
          const result = await Notification.requestPermission();
          return result === 'granted';
        }
      } catch (err) {
        console.warn('[NotificationService] Web Notification permission error:', err);
      }
    }
    return false;
  }
}

/**
 * Parse a time string (e.g. "08:30" or "20:00") into hour and minute integers
 */
export function parseReminderTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Calculate the next upcoming Date for the specified hour:minute in the device's local timezone.
 * If the time has already passed today, returns the Date for tomorrow.
 */
export function calculateNextScheduledDate(hour, minute) {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Format a 24h time string like "08:30" to user-friendly "8:30 AM"
 */
export function formatDisplayTime(timeStr) {
  const parsed = parseReminderTime(timeStr);
  if (!parsed) return timeStr || '';
  const { hour, minute } = parsed;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute < 10 ? `0${minute}` : minute;
  return `${displayHour}:${displayMinute} ${ampm}`;
}

/**
 * Schedule a daily recurring local notification for an individual habit
 */
export async function scheduleHabitReminder(habit) {
  if (!habit || !habit.id || !habit.reminder_enabled || !habit.reminder_time) {
    console.log(`[NotificationService] scheduleHabitReminder: Habit #${habit?.id} reminder is not enabled or lacks time.`);
    return false;
  }

  const parsedTime = parseReminderTime(habit.reminder_time);
  if (!parsedTime) {
    console.warn(`[NotificationService] Invalid reminder_time "${habit.reminder_time}" for habit #${habit.id}`);
    return false;
  }

  const notifId = getNotificationIdForHabit(habit.id);
  const nextDate = calculateNextScheduledDate(parsedTime.hour, parsedTime.minute);

  console.log(`[NotificationService] Preparing to schedule Habit Reminder:`, {
    habitId: habit.id,
    habitName: habit.name,
    notificationId: notifId,
    reminderTime: habit.reminder_time,
    displayTime: formatDisplayTime(habit.reminder_time),
    nextOccurrenceLocal: nextDate.toLocaleString(),
    deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  if (isNativePlatform()) {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn(`[NotificationService] Notification permission NOT granted. Cannot schedule reminder for "${habit.name}".`);
        return false;
      }

      await ensureNotificationChannel();

      // Cancel previous notification with this ID to prevent duplicate alerts
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      }).catch(() => {});

      // Schedule daily recurring local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: 'HabitFlow — Habit Reminder',
            body: `Time to complete: ${habit.name} 💪`,
            channelId: REMINDERS_CHANNEL_ID,
            foreground: true,
            schedule: {
              on: {
                hour: parsedTime.hour,
                minute: parsedTime.minute,
                second: 0,
              },
              allowWhileIdle: true,
            },
            extra: {
              type: 'habit_reminder',
              habitId: habit.id,
              habitName: habit.name,
              reminderTime: habit.reminder_time,
              scheduledAt: new Date().toISOString(),
              nextFireLocal: nextDate.toISOString(),
            },
          },
        ],
      });

      console.log(`[NotificationService] SUCCESS: Scheduled Local Notification:`, {
        notificationId: notifId,
        habit: habit.name,
        time: habit.reminder_time,
        nextTrigger: nextDate.toLocaleString(),
        channel: REMINDERS_CHANNEL_ID,
      });

      return true;
    } catch (err) {
      console.error(`[NotificationService] ERROR scheduling notification for habit #${habit.id}:`, err);
      return false;
    }
  } else {
    console.info(`[NotificationService] Web platform: habit reminder saved for "${habit.name}" at ${habit.reminder_time} (Next: ${nextDate.toLocaleString()})`);
    return true;
  }
}

/**
 * Cancel a scheduled local notification for an individual habit
 */
export async function cancelHabitReminder(habitId) {
  if (!habitId) return;
  const notifId = getNotificationIdForHabit(habitId);

  console.log(`[NotificationService] Cancelling notification for habit #${habitId} (ID: ${notifId})`);

  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
      console.log(`[NotificationService] SUCCESS: Cancelled notification ID ${notifId} for habit #${habitId}`);
    } catch (err) {
      console.warn(`[NotificationService] Failed to cancel notification for habit #${habitId}:`, err);
    }
  }
}

/**
 * Reschedule or cancel habit reminder when time or enabled status changes
 */
export async function updateHabitReminder(habit) {
  if (!habit || !habit.id) return;

  if (habit.reminder_enabled && habit.reminder_time) {
    console.log(`[NotificationService] updateHabitReminder: Rescheduling habit #${habit.id} at ${habit.reminder_time}`);
    await scheduleHabitReminder(habit);
  } else {
    console.log(`[NotificationService] updateHabitReminder: Reminder disabled for habit #${habit.id}. Cancelling notification.`);
    await cancelHabitReminder(habit.id);
  }
}

/**
 * Retrieve global daily habit reminder settings from localStorage or fallback to user
 */
export function getGlobalReminderSettings(user = null) {
  let enabled = false;
  let time = '20:00';

  if (typeof window !== 'undefined' && window.localStorage) {
    const savedEnabled = localStorage.getItem(GLOBAL_REMINDER_STORAGE_KEY_ENABLED);
    const savedTime = localStorage.getItem(GLOBAL_REMINDER_STORAGE_KEY_TIME);
    if (savedEnabled !== null) {
      enabled = savedEnabled === 'true';
    } else if (user && typeof user.daily_reminder_enabled === 'boolean') {
      enabled = user.daily_reminder_enabled;
    }
    if (savedTime) {
      time = savedTime;
    } else if (user && user.daily_reminder_time) {
      time = user.daily_reminder_time;
    }
  } else if (user) {
    enabled = Boolean(user.daily_reminder_enabled);
    time = user.daily_reminder_time || '20:00';
  }

  return { enabled, time };
}

/**
 * Save global daily habit reminder settings locally
 */
export function saveGlobalReminderSettings({ enabled, time }) {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(GLOBAL_REMINDER_STORAGE_KEY_ENABLED, String(Boolean(enabled)));
    if (time) {
      localStorage.setItem(GLOBAL_REMINDER_STORAGE_KEY_TIME, String(time));
    }
  }
}

/**
 * Schedule or update the Global Daily Habit Reminder
 *
 * Rules:
 * - Separate unique ID: 999999 (zero conflict with habit reminders)
 * - Title: "HabitFlow — Daily Reminder"
 * - Body:
 *   If 0 completed: "Don't forget to complete your habits today! 💪"
 *   If some completed: "You're doing great! Complete your remaining habits today. 💪"
 *   If all completed: Cancel/skip today's notification
 */
export async function scheduleGlobalDailyReminder({
  enabled,
  time,
  habits = [],
  records = {},
  todayKey = '',
}) {
  if (!enabled || !time) {
    await cancelGlobalDailyReminder();
    return false;
  }

  const parsedTime = parseReminderTime(time);
  if (!parsedTime) {
    console.warn(`[NotificationService] Invalid global reminder time "${time}"`);
    return false;
  }

  // Check today's completion status
  const totalHabits = habits.length;
  let completedCount = 0;
  if (todayKey && totalHabits > 0) {
    completedCount = habits.filter((h) => Boolean(records[`${h.id}_${todayKey}`])).length;
  }

  // If ALL habits are completed today, skip/cancel reminder for today
  if (totalHabits > 0 && completedCount >= totalHabits) {
    console.log(`[NotificationService] All ${totalHabits} habits completed today! Skipping/cancelling Global Daily Reminder.`);
    await cancelGlobalDailyReminder();
    return false;
  }

  // Dynamic message based on progress
  let notificationBody = "Don't forget to complete your habits today! 💪";
  if (completedCount > 0) {
    notificationBody = "You're doing great! Complete your remaining habits today. 💪";
  }

  const nextDate = calculateNextScheduledDate(parsedTime.hour, parsedTime.minute);

  console.log(`[NotificationService] Preparing Global Daily Reminder:`, {
    notificationId: GLOBAL_REMINDER_NOTIFICATION_ID,
    time,
    displayTime: formatDisplayTime(time),
    nextOccurrenceLocal: nextDate.toLocaleString(),
    completedToday: `${completedCount}/${totalHabits}`,
    body: notificationBody,
  });

  if (isNativePlatform()) {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('[NotificationService] Notification permission not granted for global reminder.');
        return false;
      }

      await ensureNotificationChannel();

      // Cancel previous global notification
      await LocalNotifications.cancel({
        notifications: [{ id: GLOBAL_REMINDER_NOTIFICATION_ID }],
      }).catch(() => {});

      // Schedule daily recurring notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: GLOBAL_REMINDER_NOTIFICATION_ID,
            title: 'HabitFlow — Daily Reminder',
            body: notificationBody,
            channelId: REMINDERS_CHANNEL_ID,
            foreground: true,
            schedule: {
              on: {
                hour: parsedTime.hour,
                minute: parsedTime.minute,
                second: 0,
              },
              allowWhileIdle: true,
            },
            extra: {
              type: 'global_daily_reminder',
              time,
              scheduledAt: new Date().toISOString(),
              nextFireLocal: nextDate.toISOString(),
            },
          },
        ],
      });

      console.log(`[NotificationService] SUCCESS: Scheduled Global Daily Reminder:`, {
        notificationId: GLOBAL_REMINDER_NOTIFICATION_ID,
        time,
        nextTrigger: nextDate.toLocaleString(),
        body: notificationBody,
        channel: REMINDERS_CHANNEL_ID,
      });

      return true;
    } catch (err) {
      console.error('[NotificationService] ERROR scheduling global daily reminder:', err);
      return false;
    }
  } else {
    console.info(`[NotificationService] Web global daily reminder configured for ${time}: "${notificationBody}" (Next: ${nextDate.toLocaleString()})`);
    return true;
  }
}

/**
 * Cancel the global daily habit reminder notification
 */
export async function cancelGlobalDailyReminder() {
  console.log(`[NotificationService] Cancelling Global Daily Reminder (ID: ${GLOBAL_REMINDER_NOTIFICATION_ID})`);

  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: GLOBAL_REMINDER_NOTIFICATION_ID }],
      });
      console.log(`[NotificationService] SUCCESS: Cancelled Global Daily Reminder (ID: ${GLOBAL_REMINDER_NOTIFICATION_ID})`);
    } catch (err) {
      console.warn('[NotificationService] Failed to cancel global daily reminder:', err);
    }
  }
}

/**
 * Sync all active habits and global reminder
 */
export async function syncAllHabitReminders(habits = [], records = {}, todayKey = '', user = null) {
  console.log(`[NotificationService] syncAllHabitReminders: syncing ${habits.length} habits...`);

  if (isNativePlatform()) {
    await ensureNotificationChannel();
  }

  if (Array.isArray(habits)) {
    for (const habit of habits) {
      if (habit && habit.reminder_enabled && habit.reminder_time) {
        await scheduleHabitReminder(habit);
      }
    }
  }

  const globalSettings = getGlobalReminderSettings(user);
  if (globalSettings.enabled) {
    await scheduleGlobalDailyReminder({
      enabled: globalSettings.enabled,
      time: globalSettings.time,
      habits,
      records,
      todayKey,
    });
  }
}

/**
 * Utility: Send an immediate test notification to verify Android physical device alerts
 * Useful for diagnosing notification channels, sound, and banners.
 */
export async function sendTestNotification() {
  const testId = 777777;
  console.log('[NotificationService] Triggering immediate test notification...');

  if (isNativePlatform()) {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('[NotificationService] Test notification aborted: permission denied.');
        return false;
      }

      await ensureNotificationChannel();

      // Trigger 2 seconds from now
      const triggerTime = new Date(Date.now() + 2000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: testId,
            title: 'HabitFlow — Notification Test',
            body: '🎉 Notifications are working perfectly on your Android device!',
            channelId: REMINDERS_CHANNEL_ID,
            foreground: true,
            schedule: {
              at: triggerTime,
              allowWhileIdle: true,
            },
            extra: {
              type: 'test_notification',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      console.log(`[NotificationService] Test notification scheduled for: ${triggerTime.toLocaleTimeString()} (ID: ${testId})`);
      return true;
    } catch (err) {
      console.error('[NotificationService] Failed to send test notification:', err);
      return false;
    }
  } else {
    console.log('[NotificationService] Test notification triggered on Web.');
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('HabitFlow — Notification Test', {
        body: '🎉 Notifications are working on Web!',
      });
    }
    return true;
  }
}
