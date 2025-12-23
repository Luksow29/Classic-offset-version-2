import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../ui/Button';
import { Plus } from 'lucide-react';
import GalleryUploader from '../../showcase/GalleryUploader';
import GalleryItemsTable from '../GalleryItemsTable';
import FeaturesTable from '../FeaturesTable';
import BrandingContentForm from '../BrandingContentForm';
import TestimonialsTable from '../TestimonialsTable';

interface ShowcaseTabProps {
    onUploadSuccess: () => void;
    onEditItem: (item: any) => void;
    onDataChange: () => void;
    onAddFeature: () => void;
    onEditFeature: (feature: any) => void;
    onAddTestimonial: () => void;
    onEditTestimonial: (testimonial: any) => void;
}

const ShowcaseTab: React.FC<ShowcaseTabProps> = ({
    onUploadSuccess,
    onEditItem,
    onDataChange,
    onAddFeature,
    onEditFeature,
    onAddTestimonial,
    onEditTestimonial
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            {/* Gallery Management Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Gallery Management</h2>
                <GalleryUploader onUploadSuccess={onUploadSuccess} />
                <GalleryItemsTable onEditItem={onEditItem} onDataChange={onDataChange} />
            </section>

            {/* Highlight Features Management Section */}
            <section className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Highlight Features</h2>
                    <Button onClick={onAddFeature} variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Feature
                    </Button>
                </div>
                <FeaturesTable onEditFeature={onEditFeature} onDataChange={onDataChange} />
            </section>

            {/* Branding Copy Management Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Branding Copy</h2>
                <BrandingContentForm sectionName="BrandingCopyMain" />
            </section>

            {/* Testimonials Management Section */}
            <section className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Client Testimonials</h2>
                    <Button onClick={onAddTestimonial} variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Testimonial
                    </Button>
                </div>
                <TestimonialsTable onEditTestimonial={onEditTestimonial} onDataChange={onDataChange} />
            </section>
        </motion.div>
    );
};

export default ShowcaseTab;
