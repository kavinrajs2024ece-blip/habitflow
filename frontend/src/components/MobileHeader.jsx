import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Bell, User, Settings, LogOut, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDisplayTime } from '../services/notificationService';

export default function MobileHeader({ 
  onNavigateView, 
  habits = [],
  onOpenReminders
}) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userInitial = user?.name 
    ? user.name.trim().charAt(0).toUpperCase() 
    : (user?.email ? user.email.trim().charAt(0).toUpperCase() : 'U');

  // Active reminders
  const activeReminders = habits.filter(h => h.reminder_enabled && h.reminder_time);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  return (
    <>
      <header className="mobile-app-header" id="mobile-header">
        {/* Brand Logo & Name */}
        <div 
          className="mobile-header-brand"
          onClick={() => onNavigateView && onNavigateView('dashboard')}
          role="button"
          tabIndex={0}
        >
          <div className="mobile-brand-icon">
            <CheckCircle2 size={22} color="#6366f1" strokeWidth={2.5} />
          </div>
          <span className="mobile-brand-title">Habit<span className="text-indigo">Flow</span></span>
        </div>

        {/* Right Controls: Notification Bell + Avatar */}
        <div className="mobile-header-actions">
          <button
            type="button"
            className="mobile-header-btn mobile-bell-btn"
            onClick={() => setRemindersModalOpen(true)}
            aria-label="Habit Reminders"
            title="Habit Reminders"
            id="btn-mobile-bell"
          >
            <Bell size={20} />
            {activeReminders.length > 0 && (
              <span className="mobile-bell-badge">{activeReminders.length}</span>
            )}
          </button>

          <div className="mobile-avatar-wrap" ref={dropdownRef}>
            <button
              type="button"
              className="mobile-header-avatar"
              onClick={() => setProfileOpen(prev => !prev)}
              aria-label="User Profile Menu"
              id="btn-mobile-avatar"
            >
              <span>{userInitial}</span>
            </button>

            {profileOpen && (
              <div className="mobile-profile-dropdown" role="menu">
                <div className="mobile-profile-info">
                  <div className="mobile-profile-initial">{userInitial}</div>
                  <div className="mobile-profile-text">
                    <span className="mobile-profile-name">{user?.name || 'HabitFlow User'}</span>
                    <span className="mobile-profile-email">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>

                <div className="mobile-dropdown-divider" />

                <button
                  type="button"
                  className="mobile-dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigateView('profile');
                  }}
                  role="menuitem"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="mobile-dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigateView('settings');
                  }}
                  role="menuitem"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <div className="mobile-dropdown-divider" />

                <button
                  type="button"
                  className="mobile-dropdown-item mobile-logout-item"
                  onClick={() => {
                    setProfileOpen(false);
                    if (window.confirm("Are you sure you want to log out?")) {
                      logout();
                    }
                  }}
                  role="menuitem"
                >
                  <LogOut size={16} color="#ef4444" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Reminders Overview Bottom Sheet / Dialog */}
      {remindersModalOpen && (
        <div className="modal-overlay" onClick={() => setRemindersModalOpen(false)}>
          <div 
            className="modal-container mobile-reminders-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-wrap box-purple">
                  <Bell size={20} color="#6366f1" />
                </div>
                <div>
                  <h2 className="modal-title">Habit Reminders</h2>
                  <p className="modal-sub">Scheduled Android Local Notifications</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setRemindersModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="reminders-modal-body">
              {activeReminders.length === 0 ? (
                <div className="no-reminders-empty">
                  <Clock size={36} color="#64748b" />
                  <h4>No reminders scheduled</h4>
                  <p>Enable daily reminders when adding or editing your habits to get notified on time.</p>
                </div>
              ) : (
                <div className="active-reminders-list">
                  {activeReminders.map(habit => (
                    <div key={habit.id} className="active-reminder-row">
                      <div className="reminder-habit-info">
                        <span className="reminder-habit-title">{habit.name}</span>
                        <span className="reminder-habit-schedule">Repeats daily at {formatDisplayTime(habit.reminder_time)}</span>
                      </div>
                      <div className="reminder-time-chip">
                        <Clock size={13} />
                        <span>{formatDisplayTime(habit.reminder_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-full-width"
                onClick={() => setRemindersModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
