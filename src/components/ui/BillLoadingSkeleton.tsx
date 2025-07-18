import React from 'react';
import { motion } from 'framer-motion';

interface BillLoadingSkeletonProps {
  count?: number;
}

const BillLoadingSkeleton: React.FC<BillLoadingSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="p-4 space-y-4">
            {/* Header with status and number */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </div>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="h-5 w-full bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </div>

            {/* Topics */}
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-16 bg-gray-200 rounded-full animate-pulse dark:bg-gray-700"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-200 space-y-2 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </div>
              <div className="flex items-center justify-center mt-2">
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BillLoadingSkeleton;