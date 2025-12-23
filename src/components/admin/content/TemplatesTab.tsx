import React from 'react';
import { motion } from 'framer-motion';
import TemplateManager, { Template } from '../../whatsapp/TemplateManager';
import { Loader2 } from 'lucide-react';

interface TemplatesTabProps {
    templates: Template[];
    loading: boolean;
    onDataChange: () => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ templates, loading, onDataChange }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">WhatsApp Templates Management</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <TemplateManager initialTemplates={templates} onDataChange={onDataChange} />
                )}
            </section>
        </motion.div>
    );
};

export default TemplatesTab;
