// Local Agent Components and Utilities
export { LocalAgent } from './LocalAgent';
export { LocalAgentRAG } from './LocalAgentRAG';
export { LocalAgentWidget } from './LocalAgentWidget';
export { ModelSelector } from './ModelSelector';
export { BusinessPromptBuilder, defaultQuickActions } from './BusinessContext';
export { 
  BusinessQueryTrigger,
  RecentOrdersTrigger,
  DuePaymentsTrigger,
  DailyBriefingTrigger,
  TopCustomersTrigger
} from './BusinessQueryTrigger';
export type { 
  BusinessContext, 
  QuickAction, 
  Order, 
  Customer, 
  Activity, 
  OrderStatistics 
} from './BusinessContext';

// API Service and Hook
export { localAgent } from '../../lib/localAgent';
export type { LocalAgentMessage, LocalAgentResponse, LocalAgentConfig } from '../../lib/localAgent';
export { useLocalAgent } from '../../hooks/useLocalAgent';
