// src/components/layout/CustomerLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import CustomerSidebar from './CustomerSidebar';
import CustomerTopHeader from './CustomerTopHeader';
import { useClickOutside } from '@/shared/hooks/useClickOutside';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Ensure the main content area scrolls to the top on navigation
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  // State for mobile sidebar visibility (acts as an overlay)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // State for desktop sidebar collapsed state
  const [isDockCollapsed, setIsDockCollapsed] = useState(() => {
    const saved = localStorage.getItem('customerSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('customerSidebarCollapsed', JSON.stringify(isDockCollapsed));
  }, [isDockCollapsed]);

  // Close mobile sidebar when clicking outside of it
  useClickOutside(sidebarRef, () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  });

  // Close sidebar on route change on mobile
  const location = useLocation();
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-background">
      <ScrollToTop />
      
      {/* --- Desktop Sidebar (Permanent) --- */}
      {/* Hidden on screens smaller than 1024px (lg) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
          <CustomerSidebar 
            isDocked={true}
            isCollapsed={isDockCollapsed}
            setIsCollapsed={setIsDockCollapsed}
            onClose={() => {}} // Not needed for docked sidebar
          />
      </div>

      {/* --- Mobile Sidebar (Overlay with Backdrop) --- */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
              aria-hidden="true"
              onClick={() => setSidebarOpen(false)}
            />
          
            {/* Sidebar */}
            <motion.div
              ref={sidebarRef}
              key="mobile-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-40 lg:hidden"
            >
              <CustomerSidebar 
                isDocked={false}
                isCollapsed={false}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <CustomerTopHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar main-content">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <motion.div
                key={useLocation().pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
