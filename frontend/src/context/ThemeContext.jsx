import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'habitflow_theme';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

/**
 * ThemeProvider manages global Light / Dark mode with localStorage persistence
 * and document root synchronization.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // localStorage unavailable or restricted
    }
    return 'light'; // Default to light mode
  });

  // Apply theme attribute to html and body elements
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      console.warn('Failed to save theme to localStorage:', err);
    }

    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      root.classList.remove('dark');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
