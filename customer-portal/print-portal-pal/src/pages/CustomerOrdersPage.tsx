// src/pages/CustomerOrdersPage.tsx
import { useOutletContext } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import CustomerOrders from "@/components/customer/CustomerOrders";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerOrdersPage() {
  const { customer } = useOutletContext<OutletContext>();

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleQuickReorder = (order: any) => {
    // Navigate to requests page with reorder data
    window.location.href = '/customer-portal/requests?reorder=' + order.id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track and manage your printing orders.
        </p>
      </div>

      <CustomerOrders customerId={customer.id} onQuickReorder={handleQuickReorder} />
    </div>
  );
}
