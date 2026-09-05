// Dedicated Authentication Service for HabitFlow

const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const TOKEN_KEY = 'habitflow_token';

/**
 * Token storage helpers
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to save auth token to localStorage', err);
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove auth token from localStorage', err);
  }
};

/**
 * Helper to process API error messages
 */
async function parseErrorResponse(response) {
  let message = `Request failed with status ${response.status}`;
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      message = typeof errorData.detail === 'string'
        ? errorData.detail
        : JSON.stringify(errorData.detail);
    }
  } catch {
    // Non-JSON response
  }
  return new Error(message);
}

/**
 * Authenticate with email & password
 * Returns: { access_token, token_type, user }
 */
export const login = async ({ email, password }) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const data = await response.json();
  if (data.access_token) {
    setToken(data.access_token);
  }
  return data;
};

/**
 * Register a new user account
 * Returns safe user object: { id, name, email, created_at }
 */
export const register = async ({ name, email, password }) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      password,
    }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return await response.json();
};

/**
 * Fetch the currently authenticated user profile
 * Returns: { id, name, email, created_at }
 */
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    throw await parseErrorResponse(response);
  }

  return await response.json();
};

/**
 * Update the current user profile (e.g. name)
 * Returns: updated user object: { id, name, email, created_at }
 */
export const updateProfile = async ({ name }) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: (name || '').trim() }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    throw await parseErrorResponse(response);
  }

  return await response.json();
};

export default {
  getToken,
  setToken,
  clearToken,
  login,
  register,
  getCurrentUser,
  updateProfile,
};
