import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  BarChart3, 
  User 
} from 'lucide-react';

/**
 * Mobile Bottom Navigation Bar
 * 5 primary tabs: Dashboard, Calendar, Habits, Statistics, Profile
 * Minimum touch target >= 44px, respects Android safe areas
 */
export default function BottomNavBar({ activeView, setActiveView }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'analytics', label: 'Stats', fullLabel: 'Statistics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(tab.id)}
              aria-label={tab.label}
              id={`mobile-nav-${tab.id}`}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              </div>
              <span className="mobile-nav-label">{tab.label}</span>
              {isActive && <span className="mobile-nav-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
