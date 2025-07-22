import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AlertTriangle, CheckCircle, X, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface StockAlert {
  id: string;
  material_id: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  message: string;
  is_resolved: boolean;
  created_at: string;
  material?: {
    material_name: string;
    current_quantity: number;
    unit_of_measurement: string;
  };
}

const StockAlertsCard: React.FC = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('material_stock_alerts')
        .select(`
          *,
          materials!inner(material_name, current_quantity, unit_of_measurement)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to fetch stock alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('material_stock_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
      
      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'OUT_OF_STOCK':
        return <Package className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'OUT_OF_STOCK':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <div className="p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <h3 className="font-medium text-gray-800 dark:text-white">All Stock Levels Good</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">No stock alerts at this time.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Stock Alerts ({alerts.length})
        </h3>
        
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-l-4 rounded-r-lg ${getAlertColor(alert.alert_type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {alert.material?.material_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                  title="Mark as resolved"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {alerts.length >= 5 && (
          <div className="mt-4 text-center">
            <Button variant="link" size="sm">
              View All Alerts
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StockAlertsCard;