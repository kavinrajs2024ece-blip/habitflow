import React from 'react';

/**
 * Reusable, High-Precision SVG Circular Progress Component
 * 
 * Features:
 * - Smooth stroke-dashoffset CSS transition
 * - Starts at 12 o'clock
 * - Crisp text centering
 * - Respects prefers-reduced-motion
 */
export default function CircularProgress({
  percentage = 0,
  size = 64,
  strokeWidth = 6,
  color = '#10b981',
  trackColor = '#e2e8f0',
  showValue = true,
  valueText = null,
  subText = null,
  fontSize = null,
  className = '',
}) {
  const cleanPercentage = Math.min(100, Math.max(0, Math.round(percentage || 0)));
  const center = size / 2;
  const radius = Math.max(0, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercentage / 100) * circumference;

  const defaultFontSize = fontSize || Math.max(11, Math.round(size * 0.22));

  return (
    <div 
      className={`circular-progress-wrap ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={cleanPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="circular-progress-svg"
      >
        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="circular-track-circle"
        />
        {/* Animated Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          className="circular-progress-bar"
        />
      </svg>

      {/* Center Value Content */}
      {showValue && (
        <div className="circular-progress-inner">
          <span 
            className="circular-progress-value"
            style={{ fontSize: `${defaultFontSize}px` }}
          >
            {valueText !== null ? valueText : `${cleanPercentage}%`}
          </span>
          {subText && (
            <span className="circular-progress-sub">{subText}</span>
          )}
        </div>
      )}
    </div>
  );
}
