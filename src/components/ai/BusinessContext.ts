import { LocalAgentMessage } from '../../lib/localAgent';

export interface Order {
  id: string;
  product_name: string;
  customer_name: string;
  quantity: number;
  specifications?: string;
  due_date: string;
  total_amount: number;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface OrderStatistics {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
}

export interface BusinessContext {
  currentPage?: string;
  selectedOrder?: Order;
  selectedCustomer?: Customer;
  recentActivity?: Activity[];
  orderStatistics?: OrderStatistics;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  prompt: (context?: BusinessContext) => string;
  icon: React.ReactNode;
  category: 'orders' | 'customers' | 'costs' | 'quality' | 'general';
  requiresContext?: boolean;
}

export class BusinessPromptBuilder {
  static createSystemPrompt(context?: BusinessContext): LocalAgentMessage {
    const basePrompt = `You are a Local AI Assistant for Classic Offset Printers, a printing business management system. 

CORE IDENTITY:
- Expert in offset printing operations, business management, and customer service
- Focused on practical, actionable advice for printing business operations
- Professional, friendly, and solution-oriented communication style

BUSINESS DOMAIN EXPERTISE:
- Offset printing processes and techniques
- Order management and workflow optimization
- Customer relationship management
- Cost estimation and pricing strategies
- Quality control and troubleshooting
- Inventory and materials management
- Production scheduling and capacity planning

CURRENT CONTEXT:
${context ? this.buildContextString(context) : 'General printing business assistance'}

CAPABILITIES:
1. ORDER ANALYSIS: Review orders for optimization opportunities, cost savings, timeline improvements
2. CUSTOMER COMMUNICATION: Draft professional emails, quotes, status updates, problem resolution messages
3. COST CALCULATION: Help estimate printing costs, material usage, labor requirements
4. QUALITY GUIDANCE: Provide troubleshooting tips, quality control checklists, best practices
5. WORKFLOW OPTIMIZATION: Suggest process improvements, efficiency gains, resource allocation
6. BUSINESS INSIGHTS: Analyze trends, identify opportunities, recommend strategies

COMMUNICATION GUIDELINES:
- Keep responses concise and actionable
- Provide specific, measurable recommendations when possible
- Ask clarifying questions if more context is needed
- Focus on business value and practical implementation
- Use industry terminology appropriately but explain complex concepts

Always consider the printing business context in your responses and prioritize solutions that improve efficiency, quality, or customer satisfaction.`;

    return {
      role: 'system',
      content: basePrompt
    };
  }

  private static buildContextString(context: BusinessContext): string {
    const contextParts = [];

    if (context.currentPage) {
      contextParts.push(`Currently viewing: ${context.currentPage}`);
    }

    if (context.selectedOrder) {
      contextParts.push(`Selected Order: #${context.selectedOrder.id} - ${context.selectedOrder.product_name} for ${context.selectedOrder.customer_name}`);
    }

    if (context.selectedCustomer) {
      contextParts.push(`Selected Customer: ${context.selectedCustomer.name} - ${context.selectedCustomer.email}`);
    }

    if (context.orderStatistics) {
      contextParts.push(`Recent Order Stats: ${JSON.stringify(context.orderStatistics)}`);
    }

    return contextParts.length > 0 ? contextParts.join('\n') : 'General business context';
  }

  static generateOrderAnalysisPrompt(order?: Order): string {
    if (order) {
      return `Please analyze this printing order for optimization opportunities:

Order Details:
- Product: ${order.product_name}
- Customer: ${order.customer_name}
- Quantity: ${order.quantity}
- Specifications: ${order.specifications || 'Standard'}
- Due Date: ${order.due_date}
- Total Amount: $${order.total_amount}
- Status: ${order.status}

Please provide:
1. Cost optimization suggestions
2. Production efficiency recommendations
3. Quality control checkpoints
4. Timeline optimization ideas
5. Any potential issues to watch for`;
    }

    return 'I need to analyze a printing order for optimization opportunities. Please provide me with the order details including product type, quantity, specifications, timeline, and any special requirements so I can give you specific recommendations for cost savings, quality improvements, and production efficiency.';
  }

