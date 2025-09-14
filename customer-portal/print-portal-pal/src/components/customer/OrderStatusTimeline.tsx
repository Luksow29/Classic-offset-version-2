
import React from 'react';
import { CheckCircle, Package, Truck, CircleDot } from 'lucide-react';

// Define the shape of a single status log entry
interface StatusLog {
  status: string;
  updated_at: string;
}

// Define the props for our timeline component
interface OrderStatusTimelineProps {
  history: StatusLog[];
}

// Map status names to specific icons for a better visual experience
const statusIcons: { [key: string]: React.ElementType } = {
  "Order Placed": Package,
  "Design in Progress": CircleDot,
  "Printing": Package,
  "Ready for Pickup": Package,
  "Delivered": Truck,
  "Completed": CheckCircle,
  // Add a default icon for any other status
  "default": CircleDot,
};

/**
 * A component to render a vertical timeline of an order's status history.
 */
export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ history }) => {
  // Show a message if there's no history to display
  if (!history || history.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No status history available for this order.</p>;
  }

  // Sort history from oldest to newest for chronological display
  const sortedHistory = [...history].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  return (
    <div className="p-4 bg-muted/50">
      <ol className="relative ml-2 border-l border-gray-200 dark:border-gray-700">
        {sortedHistory.map((log, index) => {
          // Select an icon based on the status, or use the default
          const Icon = statusIcons[log.status] || statusIcons.default;
          
          return (
            <li key={index} className="mb-6 ml-6">
              <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                <Icon className="w-3.5 h-3.5 text-blue-800 dark:text-blue-300" />
              </span>
              <h3 className="flex items-center mb-1 text-md font-semibold text-gray-900 dark:text-white">
                {log.status}
              </h3>
              <time className="block text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                {new Date(log.updated_at).toLocaleString()}
              </time>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
