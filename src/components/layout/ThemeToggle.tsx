import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="rounded-full w-9 h-9 relative"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        <motion.div
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ 
            opacity: isDark ? 0 : 1, 
            rotate: isDark ? -90 : 0,
            scale: isDark ? 0.5 : 1
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun size={18} className="text-amber-500" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
          animate={{ 
            opacity: isDark ? 1 : 0, 
            rotate: isDark ? 0 : 90,
            scale: isDark ? 1 : 0.5
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon size={18} className="text-indigo-300" />
        </motion.div>
      </div>
    </Button>
  );
};

export default ThemeToggle;