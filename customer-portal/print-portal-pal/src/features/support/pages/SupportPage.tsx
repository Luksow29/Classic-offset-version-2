// src/pages/CustomerSupportPage.tsx
import { useOutletContext } from "react-router-dom";
import { Tables } from "@/services/supabase/types";
import CustomerSupport from "@/features/support/components/SupportChat";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerSupportPage() {
  const { customer } = useOutletContext<OutletContext>();

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Support</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Get help and support for your orders and account.
        </p>
      </div>

      <CustomerSupport customer={customer} />
    </div>
  );
}
