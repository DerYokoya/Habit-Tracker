import React from 'react';
import { Calendar, List, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

type ViewType = 'daily' | 'weekly' | 'monthly';

interface ViewSwitcherProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  title: string;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ 
  view, 
  onViewChange, 
  title, 
  onNavigate, 
  onToday 
}) => (
  <>
    <div className="view-tabs">
      <button 
        className={`tab ${view === 'daily' ? 'active' : ''}`} 
        onClick={() => onViewChange('daily')}
      >
        <Calendar size={16} /> Daily
      </button>
      <button 
        className={`tab ${view === 'weekly' ? 'active' : ''}`} 
        onClick={() => onViewChange('weekly')}
      >
        <List size={16} /> Weekly
      </button>
      <button 
        className={`tab ${view === 'monthly' ? 'active' : ''}`} 
        onClick={() => onViewChange('monthly')}
      >
        <BarChart3 size={16} /> Monthly
      </button>
    </div>

    <div className="date-nav">
      <button onClick={() => onNavigate('prev')} className="nav-btn">
        <ChevronLeft size={18} />
      </button>
      <h3>{title}</h3>
      <button onClick={() => onNavigate('next')} className="nav-btn">
        <ChevronRight size={18} />
      </button>
      <button onClick={onToday} className="today-btn">Today</button>
    </div>
  </>
);

export default ViewSwitcher;