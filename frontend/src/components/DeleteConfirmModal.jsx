import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirmDelete, 
  habitName, 
  isDeleting 
}) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !isDeleting && onClose()}>
      <div 
        className="modal-container delete-confirm-container"
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-wrap modal-icon-danger">
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <div>
              <h2 className="modal-title" id="delete-modal-title">Delete Habit</h2>
              <p className="modal-sub">Permanently delete from database</p>
            </div>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p className="delete-warning-text">
            Are you sure you want to delete <strong className="text-highlight">"{habitName}"</strong>?
          </p>
          <div className="delete-warning-callout">
            <AlertTriangle size={16} className="callout-icon" />
            <span>
              All historical completion records and streak achievements associated with this habit will be permanently deleted. This action cannot be undone.
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={onConfirmDelete}
            disabled={isDeleting}
            id="btn-confirm-delete-habit"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Delete Habit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
