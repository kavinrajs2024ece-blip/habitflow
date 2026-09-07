// Dedicated Authentication Service for HabitFlow

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const BASE_URL = rawApiUrl 
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
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
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        message = errorData.detail.map((d) => d.msg || d.message).join(', ');
      } else {
        message = JSON.stringify(errorData.detail);
      }
    }
  } catch {
    if (response.status >= 500) {
      message = 'Unable to connect to server';
    }
  }

  // Normalize standard error messages
  if (response.status === 401) {
    message = 'Invalid email or password';
  } else if (response.status === 400 && message.toLowerCase().includes('already registered')) {
    message = 'Email already registered. Please login.';
  } else if (response.status >= 502 && response.status <= 504) {
    message = 'Unable to connect to server';
  }

  return new Error(message);
}

function handleFetchError(err) {
  if (
    err instanceof TypeError ||
    err.name === 'AbortError' ||
    (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')))
  ) {
    throw new Error('Unable to connect to server');
  }
  throw err;
}

/**
 * Authenticate with email & password
 * Returns: { access_token, token_type, user }
 */
export const login = async ({ email, password }) => {
  let response;
  try {
    response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch (err) {
    handleFetchError(err);
  }

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
  let response;
  try {
    response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    });
  } catch (err) {
    handleFetchError(err);
  }

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

  let response;
  try {
    response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    handleFetchError(err);
  }

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

  let response;
  try {
    response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: (name || '').trim() }),
    });
  } catch (err) {
    handleFetchError(err);
  }

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
