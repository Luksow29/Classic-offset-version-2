-- supabase/migrations/20250615130000_add_list_new_customers_function.sql

CREATE OR REPLACE FUNCTION list_new_customers_by_date(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
        SELECT 
            c.id,
            c.name,
            c.phone,
            c.address,
            c.created_at
        FROM 
            customers c
        WHERE 
            c.created_at::date BETWEEN start_date AND end_date
        ORDER BY
            c.created_at DESC;
END;
$$;
