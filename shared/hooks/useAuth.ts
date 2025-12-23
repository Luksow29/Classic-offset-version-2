// shared/hooks/useAuth.ts
// Shared authentication hook for both apps

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '../api/supabaseClient';
import type { Session, AuthUser } from '../api/supabaseClient';

export interface UseAuthReturn {
  /** Current authenticated user */
  user: AuthUser | null;
  /** Current session */
  session: Session | null;
  /** Whether auth is being checked */
  loading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign up with email and password */
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Refresh session */
  refreshSession: () => Promise<void>;
}

/**
 * Shared authentication hook
 * Works in both Main App and Customer Portal
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { user, loading, signOut } = useAuth();
 *   
 *   if (loading) return <Spinner />;
 *   if (!user) return <Navigate to="/login" />;
 *   
 *   return <Dashboard user={user} onLogout={signOut} />;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { error: error.message, needsConfirmation: false };
      }

      // Check if email confirmation is required
      const needsConfirmation = !data.session;
      return { error: null, needsConfirmation };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Sign up failed',
        needsConfirmation: false,
      };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.refreshSession();
    setSession(session);
    setUser(session?.user ?? null);
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
}
