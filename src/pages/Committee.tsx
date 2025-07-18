import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Calendar, Building } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import BillCard from '../components/bills/BillCard';

const Committee: React.FC = () => {
  const { committeeId } = useParams<{ committeeId: string }>();
  const { bills } = useBillContext();
  
  // Decode the committee name from URL
  const committeeName = committeeId ? decodeURIComponent(committeeId) : '';
  
  // Find bills that have activity with this committee
  const committeeBills = bills.filter(bill => 
    bill.committees?.some(activity => 
      activity.committee.name.toLowerCase() === committeeName.toLowerCase()
    )
  );

  // Get committee statistics
  const committeeStats = committeeBills.reduce((acc, bill) => {
    const activities = bill.committees?.filter(activity => 
      activity.committee.name.toLowerCase() === committeeName.toLowerCase()
    ) || [];
    
    activities.forEach(activity => {
      acc.totalActivities++;
      acc.chambers.add(activity.committee.chamber);
      acc.activityTypes.set(
        activity.activityType, 
        (acc.activityTypes.get(activity.activityType) || 0) + 1
      );
    });
    
    return acc;
  }, {
    totalActivities: 0,
    chambers: new Set<string>(),
    activityTypes: new Map<string, number>()
  });

  // Get recent bills (last 3)
  const recentBills = committeeBills
    .sort((a, b) => new Date(b.lastActionDate).getTime() - new Date(a.lastActionDate).getTime())
    .slice(0, 3);

  // Get most common activity type
  const mostCommonActivity = Array.from(committeeStats.activityTypes.entries())
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">{committeeName}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track and analyze bills with activity in this committee
        </p>
      </div>

      {/* Committee Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Bills</h2>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {committeeBills.length}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bills with committee activity
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Total Activities</h2>
            <Calendar size={20} className="text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {committeeStats.totalActivities}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Committee actions tracked
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Chamber</h2>
            <Building size={20} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            {Array.from(committeeStats.chambers).map(chamber => (
              <div key={chamber} className="flex items-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize dark:bg-blue-900 dark:text-blue-300">
                  {chamber}
                </span>
              </div>
            ))}
          </div>
          {mostCommonActivity && (
            <p className="text-sm text-gray-600 mt-2 dark:text-gray-300">
              Most common: {mostCommonActivity[0]} ({mostCommonActivity[1]})
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">Recent Bills</h2>
        {recentBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentBills.map(bill => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <BillCard bill={bill} showCommittees={true} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent bills found for this committee.</p>
          </div>
        )}
      </section>

      {/* All Bills */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">
          All Bills ({committeeBills.length})
        </h2>
        {committeeBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {committeeBills.map(bill => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <BillCard bill={bill} showCommittees={true} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No Bills Found</h3>
            <p className="text-sm">
              This committee doesn't have any tracked bill activity yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Committee;