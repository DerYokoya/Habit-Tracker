import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import HabitCard from './HabitCard';

// Define types
interface Habit {
  id: string;
  name: string;
  color: string;
}

interface Stats {
  [habitId: string]: {
    currentStreak: number;
    longestStreak?: number;
    totalCompletions?: number;
  };
}

interface Completions {
  [habitId: string]: {
    [dateKey: string]: boolean;
  };
}

interface HabitListProps {
  habits: Habit[];
  days: Date[];
  view: 'daily' | 'weekly' | 'monthly';
  currentDate: Date;
  completions: Completions;
  stats: Stats;
  onToggle: (habitId: string, day: Date) => void;
  onDelete: (habitId: string) => void;
  onSelect: (habitId: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onAddClick: () => void;
}

const HabitList: React.FC<HabitListProps> = ({
  habits,
  days,
  view,
  currentDate,
  completions,
  stats,
  onToggle,
  onDelete,
  onSelect,
  onReorder,
  onAddClick,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="habits">
          {(provided) => (
            <div
              className="habits-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {habits.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  days={days}
                  view={view}
                  currentDate={currentDate}
                  completions={completions}
                  streak={stats[habit.id]?.currentStreak || 0}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onSelect={onSelect}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button className="add-habit-btn" onClick={onAddClick}>
        <Plus size={20} /> Add Habit
      </button>
    </>
  );
};

export default HabitList;