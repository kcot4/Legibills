import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Bill } from '../../types/types';
import BillCard from '../bills/BillCard';

interface SearchResultsProps {
  bills: Bill[];
  loading: boolean;
}

interface BillRowProps {
  index: number;
  style: React.CSSProperties;
  data: Bill[];
}

const BillRow: React.FC<BillRowProps> = ({ index, style, data }) => {
  const bill = data[index];
  
  return (
    <div style={style} className="px-2 py-2">
      <BillCard bill={bill} />
    </div>
  );
};

export default function SearchResults({ bills, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Found {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
      </div>
      
      {!bills.length ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No bills found matching your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Search Results</h3>
          </div>
          
          {/* Virtualized List */}
          <List
            height={600}
            itemCount={bills.length}
            itemSize={280}
            itemData={bills}
            width="100%"
          >
            {BillRow}
          </List>
          
          {bills.length > 10 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing all {bills.length} results. Use filters to narrow your search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}