import React from 'react';
import { Flame, Award, Target, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { getChartData } from '../utils/statsUtils';

const StatsModal = ({ habit, stats, completions, onClose }) => {
  if (!habit) return null;

  const habitStats = stats[habit.id] || {};
  const chartData = getChartData(habit.id, completions);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{habit.name} — Statistics</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="stats-details">
          <div className="stat-item">
            <Flame size={20} color="#f59e0b" />
            <div>
              <div className="stat-label">Current Streak</div>
              <div className="stat-number">{habitStats.currentStreak || 0} days</div>
            </div>
          </div>
          <div className="stat-item">
            <Award size={20} color="#10b981" />
            <div>
              <div className="stat-label">Longest Streak</div>
              <div className="stat-number">{habitStats.longestStreak || 0} days</div>
            </div>
          </div>
          <div className="stat-item">
            <Target size={20} color="#6366f1" />
            <div>
              <div className="stat-label">Total Completions</div>
              <div className="stat-number">{habitStats.totalCompletions || 0}</div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4>Last 30 Days</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={[0, 1]}
                tickFormatter={(v) => (v === 1 ? '✓' : '')}
              />
              <Tooltip />
              <Bar dataKey="completed" fill={habit.color || '#6366f1'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
