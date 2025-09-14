import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Phone, 
  Mail,
  Send,
  Clock,
  CheckCircle
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CustomerSupportProps {
  customer: Customer;
}

export default function CustomerSupport({ customer }: CustomerSupportProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation, this would send an email or create a support ticket
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Support Request Submitted",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setSubject("");
      setMessage("");
      setPriority("medium");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit support request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Methods */}
        <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-primary" />
            <span>{t('support.call')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary mb-2">
            <a href="tel:+919842578847" className="underline">+91 98425 78847</a>
          </p>
          <p className="text-sm text-muted-foreground">{t('support.phone_hours')}</p>
        </CardContent>
        </Card>

        <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>{t('support.email')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-primary mb-2">
            <a href="mailto:classicprinterskdnl@gmail.com" className="underline">classicprinterskdnl@gmail.com</a>
          </p>
          <p className="text-sm text-muted-foreground">{t('support.email_hours')}</p>
        </CardContent>
        </Card>

        <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>{t('support.whatsapp')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-primary mb-2">
            <a href="https://wa.me/919842578847" target="_blank" rel="noopener noreferrer" className="underline">+91 98425 78847</a>
          </p>
          <p className="text-sm text-muted-foreground">{t('support.whatsapp_quick')}</p>
        </CardContent>
        </Card>
      </div>

      {/* Support Form */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>{t('support.submit_title')}</CardTitle>
          <CardDescription>
            {t('support.submit_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitSupport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">{t('support.your_name')}</Label>
                <Input
                  id="customer-name"
                  value={customer.name}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">{t('support.your_email')}</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">{t('support.subject')}</Label>
                <Input
                  id="subject"
                  placeholder={t('support.subject_placeholder')}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{t('support.priority')}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('support.priority_low')}</SelectItem>
                    <SelectItem value="medium">{t('support.priority_medium')}</SelectItem>
                    <SelectItem value="high">{t('support.priority_high')}</SelectItem>
                    <SelectItem value="urgent">{t('support.priority_urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('support.message')}</Label>
              <Textarea
                id="message"
                placeholder={t('support.message_placeholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {t('support.submitting')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('support.submit_button')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>{t('support.faq_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">{t('support.faq1_q')}</h4>
            <p className="text-sm text-muted-foreground">{t('support.faq1_a')}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">{t('support.faq2_q')}</h4>
            <p className="text-sm text-muted-foreground">{t('support.faq2_a')}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">{t('support.faq3_q')}</h4>
            <p className="text-sm text-muted-foreground">{t('support.faq3_a')}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">{t('support.faq4_q')}</h4>
            <p className="text-sm text-muted-foreground">{t('support.faq4_a')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}