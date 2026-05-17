import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Flame, Target, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import ViewSwitcher from '../components/ViewSwitcher';
import HabitList from '../components/HabitList';
import StatsModal from '../components/StatsModal';
import useHabits from '../hooks/useHabits';
import { getDaysForView, navigateDate, getViewTitle } from '../utils/dateUtils';

const Dashboard = () => {
  const {
    habits,
    completions,
    stats,
    overall,
    selectedHabitId,
    setSelectedHabitId,
    toggleHabit,
    addHabit,
    deleteHabit,
    reorderHabits,
  } = useHabits();

  const [view, setView] = useState('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const days = getDaysForView(view, currentDate);
  const title = getViewTitle(view, currentDate);

  const handleNavigate = (direction) => {
    setCurrentDate((prev) => navigateDate(view, prev, direction));
  };

  const handleAddHabit = () => {
    addHabit(newHabitName);
    setNewHabitName('');
    setShowAddHabit(false);
  };

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) || null;

  return (
    <div className="app">
      <Header activeToday={overall.activeToday} totalHabits={overall.totalHabits} />

      {/* Summary stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <Target size={18} />
          <div className="stat-info">
            <span className="stat-value">{habits.length}</span>
            <span className="stat-label">Active Habits</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={18} />
          <div className="stat-info">
            <span className="stat-value">{overall.totalCompletions}</span>
            <span className="stat-label">Total Check-ins</span>
          </div>
        </div>
        <div className="stat-card">
          <Flame size={18} color="#f59e0b" />
          <div className="stat-info">
            <span className="stat-value">
              {habits.reduce((sum, h) => sum + (stats[h.id]?.currentStreak || 0), 0)}
            </span>
            <span className="stat-label">Total Streak</span>
          </div>
        </div>
      </div>

      <ViewSwitcher
        view={view}
        onViewChange={setView}
        title={title}
        onNavigate={handleNavigate}
        onToday={() => setCurrentDate(new Date())}
      />

      <HabitList
        habits={habits}
        days={days}
        view={view}
        currentDate={currentDate}
        completions={completions}
        stats={stats}
        onToggle={toggleHabit}
        onDelete={deleteHabit}
        onSelect={setSelectedHabitId}
        onReorder={reorderHabits}
        onAddClick={() => setShowAddHabit(true)}
      />

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="modal-overlay" onClick={() => setShowAddHabit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Habit</h3>
              <button onClick={() => setShowAddHabit(false)}><X size={18} /></button>
            </div>
            <input
              type="text"
              placeholder="e.g., Read 20 pages, Meditate, Workout..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddHabit(false)}>Cancel</button>
              <button className="create-btn" onClick={handleAddHabit}>Create Habit</button>
            </div>
          </div>
        </div>
      )}

      <StatsModal
        habit={selectedHabit}
        stats={stats}
        completions={completions}
        onClose={() => setSelectedHabitId(null)}
      />
    </div>
  );
};

export default Dashboard;
