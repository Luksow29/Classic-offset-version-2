-- Creates a unified order activity timeline view merging order creation,
-- status updates, payments, and chat messages so admin and customer
-- applications can render a single chronology.

DROP VIEW IF EXISTS order_activity_timeline;

CREATE VIEW order_activity_timeline AS
WITH base_orders AS (
  SELECT
    o.id,
    o.customer_id,
    o.user_id,
    COALESCE(o.created_at, o.date::timestamptz, NOW()) AS created_at,
    o.total_amount,
    o.amount_received,
    o.balance_amount,
    o.payment_method,
    o.order_type,
    o.quantity,
    c.name AS customer_name
  FROM orders o
  LEFT JOIN customers c ON c.id = o.customer_id
)
SELECT
  CONCAT('order_', bo.id)::text AS event_id,
  bo.id AS order_id,
  'order_created'::text AS event_type,
  CASE WHEN bo.customer_id IS NOT NULL THEN 'customer' ELSE 'system' END::text AS actor_type,
  bo.customer_id::text AS actor_id,
  COALESCE(bo.customer_name, 'Customer')::text AS actor_name,
  bo.created_at AS occurred_at,
  'Order created'::text AS title,
  CONCAT('Order placed for ', COALESCE(bo.order_type, 'Unknown item'), ' (Qty: ', bo.quantity, ')')::text AS message,
  jsonb_build_object(
    'order_type', bo.order_type,
    'quantity', bo.quantity,
    'total_amount', bo.total_amount,
    'amount_received', bo.amount_received,
    'balance_amount', bo.balance_amount,
    'payment_method', bo.payment_method
  ) AS metadata
FROM base_orders bo

UNION ALL

SELECT
  CONCAT('status_', osl.id)::text AS event_id,
  osl.order_id AS order_id,
  'status_update'::text AS event_type,
  CASE WHEN osl.updated_by IS NULL OR osl.updated_by = '' THEN 'system' ELSE 'admin' END::text AS actor_type,
  osl.updated_by::text AS actor_id,
  COALESCE(u.name, u.email, osl.updated_by, 'System')::text AS actor_name,
  COALESCE(osl.updated_at::timestamptz, NOW()) AS occurred_at,
  CONCAT('Status updated to ', COALESCE(osl.status, 'Unknown'))::text AS title,
  NULL::text AS message,
  jsonb_build_object(
    'status', osl.status
  ) AS metadata
FROM order_status_log osl
LEFT JOIN users u ON u.id::text = osl.updated_by OR u.email = osl.updated_by
WHERE osl.order_id IS NOT NULL

UNION ALL

SELECT
  CONCAT('payment_', pay.id)::text AS event_id,
  pay.order_id AS order_id,
  'payment_recorded'::text AS event_type,
  CASE WHEN pay.created_by IS NULL THEN 'system' ELSE 'admin' END::text AS actor_type,
  pay.created_by::text AS actor_id,
  COALESCE(up.name, up.email, pay.created_by::text, 'Payments Team')::text AS actor_name,
  COALESCE(pay.payment_date::timestamptz, pay.created_at::timestamptz, NOW()) AS occurred_at,
  'Payment recorded'::text AS title,
  CONCAT('Received Rs ', COALESCE(TO_CHAR(pay.amount_paid, 'FM999,999,990.00'), 'payment'))::text AS message,
  jsonb_build_object(
    'amount', pay.amount_paid,
    'status', pay.status,
    'method', pay.payment_method,
    'notes', pay.notes,
    'payment_date', pay.payment_date,
    'due_date', pay.due_date
  ) AS metadata
FROM payments pay
LEFT JOIN users up ON up.id::text = pay.created_by OR up.email = pay.created_by
WHERE pay.order_id IS NOT NULL

UNION ALL

SELECT
  CONCAT('chat_', ocm.id)::text AS event_id,
  oct.order_id AS order_id,
  'chat_message'::text AS event_type,
  ocm.sender_type::text AS actor_type,
  ocm.sender_id::text AS actor_id,
  COALESCE(usr.name, usr.email, cust.name, INITCAP(ocm.sender_type), 'Chat User')::text AS actor_name,
  COALESCE(ocm.created_at::timestamptz, NOW()) AS occurred_at,
  CONCAT('Chat message • ', COALESCE(oct.subject, 'General'))::text AS title,
  LEFT(COALESCE(ocm.content, ''), 280)::text AS message,
  jsonb_build_object(
    'thread_id', ocm.thread_id,
    'message_type', ocm.message_type,
    'is_read', ocm.is_read,
    'file_url', ocm.file_url,
    'file_name', ocm.file_name,
    'file_size', ocm.file_size,
    'file_type', ocm.file_type
  ) AS metadata
FROM order_chat_messages ocm
JOIN order_chat_threads oct ON oct.id = ocm.thread_id
LEFT JOIN users usr ON usr.id::text = ocm.sender_id OR usr.email = ocm.sender_id
LEFT JOIN customers cust ON cust.user_id::text = ocm.sender_id
WHERE oct.order_id IS NOT NULL;
