import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getDisplayDate, formatDateISO } from '../utils/calculations';

export const DateSelector: React.FC = () => {
  const { currentDate, setCurrentDate } = useStore();

  const handlePrevDay = () => {
    const date = new Date(currentDate + 'T12:00:00');
    date.setDate(date.getDate() - 1);
    setCurrentDate(formatDateISO(date));
  };

  const handleNextDay = () => {
    const date = new Date(currentDate + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    setCurrentDate(formatDateISO(date));
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
      <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
        <ChevronLeft size={24} />
      </button>
      
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Data Ativa</span>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-emerald-500" />
          <span className="text-lg font-bold text-gray-800">{getDisplayDate(currentDate)}</span>
        </div>
      </div>

      <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
        <ChevronRight size={24} />
      </button>
    </div>
  );
};
