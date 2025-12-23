// src/components/layout/TopHeader.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, GalleryHorizontal, MessageCircle, Settings, Sparkles, Command } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import ProfileDropdown from '../ui/ProfileDropdown';
import WhatsAppModal from '../WhatsAppModal';
import { useUser } from '@/context/UserContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { motion } from 'framer-motion';

interface TopHeaderProps {
  onMenuClick: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const { theme } = useTheme();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const { userProfile } = useUser();
  const { openPalette } = useCommandPalette();
  // const isAdminOrOwner = userProfile?.role === 'owner' || userProfile?.role === 'manager';
  const isAdminOrOwner = true; // Temporarily enable for all users as per request to have "admin button in topheaders"

  // Enhanced glassmorphism header to match dashboard and sidebar
  return (
    <>
      <motion.header
        className="h-16 bg-background/80 backdrop-blur-xl border-b border-border/40 flex-shrink-0 z-20 shadow-xl shadow-primary/5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between bg-gradient-to-r from-background/30 to-muted/30">
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

            {/* Optional brand text on larger screens */}
            <motion.div
              className="hidden md:flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <img
                src="/classic-offset-logo.jpg"
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover shadow-sm"
              />
              <span className="font-display font-bold text-lg text-foreground">
                Classic Offset
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

            {/* Mobile Command Palette Trigger */}
            <motion.button
              onClick={openPalette}
              className="sm:hidden flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm border border-white/20 dark:border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Open Command Palette"
            >
              <Command size={16} />
            </motion.button>

            {/* Command Palette Trigger - Hide on mobile, show on sm+ */}
            <motion.button
              onClick={openPalette}
              className="hidden sm:flex items-center gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-display font-semibold text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm border border-white/20 dark:border-white/10 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Open Command Palette (Cmd+K)"
            >
              <Command size={14} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wide hidden md:inline">⌘K</span>
            </motion.button>

            {/* Showcase Shortcut - Hide text on mobile */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/showcase"
                className="hidden sm:flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-display font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm group border border-border/20"
              >
                <GalleryHorizontal
                  size={14}
                  className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                />
                <span className="tracking-wide hidden md:inline">Showcase</span>
              </Link>
            </motion.div>

            {/* WhatsApp Quick Send - Mobile icon only */}
            <motion.button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-display font-semibold text-emerald-700 dark:text-emerald-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm border border-white/20 dark:border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="WhatsApp"
            >
              <MessageCircle size={14} />
              <span className="tracking-wide hidden sm:inline">WhatsApp</span>
            </motion.button>

            {/* Admin Content Management Shortcut - Hide on small screens */}
            {isAdminOrOwner && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/admin/content"
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-display font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm group border border-border/20"
                >
                  <Settings
                    size={14}
                    className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                  />
                  <span className="tracking-wide">Admin</span>
                </Link>
              </motion.div>
            )}

            {/* Actions Row */}
            <div className="flex items-center gap-1 pl-1 md:pl-2 border-l border-white/20 dark:border-white/10">
              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ThemeToggle />
              </motion.div>

              {/* Notifications */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <NotificationBell />
              </motion.div>

              {/* Profile */}
              <motion.div
                className="ml-1 md:ml-2 pl-1 md:pl-2 border-l border-white/20 dark:border-white/10"
                whileHover={{ scale: 1.02 }}
              >
                <ProfileDropdown />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* WhatsApp Modal */}
      <WhatsAppModal isOpen={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} />
    </>
  );
};

export default TopHeader;
