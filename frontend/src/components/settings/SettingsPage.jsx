import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Check, 
  Sliders, 
  Database, 
  Zap, 
  Info,
  Bell,
  Clock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  getGlobalReminderSettings, 
  saveGlobalReminderSettings, 
  scheduleGlobalDailyReminder,
  requestNotificationPermission 
} from '../../services/notificationService';
import { updateUserProfile } from '../../services/api';

/**
 * SettingsPage - Professional SaaS Settings & Preferences with Light / Dark Mode Toggle & Global Reminder
 */
export default function SettingsPage() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { user } = useAuth();

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(() => {
    return getGlobalReminderSettings(user).enabled;
  });
  const [dailyReminderTime, setDailyReminderTime] = useState(() => {
    return getGlobalReminderSettings(user).time || '20:00';
  });

  useEffect(() => {
    const s = getGlobalReminderSettings(user);
    setDailyReminderEnabled(s.enabled);
    if (s.time) setDailyReminderTime(s.time);
  }, [user]);

  const handleToggleDailyReminder = async (e) => {
    const nextEnabled = e.target.checked;
    setDailyReminderEnabled(nextEnabled);
    saveGlobalReminderSettings({ enabled: nextEnabled, time: dailyReminderTime });

    if (nextEnabled) {
      await requestNotificationPermission();
    }

    await scheduleGlobalDailyReminder({
      enabled: nextEnabled,
      time: dailyReminderTime,
    });

    try {
      await updateUserProfile({
        daily_reminder_enabled: nextEnabled,
        daily_reminder_time: dailyReminderTime,
      });
    } catch {
      // safe fallback
    }
  };

  const handleTimeChange = async (e) => {
    const nextTime = e.target.value;
    setDailyReminderTime(nextTime);
    saveGlobalReminderSettings({ enabled: dailyReminderEnabled, time: nextTime });

    if (dailyReminderEnabled) {
      await scheduleGlobalDailyReminder({
        enabled: true,
        time: nextTime,
      });
    }

    try {
      await updateUserProfile({
        daily_reminder_enabled: dailyReminderEnabled,
        daily_reminder_time: nextTime,
      });
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="settings-dashboard-layout">
      {/* 1. Page Header */}
      <div className="settings-page-header">
        <div className="settings-header-left">
          <div className="settings-heading-row">
            <div className="settings-header-icon-box">
              <Settings size={20} />
            </div>
            <h2 className="settings-main-title">Settings & Preferences</h2>
          </div>
          <p className="settings-main-sub">Manage your application appearance and preferences</p>
        </div>
      </div>

      {/* 2. Appearance Section */}
      <div className="settings-card appearance-card">
        <div className="card-header-clean">
          <div className="card-title-icon-row">
            <Sliders size={18} className="theme-section-icon" />
            <h3 className="card-clean-title">Appearance</h3>
          </div>
          <p className="card-clean-sub">
            Customize how HabitFlow looks to you. Choose between Light and Dark themes.
          </p>
        </div>

        {/* Professional Segmented Theme Toggle */}
        <div className="appearance-segmented-wrap">
          <div className="appearance-segmented-toggle" role="radiogroup" aria-label="Theme selection">
            <button
              type="button"
              role="radio"
              aria-checked={!isDark}
              className={`segmented-theme-btn ${!isDark ? 'is-selected' : ''}`}
              onClick={() => setTheme('light')}
              id="btn-segmented-light"
            >
              <span className="segmented-emoji">☀️</span>
              <span className="segmented-label">Light</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isDark}
              className={`segmented-theme-btn ${isDark ? 'is-selected' : ''}`}
              onClick={() => setTheme('dark')}
              id="btn-segmented-dark"
            >
              <span className="segmented-emoji">🌙</span>
              <span className="segmented-label">Dark</span>
            </button>
          </div>
        </div>

        {/* Two Selectable Theme Cards */}
        <div className="theme-options-grid">
          {/* Light Mode Option Card */}
          <div
            className={`theme-selector-card ${!isDark ? 'is-selected' : ''}`}
            onClick={() => setTheme('light')}
            role="button"
            tabIndex={0}
            aria-pressed={!isDark}
            id="card-theme-light"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTheme('light');
            }}
          >
            <div className="theme-card-top">
              <div className="theme-icon-wrap icon-sun">
                <Sun size={24} />
              </div>
              <div className="theme-radio-indicator">
                {!isDark && <Check size={14} className="check-icon" />}
              </div>
            </div>

            <div className="theme-card-body">
              <div className="theme-title-row">
                <h4 className="theme-name">☀️ Light</h4>
                {!isDark && <span className="theme-active-badge">Active</span>}
              </div>
              <p className="theme-desc">
                Clean, soft neutral palette optimized for daytime productivity. (Default)
              </p>
            </div>

            {/* Visual Mini Mockup */}
            <div className="theme-preview-box preview-light">
              <div className="preview-mini-header" />
              <div className="preview-mini-content">
                <div className="preview-mini-sidebar" />
                <div className="preview-mini-cards">
                  <div className="preview-mini-card" />
                  <div className="preview-mini-card" />
                </div>
              </div>
            </div>
          </div>

          {/* Dark Mode Option Card */}
          <div
            className={`theme-selector-card ${isDark ? 'is-selected' : ''}`}
            onClick={() => setTheme('dark')}
            role="button"
            tabIndex={0}
            aria-pressed={isDark}
            id="card-theme-dark"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTheme('dark');
            }}
          >
            <div className="theme-card-top">
              <div className="theme-icon-wrap icon-moon">
                <Moon size={24} />
              </div>
              <div className="theme-radio-indicator">
                {isDark && <Check size={14} className="check-icon" />}
              </div>
            </div>

            <div className="theme-card-body">
              <div className="theme-title-row">
                <h4 className="theme-name">🌙 Dark</h4>
                {isDark && <span className="theme-active-badge badge-dark">Active</span>}
              </div>
              <p className="theme-desc">
                Deep navy and charcoal tones crafted for comfort in low-light environments.
              </p>
            </div>

            {/* Visual Mini Mockup */}
            <div className="theme-preview-box preview-dark">
              <div className="preview-mini-header" />
              <div className="preview-mini-content">
                <div className="preview-mini-sidebar" />
                <div className="preview-mini-cards">
                  <div className="preview-mini-card" />
                  <div className="preview-mini-card" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Toggle Switch Bar */}
        <div className="theme-switch-bar">
          <div className="theme-switch-info">
            <span className="switch-info-title">Current Selection</span>
            <span className="switch-info-desc">
              Theme is currently set to <strong>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</strong>
            </span>
          </div>

          <button
            type="button"
            className="theme-quick-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            <span className={`toggle-icon-pill ${!isDark ? 'active-pill' : ''}`}>
              <Sun size={15} />
              <span>☀️ Light</span>
            </span>
            <span className={`toggle-icon-pill ${isDark ? 'active-pill' : ''}`}>
              <Moon size={15} />
              <span>🌙 Dark</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. Daily Habit Reminder Settings Card */}
      <div className="settings-card reminder-settings-card">
        <div className="card-header-clean">
          <div className="card-title-icon-row">
            <Bell size={18} className="theme-section-icon" color="#6366f1" />
            <h3 className="card-clean-title">Daily Habit Reminder</h3>
          </div>
          <p className="card-clean-sub">
            Receive a single daily Android notification reminding you to complete your daily habits.
          </p>
        </div>

        <div className="settings-reminder-panel">
          <div className="settings-reminder-toggle-row">
            <div className="settings-reminder-text">
              <span className="settings-reminder-label">Enable Daily Reminder</span>
              <span className="settings-reminder-hint">
                {dailyReminderEnabled ? `Active daily alert at ${dailyReminderTime}` : 'Disabled — no daily reminder alert'}
              </span>
            </div>
            <label className="switch-toggle" htmlFor="settings-daily-reminder-toggle">
              <input
                id="settings-daily-reminder-toggle"
                type="checkbox"
                checked={dailyReminderEnabled}
                onChange={handleToggleDailyReminder}
                aria-label="Toggle Daily Habit Reminder"
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-reminder-time-row">
            <div className="settings-time-label-group">
              <Clock size={16} className="text-indigo" />
              <span className="settings-time-label">Reminder Time:</span>
            </div>
            <div className="settings-time-input-box">
              <input
                type="time"
                value={dailyReminderTime}
                onChange={handleTimeChange}
                className="form-input settings-time-input"
                aria-label="Daily reminder time"
              />
            </div>
          </div>

          <div className="settings-reminder-footer">
            <span className={`daily-status-badge ${dailyReminderEnabled ? 'status-enabled' : 'status-disabled'}`}>
              {dailyReminderEnabled ? 'Daily Notification Scheduled' : 'Notifications Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. System & Application Configuration Card */}
      <div className="settings-card config-card">
        <div className="card-header-clean">
          <div className="card-title-icon-row">
            <Info size={18} className="theme-section-icon" />
            <h3 className="card-clean-title">Application Config</h3>
          </div>
          <p className="card-clean-sub">System architecture and runtime details</p>
        </div>

        <div className="config-items-list">
          <div className="config-row-item">
            <div className="config-item-left">
              <div className="config-icon-box icon-emerald">
                <Zap size={16} />
              </div>
              <div>
                <span className="config-item-name">Streak Calculation</span>
                <span className="config-item-detail">Graceful timezone-aware consecutive days</span>
              </div>
            </div>
            <span className="config-badge badge-emerald">Active</span>
          </div>

          <div className="config-row-item">
            <div className="config-item-left">
              <div className="config-icon-box icon-blue">
                <Database size={16} />
              </div>
              <div>
                <span className="config-item-name">Backend Database</span>
                <span className="config-item-detail">SQLite + FastAPI asynchronous engine</span>
              </div>
            </div>
            <span className="config-badge badge-blue">Connected</span>
          </div>

          <div className="config-row-item">
            <div className="config-item-left">
              <div className="config-icon-box icon-slate">
                <Info size={16} />
              </div>
              <div>
                <span className="config-item-name">HabitFlow Version</span>
                <span className="config-item-detail">Modern SaaS reference edition</span>
              </div>
            </div>
            <span className="config-version-text">v2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
