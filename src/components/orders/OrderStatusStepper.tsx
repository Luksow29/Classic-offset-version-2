import React from 'react';
import { Check, Pencil, Printer, Truck, FileWarning, Package, ChevronRight } from 'lucide-react';

type Status = 'Pending' | 'Design' | 'Correction' | 'Printing' | 'Delivered';
const steps: Status[] = ['Pending', 'Design', 'Correction', 'Printing', 'Delivered'];

const icons: Record<Status, React.ElementType> = {
  Pending: Pencil,
  Design: Printer,
  Correction: FileWarning,
  Printing: Truck,
  Delivered: Package,
};

const stepColors: Record<Status, { bg: string; text: string; gradient: string }> = {
  Pending: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-400 to-orange-500'
  },
  Design: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-400 to-cyan-500'
  },
  Correction: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    gradient: 'from-red-500 to-rose-600'
  },
  Printing: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-400 to-violet-600'
  },
  Delivered: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-400 to-emerald-500'
  },
};

interface Props {
  currentStatus: string;
}

const OrderStatusStepper: React.FC<Props> = ({ currentStatus }) => {
  // Normalize casing for comparison
  const normalizedStatus = (currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1).toLowerCase()) as Status;
  const safeStatus = steps.includes(normalizedStatus) ? normalizedStatus : 'Pending';
  const currentIndex = steps.indexOf(safeStatus);

  return (
    <div className="w-full">
      {/* Mobile / Compact View (< md) */}
      <div className="flex md:hidden items-center gap-3">
        <div className={`p-2 rounded-lg ${stepColors[safeStatus]?.bg || 'bg-gray-100'}`}>
          {React.createElement(icons[safeStatus] || Pencil, { size: 18, className: stepColors[safeStatus]?.text })}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Current Status</p>
          <p className={`font-bold ${stepColors[safeStatus]?.text || 'text-gray-700'}`}>{safeStatus}</p>
        </div>
        {currentIndex < steps.length - 1 && (
          <div className="flex items-center gap-2 opacity-50">
            <span className="text-xs font-semibold text-gray-400">Next: {steps[currentIndex + 1]}</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Desktop View (>= md) */}
      <div className="hidden md:flex items-center w-full relative">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -z-10 rounded-full" />

        {/* Active Line Progress */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500 -z-10 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = icons[step];
          const colors = stepColors[step];

          return (
            <div key={step} className="flex-1 flex flex-col items-center">
              <div
                className={`
                   relative z-10 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full border-4 transition-all duration-500
                   ${isCurrent
                    ? `bg-white dark:bg-gray-900 border-white dark:border-gray-900 shadow-lg scale-110 ring-2 ring-offset-2 ring-${colors.text.split('-')[1]}-500`
                    : isCompleted
                      ? 'bg-green-500 border-white dark:border-gray-900 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 border-white dark:border-gray-900 text-gray-400'
                  }
                `}
              >
                {isCurrent ? (
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white`}>
                    <Icon size={16} className="lg:w-5 lg:h-5" />
                  </div>
                ) : isCompleted ? (
                  <Check size={16} />
                ) : (
                  <Icon size={16} />
                )}
              </div>

              <div className={`mt-2 text-center transition-all duration-300 ${isCurrent ? 'transform translate-y-0 opacity-100' : 'opacity-70 scale-95'}`}>
                <p className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider ${isCurrent ? colors.text : 'text-gray-400 dark:text-gray-600'}`}>
                  {step}
                </p>
                {isCurrent && <div className={`h-0.5 w-4 mx-auto mt-1 rounded-full bg-current ${colors.text}`} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;