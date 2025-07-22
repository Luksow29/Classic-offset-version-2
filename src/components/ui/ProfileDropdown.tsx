import { useState, useEffect, useRef } from 'react';
import { LogOut, User, Settings, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTheme } from '@/lib/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string; role?: string }>({});
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    setOpen(false);
  });

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('name, email, role').eq('id', user.id).maybeSingle();
        if (data) setUserInfo(data);
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/login');
    else alert('Logout failed: ' + error.message);
  };

  const getInitials = () => {
    if (userInfo?.name) {
      return userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'CO';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
        aria-label="Open user menu"
      >
        {getInitials()}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">{userInfo?.name || 'Logged In'}</p>
              <p className="text-xs text-muted-foreground">{userInfo?.email}</p>
              <p className="text-xs text-muted-foreground italic">Role: {userInfo?.role || 'Unknown'}</p>
            </div>
            
            <div className="py-1">
              <Link 
                to="/settings" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <Settings size={16} className="text-muted-foreground" />
                Settings
              </Link>
              
              <Link 
                to="/help" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <HelpCircle size={16} className="text-muted-foreground" />
                Help & Support
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;