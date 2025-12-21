import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase/client';
import type { TimelineEvent } from '@/features/orders/components/Timeline';

interface UseOrderTimelineOptions {
  enabled?: boolean;
}

interface UseOrderTimelineResult {
  events: TimelineEvent[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useOrderTimeline(
  orderId: number,
  options: UseOrderTimelineOptions = {}
): UseOrderTimelineResult {
  const { enabled = true } = options;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!enabled || !orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('order_status_log')
        .select('id, status, updated_at')
        .eq('order_id', orderId)
        .order('updated_at', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const mappedEvents: TimelineEvent[] = (data || []).map((log) => ({
        id: log.id,
        status: log.status,
        timestamp: log.updated_at,
      }));

      setEvents(mappedEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch timeline'));
    } finally {
      setIsLoading(false);
    }
  }, [orderId, enabled]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Set up real-time subscription for status updates
  useEffect(() => {
    if (!enabled || !orderId) return;

    const channel = supabase
      .channel(`order-timeline-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_status_log',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchTimeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, enabled, fetchTimeline]);

  return {
    events,
    isLoading,
    error,
    refresh: fetchTimeline,
  };
}
