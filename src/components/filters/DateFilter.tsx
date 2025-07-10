import React from 'react';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  selectedDate: string | null;
  onDateChange: (date: string) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selectedDate, onDateChange }) => {
  return (
    <div className="relative">
      <label 
        htmlFor="date-filter" 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Introduced Date
      </label>
      <div className="relative">
        <input
          type="date"
          id="date-filter"
          value={selectedDate || ''}
          onChange={(e) => onDateChange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md transition-colors duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default DateFilter;