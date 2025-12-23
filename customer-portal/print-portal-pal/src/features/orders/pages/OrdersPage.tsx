// src/pages/CustomerOrdersPage.tsx
import { useOutletContext } from "react-router-dom";
import { Tables } from "@/services/supabase/types";
import CustomerOrders from "@/features/orders/components/OrdersList";
import { motion } from "framer-motion";
import { Package, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: unknown;
  customer: Customer | null;
}

export default function CustomerOrdersPage() {
  const { customer } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-blue-200 dark:border-blue-800"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  const handleQuickReorder = (order: { id: number | string }) => {
    // Navigate to requests page with reorder data
    window.location.href = '/customer-portal/requests?reorder=' + order.id;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero Header Section - Compact on mobile */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 md:p-8"
      >
        {/* Background Pattern - Hidden on mobile */}
        <div className="absolute inset-0 opacity-10 hidden md:block">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              <Package className="h-5 w-5 md:h-7 md:w-7 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-3xl font-bold text-white"
              >
                My Orders
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-blue-100 text-xs md:text-base"
              >
                Track and manage your orders
              </motion.p>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs md:text-sm font-medium text-white">Live</span>
            </div>
            
            <Button 
              onClick={() => navigate('/customer-portal/requests')}
              size="sm"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg text-xs md:text-sm h-8 md:h-10 px-3 md:px-4"
            >
              <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
              New Request
            </Button>
          </motion.div>
        </div>

        {/* Decorative Elements - Hidden on mobile */}
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl hidden md:block"></div>
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl hidden md:block"></div>
      </motion.div>

      {/* Orders List */}
      <CustomerOrders customerId={customer.id} onQuickReorder={handleQuickReorder} />
    </div>
  );
}
