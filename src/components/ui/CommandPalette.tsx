// src/components/ui/CommandPalette.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command as CommandIcon,
  Search,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  FileText,
  Phone,
  Calendar,
  BarChart3,
  Shield,
  Sparkles,
  MessageSquare,
  Gift,
  Clock,
  PlusCircle,
  UserPlus,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'Navigation' | 'Actions' | 'Quick Create' | 'Settings' | 'Search';
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Command definitions
  const allCommands: Command[] = useMemo(() => [
    // Navigation Commands
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Go to main dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      action: () => navigate('/'),
      category: 'Navigation',
      keywords: ['dashboard', 'home', 'main', 'overview']
    },
    {
      id: 'nav-orders',
      title: 'Orders',
      subtitle: 'View and manage orders',
      icon: <ShoppingCart className="w-5 h-5" />,
      action: () => navigate('/orders'),
      category: 'Navigation',
      keywords: ['orders', 'order', 'sales', 'purchases']
    },
    {
      id: 'nav-customers',
      title: 'Customers',
      subtitle: 'Manage customer database',
      icon: <Users className="w-5 h-5" />,
      action: () => navigate('/customers'),
      category: 'Navigation',
      keywords: ['customers', 'clients', 'contacts']
    },
    {
      id: 'nav-payments',
      title: 'Payments',
      subtitle: 'Track payments and transactions',
      icon: <DollarSign className="w-5 h-5" />,
      action: () => navigate('/payments'),
      category: 'Navigation',
      keywords: ['payments', 'money', 'transactions', 'finance']
    },
    {
      id: 'nav-inventory',
      title: 'Inventory',
      subtitle: 'Manage stock and materials',
      icon: <Package className="w-5 h-5" />,
      action: () => navigate('/stock'),
      category: 'Navigation',
      keywords: ['inventory', 'stock', 'materials', 'products']
    },
    {
      id: 'nav-loyalty',
      title: 'Loyalty Program',
      subtitle: 'Manage customer loyalty',
      icon: <Gift className="w-5 h-5" />,
      action: () => navigate('/loyalty-program'),
      category: 'Navigation',
      keywords: ['loyalty', 'rewards', 'points', 'program']
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      subtitle: 'View business insights',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => navigate('/insights'),
      category: 'Navigation',
      keywords: ['analytics', 'insights', 'reports', 'data']
    },
    {
      id: 'nav-weekly-progress',
      title: 'Weekly Progress',
      subtitle: 'Track weekly performance',
      icon: <Clock className="w-5 h-5" />,
      action: () => navigate('/enhancements'),
      category: 'Navigation',
      keywords: ['weekly', 'progress', 'performance', 'tracking']
    },
    {
      id: 'nav-whatsapp',
      title: 'WhatsApp',
      subtitle: 'WhatsApp integration',
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => navigate('/whatsapp'),
      category: 'Navigation',
      keywords: ['whatsapp', 'chat', 'messaging', 'communication']
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'Application settings',
      icon: <Settings className="w-5 h-5" />,
      action: () => navigate('/settings'),
      category: 'Navigation',
      keywords: ['settings', 'configuration', 'preferences']
    },

    // Quick Create Actions
    {
      id: 'create-order',
      title: 'Create New Order',
      subtitle: 'Start a new order',
      icon: <PlusCircle className="w-5 h-5" />,
      action: () => navigate('/orders?action=create'),
      category: 'Quick Create',
      keywords: ['create', 'new', 'order', 'add']
    },
    {
      id: 'create-customer',
      title: 'Add New Customer',
      subtitle: 'Register a new customer',
      icon: <UserPlus className="w-5 h-5" />,
      action: () => navigate('/customers?action=create'),
      category: 'Quick Create',
      keywords: ['create', 'new', 'customer', 'add', 'register']
    },
    {
      id: 'create-invoice',
      title: 'Generate Invoice',
      subtitle: 'Create a new invoice',
      icon: <FileText className="w-5 h-5" />,
      action: () => navigate('/invoices?action=create'),
      category: 'Quick Create',
      keywords: ['create', 'invoice', 'bill', 'generate']
    },

    // Action Commands
    {
      id: 'action-export-data',
      title: 'Export Data',
      subtitle: 'Export business data',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      action: () => {
        // Trigger export functionality
        console.log('Export data triggered');
      },
      category: 'Actions',
      keywords: ['export', 'data', 'download', 'backup']
    },
    {
      id: 'action-ai-assistant',
      title: 'AI Assistant',
      subtitle: 'Open AI business assistant',
      icon: <Sparkles className="w-5 h-5" />,
      action: () => navigate('/classic-assistant'),
      category: 'Actions',
      keywords: ['ai', 'assistant', 'help', 'artificial intelligence']
    },

    // Settings Commands
    {
      id: 'settings-theme',
      title: 'Toggle Theme',
      subtitle: 'Switch between light and dark mode',
      icon: <Settings className="w-5 h-5" />,
      action: () => {
        toggleTheme();
      },
      category: 'Settings',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance']
    }
  ], [navigate, toggleTheme]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return allCommands;

    const query = searchQuery.toLowerCase();
    return allCommands.filter(command =>
      command.title.toLowerCase().includes(query) ||
      command.subtitle?.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [allCommands, searchQuery]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleCommandClick = (command: Command) => {
    command.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-sm sm:max-w-xl md:max-w-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center px-3 sm:px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ml-2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Commands List */}
            <div
              ref={listRef}
              className="max-h-64 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            >
              {Object.keys(groupedCommands).length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No commands found
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category}>
                    <div className="px-3 sm:px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/50">
                      {category}
                    </div>
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <motion.button
                          key={command.id}
                          className={`w-full flex items-center px-3 sm:px-4 py-3 text-left hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                            }`}
                          onClick={() => handleCommandClick(command)}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.1 }}
                        >
                          <div className="flex-shrink-0 mr-2 sm:mr-3 text-gray-600 dark:text-gray-400">
                            {command.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {command.title}
                            </div>
                            {command.subtitle && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {command.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex-shrink-0 ml-2 hidden sm:block"
                            >
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <span>⏎</span>
                              </div>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer - Mobile Responsive */}
            <div className="px-3 sm:px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="hidden sm:flex items-center space-x-1">
                    <CommandIcon className="w-3 h-3" />
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>⏎</span>
                    <span className="hidden sm:inline">Select</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>ESC</span>
                    <span className="hidden sm:inline">Close</span>
                  </span>
                </div>
                <span className="text-xs">{filteredCommands.length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;
