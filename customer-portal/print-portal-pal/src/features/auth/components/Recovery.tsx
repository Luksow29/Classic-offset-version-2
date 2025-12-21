import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2, RefreshCw } from 'lucide-react';

interface RecoveryProps {
  onSuccess: () => void;
}

export const CustomerRecovery = ({ onSuccess }: RecoveryProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { toast } = useToast();

  const handleCreateProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No active session found');
      }

      const { error } = await supabase
        .from('customers')
        .insert({
          user_id: session.user.id,
          name: name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Customer',
          email: session.user.email,
          phone: phone || session.user.user_metadata?.phone,
          address: address || session.user.user_metadata?.address,
          joined_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: 'Profile Created Successfully!',
        description: 'Your customer profile has been created. Redirecting to portal...',
      });

      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Profile Creation Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-customer flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            We need to create your customer profile to access the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-name">Full Name (Optional)</Label>
            <Input
              id="recovery-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovery-phone">Phone Number (Optional)</Label>
            <Input
              id="recovery-phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovery-address">Address (Optional)</Label>
            <Input
              id="recovery-address"
              type="text"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Button 
              onClick={handleCreateProfile}
              className="w-full bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Profile & Continue
            </Button>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
