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
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  title, 
  children, 
  className = '', 
  titleClassName = '', 
  interactive = false,
  onClick
}, ref) => {
  const cardVariants = interactive ? {
    initial: { 
      scale: 1, 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
    },
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    tap: { 
      scale: 0.98,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  } : {};

  const cardClassName = twMerge(`
    bg-card text-card-foreground
    rounded-lg
    border border-border
    shadow-sm
    overflow-hidden
    transition-colors
  `, className);

  const cardContent = (
    <>
      {title && (
        <div className={twMerge("p-6 border-b border-border flex items-center justify-between", titleClassName)}>
          <h3 className="text-lg font-semibold leading-none tracking-tight">
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