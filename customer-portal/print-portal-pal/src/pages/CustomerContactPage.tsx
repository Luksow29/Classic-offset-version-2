// src/pages/CustomerContactPage.tsx
import { useOutletContext } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

type Customer = Tables<'customers'>;

interface OutletContext {
  user: any;
  customer: Customer | null;
}

export default function CustomerContactPage() {
  const { customer } = useOutletContext<OutletContext>();

  if (!customer) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const contactInfo = [
    {
      icon: <Phone className="h-5 w-5" />,
      title: "Phone",
      value: "+91 98765 43210",
      description: "Call us for immediate assistance"
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Email",
      value: "support@classicoffset.com",
      description: "Send us your queries via email"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Address",
      value: "123 Print Street, Chennai, Tamil Nadu 600001",
      description: "Visit our office for in-person support"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Business Hours",
      value: "Mon - Sat: 9:00 AM - 7:00 PM",
      description: "Sunday: Closed"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Get in touch with our team for any questions or support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactInfo.map((info, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {info.icon}
                </div>
                {info.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-gray-900 dark:text-white mb-1">{info.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{info.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Quick Support
          </CardTitle>
          <CardDescription>
            Need immediate help? Use our live chat support for instant assistance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = '/customer-portal/support'}
            className="w-full sm:w-auto"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Live Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
