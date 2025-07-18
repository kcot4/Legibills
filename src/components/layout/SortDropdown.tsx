import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUpDown, Calendar, Clock, Users, Hash, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type SortOption = 
  | 'introduced_date_desc'
  | 'introduced_date_asc'
  | 'last_action_desc'
  | 'last_action_asc'
  | 'title_asc'
  | 'title_desc'
  | 'number_asc'
  | 'number_desc'
  | 'status_asc'
  | 'status_desc'
  | 'sponsors_desc'
  | 'sponsors_asc';

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'introduced_date_desc',
    label: 'Newest First',
    icon: <Calendar size={16} />,
    description: 'Most recently introduced bills'
  },
  {
    value: 'introduced_date_asc',
    label: 'Oldest First',
    icon: <Calendar size={16} />,
    description: 'Earliest introduced bills'
  },
  {
    value: 'last_action_desc',
    label: 'Recent Activity',
    icon: <Clock size={16} />,
    description: 'Bills with latest actions'
  },
  {
    value: 'last_action_asc',
    label: 'Least Activity',
    icon: <Clock size={16} />,
    description: 'Bills with oldest actions'
  },
  {
    value: 'title_asc',
    label: 'Title A-Z',
    icon: <ArrowUpDown size={16} />,
    description: 'Alphabetical by title'
  },
  {
    value: 'title_desc',
    label: 'Title Z-A',
    icon: <ArrowUpDown size={16} />,
    description: 'Reverse alphabetical by title'
  },
  {
    value: 'number_asc',
    label: 'Bill Number (Low)',
    icon: <Hash size={16} />,
    description: 'Lowest bill numbers first'
  },
  {
    value: 'number_desc',
    label: 'Bill Number (High)',
    icon: <Hash size={16} />,
    description: 'Highest bill numbers first'
  },
  {
    value: 'status_asc',
    label: 'Status A-Z',
    icon: <CheckCircle size={16} />,
    description: 'Alphabetical by status'
  },
  {
    value: 'status_desc',
    label: 'Status Z-A',
    icon: <CheckCircle size={16} />,
    description: 'Reverse alphabetical by status'
  },
  {
    value: 'sponsors_desc',
    label: 'Most Sponsors',
    icon: <Users size={16} />,
    description: 'Bills with most sponsors first'
  },
  {
    value: 'sponsors_asc',
    label: 'Fewest Sponsors',
    icon: <Users size={16} />,
    description: 'Bills with fewest sponsors first'
  }
];

const SortDropdown: React.FC<SortDropdownProps> = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = sortOptions.find(option => option.value === currentSort) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortSelect = (sortValue: SortOption) => {
    onSortChange(sortValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-primary-700 dark:focus:border-primary-700"
        aria-label="Sort options"
        aria-expanded={isOpen}
      >
        <span className="text-gray-600 dark:text-gray-300">{currentOption.icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort by:</span>
        <span className="text-sm text-gray-900 dark:text-white">{currentOption.label}</span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sort Bills By</h3>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortSelect(option.value)}
                    className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                      currentSort === option.value ? 'bg-primary-50 border-r-2 border-primary-500 dark:bg-primary-900 dark:border-primary-700' : 'dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className={`mt-0.5 ${currentSort === option.value ? 'text-primary-600' : 'text-gray-400'}`}>
                      {option.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        currentSort === option.value ? 'text-primary-900 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                    {currentSort === option.value && (
                      <CheckCircle size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SortDropdown;