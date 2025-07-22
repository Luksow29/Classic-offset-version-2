// src/pages/AIAgentPage.tsx
import React, { useState } from 'react';
import GeminiChat from '@/components/chat/GeminiChat';

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


const AIAgentPage: React.FC = () => {
  const [starterPrompt, setStarterPrompt] = useState<string>('');
  const [chatKey, setChatKey] = useState(0);

  // Define the abilities and starters for our main "Classic AI"
  const classicAbilities = [
      { icon: <Users />, text: "Get customer, order, and payment details" },
      { icon: <LineChart />, text: "Generate financial and stock reports" },
      { icon: <PenSquare />, text: "Create new customers via chat" },
      { icon: <Edit />, text: "Log new business expenses" },
      { icon: <ShoppingCart />, text: "Analyze top customers and products" },
      { icon: <MessageSquare/>, text: "Answer questions in English or Tamil"},
  ];

  const classicStarters = [
    "Who are my top 3 customers?",
    "Show me payments for customer Lukman",
    "Create a new customer: Ravi, 9876543210, Salem",
    "Log an expense of 250 for staff lunch to Arun",
  ];
  
  const handleStarterClick = (prompt: string) => {
    setStarterPrompt(prompt);
  };
  
  const handleResetClick = () => {
    setStarterPrompt('');
    setChatKey(prevKey => prevKey + 1);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        <div className="text-center mb-6">
          <BrainCircuit className="w-16 h-16 mx-auto text-primary-500 dark:text-primary-400 mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Classic AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Your intelligent business analyst.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Abilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classicAbilities.map((ability, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-primary-500">{ability.icon}</div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ability.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Conversation Starters:</h3>
              <button onClick={handleResetClick} className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 font-semibold">
                <RefreshCw className="w-4 h-4" /> New Chat
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {classicStarters.map((starter, index) => (
                <button key={index} onClick={() => handleStarterClick(starter)} className="p-3 text-sm text-center bg-white dark:bg-gray-800 shadow-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                  {starter}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <GeminiChat 
                key={chatKey} 
                starterPrompt={starterPrompt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
