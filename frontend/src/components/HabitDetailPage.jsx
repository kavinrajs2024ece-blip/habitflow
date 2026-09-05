import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Loader2, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  Edit3,
  Trash2,
  CalendarDays,
  Activity,
  Target,
  BarChart3,
  CalendarCheck
} from 'lucide-react';
import * as api from '../services/api';
import EditHabitModal from './EditHabitModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { 
  toDateString, 
  calculateCurrentStreak, 
  calculateLongestStreak, 
  calculateCompletionRate, 
  getDayStatus 
} from '../utils/streakUtils';
import { getCategoryMeta } from '../utils/dateUtils';

export default function HabitDetailPage({ 
  habitId, 
  onBack, 
  onGlobalRecordUpdated,
  onHabitUpdated,
  onHabitDeleted
}) {
  const [habit, setHabit] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingDate, setTogglingDate] = useState(null);

  // Selected date inspector state
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateString(today), [today]);
  const [calendarDate, setCalendarDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load habit metadata and all records for this habit
  const loadHabitDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allHabits, habitRecords] = await Promise.all([
        api.getHabits(),
        api.getRecordsForHabit(habitId),
      ]);

      const foundHabit = allHabits.find((h) => h.id === Number(habitId));
      if (!foundHabit) {
        throw new Error(`Habit #${habitId} not found in database.`);
      }

      setHabit(foundHabit);
      setRecords(habitRecords || []);
    } catch (err) {
      setError(err.message || 'Failed to load habit details from database.');
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    loadHabitDetails();
  }, [loadHabitDetails]);

  // Convert records array to quick lookup map: "YYYY-MM-DD" -> true/false
  const recordsMap = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const dStr = typeof r.record_date === 'string' 
        ? r.record_date.split('T')[0] 
        : toDateString(r.record_date);
      map[dStr] = r.completed;
    });
    return map;
  }, [records]);

  // Calculate statistics using the streak engine
  const currentStreak = useMemo(() => calculateCurrentStreak(records, today), [records, today]);
  const longestStreak = useMemo(() => calculateLongestStreak(records), [records]);
  const completionStats = useMemo(() => calculateCompletionRate(records, habit?.created_at, today), [records, habit?.created_at, today]);

  // Month navigation
  const prevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  // Toggle completion for a specific date
  const handleToggleDate = async (dateStr) => {
    const isCompleted = recordsMap[dateStr] === true;
    const nextStatus = !isCompleted;

    setTogglingDate(dateStr);
    try {
      const updatedRecord = await api.upsertHabitRecord(habitId, dateStr, nextStatus);

      // Update local records state
      setRecords((prev) => {
        const filtered = prev.filter((r) => {
          const rDate = typeof r.record_date === 'string' 
            ? r.record_date.split('T')[0] 
            : toDateString(r.record_date);
          return rDate !== dateStr;
        });
        return [updatedRecord, ...filtered];
      });

      // Synchronize with global App state
      if (onGlobalRecordUpdated) {
        onGlobalRecordUpdated(habitId, dateStr, nextStatus);
      }
    } catch (err) {
      alert(`Failed to update record for ${dateStr}: ${err.message}`);
    } finally {
      setTogglingDate(null);
    }
  };

  // Handle Edit Habit
  const handleSaveEdit = async (updatedData) => {
    setIsSavingEdit(true);
    try {
      const updatedHabit = await api.updateHabit(habitId, updatedData);
      setHabit(updatedHabit);
      if (onHabitUpdated) {
        onHabitUpdated(updatedHabit);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Habit
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteHabit(habitId);
      if (onHabitDeleted) {
        onHabitDeleted(habitId);
      }
      onBack();
    } catch (err) {
      alert(`Failed to delete habit: ${err.message}`);
      setIsDeleting(false);
    }
  };

  // Parse category & clean description
  let categoryName = 'General';
  let cleanDescription = habit?.description || '';
  if (habit?.description && habit.description.startsWith('[')) {
    const endIdx = habit.description.indexOf(']');
    if (endIdx > 1) {
      categoryName = habit.description.substring(1, endIdx);
      cleanDescription = habit.description.substring(endIdx + 1).trim();
    }
  }
  const categoryMeta = getCategoryMeta(categoryName);

  // Calendar Grid generation
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const monthTitle = calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ isBlank: true, key: `blank-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calYear, calMonth, day);
      const dateStr = toDateString(d);
      const status = getDayStatus(dateStr, recordsMap, habit?.created_at, todayKey);
      days.push({
        isBlank: false,
        day,
        dateStr,
        status,
        isToday: dateStr === todayKey,
      });
    }
    return days;
  }, [calYear, calMonth, firstDayIndex, daysInMonth, recordsMap, habit?.created_at, todayKey]);

  // Current week days (Monday - Sunday)
  const weeklyData = useMemo(() => {
    const days = [];
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysSinceMonday);

    let completedCount = 0;
    let elapsedCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = toDateString(d);
      const isDone = recordsMap[dStr] === true;
      const isFuture = d > today;
      const isCurToday = dStr === todayKey;

      if (!isFuture) {
        elapsedCount++;
        if (isDone) completedCount++;
      }

      days.push({
        date: d,
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isDone,
        isFuture,
        isToday: isCurToday,
      });
    }

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const rate = elapsedCount > 0 ? Math.round((completedCount / elapsedCount) * 100) : 0;

    return {
      days,
      completedCount,
      elapsedCount,
      totalDays: 7,
      rate,
      weekLabel,
    };
  }, [today, todayKey, recordsMap]);

  // Recent activity list (past 8 days up to today)
  const recentRecordsList = useMemo(() => {
    const list = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = toDateString(d);
      const isDone = recordsMap[dStr] === true;
      const isCurToday = dStr === todayKey;

      list.push({
        dateStr: dStr,
        dateObj: d,
        formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        isDone,
        isToday: isCurToday,
      });
    }
    return list;
  }, [today, todayKey, recordsMap]);

  // Selected date inspector status
  const selectedDateStatus = getDayStatus(selectedDate, recordsMap, habit?.created_at, todayKey);
  const isSelectedDateDone = recordsMap[selectedDate] === true;
  const isSelectedDateFuture = new Date(selectedDate) > today;

  // Render loading state
  if (loading) {
    return (
      <div className="habit-detail-loading-state">
        <Loader2 size={36} className="spin accent-spinner" />
        <h3>Loading Habit History</h3>
        <p>Fetching records and calculating streaks from SQLite database...</p>
      </div>
    );
  }

  // Render error state
  if (error || !habit) {
    return (
      <div className="habit-detail-error-state">
        <AlertCircle size={36} className="icon-danger" />
        <h3>Failed to Load Habit</h3>
        <p>{error || 'Habit not found.'}</p>
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="habit-detail-page" id="habit-detail-view-container">
      {/* 1. BACK TO DASHBOARD NAVIGATION BAR */}
      <div className="detail-top-nav-bar">
        <button 
          onClick={onBack} 
          className="btn-detail-back" 
          id="btn-back-to-dashboard"
          title="Return to Dashboard"
        >
          <ArrowLeft size={16} className="btn-back-icon" />
          <span>Back to Dashboard</span>
        </button>

        <div className="detail-nav-badges">
          <span className="detail-meta-pill">Habit #{habit.id}</span>
          <span className="detail-sync-pill">
            <CheckCircle2 size={12} color="#10b981" /> SQLite Synced
          </span>
        </div>
      </div>

      {/* 2 & 3. HABIT HEADER & HABIT DESCRIPTION */}
      <div className="detail-header-card">
        <div className="detail-header-left">
          <div className="detail-badge-row">
            <span 
              className="habit-category-pill"
              style={{ 
                backgroundColor: `${categoryMeta.color}16`, 
                color: categoryMeta.color,
                border: `1px solid ${categoryMeta.color}35`
              }}
            >
              {categoryMeta.name}
            </span>
            {habit.created_at && (
              <span className="detail-created-date">
                Created {new Date(habit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <h1 className="detail-habit-name">{habit.name}</h1>

          {/* Section 3: Habit Description */}
          <div className="detail-description-box">
            {cleanDescription ? (
              <p className="detail-description-text">{cleanDescription}</p>
            ) : (
              <p className="detail-description-text text-muted">No description provided for this habit.</p>
            )}
          </div>
        </div>

        {/* Action Controls: Today's Toggle, Edit Habit, Delete Habit */}
        <div className="detail-header-actions">
          <button 
            onClick={() => handleToggleDate(todayKey)}
            disabled={togglingDate === todayKey}
            className={`btn-detail-today-toggle ${recordsMap[todayKey] ? 'is-completed' : 'is-pending'}`}
            id="btn-detail-toggle-today"
            title={recordsMap[todayKey] ? 'Click to mark pending' : 'Click to mark completed'}
          >
            {togglingDate === todayKey ? (
              <Loader2 size={16} className="spin" />
            ) : recordsMap[todayKey] ? (
              <CheckCircle2 size={16} />
            ) : (
              <Check size={16} />
            )}
            <span>{recordsMap[todayKey] ? 'Completed Today' : 'Mark Done for Today'}</span>
          </button>

          <div className="detail-button-group">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="btn-detail-action btn-detail-edit"
              title="Edit habit details"
              id="btn-open-edit-habit"
            >
              <Edit3 size={15} />
              <span>Edit Habit</span>
            </button>

            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn-detail-action btn-detail-delete"
              title="Delete habit"
              id="btn-open-delete-habit"
            >
              <Trash2 size={15} />
              <span>Delete Habit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4, 5, 6. STATISTICS CARDS: Current Streak, Longest Streak, Total Completed, Completion Rate */}
      <div className="detail-stats-grid">
        {/* Card 4: Current Streak */}
        <div className="detail-stat-card stat-card-current-streak">
          <div className="detail-stat-icon-wrap icon-amber">
            <Flame size={20} />
          </div>
          <div className="detail-stat-body">
            <span className="detail-stat-label">Current Streak</span>
            <div className="detail-stat-value-row">
              <span className="detail-stat-val">{currentStreak}</span>
              <span className="detail-stat-unit">Days</span>
            </div>
            <span className="detail-stat-sub">
              {currentStreak > 0 ? `${currentStreak} consecutive day${currentStreak === 1 ? '' : 's'} active` : 'No streak active today'}
            </span>
          </div>
        </div>

        {/* Card 5: Longest Streak */}
        <div className="detail-stat-card stat-card-longest-streak">
          <div className="detail-stat-icon-wrap icon-purple">
            <Trophy size={20} />
          </div>
          <div className="detail-stat-body">
            <span className="detail-stat-label">Longest Streak</span>
            <div className="detail-stat-value-row">
              <span className="detail-stat-val">{longestStreak}</span>
              <span className="detail-stat-unit">Days</span>
            </div>
            <span className="detail-stat-sub">Personal best achievement</span>
          </div>
        </div>

        {/* Card 6a: Total Completed Days */}
        <div className="detail-stat-card stat-card-total-completed">
          <div className="detail-stat-icon-wrap icon-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="detail-stat-body">
            <span className="detail-stat-label">Total Completed Days</span>
            <div className="detail-stat-value-row">
              <span className="detail-stat-val">{completionStats.completedDays}</span>
              <span className="detail-stat-unit">Days</span>
            </div>
            <span className="detail-stat-sub">
              Out of {completionStats.totalEligibleDays} tracked day{completionStats.totalEligibleDays === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Card 6b: Completion Percentage */}
        <div className="detail-stat-card stat-card-completion-rate">
          <div className="detail-stat-icon-wrap icon-blue">
            <Target size={20} />
          </div>
          <div className="detail-stat-body">
            <span className="detail-stat-label">Completion Percentage</span>
            <div className="detail-stat-value-row">
              <span className="detail-stat-val">{completionStats.percentage}%</span>
            </div>
            <div className="detail-stat-progress-bar-wrap">
              <div 
                className="detail-stat-progress-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, completionStats.percentage))}%` }}
              />
            </div>
            <span className="detail-stat-sub">Overall completion rate</span>
          </div>
        </div>
      </div>

      {/* 7. MONTHLY CALENDAR */}
      <div className="detail-section-card detail-calendar-section">
        <div className="detail-section-header">
          <div className="detail-header-title-wrap">
            <div className="section-icon-box box-blue">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="detail-section-title">{monthTitle}</h2>
              <p className="detail-section-subtitle">
                Click any day to inspect details or toggle daily completion
              </p>
            </div>
          </div>

          <div className="calendar-nav-controls">
            <button 
              onClick={prevMonth} 
              className="btn-cal-nav" 
              title="Previous Month"
              aria-label="Previous Month"
              id="btn-calendar-prev-month"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={goToToday} 
              className="btn-cal-today"
              id="btn-calendar-jump-today"
            >
              Today
            </button>
            <button 
              onClick={nextMonth} 
              className="btn-cal-nav" 
              title="Next Month"
              aria-label="Next Month"
              id="btn-calendar-next-month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="calendar-legend-container">
          <div className="cal-legend-item">
            <span className="cal-legend-swatch swatch-completed">
              <Check size={11} strokeWidth={3} />
            </span>
            <span>Completed</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-swatch swatch-missed">
              <XCircle size={11} />
            </span>
            <span>Incomplete / Missed</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-swatch swatch-today" />
            <span>Today</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-swatch swatch-future" />
            <span>Future (Uncounted)</span>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="cal-weekdays-row">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
            <div key={w} className="cal-weekday-cell">{w}</div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="cal-days-grid" key={`${calYear}-${calMonth}`}>
          {calendarDays.map((cell) => {
            if (cell.isBlank) {
              return <div key={cell.key} className="cal-cell cal-cell-blank" />;
            }

            const isToggling = togglingDate === cell.dateStr;
            const isClickable = cell.status !== 'future' && cell.status !== 'before-creation';
            const isSelected = selectedDate === cell.dateStr;

            return (
              <button
                key={cell.dateStr}
                onClick={() => {
                  setSelectedDate(cell.dateStr);
                  if (isClickable) {
                    handleToggleDate(cell.dateStr);
                  }
                }}
                disabled={isToggling}
                className={`cal-cell cell-status-${cell.status} ${cell.isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                title={`${cell.dateStr}: ${cell.status}`}
              >
                <div className="cal-cell-top">
                  <span className="cal-cell-day-num">{cell.day}</span>
                  {cell.isToday && <span className="cal-cell-today-pill">Today</span>}
                </div>

                <div className="cal-cell-body">
                  {isToggling ? (
                    <Loader2 size={14} className="spin accent-spinner" />
                  ) : cell.status === 'completed' || cell.status === 'today-completed' ? (
                    <div className="cal-cell-badge badge-done">
                      <Check size={12} strokeWidth={3} />
                      <span className="badge-lbl">Done</span>
                    </div>
                  ) : cell.status === 'missed' ? (
                    <div className="cal-cell-badge badge-missed">
                      <XCircle size={12} />
                      <span className="badge-lbl">Missed</span>
                    </div>
                  ) : cell.status === 'today-pending' ? (
                    <div className="cal-cell-badge badge-pending">
                      <Clock size={11} />
                      <span className="badge-lbl">Pending</span>
                    </div>
                  ) : (
                    <span className="cal-cell-dash">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Date Inspector Strip */}
        {selectedDate && (
          <div className="cal-selected-inspector">
            <div className="inspector-left-content">
              <CalendarIcon size={16} className="inspector-icon" />
              <div>
                <span className="inspector-label">Selected Date: </span>
                <strong className="inspector-date">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </strong>
                <span className={`inspector-tag ${isSelectedDateFuture ? 'tag-future' : isSelectedDateDone ? 'tag-done' : 'tag-missed'}`}>
                  {isSelectedDateFuture ? 'Future Date' : isSelectedDateDone ? 'Completed' : 'Not Completed'}
                </span>
              </div>
            </div>

            {!isSelectedDateFuture && (
              <button
                onClick={() => handleToggleDate(selectedDate)}
                disabled={togglingDate === selectedDate}
                className={`btn-inspector-toggle ${isSelectedDateDone ? 'btn-mark-incomplete' : 'btn-mark-complete'}`}
              >
                {togglingDate === selectedDate ? (
                  <Loader2 size={13} className="spin" />
                ) : isSelectedDateDone ? (
                  'Mark Incomplete'
                ) : (
                  'Mark Completed'
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 8. WEEKLY PROGRESS SECTION */}
      <div className="detail-section-card detail-weekly-section">
        <div className="detail-section-header">
          <div className="detail-header-title-wrap">
            <div className="section-icon-box box-emerald">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="detail-section-title">Weekly Progress</h2>
              <p className="detail-section-subtitle">
                Current week completion overview ({weeklyData.weekLabel})
              </p>
            </div>
          </div>

          <div className="weekly-header-stat-pill">
            <span className="weekly-stat-count">
              <strong>{weeklyData.completedCount}</strong> of {weeklyData.elapsedCount} days completed
            </span>
            <span className="weekly-stat-badge">{weeklyData.rate}%</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="weekly-progress-bar-track">
          <div 
            className="weekly-progress-bar-fill" 
            style={{ width: `${Math.min(100, Math.max(0, weeklyData.rate))}%` }} 
          />
        </div>

        {/* 7-Day Interactive Timeline (Mon - Sun) */}
        <div className="weekly-days-strip">
          {weeklyData.days.map((item) => {
            const isToggling = togglingDate === item.dateStr;
            const isClickable = !item.isFuture;

            return (
              <div 
                key={item.dateStr}
                onClick={() => isClickable && handleToggleDate(item.dateStr)}
                className={`weekly-day-slot ${item.isDone ? 'is-done' : item.isFuture ? 'is-future' : 'is-missed'} ${item.isToday ? 'is-today' : ''} ${isClickable ? 'is-clickable' : ''}`}
                title={`${item.dateStr}: ${item.isDone ? 'Completed' : item.isFuture ? 'Future' : 'Incomplete'}`}
              >
                <span className="weekly-slot-day-name">{item.dayName}</span>
                <span className="weekly-slot-day-num">{item.dayNum}</span>

                <div className="weekly-slot-check-box">
                  {isToggling ? (
                    <Loader2 size={13} className="spin" />
                  ) : item.isDone ? (
                    <Check size={13} strokeWidth={3} />
                  ) : item.isFuture ? (
                    <span className="weekly-slot-dot" />
                  ) : (
                    <XCircle size={13} />
                  )}
                </div>

                <span className="weekly-slot-status-text">
                  {item.isDone ? 'Done' : item.isFuture ? 'Upcoming' : 'Missed'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 9. RECENT ACTIVITY SECTION (DAILY RECORDS) */}
      <div className="detail-section-card detail-activity-section">
        <div className="detail-section-header">
          <div className="detail-header-title-wrap">
            <div className="section-icon-box box-amber">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="detail-section-title">Recent Activity</h2>
              <p className="detail-section-subtitle">
                Recent daily habit records stored in SQLite database
              </p>
            </div>
          </div>
        </div>

        <div className="recent-activity-table-wrap">
          <table className="recent-activity-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Recorded State</th>
                <th style={{ textAlign: 'right' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {recentRecordsList.map((row) => {
                const isToggling = togglingDate === row.dateStr;

                return (
                  <tr key={row.dateStr} className={`activity-table-row ${row.isToday ? 'row-today' : ''}`}>
                    <td className="activity-date-col">
                      <div className="activity-date-wrap">
                        <CalendarIcon size={14} className="activity-date-icon" />
                        <span className="activity-date-str">{row.formattedDate}</span>
                        {row.isToday && <span className="activity-today-pill">Today</span>}
                      </div>
                    </td>

                    <td className="activity-status-col">
                      {row.isDone ? (
                        <span className="activity-status-chip chip-done">
                          <CheckCircle2 size={13} />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="activity-status-chip chip-missed">
                          <XCircle size={13} />
                          <span>Not Completed</span>
                        </span>
                      )}
                    </td>

                    <td className="activity-record-col">
                      <span className="activity-record-value">
                        {row.isDone ? '100% Goal Met' : '0% Missed'}
                      </span>
                    </td>

                    <td className="activity-action-col" style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleDate(row.dateStr)}
                        disabled={isToggling}
                        className={`btn-activity-toggle ${row.isDone ? 'btn-toggle-done' : 'btn-toggle-pending'}`}
                        id={`btn-toggle-activity-${row.dateStr}`}
                      >
                        {isToggling ? (
                          <Loader2 size={12} className="spin" />
                        ) : row.isDone ? (
                          'Mark Incomplete'
                        ) : (
                          'Mark Completed'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Habit Modal */}
      <EditHabitModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        habit={habit}
        onSaveHabit={handleSaveEdit}
        isSaving={isSavingEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        habitName={habit?.name || 'this habit'}
        isDeleting={isDeleting}
      />
    </div>
  );
}

