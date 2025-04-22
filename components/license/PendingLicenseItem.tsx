import React from 'react';

interface PendingLicenseItemProps {
  software: string;
  planType: string;
  requestedBy: string;
  date: string;
  price: number;
  onApprove: () => void;
  onReject: () => void;
}

const PendingLicenseItem: React.FC<PendingLicenseItemProps> = ({
  software,
  planType,
  requestedBy,
  date,
  price,
  onApprove,
  onReject,
}) => {
  // Función para determinar el color del badge según el tipo de plan
  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pro':
        return 'bg-amber-900 text-amber-400';
      case 'team':
        return 'bg-blue-900 text-blue-400';
      case 'business':
        return 'bg-purple-900 text-purple-400';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const badgeClasses = getBadgeColor(planType);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4 px-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="text-xl text-gray-900 dark:text-white font-medium">{software}</span>
            <span className={`ml-2 px-2 py-0.5 text-xs rounded ${badgeClasses}`}>
              {planType}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Requested by {requestedBy} • {date}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-xl font-medium text-gray-900 dark:text-white">€{price.toFixed(2)}</span>
          <div className="flex space-x-2">
            <button
              onClick={onReject}
              className="px-3 py-1 bg-transparent border border-red-500 text-red-500 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-30 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              className="px-3 py-1 bg-transparent border border-green-500 text-green-500 dark:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900 dark:hover:bg-opacity-30 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingLicenseItem; 