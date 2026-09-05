import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="habit-card skeleton-card">
      <div className="habit-card-top">
        <div className="habit-header-left">
          <div className="skeleton-box skeleton-avatar" />
          <div className="skeleton-title-lines">
            <div className="skeleton-box skeleton-pill" />
            <div className="skeleton-box skeleton-title" />
          </div>
        </div>
        <div className="skeleton-box skeleton-btn-sm" />
      </div>

      <div className="skeleton-box skeleton-desc" />

      <div className="habit-strip-section">
        <div className="skeleton-box skeleton-strip-header" />
        <div className="skeleton-strip-grid">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton-box skeleton-day-cell" />
          ))}
        </div>
      </div>

      <div className="habit-card-footer">
        <div className="skeleton-box skeleton-check-btn" />
        <div className="skeleton-box skeleton-details-btn" />
      </div>
    </div>
  );
}

export function SkeletonSummary() {
  return (
    <div className="progress-summary-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="summary-stat-card skeleton-card">
          <div className="skeleton-stat-header">
            <div className="skeleton-box skeleton-text-short" />
            <div className="skeleton-box skeleton-avatar" />
          </div>
          <div className="skeleton-box skeleton-stat-num" />
          <div className="skeleton-box skeleton-pill" />
        </div>
      ))}
    </div>
  );
}
