// src/components/enhancements/WeeklyProgress.tsx
import React, { useState } from 'react';
import { Check, Clock, Calendar, Brain, Package, BarChart3, Gift, TrendingUp, Users, DollarSign, Zap, Target, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card';

const WeeklyProgress: React.FC = () => {
  const [showNextPhase, setShowNextPhase] = useState(false);

  // Completed Phase 1
  const completedWeeks = [
    {
      week: 1,
      title: "AI Business Insights 🤖",
      status: "completed",
      icon: <Brain className="text-blue-500" size={24} />,
      tasks: [
        { task: "Integrate with existing dashboard", completed: true },
        { task: "Add to main navigation", completed: true },
        { task: "Test with real data", completed: true },
        { task: "Database schema enhancement", completed: true }
      ],
      description: "AI-powered business intelligence with real-time insights and actionable recommendations"
    },
    {
      week: 2,
      title: "Smart Inventory 📦",
      status: "completed",
      icon: <Package className="text-green-500" size={24} />,
      tasks: [
        { task: "Create inventory database tables", completed: true },
        { task: "Implement stock tracking", completed: true },
        { task: "Add reorder alerts", completed: true },
        { task: "Material usage analytics", completed: true }
      ],
      description: "Intelligent inventory management with predictive reordering and usage tracking"
    },
    {
      week: 3,
      title: "Advanced CRM 🤝",
      status: "completed",
      icon: <BarChart3 className="text-purple-500" size={24} />,
      tasks: [
        { task: "Customer 360° view implementation", completed: true },
        { task: "Interaction tracking system", completed: true },
        { task: "Customer segmentation analytics", completed: true },
        { task: "Automated follow-up system", completed: true }
      ],
      description: "Complete customer relationship management with interaction history and smart analytics"
    },
    {
      week: 4,
      title: "Loyalty Program 🎁",
      status: "completed",
      icon: <Gift className="text-pink-500" size={24} />,
      tasks: [
        { task: "Design loyalty database schema", completed: true },
        { task: "Implement points system", completed: true },
        { task: "Create customer tiers", completed: true },
        { task: "Rewards management", completed: true }
      ],
      description: "Customer loyalty program with points, tiers, and automated reward system"
    }
  ];

  // Next Phase Enhancement Plan
  const nextPhaseWeeks = [
    {
      week: 5,
      title: "Dashboard Intelligence 📊",
      status: "planned",
      icon: <TrendingUp className="text-blue-600" size={24} />,
      tasks: [
        { task: "Predictive analytics dashboard", completed: false },
        { task: "Advanced drill-down reports", completed: false },
        { task: "Smart alerts & notifications", completed: false },
        { task: "Real-time business pulse monitoring", completed: false }
      ],
      description: "Transform dashboard into intelligent business intelligence center with forecasting capabilities"
    },
    {
      week: 6,
      title: "Order Workflow Enhancement 🔄",
      status: "planned",
      icon: <Target className="text-orange-600" size={24} />,
      tasks: [
        { task: "Visual production timeline", completed: false },
        { task: "Customer self-service portal", completed: false },
        { task: "AI-powered order recommendations", completed: false },
        { task: "Quality management system", completed: false }
      ],
      description: "Complete production workflow system with customer portal and AI recommendations"
    },
    {
      week: 7,
      title: "Financial Intelligence 💰",
      status: "planned",
      icon: <DollarSign className="text-green-600" size={24} />,
      tasks: [
        { task: "Multi-gateway payment processing", completed: false },
        { task: "Financial planning & budgeting", completed: false },
        { task: "Tax management & compliance", completed: false },
        { task: "Advanced financial reporting", completed: false }
      ],
      description: "Comprehensive financial management with payment gateways and automated compliance"
    },
    {
      week: 8,
      title: "AI Automation & Intelligence 🤖",
      status: "planned",
      icon: <Zap className="text-purple-600" size={24} />,
      tasks: [
        { task: "Conversational AI business consultant", completed: false },
        { task: "Intelligent process automation", completed: false },
        { task: "Predictive analytics engine", completed: false },
        { task: "Smart document processing", completed: false }
      ],
      description: "Advanced AI automation with conversational assistant and predictive intelligence"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'next': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="text-green-500" size={16} />;
      case 'in-progress': return <Clock className="text-blue-500" size={16} />;
      case 'planned': return <Calendar className="text-blue-500" size={16} />;
      case 'next': return <Clock className="text-orange-500" size={16} />;
      case 'upcoming': return <Calendar className="text-gray-400" size={16} />;
      default: return <Calendar className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Classic Offset Enhancement Roadmap
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Comprehensive development plan for advanced business features
        </p>
      </div>

      {/* Phase 1 - Completed */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="text-white" size={16} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Phase 1: Foundation Complete ✅
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {completedWeeks.map((week) => (
            <Card key={week.week} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {week.icon}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Week {week.week}
                    </h3>
                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {week.title}
                    </h4>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(week.status)}`}>
                  {getStatusIcon(week.status)}
                  <span className="text-sm font-medium capitalize">{week.status}</span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {week.description}
              </p>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Tasks:</h5>
                {week.tasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      task.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {task.completed && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-sm ${
                      task.completed 
                        ? 'text-green-700 dark:text-green-400 line-through' 
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check size={16} />
                  <span className="text-sm font-medium">Week {week.week} Complete!</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Phase - Dashboard UI Enhancement */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="text-white" size={16} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Phase 2: Dashboard UI Enhancement Complete ✅
          </h2>
        </div>

        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-500" size={24} />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Phase 2: Dashboard Professional Enhancement
                </h3>
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Modern UI/UX Implementation Complete 🚀
                </h4>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
              <Check className="text-green-500" size={16} />
              <span className="text-sm font-medium">Completed</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Successfully transformed the dashboard into a professional, modern web application with glassmorphism design, enhanced typography, animated metrics, responsive layouts and improved user experience.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Phase 1 Tasks */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 dark:text-white text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Phase 1: Foundation ✅
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Update Color Scheme</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Add Glassmorphism Effects</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Typography Enhancement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Animated Counters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Enhanced Loading States</span>
                </div>
              </div>
            </div>

            {/* Phase 2 Tasks */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 dark:text-white text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Phase 2: Advanced UI ✅
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Modern Navigation Sidebar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Header/Navbar Modernization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Order Creation Fix</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Service Charge Feature</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Complete Sidebar Navigation</span>
                </div>
              </div>
            </div>

            {/* Phase 3 Tasks */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 dark:text-white text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Phase 3: UX Polish ✅
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Command Palette (Cmd+K)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Mobile Optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Responsive Layouts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Touch-Friendly Interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-green-700 dark:text-green-400 line-through">Performance Optimization</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <Check size={16} />
              <span className="font-medium">Phase 2 Complete: 100% ✅</span>
            </div>
            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mb-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300">
              ✅ Modern glassmorphism sidebar with collapsible navigation<br/>
              ✅ Professional header with command palette integration<br/>
              ✅ Order creation fixes and service charge functionality<br/>
              ✅ Complete sidebar navigation with all features<br/>
              ✅ Command palette with Cmd+K shortcuts<br/>
              ✅ Mobile-responsive layouts and touch optimization
            </p>
          </div>
        </Card>
      </div>

      {/* Phase 3 - Next Enhancement Plan */}
      <div className="border-t pt-8">
        <div 
          className="flex items-center gap-3 mb-6 cursor-pointer"
          onClick={() => setShowNextPhase(!showNextPhase)}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Lightbulb className="text-white" size={16} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Phase 3: Advanced Business Intelligence 🚀
          </h2>
          {showNextPhase ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {showNextPhase && (
          <>
            <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  🎯 Next 4-Week Enhancement Strategy
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Transform existing components into intelligent, automated business operations platform
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Analytics Intelligence</span>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Target className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <span className="text-orange-700 dark:text-orange-300 font-medium">Workflow Enhancement</span>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-medium">Financial Intelligence</span>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Zap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <span className="text-purple-700 dark:text-purple-300 font-medium">AI Automation</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {nextPhaseWeeks.map((week) => (
                <Card key={week.week} className="p-6 hover:shadow-lg transition-shadow border-2 border-dashed border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {week.icon}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Week {week.week}
                        </h3>
                        <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          {week.title}
                        </h4>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200`}>
                      <Calendar size={16} />
                      <span className="text-sm font-medium">Planned</span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {week.description}
                  </p>

                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Planned Features:</h5>
                    {week.tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {task.task}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Calendar size={16} />
                      <span className="text-sm font-medium">Ready for Implementation</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 mt-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  📈 Expected Outcomes
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Phase 2 will transform Classic Offset into an intelligent business platform
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">40%</div>
                    <div className="text-gray-600 dark:text-gray-400">Efficiency Increase</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                    <div className="text-gray-600 dark:text-gray-400">Process Automation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">AI</div>
                    <div className="text-gray-600 dark:text-gray-400">Powered Intelligence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">360°</div>
                    <div className="text-gray-600 dark:text-gray-400">Business Visibility</div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Success Summary Cards */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            🎉 Phase 1 Implementation Complete!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Foundation established with AI insights, smart inventory, advanced CRM, and loyalty program
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>✅ 4 Weeks Completed</span>
            <span>✅ 16 Major Features</span>
            <span>✅ Full Integration</span>
            <span>✅ Production Ready</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeeklyProgress;
