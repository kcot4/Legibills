import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, FileText, Clock, Users } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'bills' | 'minimal';
  message?: string;
  progress?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  message,
  progress
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerSizes = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-8',
    xl: 'p-12'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
      </div>
    );
  }

  if (variant === 'bills') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerSizes[size]} text-center`}>
        {/* Animated Icons */}
        <div className="relative mb-6">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Orbiting Icons */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-16 h-16"
          >
            <motion.div
              className="absolute -top-2 left-1/2 transform -translate-x-1/2"
              animate={{
                y: [0, -4, 0],
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0
              }}
            >
              <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center shadow-md dark:bg-accent-700">
                <Clock className="w-3 h-3 text-white" />
              </div>
            </motion.div>

            <motion.div
              className="absolute top-1/2 -right-2 transform -translate-y-1/2"
              animate={{
                x: [0, 4, 0],
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center shadow-md dark:bg-success-700">
                <Users className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {message || 'Loading Bills'}
          </h3>
          <p className="text-sm text-gray-600 max-w-xs dark:text-gray-300">
            Fetching the latest congressional legislation and updates...
          </p>
        </motion.div>

        {/* Progress Bar */}
        {typeof progress === 'number' && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs mt-4"
          >
            <div className="flex justify-between text-xs text-gray-500 mb-1 dark:text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Animated Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex space-x-1 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-primary-400 rounded-full dark:bg-primary-600"
            />
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]} text-center`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mb-4"
      >
        <Loader2 className={`${sizeClasses[size]} text-primary-600 dark:text-primary-400`} />
      </motion.div>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
