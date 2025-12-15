import React from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import { useLocalAgent } from '../../hooks/useLocalAgent';

interface BusinessQueryTriggerProps {
  queryType: string;
  label: string;
  customPrompt?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  onQuerySent?: () => void;
}

export const BusinessQueryTrigger: React.FC<BusinessQueryTriggerProps> = ({
  queryType,
  label,
  customPrompt,
  variant = 'outline',
  size = 'sm',
  icon,
  className = '',
  onQuerySent,
}) => {
  const { sendBusinessQuery, isLoading, isStreaming, isHealthy } = useLocalAgent();

  const handleClick = async () => {
    if (!isHealthy) {
      // You could show a toast here or navigate to the Local Agent setup page
      console.warn('Local Agent is not connected');
      return;
    }

    try {
      await sendBusinessQuery(queryType, customPrompt);
      onQuerySent?.();
    } catch (error) {
      console.error('Failed to send business query:', error);
    }
  };

  const isDisabled = isLoading || isStreaming || !isHealthy;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center gap-2 ${className}`}
      title={isHealthy ? `Ask Local AI about ${label}` : 'Local AI is not connected'}
    >
      {icon || <Bot className="w-4 h-4" />}
      <span>{label}</span>
      {(isLoading || isStreaming) && (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
    </Button>
  );
};

// Quick trigger buttons for common business queries
export const RecentOrdersTrigger: React.FC<{ className?: string; onQuerySent?: () => void }> = ({ className, onQuerySent }) => (
  <BusinessQueryTrigger
    queryType="recent-orders"
    label="Recent Orders"
    icon={<MessageSquare className="w-4 h-4" />}
    className={className}
    onQuerySent={onQuerySent}
  />
);

export const DuePaymentsTrigger: React.FC<{ className?: string; onQuerySent?: () => void }> = ({ className, onQuerySent }) => (
  <BusinessQueryTrigger
    queryType="due-payments"
    label="Due Payments"
    icon={<Bot className="w-4 h-4" />}
    className={className}
    onQuerySent={onQuerySent}
  />
);

export const DailyBriefingTrigger: React.FC<{ className?: string; onQuerySent?: () => void }> = ({ className, onQuerySent }) => (
  <BusinessQueryTrigger
    queryType="daily-briefing"
    label="Daily Briefing"
    icon={<Bot className="w-4 h-4" />}
    className={className}
    onQuerySent={onQuerySent}
  />
);

export const TopCustomersTrigger: React.FC<{ className?: string; onQuerySent?: () => void }> = ({ className, onQuerySent }) => (
  <BusinessQueryTrigger
    queryType="top-customers"
    label="Top Customers"
    icon={<Bot className="w-4 h-4" />}
    className={className}
    onQuerySent={onQuerySent}
  />
);

export default BusinessQueryTrigger;
