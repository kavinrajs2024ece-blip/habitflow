import React from 'react';
import { CheckCircle2, Clock, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { calculateStreak, getCategoryMeta, formatDateKey } from '../utils/dateUtils';

export default function RecentActivity({ 
  habits = [], 
  records = {}, 
  todayKey = '', 
  onSelectHabit 
}) {
  // Collect activities:
  // 1. All habits completed today
  // 2. Fall back to habits with active streaks or completed in the last few days
  const completedTodayHabits = habits.filter(
    (h) => records[`${h.id}_${todayKey}`] === true
  );

  // Helper to extract category name
  const getCategoryName = (description) => {
    if (description && description.startsWith('[')) {
      const endIdx = description.indexOf(']');
      if (endIdx > 1) {
        return description.substring(1, endIdx);
      }
    }
    return 'General';
  };

  return (
    <div className="recent-activity-card">
      <div className="activity-card-header">
        <div className="activity-title-group">
          <div className="activity-icon-wrap">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="activity-title">Recent Activity</h3>
            <span className="activity-sub">Today's completion log</span>
          </div>
        </div>
        <span className="activity-count-badge">
          {completedTodayHabits.length} logged
        </span>
      </div>

      <div className="activity-feed-list">
        {completedTodayHabits.length > 0 ? (
          completedTodayHabits.map((habit) => {
            const catName = getCategoryName(habit.description);
            const catMeta = getCategoryMeta(catName);
            const streak = calculateStreak(habit.id, records);

            return (
              <div 
                key={habit.id} 
                className="activity-item-row"
                onClick={() => onSelectHabit && onSelectHabit(habit.id)}
                role={onSelectHabit ? 'button' : undefined}
                tabIndex={onSelectHabit ? 0 : undefined}
              >
                <div className="activity-item-left">
                  <div className="activity-check-indicator">
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                  <div className="activity-info">
                    <div className="activity-habit-name">{habit.name}</div>
                    <div className="activity-meta">
                      <span 
                        className="activity-cat-tag"
                        style={{ color: catMeta.color }}
                      >
                        {catMeta.name}
                      </span>
                      <span className="activity-meta-dot">•</span>
                      <span className="activity-time-text">Logged today</span>
                    </div>
                  </div>
                </div>

                <div className="activity-item-right">
                  {streak > 0 && (
                    <span className="activity-streak-pill">
                      <Flame size={12} className="flame-icon" />
                      <span>{streak}d</span>
                    </span>
                  )}
                  {onSelectHabit && (
                    <ArrowRight size={14} className="activity-arrow" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="activity-empty-state">
            <div className="empty-sparkle-box">
              <Sparkles size={20} color="#6366f1" />
            </div>
            <p className="empty-activity-title">No habits logged yet today</p>
            <p className="empty-activity-sub">
              Check off any habit in your list to record your first achievement!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
