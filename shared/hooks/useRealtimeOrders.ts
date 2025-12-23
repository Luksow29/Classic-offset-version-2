// shared/hooks/useRealtimeOrders.ts
// Shared hook for real-time order subscriptions

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabase } from '../api/supabaseClient';
import type { Order } from '../types';

export interface UseRealtimeOrdersOptions {
  /** Customer ID to filter orders (required for customer portal) */
  customerId?: string;
  /** Whether to enable the subscription (default: true) */
  enabled?: boolean;
  /** Callback when an order is updated */
  onOrderUpdate?: (order: Order, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  /** Whether to include deleted orders */
  includeDeleted?: boolean;
}

export interface UseRealtimeOrdersReturn {
  /** List of orders */
  orders: Order[];
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh orders from database */
  refresh: () => Promise<void>;
}

/**
 * Hook for real-time order subscriptions
 * 
 * @example
 * ```tsx
 * // Customer Portal - filter by customer
 * const { orders, loading } = useRealtimeOrders({
 *   customerId: customer.id,
 *   onOrderUpdate: (order) => toast.info(`Order #${order.id} updated`)
 * });
 * 
 * // Admin - all orders
 * const { orders } = useRealtimeOrders({
 *   onOrderUpdate: (order, type) => console.log(type, order.id)
 * });
 * ```
 */
export function useRealtimeOrders(
  options: UseRealtimeOrdersOptions = {}
): UseRealtimeOrdersReturn {
  const {
    customerId,
    enabled = true,
    onOrderUpdate,
    includeDeleted = false,
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const onOrderUpdateRef = useRef(onOrderUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (!includeDeleted) {
        query = query.or('is_deleted.is.null,is_deleted.eq.false');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data || []) as Order[]);
      setError(null);
    } catch (err) {
      console.error('[useRealtimeOrders] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [customerId, includeDeleted]);

  // Setup realtime subscription
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchOrders();

    const supabase = getSupabase();
    const channelName = customerId 
      ? `orders:customer:${customerId}:${Date.now()}`
      : `orders:all:${Date.now()}`;
    
    console.log('[useRealtimeOrders] Setting up subscription:', channelName);

    // Build filter if customer-specific
    const filter = customerId ? `customer_id=eq.${customerId}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          ...(filter && { filter }),
        },
        (payload) => {
          console.log('[useRealtimeOrders] New order:', payload);
          const newOrder = payload.new as Order;
          
          setOrders(prev => [newOrder, ...prev]);

          if (onOrderUpdateRef.current) {
            onOrderUpdateRef.current(newOrder, 'INSERT');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          ...(filter && { filter }),
        },
        (payload) => {
          console.log('[useRealtimeOrders] Order updated:', payload);
          const updated = payload.new as Order;
          
          setOrders(prev =>
            prev.map(o => (o.id === updated.id ? updated : o))
          );

          if (onOrderUpdateRef.current) {
            onOrderUpdateRef.current(updated, 'UPDATE');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          ...(filter && { filter }),
        },
        (payload) => {
          console.log('[useRealtimeOrders] Order deleted:', payload);
          const deleted = payload.old as { id: number };
          
          setOrders(prev => prev.filter(o => o.id !== deleted.id));

          if (onOrderUpdateRef.current) {
            onOrderUpdateRef.current({ id: deleted.id } as Order, 'DELETE');
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeOrders] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('[useRealtimeOrders] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [customerId, enabled, fetchOrders]);

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
  };
}
