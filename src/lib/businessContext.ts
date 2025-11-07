// src/lib/businessContext.ts
// Business-specific context and prompts for Local AI

export interface BusinessPrompt {
  id: string;
  label: string;
  prompt: string;
  category: 'customer' | 'financial' | 'product' | 'order' | 'inventory' | 'analysis';
  description: string;
}

export const businessPrompts: BusinessPrompt[] = [
  // Customer Management
  {
    id: 'get-all-customers',
    label: 'Show All Customers',
    prompt: 'Show me all customers in our database with their contact details',
    category: 'customer',
    description: 'Displays complete customer database'
  },
  {
    id: 'find-customer',
    label: 'Find Customer',
    prompt: 'Find customer details for [customer name]',
    category: 'customer',
    description: 'Search for specific customer by name'
  },
  {
    id: 'customer-orders',
    label: 'Customer Order History',
    prompt: 'Show order history for customer [customer name]',
    category: 'customer',
    description: 'View all orders for a specific customer'
  },

  // Financial Analysis
  {
    id: 'daily-briefing',
    label: 'Daily Business Briefing',
    prompt: 'Get today\'s business briefing with orders, revenue, new customers, and alerts',
    category: 'financial',
    description: 'Complete daily business overview'
  },
  {
    id: 'financial-summary',
    label: 'Monthly Financial Summary',
    prompt: 'Show financial summary for [YYYY-MM] month',
    category: 'financial',
    description: 'Revenue and expense analysis for specific month'
  },
  {
    id: 'top-customers',
    label: 'Top Customers',
    prompt: 'Who are our top 5 spending customers of all time?',
    category: 'financial',
    description: 'Highest spending customers overall'
  },
  {
    id: 'due-payments',
    label: 'Outstanding Payments',
    prompt: 'Show all customers with due payments and outstanding amounts',
    category: 'financial',
    description: 'Customers with pending payments'
  },

  // Product Management
  {
    id: 'all-products',
    label: 'All Products',
    prompt: 'List all our products and services with pricing',
    category: 'product',
    description: 'Complete product catalog'
  },
  {
    id: 'product-details',
    label: 'Product Information',
    prompt: 'Show details for [product name] including price and description',
    category: 'product',
    description: 'Specific product information'
  },

  // Order Management
  {
    id: 'recent-orders',
    label: 'Recent Orders',
    prompt: 'Show the latest 10 orders with customer names and status',
    category: 'order',
    description: 'Latest customer orders'
  },

  // Inventory Management
  {
    id: 'low-stock',
    label: 'Low Stock Alert',
    prompt: 'Show materials with low stock levels that need reordering',
    category: 'inventory',
    description: 'Materials below minimum stock level'
  },
  {
    id: 'all-materials',
    label: 'All Materials',
    prompt: 'List all materials in inventory with current quantities',
    category: 'inventory',
    description: 'Complete inventory status'
  },

  // Business Analysis
  {
    id: 'monthly-top-customers',
    label: 'Monthly Top Customers',
    prompt: 'Show top 5 customers for [YYYY-MM] month',
    category: 'analysis',
    description: 'Top customers for specific month'
  },
];

export const businessSystemPrompt = `You are an AI Business Analyst for Classic Offset Printers. Your role is to analyze business data and provide actionable insights.

BUSINESS CONTEXT:
- Classic Offset is a printing business specializing in offset printing
- We handle various print jobs: business cards, flyers, banners, brochures, invitations
- We manage customers, orders, products, payments, and inventory
- Focus on profitability, customer satisfaction, and operational efficiency

ANALYSIS CAPABILITIES:
1. **Customer Analysis**: Identify top customers, payment patterns, order frequency
2. **Financial Analysis**: Revenue trends, profit margins, outstanding payments
3. **Product Analysis**: Popular products, pricing optimization
4. **Operational Analysis**: Order patterns, inventory management
5. **Business Intelligence**: Daily summaries, trend identification

RESPONSE FORMAT:
- Use professional business language
- Structure responses with clear headings and sections
- Include specific numbers, dates, and amounts from data
- Use tables for comparative data
- Highlight key insights and recommendations
- Format currency in Indian Rupees (₹)

WHEN PROVIDED WITH BUSINESS DATA:
1. Analyze the data thoroughly
2. Identify key patterns and trends
3. Provide specific insights with numbers
4. Make actionable recommendations
5. Format professionally with proper structure

EXAMPLE ANALYSIS STRUCTURE:
# Business Analysis Report

## Key Metrics
- Metric 1: Value
- Metric 2: Value

## Insights
- Key finding 1
- Key finding 2

## Recommendations  
- Action item 1
- Action item 2

Always focus on business value and actionable insights.`;

export const getBusinessPromptByCategory = (category: BusinessPrompt['category']): BusinessPrompt[] => {
  return businessPrompts.filter(prompt => prompt.category === category);
};

export const getBusinessPromptById = (id: string): BusinessPrompt | undefined => {
  return businessPrompts.find(prompt => prompt.id === id);
};

export const formatBusinessQuery = (promptId: string, variables: Record<string, string> = {}): string => {
  const prompt = getBusinessPromptById(promptId);
  if (!prompt) return '';

  let formattedPrompt = prompt.prompt;
  
  // Replace variables in square brackets
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    formattedPrompt = formattedPrompt.replace(new RegExp(placeholder, 'g'), value);
  });

  return formattedPrompt;
};
