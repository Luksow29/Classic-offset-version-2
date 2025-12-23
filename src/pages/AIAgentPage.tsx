// src/pages/AIAgentPage.tsx
import React, { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat/modern/ChatContainer';
import Input from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

// Correctly import individual icons from lucide-react to enable tree-shaking
import Bot from 'lucide-react/dist/esm/icons/bot';
import LineChart from 'lucide-react/dist/esm/icons/line-chart';
import Users from 'lucide-react/dist/esm/icons/users';
import PenSquare from 'lucide-react/dist/esm/icons/pen-square';
import Edit from 'lucide-react/dist/esm/icons/edit';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import BrainCircuit from 'lucide-react/dist/esm/icons/brain-circuit';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Search from 'lucide-react/dist/esm/icons/search';
import Filter from 'lucide-react/dist/esm/icons/filter';

// Complete list of ALL AI abilities organized by category
const abilityCategories = [
  {
    category: "Customer Management",
    icon: <Users className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    abilities: [
      { name: "Get Customer Details", description: "Find customer info by name with UUID", action: "Show customer details for John" },
      { name: "Create New Customer", description: "Add customers through conversation", action: "Create customer: Sarah, 9876543210, Chennai" },
      { name: "List All Customers", description: "Display complete customer database", action: "Show all customers" },
      { name: "Customer Orders", description: "View order history for any customer", action: "Show orders for customer ID" },
      { name: "Customer Payments", description: "Track payment history and status", action: "Show payments for customer" }
    ]
  },
  {
    category: "Financial Analytics",
    icon: <LineChart className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    abilities: [
      { name: "Financial Summary", description: "Monthly revenue and expense reports", action: "Show financial summary for 2024-10" },
      { name: "Top Customers Overall", description: "Highest spending customers all-time", action: "Who are my top 5 customers?" },
      { name: "Monthly Top Customers", description: "Best customers for specific months", action: "Top customers for October 2024" },
      { name: "Due Payments Summary", description: "Outstanding payment analytics", action: "Show all due payments summary" },
      { name: "Recent Due Payments", description: "Latest unpaid invoices", action: "Show recent due payments" }
    ]
  },
  {
    category: "Product Management",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    abilities: [
      { name: "Product Details", description: "Get product info and pricing", action: "Show details for visiting card" },
      { name: "All Products", description: "Complete product catalog", action: "List all products" },
      { name: "Create New Product", description: "Add products with pricing", action: "Create product: Banner, 50, Outdoor banner" },
      { name: "Product Analytics", description: "Sales performance by product", action: "Which products sell the most?" }
    ]
  },
  {
    category: "Order Management",
    icon: <Edit className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    abilities: [
      { name: "Create New Order", description: "Place orders through conversation", action: "Create order for customer with product" },
      { name: "Order History", description: "Track all orders and status", action: "Show recent orders" },
      { name: "Order Analytics", description: "Order trends and patterns", action: "Show today's orders" }
    ]
  },
  {
    category: "Business Operations",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    abilities: [
      { name: "Daily Business Briefing", description: "Complete daily summary", action: "Get daily business briefing" },
      { name: "Expense Tracking", description: "Log and categorize expenses", action: "Log expense: 500, Marketing, Google Ads" },
      { name: "Stock Management", description: "Monitor inventory levels", action: "Show low stock materials" },
      { name: "Current Date/Time", description: "Get accurate current date", action: "What's today's date?" }
    ]
  },
  {
    category: "Communication",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
    abilities: [
      { name: "WhatsApp Integration", description: "Generate WhatsApp message links", action: "Send payment reminder to customer" },
      { name: "Web Search", description: "Real-time information from internet", action: "Search for printing industry trends" },
      { name: "Multilingual Support", description: "Tamil, English, and more languages", action: "Explain in Tamil" }
    ]
  }
];

const AIAgentPage: React.FC = () => {
  const [starterPrompt, setStarterPrompt] = useState<string>('');
  const [chatKey, setChatKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter abilities based on search and category
  const filteredCategories = abilityCategories.filter(category => {
    if (selectedCategory !== 'all' && category.category !== selectedCategory) return false;
    if (!searchQuery) return true;

    const matchesCategory = category.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAbility = category.abilities.some(ability =>
      ability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ability.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matchesCategory || matchesAbility;
  });

  // AI Usage Statistics
  const aiStats = [
    { label: "Total Capabilities", value: abilityCategories.reduce((total, cat) => total + cat.abilities.length, 0), icon: <Sparkles className="w-4 h-4" />, color: "text-blue-600" },
    { label: "Categories", value: abilityCategories.length, icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600" },
    { label: "Response Time", value: "< 2s", icon: <Zap className="w-4 h-4" />, color: "text-yellow-600" },
    { label: "Availability", value: "24/7", icon: <Shield className="w-4 h-4" />, color: "text-purple-600" },
  ];



  const quickActions = [
    { text: "Who are my top 5 customers overall?", category: "Analytics", icon: <TrendingUp className="w-4 h-4" />, color: "from-green-500 to-emerald-500" },
    { text: "Get daily business briefing", category: "Reports", icon: <LineChart className="w-4 h-4" />, color: "from-blue-500 to-cyan-500" },
    { text: "Show all customers", category: "Customers", icon: <Users className="w-4 h-4" />, color: "from-purple-500 to-violet-500" },
    { text: "List all products", category: "Products", icon: <ShoppingCart className="w-4 h-4" />, color: "from-orange-500 to-red-500" },
    { text: "Show recent due payments", category: "Payments", icon: <Clock className="w-4 h-4" />, color: "from-pink-500 to-rose-500" },
    { text: "Show low stock materials", category: "Inventory", icon: <Zap className="w-4 h-4" />, color: "from-yellow-500 to-amber-500" },
  ];

  const smartSuggestions = [
    {
      text: "Create customer: Priya, 9876543210, Coimbatore",
      category: "Customer Management",
      description: "Add new customer with details",
      complexity: "Basic"
    },
    {
      text: "Create product: Wedding Card, 25, Premium wedding invitation",
      category: "Product Management",
      description: "Add new product with pricing",
      complexity: "Basic"
    },
    {
      text: "Log expense: 1500, Marketing, Facebook Ads",
      category: "Expense Tracking",
      description: "Record business expense",
      complexity: "Basic"
    },
    {
      text: "Show financial summary for 2024-10",
      category: "Financial Reports",
      description: "Monthly financial analysis",
      complexity: "Advanced"
    },
    {
      text: "Show top customers for 2024-10 with limit 10",
      category: "Customer Analytics",
      description: "Monthly customer performance",
      complexity: "Advanced"
    },
    {
      text: "Get all due payments summary",
      category: "Payment Analytics",
      description: "Outstanding payment overview",
      complexity: "Advanced"
    },
  ];

  const handleStarterClick = (prompt: string) => {
    setStarterPrompt(prompt);
  };

  const handleResetClick = () => {
    setStarterPrompt('');
    setChatKey(prevKey => prevKey + 1);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Classic AI Assistant</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                Online
              </span>
              <span>•</span>
              <span>Business Analyst Intelligence</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Secure
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Real-time
            </span>
            <span className="flex items-center gap-1 border-l border-border pl-3 ml-1">
              <Clock className="w-3 h-3" /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="h-full max-w-7xl mx-auto">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-muted p-1 rounded-lg border border-border">
                <TabsTrigger
                  value="chat"
                  className="px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="features"
                  className="px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Capabilities
                </TabsTrigger>
              </TabsList>

              <button
                onClick={handleResetClick}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            </div>

            <TabsContent value="chat" className="flex-1 mt-0 outline-none h-full overflow-hidden">
              <div className="h-full flex flex-col bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <ChatContainer
                  key={chatKey}
                  starterPrompt={starterPrompt}
                />
              </div>
            </TabsContent>

            <TabsContent value="features" className="flex-1 mt-0 outline-none overflow-y-auto pr-2">
              <div className="space-y-8 pb-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {aiStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-primary/5 ${stat.color.replace('text-', 'text-')}`}>
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                          <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleStarterClick(action.text);
                          // Switch tab logic would go here if we had access to tabs ref
                          const chatTab = document.querySelector('[value="chat"]') as HTMLElement;
                          if (chatTab) chatTab.click();
                        }}
                        className="group p-4 bg-card hover:bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {action.category}
                          </span>
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${action.color} text-white opacity-80 group-hover:opacity-100`}>
                            {action.icon}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {action.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capabilities Catalog */}
                <div>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search capabilities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-card"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 bg-card border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    >
                      <option value="all">All Categories</option>
                      {abilityCategories.map((category) => (
                        <option key={category.category} value={category.category}>
                          {category.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCategories.map((category, idx) => (
                      <div key={idx} className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white shadow-sm`}>
                            {category.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{category.category}</h4>
                            <p className="text-xs text-muted-foreground">{category.abilities.length} actions</p>
                          </div>
                        </div>
                        <div className="divide-y divide-border">
                          {category.abilities.map((ability, aIdx) => (
                            <div
                              key={aIdx}
                              onClick={() => {
                                handleStarterClick(ability.action);
                                const chatTab = document.querySelector('[value="chat"]') as HTMLElement;
                                if (chatTab) chatTab.click();
                              }}
                              className="p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-start gap-3 group"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary mt-2 transition-colors" />
                              <div>
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{ability.name}</p>
                                <p className="text-xs text-muted-foreground mb-1">{ability.description}</p>
                                <span className="text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                                  "{ability.action}"
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
