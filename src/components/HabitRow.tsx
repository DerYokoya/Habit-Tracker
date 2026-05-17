import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Flame, BarChart3 } from 'lucide-react';
import { Habit, HabitStats, ViewType } from '../types';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, getDate } from 'date-fns';

interface HabitRowProps {
  habit: Habit;
  index: number;
  stats: HabitStats;
  view: ViewType;
  currentDate: Date;
  onToggle: (habitId: string, date: Date) => void;
  onDelete: (habitId: string) => void;
  onShowStats: (habit: Habit) => void;
}

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  index,
  stats,
  view,
  currentDate,
  onToggle,
  onDelete,
  onShowStats,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const renderDailyView = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const isCompleted = habit.completions[dateStr] || false;

    return (
      <button
        className="day-cell completed"
        style={{ '--habit-color': habit.color } as React.CSSProperties}
        onClick={() => onToggle(habit.id, currentDate)}
      >
        {isCompleted ? '✓' : '○'}
      </button>
    );
  };

  const renderWeeklyView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="habit-days">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCompleted = habit.completions[dateStr] || false;
          return (
            <button
              key={dateStr}
              className={`day-cell ${isCompleted ? 'completed' : ''} ${isToday(day) ? 'today' : ''}`}
              style={{ '--habit-color': habit.color } as React.CSSProperties}
              onClick={() => onToggle(habit.id, day)}
            >
              <div className="weekly-cell">
                <span className="week-day">{format(day, 'EEE')}</span>
                <span className="week-date">{getDate(day)}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Adjust for Monday start (0 = Sunday, need 1 = Monday)
    const offset = startDay === 0 ? 6 : startDay - 1;
    const totalDays = Math.ceil((offset + daysInMonth) / 7) * 7;
    const days = [];

    for (let i = 0; i < totalDays; i++) {
      const dayNumber = i - offset + 1;
      const date = new Date(year, month, dayNumber);
      const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const dateStr = format(date, 'yyyy-MM-dd');
      const isCompleted = habit.completions[dateStr] || false;
      
      days.push(
        <button
          key={i}
          className={`day-cell ${isCompleted ? 'completed' : ''} ${isToday(date) ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
          style={{ '--habit-color': habit.color } as React.CSSProperties}
          onClick={() => isCurrentMonth && onToggle(habit.id, date)}
          disabled={!isCurrentMonth}
        >
          {isCurrentMonth ? dayNumber : ''}
        </button>
      );
    }

    return <div className="habit-days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>{days}</div>;
  };

  const getViewContent = () => {
    switch (view) {
      case 'daily':
        return renderDailyView();
      case 'weekly':
        return renderWeeklyView();
      case 'monthly':
        return renderMonthlyView();
      default:
        return null;
    }
  };

  return (
    <Draggable draggableId={habit.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`habit-row ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{ borderLeftColor: habit.color, ...provided.draggableProps.style }}
        >
          <div className="habit-info">
            <div {...provided.dragHandleProps} className="drag-handle">
              <GripVertical size={16} />
            </div>
            <div className="habit-name" onClick={() => onShowStats(habit)}>
              <div className="habit-color" style={{ backgroundColor: habit.color }} />
              <span>{habit.name}</span>
              <BarChart3 size={14} color="#94a3b8" />
            </div>
            <div className="streak-badge">
              <Flame size={12} />
              <span>{stats.currentStreak}</span>
            </div>
            {showDeleteConfirm ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => onDelete(habit.id)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="delete-habit-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete habit"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {getViewContent()}
        </div>
      )}
    </Draggable>
  );
};