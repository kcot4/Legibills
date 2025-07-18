import { useSearchParams } from 'react-router-dom';
import CongressFilter from '../filters/CongressFilter';
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFiltersProps {
  filterByTrackedLegislators: boolean;
  setFilterByTrackedLegislators: (value: boolean) => void;
}

export default function SearchFilters({ filterByTrackedLegislators, setFilterByTrackedLegislators }: SearchFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // State for collapsible filters

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search bills..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-700"
          value={searchParams.get('q') || ''}
          onChange={(e) => handleFilterChange('q', e.target.value)}
        />

        {/* Toggle for advanced filters on mobile */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="md:hidden px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          {showAdvancedFilters ? <X size={16} className="mr-2" /> : <Filter size={16} className="mr-2" />}
          Filters
        </button>

        {/* Filters always visible on larger screens, collapsible on mobile */}
        <AnimatePresence>
          {(showAdvancedFilters || window.innerWidth >= 768) && ( // 768px is Tailwind's md breakpoint
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-wrap gap-4 md:flex md:flex-wrap md:gap-4"
            >
              <CongressFilter
                selectedCongress={searchParams.get('congress')}
                onCongressChange={(value) => handleFilterChange('congress', value)}
              />

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-700"
                value={searchParams.get('category') || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="" className="dark:bg-gray-700 dark:text-white">All Categories</option>
                <option value="recent" className="dark:bg-gray-700 dark:text-white">Recent</option>
                <option value="trending" className="dark:bg-gray-700 dark:text-white">Trending</option>
                <option value="upcoming" className="dark:bg-gray-700 dark:text-white">Upcoming</option>
                <option value="enacted" className="dark:bg-gray-700 dark:text-white">Enacted</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-700"
                value={searchParams.get('status') || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="" className="dark:bg-gray-700 dark:text-white">All Statuses</option>
                <option value="introduced" className="dark:bg-gray-700 dark:text-white">Introduced</option>
                <option value="passed_house" className="dark:bg-gray-700 dark:text-white">Passed House</option>
                <option value="passed_senate" className="dark:bg-gray-700 dark:text-white">Passed Senate</option>
                <option value="enacted" className="dark:bg-gray-700 dark:text-white">Enacted</option>
                <option value="vetoed" className="dark:bg-gray-700 dark:text-white">Vetoed</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-700"
                value={searchParams.get('chamber') || ''}
                onChange={(e) => handleFilterChange('chamber', e.target.value)}
              >
                <option value="" className="dark:bg-gray-700 dark:text-white">All Chambers</option>
                <option value="house" className="dark:bg-gray-700 dark:text-white">House</option>
                <option value="senate" className="dark:bg-gray-700 dark:text-white">Senate</option>
              </select>

              {/* Checkbox for filtering by tracked legislators */}
              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={filterByTrackedLegislators}
                  onChange={(e) => setFilterByTrackedLegislators(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-200">Only Tracked Legislators</span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}