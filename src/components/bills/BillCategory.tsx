import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Bill, BillCategory as BillCategoryType } from '../../types/types';
import BillCard from './BillCard';
import { useBillContext } from '../../context/BillContext';

interface BillCategoryProps {
  title: string;
  category: BillCategoryType;
  bills?: Bill[];
  limit?: number;
}

const BillCategory: React.FC<BillCategoryProps> = ({ 
  title, 
  category, 
  bills: propBills,
  limit = 3 
}) => {
  const { getSortedBills } = useBillContext();
  
  // Use provided bills or get sorted bills from context
  const allBills = propBills || getSortedBills();
  
  // Helper function to check if a bill was enacted within the last 30 days
  const isRecentlyEnacted = (bill: Bill): boolean => {
    if (bill.status !== 'enacted') return false;
    
    // Check the timeline for the most recent enacted action
    const enactedEvent = bill.timeline?.find(event => 
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
    const billsWithScores = allBills
      .filter(bill => bill.category === category)
      .map(bill => ({
        bill,
        score: calculateImportanceScore(bill)
      }))
      .sort((a, b) => b.score - a.score) // Sort by importance score descending
      .slice(0, 30) // Limit to 30 most important/controversial bills
      .map(item => item.bill);
    
    filteredBills = billsWithScores.slice(0, limit);
  } else if (category === 'recent') {
    // For recent: only show bills introduced within last 90 days
    filteredBills = allBills
      .filter(bill => bill.category === category && isRecentlyIntroduced(bill))
      .slice(0, limit);
  } else if (category === 'enacted') {
    // For enacted: only show bills enacted within last 30 days
    filteredBills = allBills
      .filter(bill => bill.category === category && isRecentlyEnacted(bill))
      .slice(0, limit);
  } else {
    // For other categories: use existing logic
    filteredBills = allBills
      .filter(bill => bill.category === category)
      .slice(0, limit);
  }

  // Get total count for the category with appropriate filters
  let totalCount = 0;
  if (category === 'trending') {
    // For trending, count all bills in category but note we show top 30
    const allTrendingBills = allBills.filter(bill => bill.category === category);
    totalCount = Math.min(allTrendingBills.length, 30);
  } else if (category === 'recent') {
    totalCount = allBills.filter(bill => 
      bill.category === category && isRecentlyIntroduced(bill)
    ).length;
  } else if (category === 'enacted') {
    totalCount = allBills.filter(bill => 
      bill.category === category && isRecentlyEnacted(bill)
    ).length;
  } else {
    totalCount = allBills.filter(bill => bill.category === category).length;
  }

  if (filteredBills.length === 0) {
    return null;
  }

  const getCategoryIcon = () => {
    switch (category) {
      case 'recent':
        return <span className="text-primary-500">🕒</span>;
      case 'trending':
        return <span className="text-accent-500">🔥</span>;
      case 'upcoming':
        return <span className="text-warning-500">📅</span>;
      case 'enacted':
        return <span className="text-success-500">✓</span>;
      default:
        return null;
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case 'enacted':
        return 'Laws enacted in the last 30 days';
      case 'recent':
        return 'Bills introduced in the last 90 days';
      case 'trending':
        return 'Top 30 most important and controversial bills';
      case 'upcoming':
        return 'Bills with scheduled votes';
      default:
        return '';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center dark:text-white">
            {getCategoryIcon()}
            <span className="ml-2">{title}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({totalCount} {category === 'trending' ? 'top bills' : 'total'})
            </span>
          </h2>
          <p className="text-sm text-gray-600 mt-1 ml-7 dark:text-gray-300">
            {getCategoryDescription()}
          </p>
        </div>
        <Link
          to={`/category/${category}`}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
        >
          View all
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map(bill => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </div>
      
      {filteredBills.length === 0 && category === 'enacted' && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No bills have been enacted in the last 30 days.</p>
        </div>
      )}

      {filteredBills.length === 0 && category === 'recent' && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No bills have been introduced in the last 90 days.</p>
        </div>
      )}
    </div>
  );
};

export default BillCategory;