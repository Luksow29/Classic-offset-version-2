// src/components/dashboard/OrderStatusCard.tsx
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';


// Dashboard-லிருந்து வரும் ஆர்டர் தரவின் வகையை வரையறுக்கவும்
interface PendingOrder {
  order_id: string;
  id: number;
  customer_name: string;
  date: string;
  status: string;
}

// இந்தக் கூறுக்குத் தேவையான பண்புகளை வரையறுக்கவும்
interface OrderStatusCardProps {
  orders: PendingOrder[];
  loading: boolean;
  error: string | null;
  onStatusUpdated: () => void;
}

const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
  Pending: { className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: <Loader2 size={14} className="animate-spin" /> },
  Design: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <AlertTriangle size={14} /> },
  Printing: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: <Package size={14} /> },
  Delivered: { className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: <CheckCircle size={14} /> },
};

const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ orders, loading, error }) => {

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="flex justify-between items-center animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-6 text-red-600">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm font-display font-semibold tracking-tight">Could not load orders</p>
          <p className="text-xs font-sans">{error}</p>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-6 text-green-600">
          <CheckCircle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-display font-semibold tracking-tight">All caught up!</p>
          <p className="text-sm font-sans">No pending orders found.</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {orders.map((order) => {
          const config = statusConfig[order.status] || { className: 'bg-gray-100 text-gray-600', icon: <Package size={14} /> };
          return (
            <li key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div>
                <Link to={`/orders`} className="text-sm font-display font-semibold text-gray-800 dark:text-white hover:underline tracking-tight">
                  #{order.id} – {order.customer_name}
                </Link>
                <p className="text-xs font-sans text-gray-500 dark:text-gray-400 mt-1 tracking-wide">
                  {new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span
                className={`text-xs font-sans px-3 py-1 rounded-full font-medium flex items-center gap-1.5 tracking-wide ${config.className}`}
              >
                {config.icon}
                {order.status}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card title={<span className="flex items-center gap-2"><Package size={20} /> Recent Pending Orders</span>} className="flex flex-col">
      <div className="flex-grow">
        {renderContent()}
      </div>
       {orders.length > 0 && (
         <div className="border-t dark:border-gray-700 p-3 text-center">
            <Link to="/status-overview">
              <Button variant="link" size="sm">View All Orders</Button>
            </Link>
         </div>
       )}
    </Card>
  );
};

export default OrderStatusCard;