  static generateCustomerEmailPrompt(customer?: Customer, purpose?: string): string {
    const basePurpose = purpose || 'general communication';
    
    if (customer) {
      return `Help me draft a professional email for customer communication:

Customer: ${customer.name}
Email: ${customer.email}
Purpose: ${basePurpose}

Please create a professional, friendly email that:
1. Addresses the customer personally
2. Is clear and concise
3. Maintains our professional brand voice
4. Includes appropriate next steps if needed
5. Ends with a professional closing

Consider this customer's history with us and maintain a tone that builds trust and confidence in our services.`;
    }

    return `Help me draft a professional email for a printing business customer. The email should be:

1. Professional yet approachable
2. Clear about the purpose and next steps
3. Branded appropriately for a printing business
4. Customer-focused and solution-oriented

Please provide the email content and suggest a subject line. If you need more specific details about the customer or situation, please ask.`;
  }

  static generateCostEstimationPrompt(projectDetails?: Record<string, unknown>): string {
    if (projectDetails) {
      return `Help me calculate printing costs for this project:

Project Details:
${JSON.stringify(projectDetails, null, 2)}

Please provide:
1. Material cost breakdown
2. Labor time estimation
3. Machine/overhead costs
4. Recommended markup for profit
5. Total project cost estimate
6. Comparison with industry standards
7. Cost optimization suggestions`;
    }

    return `I need help calculating printing costs for a project. To provide accurate estimates, I'll need details about:

1. Product type (business cards, flyers, banners, etc.)
2. Quantity needed
3. Paper/material specifications
4. Size and format
5. Color requirements (1-color, 4-color, spot colors)
6. Finishing requirements (cutting, folding, binding, etc.)
7. Timeline/urgency
8. Any special requirements

Please provide these details so I can help you create a detailed cost estimate with material, labor, and overhead calculations.`;
  }

  static generateQualityGuidelinesPrompt(productType?: string): string {
    const product = productType || 'general offset printing';
    
    return `Provide quality control guidelines for ${product} in offset printing:

Please include:
1. Pre-press quality checks
2. Press setup verification points
3. During-production monitoring steps
4. Post-production quality validation
5. Common quality issues and prevention
6. Customer delivery standards
7. Quality documentation requirements

Focus on practical, actionable steps that our production team can follow to ensure consistent, high-quality output.`;
  }

  static generateWorkflowOptimizationPrompt(currentWorkflow?: string): string {
    return `Help me optimize our printing workflow for better efficiency:

${currentWorkflow ? `Current Workflow:\n${currentWorkflow}` : ''}

Please analyze and suggest improvements for:
1. Order intake and processing
2. Pre-press preparation
3. Production scheduling
4. Quality control integration
5. Finishing and delivery
6. Customer communication touchpoints
7. Inventory management integration

Focus on reducing bottlenecks, improving quality, and enhancing customer satisfaction while maintaining cost efficiency.`;
  }
}

export const defaultQuickActions: QuickAction[] = [
  {
    id: 'analyze-order',
    label: 'Analyze Current Order',
    description: 'Get optimization suggestions for the selected order',
    prompt: (context) => BusinessPromptBuilder.generateOrderAnalysisPrompt(context?.selectedOrder),
    icon: '📊',
    category: 'orders',
    requiresContext: false
  },
  {
    id: 'draft-email',
    label: 'Draft Customer Email',
    description: 'Create professional customer communication',
    prompt: (context) => BusinessPromptBuilder.generateCustomerEmailPrompt(context?.selectedCustomer),
    icon: '✉️',
    category: 'customers',
    requiresContext: false
  },
  {
    id: 'calculate-costs',
    label: 'Calculate Print Costs',
    description: 'Estimate costs for printing projects',
    prompt: () => BusinessPromptBuilder.generateCostEstimationPrompt(),
    icon: '💰',
    category: 'costs',
    requiresContext: false
  },
  {
    id: 'quality-guidelines',
    label: 'Quality Guidelines',
    description: 'Get quality control procedures and best practices',
    prompt: () => BusinessPromptBuilder.generateQualityGuidelinesPrompt(),
    icon: '✅',
    category: 'quality',
    requiresContext: false
  },
  {
    id: 'optimize-workflow',
    label: 'Optimize Workflow',
    description: 'Improve production and business processes',
    prompt: () => BusinessPromptBuilder.generateWorkflowOptimizationPrompt(),
    icon: '⚡',
    category: 'general',
    requiresContext: false
  },
  {
    id: 'troubleshoot-print',
    label: 'Troubleshoot Print Issues',
    description: 'Diagnose and solve printing problems',
    prompt: () => 'I\'m experiencing printing issues. Help me troubleshoot common offset printing problems including color inconsistencies, registration issues, paper feeding problems, or quality defects. Please provide step-by-step diagnostic and solution procedures.',
    icon: '🔧',
    category: 'quality',
    requiresContext: false
  }
];
