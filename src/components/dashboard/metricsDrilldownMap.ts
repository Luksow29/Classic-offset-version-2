// Map metric titles to report types for drill-down navigation
export const metricsDrilldownMap: Record<string, string> = {
  "Total Revenue": "profit_loss",
  "Amount Received": "payment_details",
  "Outstanding Balance": "due_summary",
  "Total Expenses": "profit_loss",
  "Net Profit": "profit_loss",
  "Profit Margin": "profit_loss",
  "Total Orders": "orders_list",
  "Total Customers": "customers_list",
  "Stock Alerts": "stock_alerts" // If you have a stock report, otherwise leave as placeholder
};
