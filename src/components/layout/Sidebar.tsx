// src/components/layout/Sidebar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import SidebarControl from '../SidebarControl';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, DollarSign, Package, Users, UserCircle,
  AlertCircle, ActivitySquare, FileSignature, Boxes, X, ChevronLeft, ChevronRight,
  Briefcase, BarChart3, ChevronDown, MessageCircle, Settings, MessageSquare, Sparkles, Lightbulb, Brain, Rocket, Gift
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useUser } from '@/context/UserContext';

interface SidebarProps {
  isDocked: boolean;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
  requiredRole?: 'Owner' | 'Manager' | 'Staff';
}

interface NavGroup {
  name: string;
  icon: JSX.Element;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isDocked,
  isCollapsed: collapsedProp = false,
  setIsCollapsed,
  onClose
}) => {
  const location = useLocation();
  const { userProfile } = useUser();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [sidebarMode, setSidebarMode] = useState(() => localStorage.getItem('sidebarMode') || 'expanded');
  const [isCollapsed, setCollapsed] = useState(collapsedProp);

  // Listen for SidebarControl changes
  useEffect(() => {
    function handleSidebarModeChange(e: any) {
      setSidebarMode(e.detail);
    }
    window.addEventListener('sidebarModeChange', handleSidebarModeChange);
    return () => window.removeEventListener('sidebarModeChange', handleSidebarModeChange);
  }, []);

  // Update collapse state based on sidebarMode
  useEffect(() => {
    if (sidebarMode === 'collapsed') setCollapsed(true);
    else setCollapsed(false);
  }, [sidebarMode]);

  // Hover to expand/collapse
  const handleSidebarMouseEnter = useCallback(() => {
    if (sidebarMode === 'hover') setCollapsed(false);
  }, [sidebarMode]);
  const handleSidebarMouseLeave = useCallback(() => {
    if (sidebarMode === 'hover') setCollapsed(true);
  }, [sidebarMode]);

  // Sync with parent if setIsCollapsed is provided
  useEffect(() => {
    if (setIsCollapsed) setIsCollapsed(isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  // Initialize expanded groups based on current path
  useEffect(() => {
    if (isCollapsed) {
      setExpandedGroups([]);
      return;
    }
    // Find which group contains the current path
    const currentPath = location.pathname;
    const groupWithCurrentPath = navGroups.find(group => 
      group.items.some(item => 
        currentPath === item.path || 
        (currentPath.startsWith(item.path) && item.path !== '/')
      )
    );
    if (groupWithCurrentPath) {
      setExpandedGroups(prev =>
        prev.includes(groupWithCurrentPath.name)
          ? prev
          : [...prev, groupWithCurrentPath.name]
      );
    }
  }, [location.pathname, isCollapsed]);

  const navGroups: NavGroup[] = [
    {
      name: 'Overview',
      icon: <BarChart3 size={20} />,
      items: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
        { name: 'Business Insights', path: '/business-insights', icon: <Brain size={18} /> },
        { name: 'Enhancement Progress', path: '/enhancements', icon: <Rocket size={18} /> },
        { name: 'Comprehensive Insights', path: '/insights', icon: <Brain size={18} /> },
        { name: 'Reports', path: '/reports', icon: <BarChart3 size={18} /> },
        { name: 'Status Overview', path: '/status-overview', icon: <ActivitySquare size={18} /> },
        { name: 'Due Summary', path: '/due-summary', icon: <AlertCircle size={18} /> },
      ],
    },
    {
      name: 'Operations',
      icon: <Briefcase size={20} />,
      items: [
        { name: 'Orders', path: '/orders', icon: <FileText size={18} /> },
        { name: 'Expenses', path: '/expenses', icon: <DollarSign size={18} /> },
        { name: 'Materials', path: '/materials', icon: <Package size={18} /> },
        { name: 'Smart Inventory', path: '/smart-inventory', icon: <Package size={18} /> },
        { name: 'Products', path: '/products', icon: <Boxes size={18} /> },
        { name: 'Invoices', path: '/invoices', icon: <FileSignature size={18} /> },
      ],
    },
    {
      name: 'Management',
      icon: <Users size={20} />,
      items: [
        { name: 'Customers', path: '/customers', icon: <UserCircle size={18} /> },
        { name: 'Advanced CRM', path: '/advanced-crm', icon: <Users size={18} /> },
        { name: 'Loyalty Program', path: '/loyalty-program', icon: <Gift size={18} /> },
        { name: 'Staff', path: '/staff', icon: <Users size={18} /> },
        { name: 'Payments', path: '/payments', icon: <DollarSign size={18} /> },
        { name: 'Users', path: '/users', icon: <Users size={18} />, requiredRole: 'Owner' },
        { name: 'Stock', path: '/stock', icon: <Package size={18} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
      ],
    },
    {
      name: 'Communication',
      icon: <MessageCircle size={20} />,
      items: [
        { name: 'WhatsApp', path: '/whatsapp', icon: <MessageCircle size={18} /> },
        { name: 'Team Chat', path: '/team-chat', icon: <MessageSquare size={18} /> },
        { name: 'AI Agent', path: '/ai-agent', icon: <Sparkles size={18} /> },
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

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  // Sidebar bg: always white (light), dark (#161b22) for dark mode. Card/border only for card/button.
  return (
    <aside
      className={`h-full ${sidebarWidth} flex flex-col bg-white dark:bg-[#161b22] border-r border-border transition-all duration-300`}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border flex-shrink-0 bg-muted/60 dark:bg-[#23272f] rounded-b-xl shadow-sm">
        <h1 className={`text-xl font-bold tracking-tight transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}> 
          Classic Offset
        </h1>
        <div className="flex items-center gap-2">
          <SidebarControl />
          {isDocked && setIsCollapsed && (
            <button
              onClick={() => setCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
          {!isDocked && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {navGroups.map((group) => {
          // Filter items based on user role
          const filteredItems = group.items.filter(item => 
            !item.requiredRole || (userProfile?.role === item.requiredRole || userProfile?.role === 'Owner')
          );
          
          // Skip empty groups
          if (filteredItems.length === 0) return null;
          
          return (
            <div key={group.name} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors ${
                  expandedGroups.includes(group.name) && !isCollapsed ? 'bg-muted/50' : ''
                }`}
              >
                <span className="flex items-center justify-center">
                  {group.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left">{group.name}</span>
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform duration-200 ${expandedGroups.includes(group.name) ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>
              <AnimatePresence>
                {(expandedGroups.includes(group.name) || isCollapsed) && (
                  <motion.div
                    initial={isCollapsed ? {} : { height: 0, opacity: 0 }}
                    animate={isCollapsed ? {} : { height: 'auto', opacity: 1 }}
                    exit={isCollapsed ? {} : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`space-y-1 overflow-hidden ${isCollapsed ? '' : 'pl-4 border-l-2 border-border ml-3'}`}
                  >
                    {filteredItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleLinkClick}
                        className={({ isActive }) => twMerge(
                          'flex items-center px-3 py-2 my-1 rounded-lg text-sm transition-colors duration-200',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          isCollapsed && 'justify-center'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <span className="flex items-center justify-center">{item.icon}</span>
                        {!isCollapsed && <span className="ml-3">{item.name}</span>}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
      
      {/* Version info */}
      {!isCollapsed && (
        <div className="p-4 text-xs text-muted-foreground border-t border-border">
          <p>Classic Offset v1.0.0</p>
          <p>© 2025 All rights reserved</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;