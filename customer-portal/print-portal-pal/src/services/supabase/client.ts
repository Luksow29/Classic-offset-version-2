// Customer Portal Supabase Client
// Now uses shared Supabase client factory for consistency across apps
import { getSupabase } from '@classic-offset/shared';

// Re-export the shared client for backward compatibility
// import { supabase } from "@/services/supabase/client";
export const supabase = getSupabase();

// Re-export types for backward compatibility
export type { Database } from './types';