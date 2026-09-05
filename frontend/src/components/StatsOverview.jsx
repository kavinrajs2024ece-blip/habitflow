import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Flame, 
  CheckCircle, 
  Trophy, 
  BarChart3,
  Calendar as CalendarIcon,
  ChevronDown,
  X
} from 'lucide-react';
import SummaryCard from './stats/SummaryCard';
import WeeklyConsistencyTrend from './stats/WeeklyConsistencyTrend';
import HabitBreakdown from './stats/HabitBreakdown';
import MonthlyCompletionOverview from './stats/MonthlyCompletionOverview';
import StreakHistory from './stats/StreakHistory';
import { getPastDays, formatDateKey, calculateStreak } from '../utils/dateUtils';

/**
 * Calculate the longest streak in history for a specific habit from the records map
 */
function getHabitLongestStreak(habitId, recordsMap) {
  const dates = [];
  const prefix = `${habitId}_`;

  Object.entries(recordsMap).forEach(([key, val]) => {
    if (key.startsWith(prefix) && Boolean(val)) {
      const dateStr = key.slice(prefix.length);
      dates.push(dateStr);
    }
  });

  if (dates.length === 0) return 0;
  // Sort unique dates ascending
  const uniqueDates = Array.from(new Set(dates)).sort();

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevParts = uniqueDates[i - 1].split('-').map(Number);
    const currParts = uniqueDates[i].split('-').map(Number);
    const prevDate = new Date(prevParts[0], prevParts[1] - 1, prevParts[2]);
    const currDate = new Date(currParts[0], currParts[1] - 1, currParts[2]);

    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else if (diffDays > 1) {
      currentRun = 1;
    }
  }

  return maxStreak;
}

/**
 * StatsOverview - Comprehensive Habit Performance Analytics Dashboard
 * 
 * @param {Object} props
 * @param {Array} props.habits - List of active habits
 * @param {Object} props.records - Key-value map: `${habitId}_${dateKey}` -> bool
 * @param {Function} props.setActiveView - Navigation callback to switch between views (e.g. 'calendar')
 */
