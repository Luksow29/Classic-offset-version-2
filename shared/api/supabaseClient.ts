// shared/api/supabaseClient.ts
// Shared Supabase client factory for both Main App and Customer Portal

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Configuration options for creating a Supabase client
 */
export interface SupabaseClientConfig {
  /** Whether to persist auth session in localStorage */
  persistSession?: boolean;
  /** Whether to auto-refresh auth tokens */
  autoRefreshToken?: boolean;
  /** Events per second for realtime subscriptions */
  realtimeEventsPerSecond?: number;
  /** Custom storage for auth (defaults to localStorage) */
  storage?: Storage;
}

const DEFAULT_CONFIG: Required<SupabaseClientConfig> = {
  persistSession: true,
  autoRefreshToken: true,
  realtimeEventsPerSecond: 10,
  storage: typeof window !== 'undefined' ? localStorage : ({} as Storage),
};

/**
 * Create a new Supabase client instance with standardized configuration
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const supabase = createAppSupabaseClient();
 * 
 * // With custom config
 * const supabase = createAppSupabaseClient({
 *   persistSession: false,
 *   realtimeEventsPerSecond: 5,
 * });
 * ```
 */
export function createAppSupabaseClient(config: SupabaseClientConfig = {}): SupabaseClient {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('[Supabase] Missing VITE_SUPABASE_URL environment variable');
  }

  if (!supabaseKey) {
    throw new Error('[Supabase] Missing VITE_SUPABASE_ANON_KEY environment variable');
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: mergedConfig.storage,
      persistSession: mergedConfig.persistSession,
      autoRefreshToken: mergedConfig.autoRefreshToken,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: mergedConfig.realtimeEventsPerSecond,
      },
    },
    global: {
      headers: {
        'x-app-version': '2.0.0',
      },
    },
  });
}

// ============================================
// Singleton Instance Management
// ============================================

let clientInstance: SupabaseClient | null = null;

/**
 * Get the shared Supabase client instance (singleton pattern)
 * Creates the client on first call, returns existing instance on subsequent calls
 * 
 * @example
 * ```typescript
 * const supabase = getSupabase();
 * const { data } = await supabase.from('orders').select('*');
 * ```
 */
export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createAppSupabaseClient();
  }
  return clientInstance;
}

/**
 * Reset the singleton instance (useful for testing or re-initialization)
 */
export function resetSupabaseClient(): void {
  clientInstance = null;
}

/**
 * Check if Supabase environment variables are configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

/**
 * Get Supabase URL for direct API calls (e.g., Edge Functions)
 */
export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('[Supabase] Missing VITE_SUPABASE_URL environment variable');
  }
  return url;
}

// ============================================
// Type exports for consumers
// ============================================

export type { SupabaseClient };
export type { Session, User as AuthUser } from '@supabase/supabase-js';
