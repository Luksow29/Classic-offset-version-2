// src/components/layout/TopHeader.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, GalleryHorizontal, MessageCircle, Settings } from 'lucide-react'; 
import { useTheme } from '@/lib/ThemeProvider';
import ProfileDropdown from '../ui/ProfileDropdown';
import WhatsAppModal from '../WhatsAppModal';
import { useUser } from '@/context/UserContext'; 
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

interface TopHeaderProps {
  onMenuClick: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const { theme } = useTheme();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const { userProfile } = useUser();
  const isAdminOrOwner = userProfile?.role === 'Owner' || userProfile?.role === 'Manager';

  // Header bg: always white (light), dark (#161b22) for dark mode. Card/border only for card/button.
  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-[#181c23]/90 border-b border-border flex-shrink-0 z-20 backdrop-blur-md shadow-sm rounded-b-xl">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left Side - Sidebar toggle for mobile */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Showcase Shortcut */}
            <Link
              to="/showcase"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 group"
            >
              <GalleryHorizontal
                size={16}
                className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
              />
              Showcase
            </Link>

            {/* WhatsApp Quick Send */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-success hover:text-success/80 transition-colors duration-200"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>

            {/* Admin Content Management Shortcut */}
            {isAdminOrOwner && (
              <Link
                to="/admin/content"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-info hover:text-info/80 transition-colors duration-200 group"
              >
                <Settings
                  size={16}
                  className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                />
                Admin
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* Profile */}
            <div className="border-l border-border pl-2 sm:pl-4">
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* WhatsApp Modal */}
      <WhatsAppModal isOpen={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} />
    </>
  );
};

export default TopHeader;