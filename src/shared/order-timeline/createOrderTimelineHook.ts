import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  OrderTimelineActorType,
  OrderTimelineEvent,
  OrderTimelineEventType,
} from './types';

interface OrderTimelineRow {
  event_id: string;
  order_id: number;
  event_type: string | null;
  actor_type: string | null;
  actor_id: string | null;
  actor_name: string | null;
  occurred_at: string;
  title: string | null;
  message: string | null;
  metadata: Record<string, any> | null;
}

export interface UseOrderTimelineReturn {
  events: OrderTimelineEvent[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const toEvent = (row: OrderTimelineRow): OrderTimelineEvent => ({
  event_id: row.event_id,
  order_id: row.order_id,
  event_type: (row.event_type ?? 'status_update') as OrderTimelineEventType,
  actor_type: (row.actor_type ?? 'unknown') as OrderTimelineActorType,
  actor_id: row.actor_id,
  actor_name: row.actor_name,
  occurred_at: row.occurred_at,
  title: row.title ?? 'Untitled Event',
  message: row.message,
  metadata: row.metadata ?? null,
});

export const createOrderTimelineHook = (client: SupabaseClient) => {
  return function useOrderTimeline(
    orderId?: number | null,
    options?: { enabled?: boolean }
  ): UseOrderTimelineReturn {
    const [events, setEvents] = useState<OrderTimelineEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enabled = Boolean(orderId) && (options?.enabled ?? true);

    const refresh = useCallback(async () => {
      if (!orderId || !enabled) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data, error } = await client
        .from('order_activity_timeline' as any)
        .select('*')
        .eq('order_id', orderId)
        .order('occurred_at', { ascending: true });

      if (error) {
        setError(error.message ?? 'Unable to load order timeline.');
        setIsLoading(false);
        return;
      }

      const normalized = (data ?? []).map((row: OrderTimelineRow) => toEvent(row));
      setEvents(normalized);
      setIsLoading(false);
    }, [client, enabled, orderId]);

    useEffect(() => {
      refresh();
    }, [refresh]);

    useEffect(() => {
      if (!enabled || !orderId) return;

      const channel = client
        .channel(`order_timeline_${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_status_log',
            filter: `order_id=eq.${orderId}`,
          },
          refresh
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `order_id=eq.${orderId}`,
          },
          refresh
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          refresh
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_chat_threads',
            filter: `order_id=eq.${orderId}`,
          },
          refresh
        );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Order timeline channel error for order ${orderId}`);
        }
      });

      return () => {
        client.removeChannel(channel);
      };
    }, [client, enabled, orderId, refresh]);

    const threadIds = useMemo(() => {
      const ids = new Set<string>();
      events.forEach((event) => {
        const threadId = event.metadata?.thread_id;
        if (typeof threadId === 'string' && threadId.length > 0) {
          ids.add(threadId);
        }
      });
      return Array.from(ids);
    }, [events]);

    useEffect(() => {
      if (!enabled || !orderId || threadIds.length === 0) return;

      const filterList = threadIds.map((id) => `"${id}"`).join(',');

      const channel = client
        .channel(`order_timeline_msgs_${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_chat_messages',
            filter: `thread_id=in.(${filterList})`,
          },
          refresh
        );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Order timeline message channel error for order ${orderId}`);
        }
      });

      return () => {
        client.removeChannel(channel);
      };
    }, [client, enabled, orderId, refresh, threadIds]);

    return {
      events,
      isLoading,
      error,
      refresh,
    };
  };
};
