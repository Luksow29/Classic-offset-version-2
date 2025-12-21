import React from 'react';
import { CheckCircle, Package, Truck, CircleDot, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';

export interface TimelineEvent {
  id: string | number;
  status: string;
  timestamp: string;
  description?: string;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  emptyMessage?: string;
}

// Map status names to specific icons for a better visual experience
const statusIcons: { [key: string]: React.ElementType } = {
  "Order Placed": Package,
  "order_placed": Package,
  "Design in Progress": CircleDot,
  "design_in_progress": CircleDot,
  "Printing": Package,
  "printing": Package,
  "Ready for Pickup": Package,
  "ready_for_pickup": Package,
  "Delivered": Truck,
  "delivered": Truck,
  "Completed": CheckCircle,
  "completed": CheckCircle,
  "Pending": CircleDot,
  "pending": CircleDot,
  "Processing": CircleDot,
  "processing": CircleDot,
  "default": CircleDot,
};

const getStatusIcon = (status: string): React.ElementType => {
  return statusIcons[status] || statusIcons.default;
};

/**
 * A reusable component to render a vertical timeline of order events.
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  events,
  isLoading = false,
  error = null,
  onRetry,
  title,
  emptyMessage = "No events to display.",
}) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">Failed to load timeline</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  // Sort events from oldest to newest for chronological display
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      {title && (
        <h4 className="font-semibold mb-4 text-sm">{title}</h4>
      )}
      <ol className="relative ml-2 border-l border-gray-200 dark:border-gray-700">
        {sortedEvents.map((event, index) => {
          const Icon = getStatusIcon(event.status);

          return (
            <li key={event.id || index} className="mb-6 ml-6 last:mb-0">
              <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                <Icon className="w-3.5 h-3.5 text-blue-800 dark:text-blue-300" />
              </span>
              <h3 className="flex items-center mb-1 text-md font-semibold text-gray-900 dark:text-white">
                {event.status}
              </h3>
              <time className="block text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </time>
              {event.description && (
                <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default OrderTimeline;
