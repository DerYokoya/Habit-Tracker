import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Flame, GripVertical, Trash2 } from 'lucide-react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { getDateKey } from '../utils/dateUtils';

// Define types
interface Habit {
  id: string;
  name: string;
  color: string;
}

interface HabitCardProps {
  habit: Habit;
  index: number;
  days: Date[];
  view: 'daily' | 'weekly' | 'monthly';
  currentDate: Date;
  completions: Record<string, Record<string, boolean>>;
  streak: number;
  onToggle: (habitId: string, day: Date) => void;
  onDelete: (habitId: string) => void;
  onSelect: (habitId: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  index,
  days,
  view,
  currentDate,
  completions,
  streak,
  onToggle,
  onDelete,
  onSelect,
}) => (
  <Draggable draggableId={habit.id} index={index}>
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

          <div className="habit-name" onClick={() => onSelect(habit.id)}>
            <div className="habit-color" style={{ backgroundColor: habit.color }} />
            <span>{habit.name}</span>
          </div>

          {streak > 0 && (
            <div className="streak-badge">
              <Flame size={12} />
              <span>{streak}</span>
            </div>
          )}

          <button onClick={() => onDelete(habit.id)} className="delete-habit-btn">
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
                onClick={() => onToggle(habit.id, day)}
                style={{ '--habit-color': habit.color } as React.CSSProperties}
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
);

export default HabitCard;