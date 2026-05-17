import React from 'react';
import { X, Flame, Trophy, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Habit, HabitStats, DailyCompletion } from '../types';
import { eachDayOfInterval, subDays, format } from 'date-fns';

interface StatsModalProps {
  habit: Habit;
  stats: HabitStats;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ habit, stats, onClose }) => {
  const getLast30DaysData = (): DailyCompletion[] => {
    const today = new Date();
    const last30Days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });

    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isCompleted = habit.completions[dateStr] || false;
      return {
        date: format(date, 'MM/dd'),
        completed: isCompleted ? 1 : 0,
        total: 1,
      };
    });
  };

  const chartData = getLast30DaysData();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stats-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{habit.name} - Statistics</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="stats-details">
          <div className="stat-item">
            <Flame size={24} color="#f59e0b" />
            <div>
              <div className="stat-label">Current Streak</div>
              <div className="stat-number">{stats.currentStreak} days</div>
            </div>
          </div>
          
          <div className="stat-item">
            <Trophy size={24} color="#10b981" />
            <div>
              <div className="stat-label">Longest Streak</div>
              <div className="stat-number">{stats.longestStreak} days</div>
            </div>
          </div>
          
          <div className="stat-item">
            <CheckCircle size={24} color="#6366f1" />
            <div>
              <div className="stat-label">Total Completions</div>
              <div className="stat-number">{stats.totalCompletions}</div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4>Last 30 Days</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="completed" fill={habit.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};