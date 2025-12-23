// src/lib/supabaseClient.ts
// Now uses shared Supabase client factory for consistency
import { getSupabase } from '@classic-offset/shared';

// Re-export the shared client for backward compatibility
export const supabase = getSupabase();
