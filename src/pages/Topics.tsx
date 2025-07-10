import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, BarChart2, Users } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import StatusBadge from '../components/bills/StatusBadge';

const Topics: React.FC = () => {
  const { bills } = useBillContext();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Get all unique topics and their stats
  const topicStats = bills.reduce((acc, bill) => {
    bill.topics?.forEach(topic => {
      if (topic) {
        const existing = acc.get(topic) || {
          count: 0,
          recentBills: [],
          statuses: new Map(),
          sponsors: new Set()
        };

        existing.count++;
        existing.recentBills = [...existing.recentBills, bill]
          .sort((a, b) => new Date(b.introducedDate).getTime() - new Date(a.introducedDate).getTime())
          .slice(0, 5);
        
        existing.statuses.set(bill.status, (existing.statuses.get(bill.status) || 0) + 1);
        bill.sponsors?.forEach(sponsor => existing.sponsors.add(sponsor.name));

        acc.set(topic, existing);
      }
    });
    return acc;
  }, new Map());

  // Convert to array and sort by count
  const sortedTopics = Array.from(topicStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([topic, stats]) => ({
      topic,
      ...stats,
      sponsorCount: stats.sponsors.size,
      statusBreakdown: Array.from(stats.statuses.entries())
    }));

  const toggleExpand = (topic: string) => {
    setExpandedTopic(expandedTopic === topic ? null : topic);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Legislative Topics</h1>
        <p className="text-gray-600">
          Browse and analyze topics covered in congressional legislation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTopics.map(({ topic, count, recentBills, sponsorCount, statusBreakdown }) => (
          <motion.div
            key={topic}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(topic)}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                  {topic}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {count} bills
                  </span>
                  {expandedTopic === topic ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{sponsorCount} sponsors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {statusBreakdown.find(([status]) => status === 'enacted')?.[1] || 0} enacted
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {expandedTopic === topic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Status Breakdown</h3>
                      <div className="space-y-2">
                        {statusBreakdown.map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <StatusBadge status={status} />
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        ))}
                      </div>

                      <h3 className="text-sm font-medium text-gray-900 mt-4 mb-3">Recent Bills</h3>
                      <div className="space-y-3">
                        {recentBills.map(bill => (
                          <Link
                            key={bill.id}
                            to={`/bill/${bill.id}`}
                            className="block hover:bg-gray-50 rounded-md p-2 -mx-2"
                          >
                            <div className="flex items-start">
                              <StatusBadge status={bill.status} />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-gray-900">{bill.number}</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{bill.title}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-4 text-center">
                        <Link
                          to={`/topic/${encodeURIComponent(topic.toLowerCase())}`}
                          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          View all bills
                          <ChevronDown size={16} className="ml-1 transform rotate-270" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Topics;