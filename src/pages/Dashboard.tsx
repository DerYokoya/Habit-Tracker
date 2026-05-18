import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  Plus,
  Calendar,
  CalendarDays,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Download,
  Upload,
  X,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { useChromeStorage } from "../hooks/useChromeStorage";
import { useStreakCalculator } from "../hooks/useStreakCalculator";
import { HabitRow } from "../components/HabitRow";
import { StatsModal } from "../components/StatsModal";
import { Habit, ViewType } from "../types";
import { Bell } from "lucide-react";
import { ReminderSettings } from "../components/ReminderSettings";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export const Dashboard: React.FC = () => {
  const { habits, saveHabits, loading } = useChromeStorage();
  const { habitStats } = useStreakCalculator(habits);
  const [view, setView] = useState<ViewType>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderHabit, setReminderHabit] = useState<Habit | null>(null);

  const todayCompletions = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    let completed = 0;
    habits.forEach((habit) => {
      if (habit.completions[todayStr]) completed++;
    });
    return { completed, total: habits.length };
  }, [habits]);

  const totalCheckIns = useMemo(() => {
    return habits.reduce(
      (sum, habit) =>
        sum + Object.values(habit.completions).filter(Boolean).length,
      0,
    );
  }, [habits]);

  const totalStreak = useMemo(() => {
    return Object.values(habitStats).reduce(
      (sum, s) => sum + s.currentStreak,
      0,
    );
  }, [habitStats]);

  const handleToggleHabit = useCallback(
    async (habitId: string, date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const updatedHabits = habits.map((habit) => {
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
    },
    [habits, saveHabits],
  );

  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: COLORS[habits.length % COLORS.length],
      completions: {},
    };

    await saveHabits([...habits, newHabit]);
    setNewHabitName("");
    setShowAddModal(false);
  }, [newHabitName, habits, saveHabits]);

  const handleDeleteHabit = useCallback(
    async (habitId: string) => {
      const updatedHabits = habits.filter((habit) => habit.id !== habitId);
      await saveHabits(updatedHabits);
    },
    [habits, saveHabits],
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(habits);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      await saveHabits(items);
    },
    [habits, saveHabits],
  );

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "daily") {
      setCurrentDate((prev) =>
        direction === "prev" ? subDays(prev, 1) : addDays(prev, 1),
      );
    } else if (view === "weekly") {
      setCurrentDate((prev) =>
        direction === "prev" ? subDays(prev, 7) : addDays(prev, 7),
      );
    } else {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
        return newDate;
      });
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    if (view === "daily") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else if (view === "weekly") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  const handleShowStats = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowStatsModal(true);
  };

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(habits, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowSettingsMenu(false);
  }, [habits]);

  const handleImportClick = useCallback(() => {
    setShowImportConfirm(true);
    setShowSettingsMenu(false);
  }, []);

  const handleImportConfirm = useCallback(() => {
    fileInputRef.current?.click();
    setShowImportConfirm(false);
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedHabits = JSON.parse(text) as Habit[];

        if (!Array.isArray(importedHabits)) {
          throw new Error("Invalid format: expected an array of habits");
        }

        const validHabits = importedHabits.filter(
          (h) => h.id && h.name && typeof h.completions === "object",
        );

        if (validHabits.length === 0) {
          throw new Error("No valid habits found in file");
        }

        await saveHabits(validHabits);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Import failed. Please check the file format and try again.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [saveHabits],
  );

  const handleSetReminder = (habit: Habit) => {
    setReminderHabit(habit);
    setShowReminderModal(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".settings-container")) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettingsMenu]);

  if (loading) {
    return (
      <div
        className="app"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "600px",
        }}
      >
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
        <div className="header-actions">
          <div className="stats-badge">
            <Calendar size={14} />
            <span>
              {todayCompletions.completed}/{todayCompletions.total}
            </span>
          </div>
          <div className="settings-container">
            <button
              className="settings-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="Settings"
            >
              <Settings size={20} />
            </button>
            {showSettingsMenu && (
              <div className="settings-dropdown">
                <button className="settings-item" onClick={handleExport}>
                  <Download size={16} />
                  Export JSON
                </button>
                <button className="settings-item" onClick={handleImportClick}>
                  <Upload size={16} />
                  Import JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#6366f1" }}>
            🎯
          </div>
          <div className="stat-info">
            <div className="stat-value">{habits.length}</div>
            <div className="stat-label">Active Habits</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#10b981" }}>
            📈
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalCheckIns}</div>
            <div className="stat-label">Total Check-ins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#f59e0b" }}>
            🔥
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalStreak}</div>
            <div className="stat-label">Total Streak</div>
          </div>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={`tab ${view === "daily" ? "active" : ""}`}
          onClick={() => {
            setView("daily");
            goToToday();
          }}
        >
          <LayoutGrid size={14} /> Daily
        </button>
        <button
          className={`tab ${view === "weekly" ? "active" : ""}`}
          onClick={() => {
            setView("weekly");
            goToToday();
          }}
        >
          <CalendarDays size={14} /> Weekly
        </button>
        <button
          className={`tab ${view === "monthly" ? "active" : ""}`}
          onClick={() => {
            setView("monthly");
            goToToday();
          }}
        >
          <Calendar size={14} /> Monthly
        </button>
      </div>

      <div className="date-nav">
        <button className="nav-btn" onClick={() => navigateDate("prev")}>
          <ChevronLeft size={16} />
        </button>
        <h3>{getDateRangeText()}</h3>
        {!isToday(currentDate) && (
          <button className="today-btn" onClick={goToToday}>
            Today
          </button>
        )}
        {isToday(currentDate) && <div style={{ width: "58px" }} />}
        <button className="nav-btn" onClick={() => navigateDate("next")}>
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
                  stats={
                    habitStats[habit.id] || {
                      currentStreak: 0,
                      longestStreak: 0,
                      totalCompletions: 0,
                    }
                  }
                  view={view}
                  currentDate={currentDate}
                  onToggle={handleToggleHabit}
                  onDelete={handleDeleteHabit}
                  onShowStats={handleShowStats}
                  onSetReminder={handleSetReminder}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Habit</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <input
              type="text"
              placeholder="e.g., Morning Run, Read 20 pages, Meditate..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddHabit()}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="create-btn" onClick={handleAddHabit}>
                Create Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && selectedHabit && (
        <StatsModal
          habit={selectedHabit}
          stats={
            habitStats[selectedHabit.id] || {
              currentStreak: 0,
              longestStreak: 0,
              totalCompletions: 0,
            }
          }
          onClose={() => {
            setShowStatsModal(false);
            setSelectedHabit(null);
          }}
        />
      )}

      {showReminderModal && reminderHabit && (
        <ReminderSettings
          habit={reminderHabit}
          onClose={() => {
            setShowReminderModal(false);
            setReminderHabit(null);
          }}
        />
      )}

      {showImportConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowImportConfirm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Habits</h3>
              <button onClick={() => setShowImportConfirm(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              This will replace all your current habits with the imported data.
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowImportConfirm(false)}
              >
                Cancel
              </button>
              <button className="create-btn" onClick={handleImportConfirm}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};
