import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

const Index = () => {
  const { t } = useTranslation();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 font-sans selection:bg-primary/20 overflow-x-hidden">
      {/* Navigation - Ultra Glassmorphism */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "circOut" }}
        className="border-b border-white/20 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="font-bold text-2xl tracking-tighter text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            PrintPortal
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/customer-auth">
              <Button variant="ghost" className="hidden sm:flex text-base font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Sign In</Button>
            </Link>
            <Link to="/customer-auth">
              <Button className="rounded-full px-8 h-10 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-primary/90 hover:scale-105 active:scale-95 duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Premium & Polished */}
      <div className="relative pt-24 pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-primary/20 text-primary text-sm font-semibold mb-8 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              Premium Print Services
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-8 tracking-tight leading-[1.1]">
              {t('index.welcome')}
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              {t('index.address')}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to="/customer-portal">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all bg-primary hover:bg-primary/90 hover:-translate-y-1 group">
                  {t('index.access_portal')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/customer-auth">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all hover:-translate-y-1">
                  {t('index.sign_in_register')}
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 px-5 py-2.5 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span>Instant Quotes</span>
              </div>
              <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 px-5 py-2.5 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 px-5 py-2.5 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic Animated Background Blobs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[10s]" />
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
          <div className="absolute top-[10%] right-[20%] w-[600px] h-[600px] bg-purple-100/40 dark:bg-purple-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        </motion.div>
      </div>

      {/* Features Section - Glassmorphic Bento Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-primary/5 text-primary">
            <Sparkles size={24} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('index.features_title')} && More
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('index.features_desc')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            { icon: <FileText className="h-6 w-6" />, title: t('index.feature_order_tracking'), desc: t('index.feature_order_tracking_desc'), color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
            { icon: <CreditCard className="h-6 w-6" />, title: t('index.feature_invoice_management'), desc: t('index.feature_invoice_management_desc'), color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
            { icon: <MessageSquare className="h-6 w-6" />, title: t('index.feature_direct_communication'), desc: t('index.feature_direct_communication_desc'), color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" },
            { icon: <Users className="h-6 w-6" />, title: t('index.feature_profile_management'), desc: t('index.feature_profile_management_desc'), color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="group relative p-8 rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />

              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section - Floating Card */}
      <div className="pb-32 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto rounded-[2.5rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900 overflow-hidden relative"
        >
          {/* Abstract Glow in CTA */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 px-6 py-20 md:px-20 md:py-24 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">
              {t('index.cta_title')}
            </h2>
            <p className="text-xl text-gray-300 dark:text-gray-500 mb-12 max-w-2xl mx-auto font-light">
              {t('index.cta_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/customer-auth">
                <Button size="lg" className="h-14 px-10 rounded-full bg-white text-gray-900 dark:bg-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border-0 shadow-xl transition-all hover:scale-105 active:scale-95 font-semibold text-lg">
                  {t('index.create_account')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer - Minimalist */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="font-bold text-2xl tracking-tighter text-gray-900 dark:text-white flex items-center gap-3 mb-4 justify-center md:justify-start">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <FileText size={16} strokeWidth={2.5} />
                </div>
                PrintPortal
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 Classic Printers. Crafted with precision.</p>
            </div>

            <div className="flex gap-10 text-sm font-medium text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
