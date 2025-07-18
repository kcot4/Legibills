import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Edit2, Save, X, User, Mail } from 'lucide-react';
import { format } from 'date-fns';

// Mock user data - replace with actual data from your context or API
const mockUserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  joinDate: '2023-01-15T10:00:00Z',
  subscription: { plan: 'pro', status: 'active', nextBilling: '2025-08-15T10:00:00Z' },
};

const Profile: React.FC = () => {
  const [userProfile, setUserProfile] = useState(mockUserProfile);
  const [editForm, setEditForm] = useState(mockUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = () => {
    setUserProfile(editForm);
    setIsEditing(false);
    setNotification({ message: 'Profile updated successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCancel = () => {
    setEditForm(userProfile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <Check size={20} className="mr-2" />
              ) : (
                <AlertTriangle size={20} className="mr-2" />
              )}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {userProfile.firstName.charAt(0)}{userProfile.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userProfile.firstName} {userProfile.lastName}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">{userProfile.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Member since {format(new Date(userProfile.joinDate), 'MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit2 size={16} className="mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Information</h2>
                {isEditing && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save size={16} className="mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    <User size={16} className="inline mr-2" />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editForm.firstName : userProfile.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    <User size={16} className="inline mr-2" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editForm.lastName : userProfile.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    <Mail size={16} className="inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={isEditing ? editForm.email : userProfile.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;