import React from 'react';
import { 
  Check, 
  Flame, 
  Trash2, 
  Code2, 
  Dumbbell, 
  Utensils, 
  Target, 
  Droplets, 
  Brain, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Bell
} from 'lucide-react';
import { formatDateKey, calculateStreak, parseHabitGoal, getCleanDescription } from '../utils/dateUtils';
import { formatDisplayTime } from '../services/notificationService';
import CircularProgress from './CircularProgress';

// Helper to determine specific reference-styled icon and theme
const getHabitVisualTheme = (name = '', categoryName = '') => {
  const n = name.toLowerCase();
  const c = categoryName.toLowerCase();

  if (n.includes('dsa') || n.includes('code') || n.includes('program') || c.includes('learn')) {
    return {
      icon: Code2,
      color: '#6366f1',
      bgColor: '#eef2ff',
      borderColor: '#c7d2fe',
    };
  }
  if (n.includes('work') || n.includes('gym') || n.includes('fitness') || c.includes('fitness')) {
    return {
      icon: Dumbbell,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
    };
  }
  if (n.includes('diet') || n.includes('food') || n.includes('meal') || c.includes('health')) {
    return {
      icon: Utensils,
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
    };
  }
  if (c.includes('mind') || n.includes('meditat')) {
    return {
      icon: Brain,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
    };
  }
  return {
    icon: Target,
    color: '#4f46e5',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
  };
};

