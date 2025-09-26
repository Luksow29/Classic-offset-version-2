// src/components/layout/ProtectedLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import CustomerLayout from './CustomerLayout';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

const ProtectedLayout: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Try to get customer data
        const { data: customerData, error } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (!error && customerData) {
          setCustomer(customerData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data: customerData } = await supabase
            .from("customers")
            .select("*")
            .eq("user_id", session.user.id)
            .single();
          
          setCustomer(customerData);
        } catch (error) {
          console.error('Error fetching customer data:', error);
        }
      } else {
        setCustomer(null);
      }
    });

    return () => subscription.unsubscribe();
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
