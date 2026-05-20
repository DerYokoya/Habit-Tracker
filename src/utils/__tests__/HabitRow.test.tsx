import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { HabitRow } from '../../components/HabitRow';

// Mock the drag-and-drop context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DragDropContext onDragEnd={() => {}}>
    <Droppable droppableId="test">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

describe('HabitRow', () => {
  const mockHabit = {
    id: '1',
    name: 'Test Habit',
    color: '#6366f1',
    completions: {},
  };
  const mockStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalCompletions: 25,
  };
  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnShowStats = vi.fn();
  const mockOnSetReminder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders habit name correctly', () => {
    render(
      <HabitRow
        habit={mockHabit}
        index={0}
        stats={mockStats}
        view="daily"
        currentDate={new Date()}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onShowStats={mockOnShowStats}
        onSetReminder={mockOnSetReminder}
      />,
      { wrapper }
    );
    expect(screen.getByText('Test Habit')).toBeDefined();
  });

  it('displays streak badge with correct count', () => {
    render(
      <HabitRow
        habit={mockHabit}
        index={0}
        stats={mockStats}
        view="daily"
        currentDate={new Date()}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onShowStats={mockOnShowStats}
        onSetReminder={mockOnSetReminder}
      />,
      { wrapper }
    );
    expect(screen.getByText('5')).toBeDefined();
  });

  it('calls onShowStats when habit name is clicked', () => {
    render(
      <HabitRow
        habit={mockHabit}
        index={0}
        stats={mockStats}
        view="daily"
        currentDate={new Date()}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onShowStats={mockOnShowStats}
        onSetReminder={mockOnSetReminder}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByText('Test Habit'));
    expect(mockOnShowStats).toHaveBeenCalledWith(mockHabit);
  });

  it('shows delete confirmation before deleting', () => {
    render(
      <HabitRow
        habit={mockHabit}
        index={0}
        stats={mockStats}
        view="daily"
        currentDate={new Date()}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onShowStats={mockOnShowStats}
        onSetReminder={mockOnSetReminder}
      />,
      { wrapper }
    );
    const deleteButton = screen.getByTitle('Delete habit');
    fireEvent.click(deleteButton);
    expect(screen.getByText('Confirm')).toBeDefined();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});