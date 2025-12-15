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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-400/5 dark:to-indigo-400/5"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6 animate-pulse">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4">
              Classic AI Assistant
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your intelligent business analyst powered by advanced AI
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secure & Private</span>
              <span>•</span>
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString()}</span>
              <span>•</span>
              <Zap className="w-4 h-4" />
              <span>Real-time Analysis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="mb-6 sm:mb-8 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm p-1 flex gap-2">
              <TabsTrigger value="chat" className="flex-1 text-sm sm:text-lg">
                <span className="sm:hidden">Chat</span>
                <span className="hidden sm:inline">💬 Chat</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="flex-1 text-sm sm:text-lg">
                <span className="sm:hidden">Features</span>
                <span className="hidden sm:inline">✨ Features & How to Use</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat">
              {/* Chat Interface */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="h-[70vh] sm:h-[650px] flex flex-col">
                  <ChatContainer
                    key={chatKey}
                    starterPrompt={starterPrompt}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="features">
              {/* AI Statistics */}
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {aiStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      type="text"
                      placeholder="Search capabilities, features, or actions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {abilityCategories.map((category) => (
                        <option key={category.category} value={category.category}>
                          {category.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Capabilities Section */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="w-7 h-7 text-indigo-500 animate-pulse" />
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Complete AI Capabilities</h2>
                  <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {filteredCategories.reduce((total, cat) => total + cat.abilities.length, 0)} of {abilityCategories.reduce((total, cat) => total + cat.abilities.length, 0)} Abilities
                    </span>
                  </div>
                </div>

                <div className="space-y-8">
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No capabilities found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    filteredCategories.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="group">
                        {/* Category Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white shadow-lg`}>
                            {category.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.category}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {category.abilities.length} abilities available
                            </p>
                          </div>
                        </div>

                        {/* Abilities Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6">
                          {category.abilities.map((ability, abilityIndex) => (
                            <div
                              key={abilityIndex}
                              onClick={() => handleStarterClick(ability.action)}
                              className={`group/ability relative p-5 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${category.bgColor}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mt-2 group-hover/ability:animate-pulse"></div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover/ability:text-indigo-600 dark:group-hover/ability:text-indigo-400 transition-colors">
                                    {ability.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {ability.description}
                                  </p>
                                  <div className="text-xs px-3 py-1 bg-white/60 dark:bg-gray-800/60 rounded-full text-gray-500 dark:text-gray-400 inline-block">
                                    Try: "{ability.action}"
                                  </div>
                                </div>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover/ability:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                    <span className="text-sm px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                      Most Popular
                    </span>
                  </div>
                  <button
                    onClick={handleResetClick}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Chat
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleStarterClick(action.text)}
                      className="group p-5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 text-left hover:shadow-lg hover:scale-105"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                          {action.icon}
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-medium">
                          {action.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {action.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Suggestions */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <BrainCircuit className="w-6 h-6 text-purple-500 animate-float" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Suggestions</h3>
                  <span className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    AI Powered
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {smartSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleStarterClick(suggestion.text)}
                      className="group p-5 bg-gradient-to-br from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/40 dark:border-gray-700/40 hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 text-left hover:shadow-xl hover:scale-102"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-full font-medium">
                            {suggestion.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${suggestion.complexity === 'Basic'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
                            : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300'
                            }`}>
                            {suggestion.complexity}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                        {suggestion.text}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {suggestion.description}
                      </p>
                    </button>
                  ))}
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
