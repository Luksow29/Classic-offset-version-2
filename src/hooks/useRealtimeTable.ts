import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeTableProps {
  tableName: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string; // e.g. "user_id=eq.123"
  enabled?: boolean;
}

/**
 * A reusable hook to subscribe to Supabase Realtime changes for a specific table.
 * 
 * @param tableName - The name of the table to listen to (e.g., 'orders', 'inventory_items').
 * @param onInsert - Callback function triggered when a new row is inserted.
 * @param onUpdate - Callback function triggered when a row is updated.
 * @param onDelete - Callback function triggered when a row is deleted.
 * @param filter - Optional filter string to listen to specific rows (e.g., "id=eq.1").
 * @param enabled - Whether the subscription should be active (default: true).
 */
export function useRealtimeTable({
  tableName,
  onInsert,
  onUpdate,
  onDelete,
  filter,
  enabled = true
}: UseRealtimeTableProps) {

  useEffect(() => {
    if (!enabled) return;

    const channelName = `public:${tableName}${filter ? `:${filter}` : ''}`;
    let channel: RealtimeChannel;

    console.log(`[useRealtimeTable] Subscribing to ${channelName}`);

    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter,
        },
        (payload) => {
          console.log(`[useRealtimeTable] Event received on ${tableName}:`, payload.eventType);
          
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useRealtimeTable] Subscription status for ${tableName}:`, status);
      });

    return () => {
      console.log(`[useRealtimeTable] Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [tableName, filter, enabled, onInsert, onUpdate, onDelete]);
}
