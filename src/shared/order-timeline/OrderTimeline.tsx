import React, { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  MessageCircle,
  PackageCheck,
  UserCircle2,
} from 'lucide-react';
import type { OrderTimelineEvent, OrderTimelineEventType } from './types';

interface OrderTimelineProps {
  events: OrderTimelineEvent[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void | Promise<void>;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

type EventConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dotClass: string;
  iconClass: string;
  badgeClass: string;
};

const EVENT_CONFIG: Record<OrderTimelineEventType, EventConfig> = {
  order_created: {
    label: 'Order Created',
    icon: PackageCheck,
    dotClass: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',
    iconClass: 'text-sky-600 dark:text-sky-300',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
  },
  status_update: {
    label: 'Status Update',
    icon: CheckCircle2,
    dotClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
    iconClass: 'text-indigo-600 dark:text-indigo-300',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
  },
  chat_message: {
    label: 'Chat Message',
    icon: MessageCircle,
    dotClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    iconClass: 'text-emerald-600 dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  },
  payment_recorded: {
    label: 'Payment',
    icon: IndianRupee,
    dotClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    iconClass: 'text-amber-600 dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
  },
};

const formatCurrency = (value?: number | null) => {
  if (typeof value !== 'number') return null;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

const isValidDate = (value: string | undefined): boolean => !Number.isNaN(new Date(value ?? '').getTime());

const renderMetadata = (event: OrderTimelineEvent) => {
  if (!event.metadata) return null;

  if (event.event_type === 'payment_recorded') {
    const amount = formatCurrency(event.metadata.amount ?? event.metadata.payment_amount);
    const method = event.metadata.method ?? event.metadata.payment_method;
    const status = event.metadata.status;
    const notes = event.metadata.notes;

    return (
      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        {amount && (
          <div>
            <span className="font-medium text-foreground">Amount:</span> {amount}
          </div>
        )}
        {method && (
          <div>
            <span className="font-medium text-foreground">Method:</span> {method}
          </div>
        )}
        {status && (
          <div>
            <span className="font-medium text-foreground">Status:</span> {status}
          </div>
        )}
        {notes && (
          <div className="sm:col-span-2">
            <span className="font-medium text-foreground">Notes:</span> {notes}
          </div>
        )}
      </div>
    );
  }

  if (event.event_type === 'chat_message') {
    const fileUrl = event.metadata.file_url;
    if (!fileUrl) return null;

    const fileName = event.metadata.file_name ?? 'Attachment';
    const size = event.metadata.file_size;

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-2 rounded-md border border-muted-foreground/20 px-3 py-2 text-xs text-foreground hover:bg-muted"
      >
        <FileText className="h-4 w-4" />
        <span className="font-medium">{fileName}</span>
        {typeof size === 'number' && size > 0 && (
          <span className="text-muted-foreground">
            ({Math.round(size / 1024)} KB)
          </span>
        )}
      </a>
    );
  }

  return null;
};

const actorLabel = (event: OrderTimelineEvent) => {
  if (event.actor_name) return event.actor_name;
  if (event.actor_type === 'customer') return 'Customer';
  if (event.actor_type === 'admin') return 'Admin';
  if (event.actor_type === 'system') return 'System';
  return 'Unknown';
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  events,
  isLoading = false,
  error = null,
  onRetry,
  title = 'Order Activity',
  emptyMessage = 'No activity recorded for this order yet.',
  className = '',
}) => {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = new Date(a.occurred_at).getTime();
      const bDate = new Date(b.occurred_at).getTime();
      return aDate - bDate;
    });
  }, [events]);

  return (
    <div className={`rounded-lg border border-border bg-background shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">Chronological log of order updates across teams.</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry()}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <Clock className="h-3.5 w-3.5" /> Refresh
            </button>
          )}
        </div>
      )}

      <div className="px-4 py-4">
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex animate-pulse items-start gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-6 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-4 text-destructive">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Unable to load timeline
            </div>
            <p className="text-xs text-destructive/80">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry()}
                className="inline-flex items-center gap-1 rounded border border-destructive px-2 py-1 text-xs font-medium hover:bg-destructive hover:text-destructive-foreground"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && sortedEvents.length === 0 && (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}

        {!isLoading && !error && sortedEvents.length > 0 && (
          <ol className="relative space-y-6 border-l border-border/60 pl-5">
            {sortedEvents.map((event) => {
              const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.status_update;
              const Icon = config.icon;
              const occurredAt = isValidDate(event.occurred_at)
                ? new Date(event.occurred_at)
                : null;

              return (
                <li key={event.event_id} className="relative">
                  <span
                    className={`absolute -left-8 top-0 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${config.dotClass}`}
                  >
                    <Icon className={`h-4 w-4 ${config.iconClass}`} />
                  </span>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {occurredAt && (
                      <span>
                        {format(occurredAt, 'PPpp')} • {formatDistanceToNow(occurredAt, { addSuffix: true })}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-foreground">{event.title}</div>

                  {event.message && (
                    <div className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {event.message}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCircle2 className="h-4 w-4" />
                    <span>{actorLabel(event)}</span>
                  </div>

                  {renderMetadata(event)}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

OrderTimeline.displayName = 'OrderTimeline';
