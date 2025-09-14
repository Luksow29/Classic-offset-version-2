# Product Requirements Prompt (PRP): Quick Re-order Feature

## Objective
Enable customers to quickly re-order a previously completed or delivered order by pre-filling the order request form with relevant details from the past order.

---

## Analysis of Existing Code

### 1. State Management for Tabs in `CustomerPortal.tsx`
- The active tab is managed via a state variable (e.g., `activeTab` or similar) in `CustomerPortal.tsx`.
- Tab switching is controlled by updating this state, allowing programmatic navigation between tabs (e.g., to the "Requests" tab).

### 2. Data Structure for a Single Order in `CustomerOrders.tsx`
- Each order is represented as an object, likely containing fields such as:
  - `id`, `type`, `product`, `quantity`, `designNeeded`, `notes`, `deliveryDate`, `rate`, `estimatedTotal`, `status`, etc.
- Orders are mapped and rendered as cards or list items in the UI.

### 3. Form State Management and Fields in `CustomerOrderRequest.tsx`
- The form uses `react-hook-form` for state management.
- Fields include: Order Type, Product, Quantity, Design Needed (checkbox), Notes, Delivery Date, Rate, Estimated Total.
- The form can be pre-filled using `form.setValue` or `defaultValues`.

---

## Proposed Implementation Plan (Step-by-Step)

### Step 1: State Management for Pre-filling
- Lift the pre-fill (re-order) state up to `CustomerPortal.tsx`.
- Add a state variable (e.g., `reorderData`) in `CustomerPortal.tsx` to hold the order details to be pre-filled.
- Pass a setter function for this state down to `CustomerOrders.tsx`.

### Step 2: Modify `CustomerOrders.tsx`
- Add a "Quick Re-order" button to each order card, conditionally rendered only if `status === 'Completed' || status === 'Delivered'`.
- On click, call the setter from `CustomerPortal.tsx` with the relevant order data, and trigger tab switch to "Requests".
- Use an icon (e.g., `RefreshCw` from Lucide) for the button.

### Step 3: Modify `CustomerPortal.tsx`
- When the setter is called, update `reorderData` and set the active tab to "Requests".
- Pass `reorderData` as a prop to `CustomerOrderRequest.tsx`.

### Step 4: Modify `CustomerOrderRequest.tsx`
- Use `useEffect` to watch for changes in the `reorderData` prop.
- When present, use `form.setValue` to pre-fill the form fields:
  - Order Type, Product, Quantity, Design Needed, Notes
- Ensure Delivery Date is left blank.
- Recalculate Rate and Estimated Total based on the current product price.
- Show a toast notification confirming the form has been pre-filled.

---

## Files to be Modified
- `src/components/customer/CustomerOrders.tsx`
- `src/components/customer/CustomerOrderRequest.tsx`
- `src/pages/CustomerPortal.tsx`

---

## Testing Plan
- **Manual Test 1:** Verify the "Quick Re-order" button only appears for completed/delivered orders.
- **Manual Test 2:** Click the button and verify the tab switches to "Requests" and the form is pre-filled with the correct data.
- **Manual Test 3:** Ensure the Delivery Date field is empty after pre-filling.
- **Manual Test 4:** Submit the re-order and confirm a new request is created in Supabase with the correct details.
