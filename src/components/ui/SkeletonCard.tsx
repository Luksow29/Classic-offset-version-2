import React from 'react';
import Skeleton from './Skeleton';
import Card from './Card';

interface SkeletonCardProps {
  className?: string;
  variant?: 'metric' | 'chart' | 'table' | 'default';
  hasHeader?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  variant = 'default',
  hasHeader = true
}) => {
  const renderContent = () => {
    switch (variant) {
      case 'metric':
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="60%" height="16px" animation="wave" />
              <Skeleton variant="circular" width="24px" height="24px" animation="pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" width="80%" height="32px" animation="wave" />
              <Skeleton variant="text" width="40%" height="16px" animation="pulse" />
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div className="p-6 space-y-4">
            {hasHeader && (
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton variant="text" width="40%" height="20px" animation="wave" />
                <Skeleton variant="text" width="20%" height="16px" animation="pulse" />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex justify-between items-end space-x-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    width="20px" 
                    height={`${Math.random() * 60 + 40}px`}
                    animation="pulse"
                    className="rounded-t"
                  />
                ))}
              </div>
              <div className="flex justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} variant="text" width="15px" height="12px" animation="wave" />
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="p-6 space-y-4">
            {hasHeader && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton variant="text" width="30%" height="20px" animation="wave" />
              </div>
            )}
            <div className="space-y-3">
              {/* Table Header */}
              <div className="flex space-x-4">
                <Skeleton variant="text" width="25%" height="16px" animation="pulse" />
                <Skeleton variant="text" width="20%" height="16px" animation="pulse" />
                <Skeleton variant="text" width="15%" height="16px" animation="pulse" />
                <Skeleton variant="text" width="20%" height="16px" animation="pulse" />
              </div>
              {/* Table Rows */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex space-x-4 py-2">
                  <Skeleton variant="text" width="25%" height="14px" animation="wave" />
                  <Skeleton variant="text" width="20%" height="14px" animation="wave" />
                  <Skeleton variant="text" width="15%" height="14px" animation="wave" />
                  <Skeleton variant="text" width="20%" height="14px" animation="wave" />
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-6 space-y-4">
            {hasHeader && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton variant="text" width="40%" height="20px" animation="wave" />
              </div>
            )}
            <div className="space-y-3">
              <Skeleton variant="text" width="100%" height="16px" animation="wave" />
              <Skeleton variant="text" width="80%" height="16px" animation="pulse" />
              <Skeleton variant="text" width="60%" height="16px" animation="wave" />
            </div>
          </div>
        );
    }
  };

  return (
    <Card className={`bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg ${className}`}>
      {renderContent()}
    </Card>
  );
};

export default SkeletonCard;