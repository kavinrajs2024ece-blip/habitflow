import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Search, Calendar, ChevronDown, User, LogOut, CheckCircle2, Flame, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header({ 
  onOpenSidebar, 
  onOpenAddModal, 
  searchQuery, 
  setSearchQuery,
  onNavigateView
}) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  // Format current date nicely
  const today = new Date();
  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  const hour = today.getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17) {
    timeGreeting = 'Good evening';
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="mobile-hamburger-btn" 
          onClick={onOpenSidebar}
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div className="greeting-group">
          <h1 className="header-title">Habit Tracker</h1>
          <p className="header-subtitle">Track Today. Build a Better Tomorrow.</p>
        </div>
      </div>

      <div className="header-right">
        {/* Search Bar */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search habits"
          />
          {searchQuery && (
            <button 
              className="search-clear-btn" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Add Habit Primary CTA */}
        <button 
          className="btn btn-primary"
          onClick={onOpenAddModal}
          id="btn-add-habit-header"
        >
          <Plus size={18} />
          <span>Add Habit</span>
        </button>

        {/* Sun / Moon Quick Header Toggle */}
        <button 
          type="button"
          className="header-theme-toggle-btn" 
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} 
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          id="btn-top-theme-toggle"
        >
          {isDark ? <Sun size={18} className="theme-toggle-sun" /> : <Moon size={18} className="theme-toggle-moon" />}
        </button>

        {/* Profile Dropdown Menu */}
        <div className="profile-menu-container" ref={profileMenuRef}>
          <button 
            className={`profile-menu-trigger ${isProfileOpen ? 'active' : ''}`}
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
          >
            <div className="profile-avatar-bubble">
              <span>{userInitial}</span>
            </div>
            <div className="profile-trigger-info">
              <span className="profile-trigger-name">{user?.name || 'User'}</span>
            </div>
            <ChevronDown size={14} className={`chevron-indicator ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="profile-menu-header">
                <div className="profile-menu-avatar-large">
                  <span>{userInitial}</span>
                </div>
                <div className="profile-menu-details">
                  <div className="profile-name-text">{user?.name || 'HabitFlow User'}</div>
                  <div className="profile-email-text" title={user?.email}>{user?.email || 'user@example.com'}</div>
                  <span className="profile-role-badge">
                    <Shield size={11} /> Authenticated User
                  </span>
                </div>
              </div>

              <div className="profile-menu-divider" />

              <div className="profile-menu-actions">
                {onNavigateView && (
                  <>
                    <button 
                      className="profile-menu-item"
                      onClick={() => {
                        onNavigateView('profile');
                        setIsProfileOpen(false);
                      }}
                      role="menuitem"
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </button>
                    <button 
                      className="profile-menu-item"
                      onClick={() => {
                        onNavigateView('settings');
                        setIsProfileOpen(false);
                      }}
                      role="menuitem"
                    >
                      <Shield size={16} />
                      <span>Settings</span>
                    </button>
                    <button 
                      className="profile-menu-item"
                      onClick={() => {
                        onNavigateView('habits');
                        setIsProfileOpen(false);
                      }}
                      role="menuitem"
                    >
                      <CheckCircle2 size={16} />
                      <span>My Habits</span>
                    </button>
                  </>
                )}

                {/* Quick Theme Toggle Option */}
                <button
                  type="button"
                  className="profile-menu-item profile-theme-toggle-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  role="menuitem"
                  id="btn-header-theme-toggle"
                  title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                >
                  <div className="theme-toggle-item-left">
                    {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="theme-toggle-indicator-badge">
                    {isDark ? 'Dark' : 'Light'}
                  </span>
                </button>
              </div>

              <div className="profile-menu-divider" />

              <button 
                className="profile-menu-item profile-logout-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                role="menuitem"
                id="btn-profile-logout"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

