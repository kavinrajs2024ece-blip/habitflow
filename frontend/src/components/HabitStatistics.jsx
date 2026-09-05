import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Flame, 
  Trophy, 
  Activity, 
  BarChart3, 
  CheckCircle2, 
  XCircle,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  Table
} from 'lucide-react';
import { 
  calculateWeeklyStats, 
  calculateMonthlyStats,
  toDateString,
  parseLocalDate,
  diffCalendarDays 
} from '../utils/habitStatsEngine';
import CircularProgress from './CircularProgress';

export default function HabitStatistics({ 
  records, 
  habit, 
  onToggleDate 
}) {
  const today = useMemo(() => new Date(), []);
  const todayStr = toDateString(today);

  // Week navigation state (reference date in the selected week)
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => new Date());

  // Month navigation state (year & 0-indexed month)
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  // Week Navigation handlers
  const handlePrevWeek = () => {
    setSelectedWeekDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setSelectedWeekDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(new Date());
  };

  // Month Navigation handlers
  const handlePrevMonth = () => {
    setSelectedMonthYear((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelectedMonthYear((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleCurrentMonth = () => {
    setSelectedMonthYear({
      year: today.getFullYear(),
      month: today.getMonth(),
    });
  };

  // Calculate stats using engine
  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(records, selectedWeekDate, today);
  }, [records, selectedWeekDate, today]);

  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(records, selectedMonthYear.year, selectedMonthYear.month, today);
  }, [records, selectedMonthYear, today]);

  // Overall statistics calculation for the habit
  const overallStats = useMemo(() => {
    const completedSet = new Set();
    records.forEach((r) => {
      if (r.completed) {
        const dStr = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : toDateString(r.record_date);
        completedSet.add(dStr);
      }
    });

    const createdDate = habit?.created_at ? parseLocalDate(habit.created_at) : today;
    const daysSinceCreated = Math.max(1, diffCalendarDays(today, createdDate) + 1);
    
    // Goal is either target window or eligible days
    const completedCount = completedSet.size;
    const goalCount = Math.max(daysSinceCreated, completedCount);
    const leftCount = Math.max(0, goalCount - completedCount);
    const progressRate = goalCount > 0 ? Math.round((completedCount / goalCount) * 100) : 0;

    return {
      goal: goalCount,
      completed: completedCount,
      left: leftCount,
      progressRate,
    };
  }, [records, habit, today]);

  // Daily Analysis table records (sorted newest first)
  const dailyAnalysisList = useMemo(() => {
    const recordsMap = {};
    records.forEach((r) => {
      const dStr = typeof r.record_date === 'string' ? r.record_date.split('T')[0] : toDateString(r.record_date);
      recordsMap[dStr] = r.completed;
    });

    // Generate recent 14 days up to today
    const rows = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = toDateString(d);
      const isCompleted = recordsMap[dateStr] === true;

      rows.push({
        dateStr,
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        goal: 1,
        status: isCompleted ? 'Completed' : 'Not Completed',
        isCompleted,
        progress: isCompleted ? 100 : 0,
      });
    }
    return rows;
  }, [records, today]);

  // Status checks for current period highlight
  const isCurrentWeek = useMemo(() => {
    const { startDate, endDate } = weeklyStats;
    return todayStr >= startDate && todayStr <= endDate;
  }, [weeklyStats, todayStr]);

  const isCurrentMonth = useMemo(() => {
    return selectedMonthYear.year === today.getFullYear() && selectedMonthYear.month === today.getMonth();
  }, [selectedMonthYear, today]);

  return (
    <div className="habit-individual-stats-section" id="individual-habit-statistics">
      {/* ========================================================================= */}
      {/* 1. OVERALL PROGRESS HERO CARD (Circular Progress Chart)                   */}
      {/* ========================================================================= */}
      <div className="detail-overall-progress-card" id="card-overall-progress">
        <div className="overall-card-left">
          <div className="overall-badge-tag">
            <Target size={15} />
            <span>Habit Overview Target</span>
          </div>
          <h2 className="overall-title">Overall Performance Progress</h2>
          <p className="overall-sub">
            Lifetime target completion rate for <strong>{habit?.name || 'this habit'}</strong> based on tracked days.
          </p>

          <div className="overall-metric-boxes-grid">
            <div className="overall-box">
              <span className="box-label">Goal</span>
              <span className="box-value">{overallStats.goal}</span>
              <span className="box-unit">days</span>
            </div>

            <div className="overall-box highlight-box-completed">
              <span className="box-label">Completed</span>
              <span className="box-value text-emerald">{overallStats.completed}</span>
              <span className="box-unit">days</span>
            </div>

            <div className="overall-box">
              <span className="box-label">Left</span>
              <span className="box-value text-muted">{overallStats.left}</span>
              <span className="box-unit">days</span>
            </div>

            <div className="overall-box highlight-box-rate">
              <span className="box-label">Overall Progress</span>
              <span className="box-value text-indigo">{overallStats.progressRate}%</span>
              <span className="box-unit">completion</span>
            </div>
          </div>
        </div>

        <div className="overall-card-right">
          <CircularProgress
            percentage={overallStats.progressRate}
            size={114}
            strokeWidth={9}
            color="#10b981"
            trackColor="#f1f5f9"
            subText="Overall"
            fontSize={24}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DUAL GRID: WEEKLY & MONTHLY STATISTICS                                */}
      {/* ========================================================================= */}
      <div className="habit-stats-dual-grid">
        {/* Weekly Statistics Card */}
        <div className="habit-stats-card weekly-stats-card" id="card-weekly-statistics">
          <div className="stats-card-header">
            <div className="stats-header-info">
              <div className="stats-icon-badge icon-badge-indigo">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="stats-card-title">Weekly Statistics</h3>
                <span className="stats-period-range">{weeklyStats.label}</span>
              </div>
            </div>

            <div className="stats-period-nav">
              <button 
                onClick={handlePrevWeek} 
                className="btn-icon stats-nav-btn" 
                title="Previous Week"
                aria-label="Previous Week"
                id="btn-prev-week"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleCurrentWeek} 
                className={`btn btn-xs ${isCurrentWeek ? 'btn-period-current active' : 'btn-period-current'}`}
                title="Jump to This Week"
                id="btn-current-week"
              >
                This Week
              </button>
              <button 
                onClick={handleNextWeek} 
                className="btn-icon stats-nav-btn" 
                title="Next Week"
                aria-label="Next Week"
                id="btn-next-week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 7-Day Completion Timeline */}
          <div className="weekly-visual-chart-wrap">
            <span className="chart-label">7-Day Completion Timeline</span>
            <div className="weekly-chart-grid">
              {weeklyStats.days.map((dayItem) => {
                const canToggle = !dayItem.isFuture && onToggleDate;
                return (
                  <div 
                    key={dayItem.dateStr}
                    className={`weekly-chart-col ${dayItem.status} ${dayItem.isToday ? 'is-today-col' : ''} ${canToggle ? 'is-clickable' : ''}`}
                    onClick={() => canToggle && onToggleDate(dayItem.dateStr)}
                    title={`${dayItem.dateStr} (${dayItem.dayName}): ${
                      dayItem.status === 'completed' ? 'Completed' : dayItem.status === 'future' ? 'Future Date' : 'Not Completed'
                    }`}
                  >
                    <span className="chart-col-dayname">{dayItem.dayName}</span>
                    <div className={`chart-col-symbol-box status-${dayItem.status}`}>
                      {dayItem.status === 'completed' ? (
                        <Check size={14} strokeWidth={3.5} className="chart-check-icon" />
                      ) : dayItem.status === 'not_completed' ? (
                        <span className="chart-dash-symbol">-</span>
                      ) : (
                        <span className="chart-future-empty" />
                      )}
                    </div>
                    <span className="chart-col-daynum">{dayItem.dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Metrics Subgrid */}
          <div className="stats-kpi-subgrid">
            <div className="sub-kpi-item">
              <span className="sub-kpi-label">Completed</span>
              <div className="sub-kpi-value-row text-success">
                <CheckCircle2 size={16} />
                <span className="sub-kpi-value">{weeklyStats.completedDays}</span>
                <span className="sub-kpi-unit">days</span>
              </div>
            </div>

            <div className="sub-kpi-item">
              <span className="sub-kpi-label">Not Completed</span>
              <div className="sub-kpi-value-row text-muted-dash">
                <span className="sub-kpi-dash">-</span>
                <span className="sub-kpi-value">{weeklyStats.notCompletedDays}</span>
                <span className="sub-kpi-unit">days</span>
              </div>
            </div>

            <div className="sub-kpi-item">
              <span className="sub-kpi-label">Completion Rate</span>
              <div className="sub-kpi-value-row text-primary">
                <span className="sub-kpi-value">{weeklyStats.completionPercentage}%</span>
              </div>
            </div>

            <div className="sub-kpi-item">
              <span className="sub-kpi-label">Current Streak</span>
              <div className="sub-kpi-value-row text-orange">
                <Flame size={16} />
                <span className="sub-kpi-value">{weeklyStats.currentStreak}</span>
                <span className="sub-kpi-unit">d</span>
              </div>
            </div>
          </div>

          {/* Weekly Progress Bar */}
          <div className="stats-meter-wrap">
            <div className="meter-header">
              <span>Week Progress ({weeklyStats.completedDays} / {weeklyStats.eligibleDays} days)</span>
              <strong>{weeklyStats.completionPercentage}%</strong>
            </div>
            <div className="stats-meter-track">
              <div 
                className="stats-meter-fill fill-emerald" 
                style={{ width: `${weeklyStats.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Monthly Statistics Card */}
        <div className="habit-stats-card monthly-stats-card" id="card-monthly-statistics">
          <div className="stats-card-header">
            <div className="stats-header-info">
              <div className="stats-icon-badge icon-badge-emerald">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="stats-card-title">Monthly Statistics</h3>
                <span className="stats-period-range">{monthlyStats.label}</span>
              </div>
            </div>

            <div className="stats-period-nav">
              <button 
                onClick={handlePrevMonth} 
                className="btn-icon stats-nav-btn" 
                title="Previous Month"
                aria-label="Previous Month"
                id="btn-prev-month"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleCurrentMonth} 
                className={`btn btn-xs ${isCurrentMonth ? 'btn-period-current active' : 'btn-period-current'}`}
                title="Jump to This Month"
                id="btn-current-month"
              >
                This Month
              </button>
              <button 
                onClick={handleNextMonth} 
                className="btn-icon stats-nav-btn" 
                title="Next Month"
                aria-label="Next Month"
                id="btn-next-month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Monthly Circular Progress & Summary Row */}
          <div className="monthly-circular-hero-row">
            <div className="monthly-chart-box">
              <CircularProgress
                percentage={monthlyStats.completionPercentage}
                size={88}
                strokeWidth={7.5}
                color="#10b981"
                trackColor="#f1f5f9"
                fontSize={19}
              />
            </div>

            <div className="monthly-hero-details">
              <div className="monthly-stat-item">
                <span className="m-stat-label">Goal Days</span>
                <span className="m-stat-val">{monthlyStats.totalDays} days</span>
              </div>
              <div className="monthly-stat-item">
                <span className="m-stat-label">Completed</span>
                <span className="m-stat-val text-emerald">{monthlyStats.completedDays} days</span>
              </div>
              <div className="monthly-stat-item">
                <span className="m-stat-label">Left</span>
                <span className="m-stat-val text-muted">{monthlyStats.notCompletedDays} days</span>
              </div>
              <div className="monthly-stat-item">
                <span className="m-stat-label">Completion Rate</span>
                <span className="m-stat-val text-indigo">{monthlyStats.completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Monthly Progress Meter */}
          <div className="stats-meter-wrap">
            <div className="meter-header">
              <span>Month Completion ({monthlyStats.completedDays} of {monthlyStats.eligibleDays} elapsed days)</span>
              <strong>{monthlyStats.completionPercentage}%</strong>
            </div>
            <div className="stats-meter-track">
              <div 
                className="stats-meter-fill fill-emerald" 
                style={{ width: `${monthlyStats.completionPercentage}%` }}
              />
            </div>
            <div className="meter-footer-note">
              {isCurrentMonth ? (
                <span>Evaluated up to today. Remaining days in {monthlyStats.label} are not counted as missed.</span>
              ) : (
                <span>Evaluated across all {monthlyStats.totalDays} days of {monthlyStats.label}.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DAILY ANALYSIS TABLE                                                   */}
      {/* ========================================================================= */}
      <div className="daily-analysis-section" id="daily-analysis-table">
        <div className="section-title-wrap" style={{ margin: '1.75rem 0 1rem 0' }}>
          <div className="analysis-header-row">
            <div className="analysis-title-group">
              <Table size={18} className="analysis-icon" />
              <h3 className="section-title">Daily Analysis</h3>
            </div>
            <span className="analysis-count-badge">{dailyAnalysisList.length} Days Tracked</span>
          </div>
          <p className="section-sub">Detailed day-by-day record of goals, status, and progress.</p>
        </div>

        <div className="daily-analysis-table-wrap">
          <table className="daily-analysis-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Goal</th>
                <th>Status</th>
                <th>Progress</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dailyAnalysisList.map((row) => {
                const isTodayRow = row.dateStr === todayStr;
                return (
                  <tr key={row.dateStr} className={`daily-row ${isTodayRow ? 'row-is-today' : ''}`}>
                    <td className="daily-date-cell">
                      <div className="daily-date-group">
                        <strong className="daily-date-text">{row.formattedDate}</strong>
                        <span className="daily-dayname">{row.dayName}</span>
                        {isTodayRow && <span className="daily-today-pill">Today</span>}
                      </div>
                    </td>

                    <td className="daily-goal-cell">
                      <span className="daily-goal-badge">{row.goal}</span>
                    </td>

                    <td className="daily-status-cell">
                      {row.isCompleted ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      ) : (
                        <span className="badge badge-neutral-dash">
                          <XCircle size={13} /> Not Completed
                        </span>
                      )}
                    </td>

                    <td className="daily-progress-cell">
                      <div className="daily-progress-row">
                        <div className="daily-progress-bar-track">
                          <div 
                            className={`daily-progress-bar-fill ${row.isCompleted ? 'fill-completed' : 'fill-empty'}`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="daily-progress-num">{row.progress}%</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {onToggleDate && (
                        <button
                          onClick={() => onToggleDate(row.dateStr)}
                          className={`btn btn-xs ${row.isCompleted ? 'btn-outline' : 'btn-primary'}`}
                          title={`Toggle ${row.dateStr}`}
                        >
                          {row.isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
