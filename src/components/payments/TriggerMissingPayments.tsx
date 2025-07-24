import { supabase } from '../../lib/supabaseClient';
import Button from '../ui/Button';

const TriggerMissingPayments = () => {
  const handleTrigger = async () => {
    const { error } = await supabase.rpc('trigger_missing_payments');
    if (error) {
      console.error('Error triggering missing payments:', error);
      alert('Error triggering missing payments!');
    } else {
      alert('Missing payments triggered successfully!');
    }
  };

  return (
    <div className="p-4">
      <Button onClick={handleTrigger}>Trigger Missing Payments</Button>
      <p className="text-sm text-gray-500 mt-2">
        This will find orders with payments that haven't been recorded in the payments table and create the corresponding payment entries.
      </p>
    </div>
  );
};

export default TriggerMissingPayments;
