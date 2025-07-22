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

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center w-1/4">
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 transform
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg' :
                  'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600'}`
              }>
                <Icon size={isCompleted ? 20 : 18} />
              </div>
              <p className={`mt-2 text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 transition-colors duration-500 mx-1 ${index < currentIndex ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;