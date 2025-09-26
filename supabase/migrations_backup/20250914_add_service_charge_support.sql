-- Migration: Add Service Charge Support to Order Requests
-- Created: 2025-09-14
-- Purpose: Enable admins to add service charges to customer requests before approval

-- Add service charge columns to order_requests table
ALTER TABLE order_requests 
ADD COLUMN IF NOT EXISTS service_charges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_total_amount NUMERIC,
ADD COLUMN IF NOT EXISTS pricing_status TEXT DEFAULT 'pending' CHECK (pricing_status IN ('pending', 'quoted', 'accepted', 'rejected', 'approved')),
ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quote_response_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on pricing_status queries
CREATE INDEX IF NOT EXISTS idx_order_requests_pricing_status ON order_requests(pricing_status);

-- Function to add service charge to a request
CREATE OR REPLACE FUNCTION add_service_charge_to_request(
  request_id BIGINT,
  description TEXT,
  amount NUMERIC,
  charge_type TEXT DEFAULT 'other'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_charge JSONB;
  current_charges JSONB;
  updated_charges JSONB;
  original_total NUMERIC;
  new_total NUMERIC;
BEGIN
  -- Validate inputs
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Service charge amount must be greater than 0';
  END IF;
  
  IF description IS NULL OR TRIM(description) = '' THEN
    RAISE EXCEPTION 'Service charge description is required';
  END IF;

  -- Get current charges and original total
  SELECT 
    COALESCE(service_charges, '[]'::jsonb),
    (request_data->>'totalAmount')::numeric
  INTO current_charges, original_total
  FROM order_requests 
  WHERE id = request_id AND pricing_status IN ('pending', 'quoted');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or cannot be modified';
  END IF;

  -- Create new charge object
  new_charge := jsonb_build_object(
    'id', gen_random_uuid(),
    'description', description,
    'amount', amount,
    'type', charge_type,
    'added_at', NOW()
  );

  -- Add to existing charges
  updated_charges := current_charges || jsonb_build_array(new_charge);
  
  -- Calculate new total
  SELECT original_total + SUM((charge->>'amount')::numeric)
  INTO new_total
  FROM jsonb_array_elements(updated_charges) AS charge;

  -- Update the request
  UPDATE order_requests 
  SET 
    service_charges = updated_charges,
    admin_total_amount = new_total,
    pricing_status = 'quoted'
  WHERE id = request_id;

  RETURN new_charge;
END;
$$;

-- Function to remove service charge from a request
CREATE OR REPLACE FUNCTION remove_service_charge_from_request(
  request_id BIGINT,
  charge_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_charges JSONB;
  original_total NUMERIC;
  new_total NUMERIC;
BEGIN
  -- Get current data
  SELECT 
    service_charges,
    (request_data->>'totalAmount')::numeric
  INTO updated_charges, original_total
  FROM order_requests 
  WHERE id = request_id AND pricing_status IN ('pending', 'quoted');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or cannot be modified';
  END IF;

  -- Remove the charge with matching ID
  SELECT jsonb_agg(charge)
  INTO updated_charges
  FROM jsonb_array_elements(updated_charges) AS charge
  WHERE (charge->>'id')::uuid != charge_id;

  -- Calculate new total
  IF updated_charges IS NULL OR jsonb_array_length(updated_charges) = 0 THEN
    new_total := original_total;
    updated_charges := '[]'::jsonb;
  ELSE
    SELECT original_total + SUM((charge->>'amount')::numeric)
    INTO new_total
    FROM jsonb_array_elements(updated_charges) AS charge;
  END IF;

  -- Update the request
  UPDATE order_requests 
  SET 
    service_charges = updated_charges,
    admin_total_amount = new_total,
    pricing_status = CASE 
      WHEN jsonb_array_length(updated_charges) = 0 THEN 'pending'
      ELSE 'quoted'
    END
  WHERE id = request_id;
END;
$$;

-- Function to send quote to customer (updates status and timestamp)
CREATE OR REPLACE FUNCTION send_quote_to_customer(
  request_id BIGINT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE order_requests 
  SET 
    pricing_status = 'quoted',
    quote_sent_at = NOW()
  WHERE id = request_id AND pricing_status IN ('pending', 'quoted');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or cannot send quote';
  END IF;
END;
$$;

-- Function for customer to accept quote
CREATE OR REPLACE FUNCTION customer_accept_quote(
  request_id BIGINT,
  customer_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE order_requests 
  SET 
    pricing_status = 'accepted',
    quote_response_at = NOW()
  WHERE id = request_id 
    AND customer_id = customer_accept_quote.customer_id 
    AND pricing_status = 'quoted';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or customer not authorized to accept quote';
  END IF;
END;
$$;

-- Function for customer to reject quote
CREATE OR REPLACE FUNCTION customer_reject_quote(
  request_id BIGINT,
  customer_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE order_requests 
  SET 
    pricing_status = 'rejected',
    quote_response_at = NOW()
  WHERE id = request_id 
    AND customer_id = customer_reject_quote.customer_id 
    AND pricing_status = 'quoted';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or customer not authorized to reject quote';
  END IF;
END;
$$;

-- Update the existing approve_order_request function to handle service charges
CREATE OR REPLACE FUNCTION approve_order_request_with_service_charges(request_id bigint)
RETURNS TABLE(id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_data jsonb;
  v_customer_id uuid;
  v_user_id uuid;
  v_created_at timestamp with time zone;
  v_customer_name text;
  v_service_charges jsonb;
  v_admin_total_amount numeric;
  new_order_id bigint;
  v_amount_received numeric;
  v_total_amount numeric;
BEGIN
  -- Get all required data from the request
  SELECT
    req.request_data,
    req.customer_id,
    req.user_id,
    req.created_at,
    cust.name,
    COALESCE(req.service_charges, '[]'::jsonb),
    req.admin_total_amount
  INTO
    v_request_data,
    v_customer_id,
    v_user_id,
    v_created_at,
    v_customer_name,
    v_service_charges,
    v_admin_total_amount
  FROM public.order_requests req
  JOIN public.customers cust ON req.customer_id = cust.id
  WHERE req.id = request_id AND req.pricing_status IN ('pending', 'accepted');

  IF FOUND THEN
    -- Use admin total if service charges were added, otherwise use original total
    v_total_amount := COALESCE(v_admin_total_amount, (v_request_data->>'totalAmount')::numeric);
    v_amount_received := COALESCE((v_request_data->>'amountReceived')::numeric, 0);

    -- Insert into the orders table
    INSERT INTO public.orders (
      date, customer_id, user_id, customer_name, order_type, product_id,
      quantity, rate, total_amount, amount_received, balance_amount,
      payment_method, design_needed, designer_id, delivery_date, notes
    )
    VALUES (
      v_created_at::date,
      v_customer_id,
      v_user_id,
      v_customer_name,
      v_request_data->>'orderType',
      (v_request_data->>'productId')::bigint,
      (v_request_data->>'quantity')::integer,
      (v_request_data->>'rate')::numeric,
      v_total_amount,
      v_amount_received,
      v_total_amount - v_amount_received,
      CASE WHEN v_amount_received > 0 THEN v_request_data->>'paymentMethod' ELSE NULL END,
      COALESCE((v_request_data->>'designNeeded')::boolean, false),
      (v_request_data->>'designerId')::uuid,
      (v_request_data->>'deliveryDate')::date,
      v_request_data->>'notes'
    )
    RETURNING public.orders.id INTO new_order_id;

    -- If service charges were added, store them in order notes
    IF jsonb_array_length(v_service_charges) > 0 THEN
      UPDATE public.orders 
      SET notes = COALESCE(notes || E'\n\n', '') || 'Service Charges: ' || v_service_charges::text
      WHERE id = new_order_id;
    END IF;

    -- Create payment record if advance was received
    IF v_amount_received > 0 THEN
      INSERT INTO public.payments (
        order_id, customer_id, created_by, amount_paid, payment_date, payment_method, notes
      )
      VALUES (
        new_order_id,
        v_customer_id,
        v_user_id,
        v_amount_received,
        v_created_at::date,
        v_request_data->>'paymentMethod',
        'Initial payment with order request.'
      );
    END IF;

    -- Mark the request as approved
    UPDATE public.order_requests
    SET pricing_status = 'approved'
    WHERE public.order_requests.id = request_id;

    RETURN QUERY SELECT new_order_id;
  ELSE
    RAISE EXCEPTION 'No pending or accepted request found with ID %', request_id;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION add_service_charge_to_request TO authenticated;
GRANT EXECUTE ON FUNCTION remove_service_charge_from_request TO authenticated;
GRANT EXECUTE ON FUNCTION send_quote_to_customer TO authenticated;
GRANT EXECUTE ON FUNCTION customer_accept_quote TO authenticated;
GRANT EXECUTE ON FUNCTION customer_reject_quote TO authenticated;
GRANT EXECUTE ON FUNCTION approve_order_request_with_service_charges TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION add_service_charge_to_request IS 'Adds a service charge to an order request and updates the total amount';
COMMENT ON FUNCTION remove_service_charge_from_request IS 'Removes a service charge from an order request and recalculates total';
COMMENT ON FUNCTION send_quote_to_customer IS 'Marks a request as quoted and records timestamp';
COMMENT ON FUNCTION customer_accept_quote IS 'Allows customer to accept a quote';
COMMENT ON FUNCTION customer_reject_quote IS 'Allows customer to reject a quote';
COMMENT ON FUNCTION approve_order_request_with_service_charges IS 'Approves an order request with service charges included';
