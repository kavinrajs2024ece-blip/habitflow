import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatDateKey } from '../../utils/dateUtils';

/**
 * WeeklyConsistencyTrend - 7-day vertical bar chart with real completion rates and week navigation
 * 
 * @param {Object} props
 * @param {Array} props.habits - Active habit list
 * @param {Object} props.records - Key-value records map: `${habitId}_${dateKey}` -> bool
 */
export default function WeeklyConsistencyTrend({ habits = [], records = {} }) {
  // weekOffset: 0 means past 7 days ending today, -1 means 7 days before that, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute 7 days for the current offset
  const today = new Date();
  const dayShift = weekOffset * 7;
  
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - (i - dayShift));
    days.push(d);
  }

  // Calculate stats for each of the 7 days
  const chartData = days.map((d) => {
    const key = formatDateKey(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = formatDateKey(new Date()) === key;

    let completed = 0;
    habits.forEach((h) => {
      if (Boolean(records[`${h.id}_${key}`])) {
        completed++;
      }
    });

    const total = habits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      dateKey: key,
      dayName,
      formattedDate,
      completed,
      total,
      percentage,
      isToday,
    };
  });

  const rangeStartStr = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const rangeEndStr = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="chart-card weekly-trend-card">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-title">Weekly Consistency Trend</h3>
          <p className="chart-sub">Daily completion percentages across the past 7 days</p>
        </div>

        <div className="chart-nav-controls">
          <span className="chart-nav-range">{rangeStartStr} – {rangeEndStr}</span>
          <div className="chart-nav-btn-group">
            <button
              type="button"
              className="chart-nav-btn"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              title="Previous 7 Days"
              aria-label="Previous 7 Days"
            >
              <ChevronLeft size={16} />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                className="chart-nav-reset-btn"
                onClick={() => setWeekOffset(0)}
                title="Reset to Current Week"
              >
                <RotateCcw size={13} />
                <span>Current</span>
              </button>
            )}
            <button
              type="button"
              className="chart-nav-btn"
              onClick={() => setWeekOffset((prev) => Math.min(prev + 1, 0))}
              disabled={weekOffset >= 0}
              title="Next 7 Days"
              aria-label="Next 7 Days"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Bar Chart */}
      <div className="weekly-bars-container">
        {chartData.map((item) => (
          <div
            key={item.dateKey}
            className={`weekly-bar-column ${item.isToday ? 'is-today-bar' : ''}`}
          >
            {/* Percentage Label above bar */}
            <span className={`weekly-bar-pct ${item.percentage > 0 ? 'has-pct' : 'zero-pct'}`}>
              {item.percentage}%
            </span>

            {/* Vertical Bar Track & Fill */}
            <div
              className="weekly-bar-track"
              title={`${item.dayName}, ${item.formattedDate}: ${item.completed}/${item.total} completed (${item.percentage}%)`}
            >
              <div
                className="weekly-bar-fill"
                style={{
                  height: `${item.percentage}%`,
                }}
              />
            </div>

            {/* Day name and date below bar */}
            <div className="weekly-bar-label-group">
              <span className={`weekly-bar-day ${item.isToday ? 'today-day-label' : ''}`}>
                {item.dayName}
              </span>
              <span className="weekly-bar-date">{item.formattedDate.split(' ')[1]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="chart-legend-row">
        <div className="legend-item">
          <span className="legend-dot legend-dot-completed" />
          <span className="legend-text">Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-remaining" />
          <span className="legend-text">Not Completed</span>
        </div>
      </div>
    </div>
  );
}
