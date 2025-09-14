import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { twMerge } from 'tailwind-merge';

export interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  tooltip?: string;
  colorClass?: string;
  index?: number;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, 
  title, 
  value, 
  tooltip, 
  colorClass = 'bg-primary/10 dark:bg-primary/20',
  index = 0,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ 
        scale: onClick ? 1.03 : 1.01,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={twMerge(
        "cursor-default transition-all duration-200 group",
        onClick && "cursor-pointer"
      )}
    >
      <Card className="p-4 h-full overflow-hidden relative hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        {/* Subtle background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <p className="text-sm font-sans font-medium text-muted-foreground tracking-wide uppercase transition-colors duration-200 group-hover:text-primary/70" title={tooltip}>
              {title}
            </p>
            <div className="mt-2">
              <p className="text-2xl font-display font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                {value}
              </p>
            </div>
          </div>
          <motion.div 
            className={twMerge("p-2 rounded-lg transition-all duration-200", colorClass)}
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.2 }
            }}
          >
            {icon}
          </motion.div>
        </div>
        
        {/* Ripple effect on click */}
        {onClick && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-primary/10 opacity-0"
            whileTap={{
              opacity: [0, 0.3, 0],
              scale: [0.8, 1.2, 1],
              transition: { duration: 0.4 }
            }}
          />
        )}
      </Card>
    </motion.div>
  );
};

export default MetricCard;