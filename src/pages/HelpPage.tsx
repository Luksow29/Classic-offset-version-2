import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, Shield, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const HelpPage: React.FC = () => {
  const links = [
    {
      title: 'Customer Support',
      description: 'View and respond to support tickets.',
      to: '/customer-support',
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      title: 'Classic Assistant',
      description: 'Ask business questions using the AI agent.',
      to: '/classic-assistant',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: 'Local AI Agent',
      description: 'Connect to LM Studio and chat locally.',
      to: '/local-agent',
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: 'Reports',
      description: 'Generate and review business reports.',
      to: '/reports',
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <p className="text-sm text-muted-foreground">
          Quick shortcuts to the most common help areas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((item) => (
          <Card key={item.to} className="p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-muted/40 p-2">{item.icon}</div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4">
                  <Link to={item.to}>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HelpPage;
