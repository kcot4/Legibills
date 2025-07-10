import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Users, AlertTriangle, CheckCircle, Lightbulb, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useBillContext } from '../context/BillContext';
import StatusBadge from '../components/bills/StatusBadge';
import BillTimeline from '../components/bills/BillTimeline';
import TextComparison from '../components/comparison/TextComparison';
import CommitteeInfo from '../components/bills/CommitteeInfo';
import ReportBillModal from '../components/bills/ReportBillModal';

const BillDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { bills, userPreferences, trackBill, untrackBill } = useBillContext();
  const [bill, setBill] = useState(bills.find(b => b.id === id));
  const [isTracked, setIsTracked] = useState(userPreferences.trackedBills.includes(id || ''));
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    setBill(bills.find(b => b.id === id));
    setIsTracked(userPreferences.trackedBills.includes(id || ''));
  }, [bills, id, userPreferences.trackedBills]);

  if (!bill || !id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Bill Not Found</h2>
        <p className="text-gray-600 mb-6">The bill you're looking for doesn't exist or has been removed.</p>
        <Link 
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeft size={16} className="mr-2" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const toggleTracking = () => {
    if (isTracked) {
      untrackBill(bill.id);
    } else {
      trackBill(bill.id);
    }
    setIsTracked(!isTracked);
  };

  // Get primary sponsor safely
  const primarySponsor = bill.sponsors?.[0];

  // Get the most recent action
  const latestAction = bill.timeline?.[0];

  // Format dates safely
  const formatDateSafe = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'N/A';
    }
  };

  const hasCommittees = bill.committees && bill.committees.length > 0;
  const hasKeyProvisions = bill.keyProvisions && bill.keyProvisions.length > 0;
  const hasPotentialImpact = bill.potentialImpact && bill.potentialImpact.length > 0;
  const hasPotentialControversy = bill.potentialControversy && bill.potentialControversy.length > 0;

  return (
    <>
      <div>
        {/* Back button */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to dashboard</span>
          </Link>
        </div>

        {/* Header section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center mb-2">
              <StatusBadge status={bill.status} />
              <span className="ml-2 text-sm font-medium text-gray-500">{bill.number}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                aria-label="Report an issue with this bill"
              >
                <Flag size={16} className="mr-1.5" />
                Report Issue
              </button>
              <button
                onClick={toggleTracking}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                  isTracked 
                    ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                aria-label={isTracked ? "Untrack bill" : "Track bill"}
              >
                {isTracked ? (
                  <>
                    <BookmarkCheck size={16} className="mr-1.5" />
                    Tracking
                  </>
                ) : (
                  <>
                    <Bookmark size={16} className="mr-1.5" />
                    Track
                  </>
                )}
              </button>
              <button
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                aria-label="Share"
              >
                <Share2 size={16} className="mr-1.5" />
                Share
              </button>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{bill.title}</h1>
          
          <p className="text-gray-700 mb-4">{bill.summary || 'No summary available.'}</p>
          
          <div className="flex flex-wrap gap-1.5 mb-4">
            {bill.topics?.map((topic) => (
              <span
                key={topic}
                className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800"
              >
                {topic}
              </span>
            )) || <span className="text-gray-500">No topics available</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-gray-200 pt-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Introduced</h3>
              <p className="text-gray-900">{formatDateSafe(bill.introducedDate)}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Latest Action</h3>
              <div className="flex flex-col">
                <p className="text-gray-900">{latestAction?.action || 'No recent action'}</p>
                <p className="text-sm text-gray-500">{latestAction ? formatDateSafe(latestAction.date) : ''}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Sponsor</h3>
              <p className="text-gray-900">
                {primarySponsor ? (
                  `${primarySponsor.name} (${primarySponsor.party}-${primarySponsor.state})`
                ) : (
                  'No sponsor information available'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text comparison with AI Summary */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Text & Analysis</h2>
              <TextComparison 
                originalText={bill.originalText}
                simplifiedText={bill.simplifiedText || 'Enhanced AI analysis not available.'}
                aiSummary={bill.aiSummary}
                billId={bill.id}
              />
            </section>
            
            {/* Committee Activity */}
            {hasCommittees && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users size={20} className="mr-2" />
                  Committee Activity ({bill.committees.length})
                </h2>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <CommitteeInfo committees={bill.committees} showAll={true} />
                </motion.div>
              </section>
            )}
            
            {/* Key provisions */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle size={20} className="mr-2 text-green-600" />
                Key Provisions
              </h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                {hasKeyProvisions ? (
                  <ul className="space-y-4">
                    {bill.keyProvisions.map((provision, index) => (
                      <li key={index} className="flex">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{provision}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Key provisions will be generated when AI analysis is complete.</p>
                  </div>
                )}
              </motion.div>
            </section>
            
            {/* Potential Impact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb size={20} className="mr-2 text-blue-600" />
                Potential Impact
              </h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                {hasPotentialImpact ? (
                  <ul className="space-y-3">
                    {bill.potentialImpact.map((impact, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 text-blue-500 mr-2 mt-1">•</span>
                        <span className="text-gray-700">{impact}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Potential impact analysis will be generated when AI analysis is complete.</p>
                  </div>
                )}
              </motion.div>
            </section>

            {/* Potential Controversy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle size={20} className="mr-2 text-amber-600" />
                Potential Areas of Debate
              </h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                {hasPotentialControversy ? (
                  <ul className="space-y-3">
                    {bill.potentialControversy.map((controversy, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 text-amber-500 mr-2 mt-1">⚠</span>
                        <span className="text-gray-700">{controversy}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Potential controversy analysis will be generated when AI analysis is complete.</p>
                  </div>
                )}
              </motion.div>
            </section>
          </div>
          
          {/* Right column - 1/3 width */}
          <div className="space-y-6">
            {/* Legislative process timeline */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Status</h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <BillTimeline bill={bill} />
              </motion.div>
            </section>
            
            {/* Votes if available */}
            {bill.votes && bill.votes.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Votes</h2>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  {bill.votes.map((vote, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {vote.chamber === 'house' ? 'House' : 'Senate'} Vote - {formatDateSafe(vote.date)}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-primary-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold text-primary-700">{vote.yeas}</div>
                          <div className="text-xs text-gray-500">Yeas</div>
                        </div>
                        <div className="bg-error-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold text-error-700">{vote.nays}</div>
                          <div className="text-xs text-gray-500">Nays</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold text-gray-700">{vote.notVoting}</div>
                          <div className="text-xs text-gray-500">Not Voting</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </section>
            )}
            
            {/* Additional sponsors */}
            {bill.sponsors && bill.sponsors.length > 1 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Co-Sponsors</h2>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <ul className="space-y-3">
                    {bill.sponsors.slice(1).map((sponsor, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <span className="text-gray-900">{sponsor.name}</span>
                        <span className="text-sm text-gray-500">
                          {sponsor.party}-{sponsor.state}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </section>
            )}
          </div>
        </div>
      </div>

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
};

export default BillDetails;