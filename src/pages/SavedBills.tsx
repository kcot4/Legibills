import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, Tag, Filter, Share2, Trash2 } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import BillCard from '../components/bills/BillCard';

const SavedBills: React.FC = () => {
  const { bills, userPreferences } = useBillContext();
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'title'>('date');

  const savedBills = bills.filter(bill => userPreferences.trackedBills.includes(bill.id));

  const handleBillSelect = (billId: string) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const handleBulkDelete = () => {
    // Implementation for bulk delete
  };

  const handleBulkShare = () => {
    // Implementation for bulk share
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Saved Bills</h1>
        <p className="text-gray-600">
          Manage and organize your tracked legislation
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side - Bulk actions */}
          <div className="flex items-center space-x-4">
            <button
              disabled={selectedBills.length === 0}
              onClick={handleBulkDelete}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </button>
            <button
              disabled={selectedBills.length === 0}
              onClick={handleBulkShare}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </button>
          </div>

          {/* Right side - Organization */}
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="title">Sort by Title</option>
            </select>
            
            <button className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
              <Filter size={16} className="mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Folders and Tags */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="font-medium text-gray-900 mb-3">Folders</h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentFolder(null)}
                  className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                    currentFolder === null ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Folder size={16} className="mr-2" />
                  All Bills
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentFolder('important')}
                  className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                    currentFolder === 'important' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Folder size={16} className="mr-2" />
                  Important
                </button>
              </li>
            </ul>

            <h2 className="font-medium text-gray-900 mt-6 mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200">
                <Tag size={12} className="mr-1" />
                Priority
              </button>
              <button className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200">
                <Tag size={12} className="mr-1" />
                Follow-up
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3">
          {savedBills.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved bills</h3>
              <p className="text-gray-600 mb-4">
                Start tracking bills to see them here.
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                Browse Bills
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedBills.map(bill => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <BillCard bill={bill} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedBills