import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Loader2, Bell, Clock } from 'lucide-react';
import { CATEGORIES, parseHabitGoal, getCleanDescription, formatHabitDescription } from '../utils/dateUtils';
import { requestNotificationPermission } from '../services/notificationService';

export default function EditHabitModal({ 
  isOpen, 
  onClose, 
  habit, 
  onSaveHabit, 
  isSaving 
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalDays, setGoalDays] = useState(30);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:30');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && habit) {
      setName(habit.name || '');
      
      // Parse category and clean description
      let catName = 'General';
      if (habit.description && habit.description.startsWith('[')) {
        const endIdx = habit.description.indexOf(']');
        if (endIdx > 1) {
          catName = habit.description.substring(1, endIdx);
        }
      }

      const parsedGoal = parseHabitGoal(habit.description);
      const cleanDesc = getCleanDescription(habit.description);

      const foundCat = CATEGORIES.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      ) || CATEGORIES[0];

      setCategory(foundCat);
      setGoalDays(parsedGoal);
      setDescription(cleanDesc);
      setReminderEnabled(Boolean(habit.reminder_enabled));
      setReminderTime(habit.reminder_time || '08:30');
      setError('');
    }
  }, [isOpen, habit]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen) return null;

  const handleReminderToggle = async (e) => {
    const checked = e.target.checked;
    setReminderEnabled(checked);
    if (checked) {
      await requestNotificationPermission();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a habit name');
      return;
    }

    const parsedGoal = parseInt(goalDays, 10);
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      setError('Please enter a valid goal (e.g. 7, 21, 30, 100 days)');
      return;
    }

    if (reminderEnabled && !reminderTime) {
      setError('Please select a valid reminder time');
      return;
    }

    if (reminderEnabled) {
      await requestNotificationPermission();
    }

    try {
      setError('');
      const formattedDescription = formatHabitDescription(category.name, parsedGoal, description);

      await onSaveHabit({
        name: name.trim(),
        description: formattedDescription,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderEnabled ? reminderTime : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update habit');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !isSaving && onClose()}>
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-habit-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-wrap">
              <Edit3 size={18} color="#6366f1" />
            </div>
            <div>
              <h2 className="modal-title" id="edit-habit-modal-title">Edit Habit</h2>
              <p className="modal-sub">Update habit details in SQLite database</p>
            </div>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error-alert">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-habit-name">
              Habit Name <span className="required-star">*</span>
            </label>
            <input
              id="edit-habit-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-habit-goal">
              Goal (Days) <span className="required-star">*</span>
              <span className="label-sub" style={{ marginLeft: '6px' }}>(e.g. 7, 21, 30, 100)</span>
            </label>
            <input
              id="edit-habit-goal"
              type="number"
              min="1"
              max="365"
              className="form-input"
              placeholder="e.g. 7, 21, 30, 100"
              value={goalDays}
              onChange={(e) => {
                setGoalDays(e.target.value);
                if (error) setError('');
              }}
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-habit-desc">
              Description <span className="label-sub">(Optional)</span>
            </label>
            <input
              id="edit-habit-desc"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="category-select-grid">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={isSaving}
                  className={`cat-option-btn ${category.name === cat.name ? 'cat-option-active' : ''}`}
                  style={{
                    borderColor: category.name === cat.name ? cat.color : undefined,
                  }}
                >
                  <span 
                    className="cat-color-dot" 
                    style={{ backgroundColor: cat.color }} 
                  />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Reminder Setting */}
          <div className="form-group reminder-form-group">
            <div className="reminder-toggle-row">
              <div className="reminder-toggle-label">
                <Bell size={18} className="reminder-bell-icon" />
                <div>
                  <span className="reminder-title">Daily Reminder</span>
                  <span className="reminder-subtitle">Get notified on your device every day</span>
                </div>
              </div>
              <label className="switch-toggle" htmlFor="edit-reminder-toggle">
                <input
                  id="edit-reminder-toggle"
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={handleReminderToggle}
                  disabled={isSaving}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {reminderEnabled && (
              <div className="reminder-time-picker-box">
                <div className="time-input-wrap">
                  <Clock size={16} className="time-clock-icon" />
                  <input
                    type="time"
                    id="edit-reminder-time"
                    className="form-input reminder-time-input"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    disabled={isSaving}
                    aria-label="Daily reminder time"
                  />
                </div>
                <span className="reminder-time-hint">Notifications scheduled daily</span>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
