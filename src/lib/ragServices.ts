// src/lib/ragServices.ts
// Client-side RAG Services for Local AI + Supabase Integration

interface DataServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  count?: number;
  message?: string;
}

interface BusinessContext {
  type: 'customer' | 'financial' | 'product' | 'order' | 'expense' | 'stock' | 'general';
  data: any;
  summary: string;
}

export class LocalRAGService {
  private dataServiceUrl = 'https://ytnsjmbhgwcuwmnflncl.supabase.co/functions/v1/local-ai-rag';
  private anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // --- QUERY CLASSIFICATION ---
  classifyQuery(query: string): 'business' | 'general' {
    const businessKeywords = [
      // Customer keywords
      'customer', 'customers', 'client', 'clients', 'வாடிக்கையாளர்',
      // Order keywords  
      'order', 'orders', 'ஆர்டர்', 'booking', 'bookings',
      // Financial keywords
      'payment', 'payments', 'due', 'revenue', 'income', 'sales', 'profit', 'பணம்', 'கட்டணம்',
      'financial', 'finance', 'money', 'amount', 'balance', 'summary',
      // Product keywords
      'product', 'products', 'item', 'items', 'service', 'services', 'பொருள்',
      'visiting card', 'banner', 'brochure', 'poster', 'invitation',
      // Business operations
      'business', 'briefing', 'report', 'analytics', 'insights', 'வியாபாரம்',
      'top', 'best', 'highest', 'lowest', 'most', 'least',
      // Stock keywords
      'stock', 'inventory', 'material', 'materials', 'low stock', 'ஸ்டாக்',
      // Expense keywords
      'expense', 'expenses', 'cost', 'costs', 'spending', 'expenditure'
    ];

    const queryLower = query.toLowerCase();
    return businessKeywords.some(keyword => queryLower.includes(keyword.toLowerCase())) 
      ? 'business' 
      : 'general';
  }

  // --- OPERATION EXTRACTION ---
  extractOperations(query: string): string[] {
    const operations: string[] = [];
    const queryLower = query.toLowerCase();

    // Customer operations
    if (queryLower.includes('all customers') || queryLower.includes('list customers')) {
      operations.push('getAllCustomers');
    } else if (queryLower.includes('customer details') || queryLower.includes('find customer')) {
      operations.push('getCustomerDetails');
    } else if (queryLower.includes('customer orders') || queryLower.includes('orders for customer')) {
      operations.push('getCustomerOrders');
    } else if (queryLower.includes('customer payments') || queryLower.includes('payments for customer')) {
      operations.push('getCustomerPayments');
    }

    // Financial operations
    if (queryLower.includes('financial summary') || queryLower.includes('monthly summary')) {
      operations.push('getFinancialSummary');
    } else if (queryLower.includes('daily briefing') || queryLower.includes('today summary')) {
      operations.push('getDailyBriefing');
    } else if (queryLower.includes('top customers') && !queryLower.includes('month')) {
      operations.push('getTopCustomers');
    } else if (queryLower.includes('top customers') && queryLower.includes('month')) {
      operations.push('getTopCustomersByMonth');
    } else if (queryLower.includes('due payments') || queryLower.includes('outstanding')) {
      operations.push('getDuePayments');
    }

    // Product operations
    if (queryLower.includes('all products') || queryLower.includes('list products')) {
      operations.push('getAllProducts');
    } else if (queryLower.includes('product details') || queryLower.includes('find product')) {
      operations.push('getProductDetails');
    }

    // Order operations
    if (queryLower.includes('recent orders') || queryLower.includes('latest orders')) {
      operations.push('getRecentOrders');
    }

    // Stock operations
    if (queryLower.includes('low stock') || queryLower.includes('stock alert')) {
      operations.push('getLowStockMaterials');
    } else if (queryLower.includes('all materials') || queryLower.includes('stock list')) {
      operations.push('getAllMaterials');
    }

    // If no specific operations found, try to infer from context
    if (operations.length === 0) {
      if (queryLower.includes('customer')) operations.push('getAllCustomers');
      if (queryLower.includes('product')) operations.push('getAllProducts');
      if (queryLower.includes('order')) operations.push('getRecentOrders');
      if (queryLower.includes('payment')) operations.push('getDuePayments');
      if (queryLower.includes('business') || queryLower.includes('today')) operations.push('getDailyBriefing');
    }

    return operations;
  }

  // --- PARAMETER EXTRACTION ---
  extractParameters(query: string, operation: string): any {
    const params: any = {};
    const queryLower = query.toLowerCase();

    // Extract customer name
    const customerMatch = query.match(/customer[:\s]+([a-zA-Z\s]+)/i) || 
                         query.match(/for\s+([a-zA-Z\s]+)/i) ||
                         query.match(/வாடிக்கையாளர்[:\s]+([a-zA-Z\s]+)/i);
    if (customerMatch && operation.includes('Customer')) {
      params.customer_name = customerMatch[1].trim();
    }

    // Extract product name
    const productMatch = query.match(/product[:\s]+([a-zA-Z\s]+)/i) ||
                        query.match(/for\s+([a-zA-Z\s]+)/i);
    if (productMatch && operation.includes('Product')) {
      params.product_name = productMatch[1].trim();
    }

    // Extract month (YYYY-MM format)
    const monthMatch = query.match(/(\d{4}-\d{2})/);
    if (monthMatch) {
      params.month = monthMatch[1];
    } else if (queryLower.includes('october')) {
      params.month = '2024-10';
    } else if (queryLower.includes('november')) {
      params.month = '2024-11';
    }

    // Extract limit for top queries
    const limitMatch = query.match(/top\s+(\d+)/i) || query.match(/(\d+)\s+customers/i);
    if (limitMatch) {
      params.limit = parseInt(limitMatch[1]);
    } else if (queryLower.includes('top')) {
      params.limit = 5; // Default limit
    }

    // Extract limit for recent queries
    if (queryLower.includes('recent') || queryLower.includes('latest')) {
      params.limit = 10; // Default for recent queries
    }

    return params;
  }

