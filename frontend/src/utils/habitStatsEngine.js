/**
 * HabitFlow - Individual Habit Statistics Calculation Engine
 * 
 * Implements strict date cutoff rules:
 * - Current week/month: only days up to today are eligible (future days are not counted as missed).
 * - Past week/month: all days in that period are eligible.
 * - Future week/month: 0 eligible days.
 * - Completed day: record exists with completed=true.
 * - Not completed day: day was eligible but no completed record exists.
 */

export const toDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const diffCalendarDays = (dateA, dateB) => {
  const a = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const b = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a - b) / msPerDay);
};

export const getCompletedDateSet = (records) => {
  const set = new Set();
  if (!Array.isArray(records)) return set;
  records.forEach((rec) => {
    if (rec.completed) {
      const dStr = typeof rec.record_date === 'string'
        ? rec.record_date.split('T')[0]
        : toDateString(rec.record_date);
      set.add(dStr);
    }
  });
  return set;
};

/**
 * Calculate Current Streak (consecutive completed days)
 */
export const calculateCurrentStreak = (records, todayDate = new Date()) => {
  const completedSet = getCompletedDateSet(records);
  const todayStr = toDateString(todayDate);

  let streak = 0;
  const isTodayCompleted = completedSet.has(todayStr);
  let checkDate = new Date(todayDate);

  if (isTodayCompleted) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = toDateString(checkDate);
    if (!completedSet.has(yesterdayStr)) {
      return 0;
    }
  }

  while (true) {
    const dateStr = toDateString(checkDate);
    if (completedSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Calculate Longest / Best Streak in history
 */
export const calculateBestStreak = (records) => {
  const completedSet = getCompletedDateSet(records);
  if (completedSet.size === 0) return 0;

  const sortedDates = Array.from(completedSet)
    .map(parseLocalDate)
    .sort((a, b) => a - b);

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = diffCalendarDays(sortedDates[i], sortedDates[i - 1]);
    if (diff === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else if (diff > 1) {
      currentRun = 1;
    }
  }

  return maxStreak;
};

/**
 * Returns Monday to Sunday dates for a given reference date
 */
export const getWeekRange = (refDate) => {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(d);
  monday.setDate(d.getDate() - daysSinceMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatOpts = { month: 'short', day: 'numeric' };
  const label = monday.getFullYear() === sunday.getFullYear()
    ? `${monday.toLocaleDateString('en-US', formatOpts)} – ${sunday.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' })}`
    : `${monday.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric' })}`;

  return {
    monday,
    sunday,
    label,
  };
};

/**
 * Calculate Weekly Statistics for a specific week
 */
export const calculateWeeklyStats = (records, refDate = new Date(), todayDate = new Date()) => {
  const { monday, sunday, label } = getWeekRange(refDate);
  const completedSet = getCompletedDateSet(records);
  const todayStr = toDateString(todayDate);

  const days = [];
  let completedDays = 0;
  let eligibleDays = 0;

  for (let i = 0; i < 7; i++) {
    const dayObj = new Date(monday);
    dayObj.setDate(monday.getDate() + i);
    const dateStr = toDateString(dayObj);
    const isFuture = dateStr > todayStr;
    const isToday = dateStr === todayStr;
    const isCompleted = completedSet.has(dateStr);

    let status = 'not_completed';
    if (isFuture) {
      status = 'future';
    } else if (isCompleted) {
      status = 'completed';
      completedDays++;
      eligibleDays++;
    } else {
      status = 'not_completed';
      eligibleDays++;
    }

    days.push({
      date: dayObj,
      dateStr,
      dayName: dayObj.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: dayObj.getDate(),
      status, // 'completed' | 'not_completed' | 'future'
      isCompleted,
      isFuture,
      isToday,
    });
  }

  const notCompletedDays = Math.max(0, eligibleDays - completedDays);
  const completionPercentage = eligibleDays > 0
    ? Math.round((completedDays / eligibleDays) * 100)
    : 0;

  return {
    period: 'week',
    label,
    startDate: toDateString(monday),
    endDate: toDateString(sunday),
    totalDays: 7,
    eligibleDays,
    completedDays,
    notCompletedDays,
    completionPercentage,
    currentStreak: calculateCurrentStreak(records, todayDate),
    bestStreak: calculateBestStreak(records),
    days,
  };
};

/**
 * Calculate Monthly Statistics for a specific year and month (0-indexed month)
 */
export const calculateMonthlyStats = (records, year, month, todayDate = new Date()) => {
  const completedSet = getCompletedDateSet(records);
  const todayStr = toDateString(todayDate);

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const firstOfMonth = new Date(year, month, 1);
  const monthTitle = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth();
  const isPastMonth = year < todayDate.getFullYear() || (year === todayDate.getFullYear() && month < todayDate.getMonth());

  let eligibleDays = 0;
  if (isCurrentMonth) {
    eligibleDays = todayDate.getDate(); // Up to today only
  } else if (isPastMonth) {
    eligibleDays = totalDaysInMonth; // All days in past month
  } else {
    eligibleDays = 0; // Future month has 0 eligible days
  }

  let completedDays = 0;
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = toDateString(d);
    if (dateStr <= todayStr && completedSet.has(dateStr)) {
      completedDays++;
    }
  }

  const notCompletedDays = Math.max(0, eligibleDays - completedDays);
  const completionPercentage = eligibleDays > 0
    ? Math.round((completedDays / eligibleDays) * 100)
    : 0;

  return {
    period: 'month',
    label: monthTitle,
    year,
    month,
    totalDays: totalDaysInMonth,
    eligibleDays,
    completedDays,
    notCompletedDays,
    completionPercentage,
    currentStreak: calculateCurrentStreak(records, todayDate),
    bestStreak: calculateBestStreak(records),
  };
};
