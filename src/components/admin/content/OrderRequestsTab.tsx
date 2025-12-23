import React from 'react';
import { motion } from 'framer-motion';
import OrderRequestsTable from '../OrderRequestsTable';

const OrderRequestsTab: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Order Requests</h2>
                <OrderRequestsTable />
            </section>
        </motion.div>
    );
};

export default OrderRequestsTab;
