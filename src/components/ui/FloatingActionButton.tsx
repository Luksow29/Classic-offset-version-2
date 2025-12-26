import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

interface FloatingActionButtonProps {
  actions: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use portal to ensure the button is always relative to the viewport,
  // preventing issues with parent transforms (like framer-motion page transitions)
  return createPortal(
    <div className={`fixed z-[100] ${position === 'bottom-right' ? 'bottom-6 right-6' :
        position === 'bottom-left' ? 'bottom-6 left-6' :
          position === 'top-right' ? 'top-6 right-6' :
            'top-6 left-6'
      }`}>
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && actions.map((action, index) => {
          // Calculate positions dynamically
          const style = {
            bottom: position.includes('bottom') ? `${(index + 1) * 70}px` : 'auto',
            top: position.includes('top') ? `${(index + 1) * 70}px` : 'auto',
            right: position.includes('right') ? 0 : 'auto',
            left: position.includes('left') ? 0 : 'auto',
          };

          return (
            <motion.div
              key={action.id}
              className="absolute flex items-center"
              style={style}
              initial={{
                opacity: 0,
                scale: 0,
                y: position.includes('bottom') ? 20 : -20
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                scale: 0,
                y: position.includes('bottom') ? 20 : -20
              }}
              transition={{
                duration: 0.2,
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              {/* Label */}
              <motion.div
                className={`absolute ${position.includes('right')
                    ? 'right-16 mr-2'
                    : 'left-16 ml-2'
                  } bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg`}
                initial={{ opacity: 0, x: position.includes('right') ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
              >
                {action.label}
              </motion.div>

              {/* Action Button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {action.icon}
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        className="w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </motion.div>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 w-screen h-screen"
            style={{
              // Ensure overlay covers everything even if parent position is weird
              transform: 'translate(-100vw, -100vh)',
              width: '300vw',
              height: '300vh',
              top: 0, left: 0 // Reset positioning relative to fixed container
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default FloatingActionButton;