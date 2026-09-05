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
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  Target,
  ChevronDown,
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import HabitCard from './HabitCard';
import CircularProgress from './CircularProgress';
import WeeklyBarChart from './WeeklyBarChart';
import { formatDateKey, calculateStreak, parseHabitGoal, getCleanDescription } from '../utils/dateUtils';
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
  onOpenSidebar,
  togglingIds = {}
}) {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const today = useMemo(() => new Date(), []);
  const todayStr = todayKey || formatDateKey(today);
  const [searchQuery, setSearchQuery] = useState('');

  // Live filter for habits search
  const displayedHabits = useMemo(() => {
    if (!searchQuery.trim()) return habits;
    const q = searchQuery.toLowerCase();
    return habits.filter((h) => 
      h.name.toLowerCase().includes(q) || 
      (h.description && h.description.toLowerCase().includes(q))
    );
  }, [habits, searchQuery]);

  // Profile dropdown state & ref for click outside
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

  // Selected habit for right-column Goal & Progress card
  const [inspectedHabitId, setInspectedHabitId] = useState(() => habits[0]?.id || null);

  const activeHabit = useMemo(() => {
    return habits.find((h) => h.id === inspectedHabitId) || habits[0] || null;
  }, [habits, inspectedHabitId]);

  // Authenticated user display initial & info (never hardcoded, defaults to 'K')
  const userInitial = useMemo(() => {
    if (user?.name && user.name.trim()) {
      return user.name.trim().charAt(0).toUpperCase();
    }
    if (user?.email && user.email.trim()) {
      return user.email.trim().charAt(0).toUpperCase();
    }
    return 'K';
  }, [user]);

  const formattedToday = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [today]);

  // ---------------------------------------------------------------------------
  // 1. KPI SUMMARY METRICS (Row 1) - Real data from SQLite database
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

  // Overall progress = total completed days across all active habits / total goal days
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
  // 2. INSPECTED HABIT GOAL & PROGRESS (Row 2 Right Section)
  // ---------------------------------------------------------------------------
  const activeHabitStats = useMemo(() => {
    if (!activeHabit) {
      return { goal: 0, completed: 0, left: 0, percentage: 0, name: 'No Habits' };
    }

    const goal = parseHabitGoal(activeHabit.description);
    const completed = Object.entries(records).filter(
      ([key, val]) => key.startsWith(`${activeHabit.id}_`) && Boolean(val)
    ).length;
    const left = Math.max(0, goal - completed);
    const percentage = goal > 0 ? Math.min(100, Math.round((completed / goal) * 100)) : 0;

    return {
      goal,
      completed,
      left,
      percentage,
      name: activeHabit.name
    };
  }, [activeHabit, records]);

  // ---------------------------------------------------------------------------
  // 3. RECENT ACTIVITY LIST (Row 3 Right Section) - Real database completions
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
          // Filter to active habits and non-future dates
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

    // Deduplicate unique (habitId + dateKey)
    const uniqueMap = new Map();
    list.forEach((item) => {
      const uKey = `${item.habitId}_${item.dateKey}`;
      if (!uniqueMap.has(uKey)) {
        uniqueMap.set(uKey, item);
      }
    });

    // Sort newest date first
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
      {/* 1. DASHBOARD HEADER                                                  */}
      {/* ===================================================================== */}
      <header className="ref-dashboard-header">
        <div className="ref-header-left">
          {onOpenSidebar && (
            <button 
              className="ref-mobile-menu-btn" 
              onClick={onOpenSidebar}
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>
          )}
          <div className="ref-header-title-block">
            <h1 className="ref-dashboard-title">Habit Tracker</h1>
            <p className="ref-dashboard-subtitle">Track Today. Build a Better Tomorrow.</p>
          </div>
        </div>

        {/* Top Right Controls: Search, Add Habit, Date, Notification, Interactive Profile Dropdown */}
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
            <CalendarIcon size={15} className="ref-pill-icon" />
            <span>{formattedToday}</span>
          </div>

          <button 
            type="button"
            className="ref-bell-btn" 
            title="Notifications" 
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="ref-bell-dot" />
          </button>

          {/* Sun / Moon Quick Header Toggle */}
          <button 
            type="button"
            className="ref-theme-toggle-header-btn" 
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            id="btn-header-theme-toggle"
          >
            {isDark ? <Sun size={18} className="theme-toggle-sun" /> : <Moon size={18} className="theme-toggle-moon" />}
          </button>

          {/* Circular Profile Button with Dropdown */}
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
                {/* User Session Info Header */}
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

                {/* Navigation Options */}
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

                <button
                  type="button"
                  className="ref-menu-item ref-menu-theme-toggle"
                  onClick={() => {
                    toggleTheme();
                  }}
                  role="menuitem"
                  id="btn-dropdown-theme-toggle"
                  title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                >
                  <div className="ref-theme-item-left">
                    {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="ref-theme-badge">{isDark ? 'Dark' : 'Light'}</span>
                </button>

                <div className="ref-menu-divider" />

                {/* Logout Option */}
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

      {/* Subtle Horizontal Divider below the heading/subtitle area */}
      <div className="ref-header-horizontal-divider" />

      {/* ===================================================================== */}
      {/* ROW 1: FOUR SUMMARY CARDS (TOTAL, COMPLETED TODAY, PROGRESS, STREAK)   */}
      {/* ===================================================================== */}
      <div className="kpi-summary-grid">
        {/* KPI 1: Total Habits */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-blue">
              <LayoutGrid size={18} />
            </div>
            <span className="kpi-card-label">Total Habits</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">{totalHabitsCount}</span>
          </div>
        </div>

        {/* KPI 2: Completed Today */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-green">
              <CheckCircle2 size={18} />
            </div>
            <span className="kpi-card-label">Completed Today</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">
              {completedTodayCount} <span className="kpi-sub-fraction">/{totalHabitsCount}</span>
            </span>
          </div>
        </div>

        {/* KPI 3: Overall Progress */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-emerald">
              <CircularProgress 
                percentage={overallProgressPct} 
                size={22} 
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

        {/* KPI 4: Current Streak */}
        <div className="dashboard-card kpi-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-box box-orange">
              <Flame size={18} />
            </div>
            <span className="kpi-card-label">Current Streak</span>
          </div>
          <div className="kpi-card-bottom">
            <span className="kpi-card-val">{currentStreak} Days</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN TWO-COLUMN DASHBOARD GRID (LEFT: HABITS + SUBROW; RIGHT: STATS) */}
      {/* ===================================================================== */}
      <div className="dashboard-main-two-col-layout">
        {/* LEFT / MAIN AREA */}
        <section className="dashboard-left-main-area">
          {/* Section Header: "Your Habits" + Add Habit Button */}
          <div className="section-header-row">
            <div className="section-title-wrap">
              <h2 className="section-heading">Your Habits</h2>
              <span className="section-count-badge">{habits.length} Active</span>
            </div>
            <button 
              type="button"
              onClick={onOpenAddModal} 
              className="add-habit-btn-primary"
              id="btn-add-habit-main"
            >
              <Plus size={16} />
              <span>Add Habit</span>
            </button>
          </div>

          {/* Habit Cards Grid (4 columns on desktop, 2 on tablet, 1 on mobile) */}
          <div className="habits-desktop-4col-grid">
            {displayedHabits.length === 0 ? (
              <div className="no-habits-empty-card">
                <Target size={36} color="#94a3b8" />
                <h3>{searchQuery ? `No habits match "${searchQuery}"` : "No Habits Created Yet"}</h3>
                <p>{searchQuery ? "Try a different search term" : "Start your consistency journey by creating your first daily habit."}</p>
                {!searchQuery && (
                  <button 
                    type="button"
                    onClick={onOpenAddModal} 
                    className="add-habit-btn-primary"
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

          {/* Subrow below habit cards: Weekly Progress (Left) + Recent Activity (Right) */}
          <div className="dashboard-subrow-layout">
            {/* Left: Weekly Progress Bar Chart */}
            <div className="dashboard-card weekly-progress-card">
              <WeeklyBarChart 
                habits={habits}
                records={records}
                todayKey={todayStr}
              />
            </div>

            {/* Right: Recent Activity Table Card */}
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

        {/* RIGHT / SIDEBAR AREA */}
        <aside className="dashboard-right-sidebar-area">
          {/* 1. Goal & Progress Card */}
          <div className="dashboard-card goal-progress-card">
            <div className="stats-card-header">
              <div className="stats-header-titles">
                <h3 className="dashboard-card-title">Goal & Progress</h3>
                <span className="active-habit-selector-pill">
                  All Habits
                </span>
              </div>
            </div>

            {/* Metric Boxes: Total Goal Days, Total Completed, Total Left */}
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

          {/* 2. Today's Progress Card */}
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
                  size={72}
                  strokeWidth={6.5}
                  color="#2563eb"
                  trackColor="#eff6ff"
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

          {/* 3. Overall Progress Card */}
          <div className="dashboard-card overall-progress-card">
            <div className="stats-card-header">
              <div className="stats-header-titles">
                <h3 className="dashboard-card-title">Overall Progress</h3>
                <span className="overall-pct-badge">{overallProgressPct}%</span>
              </div>
            </div>
            <div className="overall-chart-body">
              <CircularProgress
                percentage={overallProgressPct}
                size={76}
                strokeWidth={7}
                color="#10b981"
                trackColor="#f1f5f9"
                fontSize={16}
              />
              <div className="overall-legend-col">
                <div className="overall-legend-item">
                  <span className="legend-dot dot-completed-emerald" />
                  <span>Completed: <strong>{totalCompletedDays}</strong></span>
                </div>
                <div className="overall-legend-item">
                  <span className="legend-dot dot-left-cyan" />
                  <span>Left: <strong>{Math.max(0, totalGoalDays - totalCompletedDays)}</strong></span>
                </div>
                <div className="overall-legend-item">
                  <span className="legend-dot dot-total-slate" />
                  <span>Total Goal: <strong>{totalGoalDays}</strong></span>
                </div>
              </div>
            </div>
            <div className="overall-cheer-badge">
              <span>Track Today. Build Tomorrow! 💪</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

