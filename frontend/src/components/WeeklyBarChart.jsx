import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateKey } from '../utils/dateUtils';

/**
 * Reusable Professional Weekly Bar Chart Component
 * - Title: "Weekly Progress", Subtitle: "All Habits"
 * - Week navigation: Prev Week, This Week, Next Week
 * - Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
 * - Actual completion % for each day from active habits and database records
 * - Percentage labels on top of each bar
 * - Green bars for completed progress (>0%), light gray for 0%
 * - Legend: Completed & Not Completed
 */
export default function WeeklyBarChart({ 
  habits = [], 
  records = {}, 
  todayKey = '' 
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = useMemo(() => new Date(), []);
  const activeTodayKey = todayKey || formatDateKey(today);

  // Calculate Monday of the target week based on weekOffset
  const { monday, sunday, dateRangeLabel, weekDays } = useMemo(() => {
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const baseMonday = new Date(today);
    baseMonday.setDate(today.getDate() - daysSinceMonday + (weekOffset * 7));
    baseMonday.setHours(0, 0, 0, 0);

    const baseSunday = new Date(baseMonday);
    baseSunday.setDate(baseMonday.getDate() + 6);

    const startStr = baseMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = baseSunday.toLocaleDateString('en-US', { 
      month: baseSunday.getMonth() === baseMonday.getMonth() ? undefined : 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const totalHabits = habits.length;

    const days = dayLabels.map((label, idx) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + idx);
      const dKey = formatDateKey(d);
      const isCurToday = dKey === activeTodayKey;

      let completedCount = 0;
      if (totalHabits > 0) {
        habits.forEach((h) => {
          if (Boolean(records[`${h.id}_${dKey}`])) {
            completedCount++;
          }
        });
      }

      const percentage = totalHabits > 0 
        ? Math.round((completedCount / totalHabits) * 100) 
        : 0;

      return {
        day: label,
        fullDay: fullDayNames[idx],
        dateKey: dKey,
        dayNumber: d.getDate(),
        completedCount,
        totalHabits,
        percentage,
        isToday: isCurToday,
      };
    });

    return {
      monday: baseMonday,
      sunday: baseSunday,
      dateRangeLabel: `${startStr} – ${endStr}`,
      weekDays: days,
    };
  }, [today, activeTodayKey, weekOffset, habits, records]);

  return (
    <div className="weekly-barchart-card-inner">
      {/* Top Header Row with Title, Range, and Navigation Controls */}
      <div className="weekly-chart-header">
        <div className="weekly-title-group">
          <div className="weekly-title-row">
            <h3 className="weekly-main-title">Weekly Progress</h3>
            <span className="weekly-subtitle">All Habits</span>
          </div>
          <span className="weekly-range-badge">{dateRangeLabel}</span>
        </div>

        {/* Navigation Controls */}
        <div className="weekly-nav-controls">
          <button
            type="button"
            className="btn-week-nav"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft size={16} />
            <span className="btn-nav-text">Prev</span>
          </button>

          {weekOffset !== 0 && (
            <button
              type="button"
              className="btn-week-nav btn-this-week"
              onClick={() => setWeekOffset(0)}
              title="Return to current week"
            >
              This Week
            </button>
          )}

          <button
            type="button"
            className="btn-week-nav"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Next Week"
            aria-label="Next Week"
          >
            <span className="btn-nav-text">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main 7-Bar Visual Grid */}
      <div className="weekly-bars-wrapper">
        <div className="weekly-bars-container">
          {weekDays.map((item, idx) => {
            const hasProgress = item.percentage > 0;
            return (
              <div 
                key={item.dateKey} 
                className={`weekly-bar-column ${item.isToday ? 'column-is-today' : ''}`}
              >
                {/* Percentage label above the bar */}
                <span className={`weekly-bar-pct-label ${hasProgress ? 'label-active' : 'label-zero'}`}>
                  {item.percentage}%
                </span>

                {/* Bar Track & Fill */}
                <div 
                  className="weekly-bar-track"
                  title={`${item.fullDay} (${item.dateKey}): ${item.completedCount}/${item.totalHabits} completed (${item.percentage}%)`}
                >
                  <div 
                    className={`weekly-bar-fill ${hasProgress ? 'fill-completed' : 'fill-zero'}`}
                    style={{ 
                      height: hasProgress ? `${item.percentage}%` : '4px',
                      transitionDelay: `${idx * 0.04}s`
                    }}
                  />
                </div>

                {/* Day Labels below bar */}
                <div className="weekly-day-labels">
                  <span className="weekly-day-name" title={item.fullDay}>{item.day}</span>
                  <span className="weekly-day-num">{item.dayNumber}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="weekly-chart-legend">
        <div className="legend-entry">
          <span className="legend-indicator indicator-completed" />
          <span className="legend-text">Completed</span>
        </div>
        <div className="legend-entry">
          <span className="legend-indicator indicator-empty" />
          <span className="legend-text">Not Completed</span>
        </div>
      </div>
    </div>
  );
}
