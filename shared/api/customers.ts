// shared/api/customers.ts
// Shared customer-related API utilities

import { getSupabase } from './supabaseClient';
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomerSummary,
  PaginatedResponse,
} from '../types';

// ============================================
// Customer Queries
// ============================================

/**
 * Get a customer by ID
 */
export async function getCustomer(
  customerId: string
): Promise<{ data: Customer | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Customer, error: null };
}

/**
 * Get a customer by user_id (Supabase Auth ID)
 */
export async function getCustomerByUserId(
  userId: string
): Promise<{ data: Customer | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'not found' errors
    return { data: null, error: error.message };
  }

  return { data: data as Customer | null, error: null };
}

/**
 * Get all customers with pagination
 */
export async function getAllCustomers(
  options: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    customerType?: string;
  } = {}
): Promise<PaginatedResponse<Customer> & { error: string | null }> {
  const supabase = getSupabase();
  const { page = 1, pageSize = 50, searchTerm, customerType } = options;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`
    );
  }

  if (customerType) {
    query = query.eq('customer_type', customerType);
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
    data: data as Customer[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    error: null,
  };
}

/**
 * Search customers
 */
export async function searchCustomers(
  searchTerm: string,
  limit: number = 10
): Promise<{ data: Customer[] | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`
    )
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Customer[], error: null };
}

/**
 * Create a new customer
 */
export async function createCustomer(
  customer: CustomerInsert
): Promise<{ data: Customer | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Customer, error: null };
}

/**
 * Update a customer
 */
export async function updateCustomer(
  customerId: string,
  updates: CustomerUpdate
): Promise<{ data: Customer | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Customer, error: null };
}

/**
 * Delete a customer (soft delete if your schema supports it)
 */
export async function deleteCustomer(
  customerId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// Customer Summary Views
// ============================================

/**
 * Get customer summary from database view
 */
export async function getCustomerSummary(
  customerId: string
): Promise<{ data: CustomerSummary | null; error: string | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customer_summary')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as CustomerSummary, error: null };
}

/**
 * Get all customer summaries
 */
export async function getAllCustomerSummaries(
  options: { limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
): Promise<{ data: CustomerSummary[] | null; error: string | null }> {
  const supabase = getSupabase();
  const { limit = 100, sortBy = 'name', sortOrder = 'asc' } = options;

  const { data, error } = await supabase
    .from('customer_summary')
    .select('*')
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .limit(limit);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as CustomerSummary[], error: null };
}

// ============================================
// Customer Stats
// ============================================

/**
 * Get customer statistics
 */
export async function getCustomerStats(customerId: string): Promise<{
  totalOrders: number;
  totalSpent: number;
  balanceDue: number;
  loyaltyPoints: number;
  error: string | null;
}> {
  const { data: customer, error } = await getCustomer(customerId);

  if (error || !customer) {
    return {
      totalOrders: 0,
      totalSpent: 0,
      balanceDue: 0,
      loyaltyPoints: 0,
      error: error || 'Customer not found',
    };
  }

  // Get summary for balance calculation
  const { data: summary } = await getCustomerSummary(customerId);

  return {
    totalOrders: customer.total_orders || 0,
    totalSpent: customer.total_spent || 0,
    balanceDue: summary?.balance_due || 0,
    loyaltyPoints: customer.loyalty_points || 0,
    error: null,
  };
}

// ============================================
// Loyalty Points
// ============================================

/**
 * Add loyalty points to a customer
 * @param customerId - The customer ID
 * @param points - Number of points to add
 */
export async function addLoyaltyPoints(
  customerId: string,
  points: number
): Promise<{ success: boolean; newTotal: number; error: string | null }> {
  const supabase = getSupabase();

  // Get current points
  const { data: customer, error: fetchError } = await getCustomer(customerId);
  if (fetchError || !customer) {
    return { success: false, newTotal: 0, error: fetchError || 'Customer not found' };
  }

  const currentPoints = customer.loyalty_points || 0;
  const newTotal = currentPoints + points;

  const { error } = await supabase
    .from('customers')
    .update({
      loyalty_points: newTotal,
      total_points_earned: (customer.total_points_earned || 0) + (points > 0 ? points : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);

  if (error) {
    return { success: false, newTotal: currentPoints, error: error.message };
  }

  return { success: true, newTotal, error: null };
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints(
  customerId: string,
  points: number
): Promise<{ success: boolean; newTotal: number; error: string | null }> {
  const { data: customer, error: fetchError } = await getCustomer(customerId);
  if (fetchError || !customer) {
    return { success: false, newTotal: 0, error: fetchError || 'Customer not found' };
  }

  const currentPoints = customer.loyalty_points || 0;
  if (currentPoints < points) {
    return { success: false, newTotal: currentPoints, error: 'Insufficient points' };
  }

  const supabase = getSupabase();
  const newTotal = currentPoints - points;

  const { error } = await supabase
    .from('customers')
    .update({
      loyalty_points: newTotal,
      total_points_spent: (customer.total_points_spent || 0) + points,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);

  if (error) {
    return { success: false, newTotal: currentPoints, error: error.message };
  }

  return { success: true, newTotal, error: null };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format customer display name
 */
export function formatCustomerName(customer: Pick<Customer, 'name' | 'company_name'>): string {
  if (customer.company_name) {
    return `${customer.name} (${customer.company_name})`;
  }
  return customer.name;
}

/**
 * Get customer initials for avatar
 */
export function getCustomerInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
