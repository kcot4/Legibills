import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Eye, Lock, Trash2 } from 'lucide-react';
import { useBillContext } from '../context/BillContext';

const Settings: React.FC = () => {
  const { userPreferences, setUserPreferences } = useBillContext();
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleEmailNotificationsToggle = () => {
    if (!userPreferences.emailNotifications) {
      setShowEmailInput(true);
    } else {
      setUserPreferences({ emailNotifications: false });
    }
  };

  const handleEmailSave = () => {
    if (email && email.includes('@')) {
      setUserPreferences({ emailNotifications: true });
      setShowEmailInput(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your preferences? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your preferences and account settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell size={20} className="mr-2" />
              Notification Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive updates about tracked bills</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userPreferences.emailNotifications}
                  onChange={handleEmailNotificationsToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {showEmailInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-gray-50 p-4 rounded-md"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your email address
                </label>
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  <button
                    onClick={handleEmailSave}
                    className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Weekly Digest</h3>
                <p className="text-sm text-gray-500">Get a summary of legislative updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lock size={20} className="mr-2" />
              Privacy Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Usage Analytics</h3>
                <p className="text-sm text-gray-500">Help improve the app with anonymous usage data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Trash2 size={20} className="mr-2" />
              Data Management
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Clear All Data</h3>
                <p className="text-sm text-gray-500">Remove all saved preferences and tracked bills</p>
              </div>
              <button
                onClick={handleClearData}
                className="px-4 py-2 text-sm font-medium text-white bg-error-600 rounded-md hover:bg-error-700"
              >
                Clear Data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;