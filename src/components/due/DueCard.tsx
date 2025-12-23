// src/components/due/DueCard.tsx
import React, { useState } from 'react';
import Card from '../ui/Card';
import DueAlertBadge from './DueAlertBadge';
import Button from '../ui/Button'; // Assuming you have a reusable Button
import { Link } from 'react-router-dom';
import { Hash, ChevronDown, ChevronUp, Send, Share2 } from 'lucide-react';
import { DueOrder } from './DueSummary';

interface Props {
  customer: string;
  orders: DueOrder[];
}

const DueCard: React.FC<Props> = ({ customer, orders }) => {
  const [expanded, setExpanded] = useState(false);
  const totalDue = orders.reduce((sum, o) => sum + (o.balance_due || 0), 0);
  const orderCount = orders.length;

  return (
    <Card className="overflow-hidden border border-border/50 hover:shadow-md transition-shadow">
      {/* Header - Click to Expand */}
      <div
        className="p-4 sm:p-6 bg-card cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-primary/10 p-2 rounded-full text-primary">
              <span className="font-bold text-lg w-8 h-8 flex items-center justify-center">
                {customer.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                {customer}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {orderCount} pending orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right mr-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Due</p>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                ₹{totalDue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-muted-foreground">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="bg-muted/10 border-t border-border/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
          {/* Action Bar */}
          <div className="flex justify-end gap-2 mb-4 no-print">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Share2 size={14} /> Share Statement
            </Button>
            <Button size="sm" className="gap-2 text-xs bg-rose-600 hover:bg-rose-700 text-white">
              <Send size={14} /> Send Reminder
            </Button>
          </div>

          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.order_id} className="bg-background rounded-lg border border-border p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Link to={`/invoices/${order.order_id}`} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <Hash size={14} />
                    <span>Order #{order.order_id}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    • {order.date ? new Date(order.date).toLocaleDateString() : 'No Date'}
                  </span>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                  <DueAlertBadge deliveryDate={order.date} />
                  <span className="font-semibold text-foreground">
                    ₹{order.balance_due.toLocaleString('en-IN')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default DueCard;