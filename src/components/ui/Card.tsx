import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  interactive?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'flat';
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  title,
  children,
  className = '',
  titleClassName = '',
  interactive = false,
  onClick,
  variant = 'default'
}, ref) => {
  const cardVariants = interactive ? {
    initial: {
      scale: 1,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    },
    hover: {
      scale: 1.01,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    tap: {
      scale: 0.99,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  } : {};

  const baseStyles = 'rounded-xl overflow-hidden transition-all duration-300';

  const variantStyles = {
    default: 'bg-card text-card-foreground border border-border shadow-sm hover:shadow-md',
    glass: 'glass-card text-foreground',
    flat: 'bg-secondary/30 border-none'
  };

  const cardClassName = twMerge(
    baseStyles,
    variantStyles[variant],
    className
  );

  const cardContent = (
    <>
      {title && (
        <div className={twMerge("p-4 sm:p-6 border-b border-border flex items-center justify-between", titleClassName)}>
          <h3 className="text-base sm:text-lg font-display font-semibold leading-none tracking-tight text-foreground">
            {title}
          </h3>
        </div>
      )}
      <div className={twMerge("", !title && "")}>
        {children}
      </div>
    </>
  );

  if (interactive) {
    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
        className={cardClassName}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cardClassName}
    >
      {cardContent}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
