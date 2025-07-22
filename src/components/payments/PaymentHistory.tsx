import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { 
  History, User, Calendar, FileText, Download, 
  RefreshCw, Search, Filter, Clock, Edit, Trash2, Plus, 
  AlertTriangle, Loader2 
} from 'lucide-react';

// Define the shape of the data
interface PaymentHistoryEntry {
  id: string;
  payment_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  changed_by: string;
  changed_at: string;
  notes?: string;
  user_name?: string; // We'll fetch this separately
  customer_name?: string;
  order_id?: number;
  amount?: number;
}

const PaymentHistory: React.FC = () => {
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPaymentHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch payment history records
      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setHistory([]);
        return;
      }

      // Get unique user IDs for fetching user names
      const userIds = [...new Set(historyData.map(entry => entry.changed_by).filter(Boolean))];
      
      // Fetch user names separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);

      if (usersError) {
        console.warn('Could not fetch user names:', usersError);
      }

      // Create a map of user IDs to names
      const userMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {} as Record<string, string>);

      // Process the history data and add user names
      const processedHistory = historyData.map(entry => {
        let customerName = 'Unknown';
        let orderId = null;
        let amount = null;

        // Extract customer name and order info from new_values or old_values
        const values = entry.new_values || entry.old_values;
        if (values) {
          if (values.customer_name) {
            customerName = values.customer_name;
          }
          if (values.order_id) {
            orderId = values.order_id;
          }
          if (values.amount_paid) {
            amount = values.amount_paid;
          } else if (values.total_amount) {
            amount = values.total_amount;
          }
        }

        return {
          ...entry,
          user_name: userMap[entry.changed_by] || 'Unknown User',
          customer_name: customerName,
          order_id: orderId,
          amount: amount
        };
      });

      setHistory(processedHistory);
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);
      setError(err.message || "Could not load payment history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    const lowercasedTerm = searchTerm.toLowerCase();
    return history.filter(entry => 
      entry.user_name?.toLowerCase().includes(lowercasedTerm) ||
      entry.customer_name?.toLowerCase().includes(lowercasedTerm) ||
      String(entry.order_id || '').includes(lowercasedTerm) ||
      entry.action.toLowerCase().includes(lowercasedTerm) ||
      entry.notes?.toLowerCase().includes(lowercasedTerm)
    );
  }, [history, searchTerm]);
  
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'CREATE': return { icon: Plus, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      case 'UPDATE': return { icon: Edit, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
      case 'DELETE': return { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' };
      default: return { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  const renderValueChanges = (oldValues: any, newValues: any) => {
    if (!oldValues || !newValues) return null;
    
    const changes = [];
    const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    
    for (const key of keys) {
      if (key === 'updated_at' || key === 'created_at') continue;
      
      if (oldValues[key] !== newValues[key]) {
        changes.push(
          <li key={key} className="text-xs">
            <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span>{' '}
            <span className="text-red-600 line-through">{String(oldValues[key] || 'null')}</span>
            {' → '}
            <span className="text-green-600">{String(newValues[key] || 'null')}</span>
          </li>
        );
      }
    }
    
    return changes.length > 0 ? (
      <ul className="mt-2 list-disc pl-5 space-y-1">{changes}</ul>
    ) : null;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Action', 'User', 'Customer', 'Order ID', 'Amount', 'Notes'];
    const csvData = filteredHistory.map(entry => [
      new Date(entry.changed_at).toLocaleString(),
      entry.action,
      entry.user_name || 'Unknown',
      entry.customer_name || 'Unknown',
      entry.order_id || '-',
      entry.amount ? `₹${entry.amount}` : '-',
      entry.notes || '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="p-4 border-b dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <History size={20} className="text-primary-600" />
          <h2 className="text-lg font-semibold">Payment History & Audit Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchPaymentHistory} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <Input
              id="search-history"
              placeholder="Search by user, customer, order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8">
            <Loader2 className="animate-spin w-8 h-8 mx-auto mb-2" />
            <p className="text-gray-500">Loading payment history...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-600">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p className="font-semibold">Error Loading History</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No payment history found</p>
                <p className="text-sm">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Payment changes will appear here.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((entry) => {
                const config = getActionConfig(entry.action);
                return (
                  <div key={entry.id} className={`p-4 rounded-lg border-l-4 ${config.bgColor} border-l-current`}>
                    <div className="flex items-start gap-3">
                      <config.icon size={16} className={config.color} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {entry.action} Payment Record
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.changed_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <div>
                            <span className="font-medium">User:</span> {entry.user_name}
                          </div>
                          <div>
                            <span className="font-medium">Customer:</span> {entry.customer_name}
                          </div>
                          {entry.order_id && (
                            <div>
                              <span className="font-medium">Order:</span> #{entry.order_id}
                            </div>
                          )}
                          {entry.amount && (
                            <div>
                              <span className="font-medium">Amount:</span> ₹{entry.amount.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {entry.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">Notes:</span> {entry.notes}
                          </div>
                        )}

                        {entry.action === 'UPDATE' && renderValueChanges(entry.old_values, entry.new_values)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PaymentHistory;