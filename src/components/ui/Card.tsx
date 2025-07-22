import React from 'react';
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

const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  titleClassName = '', 
  interactive = false,
  onClick
}) => {
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

  const Component = interactive ? motion.div : 'div';
  const cardProps = interactive ? {
    variants: cardVariants,
    initial: "initial",
    whileHover: "hover",
    whileTap: "tap",
    onClick
  } : { onClick };

  return (
    <Component 
      {...cardProps}
      className={twMerge(`
        bg-card text-card-foreground
        rounded-lg
        border border-border
        shadow-sm
        overflow-hidden
        transition-colors
      `, className)}
    >
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
    </Component>
  );
};

export default Card;