// src/components/layout/CustomerSidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Receipt, MessageCircle, User,
  X, ChevronLeft, ChevronRight, ChevronDown, ClipboardList,
  Home, ShoppingCart, CreditCard, Phone, Settings, Headphones, Bell, TestTube
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface CustomerSidebarProps {
  isDocked: boolean;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
}

interface NavGroup {
  name: string;
  icon: JSX.Element;
  items: NavItem[];
}

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  isDocked,
  isCollapsed = false,
  setIsCollapsed,
  onClose
}) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['My Account']);

  // Navigation Groups array for customer portal
  const navGroups: NavGroup[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      items: [
        { name: 'Overview', path: '/customer-portal', icon: <Home size={18} /> },
        { name: 'Design Library', path: '/customer-portal/showcase', icon: <Package size={18} /> },
      ],
    },
    {
      name: 'My Account',
      icon: <User size={20} />,
      items: [
        { name: 'My Orders', path: '/customer-portal/orders', icon: <Package size={18} /> },
        { name: 'New Request', path: '/customer-portal/requests', icon: <ClipboardList size={18} /> },
        { name: 'My Invoices', path: '/customer-portal/invoices', icon: <Receipt size={18} /> },
        { name: 'Profile', path: '/customer-portal/profile', icon: <User size={18} /> },
      ],
    },
    {
      name: 'Support',
      icon: <Headphones size={20} />,
      items: [
        { name: 'Chat Support', path: '/customer-portal/support', icon: <MessageCircle size={18} /> },
        { name: 'Contact Us', path: '/customer-portal/contact', icon: <Phone size={18} /> },
      ],
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      items: [
        { name: 'Notifications', path: '/customer-portal/notifications', icon: <Bell size={18} /> },
        { name: 'Notification Preferences', path: '/customer-portal/notification-preferences', icon: <Settings size={18} /> },
        { name: 'Test Notifications', path: '/customer-portal/notification-test', icon: <TestTube size={18} /> },
      ],
    },
  ];

  const toggleGroup = (groupName: string) => {
    if (isCollapsed && setIsCollapsed) {
      setIsCollapsed(false);
      setExpandedGroups([groupName]);
      return;
    }

    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const handleLinkClick = () => {
    if (!isDocked) {
      onClose();
    }
  };

  return (
    <motion.aside
      className={`h-full ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/20 dark:border-white/10 transition-all duration-300 shadow-xl shadow-blue-500/10 dark:shadow-purple-500/20`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with glassmorphism */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 dark:border-white/10 flex-shrink-0 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-950/50 dark:to-emerald-950/50 backdrop-blur-sm">
        <motion.h1
          className={`text-lg font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-800 dark:from-white dark:via-blue-300 dark:to-emerald-300 bg-clip-text text-transparent tracking-tight transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          Print Portal
        </motion.h1>
        <div className="flex items-center gap-2">
          {isDocked && setIsCollapsed && (
            <motion.button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
              </motion.div>
            </motion.button>
          )}
          {!isDocked && (
            <motion.button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 lg:hidden"
              aria-label="Close sidebar"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} className="text-red-500" />
            </motion.button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {navGroups.map((group, groupIndex) => (
          <motion.div
            key={group.name}
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: groupIndex * 0.1 }}
          >
            <motion.button
              onClick={() => toggleGroup(group.name)}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 backdrop-blur-sm group ${expandedGroups.includes(group.name) && !isCollapsed ? 'bg-white/30 dark:bg-gray-800/30 shadow-sm' : ''
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span
                className="flex items-center justify-center p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 group-hover:from-blue-500/20 group-hover:to-emerald-500/20 transition-all duration-200"
                whileHover={{ rotate: 5 }}
              >
                {group.icon}
              </motion.span>
              {!isCollapsed && (
                <>
                  <span className="ml-4 flex-1 text-left tracking-wide">{group.name}</span>
                  <motion.div
                    animate={{ rotate: expandedGroups.includes(group.name) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown
                      size={16}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  </motion.div>
                </>
              )}
            </motion.button>
            <AnimatePresence>
              {(expandedGroups.includes(group.name) || isCollapsed) && (
                <motion.div
                  initial={isCollapsed ? {} : { height: 0, opacity: 0 }}
                  animate={isCollapsed ? {} : { height: 'auto', opacity: 1 }}
                  exit={isCollapsed ? {} : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`space-y-1 overflow-hidden ${isCollapsed ? '' : 'pl-4 border-l-2 border-gradient-to-b from-blue-200 to-emerald-200 dark:from-blue-800 dark:to-emerald-800 ml-4'}`}
                >
                  {group.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: itemIndex * 0.05 }}
                    >
                      <NavLink
                        to={item.path}
                        onClick={handleLinkClick}
                        className={({ isActive }) => twMerge(
                          'flex items-center px-4 py-3 my-1 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden',
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/20 to-emerald-500/20 text-blue-700 dark:text-blue-300 font-semibold shadow-lg shadow-blue-500/20 border border-blue-200/50 dark:border-blue-800/50'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100',
                          isCollapsed && 'justify-center'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {/* Active indicator */}
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-r-full"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: location.pathname === item.path ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        />

                        <motion.span
                          className="flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.1 }}
                        >
                          {item.icon}
                        </motion.span>
                        {!isCollapsed && (
                          <motion.span
                            className="ml-3 tracking-wide"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </NavLink>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </nav>

      {/* Enhanced footer with glassmorphism */}
      {!isCollapsed && (
        <motion.div
          className="p-4 text-xs text-gray-500 dark:text-gray-400 border-t border-white/20 dark:border-white/10 bg-gradient-to-r from-blue-50/30 to-emerald-50/30 dark:from-blue-950/30 dark:to-emerald-950/30 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Print Portal Pal</p>
          <p>© 2025 Classic Offset</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Online</span>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};

export default CustomerSidebar;
