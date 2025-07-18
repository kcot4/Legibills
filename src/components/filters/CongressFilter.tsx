import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface CongressSession {
  number: number;
  years: string;
}

interface CongressFilterProps {
  selectedCongress: string | null;
  onCongressChange: (congress: string) => void;
  isLoading?: boolean;
}

const CongressFilter: React.FC<CongressFilterProps> = ({
  selectedCongress,
  onCongressChange,
  isLoading = false
}) => {
  const congressSessions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentCongress = Math.floor((currentYear - 1789) / 2) + 1;
    const sessions: CongressSession[] = [];

    // Generate sessions from current to 93rd Congress
    for (let i = currentCongress; i >= 93; i--) {
      const startYear = 1789 + (i - 1) * 2;
      const endYear = startYear + 1;
      sessions.push({
        number: i,
        years: `${startYear}-${endYear}`
      });
    }

    return sessions;
  }, []);

  return (
    <div className="relative">
      <label 
        htmlFor="congress-select" 
        className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200"
      >
        Congressional Session
      </label>
      <div className="relative">
        <select
          id="congress-select"
          value={selectedCongress || ''}
          onChange={(e) => onCongressChange(e.target.value)}
          disabled={isLoading}
          className={`
            block w-full pl-3 pr-10 py-2 text-base border-gray-300 
            focus:outline-none focus:ring-primary-500 focus:border-primary-500 
            sm:text-sm rounded-md appearance-none transition-colors duration-200
            ${isLoading ? 'bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400' : 'bg-white cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white'}
          `}
          aria-label="Select Congressional session"
        >
          <option value="">All Sessions</option>
          {congressSessions.map((session) => (
            <option key={session.number} value={session.number}>
              {session.number}th Congress ({session.years})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-400" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CongressFilter;