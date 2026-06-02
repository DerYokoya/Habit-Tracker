// src/components/CSVExportModal.tsx
import React, { useState } from 'react';
import { Download, Upload, FileText, X } from 'lucide-react';
import { Habit } from '../types';

interface CSVExportModalProps {
  habits: Habit[];
  onClose: () => void;
  onImport: (habits: Habit[]) => Promise<void>;
}

export const CSVExportModal: React.FC<CSVExportModalProps> = ({ habits, onClose, onImport }) => {
  const [importMode, setImportMode] = useState<'export' | 'import'>('export');
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const quoteCSVField = (value: string): string => {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // Convert habits to CSV
  const habitsToCSV = (habits: Habit[]): string => {
    // Collect all dates across all habits
    const allDates = new Set<string>();
    habits.forEach(habit => {
      Object.keys(habit.completions).forEach(date => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Create header row
    const headers = ['Habit ID', 'Habit Name', 'Color', 'Category', 'Tags', ...sortedDates];
    
    // Create data rows
    const rows = habits.map(habit => {
      const tagString = (habit.tags || []).join(';');
      const row: string[] = [
        habit.id,
        quoteCSVField(habit.name),
        habit.color,
        quoteCSVField(habit.category || ''),
        quoteCSVField(tagString),
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
    const categoryIndex = headers.indexOf('Category');
    const tagsIndex = headers.indexOf('Tags');
    const dateColumns = headers.slice(Math.max(3, categoryIndex + 1, tagsIndex + 1));
    
    const parseTagsField = (value: string): string[] => {
      return value
        .split(/[;,]+/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    };

    const habits: Habit[] = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;
      
      const habit: Habit = {
        id: values[0] || Date.now().toString() + i,
        name: values[1],
        color: values[2] || getRandomColor(),
        completions: {},
      };

      if (categoryIndex >= 0) {
        habit.category = values[categoryIndex] || undefined;
      }
      if (tagsIndex >= 0) {
        const tags = parseTagsField(values[tagsIndex] || '');
        habit.tags = tags.length > 0 ? tags : undefined;
      }
      
      // Parse completion data
      for (let j = 0; j < dateColumns.length && j + Math.max(3, categoryIndex + 1, tagsIndex + 1) < values.length; j++) {
        const date = dateColumns[j];
        const value = values[j + Math.max(3, categoryIndex + 1, tagsIndex + 1)];
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

  const handleExport = () => {
    const csv = habitsToCSV(habits);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccess('Export complete!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleImportPreview = () => {
    try {
      setError('');
      const importedHabits = csvToHabits(csvText);
      
      // Show preview in console
      console.log('Imported habits:', importedHabits);
      
      // Confirm with user
      if (window.confirm(`Import ${importedHabits.length} habits? This will replace all current habits.`)) {
        onImport(importedHabits);
        setSuccess('Import successful!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal csv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>CSV Import/Export</h3>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        
        <div className="csv-tabs">
          <button
            className={`csv-tab ${importMode === 'export' ? 'active' : ''}`}
            onClick={() => setImportMode('export')}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className={`csv-tab ${importMode === 'import' ? 'active' : ''}`}
            onClick={() => setImportMode('import')}
          >
            <Upload size={14} /> Import CSV
          </button>
        </div>
        
        {importMode === 'export' ? (
          <div className="csv-export-content">
            <p className="csv-info">
              Export your habits and completion history to a CSV file. 
              This can be opened in Excel, Google Sheets, or any spreadsheet app.
            </p>
            <div className="export-preview">
              <FileText size={16} />
              <span>{habits.length} habits will be exported</span>
            </div>
            <button className="csv-action-btn export-btn" onClick={handleExport}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        ) : (
          <div className="csv-import-content">
            <p className="csv-info">
              Paste CSV data or upload a file. Format should have columns: 
              Habit ID, Habit Name, Color, followed by date columns.
            </p>
            <textarea
              className="csv-textarea"
              placeholder={`Habit ID,Habit Name,Color,2024-01-01,2024-01-02,2024-01-03\n"1","Morning Meditation","#6366f1",1,0,1\n"2","Drink Water","#10b981",1,1,1`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
            />
            <div className="csv-import-actions">
              <label className="csv-upload-label">
                <Upload size={14} /> Upload File
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
              <button className="csv-action-btn import-btn" onClick={handleImportPreview}>
                <Upload size={16} /> Import Data
              </button>
            </div>
          </div>
        )}
        
        {error && <div className="csv-error">{error}</div>}
        {success && <div className="csv-success">{success}</div>}
      </div>
    </div>
  );
};