import React, { useMemo } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { Committee } from '../../types/types';

interface CommitteeFilterProps {
  selectedCommittees: string[];
  onCommitteeChange: (committees: string[]) => void;
  availableCommittees: Committee[];
  isLoading?: boolean;
}

const CommitteeFilter: React.FC<CommitteeFilterProps> = ({
  selectedCommittees,
  onCommitteeChange,
  availableCommittees,
  isLoading = false
}) => {
  const committeesByType = useMemo(() => {
    const grouped = availableCommittees.reduce((acc, committee) => {
      const type = committee.chamber;
      if (!acc[type]) acc[type] = [];
      acc[type].push(committee);
      return acc;
    }, {} as Record<string, Committee[]>);

    // Sort committees within each group
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [availableCommittees]);

  const handleCommitteeToggle = (committeeName: string) => {
    const newSelection = selectedCommittees.includes(committeeName)
      ? selectedCommittees.filter(name => name !== committeeName)
      : [...selectedCommittees, committeeName];
    
    onCommitteeChange(newSelection);
  };

  const clearSelection = () => {
    onCommitteeChange([]);
  };

  return (
    <div className="relative">
      <label 
        htmlFor="committee-filter" 
        className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200"
      >
        <Users size={16} className="inline mr-1" />
        Committees
      </label>
      
      <div className="bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700">
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedCommittees.length === 0 
                ? 'All Committees' 
                : `${selectedCommittees.length} Selected`
              }
            </span>
            {selectedCommittees.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Committee List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent mx-auto mb-2" />
              Loading committees...
            </div>
          ) : (
            Object.entries(committeesByType).map(([chamber, committees]) => (
              <div key={chamber} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                <div className="px-3 py-2 bg-gray-25 border-b border-gray-100 dark:bg-gray-700 dark:border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide dark:text-gray-300">
                    {chamber === 'house' ? 'House Committees' : 
                     chamber === 'senate' ? 'Senate Committees' : 
                     'Joint Committees'}
                  </h4>
                </div>
                
                <div className="py-1">
                  {committees.map((committee) => (
                    <label
                      key={committee.name}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCommittees.includes(committee.name)}
                        onChange={() => handleCommitteeToggle(committee.name)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 truncate dark:text-gray-200">
                        {committee.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {availableCommittees.length === 0 && !isLoading && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No committees found
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitteeFilter;