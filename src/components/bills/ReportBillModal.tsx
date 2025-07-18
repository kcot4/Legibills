import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Send, Check, FileText, Tag, Users, Calendar } from 'lucide-react';

interface ReportBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billNumber: string;
  billTitle: string;
  billId: string;
}

type ReportCategory = 
  | 'incorrect_summary' 
  | 'wrong_status' 
  | 'missing_sponsors' 
  | 'incorrect_dates' 
  | 'wrong_topics' 
  | 'broken_links' 
  | 'other';

interface ReportOption {
  value: ReportCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const reportOptions: ReportOption[] = [
  {
    value: 'incorrect_summary',
    label: 'Incorrect Summary',
    description: 'The AI-generated summary contains errors or misrepresentations',
    icon: <FileText size={16} />
  },
  {
    value: 'wrong_status',
    label: 'Wrong Status',
    description: 'The bill status is outdated or incorrect',
    icon: <AlertTriangle size={16} />
  },
  {
    value: 'missing_sponsors',
    label: 'Missing/Wrong Sponsors',
    description: 'Sponsor information is incomplete or incorrect',
    icon: <Users size={16} />
  },
  {
    value: 'incorrect_dates',
    label: 'Incorrect Dates',
    description: 'Introduction date, last action date, or other dates are wrong',
    icon: <Calendar size={16} />
  },
  {
    value: 'wrong_topics',
    label: 'Wrong Topics',
    description: 'Bill topics or categories are incorrectly assigned',
    icon: <Tag size={16} />
  },
  {
    value: 'broken_links',
    label: 'Broken Links',
    description: 'Links to Congress.gov or other sources are not working',
    icon: <AlertTriangle size={16} />
  },
  {
    value: 'other',
    label: 'Other Issue',
    description: 'Something else is wrong with this bill\'s information',
    icon: <AlertTriangle size={16} />
  }
];

const ReportBillModal: React.FC<ReportBillModalProps> = ({ 
  isOpen, 
  onClose, 
  billNumber, 
  billTitle,
  billId 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a report object
      const report = {
        billId,
        billNumber,
        billTitle,
        category: selectedCategory,
        description: description.trim(),
        userEmail: userEmail.trim() || null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Store in localStorage for now (in a real app, this would go to a backend)
      const existingReports = JSON.parse(localStorage.getItem('billReports') || '[]');
      existingReports.push(report);
      localStorage.setItem('billReports', JSON.stringify(existingReports));

      console.log('Bill report submitted:', report);

      setIsSubmitted(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setDescription('');
    setUserEmail('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const selectedOption = reportOptions.find(option => option.value === selectedCategory);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Report an Issue</h2>
                    <p className="text-red-100 text-sm">Help us improve bill accuracy</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  aria-label="Close report modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center dark:bg-green-900">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                    Report Submitted Successfully
                  </h3>
                  <p className="text-gray-600 mb-4 dark:text-gray-300">
                    Thank you for helping us improve the accuracy of bill information. 
                    We'll review your report and make corrections as needed.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This window will close automatically...
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Bill Info */}
                  <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-700">
                    <h3 className="font-semibold text-gray-900 mb-1 dark:text-white">Reporting Issue For:</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">{billNumber}</span> - {billTitle}
                    </p>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">
                      What type of issue are you reporting? *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {reportOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedCategory === option.value
                              ? 'border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-700'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={option.value}
                            checked={selectedCategory === option.value}
                            onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
                            className="sr-only"
                          />
                          <div className="flex items-start space-x-3 w-full">
                            <div className={`mt-0.5 ${
                              selectedCategory === option.value ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              {option.icon}
                            </div>
                            <div className={`font-medium ${
                              selectedCategory === option.value ? 'text-red-900 dark:text-red-200' : 'text-gray-900 dark:text-white'
                            }`}>
                              {option.label}
                            </div>
                            <div className={`text-sm mt-1 ${
                              selectedCategory === option.value ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {option.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                      Please describe the issue in detail *
                      {selectedOption && (
                        <span className="text-gray-500 font-normal dark:text-gray-400">
                          {' '}({selectedOption.label})
                        </span>
                      )}
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder={
                        selectedOption?.value === 'incorrect_summary' 
                          ? "Please explain what parts of the summary are incorrect and what the correct information should be..."
                          : selectedOption?.value === 'wrong_status'
                          ? "Please specify what the correct status should be and provide a source if possible..."
                          : selectedOption?.value === 'missing_sponsors'
                          ? "Please list the missing sponsors or corrections needed..."
                          : selectedOption?.value === 'incorrect_dates'
                          ? "Please specify which dates are wrong and what the correct dates should be..."
                          : selectedOption?.value === 'wrong_topics'
                          ? "Please suggest the correct topics or categories for this bill..."
                          : selectedOption?.value === 'broken_links'
                          ? "Please specify which links are broken and where they should point..."
                          : "Please provide as much detail as possible about the issue..."
                      }
                      required
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {description.length}/500 characters
                    </div>
                  </div>

                  {/* Optional Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                      Your email (optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="your.email@example.com"
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Provide your email if you'd like us to follow up with you about this report
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950 dark:border-yellow-700">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Before submitting:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Please verify the issue by checking official sources like Congress.gov</li>
                          <li>• Provide specific details to help us locate and fix the problem</li>
                          <li>• Reports help improve accuracy for all users</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedCategory || !description.trim() || isSubmitting}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} className="mr-2" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportBillModal;