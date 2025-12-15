// src/components/orders/OrderStatusStepper.tsx
import React from 'react';
import { Check, Pencil, Printer, Truck } from 'lucide-react';

type Status = 'Pending' | 'Design' | 'Printing' | 'Delivered';
const steps: Status[] = ['Pending', 'Design', 'Printing', 'Delivered'];
const icons: Record<Status, React.ElementType> = {
    Pending: Pencil,
    Design: Printer,
    Printing: Truck,
    Delivered: Check,
};

const stepColors: Record<Status, { bg: string; border: string; text: string; activeBg: string }> = {
    Pending: { 
      bg: 'bg-yellow-500', 
      border: 'border-yellow-500', 
      text: 'text-yellow-600 dark:text-yellow-400',
      activeBg: 'bg-gradient-to-br from-yellow-400 to-orange-500'
    },
    Design: { 
      bg: 'bg-blue-500', 
      border: 'border-blue-500', 
      text: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-gradient-to-br from-blue-400 to-cyan-500'
    },
    Printing: { 
      bg: 'bg-purple-500', 
      border: 'border-purple-500', 
      text: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-gradient-to-br from-purple-400 to-pink-500'
    },
    Delivered: { 
      bg: 'bg-green-500', 
      border: 'border-green-500', 
      text: 'text-green-600 dark:text-green-400',
      activeBg: 'bg-gradient-to-br from-green-400 to-emerald-500'
    },
};

interface Props {
  currentStatus: Status;
}

const OrderStatusStepper: React.FC<Props> = ({ currentStatus }) => {
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full" aria-label="Order Status">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const Icon = icons[step];
        const colors = stepColors[step];

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center w-1/4">
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 transform
                ${isCompleted 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                  : isActive 
                    ? `${colors.activeBg} text-white scale-110 shadow-lg shadow-${step.toLowerCase()}-500/30 ring-4 ring-${step.toLowerCase()}-100 dark:ring-${step.toLowerCase()}-900/30` 
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700/80 dark:text-gray-500'
                }`
              }>
                {isCompleted ? <Check size={20} /> : <Icon size={18} />}
              </div>
              <p className={`mt-2 text-xs font-semibold transition-all duration-300 ${
                isCompleted 
                  ? 'text-green-600 dark:text-green-400' 
                  : isActive 
                    ? colors.text
                    : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1.5 mx-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    index < currentIndex 
                      ? 'w-full bg-gradient-to-r from-green-400 to-emerald-500' 
                      : 'w-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;