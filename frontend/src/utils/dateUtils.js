// Date & Streak Utilities for HabitFlow

/**
 * Format a Date object to YYYY-MM-DD string
 */
export const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the current local date as YYYY-MM-DD
 */
export const getTodayKey = () => {
  return formatDateKey(new Date());
};

/**
 * Return an array of Date objects for the past N days (ending with today)
 */
export const getPastDays = (count = 7) => {
  const days = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
};

/**
 * Calculate the current streak for a habit based on records map
 */
export const calculateStreak = (habitId, recordsMap) => {
  const today = new Date();
  let streak = 0;
  
  // Check if today is completed
  const todayKey = formatDateKey(today);
  const todayDone = Boolean(recordsMap[`${habitId}_${todayKey}`]);

  // Start checking from today or yesterday
  let checkDate = new Date(today);
  if (!todayDone) {
    // If today is not completed yet, check if yesterday was completed to keep streak alive
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    if (Boolean(recordsMap[`${habitId}_${key}`])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Aesthetic category palette and icons
 */
export const CATEGORIES = [
  { name: 'Health', color: '#06b6d4', icon: 'Droplets' },
  { name: 'Productivity', color: '#8b5cf6', icon: 'Brain' },
  { name: 'Mindfulness', color: '#6366f1', icon: 'Sparkles' },
  { name: 'Fitness', color: '#10b981', icon: 'Dumbbell' },
  { name: 'General', color: '#f59e0b', icon: 'Target' },
];

export const getCategoryMeta = (categoryName) => {
  return (
    CATEGORIES.find(
      (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
    ) || CATEGORIES[4] // default to General
  );
};

/**
 * Extract goal days from habit description string (e.g. "[Goal: 21]" or "Goal: 100")
 * Falls back to default of 30 if no goal days specified.
 */
export const parseHabitGoal = (description) => {
  if (!description) return 30;
  const match = description.match(/\[Goal:\s*(\d+)\]/i) || description.match(/goal:\s*(\d+)/i);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0) {
      return val;
    }
  }
  return 30;
};

/**
 * Extract clean description by stripping [Category] and [Goal: X] tags
 */
export const getCleanDescription = (description) => {
  if (!description) return '';
  let text = description;
  // Remove [Goal: X]
  text = text.replace(/\[Goal:\s*\d+\]/gi, '');
  // Remove [Category] if present at beginning
  if (text.trim().startsWith('[')) {
    const endIdx = text.indexOf(']');
    if (endIdx > 1) {
      text = text.substring(endIdx + 1);
    }
  }
  return text.trim();
};

/**
 * Format category, goal days, and user description into a single string for backend storage
 */
export const formatHabitDescription = (categoryName = 'General', goalDays = 30, userDesc = '') => {
  const catPart = `[${categoryName}]`;
  const goalPart = `[Goal: ${goalDays || 30}]`;
  const cleanDesc = (userDesc || '').trim();
  return cleanDesc ? `${catPart} ${goalPart} ${cleanDesc}` : `${catPart} ${goalPart}`;
};

