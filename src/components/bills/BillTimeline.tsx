import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Circle, Clock, AlertCircle, FileText, Vote, Gavel, Users, Building } from 'lucide-react';
import { Bill } from '../../types/types';
import StatusBadge from './StatusBadge';

interface BillTimelineProps {
  bill: Bill;
}

const BillTimeline: React.FC<BillTimelineProps> = ({ bill }) => {
  const timelineEvents = bill.timeline || [];

  console.log(`Timeline for bill ${bill.number}:`, {
    eventsCount: timelineEvents.length,
    events: timelineEvents.slice(0, 3)
  });

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">No Timeline Available</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Timeline data is being processed for this bill.
        </p>
        
        {/* Show basic bill info as fallback */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-left dark:bg-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Introduced:</span>
              <span className="text-xs text-gray-800 dark:text-gray-200">
                {bill.introducedDate ? format(new Date(bill.introducedDate), 'MMM d, yyyy') : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Last Action:</span>
              <span className="text-xs text-gray-800 dark:text-gray-200">
                {bill.lastActionDate ? format(new Date(bill.lastActionDate), 'MMM d, yyyy') : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Status:</span>
              <StatusBadge status={bill.status} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Function to get appropriate icon for timeline event
  const getEventIcon = (action: string, status: string, isLatest: boolean) => {
    const actionLower = action.toLowerCase();
    const statusLower = status.toLowerCase();
    
    if (isLatest) {
      return <Circle size={16} className="text-primary-500" />;
    }
    
    if (statusLower.includes('enacted') || statusLower.includes('signed')) {
      return <CheckCircle size={16} className="text-success-500" />;
    }
    
    if (actionLower.includes('vote') || actionLower.includes('passed')) {
      return <Vote size={16} className="text-primary-500" />;
    }
    
    if (actionLower.includes('committee') || actionLower.includes('referred')) {
      return <Users size={16} className="text-blue-500" />;
    }
    
    if (actionLower.includes('introduced')) {
      return <Gavel size={16} className="text-gray-500 dark:text-gray-400" />;
    }
    
    if (actionLower.includes('house') || actionLower.includes('senate')) {
      return <Building size={16} className="text-indigo-500" />;
    }
    
    if (statusLower.includes('vetoed')) {
      return <AlertCircle size={16} className="text-error-500" />;
    }
    
    return <FileText size={16} className="text-gray-400" />;
  };

  // Function to get timeline item styling based on status
  const getTimelineItemStyle = (status: string, isLatest: boolean) => {
    const statusLower = status.toLowerCase();
    
    if (isLatest) {
      return {
        iconBg: 'bg-primary-100 dark:bg-primary-900',
        iconRing: 'ring-primary-200 dark:ring-gray-800',
        connector: 'bg-primary-200 dark:bg-primary-700'
      };
    }
    
    if (statusLower.includes('enacted') || statusLower.includes('signed')) {
      return {
        iconBg: 'bg-success-100 dark:bg-success-900',
        iconRing: 'ring-success-200 dark:ring-gray-800',
        connector: 'bg-success-200 dark:bg-success-700'
      };
    }
    
    if (statusLower.includes('vetoed')) {
      return {
        iconBg: 'bg-error-100 dark:bg-error-900',
        iconRing: 'ring-error-200 dark:ring-gray-800',
        connector: 'bg-error-200 dark:bg-error-700'
      };
    }
    
    if (statusLower.includes('passed')) {
      return {
        iconBg: 'bg-blue-100 dark:bg-blue-900',
        iconRing: 'ring-blue-200 dark:ring-gray-800',
        connector: 'bg-blue-200 dark:bg-blue-700'
      };
    }
    
    return {
      iconBg: 'bg-gray-100 dark:bg-gray-700',
      iconRing: 'ring-gray-200 dark:ring-gray-800',
      connector: 'bg-gray-200 dark:bg-gray-600'
    };
  };

  // Function to format action text for better readability
  const formatActionText = (action: string) => {
    if (!action) return 'Unknown action';
    
    // Capitalize first letter and clean up common patterns
    return action
      .replace(/^./, action[0].toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className="flow-root">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center dark:text-white">
          <Clock size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
          Legislative Timeline
        </h3>
        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
          {timelineEvents.length} events tracked
        </p>
      </div>
      
      <ul className="-mb-8">
        {timelineEvents.map((event, eventIdx) => {
          const isLatest = eventIdx === 0;
          const style = getTimelineItemStyle(event.status, isLatest);
          
          return (
            <li key={`${event.date}-${eventIdx}`}>
              <div className="relative pb-8">
                {eventIdx !== timelineEvents.length - 1 ? (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${style.connector}`}
                    aria-hidden="true"
                  />
                ) : null}
                
                <div className="relative flex space-x-3">
                  <div>
                    <span 
                      className={`h-8 w-8 rounded-full ${style.iconBg} flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${style.iconRing}`}
                    >
                      {getEventIcon(event.action, event.status, isLatest)}
                    </span>
                  </div>
                  
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div className="flex flex-col space-y-2">
                      {/* Action and Status */}
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm text-gray-900 font-medium leading-5 dark:text-white">
                          {formatActionText(event.action)}
                        </p>
                        
                        {/* Status Badge and Latest Indicator */}
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={event.status as any} />
                          {isLatest && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                              Latest
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="text-right">
                        <time 
                          dateTime={event.date}
                          className="text-sm text-gray-500 font-medium dark:text-gray-400"
                        >
                          {format(new Date(event.date), 'MMM d, yyyy')}
                        </time>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {format(new Date(event.date), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      {/* Timeline Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center">
            <Clock size={14} className="mr-1" />
            {timelineEvents.length} events tracked
          </span>
          <span>
            {timelineEvents.length > 0 && (
              <>
                Started {format(new Date(timelineEvents[timelineEvents.length - 1].date), 'MMM d, yyyy')}
              </>
            )}
          </span>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1 dark:text-gray-400">
            <span>Introduced</span>
            <span>Current Status</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (timelineEvents.length / 10) * 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillTimeline;