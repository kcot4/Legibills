import React, { useState, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Calendar, Users, Flag } from 'lucide-react';
import { Bill } from '../../types/types';
import StatusBadge from './StatusBadge';
import CommitteeInfo from './CommitteeInfo';
import ReportBillModal from './ReportBillModal';
import { useBillContext } from '../../context/BillContext';

interface BillCardProps {
  bill: Bill;
  style?: React.CSSProperties; // Add style prop for virtualization
  showCommittees?: boolean;
}

const BillCard: React.FC<BillCardProps> = memo(({ bill, style, showCommittees = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { userPreferences, trackBill, untrackBill } = useBillContext();

  const isTracked = userPreferences.trackedBills.includes(bill.id);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const toggleTracking = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Toggle tracking for bill:', {
      billId: bill.id,
      billNumber: bill.number,
      currentlyTracked: isTracked,
      action: isTracked ? 'untrack' : 'track'
    });
    
    if (isTracked) {
      untrackBill(bill.id);
    } else {
      trackBill(bill.id);
    }
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowReportModal(true);
  };

  // Debug: Log when tracking status changes
  useEffect(() => {
    console.log(`📊 Bill ${bill.number} tracking status:`, {
      billId: bill.id,
      isTracked,
      allTrackedBills: userPreferences.trackedBills
    });
  }, [isTracked, bill.id, bill.number, userPreferences.trackedBills]);

  const formatDateSafe = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const getLatestAction = () => {
    if (!bill.timeline || !Array.isArray(bill.timeline) || bill.timeline.length === 0) {
      return null;
    }
    return bill.timeline[0];
  };

  const truncateText = (text: string, maxLength = 250) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const latestAction = getLatestAction();
  const hasCommittees = bill.committees && bill.committees.length > 0;
  const primaryCommittee = hasCommittees ? bill.committees[0] : null;
  
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        layout
        style={style} // Apply style prop for virtualization
      >
        <Link to={`/bill/${bill.id}`} className="block">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <StatusBadge status={bill.status} />
                <span className="text-sm font-medium text-gray-500">
                  {bill.congress}th Congress - {bill.number}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReportClick}
                  className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors duration-200"
                  aria-label="Report an issue with this bill"
                  title="Report an issue with this bill"
                >
                  <Flag size={16} />
                </button>
                <button
                  onClick={toggleTracking}
                  className={`text-gray-400 hover:text-primary-600 focus:outline-none transition-colors duration-200 ${
                    isTracked ? 'text-primary-600' : ''
                  }`}
                  aria-label={isTracked ? "Untrack bill" : "Track bill"}
                  title={isTracked ? "Remove from tracked bills" : "Add to tracked bills"}
                >
                  {isTracked ? (
                    <BookmarkCheck size={18} className="text-primary-600" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {truncateText(bill.title)}
            </h3>

            {/* Primary Committee Info */}
            {primaryCommittee && (
              <div className="mb-3 p-2 bg-blue-50 rounded-md">
                <div className="flex items-center text-sm text-blue-800">
                  <Users size={14} className="mr-1 flex-shrink-0" />
                  <span className="font-medium">{primaryCommittee.committee.name}</span>
                  <span className="ml-2 text-blue-600 capitalize">
                    ({primaryCommittee.committee.chamber})
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {primaryCommittee.activity} - {formatDateSafe(primaryCommittee.date)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {bill.topics && bill.topics.length > 0 ? (
                bill.topics.map((topic, index) => (
                  <span
                    key={`${topic}-${index}`}
                    className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs font-medium text-gray-800"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No topics available</span>
              )}
            </div>

            {expanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 pt-3 border-t border-gray-100 space-y-4"
              >
                {/* Sponsors */}
                {bill.sponsors && bill.sponsors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sponsors:</h4>
                    <ul className="space-y-1">
                      {bill.sponsors.slice(0, 3).map((sponsor, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {sponsor.name} ({sponsor.party}-{sponsor.state})
                        </li>
                      ))}
                      {bill.sponsors.length > 3 && (
                        <li className="text-sm text-primary-600">
                          +{bill.sponsors.length - 3} more sponsors
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* All Committees */}
                {showCommittees && hasCommittees && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Committee Activity ({bill.committees.length}):
                    </h4>
                    <CommitteeInfo committees={bill.committees} showAll={false} />
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex flex-col space-y-2 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {latestAction ? latestAction.action : 'No recent action'}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {latestAction ? formatDateSafe(latestAction.date) : ''}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1 flex-shrink-0" />
                  <span>Introduced</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDateSafe(bill.introducedDate)}
                </span>
              </div>

              {hasCommittees && !expanded && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users size={14} className="mr-1 flex-shrink-0" />
                    <span>Committees</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {bill.committees.length} active
                  </span>
                </div>
              )}

              <button
                onClick={toggleExpanded}
                className="flex items-center justify-center w-full mt-2 text-primary-600 text-sm focus:outline-none"
                aria-expanded={expanded}
                aria-label="Toggle details"
              >
                {expanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp size={16} className="ml-1" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown size={16} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Report Modal */}
      <ReportBillModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        billNumber={bill.number}
        billTitle={bill.title}
        billId={bill.id}
      />
    </>
  );
});

BillCard.displayName = 'BillCard';

export default BillCard;