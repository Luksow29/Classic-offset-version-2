-- supabase/migrations/20250615110000_add_new_customer_count_function.sql

CREATE OR REPLACE FUNCTION get_new_customer_count(
    start_date DATE,
    end_date DATE
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM customers
        WHERE created_at::date >= start_date AND created_at::date <= end_date
    );
END;
$$;
