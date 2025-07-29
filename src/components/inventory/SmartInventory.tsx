// src/components/inventory/SmartInventory.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Package, AlertTriangle, TrendingDown, Plus, Minus, BarChart3, RefreshCw, Search, Filter } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  price_per_unit: number;
  reorder_point: number;
  supplier: string;
  last_restocked: string;
  usage_rate: number; // calculated
  days_until_stockout: number; // calculated
  status: 'healthy' | 'low' | 'critical' | 'overstock';
}

interface StockAlert {
  item: InventoryItem;
  type: 'reorder' | 'critical' | 'overstock';
  message: string;
}

interface InventoryAdjustment {
  id?: string;
  material_id: string;
  adjustment_type: 'add' | 'remove' | 'transfer';
  quantity: number;
  reason: string;
  adjusted_by?: string;
  created_at?: string;
}

const SmartInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // Get materials data
      const { data: materials, error } = await supabase
        .from('materials')
        .select('*')
        .order('material_name');

      if (error) throw error;

      // Calculate usage rates and predictions
      const enrichedInventory: InventoryItem[] = await Promise.all(
        (materials || []).map(async (item: any) => {
          // Calculate usage rate from recent orders (simplified)
          const { data: recentUsage } = await supabase
            .from('order_materials')
            .select('quantity_used')
            .eq('material_id', item.id)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          const totalUsage = recentUsage?.reduce((sum, u) => sum + u.quantity_used, 0) || 0;
          const dailyUsageRate = totalUsage / 30; // per day
          const currentStock = item.current_quantity || item.current_stock || 0;
          const reorderPoint = item.minimum_stock_level || item.reorder_point || 10;
          const daysUntilStockout = dailyUsageRate > 0 ? currentStock / dailyUsageRate : 999;

          let status: InventoryItem['status'] = 'healthy';
          if (currentStock <= reorderPoint * 0.5) {
            status = 'critical';
          } else if (currentStock <= reorderPoint) {
            status = 'low';
          } else if (currentStock > reorderPoint * 3) {
            status = 'overstock';
          }

          return {
            id: item.id,
            name: item.material_name,
            category: item.category || 'General',
            current_stock: currentStock,
            unit: item.unit_of_measurement || item.unit || 'pcs',
            price_per_unit: item.cost_per_unit || item.price_per_unit || 0,
            reorder_point: reorderPoint,
            supplier: item.supplier || 'Unknown',
            last_restocked: item.last_restocked || item.created_at,
            usage_rate: dailyUsageRate,
            days_until_stockout: Math.round(daysUntilStockout),
            status
          };
        })
      );

      setInventory(enrichedInventory);

      // Generate alerts
      const generatedAlerts: StockAlert[] = enrichedInventory
        .filter(item => item.status !== 'healthy')
        .map(item => {
          let type: StockAlert['type'] = 'reorder';
          let message = '';

          switch (item.status) {
            case 'critical':
              type = 'critical';
              message = `Critical: Only ${item.current_stock} units left! Reorder immediately.`;
              break;
            case 'low':
              type = 'reorder';
              message = `Low stock: ${item.current_stock} units remaining. Consider reordering.`;
              break;
            case 'overstock':
              type = 'overstock';
              message = `Overstock: ${item.current_stock} units. Consider reducing orders.`;
              break;
          }

          return { item, type, message };
        });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const adjustStock = async (itemId: string, adjustment: number, type: 'add' | 'remove') => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      const newQuantity = type === 'add' 
        ? item.current_stock + adjustment
        : Math.max(0, item.current_stock - adjustment);

      const { error } = await supabase
        .from('materials')
        .update({ 
          current_stock: newQuantity,
          last_restocked: type === 'add' ? new Date().toISOString() : item.last_restocked
        })
        .eq('id', itemId);

      if (error) throw error;

      // Record the adjustment
      const { error: adjustmentError } = await supabase
        .from('inventory_adjustments')
        .insert({
          material_id: itemId,
          adjustment_type: type,
          quantity: adjustment,
          reason: type === 'add' ? 'Stock added via Smart Inventory' : 'Stock used via Smart Inventory'
        });

      if (adjustmentError) {
        console.warn('Failed to record adjustment:', adjustmentError);
        // Don't fail the whole operation if adjustment logging fails
      }

      toast.success(`Stock ${type === 'add' ? 'added' : 'removed'} successfully`);
      fetchInventoryData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'low': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overstock': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getAlertColor = (type: StockAlert['type']) => {
    switch (type) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'reorder': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'overstock': return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Smart Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Week 2: Intelligent stock tracking with predictive analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchInventoryData} 
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Materials</div>
            <div className="text-2xl font-bold text-blue-600">{inventory.length}</div>
          </div>
        </div>
      </div>
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">Stock Alerts</h2>
            <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
              {alerts.length}
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`border-l-4 p-3 rounded-r-lg ${getAlertColor(alert.type)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{alert.item.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedItem(alert.item)}
                    variant="outline"
                  >
                    Adjust Stock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Smart Inventory Management</h2>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium">Material</th>
                <th className="text-left py-3 px-4 font-medium">Current Stock</th>
                <th className="text-left py-3 px-4 font-medium">Min. Level</th>
                <th className="text-left py-3 px-4 font-medium">Usage Rate</th>
                <th className="text-left py-3 px-4 font-medium">Days Left</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.supplier}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium">{item.current_stock} {item.unit}</span>
                  </td>
                  <td className="py-3 px-4">{item.reorder_point} {item.unit}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{item.usage_rate.toFixed(1)}/day</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${item.days_until_stockout < 7 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {item.days_until_stockout > 365 ? '∞' : `${item.days_until_stockout}d`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => adjustStock(item.id, 1, 'remove')}
                        disabled={item.current_stock <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => adjustStock(item.id, 1, 'add')}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)}
        title={`Adjust Stock: ${selectedItem?.name}`}
      >
        {selectedItem && (
          <div className="space-y-4 pt-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p><strong>Current Stock:</strong> {selectedItem.current_stock} {selectedItem.unit}</p>
              <p><strong>Reorder Point:</strong> {selectedItem.reorder_point} {selectedItem.unit}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedItem.status)}`}>
                {selectedItem.status.toUpperCase()}
              </span></p>
            </div>
            
            <Input
              label="Adjustment Quantity"
              type="number"
              value={adjustmentQty.toString()}
              onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity to add/remove"
            />

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  adjustStock(selectedItem.id, adjustmentQty, 'add');
                  setSelectedItem(null);
                  setAdjustmentQty(0);
                }}
                className="flex-1"
                disabled={adjustmentQty <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
              <Button 
                onClick={() => {
                  adjustStock(selectedItem.id, adjustmentQty, 'remove');
                  setSelectedItem(null);
                  setAdjustmentQty(0);
                }}
                className="flex-1"
                variant="outline"
                disabled={adjustmentQty <= 0}
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove Stock
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SmartInventory;
