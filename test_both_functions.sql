-- Test both function formats to make sure they work

-- Test the table format function
SELECT 'Table Format' as test_type, * FROM get_dashboard_metrics_table();

-- Test the JSON format function  
SELECT 'JSON Format' as test_type, get_dashboard_metrics() as result;
