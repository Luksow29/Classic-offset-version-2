import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Save, Wand2, Upload, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MatterFormProps {
    orderId: string;
    jobType: string;
    onBack: () => void;
    onSuccess: () => void;
}

const TEMPLATES = {
    invitation: `In the name of Allah, the Most Beneficent, the Most Merciful.

We cordially invite you and your family to grace the auspicious occasion of the wedding ceremony of...

Date: [Date]
Time: [Time]
Venue: [Venue]

Your presence is our joy!`,
    default: `Please enter the job details here...`
};

const MatterForm: React.FC<MatterFormProps> = ({ orderId, jobType, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<Record<string, string>>({});

    // Fields config based on jobType
    const getFields = () => {
        if (jobType.toLowerCase().includes('invitation')) {
            return [
                { name: 'function_name', label: 'Function Name', placeholder: 'e.g. Wedding Reception' },
                { name: 'groom_name', label: 'Groom Name', placeholder: 'Name with Parents' },
                { name: 'bride_name', label: 'Bride Name', placeholder: 'Name with Parents' },
                { name: 'event_date', label: 'Date', type: 'date' },
                { name: 'event_time', label: 'Time', type: 'time' },
                { name: 'venue', label: 'Venue', placeholder: 'Hall Name, City' },
            ];
        }
        return [{ name: 'details', label: 'Details', type: 'textarea' }];
    };

    useEffect(() => {
        // Check if matter already exists
        const fetchMatter = async () => {
            const { data } = await supabase.from('job_matters').select('*').eq('order_id', orderId).single();
            if (data) {
                setContent(data.content || {});
            }
        };
        fetchMatter();
    }, [orderId]);

    const handleContentChange = (key: string, value: string) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const loadTemplate = () => {
        const template = TEMPLATES[jobType as keyof typeof TEMPLATES] || TEMPLATES.default;
        setContent(prev => ({ ...prev, matter_text: template }));
        toast.success("Template Loaded!");
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                order_id: orderId,
                matter_type: jobType,
                content: content,
                status: 'Ready for Design'
            };

            // Upsert handled by logic or check existence. Supabase upsert works with unique constraint.
            // We have unique on order_id.
            const { error } = await supabase.from('job_matters').upsert(payload, { onConflict: 'order_id' });

            if (error) throw error;

            // Also update Order status to 'Design' logic?
            // The request said "Job Status: Ready for Design".
            // Ensure order status allows this.
            await supabase.from('orders').update({ status: 'Design' }).eq('id', orderId);

            toast.success("Job Matter Saved!");
            onSuccess();

        } catch (error: any) {
            console.error("Error saving matter:", error);
            toast.error("Failed to save matter");
        } finally {
            setLoading(false);
        }
    };

    const fields = getFields();

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Matter Entry</h2>
                <p className="text-gray-500">Enter the content details for the designer.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Event Details" className="h-full">
                    <div className="space-y-4 p-2">
                        {fields.map(field => (
                            <Input
                                key={field.name}
                                id={field.name}
                                label={field.label}
                                type={field.type || 'text'}
                                placeholder={field.placeholder}
                                value={content[field.name] || ''}
                                onChange={(e) => handleContentChange(field.name, e.target.value)}
                            />
                        ))}
                    </div>
                </Card>

                <Card title="Matter Text (Verses)" className="h-full">
                    <div className="space-y-4 p-2 h-full flex flex-col">
                        <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={loadTemplate} type="button">
                                <Wand2 className="w-4 h-4 mr-2 text-purple-500" /> AI Template
                            </Button>
                        </div>
                        <TextArea
                            id="matter_text"
                            label="Full Text"
                            className="flex-grow min-h-[200px]"
                            value={content['matter_text'] || ''}
                            onChange={(e) => handleContentChange('matter_text', e.target.value)}
                            placeholder="Type the full invitation text here..."
                        />
                    </div>
                </Card>
            </div>

            {/* File Upload Placeholder */}
            <Card className="p-6 border-dashed border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <Upload className="w-10 h-10 mb-2" />
                    <p>Reference Image Upload (Coming Soon)</p>
                </div>
            </Card>

            <div className="flex justify-center pt-6">
                <Button size="lg" onClick={handleSave} disabled={loading} className="w-full md:w-1/2">
                    {loading ? 'Saving...' : (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" /> Complete Job Entry
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default MatterForm;
