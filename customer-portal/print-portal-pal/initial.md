# Template for a New Feature Request

Use this template to define new features.

---

## Feature: [Feature Title]

**Description:**
[Describe the feature, its purpose, and the user problem it solves.]

## Acceptance Criteria
- [List each requirement or behavior that must be met for the feature to be considered complete.]
- [Use bullet points for clarity.]

## Reference Files (for RAG):
- [List relevant files or components that should be reviewed or modified.]

---

### Example

**Feature:** Add "Quick Re-order" Functionality

**Description:**
Customers often place repeat orders. We need to add a "Quick Re-order" button to each completed order in the CustomerOrders component. When a customer clicks this button, it should pre-fill the CustomerOrderRequest form with the details of the selected past order, allowing them to quickly submit a new request.

**Acceptance Criteria:**
- A "Quick Re-order" button should appear on each order card in the CustomerOrders view, but only if the order status is "Completed" or "Delivered".
- The button should have an appropriate icon (e.g., RefreshCw from Lucide).
- When the button is clicked, the user should be navigated to the "Requests" tab (CustomerRequests component).
- The form in the CustomerOrderRequest component should be pre-populated with the following data from the old order:
  - Order Type
  - Product
  - Quantity
  - Design Needed (checkbox state)
  - Notes
- The Delivery Date should not be pre-filled and should remain blank for the user to select.
- The Rate and Estimated Total should be recalculated based on the current product price, not the old order's price.
- A toast notification should appear confirming that the form has been pre-filled, e.g., `toast({ title: "Re-order Started", description: "Order details have been filled in. Please select a new delivery date." });`

**Reference Files (for RAG):**
- `src/components/customer/CustomerOrders.tsx`: This is where the button needs to be added. Analyze how existing order data is mapped and displayed.
- `src/components/customer/CustomerOrderRequest.tsx`: This is the form that needs to be pre-populated. Analyze how react-hook-form is used here, especially the form.setValue or defaultValues functionality.
- `src/pages/CustomerPortal.tsx`: Analyze how the tabs are controlled to programmatically switch to the "Requests" tab. The setActiveTab state setter will be needed.
