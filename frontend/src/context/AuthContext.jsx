import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(authService.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate existing token and fetch current user on initial load
  useEffect(() => {
    async function initAuth() {
      const storedToken = authService.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        authService.clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  /**
   * Login user, store access token, and fetch user profile via /api/auth/me
   */
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      // 1. Authenticate and receive access token
      const authData = await authService.login({ email, password });
      setToken(authData.access_token);

      // 2. Fetch authenticated user profile via /api/auth/me
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password');
      throw err;
    }
  }, []);

  /**
   * Register a new user account (returns created user without logging in,
   * allowing the UI to navigate to the Login page)
   */
  const register = useCallback(async (name, email, password) => {
    setAuthError(null);
    try {
      const createdUser = await authService.register({ name, email, password });
      return createdUser;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  /**
   * Clear session token and reset state
   */
  const logout = useCallback(() => {
    authService.clearToken();
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  /**
   * Update authenticated user profile
   */
  const updateUserProfile = useCallback(async ({ name }) => {
    try {
      const updatedUser = await authService.updateProfile({ name });
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      throw err;
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
