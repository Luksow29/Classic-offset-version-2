import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delay = 300,
  className = '',
  contentClassName = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;
      
      // Calculate position based on side and align
      switch (side) {
        case 'top':
          y = -tooltipRect.height - 8;
          break;
        case 'bottom':
          y = triggerRect.height + 8;
          break;
        case 'left':
          x = -tooltipRect.width - 8;
          break;
        case 'right':
          x = triggerRect.width + 8;
          break;
      }
      
      // Adjust alignment
      if ((side === 'top' || side === 'bottom') && align !== 'center') {
        if (align === 'start') {
          x = 0;
        } else if (align === 'end') {
          x = triggerRect.width - tooltipRect.width;
        } else {
          x = (triggerRect.width - tooltipRect.width) / 2;
        }
      } else if ((side === 'left' || side === 'right') && align !== 'center') {
        if (align === 'start') {
          y = 0;
        } else if (align === 'end') {
          y = triggerRect.height - tooltipRect.height;
        } else {
          y = (triggerRect.height - tooltipRect.height) / 2;
        }
      }
      
      setPosition({ x, y });
    };
    
    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isVisible, side, align]);

  return (
    <div
      ref={triggerRef}
      className={twMerge('inline-block relative', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: side === 'right' ? '100%' : side === 'left' ? 0 : '50%',
              top: side === 'bottom' ? '100%' : side === 'top' ? 0 : '50%',
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: 50,
            }}
            className={twMerge(
              'px-2 py-1 text-xs font-medium rounded shadow-md',
              'bg-foreground text-background',
              'dark:bg-background dark:text-foreground dark:border dark:border-border',
              contentClassName
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;