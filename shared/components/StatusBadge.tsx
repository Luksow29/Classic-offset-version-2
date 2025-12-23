// shared/components/StatusBadge.tsx
// Universal status badge component for both apps

import React from 'react';
import type { OrderStatus, PaymentStatus } from '../types';

export interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'ticket' | 'priority' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Color mappings for different status types
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  // Order statuses
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
  confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  design: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
  printing: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
  in_progress: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
  delivered: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },

  // Payment statuses
  paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
  partial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
  overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },

  // Ticket statuses
  open: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  waiting_customer: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
  resolved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
  closed: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-300' },

  // Priority levels
  low: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-300' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
  urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },

  // Default
  default: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-300' },
};

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  design: 'Design',
  printing: 'Printing',
  in_progress: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  open: 'Open',
  waiting_customer: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Size mappings
const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Get color classes for a status
 */
function getStatusColors(status: string): { bg: string; text: string } {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.default;
}

/**
 * Get display label for a status
 */
function getStatusLabel(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return STATUS_LABELS[normalizedStatus] || status;
}

/**
 * Universal status badge component
 * Works with Tailwind CSS - both apps use Tailwind
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const colors = getStatusColors(status);
  const label = getStatusLabel(status);
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        ${colors.bg} ${colors.text}
        ${sizeClasses}
        ${className}
      `.trim()}
    >
      {label}
    </span>
  );
};

/**
 * Order status badge with proper typing
 */
export const OrderStatusBadge: React.FC<{
  status: OrderStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = (props) => <StatusBadge {...props} type="order" />;

/**
 * Payment status badge with proper typing
 */
export const PaymentStatusBadge: React.FC<{
  status: PaymentStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = (props) => <StatusBadge {...props} type="payment" />;

export default StatusBadge;
