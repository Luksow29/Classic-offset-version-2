// shared/api/orders.ts
// Shared order-related API utilities

import { getSupabase } from './supabaseClient';
import type {
  Order,
  OrderRequest,
  OrderInsert,
  OrderUpdate,
  OrderRequestInsert,
  OrderRequestUpdate,
  OrdersTableOrder,
  AllOrderSummary,
  PaginatedResponse,
} from '../types';

// ============================================
// Order Queries
// ============================================

/**
 * Get orders for a customer by customer_id
 */
export async function getCustomerOrders(
  customerId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: string;
    includeDeleted?: boolean;
  } = {}
): Promise<{ data: Order[] | null; error: string | null; count: number }> {
  const supabase = getSupabase();
  const { limit = 50, offset = 0, status, includeDeleted = false } = options;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeDeleted) {
    query = query.or('is_deleted.is.null,is_deleted.eq.false');
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return { data: data as Order[], error: null, count: count || 0 };
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: number): Promise<{ data: Order | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Order, error: null };
}

/**
 * Get all orders with pagination
 */
export async function getAllOrders(
  options: {
    page?: number;
    pageSize?: number;
    status?: string;
    searchTerm?: string;
    includeDeleted?: boolean;
  } = {}
): Promise<PaginatedResponse<Order> & { error: string | null }> {
  const supabase = getSupabase();
  const { page = 1, pageSize = 50, status, searchTerm, includeDeleted = false } = options;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!includeDeleted) {
    query = query.or('is_deleted.is.null,is_deleted.eq.false');
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (searchTerm) {
    query = query.or(
      `customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,order_type.ilike.%${searchTerm}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return {
      data: [],
      count: 0,
      page,
      pageSize,
      totalPages: 0,
      error: error.message,
    };
  }

  const totalCount = count || 0;
  return {
    data: data as Order[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    error: null,
  };
}

/**
 * Create a new order
 */
export async function createOrder(
  order: OrderInsert
): Promise<{ data: Order | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Order, error: null };
}

/**
 * Update an order
 */
export async function updateOrder(
  orderId: number,
  updates: OrderUpdate
): Promise<{ data: Order | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Order, error: null };
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<{ success: boolean; error: string | null }> {
  const result = await updateOrder(orderId, { status } as OrderUpdate);
  return { success: !result.error, error: result.error };
}

/**
 * Soft delete an order
 */
export async function deleteOrder(orderId: number): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('orders')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// Order Request Queries
// ============================================

/**
 * Get order requests for a customer
 */
export async function getCustomerOrderRequests(
  customerId: string,
  options: {
    limit?: number;
    status?: string;
  } = {}
): Promise<{ data: OrderRequest[] | null; error: string | null }> {
  const supabase = getSupabase();
  const { limit = 50, status } = options;

  let query = supabase
    .from('order_requests')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as OrderRequest[], error: null };
}

/**
 * Get pending order requests (for admin)
 */
export async function getPendingOrderRequests(): Promise<{
  data: (OrderRequest & { customer?: { name: string } })[] | null;
  error: string | null;
}> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('order_requests')
    .select(`
      *,
      customer:customers (name)
    `)
    .in('pricing_status', ['pending', 'quoted', 'accepted'])
    .neq('status', 'rejected')
    .order('created_at', { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Create a new order request
 */
export async function createOrderRequest(
  request: OrderRequestInsert
): Promise<{ data: OrderRequest | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('order_requests')
    .insert(request)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as OrderRequest, error: null };
}

/**
 * Update an order request
 */
export async function updateOrderRequest(
  requestId: number,
  updates: OrderRequestUpdate
): Promise<{ data: OrderRequest | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('order_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as OrderRequest, error: null };
}

/**
 * Update order request pricing status
 */
export async function updateRequestPricingStatus(
  requestId: number,
  pricingStatus: string,
  additionalUpdates?: Partial<OrderRequestUpdate>
): Promise<{ success: boolean; error: string | null }> {
  const result = await updateOrderRequest(requestId, {
    pricing_status: pricingStatus,
    ...additionalUpdates,
  } as OrderRequestUpdate);
  return { success: !result.error, error: result.error };
}

/**
 * Approve an order request and create an order
 */
export async function approveOrderRequest(
  requestId: number,
  orderData: Partial<OrderInsert>
): Promise<{ order: Order | null; error: string | null }> {
  const supabase = getSupabase();

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from('order_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { order: null, error: fetchError?.message || 'Request not found' };
  }

  // Create the order
  const { data: order, error: orderError } = await createOrder({
    customer_id: request.customer_id,
    date: new Date().toISOString().split('T')[0],
    ...orderData,
  } as OrderInsert);

  if (orderError) {
    return { order: null, error: orderError };
  }

  // Update request status
  await updateOrderRequest(requestId, {
    status: 'approved',
    pricing_status: 'approved',
  });

  return { order, error: null };
}

/**
 * Reject an order request
 */
export async function rejectOrderRequest(
  requestId: number,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  const result = await updateOrderRequest(requestId, {
    status: 'rejected',
    rejection_reason: reason,
  });
  return { success: !result.error, error: result.error };
}

// ============================================
// Order Summary Views
// ============================================

/**
 * Get order summary with dues from the database view
 */
export async function getOrderSummaryWithDues(
  options: { customerId?: string; limit?: number } = {}
): Promise<{ data: AllOrderSummary[] | null; error: string | null }> {
  const supabase = getSupabase();
  const { customerId, limit = 100 } = options;

  let query = supabase
    .from('all_order_summary')
    .select('*')
    .order('order_date', { ascending: false })
    .limit(limit);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as AllOrderSummary[], error: null };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate order totals
 */
export function calculateOrderTotals(order: {
  quantity: number;
  rate: number | null;
  service_charge_amount?: number | null;
  amount_received?: number | null;
}): {
  subtotal: number;
  serviceCharge: number;
  total: number;
  balance: number;
} {
  const subtotal = order.quantity * (order.rate || 0);
  const serviceCharge = order.service_charge_amount || 0;
  const total = subtotal + serviceCharge;
  const balance = total - (order.amount_received || 0);

  return { subtotal, serviceCharge, total, balance };
}

/**
 * Transform order to table display format
 */
export function toOrdersTableFormat(order: Order): OrdersTableOrder {
  return {
    order_id: order.id,
    customer_name: order.customer_name,
    order_type: order.order_type,
    quantity: order.quantity,
    date: order.date,
    delivery_date: order.delivery_date || '',
    status: order.status || 'pending',
    customer_phone: order.customer_phone || undefined,
    total_amount: order.total_amount,
    amount_received: order.amount_received || undefined,
    balance_amount: order.balance_amount || undefined,
    is_deleted: order.is_deleted || undefined,
  };
}
