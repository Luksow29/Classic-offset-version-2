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
      whileHover={onClick ? { scale: 1.03 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={twMerge(
        "cursor-default transition-all duration-200",
        onClick && "cursor-pointer"
      )}
    >
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-muted-foreground" title={tooltip}>{title}</p>
            <div className="mt-2">
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
          <div className={twMerge("p-2 rounded-lg", colorClass)}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default MetricCard;