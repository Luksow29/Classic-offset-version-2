import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { Plus, X, Calculator, IndianRupee } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ServiceCharge {
  id: string;
  description: string;
  amount: number;
  type: string;
  added_at: string;
}

interface ServiceChargeManagerProps {
  requestId: number;
  originalAmount: number;
  serviceCharges: ServiceCharge[];
  adminTotalAmount?: number;
  pricingStatus: string;
  onChargesUpdated: () => void;
}

const ServiceChargeManager: React.FC<ServiceChargeManagerProps> = ({
  requestId,
  originalAmount,
  serviceCharges,
  adminTotalAmount,
  pricingStatus,
  onChargesUpdated
}) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCharge, setNewCharge] = useState({
    description: '',
    amount: '',
    type: 'other'
  });

  const addChargeMutation = useMutation({
    mutationFn: async ({ description, amount, type }: { description: string; amount: number; type: string }) => {
      // Generate a client-side id for the charge
      const chargeId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Fetch current charges to avoid overwriting
      const { data: rows, error: fetchError } = await supabase
        .from('order_requests')
        .select('service_charges')
        .eq('id', requestId)
        .limit(1)
        .maybeSingle();
      if (fetchError) throw fetchError;

      const existingCharges: any[] = Array.isArray(rows?.service_charges) ? rows!.service_charges as any[] : [];
      const newCharge = {
        id: chargeId,
        description,
        amount,
        type,
        added_at: new Date().toISOString()
      };
      const updatedCharges = [...existingCharges, newCharge];

      // Recalculate final total on the client (originalAmount + sum(updatedCharges))
      const sumCharges = updatedCharges.reduce((s, c: any) => s + (Number(c.amount) || 0), 0);
      const newAdminTotal = (Number(adminTotalAmount ?? 0) > 0 ? Number(adminTotalAmount) : Number(originalAmount || 0)) + sumCharges;

      const { error: updateError } = await supabase
        .from('order_requests')
        .update({
          service_charges: updatedCharges,
          admin_total_amount: newAdminTotal,
          pricing_status: 'quoted',
        })
        .eq('id', requestId)
        .in('pricing_status', ['pending', 'quoted']);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Service charge added successfully');
      setShowAddForm(false);
      setNewCharge({ description: '', amount: '', type: 'other' });
      onChargesUpdated();
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to add service charge: ${error.message}`);
    }
  });

  const removeChargeMutation = useMutation({
    mutationFn: async (chargeId: string) => {
      // Fetch current charges
      const { data: rows, error: fetchError } = await supabase
        .from('order_requests')
        .select('service_charges')
        .eq('id', requestId)
        .limit(1)
        .maybeSingle();
      if (fetchError) throw fetchError;

      const existingCharges: any[] = Array.isArray(rows?.service_charges) ? rows!.service_charges as any[] : [];
      const updatedCharges = existingCharges.filter((c: any) => c.id !== chargeId);
      const sumCharges = updatedCharges.reduce((s, c: any) => s + (Number(c.amount) || 0), 0);
      const newAdminTotal = (Number(adminTotalAmount ?? 0) > 0 ? Number(adminTotalAmount) : Number(originalAmount || 0)) + sumCharges;
      const newPricingStatus = updatedCharges.length === 0 ? 'pending' : 'quoted';

      const { error: updateError } = await supabase
        .from('order_requests')
        .update({
          service_charges: updatedCharges,
          admin_total_amount: newAdminTotal,
          pricing_status: newPricingStatus,
        })
        .eq('id', requestId)
        .in('pricing_status', ['pending', 'quoted']);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Service charge removed');
      onChargesUpdated();
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove service charge: ${error.message}`);
    }
  });

  const sendQuoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('order_requests')
        .update({
          pricing_status: 'quoted',
          quote_sent_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .in('pricing_status', ['pending', 'quoted']);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Quote sent to customer');
      onChargesUpdated();
      queryClient.invalidateQueries({ queryKey: ['orderRequests'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to send quote: ${error.message}`);
    }
  });

  const handleAddCharge = () => {
    if (!newCharge.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!newCharge.amount || parseFloat(newCharge.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    addChargeMutation.mutate({
      description: newCharge.description,
      amount: parseFloat(newCharge.amount),
      type: newCharge.type
    });
  };

  const totalServiceCharges = serviceCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const finalTotal = adminTotalAmount || (originalAmount + totalServiceCharges);

  const canModify = pricingStatus === 'pending' || pricingStatus === 'quoted';

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Service Charges & Pricing
        </h4>
        {canModify && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={addChargeMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Charge
          </Button>
        )}
      </div>

      {/* Original Amount */}
      <div className="flex justify-between items-center py-2 border-b">
        <span className="text-sm text-gray-600 dark:text-gray-300">Original Amount:</span>
        <span className="font-medium flex items-center">
          <IndianRupee className="h-4 w-4" />
          {originalAmount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Service Charges List */}
      {serviceCharges.length > 0 && (
        <div className="space-y-2">
          {serviceCharges.map((charge) => (
            <div key={charge.id} className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-700 rounded border">
              <div className="flex-1">
                <span className="font-medium text-sm">{charge.description}</span>
                <span className="text-xs text-gray-500 ml-2">({charge.type})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium flex items-center">
                  <IndianRupee className="h-3 w-3" />
                  {charge.amount.toLocaleString('en-IN')}
                </span>
                {canModify && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeChargeMutation.mutate(charge.id)}
                    disabled={removeChargeMutation.isPending}
                    className="p-1 h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Charge Form */}
      {showAddForm && canModify && (
        <div className="space-y-3 p-3 bg-white dark:bg-gray-700 rounded border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                label="Description"
                value={newCharge.description}
                onChange={(e) => setNewCharge(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Design charges, Premium paper, etc."
                disabled={addChargeMutation.isPending}
              />
            </div>
            <Input
              label="Amount (₹)"
              type="number"
              value={newCharge.amount}
              onChange={(e) => setNewCharge(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
              disabled={addChargeMutation.isPending}
            />
          </div>
          <div className="flex justify-between items-center">
            <select
              value={newCharge.type}
              onChange={(e) => setNewCharge(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500"
              disabled={addChargeMutation.isPending}
            >
              <option value="design">Design</option>
              <option value="printing">Printing</option>
              <option value="delivery">Delivery</option>
              <option value="material">Material</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
                disabled={addChargeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddCharge}
                disabled={addChargeMutation.isPending}
              >
                {addChargeMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div className="flex justify-between items-center py-3 border-t-2 border-primary/20 font-bold text-lg">
        <span>Final Total:</span>
        <span className="flex items-center text-primary">
          <IndianRupee className="h-5 w-5" />
          {finalTotal.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Send Quote Button */}
      {serviceCharges.length > 0 && pricingStatus === 'quoted' && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendQuoteMutation.mutate()}
            disabled={sendQuoteMutation.isPending}
            className="w-full"
          >
            {sendQuoteMutation.isPending ? 'Sending Quote...' : 'Send Updated Quote to Customer'}
          </Button>
        </div>
      )}

      {/* Status Badge */}
      <div className="text-xs text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          pricingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          pricingStatus === 'quoted' ? 'bg-blue-100 text-blue-800' :
          pricingStatus === 'accepted' ? 'bg-green-100 text-green-800' :
          pricingStatus === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          Status: {pricingStatus.charAt(0).toUpperCase() + pricingStatus.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default ServiceChargeManager;
