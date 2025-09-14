
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Package, 
  Receipt, 
  MessageCircle, 
  LogOut, 
  ClipboardList
} from "lucide-react";
import CustomerOrders from "@/components/customer/CustomerOrders";
import CustomerInvoices from "@/components/customer/CustomerInvoices";
import CustomerSupport from "@/components/customer/CustomerSupport";
import CustomerProfile from "@/components/customer/CustomerProfile";
import CustomerRequests from "@/components/customer/CustomerRequests";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tables } from "@/integrations/supabase/types";
import DashboardWidgets from "@/components/customer/DashboardWidgets";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { DebugSupabase } from "@/components/ui/DebugSupabase";
import { CustomerRecovery } from "@/components/customer/CustomerRecovery";

type Customer = Tables<'customers'>;

export default function CustomerPortal() {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  const [activeTab, setActiveTab] = useState("orders"); // State to control the active tab
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializePortal = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/customer-auth");
          return;
        }

        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (customerError) throw customerError;
        setCustomer(customerData);

      } catch (error: any) {
        console.error("Portal initialization error:", error);
        
        // Check if it's a missing customer record issue
        if (error.code === 'PGRST116' || error.message?.includes('No rows returned')) {
          // Customer record doesn't exist, show recovery screen
          setShowRecovery(true);
          setIsLoading(false);
          return;
        }
        
        await supabase.auth.signOut();
        navigate("/"); // Go to index page on error
        toast({
          variant: "destructive",
          title: "Error Loading Data",
          description: "There was a problem loading your information. Please log in again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePortal();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Go to index page after sign out
    toast({ title: "Signed Out" });
  };
  
  // Handler to trigger quick re-order from CustomerOrders
  const [reorderData, setReorderData] = useState<any | null>(null);
  const handleQuickReorder = (order: any) => {
    setReorderData(order);
    setActiveTab("requests");
  };

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setIsLoading(true);
    // Retry the initialization
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (showRecovery) {
    return <CustomerRecovery onSuccess={handleRecoverySuccess} />;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary"></div></div>;
  }

  if (!customer) {
    return <div className="min-h-screen flex items-center justify-center p-4"><Card><CardContent className="p-6 text-center"><p>{t('portal.redirecting')}</p></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-4">
          <h1 className="text-xl font-bold text-primary hidden sm:block">{t('portal.title')}</h1>
          <GlobalSearch />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /> <span className="hidden sm:inline-block ml-2">{t('portal.sign_out')}</span></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Pass the tab controller function to the widgets */}
        <DashboardWidgets customerId={customer.id} setActiveTab={setActiveTab} />

        {/* Control the Tabs component with state */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2" />{t('portal.tab_orders')}</TabsTrigger>
          <TabsTrigger value="requests"><ClipboardList className="h-4 w-4 mr-2" />{t('portal.tab_requests')}</TabsTrigger>
          <TabsTrigger value="invoices"><Receipt className="h-4 w-4 mr-2" />{t('portal.tab_invoices')}</TabsTrigger>
          <TabsTrigger value="support"><MessageCircle className="h-4 w-4 mr-2" />{t('portal.tab_support')}</TabsTrigger>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />{t('portal.tab_profile')}</TabsTrigger>
        </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <CustomerOrders customerId={customer.id} onQuickReorder={handleQuickReorder} />
          </TabsContent>
          <TabsContent value="requests" className="mt-6">
            <CustomerRequests customer={customer} reorderData={reorderData} setReorderData={setReorderData} />
          </TabsContent>
          <TabsContent value="invoices" className="mt-6">
            <CustomerInvoices customerId={customer.id} />
          </TabsContent>
          <TabsContent value="support" className="mt-6">
            <CustomerSupport customer={customer} />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <CustomerProfile customer={customer} onUpdate={setCustomer} />
          </TabsContent>
        </Tabs>
      </main>
      <DebugSupabase />
    </div>
  );
}
