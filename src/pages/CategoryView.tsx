import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useBillContext } from '../context/BillContext';
import BillCard from '../components/bills/BillCard';
import { BillCategory } from '../types/types';
import { Bill } from '../types/types';

const categoryTitles: Record<BillCategory, string> = {
  recent: 'Recently Introduced Bills (Last 90 Days)',
  trending: 'Top 30 Most Important & Controversial Bills',
  upcoming: 'Upcoming Votes',
  enacted: 'Recently Enacted Laws (Last 30 Days)'
};

const categoryDescriptions: Record<BillCategory, string> = {
  recent: 'Bills that have been introduced to Congress within the last 90 days',
  trending: 'The 30 most important and controversial bills based on sponsor count, committee activity, and potential impact',
  upcoming: 'Bills scheduled for votes or in active consideration',
  enacted: 'Bills that have become law within the last 30 days'
};

const CategoryView: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const { getSortedBills } = useBillContext();
  
  const allBills = getSortedBills();
  
  // Helper function to check if a bill was enacted within the last 30 days
  const isRecentlyEnacted = (bill: Bill): boolean => {
    if (bill.status !== 'enacted') return false;
    
    // Check the timeline for the most recent enacted action
    const enactedEvent = bill.timeline?.find((event: any) => 
      event.status === 'enacted' || 
      event.action.toLowerCase().includes('became public law') ||
      event.action.toLowerCase().includes('signed by president') ||
      event.action.toLowerCase().includes('became law')
    );
    
    if (!enactedEvent) {
      // Fallback to last action date if no specific enacted event found
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(bill.lastActionDate) >= thirtyDaysAgo;
    }
    
    const enactedDate = new Date(enactedEvent.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return enactedDate >= thirtyDaysAgo;
  };

  // Helper function to check if a bill was introduced within the last 90 days
  const isRecentlyIntroduced = (bill: Bill): boolean => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return new Date(bill.introducedDate) >= ninetyDaysAgo;
  };

  // Helper function to calculate bill importance/controversy score
  const calculateImportanceScore = (bill: Bill): number => {
    let score = 0;
    
    // Factor 1: Number of sponsors (more sponsors = more important)
    const sponsorCount = bill.sponsors?.length || 0;
    score += Math.min(sponsorCount * 2, 50); // Cap at 50 points
    
    // Factor 2: Committee activity (more committees = more controversial/important)
    const committeeCount = bill.committees?.length || 0;
    score += committeeCount * 10;
    
    // Factor 3: Timeline activity (more actions = more active/important)
    const timelineCount = bill.timeline?.length || 0;
    score += Math.min(timelineCount * 3, 30); // Cap at 30 points
    
    // Factor 4: Potential controversy indicators
    const controversyCount = bill.potentialControversy?.length || 0;
    score += controversyCount * 15; // High weight for controversy
    
    // Factor 5: Key provisions (more provisions = more comprehensive/important)
    const provisionsCount = bill.keyProvisions?.length || 0;
    score += provisionsCount * 5;
    
    // Factor 6: Potential impact (broader impact = more important)
    const impactCount = bill.potentialImpact?.length || 0;
    score += impactCount * 8;
    
    // Factor 7: Recent activity bonus (bills with recent activity are more relevant)
    const daysSinceLastAction = Math.floor(
      (Date.now() - new Date(bill.lastActionDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastAction <= 30) {
      score += 20; // Bonus for recent activity
    } else if (daysSinceLastAction <= 60) {
      score += 10; // Smaller bonus for somewhat recent activity
    }
    
    // Factor 8: Status-based importance
    switch (bill.status) {
      case 'to_president':
        score += 30; // Very important - awaiting presidential action
        break;
      case 'passed_house':
      case 'passed_senate':
        score += 25; // Important - passed one chamber
        break;
      case 'reported_by_committee':
        score += 15; // Moderately important - committee action
        break;
      case 'enacted':
        score += 40; // Very important - became law
        break;
      case 'vetoed':
        score += 35; // Very important - presidential veto
        break;
    }
    
    return score;
  };
  
  // Filter bills based on category with special handling
  let filteredBills: Bill[] = [];
  
  if (category === 'trending') {
    // For trending: get all bills, calculate importance scores, and take top 30
    filteredBills = allBills
      .filter(bill => bill.category === category)
      .map(bill => ({
        bill,
        score: calculateImportanceScore(bill)
      }))
      .sort((a, b) => b.score - a.score) // Sort by importance score descending
      .slice(0, 30) // Limit to 30 most important/controversial bills
      .map(item => item.bill);
  } else if (category === 'recent') {
    // For recent: only show bills introduced within last 90 days
    filteredBills = allBills.filter(bill => 
      bill.category === category && isRecentlyIntroduced(bill)
    );
  } else if (category === 'enacted') {
    // For enacted: only show bills enacted within last 30 days
    filteredBills = allBills.filter(bill => 
      bill.category === category && isRecentlyEnacted(bill)
    );
  } else {
    // For other categories: use existing logic
    filteredBills = allBills.filter(bill => bill.category === category);
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to dashboard</span>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
          {categoryTitles[category as BillCategory]}
        </h1>
        <p className="text-gray-600 mb-2 dark:text-gray-300">
          {categoryDescriptions[category as BillCategory]}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredBills.length} bills in this category
          {category === 'trending' && filteredBills.length > 0 && (
            <span className="ml-2 text-primary-600">
              (showing top {Math.min(filteredBills.length, 30)} by importance score)
            </span>
          )}
        </p>
      </div>

      {filteredBills.length === 0 ? (
        <div className="text-center py-12 dark:text-gray-400">
          <h2 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No bills found</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {category === 'enacted' 
              ? 'No bills have been enacted in the last 30 days.'
              : category === 'recent'
              ? 'No bills have been introduced in the last 90 days.'
              : 'There are currently no bills in this category.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BillCard bill={bill} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryView;