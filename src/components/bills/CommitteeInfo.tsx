import React from 'react';
import { Users, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CommitteeActivity } from '../../types/types';

interface CommitteeInfoProps {
  committees: CommitteeActivity[];
  showAll?: boolean;
}

const CommitteeInfo: React.FC<CommitteeInfoProps> = ({ 
  committees, 
  showAll = false 
}) => {
  if (!committees || committees.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No committee information available
      </div>
    );
  }

  const displayCommittees = showAll ? committees : committees.slice(0, 3);
  const hasMore = committees.length > 3 && !showAll;

  const getActivityTypeColor = (activityType: string) => {
    switch (activityType) {
      case 'referred':
        return 'bg-blue-100 text-blue-800';
      case 'markup':
        return 'bg-yellow-100 text-yellow-800';
      case 'reported':
        return 'bg-green-100 text-green-800';
      case 'discharged':
        return 'bg-purple-100 text-purple-800';
      case 'hearing':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityType = (activityType: string) => {
    return activityType.charAt(0).toUpperCase() + activityType.slice(1);
  };

  return (
    <div className="space-y-3">
      {displayCommittees.map((activity, index) => (
        <div 
          key={`${activity.committee.name}-${activity.date}-${index}`}
          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-gray-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {activity.committee.name}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 capitalize">
                    {activity.committee.chamber} Committee
                  </span>
                  {activity.committee.url && (
                    <a
                      href={activity.committee.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.activityType)}`}>
                {formatActivityType(activity.activityType)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              {activity.activity}
            </p>
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar size={12} className="mr-1" />
              {format(new Date(activity.date), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="text-center">
          <span className="text-sm text-primary-600">
            +{committees.length - 3} more committees
          </span>
        </div>
      )}
    </div>
  );
};

export default CommitteeInfo;