export default function HabitCard({ 
  habit, 
  index = 0,
  records = {}, 
  todayKey = '', 
  pastDays = [], 
  onToggleToday, 
  onDelete,
  onSelectHabit,
  isToggling = false,
  isDeleting = false
}) {
  const isCompletedToday = Boolean(records[`${habit.id}_${todayKey}`]);

  // Extract category and clean description
  let categoryName = 'General';
  if (habit.description && habit.description.startsWith('[')) {
    const endIdx = habit.description.indexOf(']');
    if (endIdx > 1) {
      categoryName = habit.description.substring(1, endIdx);
    }
  }
  const cleanDescription = getCleanDescription(habit.description);
  const goalDays = parseHabitGoal(habit.description);

  const visualTheme = getHabitVisualTheme(habit.name, categoryName);
  const IconComponent = visualTheme.icon;
  const streak = calculateStreak(habit.id, records);

  // Total completed days from database records
  const completedDays = Object.entries(records).filter(
    ([key, val]) => key.startsWith(`${habit.id}_`) && Boolean(val)
  ).length;

  const leftDays = Math.max(0, goalDays - completedDays);
  const completionPercentage = goalDays > 0 
    ? Math.min(100, Math.round((completedDays / goalDays) * 100)) 
    : 0;

  // Generate 7-day strip (Mon-Sun for current week)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  const weekDayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekStrip = weekDayLetters.map((letter, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dKey = formatDateKey(d);
    const isDone = Boolean(records[`${habit.id}_${dKey}`]);
    const isFuture = d > today;
    const isCurToday = dKey === todayKey;
    return {
      letter,
      name: weekDayNames[idx],
      dateKey: dKey,
      isDone,
      isFuture,
      isCurToday,
    };
  });

  const handleMarkCompleted = (e) => {
    e.stopPropagation();
    if (isCompletedToday) {
      // Prevent duplicate completion record if already completed today
      return;
    }
    if (onToggleToday) {
      onToggleToday(habit.id);
    }
  };

  return (
    <div 
      className={`habit-ref-card ${isCompletedToday ? 'habit-card-is-completed' : ''}`}
      style={{ '--stagger-index': index }}
      id={`habit-card-${habit.id}`}
    >
      {/* Header: Icon in Box + Title & Subtitle + Delete Button */}
      <div className="habit-ref-header">
        <div className="habit-ref-header-left">
          <div 
            className="habit-ref-icon-box"
            style={{ 
              backgroundColor: visualTheme.bgColor,
              color: visualTheme.color,
              borderColor: visualTheme.borderColor
            }}
          >
            <IconComponent size={19} />
          </div>
          <div className="habit-ref-title-wrap">
            <h3 className="habit-ref-title" title={habit.name}>{habit.name}</h3>
            <p className="habit-ref-sub" title={cleanDescription}>
              {cleanDescription || 'Daily consistency goal'}
            </p>
            {habit.reminder_enabled && habit.reminder_time && (
              <div className="habit-reminder-pill" title={`Reminder scheduled for ${formatDisplayTime(habit.reminder_time)}`}>
                <Bell size={11} className="reminder-pill-bell" />
                <span>{formatDisplayTime(habit.reminder_time)}</span>
              </div>
            )}
          </div>
        </div>

        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit.id);
            }}
            className="habit-ref-delete-btn"
            disabled={isDeleting}
            title="Delete habit"
            aria-label={`Delete ${habit.name}`}
          >
            {isDeleting ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
          </button>
        )}
      </div>

      {/* Middle Row: Circular Progress on Left + Goal/Completed/Left on Right */}
      <div className="habit-ref-middle-row">
        <div 
          className="habit-ref-circular-wrap"
          onClick={() => onToggleToday && onToggleToday(habit.id)}
          title={isCompletedToday ? "Completed today! Click to toggle." : "Click to mark done today"}
        >
          <CircularProgress 
            percentage={completionPercentage} 
            size={68} 
            strokeWidth={6}
            color="#10b981"
            trackColor="#e2e8f0"
            fontSize={16}
          />
        </div>

        <div className="habit-ref-stats-col">
          <div className="habit-ref-stat-row">
            <span className="ref-stat-label">Goal (Days)</span>
            <span className="ref-stat-val font-semibold">{goalDays}</span>
          </div>
          <div className="habit-ref-stat-row">
            <span className="ref-stat-label">Completed</span>
            <span className="ref-stat-val font-bold text-emerald">{completedDays}</span>
          </div>
          <div className="habit-ref-stat-row">
            <span className="ref-stat-label">Left</span>
            <span className="ref-stat-val font-semibold text-muted">{leftDays}</span>
          </div>
        </div>
      </div>

      {/* Bottom 7-Day Dots Strip (M T W T F S S) */}
      <div className="habit-ref-week-section">
        <div className="habit-ref-days-row">
          {weekStrip.map((item, i) => (
            <div key={`${item.dateKey}-${i}`} className="ref-day-col">
              <span className="ref-day-letter">{item.letter}</span>
              <div 
                className={`ref-day-dot ${item.isDone ? 'dot-completed' : 'dot-empty'} ${item.isCurToday ? 'dot-today-ring' : ''}`}
                title={`${item.name} (${item.dateKey}): ${item.isDone ? 'Completed' : 'Pending'}`}
              >
                {item.isDone && <Check size={11} strokeWidth={3.5} />}
              </div>
            </div>
          ))}
        </div>

        <div className="habit-ref-streak-row">
          <span className="ref-streak-pill">
            <Flame size={14} className="streak-flame-icon" />
            <span>{streak} day streak</span>
          </span>
        </div>
      </div>

      {/* Action Footer: Mark as Completed Button & View Details Link */}
      <div className="habit-ref-footer">
        <button
          type="button"
          onClick={handleMarkCompleted}
          disabled={isToggling}
          className={`btn-habit-daily-complete ${isCompletedToday ? 'is-completed' : 'is-pending'}`}
          id={`btn-toggle-habit-${habit.id}`}
          title={isCompletedToday ? "Completed today!" : "Click to mark as completed for today"}
        >
          {isToggling ? (
            <Loader2 size={14} className="spin" />
          ) : isCompletedToday ? (
            <>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Completed Today</span>
            </>
          ) : (
            <>
              <Check size={15} strokeWidth={2.5} />
              <span>Mark as Completed</span>
            </>
          )}
        </button>

        {onSelectHabit && (
          <div className="habit-ref-footer-bottom">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectHabit(habit.id);
              }}
              className="btn-ref-view-details"
              id={`btn-details-${habit.id}`}
            >
              <span>View Details</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
