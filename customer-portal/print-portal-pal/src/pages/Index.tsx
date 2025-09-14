import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  CreditCard, 
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Shield,
  Clock
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-customer">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
              {t('index.welcome')}
            </h1>
            <p className="text-xl text-muted-foreground mb-2 max-w-3xl mx-auto">
              {t('index.address')}
            </p>
            <p className="text-xl text-muted-foreground mb-2 max-w-3xl mx-auto">
              {t('index.phone_label')} <a href="tel:+919842578847" className="underline text-primary">+91 98425 78847</a>
            </p>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {t('index.email_label')} <a href="mailto:classicprinterskdnl@gmail.com" className="underline text-primary">classicprinterskdnl@gmail.com</a>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/customer-portal">
                <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
                  {t('index.access_portal')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/customer-auth">
                <Button variant="outline" size="lg" className="hover:bg-customer-secondary">
                  {t('index.sign_in_register')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary mb-4">
            {t('index.features_title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('index.features_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-customer-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('index.feature_order_tracking')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                {t('index.feature_order_tracking_desc')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-customer-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('index.feature_invoice_management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                {t('index.feature_invoice_management_desc')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-customer-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('index.feature_direct_communication')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                {t('index.feature_direct_communication_desc')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-customer-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('index.feature_profile_management')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                {t('index.feature_profile_management_desc')}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">
              {t('index.benefits_title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('index.benefits_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('index.benefit_reliable_service')}</h3>
              <p className="text-muted-foreground">
                {t('index.benefit_reliable_service_desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('index.benefit_secure_platform')}</h3>
              <p className="text-muted-foreground">
                {t('index.benefit_secure_platform_desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('index.benefit_247_access')}</h3>
              <p className="text-muted-foreground">
                {t('index.benefit_247_access_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-primary py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            {t('index.cta_title')}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t('index.cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/customer-auth">
              <Button size="lg" variant="secondary" className="hover:shadow-glow transition-all duration-300">
                {t('index.create_account')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/customer-portal">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                {t('index.existing_sign_in')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">PrintPortal</h3>
            <p className="text-primary-foreground/80 mb-4">
              {t('index.footer_desc')}
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <span>{t('index.footer_phone')}</span>
              <span>{t('index.footer_email')}</span>
              <span>{t('index.footer_address')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
