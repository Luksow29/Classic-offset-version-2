// src/pages/CustomerDashboard.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import DashboardWidgets from "@/components/customer/DashboardWidgets";
import { CustomerRecovery } from "@/components/customer/CustomerRecovery";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, customer } = useOutletContext<OutletContext>();
  const [showRecovery, setShowRecovery] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !customer) {
      // Show recovery if user exists but no customer record
      setShowRecovery(true);
    }
  }, [user, customer]);

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (showRecovery) {
    return <CustomerRecovery onSuccess={handleRecoverySuccess} />;
  }

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p>{t('portal.redirecting')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSetActiveTab = (tab: string) => {
    // Navigate to the appropriate route based on tab
    switch (tab) {
      case 'orders':
        navigate('/customer-portal/orders');
        break;
      case 'invoices':
        navigate('/customer-portal/invoices');
        break;
      case 'profile':
        navigate('/customer-portal/profile');
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {customer.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's your account overview and recent activity.
        </p>
      </div>

      <DashboardWidgets customerId={customer.id} setActiveTab={handleSetActiveTab} />
    </div>
  );
}
