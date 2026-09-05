import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Target, 
  Flame, 
  Loader2, 
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateStreak } from '../../utils/dateUtils';

/**
 * ProfilePage - Professional SaaS User Profile Dashboard
 * 
 * @param {Object} props
 * @param {Array} props.habits - User's active habits
 * @param {Object} props.records - Key-value map of completion records
 * @param {string} props.todayKey - Today's YYYY-MM-DD date key
 */
export default function ProfilePage({ habits = [], records = {}, todayKey }) {
  const { user, updateUserProfile, logout } = useAuth();

  // Form states for Personal Information Card
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Sync name if user object updates
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  // Handle saving personal info
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setSaveError('Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateUserProfile({ name: name.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Compute Account Summary Metrics
  const totalHabits = habits.length;

  const completedToday = useMemo(() => {
    if (!todayKey || habits.length === 0) return 0;
    return habits.filter((h) => Boolean(records[`${h.id}_${todayKey}`])).length;
  }, [habits, records, todayKey]);

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return habits.reduce((max, h) => {
      return Math.max(max, calculateStreak(h.id, records));
    }, 0);
  }, [habits, records]);

  // Format "Member since" if created_at is available
  const memberSince = useMemo(() => {
    if (!user?.created_at) return null;
    try {
      const date = new Date(user.created_at);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  }, [user?.created_at]);

  const avatarInitial = (user?.name ? user.name.trim().charAt(0) : 'U').toUpperCase();
  const isModified = name.trim() !== (user?.name || '').trim();

  return (
    <div className="profile-dashboard-layout">
      {/* 1. PAGE HEADER */}
      <div className="profile-page-header">
        <div className="profile-header-left">
          <div className="profile-heading-row">
            <div className="profile-header-icon-box">
              <User size={20} />
            </div>
            <h2 className="profile-main-title">User Profile</h2>
          </div>
          <p className="profile-main-sub">Personal details and session info</p>
        </div>
      </div>

      {/* 2. PROFILE OVERVIEW CARD */}
      <div className="profile-card profile-overview-card">
        <div className="overview-card-left">
          <div className="overview-avatar-circle">
            <span>{avatarInitial}</span>
          </div>
          <div className="overview-info">
            <div className="overview-name-row">
              <h3 className="overview-name">{user?.name || 'User'}</h3>
              <span className="overview-active-badge">
                <span className="badge-dot-green" />
                Active account
              </span>
            </div>
            <p className="overview-email">{user?.email || 'user@example.com'}</p>
            {memberSince && (
              <div className="overview-meta-row">
                <Calendar size={13} className="meta-icon" />
                <span className="meta-text">Member since {memberSince}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PERSONAL INFORMATION CARD */}
      <div className="profile-card personal-info-card">
        <div className="card-header-clean">
          <h3 className="card-clean-title">Personal Information</h3>
          <p className="card-clean-sub">Update your account details</p>
        </div>

        <form onSubmit={handleSaveChanges} className="personal-info-form">
          {/* Inline Feedback Alerts */}
          {saveSuccess && (
            <div className="profile-inline-alert alert-success">
              <CheckCircle2 size={16} className="alert-icon" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="profile-inline-alert alert-error">
              <AlertCircle size={16} className="alert-icon" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="form-fields-grid">
            {/* Full Name Field (Editable) */}
            <div className="form-field-group">
              <label htmlFor="input-profile-name" className="field-label">
                Full Name
              </label>
              <div className="input-wrap">
                <input
                  id="input-profile-name"
                  type="text"
                  className="profile-text-input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (saveError) setSaveError(null);
                  }}
                  placeholder="Enter your full name"
                  disabled={isSaving}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Email Address Field (Read-only) */}
            <div className="form-field-group">
              <label htmlFor="input-profile-email" className="field-label">
                Email Address
              </label>
              <div className="input-wrap">
                <input
                  id="input-profile-email"
                  type="email"
                  className="profile-text-input input-readonly"
                  value={user?.email || ''}
                  readOnly
                  disabled
                />
              </div>
              <span className="field-helper-text">Email cannot be changed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="personal-info-actions">
            {isModified && (
              <button
                type="button"
                className="btn-profile-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-profile-primary"
              disabled={isSaving || !isModified}
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4 & 5. BOTTOM ROW: ACCOUNT SUMMARY + SECURITY & SESSION */}
      <div className="profile-bottom-grid">
        {/* 4. ACCOUNT SUMMARY CARD */}
        <div className="profile-card account-summary-card">
          <div className="card-header-clean">
            <h3 className="card-clean-title">Account Summary</h3>
            <p className="card-clean-sub">Real-time habit activity</p>
          </div>

          <div className="summary-stats-grid">
            {/* Stat 1: Total Habits */}
            <div className="profile-stat-box">
              <div className="stat-box-icon-wrap icon-blue">
                <Target size={18} />
              </div>
              <div className="stat-box-text">
                <span className="stat-box-label">Total Habits</span>
                <span className="stat-box-val">{totalHabits > 0 ? totalHabits : '—'}</span>
              </div>
            </div>

            {/* Stat 2: Completed Today */}
            <div className="profile-stat-box">
              <div className="stat-box-icon-wrap icon-green">
                <CheckCircle2 size={18} />
              </div>
              <div className="stat-box-text">
                <span className="stat-box-label">Completed Today</span>
                <span className="stat-box-val">
                  {totalHabits > 0 ? `${completedToday}/${totalHabits}` : '—'}
                </span>
              </div>
            </div>

            {/* Stat 3: Current Streak */}
            <div className="profile-stat-box">
              <div className="stat-box-icon-wrap icon-orange">
                <Flame size={18} />
              </div>
              <div className="stat-box-text">
                <span className="stat-box-label">Current Streak</span>
                <span className="stat-box-val">
                  {currentStreak > 0 ? `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}` : '0 Days'}
                </span>
              </div>
            </div>

            {/* Stat 4: Account Status */}
            <div className="profile-stat-box">
              <div className="stat-box-icon-wrap icon-purple">
                <ShieldCheck size={18} />
              </div>
              <div className="stat-box-text">
                <span className="stat-box-label">Account Status</span>
                <span className="stat-box-val stat-val-active">
                  <span className="dot-pulse" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. SECURITY & SESSION CARD */}
        <div className="profile-card security-session-card">
          <div className="card-header-clean">
            <h3 className="card-clean-title">Security & Session</h3>
            <p className="card-clean-sub">Authentication & account access</p>
          </div>

          <div className="security-rows-list">
            <div className="security-row-item">
              <div className="security-row-left">
                <div className="security-icon-circle">
                  <Mail size={15} />
                </div>
                <div>
                  <span className="security-label">Email Address</span>
                  <span className="security-val">{user?.email || '—'}</span>
                </div>
              </div>
            </div>

            <div className="security-row-item">
              <div className="security-row-left">
                <div className="security-icon-circle">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <span className="security-label">Account Status</span>
                  <span className="security-val text-status-active">Active (Verified)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="security-logout-wrap">
            <button
              type="button"
              className="btn-profile-logout"
              onClick={() => setShowLogoutModal(true)}
              id="btn-profile-page-logout"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="profile-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div
            className="profile-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="modal-top-bar">
              <div className="modal-icon-wrap-red">
                <LogOut size={22} />
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowLogoutModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-text">
              <h3 id="logout-modal-title" className="modal-heading">
                Are you sure you want to log out?
              </h3>
              <p className="modal-description">
                You will need to sign in again to access your account.
              </p>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-confirm-logout"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
