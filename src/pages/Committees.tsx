import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, BarChart2, Users, Building, Calendar } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import StatusBadge from '../components/bills/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Committees: React.FC = () => {
  const { bills, loading: billsLoading } = useBillContext();
  const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);
  const [selectedChamber, setSelectedChamber] = useState<'all' | 'house' | 'senate' | 'joint'>('all');

  const committeeStats = useMemo(() => {
    const acc = new Map();
    bills.forEach(bill => {
      bill.committees?.forEach(activity => {
        const key = activity.committee.name;
        const existing = acc.get(key) || {
          name: activity.committee.name,
          chamber: activity.committee.chamber,
          systemCode: activity.committee.systemCode,
          url: activity.committee.url,
          billCount: 0,
          recentBills: [],
          activities: new Map(),
          latestActivity: null
        };

        existing.billCount++;
        existing.recentBills = [...existing.recentBills, bill]
          .sort((a, b) => new Date(b.lastActionDate).getTime() - new Date(a.lastActionDate).getTime())
          .slice(0, 5);
        
        existing.activities.set(
          activity.activityType, 
          (existing.activities.get(activity.activityType) || 0) + 1
        );

        if (!existing.latestActivity || new Date(activity.date) > new Date(existing.latestActivity)) {
          existing.latestActivity = activity.date;
        }

        acc.set(key, existing);
      });
    });
    return acc;
  }, [bills]);

  const sortedCommittees = useMemo(() => {
    return Array.from(committeeStats.entries())
      .map(([name, stats]) => ({
        name,
        ...stats,
        activityBreakdown: Array.from(stats.activities.entries())
      }))
      .filter(committee => selectedChamber === 'all' || committee.chamber === selectedChamber)
      .sort((a, b) => b.billCount - a.billCount);
  }, [committeeStats, selectedChamber]);

  const toggleExpand = (committeeName: string) => {
    setExpandedCommittee(expandedCommittee === committeeName ? null : committeeName);
  };

  const formatActivityType = (activityType: string) => {
    return activityType.charAt(0).toUpperCase() + activityType.slice(1).replace('_', ' ');
  };

  const getChamberColor = (chamber: string) => {
    switch (chamber) {
      case 'house':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'senate':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'joint':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getChamberIcon = (chamber: string) => {
    switch (chamber) {
      case 'house':
        return '🏛️';
      case 'senate':
        return '🏛️';
      case 'joint':
        return '🤝';
      default:
        return '📋';
    }
  };

  if (billsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <LoadingSpinner 
          variant="bills" 
          size="xl" 
          message="Loading Committees"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Congressional Committees</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Browse and analyze committee activity across all congressional bills
        </p>
      </div>

      {/* Chamber Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Filter by Chamber:</label>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All Chambers' },
              { value: 'house', label: 'House' },
              { value: 'senate', label: 'Senate' },
              { value: 'joint', label: 'Joint' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedChamber(option.value as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedChamber === option.value
                    ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                } border`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {sortedCommittees.length} committees
          </div>
        </div>
      </div>

      {/* Committee Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Committees</h3>
            <Users size={16} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{sortedCommittees.length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">House Committees</h3>
            <Building size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {sortedCommittees.filter(c => c.chamber === 'house').length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Senate Committees</h3>
            <Building size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {sortedCommittees.filter(c => c.chamber === 'senate').length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Joint Committees</h3>
            <Building size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {sortedCommittees.filter(c => c.chamber === 'joint').length}
          </div>
        </div>
      </div>

      {/* Committees List */}
      <div className="space-y-4">
        {sortedCommittees.length > 0 ? (
          sortedCommittees.map((committee) => {
            return (
              <motion.div
                key={committee.name}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
              >
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
                  onClick={() => toggleExpand(committee.name)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getChamberIcon(committee.chamber)}</span>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400">
                          {committee.name}
                        </h2>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChamberColor(committee.chamber)}`}>
                            {committee.chamber.charAt(0).toUpperCase() + committee.chamber.slice(1)}
                          </span>
                          {committee.systemCode && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {committee.systemCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {committee.billCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">bills</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp size={16} className="text-gray-400" />
                        {expandedCommittee === committee.name ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <BarChart2 size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {committee.activityBreakdown.length} activity types
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Latest: {committee.latestActivity ? 
                          new Date(committee.latestActivity).toLocaleDateString() : 
                          'No activity'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {committee.recentBills.length} recent bills
                      </span>
                    </div>
                    {committee.url && (
                      <div className="flex items-center space-x-2">
                        <a
                          href={committee.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Committee →
                        </a>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedCommittee === committee.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div>
                          <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Activity Breakdown */}
                              <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3 dark:text-white">Activity Breakdown</h3>
                                <div className="space-y-2">
                                  {committee.activityBreakdown
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([activityType, count]) => (
                                    <div key={activityType} className="flex justify-between items-center">
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {formatActivityType(activityType)}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recent Bills */}
                              <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3 dark:text-white">Recent Bills</h3>
                                <div className="space-y-3">
                                  {committee.recentBills.slice(0, 3).map(bill => (
                                    <Link
                                      key={bill.id}
                                      to={`/bill/${bill.id}`}
                                      className="block hover:bg-gray-50 rounded-md p-2 -mx-2 dark:hover:bg-gray-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <StatusBadge status={bill.status} />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {bill.number}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
                                        {bill.title}
                                      </p>
                                    </div>
                                  </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 text-center">
                            <Link
                              to={`/committee/${encodeURIComponent(committee.name.toLowerCase())}`}
                              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View all bills in this committee
                              <ChevronDown size={16} className="ml-1 transform rotate-270" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 dark:text-gray-400">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No committees found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {selectedChamber !== 'all' 
                ? `No committees found for the ${selectedChamber} chamber.`
                : 'No committee data available.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Committees;
