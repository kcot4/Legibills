import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Bell, Bookmark, BarChart, Settings, X, ChevronRight, Coffee, Shield, Users, Building } from 'lucide-react';
import { useBillContext } from '../../context/BillContext';

interface SidebarProps {
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSidebar }) => {
  const { userPreferences, bills, userRole } = useBillContext(); // Destructure userRole

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Search size={20} />, label: 'Search', path: '/search' },
    { icon: <Bell size={20} />, label: 'My Alerts', path: '/alerts' },
    { icon: <Bookmark size={20} />, label: 'Saved Bills', path: '/saved' },
  ];

  const adminNavItems = [
    { icon: <Users size={20} />, label: 'Track Legislators', path: '/track-legislators' },
    { icon: <BarChart size={20} />, label: 'Analytics', path: '/analytics' },
  ];

  const adminItems = [
    { icon: <Shield size={20} />, label: 'Admin Panel', path: '/admin' },
  ];

  // Get unique topics from bills and sort by frequency
  const topicFrequency = bills.reduce((acc, bill) => {
    if (bill.topics && Array.isArray(bill.topics)) {
      bill.topics.forEach(topic => {
        if (topic) { // Only count non-null topics
          acc.set(topic, (acc.get(topic) || 0) + 1);
        }
      });
    }
    return acc;
  }, new Map<string, number>());

  const sortedTopics = Array.from(topicFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic)
    .filter(Boolean); // Filter out any null/undefined topics

  // Get unique committees from bills and sort by frequency
  const committeeFrequency = bills.reduce((acc, bill) => {
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

  const sortedCommittees = Array.from(committeeFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([committee]) => committee)
    .filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-white border-r dark:bg-gray-800 dark:border-gray-700">
      {/* Mobile close button */}
      <div className="lg:hidden flex justify-end p-4">
        <button 
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-6">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Main
          </h3>
          
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
                onClick={() => toggleSidebar()}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            {userRole === 'admin' && adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
                onClick={() => toggleSidebar()}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {userRole === 'admin' && ( // Conditionally render admin items
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Administration
            </h3>
            
            <div className="space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                  onClick={() => toggleSidebar()}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {userRole === 'admin' && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between dark:text-gray-400">
              <span>Popular Topics</span>
              <button className="text-primary-600 hover:text-primary-800 text-xs font-medium">
                Edit
              </button>
            </h3>
            
            <div className="space-y-1">
              {sortedTopics.length > 0 ? (
                sortedTopics.map((topic) => (
                  <NavLink
                    key={topic}
                    to={`/topic/${encodeURIComponent(topic.toLowerCase())}`}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`
                    }
                    onClick={() => toggleSidebar()}
                  >
                    <span className="w-2 h-2 mr-3 rounded-full bg-primary-400"></span>
                    {topic}
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      {topicFrequency.get(topic)}
                    </span>
                  </NavLink>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No topics available
                </div>
              )}
              
              <NavLink
                to="/topics"
                className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:bg-gray-100 rounded-md dark:hover:bg-gray-700"
                onClick={() => toggleSidebar()}
              >
                <span className="mr-1">See all topics</span>
                <ChevronRight size={16} />
              </NavLink>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between dark:text-gray-400">
            <span>Active Committees</span>
            <button className="text-primary-600 hover:text-primary-800 text-xs font-medium">
              Edit
            </button>
          </h3>
          
          <div className="space-y-1">
            {sortedCommittees.length > 0 ? (
              sortedCommittees.map((committee) => (
                <NavLink
                  key={committee}
                  to={`/committee/${encodeURIComponent(committee.toLowerCase())}`}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                  onClick={() => toggleSidebar()}
                >
                  <Building size={14} className="mr-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{committee}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {committeeFrequency.get(committee)}
                  </span>
                </NavLink>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No committees available
              </div>
            )}
            
            <NavLink
              to="/committees"
              className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:bg-gray-100 rounded-md dark:hover:bg-gray-700"
              onClick={() => toggleSidebar()}
            >
              <span className="mr-1">See all committees</span>
              <ChevronRight size={16} />
            </NavLink>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Tracked Bills
          </h3>
          
          {userPreferences?.trackedBills?.length > 0 ? (
            <div className="space-y-1">
              {bills
                .filter(bill => userPreferences.trackedBills.includes(bill.id))
                .map(bill => (
                  <NavLink
                    key={bill.id}
                    to={`/bill/${bill.id}`}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`
                    }
                    onClick={() => toggleSidebar()}
                  >
                    <span className="w-2 h-2 mr-3 rounded-full bg-primary-400"></span>
                    {bill.number}
                  </NavLink>
                ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Track bills to see updates here
            </div>
          )}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t dark:border-gray-700">
        <NavLink
          to="/settings"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => toggleSidebar()}
        >
          <Settings size={20} className="mr-3" />
          Settings
        </NavLink>
      </div>

      {/* Buy me a coffee */}
      <div className="p-4">
        <motion.a
          href="coff.ee/legibills"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg shadow-sm hover:bg-amber-600 transition-colors"
        >
          <Coffee size={18} className="mr-2" />
          <span className="font-medium">Buy me a coffee</span>
        </motion.a>
      </div>
    </div>
  );
};

export default Sidebar;