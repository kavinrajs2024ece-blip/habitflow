import React from 'react';
import { PieChart, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../../utils/dateUtils';

/**
 * HabitBreakdown - Category portfolio distribution with progress bars and dynamic insight
 * 
 * @param {Object} props
 * @param {Array} props.habits - Habit list
 */
export default function HabitBreakdown({ habits = [] }) {
  // Category color mapping
  const categoryPalette = {
    Health: '#06b6d4',
    Productivity: '#8b5cf6',
    Mindfulness: '#6366f1',
    Fitness: '#10b981',
    General: '#f59e0b',
  };

  const definedCategories = ['Health', 'Productivity', 'Mindfulness', 'Fitness', 'General'];

  // Count habits per category
  const categoryCounts = {
    Health: 0,
    Productivity: 0,
    Mindfulness: 0,
    Fitness: 0,
    General: 0,
  };

  habits.forEach((h) => {
    let category = 'General';
    if (h.description && h.description.startsWith('[')) {
      const endIdx = h.description.indexOf(']');
      if (endIdx > 1) {
        const parsed = h.description.substring(1, endIdx).trim();
        const matched = definedCategories.find(
          (c) => c.toLowerCase() === parsed.toLowerCase()
        );
        if (matched) category = matched;
      }
    }
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const totalHabits = habits.length;

  // Filter or prepare categories to display
  const categoryStats = definedCategories.map((catName) => {
    const count = categoryCounts[catName] || 0;
    const percentage = totalHabits > 0 ? Math.round((count / totalHabits) * 100) : 0;
    const color = categoryPalette[catName] || '#64748b';
    return { name: catName, count, percentage, color };
  });

  // Sort descending by count, prioritizing active ones
  const activeCategories = categoryStats.filter((c) => c.count > 0);
  const inactiveCategories = categoryStats.filter((c) => c.count === 0);
  const displayCategories = activeCategories.length > 0 
    ? [...activeCategories, ...inactiveCategories] 
    : categoryStats;

  // Generate dynamic insight message
  let insightMessage = 'Add habits to see your category portfolio distribution.';
  if (totalHabits > 0 && activeCategories.length > 0) {
    const topCategory = activeCategories.reduce(
      (max, c) => (c.count > max.count ? c : max),
      activeCategories[0]
    );

    // Check if there's a tie
    const topTied = activeCategories.filter((c) => c.count === topCategory.count);
    if (topTied.length === 1) {
      insightMessage = `Most of your habits are in the ${topCategory.name} category (${topCategory.percentage}%).`;
    } else if (topTied.length === totalHabits && totalHabits > 1) {
      insightMessage = 'Your habits are evenly distributed across categories.';
    } else {
      const tiedNames = topTied.map((c) => c.name).join(' & ');
      insightMessage = `Your habits are predominantly focused on ${tiedNames}.`;
    }
  }

  // Calculate donut segments if active categories exist
  let cumulativeAngle = 0;
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~238.76

  return (
    <div className="chart-card habit-breakdown-card">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-title">Habit Breakdown</h3>
          <p className="chart-sub">Category portfolio distribution</p>
        </div>
        <div className="category-total-badge">
          <PieChart size={15} />
          <span>{totalHabits} {totalHabits === 1 ? 'Habit' : 'Habits'}</span>
        </div>
      </div>

      {/* Visual representation: Donut summary + Progress list */}
      <div className="breakdown-content-layout">
        {/* Progress List */}
        <div className="category-progress-list">
          {displayCategories.map((cat) => (
            <div key={cat.name} className={`category-progress-item ${cat.count === 0 ? 'category-empty' : ''}`}>
              <div className="cat-progress-top">
                <div className="cat-label-with-dot">
                  <span className="cat-color-dot" style={{ backgroundColor: cat.color }} />
                  <span className="cat-name">{cat.name}</span>
                </div>
                <div className="cat-meta-vals">
                  <span className="cat-count">{cat.count} {cat.count === 1 ? 'habit' : 'habits'}</span>
                  <span className="cat-pct-badge">{cat.percentage}%</span>
                </div>
              </div>
              <div className="cat-track">
                <div
                  className="cat-fill"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Data-Driven Insight Banner */}
      <div className="breakdown-insight-banner">
        <Sparkles size={16} className="insight-icon" />
        <span className="insight-text">{insightMessage}</span>
      </div>
    </div>
  );
}