export default function StatsOverview({ habits = [], records = {}, setActiveView }) {
  // Date Range Filter State
  const [dateRangeFilter, setDateRangeFilter] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // 1. Calculate 30-Day Completion Rate & Comparison vs Prior 30 Days
  const { monthlyRate, comparisonText } = useMemo(() => {
    const past60Days = getPastDays(60);
    const current30 = past60Days.slice(30); // days 30 to 59 (most recent 30 days)
    const prior30 = past60Days.slice(0, 30);   // days 0 to 29 (prior 30 days)

    let currentCheckins = 0;
    current30.forEach((d) => {
      const key = formatDateKey(d);
      habits.forEach((h) => {
        if (Boolean(records[`${h.id}_${key}`])) {
          currentCheckins++;
        }
      });
    });

    let priorCheckins = 0;
    prior30.forEach((d) => {
      const key = formatDateKey(d);
      habits.forEach((h) => {
        if (Boolean(records[`${h.id}_${key}`])) {
          priorCheckins++;
        }
      });
    });

    const totalPossibleCurrent = habits.length * current30.length;
    const currentRate = totalPossibleCurrent > 0 
      ? Math.round((currentCheckins / totalPossibleCurrent) * 100) 
      : 0;

    const totalPossiblePrior = habits.length * prior30.length;
    const priorRate = totalPossiblePrior > 0 
      ? Math.round((priorCheckins / totalPossiblePrior) * 100) 
      : 0;

    let comp = 'vs last month';
    if (priorCheckins > 0 || currentCheckins > 0) {
      const diff = currentRate - priorRate;
      if (diff > 0) comp = `+${diff}% vs last month`;
      else if (diff < 0) comp = `${diff}% vs last month`;
      else comp = `0% vs last month`;
    }

    return {
      monthlyRate: currentRate,
      comparisonText: comp,
    };
  }, [habits, records]);

  // 2. Best Streak Record (Across all active habits)
  const bestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return habits.reduce((max, h) => {
      const hLongest = getHabitLongestStreak(h.id, records);
      return Math.max(max, hLongest);
    }, 0);
  }, [habits, records]);

  // 3. Current Streak (Highest active streak)
  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return habits.reduce((max, h) => {
      const hStreak = calculateStreak(h.id, records);
      return Math.max(max, hStreak);
    }, 0);
  }, [habits, records]);

  // 4. Total Check-ins (Across all active habits)
  const totalCheckIns = useMemo(() => {
    let count = 0;
    habits.forEach((h) => {
      const prefix = `${h.id}_`;
      Object.entries(records).forEach(([key, val]) => {
        if (key.startsWith(prefix) && Boolean(val)) {
          count++;
        }
      });
    });
    return count;
  }, [habits, records]);

  // 5. Perfect Days (100% completion days across active habits)
  const perfectDaysCount = useMemo(() => {
    if (habits.length === 0) return 0;

    // Collect all unique record dates
    const dateSet = new Set();
    Object.keys(records).forEach((key) => {
      const parts = key.split('_');
      if (parts.length >= 2) {
        dateSet.add(parts.slice(1).join('_'));
      }
    });

    let perfectCount = 0;
    dateSet.forEach((dateKey) => {
      let allDone = true;
      for (const h of habits) {
        if (!Boolean(records[`${h.id}_${dateKey}`])) {
          allDone = false;
          break;
        }
      }
      if (allDone) {
        perfectCount++;
      }
    });

    return perfectCount;
  }, [habits, records]);

  const handleRangeSelect = (filterId) => {
    setDateRangeFilter(filterId);
    if (filterId === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const rangeOptions = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '6m', label: 'Last 6 Months' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="stats-dashboard-container">
      {/* 1. Page Header with Title, Analytics Icon, Subtitle, and Date Range Selector */}
      <div className="stats-page-header">
        <div className="stats-header-left">
          <div className="stats-header-title-row">
            <div className="stats-heading-icon-wrap">
              <BarChart3 size={22} className="stats-heading-icon" />
            </div>
            <h2 className="stats-main-heading">Habit Performance Analytics</h2>
          </div>
          <p className="stats-main-sub">
            Your habit journey in numbers. All data is calculated from your real activity.
          </p>
        </div>

        {/* Date Range Selector Filter on Right */}
        <div className="stats-range-filter-wrapper">
          <div className="stats-filter-pills" role="tablist" aria-label="Date Range Selector">
            {rangeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`filter-pill-btn ${dateRangeFilter === opt.id ? 'active' : ''}`}
                onClick={() => handleRangeSelect(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Popover */}
          {showCustomPicker && (
            <div className="custom-range-popover">
              <div className="custom-range-inputs">
                <div className="date-input-group">
                  <label>From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="stats-date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="stats-date-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn-close-popover"
                  onClick={() => setShowCustomPicker(false)}
                  title="Close custom range"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Summary Cards (4 Cards in One Responsive Row) */}
      <div className="stats-kpi-row-4">
        {/* Card 1: 30-Day Completion */}
        <SummaryCard
          icon={<TrendingUp size={22} />}
          label="30-Day Completion"
          value={`${monthlyRate}%`}
          subtitle="Monthly average"
          comparison={comparisonText}
          variant="blue"
        />

        {/* Card 2: Best Streak Record */}
        <SummaryCard
          icon={<Flame size={22} />}
          label="Best Streak Record"
          value={`${bestStreak} ${bestStreak === 1 ? 'Day' : 'Days'}`}
          subtitle="Unbroken run"
          variant="orange"
        />

        {/* Card 3: Total Check-ins */}
        <SummaryCard
          icon={<CheckCircle size={22} />}
          label="Total Check-ins"
          value={totalCheckIns}
          subtitle="Across all active habits"
          variant="green"
        />

        {/* Card 4: Perfect Days (100%) */}
        <SummaryCard
          icon={<Trophy size={22} />}
          label="Perfect Days (100%)"
          value={`${perfectDaysCount} ${perfectDaysCount === 1 ? 'Day' : 'Days'}`}
          subtitle="All habits finished"
          variant="purple"
        />
      </div>

      {/* 3 & 4. Mid Section: Weekly Consistency Trend (Large) + Habit Breakdown (Medium) */}
      <div className="stats-grid-row-2col">
        <WeeklyConsistencyTrend habits={habits} records={records} />
        <HabitBreakdown habits={habits} />
      </div>

      {/* 5 & 6. Bottom Section: Monthly Completion Overview (Large) + Streak History (Medium) */}
      <div className="stats-grid-row-2col">
        <MonthlyCompletionOverview habits={habits} records={records} />
        <StreakHistory
          currentStreak={currentStreak}
          longestStreak={bestStreak}
          perfectDays={perfectDaysCount}
          totalCheckIns={totalCheckIns}
          onViewCalendar={() => setActiveView && setActiveView('calendar')}
        />
      </div>
    </div>
  );
}
