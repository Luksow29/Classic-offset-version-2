import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // useCallback ஐச் சேர்க்கவும்
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { normalizeStaffRole, type StaffRole } from '@/lib/rbac';

interface DBUser {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
  bio: string | null;
}

interface UserProfile {
  id: string; // public.users அட்டவணையில் id உள்ளது
  name: string;
  role: StaffRole | null;
  email: string; // public.users அட்டவணையில் email உள்ளது
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  bio?: string | null;
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);



  // பயனர் சுயவிவரத்தைப் பெறுவதற்கான ஃபங்ஷனை வரையறுக்கவும்
  const fetchUserProfile = useCallback(async (supabaseUser: User) => {
    // Only set loading if we don't have a profile yet (initial load)
    // This prevents "flashing" or re-rendering loading states during background refreshes (tab switch)
    if (!userProfile) {
      setLoading(true);
    }
    try {
      // Use a generic query if possible, or cast the result clearly once
      const { data, error } = await supabase
        .from('users') // public.users அட்டவணையிலிருந்து சுயவிவரத்தைப் பெறவும்
        .select('id, name, role, email, phone, address, company, bio') // அனைத்து காலங்களையும் தேர்ந்தெடுக்கவும்
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        // If we can't load the profile, do NOT assume a role.
        setUserProfile({
          id: supabaseUser.id,
          name: supabaseUser.email || 'Unknown User',
          role: null,
          email: supabaseUser.email || '',
        });
        return; // பிழை ஏற்பட்டால், மேலும் தொடராமல் திரும்பு
      }

      const userData = data as DBUser | null;

      if (userData) {
        const normalizedRole = normalizeStaffRole(userData.role);
        // Destructure to separate role from the rest safely
        const { role, ...rest } = userData;
        setUserProfile({
          ...rest,
          role: normalizedRole,
        });
      } else {
        // பயனர் public.users அட்டவணையில் இல்லை என்றால் (எ.கா. புதிய பதிவு)
        console.warn("User profile not found in public.users for ID:", supabaseUser.id);
        setUserProfile({
          id: supabaseUser.id,
          name: supabaseUser.email || 'New User',
          role: null,
          email: supabaseUser.email || '',
        });
      }
    } catch (err: unknown) {
      console.error("Unexpected error in fetchUserProfile:", err);
      // எதிர்பாராத பிழை ஏற்பட்டால்
      setUserProfile({ id: supabaseUser.id, name: 'Error User', role: null, email: supabaseUser.email || '' });
    } finally {
      setLoading(false); // சுயவிவரத்தைப் பெற்ற பிறகு loading ஐ false ஆக அமைக்கவும்
    }
  }, []); // dependencies இல் எதுவும் இல்லை, ஏனெனில் இது supabase மற்றும் state ஐ மட்டுமே பயன்படுத்துகிறது

  useEffect(() => {
    // console.log('[TEST] UserProvider useEffect is running...');

    // ஆரம்ப அமர்வைப் பெறவும் (page refresh இல்)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchUserProfile(session.user); // ஆரம்ப அமர்வு இருந்தால் சுயவிவரத்தைப் பெறவும்
      } else {
        setLoading(false); // அமர்வு இல்லை என்றால், loading ஐ நிறுத்து
      }
    });

    // அங்கீகார நிலையில் ஏற்படும் மாற்றங்களைக் கண்காணித்தல்
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // console.log(`[TEST] onAuthStateChange triggered. Event: ${event}`);

        // Update session/user state immediately
        setSession(session);
        setUser(session?.user ?? null);

        // Only fetch profile on relevant events to avoid unnecessary network calls/reloads on focus
        // TOKEN_REFRESHED often happens on tab focus but shouldn't require a full profile refetch if we have data
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || !userProfile)) {
          fetchUserProfile(session.user);
        } else if (!session?.user) {
          // User signed out
          setUserProfile(null);
          setLoading(false);
        }
        // For TOKEN_REFRESHED with existing profile, we do nothing (keep existing profile), effectively "stable" state.
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile ஐ dependency ஆகச் சேர்க்கவும்

  const value = React.useMemo(() => ({
    session,
    user,
    userProfile,
    loading
  }), [session, user, userProfile, loading]);

  if (loading && !session) { // ஆரம்ப loading க்காக
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: '#fff' }}>
        Initializing Application...
      </div>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
