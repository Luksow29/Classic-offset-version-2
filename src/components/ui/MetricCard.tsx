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
  variant?: 'default' | 'glass' | 'flat';
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  tooltip,
  colorClass = 'bg-primary/10 dark:bg-primary/20',
  index = 0,
  onClick,
  variant = 'default'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, type: "spring", stiffness: 150 }}
      whileHover={{
        scale: onClick ? 1.02 : 1.01,
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={twMerge(
        "cursor-default transition-all duration-300 group h-full",
        onClick && "cursor-pointer"
      )}
    >
      <Card
        variant={variant}
        className="p-2.5 sm:p-5 h-full overflow-hidden relative transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 ring-1 ring-inset ring-black/5 dark:ring-white/5"
      >
        {/* Decorative gradient corner */}
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-blue-500/5 via-transparent to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Subtle animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col space-y-0.5 sm:space-y-2">
            <p className="text-[9px] sm:text-xs font-sans font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight" title={tooltip}>
              {title}
            </p>
            <div className="min-w-0">
              <p className="text-base sm:text-2xl md:text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                {value}
              </p>
            </div>
          </div>
          <motion.div
            className={twMerge(
              "p-1.5 sm:p-3 rounded-lg sm:rounded-2xl transition-all duration-300 shadow-sm",
              "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900",
              "group-hover:shadow-md group-hover:scale-110",
              colorClass
            )}
            whileHover={{
              rotate: 5,
              transition: { duration: 0.2 }
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              size: undefined,
              className: twMerge((icon as React.ReactElement).props.className, "w-3.5 h-3.5 sm:w-[22px] sm:h-[22px]")
            })}
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/40 transition-all duration-500" />

        {/* Ripple effect on click */}
        {onClick && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 pointer-events-none"
            whileTap={{
              opacity: [0, 0.2, 0],
              scale: [0.95, 1.05, 1],
              transition: { duration: 0.3 }
            }}
          />
        )}
      </Card>
    </motion.div>
  );
};

export default MetricCard;