import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, Users } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import BillCard from '../components/bills/BillCard';

const Topic: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { bills, filterBillsByTopic } = useBillContext();
  
  const topicBills = filterBillsByTopic(topicId as any);
  const recentBills = topicBills.slice(0, 3);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{topicId}</h1>
        <p className="text-gray-600">
          Track and analyze legislation related to {topicId?.toLowerCase()}
        </p>
      </div>

      {/* Topic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Active Bills</h2>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {topicBills.length}
          </div>
          <p className="text-sm text-gray-600">
            Bills currently in Congress
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Key Sponsors</h2>
            <Users size={20} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            {Array.from(new Set(topicBills.flatMap(bill => bill.sponsors))).slice(0, 3).map(sponsor => (
              <div key={sponsor.name} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {sponsor.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{sponsor.name}</p>
                  <p className="text-xs text-gray-500">{sponsor.party}-{sponsor.state}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Topic Alerts</h2>
            <Bell size={20} className="text-gray-400" />
          </div>
          <button className="w-full bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
            Subscribe to Updates
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentBills.map(bill => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <BillCard bill={bill} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Related Topics */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Topics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Healthcare', 'Economy', 'Education', 'Technology'].map(topic => (
            <div
              key={topic}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-primary-500 cursor-pointer transition-colors"
            >
              <h3 className="font-medium text-gray-900">{topic}</h3>
              <p className="text-sm text-gray-500">12 active bills</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Topic