// Pure, Reusable Streak and Analytics Calculation Engine for HabitFlow

/**
 * Format Date to local YYYY-MM-DD string
 */
export const toDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse YYYY-MM-DD into a local Date object set at midnight
 */
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Calculate difference in calendar days (dateA - dateB)
 */
export const diffCalendarDays = (dateA, dateB) => {
  const a = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const b = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a - b) / msPerDay);
};

/**
 * Build a fast lookup Set of completed date strings from records array
 */
export const getCompletedDateSet = (records) => {
  const set = new Set();
  if (!Array.isArray(records)) return set;

  records.forEach((rec) => {
    if (rec.completed) {
      // Handles both "YYYY-MM-DD" and ISO strings
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
 * 
 * Rules:
 * - If today is completed: count today + consecutive completed days backwards.
 * - If today is NOT completed: today is still in progress. If yesterday was completed,
 *   the streak is alive! Count consecutive completed days backwards from yesterday.
 * - If yesterday was also missed, the streak is 0.
 * - Missing any day breaks the streak.
 */
export const calculateCurrentStreak = (records, todayDate = new Date()) => {
  const completedSet = getCompletedDateSet(records);
  const todayStr = toDateString(todayDate);

  let streak = 0;
  const isTodayCompleted = completedSet.has(todayStr);

  let checkDate = new Date(todayDate);

  if (isTodayCompleted) {
    // Today is completed -> count 1 and proceed backwards
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Today is not completed yet -> start inspecting from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = toDateString(checkDate);
    if (!completedSet.has(yesterdayStr)) {
      return 0; // Yesterday was missed -> streak broken
    }
  }

  // Count consecutive days backwards
  while (true) {
    const dateStr = toDateString(checkDate);
    if (completedSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Gap found -> stop streak count
    }
  }

  return streak;
};

/**
 * Calculate Longest Streak in history
 * 
 * Rules:
 * - Scans all unique completed dates sorted in ascending order.
 * - Finds the maximum run of consecutive calendar days.
 */
export const calculateLongestStreak = (records) => {
  const completedSet = getCompletedDateSet(records);
  if (completedSet.size === 0) return 0;

  // Sort completed dates ascending
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
      currentRun = 1; // Gap encountered -> reset run
    }
  }

  return maxStreak;
};

/**
 * Calculate Overall Completion Percentage
 * 
 * Rules:
 * - Start date: habit creation date (or earliest record date).
 * - End date: today.
 * - Future dates are never counted in total days or considered missed.
 */
export const calculateCompletionRate = (records, createdAt, todayDate = new Date()) => {
  const completedSet = getCompletedDateSet(records);
  const today = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  
  let startDate = createdAt ? parseLocalDate(createdAt) : new Date(todayDate);
  if (startDate > today) {
    startDate = new Date(today);
  }

  // Total days from start to today inclusive
  const totalDays = Math.max(1, diffCalendarDays(today, startDate) + 1);

  // Count completions that fall between startDate and today
  let completedCount = 0;
  const curr = new Date(startDate);
  while (curr <= today) {
    if (completedSet.has(toDateString(curr))) {
      completedCount++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  const percentage = Math.round((completedCount / totalDays) * 100);
  return {
    percentage,
    completedDays: completedCount,
    totalEligibleDays: totalDays,
    missedDays: Math.max(0, totalDays - completedCount),
  };
};

/**
 * Calculate Weekly and Monthly Statistics
 */
export const calculatePeriodStats = (records, todayDate = new Date()) => {
  const completedSet = getCompletedDateSet(records);
  const today = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

  // 1. Current Week (Monday to today)
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  let weekCompleted = 0;
  const weekTotal = daysSinceMonday + 1; // Days elapsed so far this week
  const weekScan = new Date(monday);
  while (weekScan <= today) {
    if (completedSet.has(toDateString(weekScan))) {
      weekCompleted++;
    }
    weekScan.setDate(weekScan.getDate() + 1);
  }
  const weekRate = Math.round((weekCompleted / weekTotal) * 100);

  // 2. Current Month (1st to today)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let monthCompleted = 0;
  const monthTotal = today.getDate(); // Days elapsed so far this month
  const monthScan = new Date(firstOfMonth);
  while (monthScan <= today) {
    if (completedSet.has(toDateString(monthScan))) {
      monthCompleted++;
    }
    monthScan.setDate(monthScan.getDate() + 1);
  }
  const monthRate = Math.round((monthCompleted / monthTotal) * 100);

  return {
    week: {
      completed: weekCompleted,
      total: weekTotal,
      percentage: weekRate,
    },
    month: {
      completed: monthCompleted,
      total: monthTotal,
      percentage: monthRate,
    },
  };
};

/**
 * Categorize a single calendar day for visual display
 * 
 * Statuses:
 * - 'future': Date is after today (never missed)
 * - 'before-creation': Date is before habit was created
 * - 'completed': Completed on or before today
 * - 'today-completed': Today and marked done
 * - 'today-pending': Today and not marked done yet
 * - 'missed': Past day between creation and yesterday that was NOT completed
 */
export const getDayStatus = (dateStr, recordsMap, createdAt, todayStr) => {
  const isCompleted = recordsMap[dateStr] === true;
  const dateObj = parseLocalDate(dateStr);
  const todayObj = parseLocalDate(todayStr);

  // 1. Future date check
  if (dateObj > todayObj) {
    return 'future';
  }

  // 2. Today check
  if (dateStr === todayStr) {
    return isCompleted ? 'today-completed' : 'today-pending';
  }

  // 3. Completed in the past
  if (isCompleted) {
    return 'completed';
  }

  // 4. Check if date was before habit creation
  if (createdAt) {
    const createdDate = parseLocalDate(createdAt);
    if (dateObj < createdDate) {
      return 'before-creation';
    }
  }

  // 5. Past date after creation that was not completed
  return 'missed';
};
