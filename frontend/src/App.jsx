import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import BottomNavBar from './components/BottomNavBar';
import WelcomeBanner from './components/WelcomeBanner';
import ProgressSummary from './components/ProgressSummary';
import HabitList from './components/HabitList';
import RecentActivity from './components/RecentActivity';
import CalendarView from './components/CalendarView';
import StatsOverview from './components/StatsOverview';
import ProfilePage from './components/profile/ProfilePage';
import SettingsPage from './components/settings/SettingsPage';
import AddHabitModal from './components/AddHabitModal';
import HabitDetailPage from './components/HabitDetailPage';
import ReferenceDashboard from './components/ReferenceDashboard';
import SkeletonCard, { SkeletonSummary } from './components/SkeletonCard';
import AuthContainer from './components/auth/AuthContainer';
import { AuthProvider, useAuth } from './context/AuthContext';

// API Service Layer
import * as api from './services/api';

// Notification Service Layer (Capacitor Local Notifications)
import { 
  scheduleHabitReminder, 
  cancelHabitReminder, 
  updateHabitReminder, 
  syncAllHabitReminders,
  scheduleGlobalDailyReminder,
  getGlobalReminderSettings,
  ensureNotificationChannel
} from './services/notificationService';

// Date Utilities
import { 
  getTodayKey, 
  getPastDays, 
  formatDateKey 
} from './utils/dateUtils';

import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

function HabitDashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [records, setRecords] = useState({});
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Network & UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState({});
  const [deletingIds, setDeletingIds] = useState({});

  const todayKey = getTodayKey();
  const past7Days = getPastDays(7);
  const past365Days = getPastDays(365);
  const startDate = formatDateKey(past365Days[0]);

  /**
   * Load habits and records from the FastAPI backend & database
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedHabits, fetchedRecords] = await Promise.all([
        api.getHabits(),
        api.getRecordsRange(startDate, todayKey),
      ]);

      setHabits(fetchedHabits);

      const recordMap = {};
      fetchedRecords.forEach((rec) => {
        recordMap[`${rec.habit_id}_${rec.record_date}`] = Boolean(rec.completed);
      });
      setRecords(recordMap);

      // Sync active habit reminders with Android Local Notifications
      syncAllHabitReminders(fetchedHabits, recordMap, todayKey, user);
    } catch (err) {
      setError(
        err.message || 
        'Could not connect to FastAPI server. Please verify the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, todayKey, user]);

  useEffect(() => {
    ensureNotificationChannel();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep overall daily reminder in sync with current day completion state
  useEffect(() => {
    if (habits.length > 0) {
      const globalSettings = getGlobalReminderSettings(user);
      if (globalSettings.enabled) {
        scheduleGlobalDailyReminder({
          enabled: true,
          time: globalSettings.time,
          habits,
          records,
          todayKey,
        });
      }
    }
  }, [user, habits, records, todayKey]);

  /**
   * Toggle completion for today's date via upsert API
   */
  const handleToggleToday = async (habitId) => {
    const key = `${habitId}_${todayKey}`;
    const previousStatus = Boolean(records[key]);
    const nextStatus = !previousStatus;

    // Optimistic UI update
    setRecords((prev) => ({
      ...prev,
      [key]: nextStatus,
    }));

    setTogglingIds((prev) => ({ ...prev, [habitId]: true }));

    try {
      const savedRecord = await api.upsertHabitRecord(habitId, todayKey, nextStatus);
      setRecords((prev) => ({
        ...prev,
        [`${savedRecord.habit_id}_${savedRecord.record_date}`]: Boolean(savedRecord.completed),
      }));
    } catch (err) {
      setRecords((prev) => ({
        ...prev,
        [key]: previousStatus,
      }));
      alert(`Failed to save habit record: ${err.message}`);
    } finally {
      setTogglingIds((prev) => ({ ...prev, [habitId]: false }));
    }
  };

  /**
   * Create a new habit via POST /api/habits and schedule local reminder
   */
  const handleAddHabit = async (newHabitData) => {
    setIsSubmittingHabit(true);
    try {
      const createdHabit = await api.createHabit(newHabitData);
      setHabits((prev) => [createdHabit, ...prev]);

      // Schedule notification if enabled
      if (createdHabit.reminder_enabled && createdHabit.reminder_time) {
        await scheduleHabitReminder(createdHabit);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingHabit(false);
    }
  };

  /**
   * Delete a habit via DELETE /api/habits/{id} and cancel local notification
   */
  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Are you sure you want to delete this habit and all its records?")) {
      return;
    }

    setDeletingIds((prev) => ({ ...prev, [habitId]: true }));
    try {
      await api.deleteHabit(habitId);
      // Cancel scheduled reminder if any
      await cancelHabitReminder(habitId);

      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      if (selectedHabitId === habitId) {
        setSelectedHabitId(null);
        setActiveView('dashboard');
      }
    } catch (err) {
      alert(`Failed to delete habit: ${err.message}`);
    } finally {
      setDeletingIds((prev) => ({ ...prev, [habitId]: false }));
    }
  };

  /**
   * Handle habit updates (from habit detail page or modal)
   */
  const handleHabitUpdated = async (updatedHabit) => {
    setHabits((prev) => prev.map((h) => h.id === updatedHabit.id ? updatedHabit : h));
    await updateHabitReminder(updatedHabit);
  };

  /**
   * Navigate to habit details page
   */
  const handleSelectHabit = (habitId) => {
    setSelectedHabitId(habitId);
    setActiveView('habit-detail');
  };

  /**
   * Synchronize record updates from habit detail page with global App state
   */
  const handleGlobalRecordUpdated = (habitId, dateStr, completed) => {
    setRecords((prev) => ({
      ...prev,
      [`${habitId}_${dateStr}`]: completed,
    }));
  };

  return (
    <div className="app-shell">
      {/* Mobile-Only Compact Header (Sticky Top on small screens) */}
      <MobileHeader
        onNavigateView={setActiveView}
        habits={habits}
      />

      {/* Desktop-Only Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={mobileSidebarOpen}
        setIsOpen={setMobileSidebarOpen}
      />

      {/* Main App Canvas */}
      <div className="main-viewport">
        {/* Desktop Top Header for subpages (Calendar, Habits, Analytics, Profile, Settings) */}
        {activeView !== 'dashboard' && (
          <div className="desktop-header-wrap">
            <Header
              onOpenSidebar={() => setMobileSidebarOpen(true)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onNavigateView={setActiveView}
            />
          </div>
        )}

        {/* Dynamic View Canvas */}
        <main className={`content-container ${activeView === 'dashboard' ? 'dashboard-container-full' : ''}`}>
          {/* Skeleton Loading State */}
          {loading && (
            <div className="dashboard-skeleton-view">
              <div className="skeleton-box skeleton-welcome-box" />
              <SkeletonSummary />
              <div className="habits-grid">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="state-feedback-card state-error-card">
              <div className="error-icon-box">
                <AlertTriangle size={32} />
              </div>
              <h3>Backend Connection Issue</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={loadData}>
                <RefreshCw size={16} /> Retry Connection
              </button>
            </div>
          )}

          {/* Main Views when Loaded without Fatal Error */}
          {!loading && !error && (
            <>
              {activeView === 'dashboard' && (
                <ReferenceDashboard
                  habits={habits}
                  records={records}
                  todayKey={todayKey}
                  pastDays={past7Days}
                  onToggleToday={handleToggleToday}
                  onDeleteHabit={handleDeleteHabit}
                  onSelectHabit={handleSelectHabit}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  user={user}
                  setActiveView={setActiveView}
                  onOpenSidebar={() => setMobileSidebarOpen(true)}
                  togglingIds={togglingIds}
                />
              )}

              {activeView === 'habits' && (
                <div className="habits-view-flow">
                  <div className="section-title-wrap">
                    <div>
                      <h2 className="section-title">Habit Directory</h2>
                      <p className="section-sub">Manage all active habits stored in your database</p>
                    </div>
                  </div>
                  <HabitList
                    habits={habits}
                    records={records}
                    todayKey={todayKey}
                    pastDays={past7Days}
                    searchQuery={searchQuery}
                    onToggleToday={handleToggleToday}
                    onDelete={handleDeleteHabit}
                    onOpenAddModal={() => setIsAddModalOpen(true)}
                    onSelectHabit={handleSelectHabit}
                    togglingIds={togglingIds}
                    deletingIds={deletingIds}
                  />
                </div>
              )}

              {activeView === 'habit-detail' && selectedHabitId && (
                <HabitDetailPage
                  habitId={selectedHabitId}
                  onBack={() => setActiveView('dashboard')}
                  onGlobalRecordUpdated={handleGlobalRecordUpdated}
                  onHabitUpdated={handleHabitUpdated}
                  onHabitDeleted={(deletedId) => {
                    setHabits((prev) => prev.filter((h) => h.id !== deletedId));
                    setSelectedHabitId(null);
                    cancelHabitReminder(deletedId);
                  }}
                />
              )}

              {activeView === 'calendar' && (
                <div className="calendar-view-flow">
                  <div className="section-title-wrap">
                    <div>
                      <h2 className="section-title">Habit History & Heatmap</h2>
                      <p className="section-sub">Inspect completion records saved in the database for each calendar day</p>
                    </div>
                  </div>
                  <CalendarView
                    habits={habits}
                    records={records}
                    todayKey={todayKey}
                  />
                </div>
              )}

              {activeView === 'analytics' && (
                <div className="analytics-view-flow">
                  <StatsOverview
                    habits={habits}
                    records={records}
                    setActiveView={setActiveView}
                  />
                </div>
              )}

              {activeView === 'profile' && (
                <div className="profile-view-flow">
                  <ProfilePage
                    habits={habits}
                    records={records}
                    todayKey={todayKey}
                  />
                </div>
              )}

              {activeView === 'settings' && (
                <div className="settings-view-flow">
                  <SettingsPage />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Sticky Bottom on small screens) */}
      <BottomNavBar 
        activeView={activeView === 'habit-detail' ? 'habits' : activeView}
        setActiveView={setActiveView}
      />

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
        isSubmitting={isSubmittingHabit}
      />
    </div>
  );
}

function MainFlow() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 size={36} className="spin" color="#4f46e5" />
        <p className="loading-text">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  return <HabitDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainFlow />
    </AuthProvider>
  );
}
