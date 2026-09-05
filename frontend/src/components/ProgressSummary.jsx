import React from 'react';
import { CheckCircle2, Flame, Target, Trophy, TrendingUp, Percent } from 'lucide-react';
import { calculateStreak } from '../utils/dateUtils';

export default function ProgressSummary({ habits = [], records = {}, todayKey = '' }) {
  const totalHabits = habits.length;
  const completedToday = habits.filter(
    (h) => records[`${h.id}_${todayKey}`] === true
  ).length;

  const percentage = totalHabits > 0 
    ? Math.round((completedToday / totalHabits) * 100) 
    : 0;

  // Best active streak calculated dynamically across all habits
  const highestStreak = habits.reduce(
    (max, h) => Math.max(max, calculateStreak(h.id, records)),
    0
  );

  // SVG ring calculations for the circular progress badge
  const strokeWidth = 7;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-summary-grid">
      {/* 1. Today's Completion Percentage */}
      <div className="summary-stat-card card-gradient-accent">
        <div className="stat-card-header">
          <span className="stat-card-title">Today's Progress</span>
          <div className="stat-icon-wrap icon-purple">
            <Percent size={18} />
          </div>
        </div>
        <div className="stat-card-body">
          <div className="stat-value-group">
            <div className="stat-main-number">{percentage}%</div>
            <div className="stat-subtext">
              {percentage === 100 ? 'All completed 🎉' : `${completedToday} of ${totalHabits} done`}
            </div>
          </div>
          <div className="stat-mini-ring">
            <svg width="78" height="78">
              <circle
                className="progress-ring-circle-bg"
                stroke="var(--border-color, #e2e8f0)"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx="39"
                cy="39"
              />
              <circle
                className="progress-ring-circle"
                stroke="url(#summaryGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="39"
                cy="39"
              />
              <defs>
                <linearGradient id="summaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="mini-ring-label">{percentage}%</span>
          </div>
        </div>
        {/* Animated Linear Progress bar */}
        <div className="stat-progress-track">
          <div 
            className="stat-progress-bar"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 2. Current Streak */}
      <div className="summary-stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Current Streak</span>
          <div className="stat-icon-wrap icon-orange">
            <Flame size={18} />
          </div>
        </div>
        <div className="stat-card-body">
          <div className="stat-value-group">
            <div className="stat-main-number">
              {highestStreak} <span className="stat-unit">{highestStreak === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="stat-subtext">
              {highestStreak > 0 ? 'Consistent progress 🔥' : 'Start your streak today'}
            </div>
          </div>
        </div>
        <div className="stat-pill-footer">
          <span className="stat-chip chip-orange">
            <TrendingUp size={12} /> Top Active Streak
          </span>
        </div>
      </div>

      {/* 3. Total Habits */}
      <div className="summary-stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Total Habits</span>
          <div className="stat-icon-wrap icon-cyan">
            <Target size={18} />
          </div>
        </div>
        <div className="stat-card-body">
          <div className="stat-value-group">
            <div className="stat-main-number">{totalHabits}</div>
            <div className="stat-subtext">
              {totalHabits === 1 ? '1 active routine' : `${totalHabits} active routines`}
            </div>
          </div>
        </div>
        <div className="stat-pill-footer">
          <span className="stat-chip chip-cyan">
            Tracked in SQLite
          </span>
        </div>
      </div>

      {/* 4. Completed Habits Today */}
      <div className="summary-stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Completed Today</span>
          <div className="stat-icon-wrap icon-green">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="stat-card-body">
          <div className="stat-value-group">
            <div className="stat-main-number">
              {completedToday} <span className="stat-unit">/ {totalHabits}</span>
            </div>
            <div className="stat-subtext">
              {totalHabits - completedToday > 0 
                ? `${totalHabits - completedToday} remaining` 
                : '100% finished!'}
            </div>
          </div>
        </div>
        <div className="stat-pill-footer">
          <span className="stat-chip chip-green">
            {completedToday > 0 ? 'Recorded' : 'Pending log'}
          </span>
        </div>
      </div>
    </div>
  );
}
