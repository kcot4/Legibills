import React from 'react';
import { CheckCircle, Clock, FileText, Gavel, Users, Building } from 'lucide-react';
import { LegislativeStatus, BILL_STAGES, BillStageGroup } from '../../types/types';

interface StageFilterProps {
  selectedStages: LegislativeStatus[];
  onStageChange: (stages: LegislativeStatus[]) => void;
  billCounts?: Record<LegislativeStatus, number>;
}

const StageFilter: React.FC<StageFilterProps> = ({
  selectedStages,
  onStageChange,
  billCounts = {}
}) => {
  const getStageIcon = (status: LegislativeStatus) => {
    switch (status) {
      case 'introduced':
        return <FileText size={16} className="text-gray-500" />;
      case 'referred_to_committee':
        return <Users size={16} className="text-blue-500" />;
      case 'reported_by_committee':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'passed_house':
        return <Building size={16} className="text-primary-500" />;
      case 'passed_senate':
        return <Building size={16} className="text-primary-600" />;
      case 'to_president':
        return <Gavel size={16} className="text-accent-500" />;
      case 'signed':
        return <CheckCircle size={16} className="text-success-500" />;
      case 'enacted':
        return <CheckCircle size={16} className="text-success-600" />;
      case 'vetoed':
        return <Clock size={16} className="text-error-500" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getStageLabel = (status: LegislativeStatus): string => {
    switch (status) {
      case 'introduced':
        return 'Introduced';
      case 'referred_to_committee':
        return 'In Committee';
      case 'reported_by_committee':
        return 'Reported';
      case 'passed_house':
        return 'Passed House';
      case 'passed_senate':
        return 'Passed Senate';
      case 'to_president':
        return 'To President';
      case 'signed':
        return 'Signed';
      case 'enacted':
        return 'Enacted';
      case 'vetoed':
        return 'Vetoed';
      default:
        return status;
    }
  };

  const handleStageToggle = (stage: LegislativeStatus) => {
    const newSelection = selectedStages.includes(stage)
      ? selectedStages.filter(s => s !== stage)
      : [...selectedStages, stage];
    
    onStageChange(newSelection);
  };

  const handleStageGroupToggle = (group: BillStageGroup) => {
    const groupStages = BILL_STAGES[group];
    const allSelected = groupStages.every(stage => selectedStages.includes(stage));
    
    if (allSelected) {
      // Remove all stages in this group
      onStageChange(selectedStages.filter(stage => !groupStages.includes(stage)));
    } else {
      // Add all stages in this group
      const newStages = [...new Set([...selectedStages, ...groupStages])];
      onStageChange(newStages);
    }
  };

  const clearSelection = () => {
    onStageChange([]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
        <CheckCircle size={16} className="inline mr-1" />
        Legislative Stage
      </label>
      
      <div className="bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700">
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedStages.length === 0 
                ? 'All Stages' 
                : `${selectedStages.length} Selected`
              }
            </span>
            {selectedStages.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stage Groups */}
        <div className="max-h-80 overflow-y-auto">
          {Object.entries(BILL_STAGES).map(([groupName, stages]) => {
            const groupSelected = stages.filter(stage => selectedStages.includes(stage)).length;
            const allGroupSelected = groupSelected === stages.length;
            const someGroupSelected = groupSelected > 0 && groupSelected < stages.length;

            return (
              <div key={groupName} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                {/* Group Header */}
                <div className="px-3 py-2 bg-gray-25 border-b border-gray-100 dark:bg-gray-700 dark:border-gray-700">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someGroupSelected;
                      }}
                      onChange={() => handleStageGroupToggle(groupName as BillStageGroup)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                    />
                    <span className="ml-2 text-xs font-semibold text-gray-600 uppercase tracking-wide dark:text-gray-300">
                      {groupName}
                    </span>
                    {groupSelected > 0 && (
                      <span className="ml-auto text-xs text-primary-600">
                        {groupSelected}/{stages.length}
                      </span>
                    )}
                  </label>
                </div>
                
                {/* Individual Stages */}
                <div className="py-1">
                  {stages.map((stage) => (
                    <label
                      key={stage}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage)}
                        onChange={() => handleStageToggle(stage)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                      />
                      <span className="ml-2 mr-2">
                        {getStageIcon(stage)}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 dark:text-gray-200">
                        {getStageLabel(stage)}
                      </span>
                      {billCounts[stage] && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-400">
                          {billCounts[stage]}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageFilter;