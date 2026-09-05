import React from 'react';
import { Sparkles, Flame, CheckCircle2, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WelcomeBanner({ 
  habits = [], 
  records = {}, 
  todayKey = '', 
  onOpenAddModal 
}) {
  const { user } = useAuth();
  const totalHabits = habits.length;
  const completedToday = habits.filter(
    (h) => records[`${h.id}_${todayKey}`] === true
  ).length;

  const percentage = totalHabits > 0 
    ? Math.round((completedToday / totalHabits) * 100) 
    : 0;

  // Personalized greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  let quote = "Small daily rituals compound into monumental lifelong achievements.";
  let badgeText = "Build Momentum";
  if (totalHabits > 0) {
    if (percentage === 100) {
      quote = "Incredible focus today! You've successfully conquered all your daily goals.";
      badgeText = "Goal Mastered 🎉";
    } else if (percentage >= 50) {
      quote = "You're well past the halfway mark. Finish strong and protect your streak!";
      badgeText = "Strong Momentum ⚡";
    } else if (completedToday > 0) {
      quote = "Great momentum is building. Keep the flow going with your next habit.";
      badgeText = "In Progress 🚀";
    } else {
      quote = "Every journey begins with a single step. Make today count!";
      badgeText = "Fresh Start 🌅";
    }
  }

  return (
    <div className="welcome-banner-card">
      <div className="welcome-banner-content">
        <div className="welcome-pill-row">
          <span className="welcome-tag">
            <Sparkles size={13} className="sparkle-icon" />
            <span>{badgeText}</span>
          </span>
          <span className="welcome-completion-pill">
            <CheckCircle2 size={13} />
            <span>{completedToday} of {totalHabits} Completed Today</span>
          </span>
        </div>

        <h2 className="welcome-headline">
          Welcome back, <span className="welcome-name-highlight">{firstName}</span>!
        </h2>

        <p className="welcome-subtext">
          {quote}
        </p>
      </div>

      <div className="welcome-banner-cta">
        <button 
          className="btn btn-welcome-cta"
          onClick={onOpenAddModal}
        >
          <Plus size={16} />
          <span>New Habit</span>
        </button>
      </div>
    </div>
  );
}
