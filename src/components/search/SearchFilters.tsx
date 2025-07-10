import { useSearchParams } from 'react-router-dom';
import CongressFilter from '../filters/CongressFilter';
import React from 'react';

interface SearchFiltersProps {
  filterByTrackedLegislators: boolean;
  setFilterByTrackedLegislators: (value: boolean) => void;
}

export default function SearchFilters({ filterByTrackedLegislators, setFilterByTrackedLegislators }: SearchFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

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
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search bills..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchParams.get('q') || ''}
          onChange={(e) => handleFilterChange('q', e.target.value)}
        />

        <CongressFilter
          selectedCongress={searchParams.get('congress')}
          onCongressChange={(value) => handleFilterChange('congress', value)}
        />

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchParams.get('category') || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="recent">Recent</option>
          <option value="trending">Trending</option>
          <option value="upcoming">Upcoming</option>
          <option value="enacted">Enacted</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchParams.get('status') || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="introduced">Introduced</option>
          <option value="passed_house">Passed House</option>
          <option value="passed_senate">Passed Senate</option>
          <option value="enacted">Enacted</option>
          <option value="vetoed">Vetoed</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchParams.get('chamber') || ''}
          onChange={(e) => handleFilterChange('chamber', e.target.value)}
        >
          <option value="">All Chambers</option>
          <option value="house">House</option>
          <option value="senate">Senate</option>
        </select>

        {/* New checkbox for filtering by tracked legislators */}
        <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={filterByTrackedLegislators}
            onChange={(e) => setFilterByTrackedLegislators(e.target.checked)}
            className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">Only Tracked Legislators</span>
        </label>
      </div>
    </div>
  );
}