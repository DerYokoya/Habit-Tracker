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
  Tag,
  Filter,
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
import { Habit, ViewType, DEFAULT_CATEGORIES } from "../types";
import { ReminderSettings } from "../components/ReminderSettings";
import { loadData } from "../services/storageService";
import { ImportExportModal } from "../components/ImportExportModal";

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
  const [newHabitCategory, setNewHabitCategory] = useState("");
  const [newHabitTags, setNewHabitTags] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderHabit, setReminderHabit] = useState<Habit | null>(null);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reminders, setReminders] = useState<Record<string, string>>({});

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");

  useEffect(() => {
    const loadReminders = async () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["reminders"]);
        setReminders(result.reminders || {});
      }
    };
    loadReminders();
  }, []);

  // Derive all categories and tags from habits
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    habits.forEach((h) => { if (h.category) cats.add(h.category); });
    return Array.from(cats).sort();
  }, [habits]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    habits.forEach((h) => { h.tags?.forEach((t) => tags.add(t)); });
    return Array.from(tags).sort();
  }, [habits]);

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      const catMatch = filterCategory === "all" || h.category === filterCategory;
      const tagMatch = filterTag === "all" || (h.tags && h.tags.includes(filterTag));
      return catMatch && tagMatch;
    });
  }, [habits, filterCategory, filterTag]);

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

    const parsedTags = newHabitTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: COLORS[habits.length % COLORS.length],
      completions: {},
      category: newHabitCategory || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    };

    await saveHabits([...habits, newHabit]);
    setNewHabitName("");
    setNewHabitCategory("");
    setNewHabitTags("");
    setShowAddModal(false);
  }, [newHabitName, newHabitCategory, newHabitTags, habits, saveHabits]);

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

      // Drag within filtered list needs to map back to full habits array
      const srcHabit = filteredHabits[result.source.index];
      const destHabit = filteredHabits[result.destination.index];
      const srcIdx = habits.findIndex((h) => h.id === srcHabit.id);
      const destIdx = habits.findIndex((h) => h.id === destHabit.id);

      const items = Array.from(habits);
      const [reorderedItem] = items.splice(srcIdx, 1);
      items.splice(destIdx, 0, reorderedItem);

      await saveHabits(items);
    },
    [habits, filteredHabits, saveHabits],
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

  const getReminders = useCallback(async () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      const result = await chrome.storage.local.get(["reminders"]);
      setReminders(result.reminders || {});
      return result.reminders || {};
    }
    return {};
  }, []);

  const handleExportJSON = useCallback(async () => {
    const reminders = await getReminders();
    const exportData = {
      habits: habits,
      reminders: reminders,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [habits, getReminders]);

  const handleImportJSON = useCallback(
    async (file: File) => {
      const text = await file.text();
      const importData = JSON.parse(text);

      let importedHabits: Habit[];
      let importedReminders: Record<string, string> = {};

      if (Array.isArray(importData)) {
        importedHabits = importData;
      } else if (importData.habits && Array.isArray(importData.habits)) {
        importedHabits = importData.habits;
        importedReminders = importData.reminders || {};
      } else {
        throw new Error("Invalid format: expected habits array or export object");
      }

      const validHabits = importedHabits.filter(
        (h) => h.id && h.name && typeof h.completions === "object",
      );

      if (validHabits.length === 0) {
        throw new Error("No valid habits found in file");
      }

      if (
        window.confirm(
          `Import ${validHabits.length} habits with ${Object.keys(importedReminders).length} reminder settings? This will replace all current data.`,
        )
      ) {
        await saveHabits(validHabits);

        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          Object.keys(importedReminders).length > 0
        ) {
          const currentReminders = await chrome.storage.local.get(["reminders"]);
          const reminders = currentReminders.reminders || {};

          Object.keys(reminders).forEach((reminderHabitId) => {
            if (!validHabits.some((h) => h.id === reminderHabitId)) {
              if (typeof chrome !== "undefined" && chrome.alarms) {
                chrome.alarms.clear(`habit-reminder-${reminderHabitId}`);
              }
              delete reminders[reminderHabitId];
            }
          });

          Object.entries(importedReminders).forEach(([habitId, time]) => {
            reminders[habitId] = time;
            if (typeof chrome !== "undefined" && chrome.alarms && time) {
              setReminderAlarm(habitId, time as string);
            }
          });

          await chrome.storage.local.set({ reminders });
          setReminders(reminders);
        }
      }
    },
    [saveHabits],
  );

  const setReminderAlarm = (habitId: string, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);

    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const periodInMinutes = 24 * 60;

    chrome.alarms.create(`habit-reminder-${habitId}`, {
      when: alarmTime.getTime(),
      periodInMinutes: periodInMinutes,
    });
  };

  const handleCSVImport = useCallback(
    async (
      importedHabits: Habit[],
      importedReminders: Record<string, string>,
    ) => {
      await saveHabits(importedHabits);

      if (typeof chrome !== "undefined" && chrome.storage) {
        const currentReminders = await chrome.storage.local.get(["reminders"]);
        const reminders = currentReminders.reminders || {};

        Object.keys(reminders).forEach((reminderHabitId) => {
          if (!importedHabits.some((h) => h.id === reminderHabitId)) {
            if (chrome.alarms) {
              chrome.alarms.clear(`habit-reminder-${reminderHabitId}`);
            }
            delete reminders[reminderHabitId];
          }
        });

        Object.entries(importedReminders).forEach(([habitId, time]) => {
          if (importedHabits.some((h) => h.id === habitId)) {
            reminders[habitId] = time;
            if (chrome.alarms && time) {
              setReminderAlarm(habitId, time);
            }
          }
        });

        await chrome.storage.local.set({ reminders });
        setReminders(reminders);
      }
    },
    [saveHabits],
  );

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

  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.habits) {
        loadData();
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [loadData]);

  const isFiltering = filterCategory !== "all" || filterTag !== "all";

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
                <button
                  className="settings-item"
                  onClick={() => {
                    setShowImportExportModal(true);
                    setShowSettingsMenu(false);
                  }}
                >
                  <Download size={16} />
                  Import / Export
                </button>
                <button className="settings-item" onClick={handleImportClick}>
                  <Upload size={16} />
                  Import JSON (Legacy)
                </button>
              </div>
            )}
            {showImportExportModal && (
              <ImportExportModal
                habits={habits}
                reminders={reminders}
                onClose={() => setShowImportExportModal(false)}
                onImport={handleCSVImport}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
              />
            )}
          </div>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#6366f1" }}>🎯</div>
          <div className="stat-info">
            <div className="stat-value">{habits.length}</div>
            <div className="stat-label">Active Habits</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#10b981" }}>📈</div>
          <div className="stat-info">
            <div className="stat-value">{totalCheckIns}</div>
            <div className="stat-label">Total Check-ins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#f59e0b" }}>🔥</div>
          <div className="stat-info">
            <div className="stat-value">{totalStreak}</div>
            <div className="stat-label">Total Streak</div>
          </div>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={`tab ${view === "daily" ? "active" : ""}`}
          onClick={() => { setView("daily"); goToToday(); }}
        >
          <LayoutGrid size={14} /> Daily
        </button>
        <button
          className={`tab ${view === "weekly" ? "active" : ""}`}
          onClick={() => { setView("weekly"); goToToday(); }}
        >
          <CalendarDays size={14} /> Weekly
        </button>
        <button
          className={`tab ${view === "monthly" ? "active" : ""}`}
          onClick={() => { setView("monthly"); goToToday(); }}
        >
          <Calendar size={14} /> Monthly
        </button>
      </div>

      {/* Filter Bar */}
      {(allCategories.length > 0 || allTags.length > 0) && (
        <div className="filter-bar">
          <div className="filter-bar-inner">
            <Filter size={13} className="filter-icon" />
            {allCategories.length > 0 && (
              <div className="filter-group">
                <button
                  className={`filter-chip ${filterCategory === "all" ? "active" : ""}`}
                  onClick={() => setFilterCategory("all")}
                >
                  All
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-chip category-chip ${filterCategory === cat ? "active" : ""}`}
                    onClick={() =>
                      setFilterCategory(filterCategory === cat ? "all" : cat)
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {allTags.length > 0 && (
              <div className="filter-group filter-tags-group">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`filter-chip tag-chip ${filterTag === tag ? "active" : ""}`}
                    onClick={() =>
                      setFilterTag(filterTag === tag ? "all" : tag)
                    }
                  >
                    <Tag size={10} />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isFiltering && (
            <button
              className="filter-clear"
              onClick={() => { setFilterCategory("all"); setFilterTag("all"); }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

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
              {filteredHabits.length === 0 && isFiltering && (
                <div className="filter-empty">
                  No habits match the current filters.
                </div>
              )}
              {filteredHabits.map((habit, index) => (
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
            <div className="modal-field">
              <label className="modal-label">Category</label>
              <select
                className="modal-select"
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
              >
                <option value="">No category</option>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">
                <Tag size={12} /> Tags
                <span className="modal-label-hint">comma-separated</span>
              </label>
              <input
                type="text"
                placeholder="e.g., morning, solo, 10min"
                value={newHabitTags}
                onChange={(e) => setNewHabitTags(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: "16px" }}>
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
