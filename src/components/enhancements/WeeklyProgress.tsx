// src/components/enhancements/WeeklyProgress.tsx
import React from 'react';
import { Check, Clock, Calendar, Brain, Package, BarChart3, Gift } from 'lucide-react';
import Card from '../ui/Card';

const WeeklyProgress: React.FC = () => {
  const weeks = [
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'next': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="text-green-500" size={16} />;
      case 'in-progress': return <Clock className="text-blue-500" size={16} />;
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
          4-Week implementation plan for advanced business features
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {weeks.map((week) => (
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

            {week.status === 'completed' && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check size={16} />
                  <span className="text-sm font-medium">Week {week.week} Complete!</span>
                </div>
              </div>
            )}

            {week.status === 'in-progress' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Clock size={16} />
                  <span className="text-sm font-medium">Week {week.week} In Progress!</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            🎉 Week 2 Implementation Complete!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Smart Inventory Management is now live with intelligent stock tracking, reorder alerts, and predictive analytics
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>✅ Database tables created</span>
            <span>✅ Stock tracking system</span>
            <span>✅ Reorder alerts active</span>
            <span>✅ Usage analytics</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            🎉 Week 1 Successfully Completed!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            AI Business Insights foundation established with comprehensive analytics and real-time recommendations
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>✅ Database schema applied</span>
            <span>✅ Component integrated</span>
            <span>✅ Navigation updated</span>
            <span>✅ Real-time functionality</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeeklyProgress;
