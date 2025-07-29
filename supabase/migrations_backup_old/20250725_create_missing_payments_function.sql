CREATE OR REPLACE FUNCTION trigger_missing_payments()
RETURNS void AS $$
DECLARE
  order_row RECORD;
  new_payment_id uuid;
BEGIN
  -- Loop through orders with amount_received but no corresponding payment
  FOR order_row IN
    SELECT o.id, o.customer_id, o.total_amount, o.amount_received, o.payment_method
    FROM orders o
    LEFT JOIN payments p ON o.id = p.order_id
    WHERE o.amount_received > 0 AND p.id IS NULL
  LOOP
    -- Insert into payments table
    INSERT INTO payments (customer_id, order_id, total_amount, amount_paid, payment_date, status, created_at, payment_method)
    VALUES (
      order_row.customer_id,
      order_row.id,
      order_row.total_amount,
      order_row.amount_received,
      CURRENT_DATE,
      CASE
        WHEN order_row.amount_received >= order_row.total_amount THEN 'Paid'
        ELSE 'Partial'
      END,
      CURRENT_TIMESTAMP,
      order_row.payment_method
    ) RETURNING id INTO new_payment_id;

    -- Insert into payment_history table
    INSERT INTO payment_history (payment_id, action, new_data, changed_by)
    VALUES (
      new_payment_id,
      'INSERT',
      jsonb_build_object(
        'payment_id', new_payment_id,
        'order_id', order_row.id,
        'amount_paid', order_row.amount_received
      ),
      auth.uid() -- Assumes the function is run by an authenticated user
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
