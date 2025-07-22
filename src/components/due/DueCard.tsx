// src/components/due/DueCard.tsx
import React from 'react';
import Card from '../ui/Card';
import DueAlertBadge from './DueAlertBadge';
import { Link } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { DueOrder } from './DueSummary'; // DueSummary-லிருந்து DueOrder type-ஐப் பெறவும்

interface Props {
  customer: string;
  orders: DueOrder[];
}

const DueCard: React.FC<Props> = ({ customer, orders }) => {
  const totalDue = orders.reduce((sum, o) => sum + (o.balance_due || 0), 0);

  return (
    <Card>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{customer}</h2>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Due</p>
            <span className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              ₹{totalDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <ul className="mt-3 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
          {orders.map((order) => (
            <li key={order.order_id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <Link to={`/invoices/${order.order_id}`} className="flex items-center gap-2 text-primary-600 hover:underline">
                <Hash size={14} />
                <span>Order #{order.order_id}</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  ₹{order.balance_due.toLocaleString('en-IN')}
                </span>
                {/* DueAlertBadge-க்கு date புலத்தை அனுப்பவும் */}
                <DueAlertBadge deliveryDate={order.date} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default DueCard;