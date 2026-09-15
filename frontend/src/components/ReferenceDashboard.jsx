import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  CheckCircle2, 
  Flame, 
  Bell, 
  Calendar as CalendarIcon, 
  Plus, 
  ArrowRight, 
  Check, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Target, 
  Sun, 
  Moon,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import HabitCard from './HabitCard';
import CircularProgress from './CircularProgress';
import WeeklyBarChart from './WeeklyBarChart';
import { formatDateKey, calculateStreak, parseHabitGoal } from '../utils/dateUtils';
import { 
  formatDisplayTime, 
  getGlobalReminderSettings, 
  saveGlobalReminderSettings, 
  scheduleGlobalDailyReminder,
  requestNotificationPermission
} from '../services/notificationService';
import { updateUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ReferenceDashboard({
  habits = [],
  records = {},
  todayKey = '',
  pastDays = [],
  onToggleToday,
  onDeleteHabit,
  onSelectHabit,
  onOpenAddModal,
  user,
  setActiveView,
  togglingIds = {}
}) {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const today = useMemo(() => new Date(), []);
  const todayStr = todayKey || formatDateKey(today);
  const [searchQuery, setSearchQuery] = useState('');

  // Global daily habit reminder state
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(() => {
    const settings = getGlobalReminderSettings(user);
    return settings.enabled;
  });
  const [dailyReminderTime, setDailyReminderTime] = useState(() => {
    const settings = getGlobalReminderSettings(user);
    return settings.time || '20:00';
  });

  // Reminders overview modal state
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    const settings = getGlobalReminderSettings(user);
    setDailyReminderEnabled(settings.enabled);
    if (settings.time) {
      setDailyReminderTime(settings.time);
    }
  }, [user]);

  // Live filter for habits search
  const displayedHabits = useMemo(() => {
    if (!searchQuery.trim()) return habits;
    const q = searchQuery.toLowerCase();
    return habits.filter((h) => 
      h.name.toLowerCase().includes(q) || 
      (h.description && h.description.toLowerCase().includes(q))
    );
  }, [habits, searchQuery]);

  // Profile dropdown state & click outside handler
  const [profileOpen, setProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  // Selected habit for details
  const [inspectedHabitId, setInspectedHabitId] = useState(() => habits[0]?.id || null);
  const activeHabit = useMemo(() => {
    return habits.find((h) => h.id === inspectedHabitId) || habits[0] || null;
  }, [habits, inspectedHabitId]);

  // Authenticated user display initial & info
  const userInitial = useMemo(() => {
    if (user?.name && user.name.trim()) {
      return user.name.trim().charAt(0).toUpperCase();
    }
    if (user?.email && user.email.trim()) {
      return user.email.trim().charAt(0).toUpperCase();
    }
    return 'U';
  }, [user]);

  // Greeting: "Good morning, <name> 👋" or evening/afternoon based on hour
  const { greetingText, subtitleText } = useMemo(() => {
    const hour = today.getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17) {
      timeGreeting = 'Good evening';
    }

    const firstName = user?.name ? user.name.trim().split(' ')[0] : 'there';
    return {
      greetingText: `${timeGreeting}, ${firstName} 👋`,
      subtitleText: "Let's build better habits today.",
    };
  }, [today, user]);

  const formattedToday = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [today]);

  // ---------------------------------------------------------------------------
  // KPI STATS - Real data from backend
  // ---------------------------------------------------------------------------
  const totalHabitsCount = habits.length;

  const completedTodayCount = useMemo(() => {
    return habits.filter((h) => Boolean(records[`${h.id}_${todayStr}`])).length;
  }, [habits, records, todayStr]);

  const todayRatePct = useMemo(() => {
    return totalHabitsCount > 0
      ? Math.min(100, Math.round((completedTodayCount / totalHabitsCount) * 100))
      : 0;
  }, [completedTodayCount, totalHabitsCount]);

  const todayLeftCount = Math.max(0, totalHabitsCount - completedTodayCount);

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => calculateStreak(h.id, records)), 0);
  }, [habits, records]);

  // Overall progress
  const { totalGoalDays, totalCompletedDays, overallProgressPct } = useMemo(() => {
    if (habits.length === 0) {
      return { totalGoalDays: 0, totalCompletedDays: 0, overallProgressPct: 0 };
    }

    let sumGoal = 0;
    let sumCompleted = 0;

    habits.forEach((h) => {
      const g = parseHabitGoal(h.description);
      const c = Object.entries(records).filter(
        ([key, val]) => key.startsWith(`${h.id}_`) && Boolean(val)
      ).length;
      sumGoal += g;
      sumCompleted += c;
    });

    const pct = sumGoal > 0 ? Math.min(100, Math.round((sumCompleted / sumGoal) * 100)) : 0;
    return {
      totalGoalDays: sumGoal,
      totalCompletedDays: sumCompleted,
      overallProgressPct: pct,
    };
  }, [habits, records]);

  // ---------------------------------------------------------------------------
  // UPCOMING HABIT REMINDER - Dynamic calculation
  // ---------------------------------------------------------------------------
  const nextReminder = useMemo(() => {
    const habitsWithReminders = habits.filter(h => h.reminder_enabled && h.reminder_time);
    if (habitsWithReminders.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const mapped = habitsWithReminders.map(h => {
      const parts = (h.reminder_time || '').split(':').map(Number);
      const reminderMinutes = (parts[0] || 0) * 60 + (parts[1] || 0);
      return {
        ...h,
        reminderMinutes,
        diff: reminderMinutes - currentMinutes,
      };
    });

    const remainingToday = mapped.filter(m => m.diff >= 0).sort((a, b) => a.diff - b.diff);
    if (remainingToday.length > 0) {
      return {
        habitName: remainingToday[0].name,
        time: formatDisplayTime(remainingToday[0].reminder_time),
        subtext: 'Today',
      };
    }

    const earliestTomorrow = mapped.sort((a, b) => a.reminderMinutes - b.reminderMinutes)[0];
    return {
      habitName: earliestTomorrow.name,
      time: formatDisplayTime(earliestTomorrow.reminder_time),
      subtext: 'Tomorrow',
    };
  }, [habits]);

  // Total active individual reminders count
  const activeRemindersCount = useMemo(() => {
    return habits.filter(h => h.reminder_enabled && h.reminder_time).length;
  }, [habits]);

  // ---------------------------------------------------------------------------
  // GLOBAL DAILY REMINDER HANDLERS
  // ---------------------------------------------------------------------------
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
      habits,
      records,
      todayKey: todayStr,
    });

    // Sync to backend user profile if authenticated
    try {
      await updateUserProfile({
        daily_reminder_enabled: nextEnabled,
        daily_reminder_time: dailyReminderTime,
      });
    } catch {
      // Offline fallback safe
    }
  };

  const handleDailyReminderTimeChange = async (e) => {
    const nextTime = e.target.value;
    setDailyReminderTime(nextTime);
    saveGlobalReminderSettings({ enabled: dailyReminderEnabled, time: nextTime });

    if (dailyReminderEnabled) {
      await scheduleGlobalDailyReminder({
        enabled: true,
        time: nextTime,
        habits,
        records,
        todayKey: todayStr,
      });
    }

    try {
      await updateUserProfile({
        daily_reminder_enabled: dailyReminderEnabled,
        daily_reminder_time: nextTime,
      });
    } catch {
      // Offline fallback safe
    }
  };

  // ---------------------------------------------------------------------------
  // RECENT ACTIVITY LIST
  // ---------------------------------------------------------------------------
  const recentActivityList = useMemo(() => {
    const list = [];
    Object.keys(records).forEach((key) => {
      if (Boolean(records[key])) {
        const underscoreIdx = key.lastIndexOf('_');
        if (underscoreIdx > -1) {
          const habitId = key.substring(0, underscoreIdx);
          const dateKey = key.substring(underscoreIdx + 1);

          const habit = habits.find((h) => String(h.id) === String(habitId));
          if (habit && dateKey <= todayStr) {
            list.push({
              habitId: habit.id,
              habitName: habit.name,
              dateKey,
            });
          }
        }
      }
    });

    const uniqueMap = new Map();
    list.forEach((item) => {
      const uKey = `${item.habitId}_${item.dateKey}`;
      if (!uniqueMap.has(uKey)) {
        uniqueMap.set(uKey, item);
      }
    });

    const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    return sorted.map((item) => {
      const [y, m, d] = item.dateKey.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return {
        id: `${item.habitId}_${item.dateKey}`,
        habitName: item.habitName,
        dateFormatted: formattedDate,
        status: 'Completed',
      };
    });
  }, [records, habits, todayStr]);

  return (
    <div className="reference-dashboard-layout" id="habitflow-reference-dashboard">
      {/* ===================================================================== */}
      {/* 1. DESKTOP HEADER (Properly aligned & vertically centered)            */}
      {/* ===================================================================== */}
      <header className="ref-dashboard-header desktop-header-only">
        <div className="ref-header-left">
          <div className="ref-header-title-block">
            <h1 className="ref-dashboard-title">{greetingText}</h1>
            <p className="ref-dashboard-subtitle">{subtitleText}</p>
          </div>
        </div>

        {/* Right: Search → Add Habit → Date → Notification → Theme → Profile */}
        <div className="ref-header-right">
          <div className="ref-search-box">
            <Search size={15} className="ref-search-icon" />
            <input 
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ref-search-input"
              aria-label="Search habits"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="ref-search-clear-btn" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button 
            type="button" 
            className="ref-header-add-btn" 
            onClick={onOpenAddModal}
            id="btn-add-habit-top-header"
            title="Add a new habit"
          >
            <Plus size={16} />
            <span>Add Habit</span>
          </button>

          <div className="ref-date-pill">
            <CalendarIcon size={14} className="ref-pill-icon" />
            <span>{formattedToday}</span>
          </div>

          <button 
            type="button"
            className="ref-bell-btn header-bell-btn"
            onClick={() => setRemindersModalOpen(true)}
            title="Habit Reminders"
            aria-label="Habit Reminders"
            id="btn-desktop-header-bell"
          >
            <Bell size={17} />
            {(activeRemindersCount > 0 || dailyReminderEnabled) && (
              <span className="ref-bell-dot" />
            )}
          </button>

          <button 
            type="button"
            className="ref-theme-toggle-header-btn" 
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            id="btn-header-theme-toggle"
          >
            {isDark ? <Sun size={17} className="theme-toggle-sun" /> : <Moon size={17} className="theme-toggle-moon" />}
          </button>

          <div className="ref-profile-dropdown-wrapper" ref={profileDropdownRef}>
            <button
              type="button"
              className="ref-user-avatar-btn"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="User profile menu"
              aria-expanded={profileOpen}
              title={user?.name || user?.email || 'User Account'}
              id="btn-top-profile-avatar"
            >
              <span>{userInitial}</span>
            </button>

            {profileOpen && (
              <div className="ref-profile-menu" role="menu">
                <div className="ref-profile-menu-user-info">
                  <div className="ref-profile-menu-avatar">
                    <span>{userInitial}</span>
                  </div>
                  <div className="ref-profile-menu-text">
                    <span className="ref-menu-user-name">{user?.name || 'HabitFlow User'}</span>
                    <span className="ref-menu-user-email">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>

                <div className="ref-menu-divider" />

                <button
                  type="button"
                  className="ref-menu-item"
                  onClick={() => {
                    setProfileOpen(false);
                    if (setActiveView) setActiveView('profile');
                  }}
                  role="menuitem"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="ref-menu-item"
                  onClick={() => {
                    setProfileOpen(false);
                    if (setActiveView) setActiveView('settings');
                  }}
                  role="menuitem"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <div className="ref-menu-divider" />

                <button
                  type="button"
                  className="ref-menu-item ref-menu-logout"
                  onClick={() => {
                    setProfileOpen(false);
                    if (window.confirm("Are you sure you want to log out?")) {
                      logout();
                    }
                  }}
                  role="menuitem"
                  id="btn-dropdown-logout"
                >
                  <LogOut size={16} color="#ef4444" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MOBILE TOP GREETING (Visible on screen widths <= 768px)             */}
      {/* ===================================================================== */}
      <div className="mobile-greeting-hero mobile-only-block">
        <h1 className="mobile-greeting-title">{greetingText}</h1>
        <p className="mobile-greeting-subtitle">{subtitleText}</p>
      </div>

      {/* ===================================================================== */}
      {/* 3. FOUR KPI SUMMARY CARDS (One unified responsive grid)                */}
      {/* Desktop: 4 equal cards in 1 row. Mobile: 2x2 grid.                     */}
      {/* ===================================================================== */}
      <div className="kpi-summary-grid" id="kpi-summary-grid">
        {/* Card 1: Total Habits */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-blue">
              <LayoutGrid size={17} />
            </div>
            <span className="kpi-card-label">Total Habits</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">{totalHabitsCount}</span>
          </div>
        </div>

        {/* Card 2: Completed Today */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-green">
              <CheckCircle2 size={17} />
            </div>
            <span className="kpi-card-label">Completed Today</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">
              {completedTodayCount} <span className="kpi-sub-fraction">/{totalHabitsCount}</span>
            </span>
          </div>
        </div>

        {/* Card 3: Overall Progress */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-emerald">
              <CircularProgress 
                percentage={overallProgressPct} 
                size={20} 
                strokeWidth={3} 
                showValue={false} 
                color="#10b981" 
              />
            </div>
            <span className="kpi-card-label">Overall Progress</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">{overallProgressPct}%</span>
          </div>
        </div>

        {/* Card 4: Current Streak */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-orange">
              <Flame size={17} />
            </div>
            <span className="kpi-card-label">Current Streak</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. MAIN 2-COLUMN DASHBOARD GRID                                       */}
      {/* Desktop: Left: Habits + Weekly Progress; Right: Progress + Reminders  */}
      {/* Mobile: 1 Column stacked in natural order                              */}
      {/* ===================================================================== */}
      <div className="dashboard-main-two-col-layout">
        {/* LEFT / MAIN AREA */}
        <section className="dashboard-left-main-area">
          {/* Section Header */}
          <div className="section-header-row">
            <div className="section-title-wrap">
              <h2 className="section-heading">Today's Habits</h2>
              <span className="section-count-badge">{habits.length} Active</span>
            </div>
            <button 
              type="button"
              onClick={onOpenAddModal} 
              className="add-habit-btn-primary desktop-only-inline"
              id="btn-add-habit-main"
            >
              <Plus size={16} />
              <span>Add Habit</span>
            </button>
          </div>

          {/* Habit Cards Grid */}
          <div className="habits-desktop-4col-grid">
            {displayedHabits.length === 0 ? (
              <div className="no-habits-empty-card card-elevated">
                <Target size={36} color="#6366f1" />
                <h3>{searchQuery ? `No habits match "${searchQuery}"` : "No Habits Created Yet"}</h3>
                <p>{searchQuery ? "Try a different search term" : "Start your consistency journey by creating your first daily habit."}</p>
                {!searchQuery && (
                  <button 
                    type="button"
                    onClick={onOpenAddModal} 
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    <Plus size={16} /> Add First Habit
                  </button>
                )}
              </div>
            ) : (
              displayedHabits.map((habit, idx) => (
                <div 
                  key={habit.id} 
                  onClick={() => setInspectedHabitId(habit.id)}
                  className={`habit-card-slot ${activeHabit?.id === habit.id ? 'is-active-inspected' : ''}`}
                >
                  <HabitCard
                    habit={habit}
                    index={idx}
                    records={records}
                    todayKey={todayStr}
                    pastDays={pastDays}
                    onToggleToday={onToggleToday}
                    onDelete={onDeleteHabit}
                    onSelectHabit={onSelectHabit}
                    isToggling={Boolean(togglingIds[habit.id])}
                  />
                </div>
              ))
            )}
          </div>

          {/* Subrow: Weekly Progress (Left) + Recent Activity (Right) */}
          <div className="dashboard-subrow-layout">
            <div className="dashboard-card weekly-progress-card">
              <WeeklyBarChart 
                habits={habits}
                records={records}
                todayKey={todayStr}
              />
            </div>

            <div className="dashboard-card recent-activity-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Recent Activity</h3>
                {setActiveView && (
                  <button 
                    type="button"
                    onClick={() => setActiveView('calendar')} 
                    className="card-link-btn"
                  >
                    View Calendar →
                  </button>
                )}
              </div>

              <div className="table-responsive-wrapper">
                <table className="recent-activity-table">
                  <thead>
                    <tr>
                      <th>Habit</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivityList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-activity-cell">
                          No completed records yet. Mark a habit as completed to see recent activity!
                        </td>
                      </tr>
                    ) : (
                      recentActivityList.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td className="activity-habit-cell">
                            <div className="habit-mini-avatar">
                              {item.habitName.charAt(0).toUpperCase()}
                            </div>
                            <span className="activity-habit-name">{item.habitName}</span>
                          </td>
                          <td className="activity-date-cell">{item.dateFormatted}</td>
                          <td className="activity-status-cell">
                            <span className="status-badge-done">
                              <Check size={12} strokeWidth={3} />
                              <span>Completed</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT / SIDEBAR AREA (Compact & perfectly aligned) */}
        <aside className="dashboard-right-sidebar-area">
          {/* Card 1: Today's Progress */}
          <div className="dashboard-card today-progress-card">
            <div className="stats-card-header">
              <div className="stats-header-titles">
                <h3 className="dashboard-card-title">Today's Progress</h3>
                <span className="today-fraction-badge">
                  {completedTodayCount} / {totalHabitsCount}
                </span>
              </div>
            </div>

            <div className="today-progress-body">
              <div className="today-circular-wrap">
                <CircularProgress
                  percentage={todayRatePct}
                  size={70}
                  strokeWidth={6.5}
                  color="#2563eb"
                  trackColor="#1e293b"
                  fontSize={15}
                />
              </div>

              <div className="today-metrics-col">
                <div className="today-stat-row">
                  <div className="today-stat-row-left">
                    <span className="today-stat-dot dot-completed-blue" />
                    <span className="today-stat-label">Completed</span>
                  </div>
                  <strong className="today-stat-val text-blue">{completedTodayCount}</strong>
                </div>
                <div className="today-stat-row">
                  <div className="today-stat-row-left">
                    <span className="today-stat-dot dot-left-amber" />
                    <span className="today-stat-label">Left</span>
                  </div>
                  <strong className="today-stat-val text-amber">{todayLeftCount}</strong>
                </div>
                <div className="today-stat-row">
                  <div className="today-stat-row-left">
                    <span className="today-stat-dot dot-total-slate" />
                    <span className="today-stat-label">Total</span>
                  </div>
                  <strong className="today-stat-val text-slate">{totalHabitsCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Overall Progress */}
          <div className="dashboard-card goal-progress-card">
            <div className="stats-card-header">
              <div className="stats-header-titles">
                <h3 className="dashboard-card-title">Overall Progress</h3>
                <span className="overall-pct-badge">{overallProgressPct}%</span>
              </div>
            </div>

            <div className="goal-metrics-grid">
              <div className="goal-metric-box">
                <span className="goal-box-label">Total Goal</span>
                <strong className="goal-box-val">{totalGoalDays}</strong>
              </div>
              <div className="goal-metric-box">
                <span className="goal-box-label">Completed</span>
                <strong className="goal-box-val val-emerald">{totalCompletedDays}</strong>
              </div>
              <div className="goal-metric-box">
                <span className="goal-box-label">Left</span>
                <strong className="goal-box-val val-muted">{Math.max(0, totalGoalDays - totalCompletedDays)}</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Redesigned HABIT REMINDERS Card */}
          <div className="dashboard-card reminders-dashboard-card" id="card-habit-reminders">
            <div className="stats-card-header">
              <div className="stats-header-titles">
                <div className="reminders-card-title-wrap">
                  <Bell size={16} className="reminders-header-bell" />
                  <h3 className="dashboard-card-title">Habit Reminders</h3>
                </div>
                <span className="reminders-status-pill">
                  {dailyReminderEnabled ? 'Active' : 'Standby'}
                </span>
              </div>
            </div>

            <div className="reminders-card-content">
              {/* Section 1: Next Reminder */}
              <div className="reminders-item-block">
                <span className="reminders-sub-heading">Next reminder</span>
                {nextReminder ? (
                  <div className="next-reminder-row">
                    <span className="next-reminder-name">{nextReminder.habitName}</span>
                    <span className="next-reminder-time-pill">
                      <Clock size={12} />
                      <span>{nextReminder.time}</span>
                    </span>
                  </div>
                ) : (
                  <div className="no-reminder-text-block">
                    <p className="no-reminder-main">No reminders scheduled</p>
                    <p className="no-reminder-sub">Set a reminder while creating or editing a habit.</p>
                  </div>
                )}
              </div>

              <div className="reminders-card-divider" />

              {/* Section 2: Global Daily Habit Reminder */}
              <div className="reminders-item-block">
                <div className="daily-reminder-header-row">
                  <div>
                    <span className="reminders-sub-heading">Daily reminder</span>
                    <p className="daily-reminder-subtext">Complete all your habits</p>
                  </div>
                  <label className="switch-toggle" htmlFor="dash-daily-reminder-toggle">
                    <input
                      id="dash-daily-reminder-toggle"
                      type="checkbox"
                      checked={dailyReminderEnabled}
                      onChange={handleToggleDailyReminder}
                      aria-label="Toggle Daily Habit Reminder"
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                <div className="daily-reminder-controls-row">
                  <div className="daily-time-input-wrap">
                    <Clock size={13} className="time-clock-icon" />
                    <input
                      type="time"
                      value={dailyReminderTime}
                      onChange={handleDailyReminderTimeChange}
                      className="daily-time-picker-field"
                      aria-label="Daily reminder time"
                    />
                  </div>
                  <span className={`daily-status-badge ${dailyReminderEnabled ? 'status-enabled' : 'status-disabled'}`}>
                    {dailyReminderEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Add Habit Action Button for Mobile */}
      <button 
        type="button"
        className="mobile-floating-add-btn mobile-only-block"
        onClick={onOpenAddModal}
        aria-label="Add Habit"
        id="btn-mobile-floating-add"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Reminders Overview Modal (Accessible from Bell in Header) */}
      {remindersModalOpen && (
        <div className="modal-overlay" onClick={() => setRemindersModalOpen(false)}>
          <div 
            className="modal-container mobile-reminders-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-wrap box-purple">
                  <Bell size={20} color="#6366f1" />
                </div>
                <div>
                  <h2 className="modal-title">Habit Reminders</h2>
                  <p className="modal-sub">Scheduled Daily & Individual Notifications</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setRemindersModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="reminders-modal-body">
              {/* Daily Reminder Box */}
              <div className="modal-daily-reminder-card">
                <div className="modal-daily-reminder-top">
                  <div>
                    <h4 className="modal-reminder-card-title">Daily Habit Reminder</h4>
                    <p className="modal-reminder-card-sub">Daily check-in alert for all habits</p>
                  </div>
                  <label className="switch-toggle" htmlFor="modal-daily-reminder-toggle">
                    <input
                      id="modal-daily-reminder-toggle"
                      type="checkbox"
                      checked={dailyReminderEnabled}
                      onChange={handleToggleDailyReminder}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
                <div className="modal-daily-reminder-bottom">
                  <div className="time-input-wrap">
                    <Clock size={15} />
                    <input
                      type="time"
                      value={dailyReminderTime}
                      onChange={handleDailyReminderTimeChange}
                      className="form-input reminder-time-input"
                    />
                  </div>
                  <span className={`daily-status-badge ${dailyReminderEnabled ? 'status-enabled' : 'status-disabled'}`}>
                    {dailyReminderEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Individual Habit Reminders List */}
              <h4 className="modal-reminders-list-title">Individual Habit Reminders</h4>
              {habits.filter(h => h.reminder_enabled && h.reminder_time).length === 0 ? (
                <div className="no-reminders-empty">
                  <Clock size={32} color="#64748b" />
                  <h4>No individual reminders</h4>
                  <p>Enable reminders while adding or editing habits to receive specific alerts.</p>
                </div>
              ) : (
                <div className="active-reminders-list">
                  {habits.filter(h => h.reminder_enabled && h.reminder_time).map(h => (
                    <div key={h.id} className="active-reminder-row">
                      <div className="reminder-habit-info">
                        <span className="reminder-habit-title">{h.name}</span>
                        <span className="reminder-habit-schedule">Daily at {formatDisplayTime(h.reminder_time)}</span>
                      </div>
                      <div className="reminder-time-chip">
                        <Clock size={13} />
                        <span>{formatDisplayTime(h.reminder_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-full-width"
                onClick={() => setRemindersModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
