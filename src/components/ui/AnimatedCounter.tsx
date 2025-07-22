import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedCounterProps {
  to: number;
  prefix?: string;
  postfix?: string;
  className?: string;
  decimals?: number;
  duration?: number;
  isCurrency?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  to, 
  prefix = '', 
  postfix = '', 
  className = '',
  decimals = 0,
  duration = 1.5,
  isCurrency = false
}) => {
  const count = useMotionValue(0);
  
  const rounded = useTransform(count, latest => {
    const fixed = latest.toFixed(decimals);
    const formatted = isCurrency 
      ? new Intl.NumberFormat('en-IN').format(parseFloat(fixed))
      : fixed;
    return `${prefix}${formatted}${postfix}`;
  });

  useEffect(() => {
    const controls = animate(count, to, {
      duration,
      ease: "easeOut"
    });
    return controls.stop;
  }, [to, count, duration]);

  return (
    <motion.span className={className}>
      {rounded}
    </motion.span>
  );
};

export default AnimatedCounter;