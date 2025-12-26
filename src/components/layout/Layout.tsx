// src/components/layout/Layout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import CommandPalette from '../ui/CommandPalette';
import { useTheme } from '@/lib/ThemeProvider';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useAdminInAppNotifications } from '@/hooks/useAdminInAppNotifications';
import { useNotificationContext } from '@/context/NotificationContext';
import toast from 'react-hot-toast';

interface LayoutProps {
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

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // State for mobile sidebar visibility (acts as an overlay)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // State for desktop sidebar collapsed state
  const [isDockCollapsed, setIsDockCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const { theme } = useTheme();

  useAdminInAppNotifications();

  // Command palette state
  const { isOpen: isCommandPaletteOpen, closePalette: closeCommandPalette } = useCommandPalette();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isDockCollapsed));
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

  // Prompt for Push Notifications
  const { isPushEnabled, enablePush, pushPermission } = useNotificationContext();
  useEffect(() => {
    // Only prompt if supported and not yet granted/denied (default)
    // and if user is logged in (implied by this being a protected layout usually, but Layout is generic)
    // We can check local storage to avoid spamming if they dismissed it "permanently" in our UI logic (optional)
    if (pushPermission === 'default') {
      const toastId = toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-medium">Enable Desktop Notifications?</span>
            <span className="text-xs opacity-90">Get instant alerts for new orders and messages.</span>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  enablePush();
                }}
                className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium hover:bg-primary/90"
              >
                Enable
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-md font-medium hover:bg-secondary/80"
              >
                Later
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000, // Show for 10s
          position: 'bottom-right',
          id: 'push-permission-prompt', // Prevent duplicates
        }
      );
    }
  }, [pushPermission, enablePush]);

  const isCommunicationRoute = location.pathname.startsWith('/communication');


  // Main layout bg: bg-background (white/dark). Sidebar/header bg fix பண்ணியாச்சு.
  return (
    <div className={`h-screen overflow-hidden flex bg-background ${theme === 'dark' ? 'dark' : ''}`}>
      <ScrollToTop />

      {/* --- Desktop Sidebar (Permanent) --- */}
      {/* Hidden on screens smaller than 1024px (lg) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          isDocked={true}
          isCollapsed={isDockCollapsed}
          setIsCollapsed={setIsDockCollapsed}
          onClose={() => { }} // Not needed for docked sidebar
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
              <Sidebar
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
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 flex flex-col main-content ${isCommunicationRoute ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
          {isCommunicationRoute ? (
            // Full width/height layout for Communication Hub
            <motion.div
              key={isCommunicationRoute ? 'comm-layout' : location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 w-full h-full"
              // style={{ height: 'calc(100vh - 4rem)' }} removed to fix overflow

              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          ) : (
            // Standard layout for other pages
            <div className="py-4 sm:py-6">
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
      />

      {/* Local Agent Widget - Available from any page */}
      {/* Uncomment to enable the floating widget everywhere */}
      {/* <LocalAgentWidget /> */}
    </div>
  );
};

export default Layout;
