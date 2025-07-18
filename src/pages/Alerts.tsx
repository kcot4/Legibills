import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, PlusCircle, Edit2, Trash2, Save } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import { Topic } from '../types/types';

const Alerts: React.FC = () => {
  const { userPreferences, setUserPreferences, bills } = useBillContext();
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(userPreferences.topics);
  const [emailNotifications, setEmailNotifications] = useState(userPreferences.emailNotifications);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  // Get unique topics from bills
  const availableTopics = Array.from(new Set(bills.flatMap(bill => bill.topics)))
    .filter(topic => !selectedTopics.includes(topic));

  const handleTopicSelect = (topic: Topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const saveTopics = () => {
    setUserPreferences({ topics: selectedTopics });
    setIsAddingTopic(false);
  };

  const toggleEmailNotifications = () => {
    if (!emailNotifications && !userPreferences.emailNotifications) {
      setShowEmailInput(true);
    } else {
      setEmailNotifications(!emailNotifications);
      setUserPreferences({ emailNotifications: !emailNotifications });
    }
  };

  const saveEmail = () => {
    if (email && email.includes('@')) {
      setEmailNotifications(true);
      setUserPreferences({ emailNotifications: true });
      setShowEmailInput(false);
    }
  };

  const trackedBills = bills.filter(bill => userPreferences.trackedBills.includes(bill.id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">My Alerts</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Stay informed about bills and legislative changes that matter to you.
        </p>
      </div>

      {/* Topic Alerts */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Topic Alerts</h2>
          <button
            onClick={() => setIsAddingTopic(!isAddingTopic)}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
          >
            {isAddingTopic ? (
              <>
                <Save size={16} className="mr-1" />
                Done
              </>
            ) : (
              <>
                <Edit2 size={16} className="mr-1" />
                Edit
              </>
            )}
          </button>
        </div>

        {isAddingTopic ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 dark:bg-gray-800 dark:border-gray-700"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">Select topics to track:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {availableTopics.map(topic => (
                <div key={topic} className="flex items-center">
                  <input
                    id={`topic-${topic}`}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => handleTopicSelect(topic)}
                  />
                  <label htmlFor={`topic-${topic}`} className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                    {topic}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveTopics}
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Save Topics
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 dark:bg-gray-800 dark:border-gray-700">
            {selectedTopics.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                  <Bell size={24} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No topics selected</h3>
                <p className="text-gray-500 mb-4 dark:text-gray-400">
                  Select topics to receive alerts when new bills are introduced.
                </p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Add Topics
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
                  You will receive alerts when new bills are introduced for these topics:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTopics.map(topic => (
                    <span
                      key={topic}
                      className="inline-flex items-center bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-sm font-medium dark:bg-primary-900 dark:text-primary-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bill Alerts */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">Bill Alerts</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          {trackedBills.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <Bell size={24} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No bills tracked</h3>
              <p className="text-gray-500 mb-4 dark:text-gray-400">
                You are not tracking any specific bills. Track bills to receive status updates.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Browse Bills
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
                You will receive alerts when these bills have status changes:
              </p>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {trackedBills.map(bill => (
                  <li key={bill.id} className="py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{bill.number}</p>
                      <p className="text-sm text-gray-500 truncate max-w-lg dark:text-gray-400">{bill.title}</p>
                    </div>
                    <button
                      className="text-gray-400 hover:text-error-500"
                      aria-label="Remove bill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Notification Settings */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 dark:text-white">Notification Settings</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Notifications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive email alerts for bill updates and new matches.
              </p>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailNotifications}
                  onChange={toggleEmailNotifications}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:bg-gray-700 dark:peer-focus:ring-primary-800 dark:after:bg-gray-300 dark:peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
          
          {showEmailInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 p-4 bg-gray-50 rounded-md dark:bg-gray-700"
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Your email address
              </label>
              <div className="flex">
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={saveEmail}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Weekly Digest</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get a weekly summary of updates for your tracked bills and topics.
              </p>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:bg-gray-700 dark:peer-focus:ring-primary-800 dark:after:bg-gray-300 dark:peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Urgency Alerts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get immediate notifications for bills with upcoming votes.
              </p>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:bg-gray-700 dark:peer-focus:ring-primary-800 dark:after:bg-gray-300 dark:peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Alerts;