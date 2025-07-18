import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ResetPasswordModal from './ResetPasswordModal'; // New import

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false); // New state

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      let error = null;
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
        if (!error) {
          alert('Check your email to confirm your account!');
          onClose();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        error = signInError;
      }

      if (error) throw error;

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setShowResetPassword(true);
  };

  const handleResetPasswordModalClose = () => {
    setShowResetPassword(false);
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
                    <Mail size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
                    <p className="text-primary-100 text-sm">Access your tracked bills and alerts</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  aria-label="Close authentication modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <form className="space-y-4" onSubmit={handleAuth}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="lucide lucide-mail absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="your.email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Password</label>
                  <div className="relative">
                    <Lock size={18} className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
              </form>
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                  <button
                    type="button"
                    className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Sign In' : 'Sign up'}
                  </button>
                </p>
                {!isSignUp && (
                  <button
                    type="button"
                    className="mt-2 text-sm text-gray-500 hover:text-gray-700 font-medium dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleForgotPasswordClick}
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={handleResetPasswordModalClose}
      />
    </AnimatePresence>
  );
};

export default AuthModal;