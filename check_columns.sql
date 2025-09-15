-- Test query to check if service charge columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'order_requests' 
  AND table_schema = 'public'
  AND column_name IN ('service_charges', 'admin_total_amount', 'pricing_status', 'quote_sent_at', 'quote_response_at')
ORDER BY column_name;
