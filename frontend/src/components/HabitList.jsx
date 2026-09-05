import React, { useState } from 'react';
import HabitCard from './HabitCard';
import { Layers, Plus } from 'lucide-react';

export default function HabitList({
  habits,
  records,
  todayKey,
  pastDays,
  searchQuery,
  onToggleToday,
  onDelete,
  onOpenAddModal,
  onSelectHabit,
  togglingIds = {},
  deletingIds = {}
}) {

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'

  const categories = ['All', 'Health', 'Productivity', 'Mindfulness', 'Fitness', 'General'];

  // Helper to extract category from habit
  const getHabitCategory = (habit) => {
    if (habit.description && habit.description.startsWith('[')) {
      const endIdx = habit.description.indexOf(']');
      if (endIdx > 1) {
        return habit.description.substring(1, endIdx);
      }
    }
    return 'General';
  };

  // Filter habits by search, category, and completion status
  const filteredHabits = habits.filter((habit) => {
    // 1. Search filter
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (habit.description && habit.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Category filter
    const habitCat = getHabitCategory(habit);
    const matchesCategory = selectedCategory === 'All' || habitCat.toLowerCase() === selectedCategory.toLowerCase();

    // 3. Status filter
    const isCompleted = records[`${habit.id}_${todayKey}`] === true;
    let matchesStatus = true;
    if (statusFilter === 'completed') matchesStatus = isCompleted;
    if (statusFilter === 'pending') matchesStatus = !isCompleted;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <section className="habits-section">
      {/* Control Bar: Categories & Status Filter */}
      <div className="habit-controls-bar">
        {/* Category Pills */}
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`pill-btn ${selectedCategory === cat ? 'pill-btn-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter Segment */}
        <div className="status-segment-group">
          <button
            onClick={() => setStatusFilter('all')}
            className={`segment-btn ${statusFilter === 'all' ? 'segment-btn-active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`segment-btn ${statusFilter === 'pending' ? 'segment-btn-active' : ''}`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`segment-btn ${statusFilter === 'completed' ? 'segment-btn-active' : ''}`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Habits Grid */}
      {filteredHabits.length > 0 ? (
        <div className="habits-grid">
          {filteredHabits.map((habit, index) => (
            <HabitCard
              key={habit.id}
              index={index}
              habit={habit}
              records={records}
              todayKey={todayKey}
              pastDays={pastDays}
              onToggleToday={onToggleToday}
              onDelete={onDelete}
              onSelectHabit={onSelectHabit}
              isToggling={Boolean(togglingIds[habit.id])}
              isDeleting={Boolean(deletingIds[habit.id])}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-habits-card">
          <div className="empty-icon-wrap">
            <Layers size={36} />
          </div>
          <h3>{habits.length === 0 ? "No Habits Created Yet" : "No Matching Habits"}</h3>
          <p>
            {habits.length === 0
              ? "Start building your daily momentum by creating your very first habit!"
              : searchQuery 
                ? `No habits match your search "${searchQuery}".` 
                : "No habits match the selected filter criteria."}
          </p>
          <button 
            className="btn btn-primary" 
            onClick={onOpenAddModal}
          >
            <Plus size={16} /> Add Your First Habit
          </button>
        </div>
      )}
    </section>
  );
}
