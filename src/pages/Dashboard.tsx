import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus, Calendar, CalendarDays, LayoutGrid, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { useChromeStorage } from '../hooks/useChromeStorage';
import { useStreakCalculator } from '../hooks/useStreakCalculator';
import { HabitRow } from '../components/HabitRow';
import { StatsModal } from '../components/StatsModal';
import { Habit, ViewType } from '../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const Dashboard: React.FC = () => {
  const { habits, saveHabits, loading } = useChromeStorage();
  const { habitStats } = useStreakCalculator(habits);
  const [view, setView] = useState<ViewType>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const todayCompletions = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let completed = 0;
    habits.forEach(habit => {
      if (habit.completions[todayStr]) completed++;
    });
    return { completed, total: habits.length };
  }, [habits]);

  const handleToggleHabit = useCallback(async (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        return {
          ...habit,
          completions: {
            ...habit.completions,
            [dateStr]: !habit.completions[dateStr],
          },
        };
      }
      return habit;
    });
    await saveHabits(updatedHabits);
  }, [habits, saveHabits]);

  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) return;
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: COLORS[habits.length % COLORS.length],
      completions: {},
    };
    
    await saveHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddModal(false);
  }, [newHabitName, habits, saveHabits]);

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    const updatedHabits = habits.filter(habit => habit.id !== habitId);
    await saveHabits(updatedHabits);
  }, [habits, saveHabits]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(habits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    await saveHabits(items);
  }, [habits, saveHabits]);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'daily') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
    } else if (view === 'weekly') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7));
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
        return newDate;
      });
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    if (view === 'daily') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const handleShowStats = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowStatsModal(true);
  };

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '600px' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-title">
          <Sparkles size={24} />
          <h1>Habit Tracker</h1>
        </div>
        <div className="stats-badge">
          <Calendar size={14} />
          <span>{todayCompletions.completed}/{todayCompletions.total}</span>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{todayCompletions.completed}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{habits.length}</div>
            <div className="stat-label">Habits</div>
          </div>
        </div>
      </div>

      <div className="view-tabs">
        <button className={`tab ${view === 'daily' ? 'active' : ''}`} onClick={() => { setView('daily'); goToToday(); }}>
          <LayoutGrid size={14} /> Daily
        </button>
        <button className={`tab ${view === 'weekly' ? 'active' : ''}`} onClick={() => { setView('weekly'); goToToday(); }}>
          <CalendarDays size={14} /> Weekly
        </button>
        <button className={`tab ${view === 'monthly' ? 'active' : ''}`} onClick={() => { setView('monthly'); goToToday(); }}>
          <Calendar size={14} /> Monthly
        </button>
      </div>

      <div className="date-nav">
        <button className="nav-btn" onClick={() => navigateDate('prev')}>
          <ChevronLeft size={16} />
        </button>
        <h3>{getDateRangeText()}</h3>
        {!isToday(currentDate) && (
          <button className="today-btn" onClick={goToToday}>
            Today
          </button>
        )}
        {isToday(currentDate) && <div style={{ width: '58px' }} />}
        <button className="nav-btn" onClick={() => navigateDate('next')}>
          <ChevronRight size={16} />
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="habits">
          {(provided) => (
            <div
              className="habits-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  index={index}
                  stats={habitStats[habit.id] || { currentStreak: 0, longestStreak: 0, totalCompletions: 0 }}
                  view={view}
                  currentDate={currentDate}
                  onToggle={handleToggleHabit}
                  onDelete={handleDeleteHabit}
                  onShowStats={handleShowStats}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button className="add-habit-btn" onClick={() => setShowAddModal(true)}>
        <Plus size={16} /> Add New Habit
      </button>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Habit</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <input
              type="text"
              placeholder="e.g., Morning Run, Read 20 pages, Meditate..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="create-btn" onClick={handleAddHabit}>Create Habit</button>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && selectedHabit && (
        <StatsModal
          habit={selectedHabit}
          stats={habitStats[selectedHabit.id] || { currentStreak: 0, longestStreak: 0, totalCompletions: 0 }}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedHabit(null);
          }}
        />
      )}
    </div>
  );
};