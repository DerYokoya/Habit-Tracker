import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Clock, X } from 'lucide-react';
import { Habit } from '../types';

interface ReminderSettingsProps {
  habit: Habit;
  onClose: () => void;
}

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ habit, onClose }) => {
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminder();
  }, [habit.id]);

  const loadReminder = useCallback(async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ type: 'GET_REMINDERS' });
        const reminders = response;
        const savedTime = reminders[habit.id];
        if (savedTime) {
          setHasReminder(true);
          setReminderTime(savedTime);
        }
      } else {
        // Fallback for development
        const saved = localStorage.getItem(`reminder-${habit.id}`);
        if (saved) {
          setHasReminder(true);
          setReminderTime(saved);
        }
      }
    } catch (error) {
      console.error('Failed to load reminder:', error);
    } finally {
      setLoading(false);
    }
  }, [habit.id]);

  const handleToggleReminder = async () => {
    if (hasReminder) {
      await clearReminder();
    } else {
      await setReminder();
    }
  };

  const setReminder = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({
          type: 'SET_REMINDER',
          habitId: habit.id,
          time: reminderTime
        });
      } else {
        localStorage.setItem(`reminder-${habit.id}`, reminderTime);
      }
      setHasReminder(true);
    } catch (error) {
      console.error('Failed to set reminder:', error);
    }
  };

  const clearReminder = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({
          type: 'CLEAR_REMINDER',
          habitId: habit.id
        });
      } else {
        localStorage.removeItem(`reminder-${habit.id}`);
      }
      setHasReminder(false);
    } catch (error) {
      console.error('Failed to clear reminder:', error);
    }
  };

  if (loading) {
    return <div className="reminder-loading">Loading...</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal reminder-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Bell size={18} />
            <span>Reminder for "{habit.name}"</span>
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="reminder-content">
          <div className="reminder-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={handleToggleReminder}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {hasReminder ? <Bell size={16} /> : <BellOff size={16} />}
              {hasReminder ? 'Reminder active' : 'No reminder set'}
            </span>
          </div>

          {hasReminder && (
            <div className="reminder-time-selector">
              <label>
                <Clock size={16} />
                Remind me daily at:
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                onBlur={setReminder}
                className="time-input"
              />
            </div>
          )}

          <div className="reminder-info">
            <p className="info-text">
              {hasReminder 
                ? `🔔 You'll receive a daily reminder at ${reminderTime} to complete this habit.`
                : '⏰ Set a daily reminder to never miss this habit!'}
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};