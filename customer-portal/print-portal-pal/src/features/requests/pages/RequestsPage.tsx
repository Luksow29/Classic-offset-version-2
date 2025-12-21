// src/pages/CustomerRequestsPage.tsx
import { useState, useEffect } from "react";
import { useOutletContext, useSearchParams, useNavigate } from "react-router-dom";
import { Tables } from "@/services/supabase/types";
import CustomerRequests from "@/features/requests/components/RequestsList";
import { Button } from "@/shared/components/ui/button";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerRequestsPage() {
  const { customer } = useOutletContext<OutletContext>();
  const [searchParams] = useSearchParams();
  const [reorderData, setReorderData] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const reorderId = searchParams.get('reorder');
    if (reorderId) {
      // You could fetch the order data here if needed
      setReorderData({ id: reorderId });
    }
  }, [searchParams]);

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Request</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Submit a new printing request or reorder from previous orders.
          </p>
        </div>
        <Button onClick={() => navigate('/customer-portal/new-request')}>
          Start New Request
        </Button>
      </div>

      <CustomerRequests
        customer={customer}
        reorderData={reorderData}
        setReorderData={setReorderData}
      />
    </div>
  );
}
