import { useState, useEffect, useCallback } from 'react';
import { Habit } from '../types';

const DEFAULT_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    color: '#6366f1',
    completions: {},
  },
  {
    id: '2',
    name: 'Drink Water',
    color: '#10b981',
    completions: {},
  },
  {
    id: '3',
    name: 'Read a Book',
    color: '#f59e0b',
    completions: {},
  },
];

export const useChromeStorage = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['habits']);
        if (result.habits) {
          setHabits(result.habits);
        } else {
          setHabits(DEFAULT_HABITS);
          await chrome.storage.local.set({ habits: DEFAULT_HABITS });
        }
      } else {
        // Fallback to localStorage for development
        const saved = localStorage.getItem('habit-tracker');
        if (saved) {
          setHabits(JSON.parse(saved));
        } else {
          setHabits(DEFAULT_HABITS);
        }
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits(DEFAULT_HABITS);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveHabits = useCallback(async (newHabits: Habit[]) => {
    setHabits(newHabits);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ habits: newHabits });
      } else {
        localStorage.setItem('habit-tracker', JSON.stringify(newHabits));
      }
    } catch (error) {
      console.error('Failed to save habits:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { habits, saveHabits, loading };
};