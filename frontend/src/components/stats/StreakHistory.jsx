import React from 'react';
import { Flame, Trophy, Award, CheckCircle, ArrowRight, Calendar } from 'lucide-react';

/**
 * StreakHistory - Compact card showing streak statistics and a button to view the calendar
 * 
 * @param {Object} props
 * @param {number} props.currentStreak - User's current highest streak in days
 * @param {number} props.longestStreak - User's all-time longest streak in days
 * @param {number} props.perfectDays - Total number of perfect completion days
 * @param {number} props.totalCheckIns - Total completed habit check-ins
 * @param {Function} props.onViewCalendar - Navigation callback to switch to Calendar page
 */
export default function StreakHistory({
  currentStreak = 0,
  longestStreak = 0,
  perfectDays = 0,
  totalCheckIns = 0,
  onViewCalendar,
}) {
  const rows = [
    {
      id: 'current',
      label: 'Current Streak',
      value: `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`,
      icon: <Flame size={17} className="text-orange-500" />,
      iconBg: 'bg-orange-subtle',
    },
    {
      id: 'longest',
      label: 'Longest Streak',
      value: `${longestStreak} ${longestStreak === 1 ? 'Day' : 'Days'}`,
      icon: <Trophy size={17} className="text-amber-500" />,
      iconBg: 'bg-amber-subtle',
    },
    {
      id: 'perfect',
      label: 'Total Perfect Days',
      value: `${perfectDays} ${perfectDays === 1 ? 'Day' : 'Days'}`,
      icon: <Award size={17} className="text-purple-500" />,
      iconBg: 'bg-purple-subtle',
    },
    {
      id: 'checkins',
      label: 'Total Check-ins',
      value: `${totalCheckIns}`,
      icon: <CheckCircle size={17} className="text-emerald-500" />,
      iconBg: 'bg-emerald-subtle',
    },
  ];

  return (
    <div className="chart-card streak-history-card">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-title">Streak History</h3>
          <p className="chart-sub">Your recent streak performance</p>
        </div>
        <div className="streak-badge-flame">
          <Flame size={16} />
        </div>
      </div>

      <div className="streak-rows-list">
        {rows.map((row) => (
          <div key={row.id} className="streak-history-row">
            <div className="streak-row-left">
              <div className={`streak-row-icon-box ${row.iconBg}`}>
                {row.icon}
              </div>
              <span className="streak-row-label">{row.label}</span>
            </div>
            <span className="streak-row-value">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="streak-history-footer">
        <button
          type="button"
          className="btn-view-calendar"
          onClick={onViewCalendar}
        >
          <Calendar size={15} />
          <span>View Calendar</span>
          <ArrowRight size={15} className="btn-arrow" />
        </button>
      </div>
    </div>
  );
}
