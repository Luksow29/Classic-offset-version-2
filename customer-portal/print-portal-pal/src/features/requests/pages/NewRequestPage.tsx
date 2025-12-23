
import { useOutletContext, useNavigate } from "react-router-dom";
import OrderWizard from "@/features/requests/components/wizard/OrderWizard";
import { ArrowLeft, FileText, Clock, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { motion } from 'framer-motion';

interface Customer {
    id: string;
    user_id: string;
    name: string;
    phone: string;
}

interface OutletContext {
    customer: Customer | null;
}

const NewRequestPage = () => {
    const { customer } = useOutletContext<OutletContext>();
    const navigate = useNavigate();

    if (!customer) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-2 border-blue-200 dark:border-blue-800"></div>
                        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Hero Header - Compact on mobile */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 md:p-8"
            >
                {/* Background Pattern - Hidden on mobile */}
                <div className="absolute inset-0 opacity-10 hidden md:block">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate('/customer-portal/requests')}
                            className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        >
                            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg md:text-3xl font-bold text-white"
                            >
                                New Order Request
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-purple-100 text-xs md:text-base"
                            >
                                Complete the wizard to submit your order
                            </motion.p>
                        </div>
                    </div>

                    {/* Info Cards - Hidden on mobile */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:flex flex-wrap gap-3 mt-6"
                    >
                        {[
                            { icon: FileText, text: "5 Simple Steps" },
                            { icon: Clock, text: "Takes 2-3 minutes" },
                            { icon: Shield, text: "Secure Submission" }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                            >
                                <item.icon className="h-4 w-4 text-white/80" />
                                <span className="text-sm text-white/90">{item.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Decorative Elements - Hidden on mobile */}
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl hidden md:block"></div>
                <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-pink-500/20 blur-2xl hidden md:block"></div>
            </motion.div>

            {/* Wizard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <OrderWizard
                    customer={customer}
                    onComplete={() => navigate('/customer-portal/requests')}
                />
            </motion.div>
        </div>
    );
};

export default NewRequestPage;
