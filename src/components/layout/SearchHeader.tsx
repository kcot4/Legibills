import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CongressFilter from '../filters/CongressFilter';
import DateFilter from '../filters/DateFilter';
import CommitteeFilter from '../filters/CommitteeFilter';
import StageFilter from '../filters/StageFilter';
import { useBillContext } from '../../context/BillContext';
import { LegislativeStatus } from '../../types/types';

const SearchHeader: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const searchRef = useRef<HTMLDivElement>(null);
  const { bills } = useBillContext();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract available committees from bills
  const availableCommittees = React.useMemo(() => {
    const committeesSet = new Set();
    const committees: any[] = [];
    
    bills.forEach(bill => {
      bill.committees?.forEach(activity => {
        const key = `${activity.committee.name}-${activity.committee.chamber}`;
        if (!committeesSet.has(key)) {
          committeesSet.add(key);
          committees.push(activity.committee);
        }
      });
    });
    
    return committees.sort((a, b) => a.name.localeCompare(b.name));
  }, [bills]);

  // Calculate bill counts by stage
  const billCountsByStage = React.useMemo(() => {
    const counts: Record<LegislativeStatus, number> = {} as any;
    
    bills.forEach(bill => {
      counts[bill.status] = (counts[bill.status] || 0) + 1;
    });
    
    return counts;
  }, [bills]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    navigate(`/search?${params.toString()}`);
    setIsExpanded(false);
    setShowFilters(false);
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams);
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    } else {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    navigate(`/search?${params.toString()}`);
  };

  const getSelectedCommittees = (): string[] => {
    const committees = searchParams.get('committees');
    return committees ? committees.split(',') : [];
  };

  const getSelectedStages = (): LegislativeStatus[] => {
    const stages = searchParams.get('stages');
    return stages ? stages.split(',') as LegislativeStatus[] : [];
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-3xl mx-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Search bills, topics, or keywords..."
            className="w-full bg-gray-100 border border-gray-300 rounded-full py-2 pl-10 pr-12 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors duration-200"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                <X size={14} className="text-gray-500" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 hover:bg-gray-200 rounded-full transition-colors duration-200 ${showFilters ? 'bg-gray-200' : ''}`}
            >
              <Filter size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CongressFilter
                selectedCongress={searchParams.get('congress')}
                onCongressChange={(value) => handleFilterChange('congress', value)}
              />
              
              <DateFilter
                selectedDate={searchParams.get('introduced_date')}
                onDateChange={(value) => handleFilterChange('introduced_date', value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={searchParams.get('status') || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="introduced">Introduced</option>
                  <option value="referred_to_committee">In Committee</option>
                  <option value="reported_by_committee">Reported</option>
                  <option value="passed_house">Passed House</option>
                  <option value="passed_senate">Passed Senate</option>
                  <option value="to_president">To President</option>
                  <option value="enacted">Enacted</option>
                  <option value="vetoed">Vetoed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chamber
                </label>
                <select
                  value={searchParams.get('chamber') || ''}
                  onChange={(e) => handleFilterChange('chamber', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Chambers</option>
                  <option value="house">House</option>
                  <option value="senate">Senate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={searchParams.get('category') || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="recent">Recent</option>
                  <option value="trending">Trending</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="enacted">Enacted</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <CommitteeFilter
                selectedCommittees={getSelectedCommittees()}
                onCommitteeChange={(committees) => handleFilterChange('committees', committees)}
                availableCommittees={availableCommittees}
              />

              <StageFilter
                selectedStages={getSelectedStages()}
                onStageChange={(stages) => handleFilterChange('stages', stages)}
                billCounts={billCountsByStage}
              />
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams();
                  navigate('/search');
                  setShowFilters(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchHeader;