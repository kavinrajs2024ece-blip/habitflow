// Centralized API Service Layer for HabitFlow Habits & Records
import { getToken, clearToken } from './authService';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const BASE_URL = rawApiUrl 
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

/**
 * Universal helper for JSON fetch requests with automatic Bearer token injection
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 204 No Content has no body
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid or expired
        clearToken();
      }

      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback if response is not JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
    throw err;
  }
}

// --- Habit Endpoints ---

export const getHabits = () => {
  return apiRequest('/habits');
};

export const getHabitById = (id) => {
  return apiRequest(`/habits/${id}`);
};

export const createHabit = (habitData) => {
  return apiRequest('/habits', {
    method: 'POST',
    body: JSON.stringify({
      name: habitData.name.trim(),
      description: habitData.description?.trim() || null,
      reminder_enabled: Boolean(habitData.reminder_enabled),
      reminder_time: habitData.reminder_time || null,
    }),
  });
};

export const updateHabit = (id, habitData) => {
  return apiRequest(`/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(habitData),
  });
};

export const deleteHabit = (id) => {
  return apiRequest(`/habits/${id}`, {
    method: 'DELETE',
  });
};

// --- Daily Habit Record Endpoints ---

export const upsertHabitRecord = (habitId, recordDate, completed) => {
  return apiRequest(`/habits/${habitId}/records`, {
    method: 'POST',
    body: JSON.stringify({
      record_date: recordDate,
      completed: Boolean(completed),
    }),
  });
};

export const getRecordsForHabit = (habitId) => {
  return apiRequest(`/habits/${habitId}/records`);
};

export const getRecordsByDate = (dateStr) => {
  return apiRequest(`/records/by-date/${dateStr}`);
};

export const getRecordsRange = (startDate, endDate, habitId = null) => {
  let query = `?start_date=${startDate}&end_date=${endDate}`;
  if (habitId) query += `&habit_id=${habitId}`;
  return apiRequest(`/records/range${query}`);
};

export const getHabitStatistics = (habitId, period = 'week', targetDate = null) => {
  let query = `?period=${period}`;
  if (targetDate) query += `&target_date=${targetDate}`;
  return apiRequest(`/habits/${habitId}/statistics${query}`);
};
