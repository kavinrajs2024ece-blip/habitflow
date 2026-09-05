import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BarChart3, 
  CheckSquare, 
  User, 
  Settings as SettingsIcon,
  CheckCircle2,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeView, setActiveView, isOpen, setIsOpen }) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'analytics', label: 'Statistics', icon: BarChart3 },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (id) => {
    setActiveView(id);
    if (window.innerWidth <= 900) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsOpen(false)} 
          aria-label="Close sidebar"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <div className="brand-app-icon">
              <CheckCircle2 size={22} color="#4f46e5" strokeWidth={2.5} />
            </div>
            <span className="brand-name">Habit<span className="brand-name-flow">Flow</span></span>
          </div>
          <button 
            className="btn-icon mobile-close-btn" 
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                id={`nav-item-${item.id}`}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section with Professional Logout */}
        <div className="sidebar-bottom-wrap">
          <button 
            onClick={handleLogout}
            className="sidebar-logout-card"
            title="Log out of your account"
            id="btn-sidebar-logout"
            type="button"
          >
            <div className="logout-icon-wrapper">
              <LogOut size={20} color="#ef4444" strokeWidth={2.2} />
            </div>
            <div className="logout-text-wrapper">
              <span className="logout-title">Logout</span>
              <span className="logout-subtitle">See you again soon!</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
