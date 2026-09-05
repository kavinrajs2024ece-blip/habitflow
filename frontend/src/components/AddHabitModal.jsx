import React, { useState, useEffect } from 'react';
import { X, Sparkles, PlusCircle, Loader2 } from 'lucide-react';
import { CATEGORIES, formatHabitDescription } from '../utils/dateUtils';

export default function AddHabitModal({ isOpen, onClose, onAddHabit, isSubmitting }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalDays, setGoalDays] = useState(30);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setGoalDays(30);
      setCategory(CATEGORIES[0]);
      setError('');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

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

    try {
      setError('');
      const formattedDescription = formatHabitDescription(category.name, parsedGoal, description);

      await onAddHabit({
        name: name.trim(),
        description: formattedDescription,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save habit to database');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-wrap">
              <Sparkles size={20} color="#6366f1" />
            </div>
            <div>
              <h2 className="modal-title">Create New Habit</h2>
              <p className="modal-sub">Saved directly to your SQLite database</p>
            </div>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error-alert">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="habit-name">
              Habit Name <span className="required-star">*</span>
            </label>
            <input
              id="habit-name"
              type="text"
              className="form-input"
              placeholder="e.g. Morning Meditation, Read 20 Pages..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-goal">
              Goal (Days) <span className="required-star">*</span>
              <span className="label-sub" style={{ marginLeft: '6px' }}>(e.g. 7, 21, 30, 100)</span>
            </label>
            <input
              id="habit-goal"
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
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-desc">
              Description <span className="label-sub">(Optional)</span>
            </label>
            <input
              id="habit-desc"
              type="text"
              className="form-input"
              placeholder="e.g. 15 minutes mindfulness before breakfast"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
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

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving...
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Save Habit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
