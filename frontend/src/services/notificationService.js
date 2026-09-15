import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Utility service to manage Android Local Notifications using @capacitor/local-notifications,
 * while safely operating in web browsers without errors.
 */

// Generate a deterministic 32-bit positive integer ID for each habit
export function getNotificationIdForHabit(habitId) {
  const num = parseInt(habitId, 10);
  if (!isNaN(num) && num > 0) {
    return num % 2147483647;
  }
  // Fallback string hash to 31-bit positive int
  let hash = 0;
  const str = String(habitId);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

/**
 * Checks whether native Capacitor features are available
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/**
 * Request notification permissions gracefully
 * Returns boolean indicating whether notifications can be shown
 */
export async function requestNotificationPermission() {
  if (isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return true;
      }
      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted';
    } catch (err) {
      console.warn('Capacitor LocalNotifications permission error:', err);
      return false;
    }
  } else {
    // Web fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          return true;
        }
        if (Notification.permission !== 'denied') {
          const result = await Notification.requestPermission();
          return result === 'granted';
        }
      } catch (err) {
        console.warn('Web Notification permission error:', err);
      }
    }
    return false;
  }
}

/**
 * Parse a time string (e.g. "08:30" or "18:00") into hour and minute
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
 * Schedule a daily recurring local notification for a habit
 */
export async function scheduleHabitReminder(habit) {
  if (!habit || !habit.id || !habit.reminder_enabled || !habit.reminder_time) {
    return false;
  }

  const parsedTime = parseReminderTime(habit.reminder_time);
  if (!parsedTime) {
    console.warn(`Invalid reminder_time "${habit.reminder_time}" for habit #${habit.id}`);
    return false;
  }

  const notifId = getNotificationIdForHabit(habit.id);

  if (isNativePlatform()) {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.info('Notification permission not granted. Reminder saved but notification not scheduled.');
        return false;
      }

      // First cancel any existing notification for this habit to prevent duplicates
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      }).catch(() => {});

      // Schedule daily notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: 'HabitFlow Reminder',
            body: `Time to complete: ${habit.name}`,
            schedule: {
              on: {
                hour: parsedTime.hour,
                minute: parsedTime.minute,
              },
              allowWhileIdle: true,
            },
            extra: {
              habitId: habit.id,
              habitName: habit.name,
              reminderTime: habit.reminder_time,
            },
          },
        ],
      });

      console.info(`Scheduled daily notification for "${habit.name}" at ${habit.reminder_time} (id: ${notifId})`);
      return true;
    } catch (err) {
      console.warn('Failed to schedule local notification:', err);
      return false;
    }
  } else {
    // On web, log info without crashing
    console.info(`Web reminder configured for "${habit.name}" at ${habit.reminder_time}`);
    return true;
  }
}

/**
 * Cancel a scheduled local notification for a habit
 */
export async function cancelHabitReminder(habitId) {
  if (!habitId) return;
  const notifId = getNotificationIdForHabit(habitId);

  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
      console.info(`Cancelled notification for habit #${habitId} (id: ${notifId})`);
    } catch (err) {
      console.warn(`Failed to cancel notification for habit #${habitId}:`, err);
    }
  }
}

/**
 * Reschedule habit reminder when time or enabled status changes
 */
export async function updateHabitReminder(habit) {
  if (!habit || !habit.id) return;

  if (habit.reminder_enabled && habit.reminder_time) {
    await scheduleHabitReminder(habit);
  } else {
    await cancelHabitReminder(habit.id);
  }
}

/**
 * Global Daily Habit Reminder Notification ID
 */
export const GLOBAL_REMINDER_NOTIFICATION_ID = 999999;

const GLOBAL_REMINDER_STORAGE_KEY_ENABLED = 'habitflow_global_reminder_enabled';
const GLOBAL_REMINDER_STORAGE_KEY_TIME = 'habitflow_global_reminder_time';

/**
 * Retrieve global daily habit reminder settings from localStorage or fallback
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
 * - Title: "HabitFlow — Daily Reminder"
 * - Body: "Don't forget to complete your habits today! 💪"
 *   If some habits are completed: "You're doing great! Complete your remaining habits today. 💪"
 *   If all habits are completed: Do NOT send the reminder / cancel notification for today.
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
    console.warn(`Invalid global reminder time "${time}"`);
    return false;
  }

  // Check today's completion status
  const totalHabits = habits.length;
  let completedCount = 0;
  if (todayKey && totalHabits > 0) {
    completedCount = habits.filter((h) => Boolean(records[`${h.id}_${todayKey}`])).length;
  }

  // If ALL habits are completed today, skip/cancel reminder
  if (totalHabits > 0 && completedCount >= totalHabits) {
    console.info('All habits completed today! Skipping global daily reminder.');
    await cancelGlobalDailyReminder();
    return false;
  }

  // Dynamic message based on progress
  let notificationBody = "Don't forget to complete your habits today! 💪";
  if (completedCount > 0) {
    notificationBody = "You're doing great! Complete your remaining habits today. 💪";
  }

  if (isNativePlatform()) {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.info('Notification permission not granted for global reminder.');
        return false;
      }

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
            schedule: {
              on: {
                hour: parsedTime.hour,
                minute: parsedTime.minute,
              },
              allowWhileIdle: true,
            },
            extra: {
              type: 'global_daily_reminder',
              time,
            },
          },
        ],
      });

      console.info(`Scheduled Global Daily Reminder at ${time} (id: ${GLOBAL_REMINDER_NOTIFICATION_ID})`);
      return true;
    } catch (err) {
      console.warn('Failed to schedule global reminder:', err);
      return false;
    }
  } else {
    console.info(`Web global daily reminder configured for ${time}: "${notificationBody}"`);
    return true;
  }
}

/**
 * Cancel the global daily habit reminder notification
 */
export async function cancelGlobalDailyReminder() {
  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: GLOBAL_REMINDER_NOTIFICATION_ID }],
      });
      console.info(`Cancelled Global Daily Reminder (id: ${GLOBAL_REMINDER_NOTIFICATION_ID})`);
    } catch (err) {
      console.warn('Failed to cancel global daily reminder:', err);
    }
  }
}

/**
 * Sync all active habits and global reminder
 */
export async function syncAllHabitReminders(habits = [], records = {}, todayKey = '', user = null) {
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

