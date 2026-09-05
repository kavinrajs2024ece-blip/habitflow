import React from 'react';

/**
 * SummaryCard - Reusable metric card with tinted icon, value, and trend comparison
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide icon element
 * @param {string} props.label - KPI label title (e.g. "30-Day Completion")
 * @param {string|number} props.value - Primary computed statistic value
 * @param {string} props.subtitle - Secondary descriptive text
 * @param {string} [props.comparison] - Optional comparison text e.g. "+5% vs last month"
 * @param {'blue'|'orange'|'green'|'purple'} [props.variant='blue'] - Accent color scheme
 */
export default function SummaryCard({
  icon,
  label,
  value,
  subtitle,
  comparison,
  variant = 'blue',
}) {
  return (
    <div className={`stats-summary-card card-variant-${variant}`}>
      <div className={`summary-icon-box icon-${variant}`}>
        {icon}
      </div>
      <div className="summary-card-body">
        <span className="summary-card-label">{label}</span>
        <div className="summary-card-value-row">
          <span className="summary-card-value">{value}</span>
        </div>
        <div className="summary-card-footer">
          <span className="summary-card-sub">{subtitle}</span>
          {comparison && (
            <span className={`summary-comparison-pill ${comparison.startsWith('+') ? 'positive' : comparison.startsWith('-') ? 'negative' : 'neutral'}`}>
              {comparison}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
