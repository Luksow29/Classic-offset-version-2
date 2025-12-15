import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'link' | 'icon' | 'glow' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  fullWidth = false,
  onClick,
  type = 'button',
  title,
  'aria-label': ariaLabel,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background tracking-wide shadow-sm active:scale-95';

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground shadow-none',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-red-500/20',
    success: 'bg-success text-success-foreground hover:bg-success/90 hover:shadow-green-500/20',
    link: 'text-primary underline-offset-4 hover:underline shadow-none',
    icon: 'p-0 bg-transparent hover:bg-transparent shadow-none',
    glow: 'bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg transition-shadow duration-300',
    glass: 'glass-button text-foreground hover:text-primary backdrop-blur-md',
  };

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs rounded-md',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-11 px-8 text-base',
    icon: 'h-10 w-10',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      disabled={isDisabled}
      className={twMerge(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        'relative overflow-hidden',
        className
      )}
      whileHover={!isDisabled ? {
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      } : undefined}
      whileTap={!isDisabled ? {
        scale: 0.98,
        transition: { duration: 0.1 }
      } : undefined}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      type={type}
      title={title}
      aria-label={ariaLabel}
    >
      {/* Ripple effect background */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-md opacity-0"
        whileTap={!isDisabled ? {
          opacity: [0, 0.5, 0],
          scale: [0.8, 1.2, 1],
          transition: { duration: 0.4 }
        } : undefined}
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center">
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          </motion.div>
        )}
        {children}
      </span>
    </motion.button>
  );
};

export default Button;