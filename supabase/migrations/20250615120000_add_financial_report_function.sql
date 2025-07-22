-- supabase/migrations/20250615120000_add_financial_report_function.sql

CREATE OR REPLACE FUNCTION get_financial_report_for_period(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (total_revenue NUMERIC, total_expenses NUMERIC, net_profit NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
    revenue_val NUMERIC;
    expenses_val NUMERIC;
BEGIN
    -- Calculate Total Revenue from the payments table
    -- CORRECTED: The column name is 'amount_paid', not 'amount'.
    SELECT COALESCE(SUM(p.amount_paid), 0)
    INTO revenue_val
    FROM payments p
    WHERE p.payment_date BETWEEN start_date AND end_date;

    -- Calculate Total Expenses from the expenses table
    SELECT COALESCE(SUM(e.amount), 0)
    INTO expenses_val
    FROM expenses e
    WHERE e.date BETWEEN start_date AND end_date;

    -- Return the calculated values
    RETURN QUERY SELECT 
        revenue_val, 
        expenses_val, 
        (revenue_val - expenses_val) as calculated_net_profit;
END;
$$;
