import React from 'react';
import { LegislativeStatus } from '../../types/types';

interface StatusBadgeProps {
  status: LegislativeStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: LegislativeStatus): { label: string; className: string } => {
    switch (status) {
      case 'introduced':
        return {
          label: 'Introduced',
          className: 'bg-gray-100 text-gray-800'
        };
      case 'referred_to_committee':
        return {
          label: 'In Committee',
          className: 'bg-gray-100 text-gray-800'
        };
      case 'reported_by_committee':
        return {
          label: 'Reported',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'passed_house':
        return {
          label: 'Passed House',
          className: 'bg-primary-100 text-primary-800'
        };
      case 'passed_senate':
        return {
          label: 'Passed Senate',
          className: 'bg-primary-100 text-primary-800'
        };
      case 'to_president':
        return {
          label: 'To President',
          className: 'bg-accent-100 text-accent-800'
        };
      case 'signed':
        return {
          label: 'Signed',
          className: 'bg-success-100 text-success-800'
        };
      case 'enacted':
        return {
          label: 'Enacted',
          className: 'bg-success-100 text-success-800'
        };
      case 'vetoed':
        return {
          label: 'Vetoed',
          className: 'bg-error-100 text-error-800'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;