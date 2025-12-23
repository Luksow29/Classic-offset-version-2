import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  History, User, Calendar, FileText, Download,
  RefreshCw, Search, ArrowRight, Activity,
  CheckCircle2, AlertCircle, Edit, Trash2, Plus
} from 'lucide-react';
import { format } from 'date-fns';

// Define the shape of the data
interface PaymentHistoryEntry {
  id: string;
  payment_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE'; // Added INSERT
  old_data?: any; // Changed from old_values
  new_data?: any; // Changed from new_values
  changed_by: string;
  changed_at: string;
  notes?: string;
  user_name?: string;
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
      // 1. Fetch payment history records
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

      // 2. Extract unique User IDs and Customer IDs
      const userIds = new Set<string>();
      const customerIds = new Set<string>();

      historyData.forEach(entry => {
        if (entry.changed_by) userIds.add(entry.changed_by);

        // Check both new_data and old_data (renamed from values)
        const values = entry.new_data || entry.old_data;
        if (values && values.customer_id) {
          customerIds.add(values.customer_id);
        }
      });

      // 3. Fetch User Names
      let userMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name')
          .in('id', Array.from(userIds));

        if (!usersError && usersData) {
          userMap = usersData.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // 4. Fetch Customer Names
      let customerMap: Record<string, string> = {};
      if (customerIds.size > 0) {
        // Try fetching from customers table
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', Array.from(customerIds));

        if (!customersError && customersData) {
          customerMap = customersData.reduce((acc, cust) => {
            acc[cust.id] = cust.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // 5. Process the history data
      const processedHistory = historyData.map(entry => {
        let customerName = 'Unknown Customer';
        let orderId = null;
        let amount = null;

        // Use new_data/old_data
        const values = entry.new_data || entry.old_data;

        if (values) {
          // Priority 1: Check if customer_name was snapshot in JSON
          if (values.customer_name) {
            customerName = values.customer_name;
          }
          // Priority 2: Look up by customer_id
          else if (values.customer_id && customerMap[values.customer_id]) {
            customerName = customerMap[values.customer_id];
          } else if (values.customer_id) {
            // Fallback if ID exists but name query failed/missing
            customerName = `Customer #${values.customer_id.substring(0, 8)}`;
          }

          if (values.order_id) orderId = values.order_id;

          // Handle different field names for amount
          if (values.amount_paid !== undefined) amount = values.amount_paid;
          else if (values.total_amount !== undefined) amount = values.total_amount;
        }

        return {
          ...entry,
          user_name: userMap[entry.changed_by] || 'System/Unknown',
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
      case 'CREATE':
      case 'INSERT': // Handle INSERT same as CREATE
        return {
          icon: Plus,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          label: 'Payment Received'
        };
      case 'UPDATE': return {
        icon: Edit,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        label: 'Payment Updated'
      };
      case 'DELETE': return {
        icon: Trash2,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        label: 'Payment Deleted'
      };
      default: return {
        icon: Activity,
        color: 'text-gray-500',
        bg: 'bg-gray-100 dark:bg-gray-800',
        borderColor: 'border-gray-200',
        label: 'Activity Logged'
      };
    }
  };

  const renderValueChanges = (oldValues: any, newValues: any) => {
    if (!oldValues || !newValues) return null;

    const changes = [];
    const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of keys) {
      if (['updated_at', 'created_at', 'id', 'user_id'].includes(key)) continue;

      if (oldValues[key] !== newValues[key]) {
        changes.push(
          <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs py-1 border-b border-border/50 last:border-0">
            <span className="font-semibold text-muted-foreground min-w-[100px] capitalize">{key.replace(/_/g, ' ')}</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-destructive line-through bg-destructive/5 px-1 rounded">{String(oldValues[key] ?? 'N/A')}</span>
              <ArrowRight size={12} className="text-muted-foreground" />
              <span className="text-emerald-600 bg-emerald-500/10 px-1 rounded font-medium">{String(newValues[key] ?? 'N/A')}</span>
            </div>
          </div>
        );
      }
    }

    return changes.length > 0 ? (
      <div className="mt-3 bg-muted/30 rounded-md p-3 border border-border/50">
        <h6 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Activity size={12} /> Modified Fields
        </h6>
        <div>{changes}</div>
      </div>
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
      entry.amount ? `${entry.amount}` : '-',
      entry.notes || '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <History size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">Audit Log</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-11">Track all payment modifications and history</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={fetchPaymentHistory} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search & Timeline */}
      <Card className="border-t-4 border-t-primary shadow-md">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
            <Input
              id="search-history"
              placeholder="Search by user, customer, order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/20 border-border/50 focus:bg-background transition-all"
            />
          </div>
        </div>

        <div className="p-0 sm:p-6 bg-muted/5 h-[600px] overflow-y-auto custom-scrollbar relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 font-medium animate-pulse">Loading audit trail...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertCircle className="w-12 h-12 mb-2 opacity-80" />
              <p className="font-semibold">Failed to load history</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No records found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                {searchTerm ? 'No matches found for your search criteria.' : 'No payment activity has been recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {filteredHistory.map((entry, index) => {
                const config = getActionConfig(entry.action);
                return (
                  <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                    {/* Timeline Node */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 bg-card">
                      <config.icon size={16} className={config.color} />
                    </div>

                    {/* Content Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${config.color} flex items-center gap-1`}>
                            {config.label}
                          </div>
                          <time className="font-mono text-xs text-muted-foreground">
                            {format(new Date(entry.changed_at), 'PPP p')}
                          </time>
                        </div>
                        {entry.amount && (
                          <div className="text-right">
                            <div className="font-bold text-lg text-foreground">₹{entry.amount.toLocaleString('en-IN')}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5"><User size={12} /> User</span>
                          <span className="font-medium">{entry.user_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5"><User size={12} /> Customer</span>
                          <span className="font-medium">{entry.customer_name}</span>
                        </div>
                        {entry.order_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5"><FileText size={12} /> Order Ref</span>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">#{entry.order_id}</span>
                          </div>
                        )}
                      </div>

                      {entry.notes && (
                        <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 text-xs p-2 rounded border border-yellow-200 dark:border-yellow-800/30">
                          <span className="font-semibold block mb-0.5">Note:</span>
                          {entry.notes}
                        </div>
                      )}

                      {/* Display Changes (only for updates) */}
                      {entry.action === 'UPDATE' && (
                        <div className="mt-2">
                          {renderValueChanges(entry.old_data, entry.new_data)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentHistory;