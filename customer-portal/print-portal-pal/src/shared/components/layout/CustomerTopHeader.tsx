// src/components/layout/CustomerTopHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Sparkles, MessageCircle, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { motion } from 'framer-motion';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/shared/hooks/useToast';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter';

interface CustomerTopHeaderProps {
  onMenuClick: () => void;
}

const CustomerTopHeader: React.FC<CustomerTopHeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast({ title: "Signed Out Successfully" });
  };

  return (
    <motion.header 
      className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 flex-shrink-0 z-20 shadow-xl shadow-blue-500/10 dark:shadow-purple-500/20"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-full px-6 flex items-center justify-between bg-gradient-to-r from-blue-50/30 to-emerald-50/30 dark:from-blue-950/30 dark:to-emerald-950/30 w-full">
        {/* Left Side - Sidebar toggle for mobile + Brand accent */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onMenuClick}
            className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 lg:hidden backdrop-blur-sm shadow-sm"
            aria-label="Open sidebar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
          
          {/* Brand text on larger screens */}
          <motion.div 
            className="hidden md:flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-800 dark:from-white dark:via-blue-300 dark:to-emerald-300 bg-clip-text text-transparent">
              Print Portal Pal
            </span>
          </motion.div>
        </div>

        {/* Right Side - Enhanced Actions with glassmorphism */}
        <motion.div 
          className="flex items-center gap-1 sm:gap-2 md:gap-3"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          
          {/* Notification Center */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <NotificationCenter />
          </motion.div>

          {/* Customer Support Quick Access */}
          <motion.button
            onClick={() => navigate('/customer-portal/support')}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm border border-white/20 dark:border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Customer Support"
          >
            <MessageCircle size={14} />
            <span className="tracking-wide hidden sm:inline">Support</span>
          </motion.button>

          {/* Profile Quick Access */}
          <motion.button
            onClick={() => navigate('/customer-portal/profile')}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm border border-white/20 dark:border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Profile"
          >
            <User size={14} />
            <span className="tracking-wide hidden sm:inline">Profile</span>
          </motion.button>

          {/* Actions Row */}
          <div className="flex items-center gap-1 pl-1 md:pl-2 border-l border-white/20 dark:border-white/10">
            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ThemeToggle />
            </motion.div>

            {/* Sign Out */}
            <motion.div 
              className="ml-1 md:ml-2 pl-1 md:pl-2 border-l border-white/20 dark:border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4" /> 
                <span className="hidden sm:inline-block">Sign Out</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default CustomerTopHeader;
