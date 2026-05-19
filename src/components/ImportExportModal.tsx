// src/components/ImportExportModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { Download, Upload, FileText, X, FileJson, Table } from "lucide-react";
import { Habit } from "../types";

interface ImportExportModalProps {
  habits: Habit[];
  reminders?: Record<string, string>;
  onClose: () => void;
  onImport: (
    habits: Habit[],
    reminders: Record<string, string>,
  ) => Promise<void>;
  onExportJSON: () => void;
  onImportJSON: (file: File) => Promise<void>;
}

type TabType = "export" | "import";

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  habits,
  reminders = {},
  onClose,
  onImport,
  onExportJSON,
  onImportJSON,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("export");
  const [csvText, setCsvText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importType, setImportType] = useState<"json" | "csv">("csv");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasExistingReminders, setHasExistingReminders] = useState(false);

  useEffect(() => {
    const checkReminders = async () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["reminders"]);
        const existingReminders = result.reminders || {};
        setHasExistingReminders(Object.keys(existingReminders).length > 0);
      }
    };
    checkReminders();
  }, []);

  // Convert habits to CSV
  // Updated habitsToCSV function - only add Reminder Time column if there are any reminders
  const habitsToCSV = (
    habits: Habit[],
    reminders: Record<string, string>,
  ): string => {
    const allDates = new Set<string>();
    habits.forEach((habit) => {
      Object.keys(habit.completions).forEach((date) => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Check if there are any reminders set
    const hasAnyReminders = Object.keys(reminders).length > 0;

    // Only add Reminder Time column if there are reminders
    const headers = hasAnyReminders
      ? ["Habit ID", "Habit Name", "Color", "Reminder Time", ...sortedDates]
      : ["Habit ID", "Habit Name", "Color", ...sortedDates];

    const rows = habits.map((habit) => {
      const row: string[] = [
        habit.id,
        `"${habit.name.replace(/"/g, '""')}"`,
        habit.color,
      ];

      // Only add reminder time if there are any reminders
      if (hasAnyReminders) {
        row.push(reminders[habit.id] || "");
      }

      sortedDates.forEach((date) => {
        const completed = habit.completions[date] || false;
        row.push(completed ? "1" : "0");
      });

      return row.join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  // Parse CSV to habits
  const csvToHabits = (
    csv: string,
  ): { habits: Habit[]; reminders: Record<string, string> } => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = parseCSVLine(lines[0]);
    // Check if Reminder Time column exists (not just the string, but actually present)
    const hasReminderColumn = headers.includes("Reminder Time");
    const reminderColumnIndex = hasReminderColumn
      ? headers.indexOf("Reminder Time")
      : -1;
    const dateColumns = headers.slice(hasReminderColumn ? 4 : 3);

    const habits: Habit[] = [];
    const reminders: Record<string, string> = {};

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;

      const habitId = values[0];
      const habit: Habit = {
        id: habitId || Date.now().toString() + i,
        name: values[1].replace(/^"|"$/g, "").replace(/""/g, '"'),
        color: values[2] || getRandomColor(),
        completions: {},
      };

      // Only extract reminder if column exists AND has a non-empty value
      if (
        hasReminderColumn &&
        values[reminderColumnIndex] &&
        values[reminderColumnIndex].trim()
      ) {
        const reminderTime = values[reminderColumnIndex].trim();
        // Validate it looks like a time (HH:MM format)
        if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
          reminders[habit.id] = reminderTime;
        }
      }

      // Parse completion data
      const startIdx = hasReminderColumn ? reminderColumnIndex + 1 : 3;
      for (
        let j = 0;
        j < dateColumns.length && j + startIdx < values.length;
        j++
      ) {
        const date = dateColumns[j];
        const value = values[j + startIdx];
        if (date && (value === "1" || value === "true" || value === "TRUE")) {
          habit.completions[date] = true;
        }
      }

      habits.push(habit);
    }

    if (habits.length === 0) {
      throw new Error("No valid habits found in CSV");
    }

    return { habits, reminders };
  };

  const handleImportCSV = async () => {
    try {
      setError("");
      const { habits: importedHabits, reminders: importedReminders } =
        csvToHabits(csvText);

      const reminderCount = Object.keys(importedReminders).length;

      let message = "";
      if (reminderCount > 0 && hasExistingReminders) {
        message = `Import will replace ${Object.keys(importedReminders).length} existing reminder setting(s). Continue?`;
      } else if (reminderCount > 0) {
        message = `Import ${importedHabits.length} habits with ${reminderCount} reminder setting(s)?`;
      } else if (hasExistingReminders) {
        message = `Import ${importedHabits.length} habits. WARNING: This will REMOVE all your existing reminder settings (${Object.keys(importedReminders).length} reminders found in backup). Continue?`;
      } else {
        message = `Import ${importedHabits.length} habits (no reminder settings affected)?`;
      }

      if (window.confirm(message)) {
        await onImport(importedHabits, importedReminders);
        setSuccess(
          `CSV import successful! ${reminderCount > 0 ? `Imported ${reminderCount} reminder setting(s).` : "No reminder settings were imported."}`,
        );
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let current = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  const getRandomColor = (): string => {
    const colors = [
      "#6366f1",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#f97316",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleExportCSV = () => {
    const csv = habitsToCSV(habits, reminders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccess("CSV export complete!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleJSONFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onImportJSON(file);
      setSuccess("JSON import successful!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import JSON");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerJSONFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal import-export-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Import / Export Data</h3>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="ie-tabs">
          <button
            className={`ie-tab ${activeTab === "export" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("export");
              setError("");
              setSuccess("");
            }}
          >
            <Download size={14} /> Export
          </button>
          <button
            className={`ie-tab ${activeTab === "import" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("import");
              setError("");
              setSuccess("");
            }}
          >
            <Upload size={14} /> Import
          </button>
        </div>

        {activeTab === "export" ? (
          <div className="ie-export-content">
            <p className="ie-info">
              Export your habits and completion history in either JSON or CSV
              format.
            </p>

            <div className="ie-format-section">
              <h4>JSON Format</h4>
              <div className="ie-format-card">
                <FileJson size={20} />
                <div className="ie-format-info">
                  <strong>Complete data export</strong>
                  <span>
                    Includes all habit data and completion history in JSON
                    format
                  </span>
                </div>
                <button className="ie-export-json-btn" onClick={onExportJSON}>
                  <Download size={14} /> Export JSON
                </button>
              </div>
            </div>

            <div className="ie-format-section">
              <h4>CSV Format</h4>
              <div className="ie-format-card">
                <Table size={20} />
                <div className="ie-format-info">
                  <strong>Spreadsheet compatible</strong>
                  <span>
                    Open with Excel, Google Sheets, or any spreadsheet app
                  </span>
                </div>
                <button className="ie-export-csv-btn" onClick={handleExportCSV}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            <div className="export-preview">
              <FileText size={16} />
              <span>
                {habits.length} habit{habits.length !== 1 ? "s" : ""} will be
                exported
              </span>
            </div>
          </div>
        ) : (
          <div className="ie-import-content">
            <p className="ie-info">
              Import data from JSON or CSV format. This will replace all your
              current habits.
            </p>

            {/* Format selector */}
            <div className="ie-format-selector">
              <button
                className={`ie-format-btn ${importType === "json" ? "active" : ""}`}
                onClick={() => {
                  setImportType("json");
                  setError("");
                  setCsvText("");
                }}
              >
                <FileJson size={14} /> JSON
              </button>
              <button
                className={`ie-format-btn ${importType === "csv" ? "active" : ""}`}
                onClick={() => {
                  setImportType("csv");
                  setError("");
                }}
              >
                <Table size={14} /> CSV
              </button>
            </div>

            {importType === "json" ? (
              <div className="ie-json-import">
                <div className="ie-json-import-card">
                  <FileJson size={24} />
                  <div className="ie-json-import-text">
                    <strong>Import JSON file</strong>
                    <span>Select a JSON backup file from previous exports</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: "none" }}
                    onChange={handleJSONFileUpload}
                  />
                  <button
                    className="ie-upload-btn"
                    onClick={triggerJSONFileInput}
                  >
                    <Upload size={14} /> Choose File
                  </button>
                </div>
              </div>
            ) : (
              <div className="ie-csv-import">
                <textarea
                  className="ie-csv-textarea"
                  placeholder={`Paste CSV data here. Format should have columns:\nHabit ID,Habit Name,Color,2024-01-01,2024-01-02,2024-01-03\n"1","Morning Meditation","#6366f1",1,0,1\n"2","Drink Water","#10b981",1,1,1`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                />
                <div className="ie-csv-actions">
                  <label className="ie-upload-label">
                    <Upload size={14} /> Upload CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setCsvText(event.target?.result as string);
                          };
                          reader.readAsText(file);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button className="ie-import-btn" onClick={handleImportCSV}>
                    <Upload size={16} /> Import CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="ie-error">{error}</div>}
        {success && <div className="ie-success">{success}</div>}
      </div>
    </div>
  );
};
