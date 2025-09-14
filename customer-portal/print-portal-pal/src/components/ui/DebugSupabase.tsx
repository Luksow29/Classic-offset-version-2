import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const DebugSupabase = () => {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [details, setDetails] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  const testConnection = async () => {
    setStatus('testing');
    setDetails('Testing connection...');
    
    try {
      // Test 1: Basic database connection
      const { data, error } = await supabase.from('customers').select('count').limit(1);
      if (error) throw error;
      
      // Test 2: Check authentication
      const { data: session } = await supabase.auth.getSession();
      
      // Test 3: Check user permissions
      if (session?.session?.user) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();
        
        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError;
        }
        
        setStatus('success');
        setDetails(`✅ Connection OK\n✅ Auth: ${session.session ? 'Active' : 'None'}\n✅ Customer: ${customerData ? 'Found' : 'Not found (will be created)'}`);
      } else {
        setStatus('success');
        setDetails('✅ Connection OK\n⚠️ No active session');
      }
    } catch (error: any) {
      setStatus('error');
      setDetails(`❌ Error: ${error.message}\nCode: ${error.code || 'Unknown'}`);
    }
  };

  useEffect(() => {
    // Auto-run test on component mount
    testConnection();
  }, []);

  // Only show in development or when specifically needed
  if (!isVisible && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          Debug DB
        </Button>
      ) : (
        <Card className="w-80 bg-background/95 backdrop-blur-sm border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Supabase Connection Status
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {status === 'testing' && <RefreshCw className="h-4 w-4 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm font-medium">
                {status === 'testing' && 'Testing...'}
                {status === 'success' && 'Connected'}
                {status === 'error' && 'Connection Failed'}
              </span>
            </div>
            <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
              {details}
            </pre>
            <Button onClick={testConnection} size="sm" className="w-full">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
