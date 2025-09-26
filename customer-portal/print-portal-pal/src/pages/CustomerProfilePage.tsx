// src/pages/CustomerProfilePage.tsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import CustomerProfile from "@/components/customer/CustomerProfile";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerProfilePage() {
  const { customer } = useOutletContext<OutletContext>();
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(customer);

  useEffect(() => {
    setCurrentCustomer(customer);
  }, [customer]);

  if (!currentCustomer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      <CustomerProfile customer={currentCustomer} onUpdate={setCurrentCustomer} />
    </div>
  );
}
