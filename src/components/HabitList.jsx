import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import HabitCard from './HabitCard';

const HabitList = ({
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
  const handleDragEnd = (result) => {
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
