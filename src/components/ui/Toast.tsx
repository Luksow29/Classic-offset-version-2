import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (duration === Infinity) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 100);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration]);
  
  const handleClose = () => {
    setIsVisible(false);
  };
  
  const onAnimationComplete = () => {
    if (!isVisible) {
      onClose(id);
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
    }
  };
  
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/20 text-success-foreground';
      case 'error':
        return 'bg-destructive/10 border-destructive/20 text-destructive-foreground';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning-foreground';
      case 'info':
        return 'bg-info/10 border-info/20 text-info-foreground';
    }
  };

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={twMerge(
            'relative overflow-hidden pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg',
            getStyles()
          )}
        >
          <div className="p-4 pr-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="flex-1">
                {title && (
                  <h3 className="font-medium text-sm">{title}</h3>
                )}
                <p className="text-sm mt-1">{message}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress bar */}
          {duration !== Infinity && (
            <div className="h-1 w-full bg-muted/20">
              <motion.div
                className="h-full bg-foreground/20"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;