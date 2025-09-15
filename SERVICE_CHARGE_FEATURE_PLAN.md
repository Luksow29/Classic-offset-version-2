# Service Charge Feature Implementation Plan

## 🎯 Objective
Add service charge functionality to order requests so admins can modify pricing before approval, with real-time sync to customer portal.

## 📊 Current System Analysis

### Customer Portal Flow:
1. Customer submits request → `order_requests` table
2. Request contains: `request_data` (JSON with orderType, quantity, rate, totalAmount, etc.)
3. Status: `pending_approval` → customer waits for response

### Admin Portal Flow:
1. Admin sees requests in `OrderRequestsTable.tsx`
2. Can only **Approve** (calls `approve_order_request()`) or **Reject**
3. No option to modify pricing before approval

## 🔧 Solution Design

### 1. Database Schema Changes
Add columns to `order_requests` table:
```sql
ALTER TABLE order_requests ADD COLUMN service_charges JSONB DEFAULT '[]';
ALTER TABLE order_requests ADD COLUMN admin_total_amount NUMERIC;
ALTER TABLE order_requests ADD COLUMN pricing_status TEXT DEFAULT 'pending' CHECK (pricing_status IN ('pending', 'quoted', 'approved', 'rejected'));
```

### 2. Service Charge Structure
```json
{
  "service_charges": [
    {
      "id": "uuid",
      "description": "Design Charge",
      "amount": 500,
      "type": "design|printing|delivery|other",
      "added_by": "admin_user_id",
      "added_at": "timestamp"
    }
  ],
  "admin_total_amount": 2500,
  "pricing_status": "quoted"
}
```

### 3. New Status Flow
```
Customer Request → pending_approval
Admin Adds Service Charges → quoted (customer notified)
Customer Accepts Quote → accepted (admin can approve)
Customer Rejects Quote → rejected
Admin Approves → approved (creates order)
```

## 🚀 Implementation Steps

### Step 1: Database Migration
- Add service charge columns to order_requests
- Create service charge management functions

### Step 2: Admin UI Enhancement
- Add service charge form to OrderRequestsTable
- Show pricing breakdown with add/remove charges
- Add "Send Quote" button alongside Approve/Reject

### Step 3: Customer Portal Enhancement
- Show service charge breakdown in CustomerOrders
- Add accept/reject buttons for quotes
- Real-time notifications for pricing updates

### Step 4: Backend Functions
- `add_service_charge_to_request()`
- `update_request_pricing()`
- `customer_accept_quote()`
- Modified `approve_order_request()` to handle final pricing

### Step 5: Real-time Sync
- Supabase subscriptions for pricing updates
- Push notifications to customer
- Status change triggers

## 📱 UI/UX Design

### Admin Interface:
```
[Request Card]
├── Customer Info
├── Original Request Details
├── Service Charges Section
│   ├── + Add Charge (Design/Printing/Delivery/Other)
│   ├── Charge List (Description, Amount, Remove)
│   └── Total Calculation
└── Actions
    ├── Send Quote (if charges added)
    ├── Approve (if no charges or customer accepted)
    └── Reject
```

### Customer Interface:
```
[Order Status]
├── Original Request: ₹1,500
├── Service Charges:
│   ├── Design Charge: ₹500
│   └── Premium Paper: ₹300
├── Final Total: ₹2,300
└── Actions (if quoted)
    ├── Accept Quote
    └── Decline Quote
```

## 🔄 Workflow Examples

### Example 1: Simple Approval (No Service Charges)
1. Customer submits ₹1,500 request
2. Admin clicks "Approve" directly
3. Order created with original amount

### Example 2: Service Charges Added
1. Customer submits ₹1,500 request
2. Admin adds ₹500 design charge + ₹200 delivery
3. Admin clicks "Send Quote" → customer notified
4. Customer sees ₹2,200 total, clicks "Accept"
5. Admin clicks "Approve" → order created with ₹2,200

### Example 3: Customer Rejects Quote
1. Customer submits ₹1,500 request
2. Admin adds ₹800 service charges
3. Customer sees ₹2,300 total, clicks "Decline"
4. Request marked as rejected, ends workflow

## 🔧 Technical Implementation Details

### Database Functions:
```sql
-- Add service charge
CREATE FUNCTION add_service_charge_to_request(
  request_id BIGINT,
  description TEXT,
  amount NUMERIC,
  charge_type TEXT
) RETURNS VOID;

-- Send quote to customer
CREATE FUNCTION send_quote_to_customer(
  request_id BIGINT
) RETURNS VOID;

-- Customer accepts quote
CREATE FUNCTION customer_accept_quote(
  request_id BIGINT
) RETURNS VOID;
```

### Real-time Events:
- `order_request_quoted` → notify customer
- `quote_accepted` → notify admin
- `quote_rejected` → notify admin

This feature will provide complete pricing flexibility while maintaining transparency with customers.
