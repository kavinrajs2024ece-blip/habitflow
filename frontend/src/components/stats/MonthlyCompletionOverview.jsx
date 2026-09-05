import React, { useState } from 'react';
import { formatDateKey } from '../../utils/dateUtils';

/**
 * MonthlyCompletionOverview - Clean SVG line chart displaying completion rates across 6 or 12 months
 * 
 * @param {Object} props
 * @param {Array} props.habits - Active habit list
 * @param {Object} props.records - Key-value records map: `${habitId}_${dateKey}` -> bool
 */
export default function MonthlyCompletionOverview({ habits = [], records = {} }) {
  const [rangeMonths, setRangeMonths] = useState(6);

  // Generate the list of past N calendar months (ending with current month)
  const today = new Date();
  const monthsData = [];

  for (let i = rangeMonths - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    // Month label
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
    const fullYear = year.toString().slice(-2);
    const displayLabel = rangeMonths === 12 ? `${monthLabel} '${fullYear}` : monthLabel;

    // Determine start and end date for this month
    const startDate = new Date(year, month, 1);
    // If it's the current month, end at today; otherwise end at last day of the month
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDate = isCurrentMonth ? new Date(today) : new Date(year, month, lastDayOfMonth);

    let completedCheckins = 0;
    let eligibleDays = 0;

    const cur = new Date(startDate);
    while (cur <= endDate) {
      eligibleDays++;
      const dateKey = formatDateKey(cur);
      habits.forEach((h) => {
        if (Boolean(records[`${h.id}_${dateKey}`])) {
          completedCheckins++;
        }
      });
      cur.setDate(cur.getDate() + 1);
    }

    const totalPossible = habits.length * eligibleDays;
    const percentage = totalPossible > 0 ? Math.round((completedCheckins / totalPossible) * 100) : 0;

    monthsData.push({
      label: displayLabel,
      fullMonthName: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      percentage,
      completedCheckins,
      totalPossible,
      eligibleDays,
    });
  }

  // SVG Chart Geometry
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 46;
  const paddingRight = 32;
  const paddingTop = 28;
  const paddingBottom = 42;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute point coordinates
  const points = monthsData.map((m, idx) => {
    const x = paddingLeft + (idx / Math.max(monthsData.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - (m.percentage / 100) * chartHeight;
    return { ...m, x, y };
  });

  // Construct SVG path command with smooth cubic bezier curves
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Area path for gradient background fill
    const baselineY = paddingTop + chartHeight;
    areaD = `${pathD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
  }

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="chart-card monthly-overview-card">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-title">Monthly Completion Overview</h3>
          <p className="chart-sub">Completion rate over the last {rangeMonths} months</p>
        </div>

        <div className="monthly-chart-actions">
          <select
            className="monthly-range-select"
            value={rangeMonths}
            onChange={(e) => setRangeMonths(Number(e.target.value))}
            aria-label="Select Monthly Range"
          >
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* SVG Line Chart Container */}
      <div className="svg-line-chart-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="monthly-line-chart-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="monthlyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="90%" stopColor="#3b82f6" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {yTicks.map((tick) => {
            const y = paddingTop + chartHeight - (tick / 100) * chartHeight;
            return (
              <g key={tick} className="grid-tick-group">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={tick === 0 ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                  strokeDasharray={tick === 0 ? 'none' : '4 4'}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="y-axis-label"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#monthlyAreaGrad)"
            />
          )}

          {/* Curved Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadowFilter)"
            />
          )}

          {/* Data Points and Percentage Badges */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-node-group">
              {/* Outer halo */}
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2.5"
                className="chart-dot"
              />

              {/* Center point */}
              <circle
                cx={p.x}
                cy={p.y}
                r="2.5"
                fill="#2563eb"
              />

              {/* Percentage label above node */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="node-pct-label"
              >
                {p.percentage}%
              </text>

              {/* X-axis Month Label below bottom baseline */}
              <text
                x={p.x}
                y={paddingTop + chartHeight + 22}
                textAnchor="middle"
                className="x-axis-label"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
