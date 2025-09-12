import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // useCallback ஐச் சேர்க்கவும்
import { supabase } from '@/lib/supabaseClient';
import { safeSingleQuery } from '@/lib/supabaseErrorHandler';
import type { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string; // public.users அட்டவணையில் id உள்ளது
  name: string;
  role: 'Owner' | 'Manager' | 'Staff' | null;
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
    setLoading(true);
    try {
      const { data, error } = await safeSingleQuery(
        supabase
        .from('users') // public.users அட்டவணையிலிருந்து சுயவிவரத்தைப் பெறவும்
        .select('id, name, role, email, phone, address, company, bio') // அனைத்து காலங்களையும் தேர்ந்தெடுக்கவும்
        .eq('id', supabaseUser.id)
        .maybeSingle() as Promise<{ data: any | null; error: PostgrestError | null }>,
        { operation: 'select_single', table: 'users', userId: supabaseUser.id }
      );

      if (error) {
        console.error("Error fetching user profile:", error);
        // பிழை ஏற்பட்டால், ஒரு குறைந்தபட்ச சுயவிவரத்தை அமைக்கவும்
        setUserProfile({ id: supabaseUser.id, name: supabaseUser.email || 'Guest', role: 'Staff', email: supabaseUser.email || '' });
        return; // பிழை ஏற்பட்டால், மேலும் தொடராமல் திரும்பு
      }

      if (data) {
        setUserProfile(data as UserProfile); // தரவை UserProfile ஆக மாற்றவும்
      } else {
        // பயனர் public.users அட்டவணையில் இல்லை என்றால் (எ.கா. புதிய பதிவு)
        console.warn("User profile not found in public.users for ID:", supabaseUser.id, "Setting default profile.");
        setUserProfile({ id: supabaseUser.id, name: supabaseUser.email || 'New User', role: 'Staff', email: supabaseUser.email || '' });
      }
    } catch (err: any) {
      console.error("Unexpected error in fetchUserProfile:", err);
      // எதிர்பாராத பிழை ஏற்பட்டால்
      setUserProfile({ id: supabaseUser.id, name: 'Error User', role: null, email: '' });
    } finally {
      setLoading(false); // சுயவிவரத்தைப் பெற்ற பிறகு loading ஐ false ஆக அமைக்கவும்
    }
  }, []); // dependencies இல் எதுவும் இல்லை, ஏனெனில் இது supabase மற்றும் state ஐ மட்டுமே பயன்படுத்துகிறது

  useEffect(() => {
    console.log('[TEST] UserProvider useEffect is running...');

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
      (_event, session) => {
        console.log(`[TEST] onAuthStateChange triggered. Event: ${_event}`);
        setSession(session);
        setUser(session?.user ?? null);

        // ✅ உண்மையான சுயவிவரம் பெறும் தர்க்கத்தை செயல்படுத்துதல்
        if (session?.user) {
          fetchUserProfile(session.user); // பயனர் உள்நுழைந்தால் சுயவிவரத்தைப் பெறவும்
        } else {
          setUserProfile(null); // பயனர் வெளியேறினால் சுயவிவரத்தை நீக்கவும்
          setLoading(false); // loading ஐ நிறுத்து
        }
        // console.log('[TEST] Loading finished.'); // இந்த லாக் இனி தேவைப்படாது, loading ஆனது fetchUserProfile இல் நிர்வகிக்கப்படுகிறது
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile ஐ dependency ஆகச் சேர்க்கவும்

  const value = { session, user, userProfile, loading };

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