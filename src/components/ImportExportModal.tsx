// src/components/ImportExportModal.tsx
import React, { useState, useRef } from "react";
import { Download, Upload, FileText, X, FileJson, Table } from "lucide-react";
import { format } from "date-fns";
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
  const [importType, setImportType] = useState<"json" | "csv">("json");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseLine = (line: string, delimiter: string): string[] => {
    if (delimiter === '\t') {
      return line.split('\t').map(field => field.trim());
    }
    
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
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const detectDelimiter = (firstLine: string): string => {
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    return tabCount > commaCount ? '\t' : ',';
  };

  const getRandomColor = (): string => {
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const quoteCSVField = (value: string): string => {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // FIXED: Export includes reminders, categories, and tags
  const handleExportCSV = () => {
    const allDates = new Set<string>();
    habits.forEach(habit => {
      Object.keys(habit.completions).forEach(date => allDates.add(date));
    });

    const sortedDates = Array.from(allDates).sort();
    const hasAnyReminders = Object.keys(reminders).length > 0;

    const headers = ["Habit ID", "Habit Name", "Color", "Category", "Tags"];
    if (hasAnyReminders) {
      headers.push("Reminder Time");
    }
    headers.push(...sortedDates);

    const rows = habits.map(habit => {
      const tagString = (habit.tags || []).join(";");
      const row = [
        habit.id,
        quoteCSVField(habit.name),
        habit.color,
        quoteCSVField(habit.category || ""),
        quoteCSVField(tagString),
      ];

      if (hasAnyReminders) {
        const reminderTime = reminders[habit.id] || "";
        row.push(reminderTime);
      }

      sortedDates.forEach(date => {
        const completed = habit.completions[date] || false;
        row.push(completed ? "1" : "0");
      });

      return row.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // FIXED: Import reads reminders, categories, and tags
  const csvToHabits = (csv: string): { habits: Habit[]; reminders: Record<string, string> } => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseLine(lines[0], delimiter);

    const hasReminderColumn = headers.includes("Reminder Time");
    const hasCategoryColumn = headers.includes("Category");
    const hasTagsColumn = headers.includes("Tags");

    const reminderColumnIndex = hasReminderColumn ? headers.indexOf("Reminder Time") : -1;
    const categoryColumnIndex = hasCategoryColumn ? headers.indexOf("Category") : -1;
    const tagsColumnIndex = hasTagsColumn ? headers.indexOf("Tags") : -1;

    let startIdx = 3;
    if (hasCategoryColumn) startIdx = Math.max(startIdx, categoryColumnIndex + 1);
    if (hasTagsColumn) startIdx = Math.max(startIdx, tagsColumnIndex + 1);
    if (hasReminderColumn) startIdx = Math.max(startIdx, reminderColumnIndex + 1);

    const dateColumns = headers.slice(startIdx);
    const habitsMap = new Map<string, Habit>();
    const remindersMap: Record<string, string> = {};

    const parseTagsField = (value: string): string[] => {
      return value
        .split(/[;,]+/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = parseLine(lines[i], delimiter);
      if (values.length < 3) continue;

      let habitId = values[0];
      if (habitId.includes('E') || habitId.includes('e')) {
        const numValue = parseFloat(habitId);
        habitId = Math.floor(numValue).toString();
      }

      const habitName = values[1];
      const color = values[2] || getRandomColor();
      const category = categoryColumnIndex >= 0 ? values[categoryColumnIndex] || undefined : undefined;
      const tags = tagsColumnIndex >= 0 ? parseTagsField(values[tagsColumnIndex] || "") : undefined;

      if (hasReminderColumn && reminderColumnIndex >= 0 && values[reminderColumnIndex] && values[reminderColumnIndex].trim()) {
        const reminderTime = values[reminderColumnIndex].trim();
        if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
          remindersMap[habitId] = reminderTime;
        }
      }

      let habit = habitsMap.get(habitId);
      if (!habit) {
        habit = {
          id: habitId,
          name: habitName,
          color,
          category: category || undefined,
          tags: tags && tags.length > 0 ? tags : undefined,
          completions: {},
        };
        habitsMap.set(habitId, habit);
      }

      const dataStartIdx = startIdx;
      for (let j = 0; j < dateColumns.length && j + dataStartIdx < values.length; j++) {
        const dateStr = dateColumns[j];
        const value = values[j + dataStartIdx];

        if (dateStr && (value === "1" || value === "true" || value === "TRUE" || value === "1.0")) {
          let normalizedDate = dateStr;
          if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            const [month, day, year] = dateStr.split('/');
            normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{2}/)) {
            const [month, day, year] = dateStr.split('/');
            normalizedDate = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          habit.completions[normalizedDate] = true;
        }
      }
    }

    const importedHabits = Array.from(habitsMap.values());
    if (importedHabits.length === 0) {
      throw new Error("No valid habits found in CSV");
    }

    return { habits: importedHabits, reminders: remindersMap };
  };

  const handleImportCSV = async () => {
    if (!csvText.trim()) {
      setError("Please paste CSV data or upload a CSV file");
      return;
    }

    try {
      const { habits: importedHabits, reminders: importedReminders } = csvToHabits(csvText);
      await onImport(importedHabits, importedReminders);
      setSuccess(`Successfully imported ${importedHabits.length} habits with ${Object.keys(importedReminders).length} reminders!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV");
    }
  };

  // Rest of your component remains the same...
  const handleJSONFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="modal import-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Import / Export Data</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ie-tabs">
          <button className={`ie-tab ${activeTab === "export" ? "active" : ""}`} onClick={() => { setActiveTab("export"); setError(""); setSuccess(""); }}>
            <Download size={14} /> Export
          </button>
          <button className={`ie-tab ${activeTab === "import" ? "active" : ""}`} onClick={() => { setActiveTab("import"); setError(""); setSuccess(""); }}>
            <Upload size={14} /> Import
          </button>
        </div>

        {activeTab === "export" ? (
          <div className="ie-export-content">
            <p className="ie-info">Export your habits and completion history in either JSON or CSV format.</p>
            <div className="ie-format-section">
              <h4>JSON Format</h4>
              <div className="ie-format-card">
                <FileJson size={20} />
                <div className="ie-format-info">
                  <strong>Complete data export</strong>
                  <span>Includes all habit data and completion history in JSON format</span>
                </div>
                <button className="ie-export-json-btn" onClick={onExportJSON}><Download size={14} /> Export JSON</button>
              </div>
            </div>
            <div className="ie-format-section">
              <h4>CSV Format</h4>
              <div className="ie-format-card">
                <Table size={20} />
                <div className="ie-format-info">
                  <strong>Spreadsheet compatible</strong>
                  <span>Open with Excel, Google Sheets, or any spreadsheet app</span>
                </div>
                <button className="ie-export-csv-btn" onClick={handleExportCSV}><Download size={14} /> Export CSV</button>
              </div>
            </div>
            <div className="export-preview">
              <FileText size={16} />
              <span>{habits.length} habit{habits.length !== 1 ? "s" : ""} with {Object.keys(reminders).length} reminder{Object.keys(reminders).length !== 1 ? "s" : ""} will be exported</span>
            </div>
          </div>
        ) : (
          <div className="ie-import-content">
            <p className="ie-info">Import data from JSON or CSV format. This will replace all your current habits.</p>
            <div className="ie-format-selector">
              <button className={`ie-format-btn ${importType === "json" ? "active" : ""}`} onClick={() => { setImportType("json"); setError(""); setCsvText(""); }}>
                <FileJson size={14} /> JSON
              </button>
              <button className={`ie-format-btn ${importType === "csv" ? "active" : ""}`} onClick={() => { setImportType("csv"); setError(""); }}>
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
                  <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleJSONFileUpload} />
                  <button className="ie-upload-btn" onClick={triggerJSONFileInput}><Upload size={14} /> Choose File</button>
                </div>
              </div>
            ) : (
              <div className="ie-csv-import">
                <textarea className="ie-csv-textarea" placeholder="Paste CSV data here..." value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={6} />
                <div className="ie-csv-actions">
                  <label className="ie-upload-label">
                    <Upload size={14} /> Upload CSV File
                    <input type="file" accept=".csv,.tsv,.txt" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { setCsvText(event.target?.result as string); }; reader.readAsText(file); } }} style={{ display: "none" }} />
                  </label>
                  <button className="ie-import-btn" onClick={handleImportCSV}><Upload size={16} /> Import CSV</button>
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