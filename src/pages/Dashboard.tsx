import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { useBillContext } from '../context/BillContext';
import BillCategory from '../components/bills/BillCategory';
import BillCard from '../components/bills/BillCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BillLoadingSkeleton from '../components/ui/BillLoadingSkeleton';
import { RefreshCw, Settings, Filter, X, TrendingUp, Tag, ArrowRight, Building, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BillCategory as BillCategoryType, Bill } from '../types/types';

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

const Dashboard: React.FC = () => {
  const { getSortedBills, refreshBills, userPreferences, loading, loadingProgress } = useBillContext();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChamber, setSelectedChamber] = useState<'all' | 'house' | 'senate'>('all');
  const [visibleCategories, setVisibleCategories] = useState<BillCategoryType[]>([
    'trending', 'recent', 'upcoming', 'enacted'
  ]);

  // Get sorted bills and apply chamber filter
  const sortedBills = getSortedBills();
  const filteredBills = sortedBills.filter(bill => 
    selectedChamber === 'all' || bill.chamber === selectedChamber
  );

  // Get tracked bills for My Feed
  const trackedBills = sortedBills.filter(bill => 
    userPreferences.trackedBills.includes(bill.id)
  );

  // Get popular topics with bill counts
  const topicCounts = filteredBills.reduce((acc, bill) => {
    if (bill.topics && Array.isArray(bill.topics)) {
      bill.topics.forEach(topic => {
        if (topic) {
          acc.set(topic, (acc.get(topic) || 0) + 1);
        }
      });
    }
    return acc;
  }, new Map<string, number>());

  const popularTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }));

  // Get popular committees with bill counts
  const committeeCounts = filteredBills.reduce((acc, bill) => {
    if (bill.committees && Array.isArray(bill.committees)) {
      bill.committees.forEach(activity => {
        if (activity.committee?.name) {
          const name = activity.committee.name;
          acc.set(name, (acc.get(name) || 0) + 1);
        }
      });
    }
    return acc;
  }, new Map<string, number>());

  const popularCommittees = Array.from(committeeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([committee, count]) => ({ committee, count }));

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setError(null);

      const { data, error: importError } = await supabase.functions.invoke('import-bills', {
        body: { congress: '119' }
      });

      if (importError) {
        console.error('Error importing bills:', importError);
        setError(`Failed to import bills: ${importError.message || 'Unknown error'}`);
        return;
      }

      if (data?.status === 'error') {
        setError(`Import failed: ${data.message}`);
        return;
      }

      if (data?.status === 'locked') {
        setError('Another import process is currently running. Please try again in a few minutes.');
        return;
      }

      await refreshBills();
      
    } catch (error) {
      console.error('Error importing bills:', error);
      setError(`Failed to import bills: ${error instanceof Error ? error.message : 'Network error occurred'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleCategory = (category: BillCategoryType) => {
    setVisibleCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Show loading animation during initial load
  if (loading && sortedBills.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          variant="bills" 
          size="xl" 
          message="Loading Congressional Bills"
          progress={loadingProgress}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Congressional Bill Tracker</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Stay informed about legislation that matters to you with AI-powered bill explanations.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw 
                  size={16} 
                  className={`mr-2 ${isImporting ? 'animate-spin' : ''}`}
                />
                {isImporting ? 'Importing...' : 'Import Bills'}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="text-sm text-error-600 mt-2">{error}</p>
        )}
      </div>

      {/* Quick Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Filters</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block dark:text-gray-300">
                Chamber
              </label>
              <div className="flex space-x-2">
                {['all', 'house', 'senate'].map((chamber) => (
                  <button
                    key={chamber}
                    onClick={() => setSelectedChamber(chamber as typeof selectedChamber)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedChamber === chamber
                        ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                    } border`}
                  >
                    {chamber.charAt(0).toUpperCase() + chamber.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block dark:text-gray-300">
                Visible Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {(['trending', 'recent', 'upcoming', 'enacted'] as BillCategoryType[]).map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      visibleCategories.includes(category)
                        ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                    } border`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* My Feed */}
      {trackedBills.length > 0 && (
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Feed</h2>
            <Link
              to="/saved"
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              View all tracked bills
            </Link>
          </div>
          {loading ? (
            <BillLoadingSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trackedBills.slice(0, 3).map(bill => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <BillCard bill={bill} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Personalization CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold mb-2">Personalize Your Experience</h2>
            <p className="text-primary-100 max-w-xl">
              Select topics of interest and get notified when related bills are introduced or move through Congress.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/alerts"
              className="bg-white text-primary-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors shadow-sm"
            >
              Set Up Alerts
            </Link>
            <Link
              to="/settings"
              className="flex items-center text-white border border-white/30 px-4 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Settings size={16} className="mr-2" />
              Customize
            </Link>
          </div>
        </div>
      </div>

      {/* Popular Topics and Committees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Popular Topics */}
        {popularTopics.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center dark:text-white">
                <Tag size={20} className="mr-2 text-primary-600" />
                Popular Topics
              </h2>
              <Link
                to="/topics"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
              >
                View all topics
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2 dark:bg-gray-600"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 dark:bg-gray-600"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {popularTopics.slice(0, 4).map(({ topic, count }) => (
                  <Link
                    key={topic}
                    to={`/topic/${encodeURIComponent(topic.toLowerCase())}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-300 transition-all duration-200 group dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors text-sm dark:text-white dark:group-hover:text-primary-300">
                        {topic}
                      </h3>
                      <TrendingUp size={14} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {count} {count === 1 ? 'bill' : 'bills'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Popular Committees */}
        {popularCommittees.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center dark:text-white">
                <Building size={20} className="mr-2 text-blue-600" />
                Active Committees
              </h2>
              <Link
                to="/committees"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
              >
                View all committees
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2 dark:bg-gray-600"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 dark:bg-gray-600"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {popularCommittees.slice(0, 4).map(({ committee, count }) => (
                  <Link
                    key={committee}
                    to={`/committee/${encodeURIComponent(committee.toLowerCase())}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 group dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <Users size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm truncate dark:text-white dark:group-hover:text-blue-300">
                          {committee}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-600 ml-2 flex-shrink-0 dark:text-gray-300">
                        {count} {count === 1 ? 'bill' : 'bills'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Bill Categories - Limited Trending */}
      {loading ? (
        <div className="space-y-8">
          {visibleCategories.map(category => (
            <div key={category} className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse dark:bg-gray-600"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-600"></div>
              </div>
              <BillLoadingSkeleton count={6} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {visibleCategories.includes('trending') && (
            <BillCategory 
              title="Trending Bills" 
              category="trending" 
              bills={filteredBills}
              limit={6} // Reduced from default
            />
          )}
          {visibleCategories.includes('recent') && (
            <BillCategory 
              title="Recently Introduced" 
              category="recent" 
              bills={filteredBills} 
            />
          )}
          {visibleCategories.includes('upcoming') && (
            <BillCategory 
              title="Upcoming Votes" 
              category="upcoming" 
              bills={filteredBills} 
            />
          )}
          {visibleCategories.includes('enacted') && (
            <BillCategory 
              title="Recently Enacted" 
              category="enacted" 
              bills={filteredBills} 
            />
          )}
        </>
      )}

      {/* All Bills Section with Virtualization */}
      <section className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Bills</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {filteredBills.length} bills total
            </span>
            <Link
              to="/search"
              className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
            >
              Advanced Search
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">All Bills (Virtualized)</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing all {filteredBills.length} bills
              </span>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8">
              <LoadingSpinner variant="minimal" size="lg" message="Loading bills..." />
            </div>
          ) : filteredBills.length > 0 ? (
            <List
              height={600}
              itemCount={filteredBills.length}
              itemSize={280}
              itemData={filteredBills}
              width="100%"
            >
              {BillRow}
            </List>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No bills found matching your current filters.</p>
            </div>
          )}
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-700">
            <Link
              to="/search"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Advanced Search & Filters
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;