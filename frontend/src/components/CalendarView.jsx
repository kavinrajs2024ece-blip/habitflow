import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Check
} from 'lucide-react';
import { formatDateKey } from '../utils/dateUtils';

export default function CalendarView({ habits = [], records = {}, todayKey = '' }) {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('en-US', { month: 'long' });

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };

  // First day of current month & total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells (blanks for padding + actual days)
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ blank: true, key: `blank-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateKey = formatDateKey(d);
    calendarCells.push({ blank: false, day, dateKey, dateObj: d });
  }

  // Calculate day completion count and state
  const getDayCompletionState = (dateKey, dateObj) => {
    const isFuture = dateObj > todayMidnight;
    let completedCount = 0;

    habits.forEach((h) => {
      if (records[`${h.id}_${dateKey}`] === true) {
        completedCount++;
      }
    });

    const totalHabits = habits.length;

    if (isFuture) {
      return { status: 'future', completedCount, totalHabits };
    }

    if (totalHabits > 0 && completedCount === totalHabits) {
      return { status: 'fully-completed', completedCount, totalHabits };
    }

    if (completedCount > 0 && completedCount < totalHabits) {
      return { status: 'partially-completed', completedCount, totalHabits };
    }

    return { status: 'no-completed', completedCount, totalHabits };
  };

  // Selected date details
  const selectedDObj = new Date(selectedDate + 'T00:00:00');
  const selectedDayState = getDayCompletionState(selectedDate, selectedDObj);
  const formattedSelectedDate = selectedDObj.toLocaleDateString(
    'en-US',
    { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <div className="calendar-view-container">
      {/* Calendar Card */}
      <div className="calendar-card">
        <div className="calendar-header-bar">
          <div className="calendar-title-group">
            <div className="calendar-icon-box">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="card-title">{monthName} {year}</h2>
              <p className="card-sub">Daily habit completion tracking & consistency</p>
            </div>
          </div>

          <div className="calendar-nav-actions">
            <button 
              onClick={prevMonth} 
              className="btn-icon" 
              title="Previous Month"
              aria-label="Previous Month"
              id="btn-cal-prev"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={jumpToToday} 
              className="btn btn-outline" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              id="btn-cal-today"
            >
              Today
            </button>
            <button 
              onClick={nextMonth} 
              className="btn-icon" 
              title="Next Month"
              aria-label="Next Month"
              id="btn-cal-next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Clean Legend Bar */}
        <div className="cal-legend-bar">
          <div className="cal-legend-item">
            <span className="cal-legend-badge legend-fully-completed">
              <Check size={11} strokeWidth={3} />
            </span>
            <span>Fully Completed</span>
          </div>

          <div className="cal-legend-item">
            <span className="cal-legend-badge legend-partially-completed">
              <span className="cal-partial-dot" />
            </span>
            <span>Partially Completed</span>
          </div>

          <div className="cal-legend-item">
            <span className="cal-legend-badge legend-no-completed">-</span>
            <span>Incomplete</span>
          </div>

          <div className="cal-legend-item">
            <span className="cal-legend-badge legend-today-box" />
            <span>Today</span>
          </div>

          <div className="cal-legend-item">
            <span className="cal-legend-badge legend-future-box">—</span>
            <span>Future</span>
          </div>
        </div>

        {/* Weekday Header Grid */}
        <div className="calendar-weekdays-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
            <div key={w} className="weekday-header-cell">
              {w}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="calendar-days-grid">
          {calendarCells.map((cell) => {
            if (cell.blank) {
              return <div key={cell.key} className="calendar-cell blank-cell" />;
            }

            const { status, completedCount, totalHabits } = getDayCompletionState(cell.dateKey, cell.dateObj);
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedDate;

            return (
              <button
                key={cell.dateKey}
                onClick={() => setSelectedDate(cell.dateKey)}
                className={`calendar-cell cal-symbol-cell cal-state-${status} ${
                  isToday ? 'cell-is-today' : ''
                } ${isSelected ? 'cell-is-selected' : ''}`}
                title={`${cell.dateKey}: ${completedCount}/${totalHabits} completed (${status.replace('-', ' ')})`}
                id={`cal-cell-${cell.dateKey}`}
              >
                <div className="cal-cell-top">
                  <span className="cal-cell-day-num">{cell.day}</span>
                  {isToday && <span className="cal-today-badge">Today</span>}
                </div>

                {/* Symbol indicator area: NO percentage text */}
                <div className="cal-symbol-indicator">
                  {status === 'fully-completed' && (
                    <div className="cal-check-badge" title="All habits completed">
                      <Check size={13} strokeWidth={3.5} />
                    </div>
                  )}

                  {status === 'partially-completed' && (
                    <div className="cal-partial-badge" title={`${completedCount} of ${totalHabits} completed`}>
                      <span className="cal-partial-dot" />
                    </div>
                  )}

                  {status === 'no-completed' && (
                    <span className="cal-dash-symbol">-</span>
                  )}

                  {status === 'future' && (
                    <span className="cal-future-symbol">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Activity Inspector Card */}
      <div className="day-inspector-card">
        <div className="inspector-header">
          <div className="inspector-title-group">
            <Sparkles size={18} color="#6366f1" />
            <h3 className="inspector-heading">Activity for {formattedSelectedDate}</h3>
          </div>
          <div className="inspector-score">
            <span className="score-badge">
              {selectedDayState.completedCount} / {habits.length} Habits Completed
              {selectedDayState.status === 'fully-completed' && ' (100% Full)'}
              {selectedDayState.status === 'partially-completed' && ' (Partial)'}
              {selectedDayState.status === 'no-completed' && ' (Incomplete)'}
              {selectedDayState.status === 'future' && ' (Future Date)'}
            </span>
          </div>
        </div>

        <div className="inspector-habits-list">
          {habits.length > 0 ? (
            habits.map((habit) => {
              const isCompleted = records[`${habit.id}_${selectedDate}`] === true;
              return (
                <div 
                  key={habit.id} 
                  className={`inspector-habit-row ${isCompleted ? 'row-completed' : 'row-missed'}`}
                >
                  <div className="row-left">
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="icon-success" />
                    ) : (
                      <XCircle size={18} className="icon-missed" />
                    )}
                    <span className="row-name">{habit.name}</span>
                  </div>
                  <div className="row-meta">
                    <span className={`row-status-text ${isCompleted ? 'text-success' : 'text-missed'}`}>
                      {isCompleted ? 'Completed' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="chart-sub" style={{ padding: '0.5rem 0' }}>No habits defined yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
