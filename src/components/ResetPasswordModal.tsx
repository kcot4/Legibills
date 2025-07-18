import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password',
      });

      if (error) throw error;
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-primary-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <KeyRound size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Reset Password</h2>
                    <p className="text-primary-100 text-sm">Enter your email to receive a reset link</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  aria-label="Close reset password modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {message && <p className="text-green-600 text-center">{message}</p>}
              {error && <p className="text-red-600 text-center dark:text-red-400">{error}</p>}
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="lucide lucide-mail absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      id="resetEmail"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="your.email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResetPasswordModal;
