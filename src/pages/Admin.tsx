import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  ChevronDown,
  ChevronUp,
  Move,
  Tag,
  Users,
  FileText,
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import { Bill, Topic } from '../types/types';
import { supabase } from '../lib/supabase';

interface TopicGroup {
  topic: string;
  bills: Bill[];
  count: number;
}

const Admin: React.FC = () => {
  const { bills, refreshBills } = useBillContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [draggedBill, setDraggedBill] = useState<Bill | null>(null);
  const [dragOverTopic, setDragOverTopic] = useState<string | null>(null);
  const [bulkOperation, setBulkOperation] = useState<'move' | 'remove' | null>(null);
  const [targetTopic, setTargetTopic] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Group bills by topics
  useEffect(() => {
    const topicMap = new Map<string, Bill[]>();
    const untaggedBills: Bill[] = [];

    bills.forEach(bill => {
      if (!bill.topics || bill.topics.length === 0) {
        untaggedBills.push(bill);
      } else {
        bill.topics.forEach(topic => {
          if (!topicMap.has(topic)) {
            topicMap.set(topic, []);
          }
          topicMap.get(topic)!.push(bill);
        });
      }
    });

    const groups: TopicGroup[] = Array.from(topicMap.entries())
      .map(([topic, bills]) => ({
        topic,
        bills,
        count: bills.length
      }))
      .sort((a, b) => b.count - a.count);

    // Add untagged bills as a special group
    if (untaggedBills.length > 0) {
      groups.push({
        topic: 'Untagged',
        bills: untaggedBills,
        count: untaggedBills.length
      });
    }

    setTopicGroups(groups);
  }, [bills]);

  // Filter bills based on search
  const filteredGroups = topicGroups.map(group => ({
    ...group,
    bills: group.bills.filter(bill =>
      bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.bills.length > 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleTopicExpansion = (topic: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topic)) {
      newExpanded.delete(topic);
    } else {
      newExpanded.add(topic);
    }
    setExpandedTopics(newExpanded);
  };

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectAllBillsInTopic = (topic: string) => {
    const group = topicGroups.find(g => g.topic === topic);
    if (group) {
      const billIds = group.bills.map(b => b.id);
      setSelectedBills(prev => [...new Set([...prev, ...billIds])]);
    }
  };

  const clearSelection = () => {
    setSelectedBills([]);
  };

  const addTopicToBill = async (billId: string, newTopic: string) => {
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      const updatedTopics = [...(bill.topics || [])];
      if (!updatedTopics.includes(newTopic)) {
        updatedTopics.push(newTopic);
      }

      const { error } = await supabase
        .from('bills')
        .update({ topics: updatedTopics })
        .eq('id', billId);

      if (error) throw error;

      await refreshBills();
      showNotification('success', `Added "${newTopic}" to bill ${bill.number}`);
    } catch (error) {
      console.error('Error adding topic to bill:', error);
      showNotification('error', 'Failed to add topic to bill');
    }
  };

  const removeTopicFromBill = async (billId: string, topicToRemove: string) => {
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      const updatedTopics = (bill.topics || []).filter(topic => topic !== topicToRemove);

      const { error } = await supabase
        .from('bills')
        .update({ topics: updatedTopics })
        .eq('id', billId);

      if (error) throw error;

      await refreshBills();
      showNotification('success', `Removed "${topicToRemove}" from bill ${bill.number}`);
    } catch (error) {
      console.error('Error removing topic from bill:', error);
      showNotification('error', 'Failed to remove topic from bill');
    }
  };

  const bulkMoveBills = async () => {
    if (!targetTopic || selectedBills.length === 0) return;

    setIsLoading(true);
    try {
      for (const billId of selectedBills) {
        await addTopicToBill(billId, targetTopic);
      }
      
      clearSelection();
      setBulkOperation(null);
      setTargetTopic('');
      showNotification('success', `Moved ${selectedBills.length} bills to "${targetTopic}"`);
    } catch (error) {
      showNotification('error', 'Failed to move bills');
    } finally {
      setIsLoading(false);
    }
  };

  const bulkRemoveTopics = async () => {
    if (selectedBills.length === 0) return;

    setIsLoading(true);
    try {
      for (const billId of selectedBills) {
        const bill = bills.find(b => b.id === billId);
        if (bill && bill.topics) {
          // Remove all topics from selected bills
          const { error } = await supabase
            .from('bills')
            .update({ topics: [] })
            .eq('id', billId);

          if (error) throw error;
        }
      }
      
      await refreshBills();
      clearSelection();
      setBulkOperation(null);
      showNotification('success', `Removed topics from ${selectedBills.length} bills`);
    } catch (error) {
      showNotification('error', 'Failed to remove topics');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewTopic = async () => {
    if (!newTopicName.trim()) return;

    if (selectedBills.length === 0) {
      showNotification('error', 'Please select bills to add to the new topic');
      return;
    }

    setIsLoading(true);
    try {
      for (const billId of selectedBills) {
        await addTopicToBill(billId, newTopicName.trim());
      }
      
      setNewTopicName('');
      setShowNewTopicModal(false);
      clearSelection();
      showNotification('success', `Created topic "${newTopicName}" with ${selectedBills.length} bills`);
    } catch (error) {
      showNotification('error', 'Failed to create new topic');
    } finally {
      setIsLoading(false);
    }
  };

  const renameTopic = async (oldTopic: string, newTopic: string) => {
    if (!newTopic.trim() || oldTopic === newTopic.trim()) {
      setEditingTopic(null);
      return;
    }

    setIsLoading(true);
    try {
      const billsWithTopic = bills.filter(bill => 
        bill.topics && bill.topics.includes(oldTopic)
      );

      for (const bill of billsWithTopic) {
        const updatedTopics = bill.topics!.map(topic => 
          topic === oldTopic ? newTopic.trim() : topic
        );

        const { error } = await supabase
          .from('bills')
          .update({ topics: updatedTopics })
          .eq('id', bill.id);

        if (error) throw error;
      }

      await refreshBills();
      setEditingTopic(null);
      setEditTopicName('');
      showNotification('success', `Renamed topic "${oldTopic}" to "${newTopic}"`);
    } catch (error) {
      showNotification('error', 'Failed to rename topic');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTopic = async (topicToDelete: string) => {
    if (!confirm(`Are you sure you want to remove the topic "${topicToDelete}" from all bills?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const billsWithTopic = bills.filter(bill => 
        bill.topics && bill.topics.includes(topicToDelete)
      );

      for (const bill of billsWithTopic) {
        const updatedTopics = bill.topics!.filter(topic => topic !== topicToDelete);

        const { error } = await supabase
          .from('bills')
          .update({ topics: updatedTopics })
          .eq('id', bill.id);

        if (error) throw error;
      }

      await refreshBills();
      showNotification('success', `Deleted topic "${topicToDelete}" from ${billsWithTopic.length} bills`);
    } catch (error) {
      showNotification('error', 'Failed to delete topic');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (bill: Bill) => {
    setDraggedBill(bill);
  };

  const handleDragOver = (e: React.DragEvent, topic: string) => {
    e.preventDefault();
    setDragOverTopic(topic);
  };

  const handleDragLeave = () => {
    setDragOverTopic(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTopic: string) => {
    e.preventDefault();
    setDragOverTopic(null);

    if (!draggedBill || targetTopic === 'Untagged') return;

    await addTopicToBill(draggedBill.id, targetTopic);
    setDraggedBill(null);
  };

  const allTopics = Array.from(new Set(bills.flatMap(bill => bill.topics || [])))
    .filter(Boolean)
    .sort();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center dark:text-white">
                <Settings size={24} className="mr-2 text-primary-600" />
                Bill Topic Administration
              </h1>
              <p className="text-gray-600 mt-1 dark:text-gray-300">
                Organize and manage bill topics with drag-and-drop functionality
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {bills.length} total bills
              </span>
              <button
                onClick={() => refreshBills()}
                disabled={isLoading}
                className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                <RotateCcw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Selection Info */}
            {selectedBills.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {selectedBills.length} bills selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {selectedBills.length > 0 && (
                <>
                  <button
                    onClick={() => setBulkOperation('move')}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Move size={16} className="mr-2" />
                    Move to Topic
                  </button>
                  <button
                    onClick={() => setBulkOperation('remove')}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Remove Topics
                  </button>
                </>
              )}
              <button
                onClick={() => setShowNewTopicModal(true)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus size={16} className="mr-2" />
                New Topic
              </button>
            </div>
          </div>

          {/* Bulk Operations */}
          {bulkOperation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700"
            >
              {bulkOperation === 'move' && (
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Move {selectedBills.length} bills to:
                  </label>
                  <select
                    value={targetTopic}
                    onChange={(e) => setTargetTopic(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">Select topic...</option>
                    {allTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or create new topic..."
                    value={targetTopic}
                    onChange={(e) => setTargetTopic(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                  />
                  <button
                    onClick={bulkMoveBills}
                    disabled={!targetTopic || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Move
                  </button>
                  <button
                    onClick={() => setBulkOperation(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {bulkOperation === 'remove' && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Remove all topics from {selectedBills.length} bills?
                  </span>
                  <button
                    onClick={bulkRemoveTopics}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setBulkOperation(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Topic Groups */}
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <motion.div
              key={group.topic}
              layout
              className={`bg-white rounded-lg shadow-sm border transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${
                dragOverTopic === group.topic ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, group.topic)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.topic)}
            >
              {/* Topic Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTopicExpansion(group.topic)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {expandedTopics.has(group.topic) ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                    
                    {editingTopic === group.topic ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTopicName}
                          onChange={(e) => setEditTopicName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              renameTopic(group.topic, editTopicName);
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-lg font-semibold dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => renameTopic(group.topic, editTopicName)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditingTopic(null)}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Tag size={20} className="text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {group.topic}
                        </h3>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm dark:bg-gray-700 dark:text-gray-200">
                          {group.count}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => selectAllBillsInTopic(group.topic)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    {group.topic !== 'Untagged' && (
                      <>
                        <button
                          onClick={() => {
                            setEditingTopic(group.topic);
                            setEditTopicName(group.topic);
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteTopic(group.topic)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bills List */}
              <AnimatePresence>
                {expandedTopics.has(group.topic) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.bills.map((bill) => (
                        <motion.div
                          key={bill.id}
                          layout
                          draggable
                          onDragStart={() => handleDragStart(bill)}
                          className={`p-3 border rounded-lg cursor-move hover:shadow-md transition-all ${
                            selectedBills.includes(bill.id)
                              ? 'border-primary-500 bg-primary-50 dark:border-primary-700 dark:bg-primary-900'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                          }`}
                          onClick={() => toggleBillSelection(bill.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedBills.includes(bill.id)}
                                onChange={() => toggleBillSelection(bill.id)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-sm font-medium text-primary-600">
                                {bill.number}
                              </span>
                            </div>
                            <Move size={16} className="text-gray-400" />
                          </div>
                          
                          <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 dark:text-white">
                            {bill.title}
                          </h4>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {bill.topics?.map((topic) => (
                              <span
                                key={topic}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                              >
                                {topic}
                                {group.topic !== 'Untagged' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTopicFromBill(bill.id, topic);
                                    }}
                                    className="ml-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {bill.status} • {bill.chamber}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 dark:text-gray-400">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No bills found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery ? 'Try adjusting your search terms.' : 'No bills match the current filters.'}
            </p>
          </div>
        )}
      </div>

      {/* New Topic Modal */}
      <AnimatePresence>
        {showNewTopicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowNewTopicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4 dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">
                Create New Topic
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createNewTopic();
                    }
                  }}
                  placeholder="Enter topic name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedBills.length > 0 
                    ? `This topic will be added to ${selectedBills.length} selected bills.`
                    : 'Please select bills first to add them to the new topic.'
                  }
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewTopic}
                  disabled={!newTopicName.trim() || selectedBills.length === 0 || isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  Create Topic
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;