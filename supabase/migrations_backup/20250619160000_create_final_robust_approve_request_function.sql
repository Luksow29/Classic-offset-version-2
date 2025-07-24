
-- Migration to create a final, robust version of the approve_order_request function.
-- This version joins the customers table to get the authoritative customer name and
-- uses reliable table columns for all IDs and timestamps, completely avoiding
-- reliance on the JSON payload for critical data.

-- 1. Update the 'approve_order_request' function
DROP FUNCTION IF EXISTS public.approve_order_request(bigint);

CREATE OR REPLACE FUNCTION public.approve_order_request(request_id bigint)
 RETURNS TABLE(id bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_request_data jsonb;
  v_customer_id uuid;
  v_user_id uuid;
  v_created_at timestamp with time zone;
  v_customer_name text;
  new_order_id bigint;
  v_amount_received numeric;
  v_total_amount numeric;
BEGIN
  -- Get all required data from reliable table columns, including joining for customer_name
  SELECT
    req.request_data,
    req.customer_id,
    req.user_id,
    req.created_at,
    cust.name
  INTO
    v_request_data,
    v_customer_id,
    v_user_id,
    v_created_at,
    v_customer_name
  FROM public.order_requests req
  JOIN public.customers cust ON req.customer_id = cust.id
  WHERE req.id = request_id AND req.status IN ('pending', 'pending_approval');

  IF FOUND THEN
    -- Safely extract numeric values from the JSON payload
    v_total_amount := (v_request_data->>'totalAmount')::numeric;
    v_amount_received := COALESCE((v_request_data->>'amountReceived')::numeric, 0);

    -- Insert into the 'orders' table using the reliable, authoritative data
    INSERT INTO public.orders (
      date, customer_id, user_id, customer_name, order_type, product_id,
      quantity, rate, total_amount, amount_received, balance_amount,
      payment_method, design_needed, designer_id, delivery_date, notes
    )
    VALUES (
      v_created_at::date, -- Use the timestamp from the request table
      v_customer_id,      -- Use the reliable customer_id from the column
      v_user_id,          -- Use the reliable user_id from the column
      v_customer_name,    -- Use the customer name from the join
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

    -- If a payment was made, create a corresponding record
    IF v_amount_received > 0 THEN
      INSERT INTO public.payments (
        order_id, customer_id, created_by, amount_paid, payment_date, payment_method, notes
      )
      VALUES (
        new_order_id,
        v_customer_id, -- Use reliable customer_id
        v_user_id,     -- Use reliable user_id
        v_amount_received,
        v_created_at::date, -- Use the request creation date for consistency
        v_request_data->>'paymentMethod',
        'Initial payment with order request.'
      );
    END IF;

    -- Mark the request as 'approved'
    UPDATE public.order_requests
    SET status = 'approved'
    WHERE public.order_requests.id = request_id;

    -- Return the ID of the new order
    RETURN QUERY SELECT new_order_id;
  ELSE
    -- If no request was found, raise an exception
    RAISE EXCEPTION 'No pending request found with ID %', request_id;
  END IF;
END;
$function$;

-- 2. Update the 'reject_order_request' function for consistency
DROP FUNCTION IF EXISTS public.reject_order_request(bigint, text);

CREATE OR REPLACE FUNCTION public.reject_order_request(request_id bigint, reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update the status to 'rejected', allowing for both 'pending' and 'pending_approval'
  UPDATE public.order_requests
  SET
    status = 'rejected',
    rejection_reason = reason
  WHERE public.order_requests.id = request_id AND public.order_requests.status IN ('pending', 'pending_approval');

  -- If no row was updated, raise an exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending request found with ID %', request_id;
  END IF;
END;
$function$;
