// src/pages/CustomerInvoicesPage.tsx
import { useOutletContext } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import CustomerInvoices from "@/components/customer/CustomerInvoices";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerInvoicesPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Invoices</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your invoices and payment history.
        </p>
      </div>

      <CustomerInvoices customerId={customer.id} />
    </div>
  );
}
