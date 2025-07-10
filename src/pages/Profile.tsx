import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Lock, 
  CreditCard, 
  Clock, 
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Eye,
  Download,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  AlertTriangle,
  Bookmark,
  BarChart3,
  FileText,
  Users,
  Building,
  Tag,
  Globe,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Palette,
  Languages,
  HelpCircle,
  ExternalLink,
  Star,
  Heart,
  Share2,
  MessageSquare
} from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import { format } from 'date-fns';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  website: string;
  joinDate: string;
  avatar: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    urgencyAlerts: boolean;
    marketingEmails: boolean;
    dataSharing: boolean;
    publicProfile: boolean;
    showActivity: boolean;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    nextBilling: string;
    features: string[];
  };
  activity: {
    billsTracked: number;
    topicsFollowed: number;
    alertsReceived: number;
    lastLogin: string;
    totalSessions: number;
    averageSessionTime: string;
  };
}

const Profile: React.FC = () => {
  const { bills, userPreferences } = useBillContext();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'subscription' | 'activity' | 'preferences' | 'security'>('account');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mock user profile data (in a real app, this would come from your backend)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'Washington, DC',
    bio: 'Passionate about legislative transparency and civic engagement. Following key bills that impact technology and healthcare policy.',
    website: 'https://johndoe.com',
    joinDate: '2024-01-15',
    avatar: '',
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'America/New_York',
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      urgencyAlerts: true,
      marketingEmails: false,
      dataSharing: false,
      publicProfile: false,
      showActivity: true
    },
    subscription: {
      plan: 'free',
      status: 'active',
      nextBilling: '2024-02-15',
      features: ['Basic bill tracking', 'Email alerts', 'Mobile access']
    },
    activity: {
      billsTracked: userPreferences.trackedBills.length,
      topicsFollowed: userPreferences.topics.length,
      alertsReceived: 47,
      lastLogin: new Date().toISOString(),
      totalSessions: 156,
      averageSessionTime: '12m 34s'
    }
  });

  const [editForm, setEditForm] = useState(userProfile);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    setUserProfile(editForm);
    setIsEditing(false);
    showNotification('success', 'Profile updated successfully');
  };

  const handleCancel = () => {
    setEditForm(userProfile);
    setIsEditing(false);
  };

  const updatePreference = (key: keyof UserProfile['preferences'], value: any) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
    showNotification('success', 'Preference updated');
  };

  const exportData = () => {
    const data = {
      profile: userProfile,
      trackedBills: userPreferences.trackedBills,
      topics: userPreferences.topics,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clear-bill-data.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Data exported successfully');
  };

  const deleteAccount = () => {
    // In a real app, this would call your backend API
    localStorage.clear();
    showNotification('success', 'Account deleted successfully');
    setShowDeleteConfirm(false);
    // Redirect to home or login page
  };

  const trackedBills = bills.filter(bill => userPreferences.trackedBills.includes(bill.id));
  const recentActivity = [
    { type: 'tracked', item: 'HR-1234', date: '2024-01-20', description: 'Started tracking Healthcare Reform Act' },
    { type: 'alert', item: 'S-567', date: '2024-01-19', description: 'Received status update for Climate Action Bill' },
    { type: 'topic', item: 'Healthcare', date: '2024-01-18', description: 'Added Healthcare to followed topics' },
    { type: 'untracked', item: 'HR-890', date: '2024-01-17', description: 'Stopped tracking Infrastructure Bill' }
  ];

  const tabs = [
    { id: 'account', label: 'Account', icon: <User size={20} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={20} /> },
    { id: 'security', label: 'Security', icon: <Shield size={20} /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard size={20} /> },
    { id: 'activity', label: 'Activity', icon: <Clock size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {userProfile.firstName.charAt(0)}{userProfile.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userProfile.firstName} {userProfile.lastName}
                </h1>
                <p className="text-gray-600">{userProfile.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {format(new Date(userProfile.joinDate), 'MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userProfile.subscription.plan === 'free' 
                  ? 'bg-gray-100 text-gray-800'
                  : userProfile.subscription.plan === 'pro'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {userProfile.subscription.plan.charAt(0).toUpperCase() + userProfile.subscription.plan.slice(1)} Plan
              </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bills Tracked</span>
                  <span className="font-medium text-primary-600">{userProfile.activity.billsTracked}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Topics Followed</span>
                  <span className="font-medium text-blue-600">{userProfile.activity.topicsFollowed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Alerts Received</span>
                  <span className="font-medium text-green-600">{userProfile.activity.alertsReceived}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="font-medium text-purple-600">{userProfile.activity.totalSessions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'account' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User size={16} className="inline mr-2" />
                          First Name
                        </label>
                        <input
                          type="text"
                          value={isEditing ? editForm.firstName : userProfile.firstName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User size={16} className="inline mr-2" />
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={isEditing ? editForm.lastName : userProfile.lastName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail size={16} className="inline mr-2" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={isEditing ? editForm.email : userProfile.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone size={16} className="inline mr-2" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={isEditing ? editForm.phone : userProfile.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin size={16} className="inline mr-2" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={isEditing ? editForm.location : userProfile.location}
                          onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Globe size={16} className="inline mr-2" />
                          Website
                        </label>
                        <input
                          type="url"
                          value={isEditing ? editForm.website : userProfile.website}
                          onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText size={16} className="inline mr-2" />
                        Bio
                      </label>
                      <textarea
                        value={isEditing ? editForm.bio : userProfile.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                        placeholder="Tell us about yourself and your interests in legislation..."
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'preferences' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>

                    {/* Theme */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Palette size={20} className="mr-2" />
                        Appearance
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                          <div className="flex space-x-4">
                            {[
                              { value: 'light', label: 'Light', icon: <Sun size={16} /> },
                              { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
                              { value: 'system', label: 'System', icon: <Monitor size={16} /> }
                            ].map(option => (
                              <button
                                key={option.value}
                                onClick={() => updatePreference('theme', option.value)}
                                className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                                  userProfile.preferences.theme === option.value
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {option.icon}
                                <span className="ml-2">{option.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                          <select
                            value={userProfile.preferences.language}
                            onChange={(e) => updatePreference('language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                          <select
                            value={userProfile.preferences.timezone}
                            onChange={(e) => updatePreference('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>

                    <div className="space-y-6">
                      {[
                        {
                          key: 'emailNotifications',
                          title: 'Email Notifications',
                          description: 'Receive updates about tracked bills via email',
                          icon: <Mail size={20} />
                        },
                        {
                          key: 'pushNotifications',
                          title: 'Push Notifications',
                          description: 'Get instant notifications on your device',
                          icon: <Smartphone size={20} />
                        },
                        {
                          key: 'weeklyDigest',
                          title: 'Weekly Digest',
                          description: 'Receive a summary of legislative activity each week',
                          icon: <Calendar size={20} />
                        },
                        {
                          key: 'urgencyAlerts',
                          title: 'Urgency Alerts',
                          description: 'Get notified about time-sensitive legislative actions',
                          icon: <AlertTriangle size={20} />
                        },
                        {
                          key: 'marketingEmails',
                          title: 'Marketing Emails',
                          description: 'Receive updates about new features and improvements',
                          icon: <MessageSquare size={20} />
                        }
                      ].map(setting => (
                        <div key={setting.key} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="text-gray-500 mt-1">{setting.icon}</div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{setting.title}</h3>
                              <p className="text-sm text-gray-600">{setting.description}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={userProfile.preferences[setting.key as keyof typeof userProfile.preferences] as boolean}
                              onChange={(e) => updatePreference(setting.key as any, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'privacy' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>

                    <div className="space-y-6">
                      {[
                        {
                          key: 'publicProfile',
                          title: 'Public Profile',
                          description: 'Allow others to see your profile and activity',
                          icon: <Eye size={20} />
                        },
                        {
                          key: 'showActivity',
                          title: 'Show Activity',
                          description: 'Display your bill tracking activity to other users',
                          icon: <BarChart3 size={20} />
                        },
                        {
                          key: 'dataSharing',
                          title: 'Data Sharing',
                          description: 'Allow anonymized usage data to improve the service',
                          icon: <Share2 size={20} />
                        }
                      ].map(setting => (
                        <div key={setting.key} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="text-gray-500 mt-1">{setting.icon}</div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{setting.title}</h3>
                              <p className="text-sm text-gray-600">{setting.description}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={userProfile.preferences[setting.key as keyof typeof userProfile.preferences] as boolean}
                              onChange={(e) => updatePreference(setting.key as any, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-medium text-yellow-800">Data Export & Deletion</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              You can export your data or delete your account at any time. These actions are irreversible.
                            </p>
                            <div className="flex space-x-3 mt-3">
                              <button
                                onClick={exportData}
                                className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                              >
                                <Download size={16} className="mr-2" />
                                Export Data
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>

                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                              placeholder="Confirm new password"
                            />
                          </div>
                          <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                            Update Password
                          </button>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                          Enable 2FA
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Current Session</p>
                              <p className="text-xs text-gray-500">Chrome on macOS • Washington, DC</p>
                            </div>
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Mobile App</p>
                              <p className="text-xs text-gray-500">iPhone • Last seen 2 hours ago</p>
                            </div>
                            <button className="text-xs text-red-600 hover:text-red-700">Revoke</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'subscription' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Subscription Management</h2>

                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {userProfile.subscription.plan === 'free' ? 'Free Plan' : 
                             userProfile.subscription.plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                          </h3>
                          <p className="text-primary-100">
                            {userProfile.subscription.status === 'active' ? 'Active' : 
                             userProfile.subscription.status === 'cancelled' ? 'Cancelled' : 'Expired'}
                          </p>
                        </div>
                        {userProfile.subscription.plan === 'free' && (
                          <button className="px-4 py-2 bg-white text-primary-600 rounded-md hover:bg-primary-50 transition-colors">
                            Upgrade
                          </button>
                        )}
                      </div>

                      {userProfile.subscription.plan !== 'free' && (
                        <div className="text-sm">
                          <p>Next billing date: {format(new Date(userProfile.subscription.nextBilling), 'MMMM d, yyyy')}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Free</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-4">$0<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Basic bill tracking
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Email alerts
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Mobile access
                          </li>
                        </ul>
                        <button className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                          userProfile.subscription.plan === 'free'
                            ? 'bg-gray-200 text-gray-700 cursor-default'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`} disabled={userProfile.subscription.plan === 'free'}>
                          {userProfile.subscription.plan === 'free' ? 'Current Plan' : 'Downgrade'}
                        </button>
                      </div>

                      <div className="border border-primary-300 rounded-lg p-4 shadow-sm relative">
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                          <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">Popular</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Pro</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-4">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Everything in Free
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Advanced AI analysis
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Unlimited bill tracking
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Custom alerts
                          </li>
                        </ul>
                        <button className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                          userProfile.subscription.plan === 'pro'
                            ? 'bg-gray-200 text-gray-700 cursor-default'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`} disabled={userProfile.subscription.plan === 'pro'}>
                          {userProfile.subscription.plan === 'pro' ? 'Current Plan' : 'Upgrade'}
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Enterprise</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-4">$49.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Everything in Pro
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            API access
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Team collaboration
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2" />
                            Priority support
                          </li>
                        </ul>
                        <button className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                          userProfile.subscription.plan === 'enterprise'
                            ? 'bg-gray-200 text-gray-700 cursor-default'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`} disabled={userProfile.subscription.plan === 'enterprise'}>
                          {userProfile.subscription.plan === 'enterprise' ? 'Current Plan' : 'Upgrade'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        If you have any questions about your subscription or need assistance, our support team is here to help.
                      </p>
                      <button className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium">
                        <HelpCircle size={16} className="mr-2" />
                        Contact Support
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">Activity History</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">Bills Tracked</h3>
                          <Bookmark size={16} className="text-primary-500" />
                        </div>
                        <div className="text-2xl font-bold text-primary-600">{userProfile.activity.billsTracked}</div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">Topics Followed</h3>
                          <Tag size={16} className="text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{userProfile.activity.topicsFollowed}</div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">Alerts Received</h3>
                          <Bell size={16} className="text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{userProfile.activity.alertsReceived}</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="border border-gray-200 rounded-lg">
                      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start">
                              <div className={`mt-1 rounded-full p-1.5 ${
                                activity.type === 'tracked' ? 'bg-green-100 text-green-600' :
                                activity.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                                activity.type === 'topic' ? 'bg-blue-100 text-blue-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {activity.type === 'tracked' ? <Bookmark size={14} /> :
                                 activity.type === 'alert' ? <Bell size={14} /> :
                                 activity.type === 'topic' ? <Tag size={14} /> :
                                 <X size={14} />}
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {format(new Date(activity.date), 'MMMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracked Bills */}
                    <div className="border border-gray-200 rounded-lg">
                      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Tracked Bills</h3>
                        <Link to="/saved" className="text-xs text-primary-600 hover:text-primary-700">
                          View All
                        </Link>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {trackedBills.slice(0, 5).map((bill) => (
                          <Link to={`/bill/${bill.id}`} key={bill.id} className="px-4 py-3 hover:bg-gray-50 transition-colors block">
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{bill.number}</p>
                                <p className="text-xs text-gray-500 mt-1 truncate">{bill.title}</p>
                              </div>
                              <div className="ml-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  bill.status === 'enacted' ? 'bg-green-100 text-green-800' :
                                  bill.status === 'introduced' ? 'bg-gray-100 text-gray-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {bill.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {trackedBills.length === 0 && (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500">You haven't tracked any bills yet.</p>
                            <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
                              Browse bills to track
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Your Account?</h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Yes, Delete My Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;