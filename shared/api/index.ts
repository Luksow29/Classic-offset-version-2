// shared/api/index.ts
// Main export file for shared API utilities

// Supabase client
export {
  createAppSupabaseClient,
  getSupabase,
  resetSupabaseClient,
  isSupabaseConfigured,
  getSupabaseUrl,
  type SupabaseClientConfig,
  type SupabaseClient,
  type Session,
  type AuthUser,
} from './supabaseClient';

// Orders API
export {
  getCustomerOrders,
  getOrder,
  getAllOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getCustomerOrderRequests,
  getPendingOrderRequests,
  createOrderRequest,
  updateOrderRequest,
  updateRequestPricingStatus,
  approveOrderRequest,
  rejectOrderRequest,
  getOrderSummaryWithDues,
  calculateOrderTotals,
  toOrdersTableFormat,
} from './orders';

// Customers API
export {
  getCustomer,
  getCustomerByUserId,
  getAllCustomers,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSummary,
  getAllCustomerSummaries,
  getCustomerStats,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  formatCustomerName,
  getCustomerInitials,
} from './customers';

// Notifications API
export {
  sendNotification,
  sendBulkNotification,
  sendOrderUpdateNotification,
  sendPaymentNotification,
  sendQuoteNotification,
  sendDeliveryNotification,
  sendMessageNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type SendNotificationParams,
  type SendNotificationResult,
} from './notifications';
