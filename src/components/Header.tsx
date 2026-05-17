import React from 'react';
import { Flame, Award } from 'lucide-react';

interface HeaderProps {
  activeToday: number;
  totalHabits: number;
}

const Header: React.FC<HeaderProps> = ({ activeToday, totalHabits }) => (
  <div className="header">
    <div className="header-title">
      <Flame size={24} color="#f59e0b" />
      <h1>Habit Tracker</h1>
    </div>
    <div className="stats-badge">
      <Award size={16} />
      <span>{activeToday}/{totalHabits}</span>
    </div>
  </div>
);

export default Header;