  // --- DATA SERVICE CALLS ---
  private async callDataService(operation: string, params: any = {}): Promise<DataServiceResponse> {
    try {
      const response = await fetch(this.dataServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        },
        body: JSON.stringify({ operation, params })
      });

      if (!response.ok) {
        throw new Error(`Data service request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[RAG Service] Error calling ${operation}:`, error);
      return { success: false, error: error.message };
    }
  }

  // --- BUSINESS CONTEXT GENERATION ---
  async getBusinessContext(query: string): Promise<BusinessContext[]> {
    const operations = this.extractOperations(query);
    const contexts: BusinessContext[] = [];

    for (const operation of operations) {
      const params = this.extractParameters(query, operation);
      const result = await this.callDataService(operation, params);

      if (result.success && result.data) {
        contexts.push({
          type: this.getContextType(operation),
          data: result.data,
          summary: this.generateDataSummary(operation, result.data, result.count)
        });
      }
    }

    return contexts;
  }

  // --- CONTEXT TYPE MAPPING ---
  private getContextType(operation: string): BusinessContext['type'] {
    if (operation.includes('Customer')) return 'customer';
    if (operation.includes('Financial') || operation.includes('Due') || operation.includes('Top')) return 'financial';
    if (operation.includes('Product')) return 'product';
    if (operation.includes('Order')) return 'order';
    if (operation.includes('Expense')) return 'expense';
    if (operation.includes('Stock') || operation.includes('Material')) return 'stock';
    return 'general';
  }

  // --- DATA SUMMARY GENERATION ---
  private generateDataSummary(operation: string, data: any, count?: number): string {
    switch (operation) {
      case 'getAllCustomers':
        return `Found ${count || 0} customers in the database.`;
      case 'getCustomerDetails':
        return `Found ${count || 0} customer(s) matching the search criteria.`;
      case 'getDailyBriefing':
        return `Today's business summary: ${data.newOrders} new orders, ₹${data.totalRevenue} revenue, ${data.newCustomers} new customers, ${data.lowStockCount} low stock alerts.`;
      case 'getTopCustomers':
        return `Top ${data?.length || 0} spending customers of all time.`;
      case 'getTopCustomersByMonth':
        return `Top ${data?.length || 0} spending customers for the specified month.`;
      case 'getDuePayments':
        return `Found ${data?.length || 0} customers with outstanding due payments.`;
      case 'getAllProducts':
        return `Found ${count || 0} products in the catalog.`;
      case 'getRecentOrders':
        return `Found ${count || 0} recent orders.`;
      case 'getLowStockMaterials':
        return `Found ${data?.length || 0} materials with low stock levels.`;
      default:
        return `Retrieved ${operation} data successfully.`;
    }
  }

  // --- CONTEXT FORMATTING FOR LOCAL AI ---
  formatContextForLocalAI(contexts: BusinessContext[], userQuery: string): string {
    if (contexts.length === 0) {
      return `User Query: ${userQuery}\n\nNo specific business data was found for this query. Please provide a general response.`;
    }

    let prompt = `BUSINESS DATA CONTEXT FOR CLASSIC OFFSET:\n\n`;
    
    contexts.forEach((context, index) => {
      prompt += `=== ${context.type.toUpperCase()} DATA ${index + 1} ===\n`;
      prompt += `Summary: ${context.summary}\n`;
      prompt += `Raw Data: ${JSON.stringify(context.data, null, 2)}\n\n`;
    });

    prompt += `USER QUERY: ${userQuery}\n\n`;
    prompt += `INSTRUCTIONS:\n`;
    prompt += `- Analyze the business data above to answer the user's question\n`;
    prompt += `- Present information in a professional, well-formatted manner\n`;
    prompt += `- Use tables, bullet points, and clear headings when appropriate\n`;
    prompt += `- Include specific numbers, dates, and amounts from the data\n`;
    prompt += `- If the data shows trends or insights, highlight them\n`;
    prompt += `- Format monetary amounts in Indian Rupees (₹)\n`;
    prompt += `- Be comprehensive but concise in your analysis\n\n`;

    return prompt;
  }

  // --- QUICK BUSINESS QUERIES ---
  async getQuickBusinessData(queryType: string): Promise<BusinessContext[]> {
    const quickQueries = {
      'daily-briefing': 'getDailyBriefing',
      'all-customers': 'getAllCustomers',
      'top-customers': 'getTopCustomers',
      'due-payments': 'getDuePayments',
      'all-products': 'getAllProducts',
      'recent-orders': 'getRecentOrders',
      'low-stock': 'getLowStockMaterials'
    };

    const operation = quickQueries[queryType];
    if (!operation) return [];

    const result = await this.callDataService(operation);
    if (!result.success || !result.data) return [];

    return [{
      type: this.getContextType(operation),
      data: result.data,
      summary: this.generateDataSummary(operation, result.data, result.count)
    }];
  }
}

export const ragService = new LocalRAGService();
