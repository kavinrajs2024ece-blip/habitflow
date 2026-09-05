import React from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Check, 
  Sliders, 
  Database, 
  Zap, 
  Info 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * SettingsPage - Professional SaaS Settings & Preferences with Light / Dark Mode Toggle
 */
export default function SettingsPage() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  return (
    <div className="settings-dashboard-layout">
      {/* 1. Page Header */}
      <div className="settings-page-header">
        <div className="settings-header-left">
          <div className="settings-heading-row">
            <div className="settings-header-icon-box">
              <Settings size={20} />
            </div>
            <h2 className="settings-main-title">Settings & Preferences</h2>
          </div>
          <p className="settings-main-sub">Manage your application appearance and preferences</p>
        </div>
      </div>

      {/* 2. Appearance Section */}
      <div className="settings-card appearance-card">
        <div className="card-header-clean">
          <div className="card-title-icon-row">
            <Sliders size={18} className="theme-section-icon" />
            <h3 className="card-clean-title">Appearance</h3>
          </div>
          <p className="card-clean-sub">
            Customize how HabitFlow looks to you. Choose between Light and Dark themes.
          </p>
        </div>

        {/* Professional Segmented Theme Toggle */}
        <div className="appearance-segmented-wrap">
          <div className="appearance-segmented-toggle" role="radiogroup" aria-label="Theme selection">
            <button
              type="button"
              role="radio"
              aria-checked={!isDark}
              className={`segmented-theme-btn ${!isDark ? 'is-selected' : ''}`}
              onClick={() => setTheme('light')}
              id="btn-segmented-light"
            >
              <span className="segmented-emoji">☀️</span>
              <span className="segmented-label">Light</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isDark}
              className={`segmented-theme-btn ${isDark ? 'is-selected' : ''}`}
              onClick={() => setTheme('dark')}
              id="btn-segmented-dark"
            >
              <span className="segmented-emoji">🌙</span>
              <span className="segmented-label">Dark</span>
            </button>
          </div>
        </div>

        {/* Two Selectable Theme Cards */}
        <div className="theme-options-grid">
          {/* Light Mode Option Card */}
          <div
            className={`theme-selector-card ${!isDark ? 'is-selected' : ''}`}
            onClick={() => setTheme('light')}
            role="button"
            tabIndex={0}
            aria-pressed={!isDark}
            id="card-theme-light"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTheme('light');
            }}
          >
            <div className="theme-card-top">
              <div className="theme-icon-wrap icon-sun">
                <Sun size={24} />
              </div>
              <div className="theme-radio-indicator">
                {!isDark && <Check size={14} className="check-icon" />}
              </div>
            </div>

            <div className="theme-card-body">
              <div className="theme-title-row">
                <h4 className="theme-name">☀️ Light</h4>
                {!isDark && <span className="theme-active-badge">Active</span>}
              </div>
              <p className="theme-desc">
                Clean, soft neutral palette optimized for daytime productivity. (Default)
              </p>
            </div>

            {/* Visual Mini Mockup */}
            <div className="theme-preview-box preview-light">
              <div className="preview-mini-header" />
              <div className="preview-mini-content">
                <div className="preview-mini-sidebar" />
                <div className="preview-mini-cards">
                  <div className="preview-mini-card" />
                  <div className="preview-mini-card" />
                </div>
              </div>
            </div>
          </div>

          {/* Dark Mode Option Card */}
          <div
            className={`theme-selector-card ${isDark ? 'is-selected' : ''}`}
            onClick={() => setTheme('dark')}
            role="button"
            tabIndex={0}
            aria-pressed={isDark}
            id="card-theme-dark"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setTheme('dark');
            }}
          >
            <div className="theme-card-top">
              <div className="theme-icon-wrap icon-moon">
                <Moon size={24} />
              </div>
              <div className="theme-radio-indicator">
                {isDark && <Check size={14} className="check-icon" />}
              </div>
            </div>

            <div className="theme-card-body">
              <div className="theme-title-row">
                <h4 className="theme-name">🌙 Dark</h4>
                {isDark && <span className="theme-active-badge badge-dark">Active</span>}
              </div>
              <p className="theme-desc">
                Deep navy and charcoal tones crafted for comfort in low-light environments.
              </p>
            </div>

            {/* Visual Mini Mockup */}
            <div className="theme-preview-box preview-dark">
              <div className="preview-mini-header" />
              <div className="preview-mini-content">
                <div className="preview-mini-sidebar" />
                <div className="preview-mini-cards">
                  <div className="preview-mini-card" />
                  <div className="preview-mini-card" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Toggle Switch Bar */}
        <div className="theme-switch-bar">
          <div className="theme-switch-info">
            <span className="switch-info-title">Current Selection</span>
            <span className="switch-info-desc">
              Theme is currently set to <strong>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</strong>
            </span>
          </div>

          <button
            type="button"
            className="theme-quick-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            <span className={`toggle-icon-pill ${!isDark ? 'active-pill' : ''}`}>
              <Sun size={15} />
              <span>☀️ Light</span>
            </span>
            <span className={`toggle-icon-pill ${isDark ? 'active-pill' : ''}`}>
              <Moon size={15} />
              <span>🌙 Dark</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. System & Application Configuration Card */}
      <div className="settings-card config-card">
        <div className="card-header-clean">
          <div className="card-title-icon-row">
            <Info size={18} className="theme-section-icon" />
            <h3 className="card-clean-title">Application Config</h3>
          </div>
          <p className="card-clean-sub">System architecture and runtime details</p>
        </div>

        <div className="config-items-list">
          <div className="config-row-item">
            <div className="config-item-left">
              <div className="config-icon-box icon-emerald">
                <Zap size={16} />
              </div>
              <div>
                <span className="config-item-name">Streak Calculation</span>
                <span className="config-item-detail">Graceful timezone-aware consecutive days</span>
              </div>
            </div>
            <span className="config-badge badge-emerald">Active</span>
          </div>

          <div className="config-row-item">
            <div className="config-item-left">
              <div className="config-icon-box icon-blue">
                <Database size={16} />
              </div>
              <div>
                <span className="config-item-name">Backend Database</span>
                <span className="config-item-detail">SQLite + FastAPI asynchronous engine</span>
              </div>
            </div>
            <span className="config-badge badge-blue">Connected</span>
          </div>

          <div className="config-row-item">
            <div className="config-item-left">
              <div className="config-icon-box icon-slate">
                <Info size={16} />
              </div>
              <div>
                <span className="config-item-name">HabitFlow Version</span>
                <span className="config-item-detail">Modern SaaS reference edition</span>
              </div>
            </div>
            <span className="config-version-text">v2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
