import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Mail, Briefcase, FileText, BookOpen, ChevronLeft } from 'lucide-react';

interface JobTypeSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
    onBack: () => void;
}

const JOB_TYPES = [
    { id: 'invitation', label: 'Invitation', icon: Mail, description: 'Wedding, Party, Events' },
    { id: 'visiting_card', label: 'Visiting Card', icon: Briefcase, description: 'Business & Personal' },
    { id: 'bill_book', label: 'Bill Book', icon: BookOpen, description: 'Invoice, Estimate, Receipt' },
    { id: 'notice', label: 'Notice / Poster', icon: FileText, description: 'Flyers, Pamphlets' },
];

const JobTypeSelector: React.FC<JobTypeSelectorProps> = ({ selectedType, onSelect, onBack }) => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h2 className="text-xl font-semibold">Select Job Type</h2>
                <div className="w-20" /> {/* Spacer for centering */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {JOB_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;

                    return (
                        <div
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className={`
                                relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden
                                ${isSelected
                                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800 shadow-md transform scale-[1.02]'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 hover:shadow-lg hover:-translate-y-1'
                                }
                            `}
                        >
                            {/* Decorative Background Blob for hover */}
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative flex items-center gap-5">
                                <div className={`
                                    p-4 rounded-xl shadow-sm transition-colors duration-300
                                    ${isSelected
                                        ? 'bg-primary-600 text-white shadow-primary-200 dark:shadow-none'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 group-hover:text-primary-600'}
                                `}>
                                    <Icon size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg transition-colors ${isSelected ? 'text-primary-900 dark:text-white' : 'text-gray-900 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-400'}`}>
                                        {type.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                        {type.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JobTypeSelector;
