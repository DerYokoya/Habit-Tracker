// src/components/ImportExportModal.tsx
import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, X, FileJson, Table } from 'lucide-react';
import { Habit } from '../types';

interface ImportExportModalProps {
  habits: Habit[];
  onClose: () => void;
  onImport: (habits: Habit[]) => Promise<void>;
  onExportJSON: () => void;
  onImportJSON: (file: File) => Promise<void>;
}

type TabType = 'export' | 'import';

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ 
  habits, 
  onClose, 
  onImport,
  onExportJSON,
  onImportJSON 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importType, setImportType] = useState<'json' | 'csv'>('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert habits to CSV
  const habitsToCSV = (habits: Habit[]): string => {
    // Collect all dates across all habits
    const allDates = new Set<string>();
    habits.forEach(habit => {
      Object.keys(habit.completions).forEach(date => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Create header row
    const headers = ['Habit ID', 'Habit Name', 'Color', ...sortedDates];
    
    // Create data rows
    const rows = habits.map(habit => {
      const row: string[] = [
        habit.id,
        `"${habit.name.replace(/"/g, '""')}"`, // Escape quotes
        habit.color,
      ];
      
      sortedDates.forEach(date => {
        const completed = habit.completions[date] || false;
        row.push(completed ? '1' : '0');
      });
      
      return row.join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  };

  // Parse CSV to habits
  const csvToHabits = (csv: string): Habit[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }
    
    // Parse header
    const headers = parseCSVLine(lines[0]);
    const dateColumns = headers.slice(3); // After ID, Name, Color
    
    const habits: Habit[] = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;
      
      const habit: Habit = {
        id: values[0] || Date.now().toString() + i,
        name: values[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
        color: values[2] || getRandomColor(),
        completions: {},
      };
      
      // Parse completion data
      for (let j = 0; j < dateColumns.length && j + 3 < values.length; j++) {
        const date = dateColumns[j];
        const value = values[j + 3];
        if (date && (value === '1' || value === 'true' || value === 'TRUE')) {
          habit.completions[date] = true;
        }
      }
      
      habits.push(habit);
    }
    
    if (habits.length === 0) {
      throw new Error('No valid habits found in CSV');
    }
    
    return habits;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let current = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const getRandomColor = (): string => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleExportCSV = () => {
    const csv = habitsToCSV(habits);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccess('CSV export complete!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleImportCSV = async () => {
    try {
      setError('');
      const importedHabits = csvToHabits(csvText);
      
      if (window.confirm(`Import ${importedHabits.length} habits? This will replace all current habits.`)) {
        await onImport(importedHabits);
        setSuccess('CSV import successful!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  };

  const handleJSONFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await onImportJSON(file);
      setSuccess('JSON import successful!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import JSON');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="ie-tabs">
          <button
            className={`ie-tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('export');
              setError('');
              setSuccess('');
            }}
          >
            <Download size={14} /> Export
          </button>
          <button
            className={`ie-tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('import');
              setError('');
              setSuccess('');
            }}
          >
            <Upload size={14} /> Import
          </button>
        </div>
        
        {activeTab === 'export' ? (
          <div className="ie-export-content">
            <p className="ie-info">
              Export your habits and completion history in either JSON or CSV format.
            </p>
            
            <div className="ie-format-section">
              <h4>JSON Format</h4>
              <div className="ie-format-card">
                <FileJson size={20} />
                <div className="ie-format-info">
                  <strong>Complete data export</strong>
                  <span>Includes all habit data and completion history in JSON format</span>
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
                  <span>Open with Excel, Google Sheets, or any spreadsheet app</span>
                </div>
                <button className="ie-export-csv-btn" onClick={handleExportCSV}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
            
            <div className="export-preview">
              <FileText size={16} />
              <span>{habits.length} habit{habits.length !== 1 ? 's' : ''} will be exported</span>
            </div>
          </div>
        ) : (
          <div className="ie-import-content">
            <p className="ie-info">
              Import data from JSON or CSV format. This will replace all your current habits.
            </p>
            
            {/* Format selector */}
            <div className="ie-format-selector">
              <button
                className={`ie-format-btn ${importType === 'json' ? 'active' : ''}`}
                onClick={() => {
                  setImportType('json');
                  setError('');
                  setCsvText('');
                }}
              >
                <FileJson size={14} /> JSON
              </button>
              <button
                className={`ie-format-btn ${importType === 'csv' ? 'active' : ''}`}
                onClick={() => {
                  setImportType('csv');
                  setError('');
                }}
              >
                <Table size={14} /> CSV
              </button>
            </div>
            
            {importType === 'json' ? (
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
                    style={{ display: 'none' }}
                    onChange={handleJSONFileUpload}
                  />
                  <button className="ie-upload-btn" onClick={triggerJSONFileInput}>
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
                      style={{ display: 'none' }}
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