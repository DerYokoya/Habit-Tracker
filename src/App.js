// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth,
  getDay,
  addMonths,
  subMonths
} from 'date-fns';
import { 
  Flame, 
  Calendar, 
  List, 
  BarChart3, 
  Plus, 
  GripVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  Award,
  X
} from 'lucide-react';
import './App.css';

// Storage key
const STORAGE_KEY = 'habit-tracker-data';

// Initial demo habits
const initialHabits = [
  { id: '1', name: 'Morning Meditation', color: '#6366f1', order: 0 },
  { id: '2', name: 'Drink 8 Glasses Water', color: '#10b981', order: 1 },
  { id: '3', name: 'Read 30 mins', color: '#f59e0b', order: 2 },
  { id: '4', name: 'Exercise', color: '#ef4444', order: 3 },
];

// Helper to get today's date key
const getDateKey = (date) => format(date, 'yyyy-MM-dd');

const App = () => {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [view, setView] = useState('daily'); // daily, weekly, monthly
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [stats, setStats] = useState({});

  // Load data from chrome.storage
  useEffect(() => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY];
        if (data) {
          setHabits(data.habits || []);
          setCompletions(data.completions || {});
        } else {
          setHabits(initialHabits);
        }
      });
    } else {
      // Fallback for development
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setHabits(data.habits || []);
        setCompletions(data.completions || {});
      } else {
        setHabits(initialHabits);
      }
    }
  }, []);

  // Calculate streaks and stats
  const calculateStats = useCallback(() => {
    const newStats = {};
    habits.forEach(habit => {
      let currentStreak = 0;
      let longestStreak = 0;
      let totalCompletions = 0;
      
      // Get all dates for this habit
      const habitCompletions = completions[habit.id] || {};
      const dates = Object.keys(habitCompletions).sort();
      
      totalCompletions = dates.length;
      
      // Calculate streak
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let currentDate = today;
      
      while (true) {
        const dateKey = getDateKey(currentDate);
        if (habitCompletions[dateKey]) {
          currentStreak++;
          currentDate = subDays(currentDate, 1);
        } else {
          break;
        }
      }
      
      // Calculate longest streak
      let tempStreak = 0;
      for (let i = 0; i < dates.length; i++) {
        const current = new Date(dates[i]);
        const prev = i > 0 ? new Date(dates[i-1]) : null;
        
        if (prev && (current - prev) === 86400000) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
      
      newStats[habit.id] = {
        currentStreak,
        longestStreak,
        totalCompletions,
        completionRate: totalCompletions > 0 ? (totalCompletions / 365) * 100 : 0
      };
    });
    setStats(newStats);
  }, [habits, completions]);

  // Save data to storage
  useEffect(() => {
    if (habits.length === 0 && Object.keys(completions).length === 0) return;
    
    const data = { habits, completions };
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY]: data });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // Update stats
    calculateStats();
  }, [habits, completions, calculateStats]);

  // Toggle habit completion
  const toggleHabit = (habitId, date) => {
    const dateKey = getDateKey(date);
    setCompletions(prev => {
      const habitCompletions = prev[habitId] || {};
      const updated = { ...habitCompletions };
      
      if (updated[dateKey]) {
        delete updated[dateKey];
      } else {
        updated[dateKey] = true;
      }
      
      return { ...prev, [habitId]: updated };
    });
  };

  // Add new habit
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      order: habits.length
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddHabit(false);
  };

  // Delete habit
  const deleteHabit = (habitId) => {
    if (window.confirm('Delete this habit? All progress will be lost.')) {
      setHabits(habits.filter(h => h.id !== habitId));
      setCompletions(prev => {
        const newCompletions = { ...prev };
        delete newCompletions[habitId];
        return newCompletions;
      });
    }
  };

  // Drag and drop reordering
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(habits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property
    const reorderedHabits = items.map((item, index) => ({ ...item, order: index }));
    setHabits(reorderedHabits);
  };

  // Get days for current view
  const getDaysForView = () => {
    if (view === 'daily') {
      return [currentDate];
    } else if (view === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const days = eachDayOfInterval({ start, end });
      // Add padding days from prev/next month to show full weeks
      const firstDayOfWeek = getDay(start);
      const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      const paddedStart = subDays(start, daysToAdd);
      const paddedEnd = addDays(end, 42 - days.length - daysToAdd);
      return eachDayOfInterval({ start: paddedStart, end: paddedEnd });
    }
  };

  const days = getDaysForView();
  
  const navigateDate = (direction) => {
    if (view === 'daily') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
    } else if (view === 'weekly') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7));
    } else {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    }
  };

  const getViewTitle = () => {
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

  // Chart data for selected habit
  const getChartData = () => {
    if (!selectedHabitId) return [];
    const habitCompletions = completions[selectedHabitId] || {};
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = getDateKey(date);
      last30Days.push({
        date: format(date, 'MM/dd'),
        completed: habitCompletions[dateKey] ? 1 : 0
      });
    }
    return last30Days;
  };

  // Get overall stats
  const getOverallStats = () => {
    let totalHabits = habits.length;
    let totalCompletions = 0;
    let activeToday = 0;
    const todayKey = getDateKey(new Date());
    
    habits.forEach(habit => {
      const habitCompletions = completions[habit.id] || {};
      totalCompletions += Object.keys(habitCompletions).length;
      if (habitCompletions[todayKey]) activeToday++;
    });
    
    return { totalHabits, totalCompletions, activeToday };
  };

  const overall = getOverallStats();

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <Flame size={24} color="#f59e0b" />
          <h1>Habit Tracker</h1>
        </div>
        <div className="stats-badge">
          <Award size={16} />
          <span>{overall.activeToday}/{overall.totalHabits}</span>
        </div>
      </div>

      {/* Overall Stats Cards */}
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

      {/* View Tabs */}
      <div className="view-tabs">
        <button className={`tab ${view === 'daily' ? 'active' : ''}`} onClick={() => setView('daily')}>
          <Calendar size={16} /> Daily
        </button>
        <button className={`tab ${view === 'weekly' ? 'active' : ''}`} onClick={() => setView('weekly')}>
          <List size={16} /> Weekly
        </button>
        <button className={`tab ${view === 'monthly' ? 'active' : ''}`} onClick={() => setView('monthly')}>
          <BarChart3 size={16} /> Monthly
        </button>
      </div>

      {/* Date Navigation */}
      <div className="date-nav">
        <button onClick={() => navigateDate('prev')} className="nav-btn">
          <ChevronLeft size={18} />
        </button>
        <h3>{getViewTitle()}</h3>
        <button onClick={() => navigateDate('next')} className="nav-btn">
          <ChevronRight size={18} />
        </button>
        <button onClick={() => setCurrentDate(new Date())} className="today-btn">Today</button>
      </div>

      {/* Habit Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="habits">
          {(provided) => (
            <div className="habits-container" {...provided.droppableProps} ref={provided.innerRef}>
              {habits.map((habit, index) => (
                <Draggable key={habit.id} draggableId={habit.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      className={`habit-row ${snapshot.isDragging ? 'dragging' : ''}`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{ ...provided.draggableProps.style, borderLeftColor: habit.color }}
                    >
                      <div className="habit-info">
                        <div className="drag-handle" {...provided.dragHandleProps}>
                          <GripVertical size={16} />
                        </div>
                        <div className="habit-name" onClick={() => setSelectedHabitId(habit.id)}>
                          <div className="habit-color" style={{ backgroundColor: habit.color }} />
                          <span>{habit.name}</span>
                        </div>
                        {stats[habit.id]?.currentStreak > 0 && (
                          <div className="streak-badge">
                            <Flame size={12} />
                            <span>{stats[habit.id].currentStreak}</span>
                          </div>
                        )}
                        <button onClick={() => deleteHabit(habit.id)} className="delete-habit-btn">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="habit-days">
                        {days.map((day, idx) => {
                          const isCurrentMonth = view !== 'monthly' || isSameMonth(day, currentDate);
                          const isToday = isSameDay(day, new Date());
                          const isCompleted = completions[habit.id]?.[getDateKey(day)] || false;
                          return (
                            <button
                              key={idx}
                              className={`day-cell ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                              onClick={() => toggleHabit(habit.id, day)}
                              style={{ '--habit-color': habit.color }}
                            >
                              {view === 'daily' && format(day, 'd')}
                              {view === 'weekly' && (
                                <div className="weekly-cell">
                                  <span className="week-day">{format(day, 'EEE')}</span>
                                  <span className="week-date">{format(day, 'd')}</span>
                                </div>
                              )}
                              {view === 'monthly' && format(day, 'd')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Habit Button */}
      <button className="add-habit-btn" onClick={() => setShowAddHabit(true)}>
        <Plus size={20} /> Add Habit
      </button>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="modal-overlay" onClick={() => setShowAddHabit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Habit</h3>
              <button onClick={() => setShowAddHabit(false)}><X size={18} /></button>
            </div>
            <input
              type="text"
              placeholder="e.g., Read 20 pages, Meditate, Workout..."
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addHabit()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddHabit(false)}>Cancel</button>
              <button className="create-btn" onClick={addHabit}>Create Habit</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal for selected habit */}
      {selectedHabitId && (
        <div className="modal-overlay" onClick={() => setSelectedHabitId(null)}>
          <div className="modal stats-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{habits.find(h => h.id === selectedHabitId)?.name} - Statistics</h3>
              <button onClick={() => setSelectedHabitId(null)}><X size={18} /></button>
            </div>
            <div className="stats-details">
              <div className="stat-item">
                <Flame size={20} color="#f59e0b" />
                <div>
                  <div className="stat-label">Current Streak</div>
                  <div className="stat-number">{stats[selectedHabitId]?.currentStreak || 0} days</div>
                </div>
              </div>
              <div className="stat-item">
                <Award size={20} color="#10b981" />
                <div>
                  <div className="stat-label">Longest Streak</div>
                  <div className="stat-number">{stats[selectedHabitId]?.longestStreak || 0} days</div>
                </div>
              </div>
              <div className="stat-item">
                <Target size={20} color="#6366f1" />
                <div>
                  <div className="stat-label">Total Completions</div>
                  <div className="stat-number">{stats[selectedHabitId]?.totalCompletions || 0}</div>
                </div>
              </div>
            </div>
            <div className="chart-container">
              <h4>Last 30 Days</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} tickFormatter={(value) => value === 1 ? '✓' : ''} />
                  <Tooltip />
                  <Bar dataKey="completed" fill={habits.find(h => h.id === selectedHabitId)?.color || '#6366f1'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;