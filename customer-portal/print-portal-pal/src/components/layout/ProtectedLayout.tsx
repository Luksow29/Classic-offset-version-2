// src/components/layout/ProtectedLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import CustomerLayout from './CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useSupportNotifications } from '@/hooks/useSupportNotifications';

type Customer = Tables<'customers'>;

const ProtectedLayout: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Global support chat notifications
  useSupportNotifications(customer?.id || null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserAndCustomer = async (sessionUser: any) => {
      if (!sessionUser) {
        if (isMounted) {
          setUser(null);
          setCustomer(null);
          setLoading(false);
        }
        return;
      }

      // Set user immediately
      if (isMounted) {
        setUser(sessionUser);
      }

      // Fetch customer data
      try {
        const { data: customerData, error } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", sessionUser.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'not found' errors
          throw error;
        }
        
        if (isMounted) {
          setCustomer(customerData || null);
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
        if (isMounted) {
          setCustomer(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Check initial session on component mount
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserAndCustomer(session?.user);
    };

    checkInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      fetchUserAndCustomer(session?.user);
    });

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/customer-auth" state={{ from: location }} replace />;
  }

  return (
    <CustomerLayout>
      <Outlet context={{ user, customer }} />
    </CustomerLayout>
  );
};

export default ProtectedLayout;
