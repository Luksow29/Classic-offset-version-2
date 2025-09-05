// src/lib/supabaseErrorHandler.ts
// Centralized error handling for Supabase operations

import { PostgrestError } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export interface SupabaseErrorContext {
  operation: string;
  table?: string;
  userId?: string;
}

export class SupabaseError extends Error {
  public code: string;
  public details: string | null;
  public hint: string | null;
  public context: SupabaseErrorContext;

  constructor(error: PostgrestError, context: SupabaseErrorContext) {
    super(error.message);
    this.name = 'SupabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
    this.context = context;
  }
}

export const handleSupabaseError = (
  error: PostgrestError | null,
  context: SupabaseErrorContext,
  showToast: boolean = true
): SupabaseError | null => {
  if (!error) return null;

  const supabaseError = new SupabaseError(error, context);

  // Handle specific error codes
  switch (error.code) {
    case 'PGRST116': // No rows returned
      if (context.operation === 'select_single') {
        // This is expected for optional data, don't show error
        return null;
      }
      break;
    
    case 'PGRST301': // RLS policy violation
      if (showToast) {
        toast.error('Access denied: You don\'t have permission to perform this action');
      }
      break;
    
    case '23505': // Unique constraint violation
      if (showToast) {
        toast.error('This record already exists');
      }
      break;
    
    case '23503': // Foreign key constraint violation
      if (showToast) {
        toast.error('Cannot delete: This record is referenced by other data');
      }
      break;
    
    case '42P01': // Table doesn't exist
      if (showToast) {
        toast.error('Database table not found. Please contact support.');
      }
      break;
    
    default:
      if (showToast) {
        toast.error(`Database error: ${error.message}`);
      }
  }

  console.error('Supabase Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    context
  });

  return supabaseError;
};

// Helper function for safe single row queries
export const safeSingleQuery = async <T>(
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>,
  context: SupabaseErrorContext
): Promise<{ data: T | null; error: SupabaseError | null }> => {
  try {
    const { data, error } = await queryPromise;
    const handledError = handleSupabaseError(error, context, false);
    return { data, error: handledError };
  } catch (err) {
    console.error('Query execution failed:', err);
    return { 
      data: null, 
      error: new SupabaseError(
        { code: 'QUERY_FAILED', message: 'Query execution failed', details: null, hint: null } as PostgrestError,
        context
      )
    };
  }
};

// Helper function for safe multi-row queries
export const safeMultiQuery = async <T>(
  queryPromise: Promise<{ data: T[] | null; error: PostgrestError | null }>,
  context: SupabaseErrorContext
): Promise<{ data: T[] | null; error: SupabaseError | null }> => {
  try {
    const { data, error } = await queryPromise;
    const handledError = handleSupabaseError(error, context, false);
    return { data: data || [], error: handledError };
  } catch (err) {
    console.error('Query execution failed:', err);
    return { 
      data: [], 
      error: new SupabaseError(
        { code: 'QUERY_FAILED', message: 'Query execution failed', details: null, hint: null } as PostgrestError,
        context
      )
    };
  }
};