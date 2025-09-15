import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Calculator, 
  IndianRupee,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ServiceCharge {
  id: string;
  description: string;
  amount: number;
  type: string;
  added_at: string;
}

interface ServiceChargeDisplayProps {
  order: {
    id: number;
    original_amount?: number;
    total_amount: number;
    service_charges?: ServiceCharge[];
    pricing_status?: string;
    quote_sent_at?: string;
    is_request: boolean;
  };
  customerId: string;
  onResponseSubmitted?: () => void;
}

const ServiceChargeDisplay: React.FC<ServiceChargeDisplayProps> = ({
  order,
  customerId,
  onResponseSubmitted
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutations for quote acceptance/rejection using direct database updates
  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('order_requests')
        .update({
          pricing_status: 'accepted',
          quote_response_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('pricing_status', 'quoted'); // Only allow if currently quoted
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Quote Accepted",
        description: "Your quote has been accepted. The admin will process your order shortly.",
      });
      onResponseSubmitted?.();
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Accept Quote",
        description: error.message || "Something went wrong",
      });
    }
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('order_requests')
        .update({
          pricing_status: 'rejected',
          quote_response_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('pricing_status', 'quoted'); // Only allow if currently quoted
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Quote Rejected",
        description: "You have declined the quote. You can submit a new request if needed.",
      });
      onResponseSubmitted?.();
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Reject Quote",
        description: error.message || "Something went wrong",
      });
    }
  });

  const serviceCharges = order.service_charges || [];
  const originalAmount = order.original_amount || order.total_amount;
  const hasServiceCharges = serviceCharges.length > 0;
  const isQuoted = order.pricing_status === 'quoted';
  const totalServiceCharges = serviceCharges.reduce((sum, charge) => sum + charge.amount, 0);

  if (!order.is_request || (!hasServiceCharges && !isQuoted)) {
    return null; // Don't show for regular orders or requests without service charges
  }

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Pricing Details
          {isQuoted && (
            <Badge variant="secondary" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              Quote Received
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Original Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Original Amount:</span>
          <span className="font-medium flex items-center">
            <IndianRupee className="h-4 w-4" />
            {originalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Service Charges */}
        {hasServiceCharges && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Additional Charges:</h4>
              {serviceCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between items-center py-1 px-2 bg-muted/50 rounded">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{charge.description}</span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize">({charge.type})</span>
                  </div>
                  <span className="text-sm font-medium flex items-center">
                    <IndianRupee className="h-3 w-3" />
                    {charge.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
          </>
        )}

        {/* Total Amount */}
        <div className="flex justify-between items-center py-2 border-t-2 border-primary/20">
          <span className="font-semibold">Final Total:</span>
          <span className="font-bold text-lg flex items-center text-primary">
            <IndianRupee className="h-5 w-5" />
            {order.total_amount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Service Charge Breakdown */}
        {hasServiceCharges && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <div className="flex items-start gap-1">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Additional charges have been added based on your requirements. 
                Total service charges: ₹{totalServiceCharges.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Quote Actions */}
        {isQuoted && (
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={() => acceptQuoteMutation.mutate()}
              disabled={acceptQuoteMutation.isPending || rejectQuoteMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {acceptQuoteMutation.isPending ? "Accepting..." : "Accept Quote"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => rejectQuoteMutation.mutate()}
              disabled={acceptQuoteMutation.isPending || rejectQuoteMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {rejectQuoteMutation.isPending ? "Rejecting..." : "Decline Quote"}
            </Button>
          </div>
        )}

        {/* Quote Timestamp */}
        {order.quote_sent_at && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Quote sent on {new Date(order.quote_sent_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceChargeDisplay;
