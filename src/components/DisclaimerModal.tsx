import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check, Brain, Shield, Building } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('disclaimerDismissed', 'true');
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

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
            <div className="bg-primary-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Important Disclaimer</h2>
                    <p className="text-primary-100 text-sm">Please read before using Legibills</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  aria-label="Close disclaimer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Not Government Website */}
              <div className="border-l-4 border-primary-500 pl-4">
                <div className="flex items-start space-x-3">
                  <Building size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Not a Government Website</h3>
                    <p className="text-gray-700 text-sm leading-relaxed dark:text-gray-300">
                      <strong>Legibills is an independent, non-governmental website.</strong> This site is not 
                      affiliated with, endorsed by, or operated by the U.S. Government, Congress, or any 
                      government agency. For official information, please visit official government sources.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Analysis Warning */}
              <div className="border-l-4 border-primary-500 pl-4">
                <div className="flex items-start space-x-3">
                  <Brain size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">AI-Generated Content</h3>
                    <p className="text-gray-700 text-sm leading-relaxed dark:text-gray-300">
                      This application uses artificial intelligence to analyze and summarize congressional bills. 
                      While we strive for accuracy, <strong>AI analysis may contain errors, omissions, or 
                      misinterpretations</strong> of the original legislative text.
                    </p>
                  </div>
                </div>
              </div>

              {/* User Responsibility */}
              <div className="border-l-4 border-primary-500 pl-4">
                <div className="flex items-start space-x-3">
                  <Shield size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Your Responsibility</h3>
                    <ul className="text-gray-700 text-sm space-y-1 dark:text-gray-300">
                      <li>• <strong>Always verify information</strong> with official sources</li>
                      <li>• <strong>Read the original bill text</strong> for complete accuracy</li>
                      <li>• <strong>Use your own judgment</strong> when interpreting legislative content</li>
                      <li>• <strong>Consult legal experts</strong> for professional advice</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Official Sources */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 mb-3 dark:text-white">Recommended Official Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <a
                    href="https://www.congress.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:border-primary-700 dark:hover:bg-gray-600"
                  >
                    <span className="text-primary-600 font-medium">Congress.gov</span>
                    <span className="ml-auto text-gray-500">→</span>
                  </a>
                  <a
                    href="https://www.govtrack.us"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:border-primary-700 dark:hover:bg-gray-600"
                  >
                    <span className="text-primary-600 font-medium">GovTrack.us</span>
                    <span className="ml-auto text-gray-500">→</span>
                  </a>
                  <a
                    href="https://www.house.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:border-primary-700 dark:hover:bg-gray-600"
                  >
                    <span className="text-primary-600 font-medium">House.gov</span>
                    <span className="ml-auto text-gray-500">→</span>
                  </a>
                  <a
                    href="https://www.senate.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:border-primary-700 dark:hover:bg-gray-600"
                  >
                    <span className="text-primary-600 font-medium">Senate.gov</span>
                    <span className="ml-auto text-gray-500">→</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200 dark:bg-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-primary-600 dark:focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    Don't show this disclaimer again
                  </span>
                </label>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center"
                  >
                    <Check size={16} className="mr-2" />
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerModal;