import React, { useState, useEffect, useRef } from 'react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import TextArea from '../../ui/TextArea';
import Button from '../../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { 
    ChevronLeft, 
    FileText, 
    Wand2, 
    Upload, 
    CheckCircle,
    SkipForward,
    AlertCircle,
    X,
    File,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MatterStepProps {
    orderId: string;
    orderType: string;
    customerName: string;
    onComplete: () => void;
    onSkip: () => void;
    onBack: () => void;
}

interface UploadedFile {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
}

// Templates for different order types
const TEMPLATES: Record<string, string> = {
    'Invitation Cards': `In the name of Allah, the Most Beneficent, the Most Merciful.

We cordially invite you and your family to grace the auspicious occasion of the wedding ceremony of...

Date: [Date]
Time: [Time]
Venue: [Venue]

Your presence is our joy!`,
    'Business Cards': `[Name]
[Designation]

[Company Name]
[Address Line 1]
[Address Line 2]

Phone: [Phone]
Email: [Email]
Website: [Website]`,
    'Bill Books': `[Company Name]
[Address]
[Phone] | [Email]
GSTIN: [GSTIN]`,
    default: `Please enter the job details here...`
};

// Dynamic fields based on order type
const getFieldsForType = (orderType: string) => {
    const lowerType = orderType.toLowerCase();
    
    if (lowerType.includes('invitation')) {
        return [
            { name: 'function_name', label: 'Function Name', placeholder: 'e.g., Wedding Reception, Birthday Party' },
            { name: 'host_names', label: 'Host Names', placeholder: 'Names of hosts/family' },
            { name: 'guest_of_honor', label: 'Guest of Honor', placeholder: 'Bride & Groom names / Birthday person' },
            { name: 'event_date', label: 'Event Date', type: 'date' },
            { name: 'event_time', label: 'Event Time', type: 'time' },
            { name: 'venue', label: 'Venue', placeholder: 'Hall name, Address, City' },
            { name: 'rsvp', label: 'RSVP Contact', placeholder: 'Phone number for RSVP' },
        ];
    }
    
    if (lowerType.includes('business') || lowerType.includes('visiting')) {
        return [
            { name: 'person_name', label: 'Person Name', placeholder: 'Full name' },
            { name: 'designation', label: 'Designation', placeholder: 'Job title' },
            { name: 'company_name', label: 'Company Name', placeholder: 'Business name' },
            { name: 'phone', label: 'Phone', placeholder: '+91 XXXXX XXXXX' },
            { name: 'email', label: 'Email', placeholder: 'email@example.com' },
            { name: 'website', label: 'Website', placeholder: 'www.example.com' },
            { name: 'address', label: 'Address', placeholder: 'Business address' },
        ];
    }
    
    if (lowerType.includes('bill') || lowerType.includes('invoice')) {
        return [
            { name: 'company_name', label: 'Company Name', placeholder: 'Business name' },
            { name: 'address', label: 'Address', placeholder: 'Full address' },
            { name: 'phone', label: 'Phone', placeholder: 'Contact number' },
            { name: 'email', label: 'Email', placeholder: 'email@example.com' },
            { name: 'gstin', label: 'GSTIN', placeholder: 'GST Number' },
            { name: 'bank_details', label: 'Bank Details', placeholder: 'A/C No, IFSC, Bank Name' },
        ];
    }
    
    // Default for Posters, Brochures, Others
    return [
        { name: 'title', label: 'Title/Heading', placeholder: 'Main heading' },
        { name: 'tagline', label: 'Tagline/Subtitle', placeholder: 'Subtitle or tagline' },
        { name: 'contact', label: 'Contact Info', placeholder: 'Phone, Email, Address' },
    ];
};

const MatterStep: React.FC<MatterStepProps> = ({
    orderId,
    orderType,
    customerName,
    onComplete,
    onSkip,
    onBack
}) => {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<Record<string, string>>({});
    const [matterText, setMatterText] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fields = getFieldsForType(orderType);

    // Load existing matter if any
    useEffect(() => {
        const fetchMatter = async () => {
            if (!orderId) return;
            
            const { data } = await supabase
                .from('job_matters')
                .select('*')
                .eq('order_id', orderId)
                .single();
            
            if (data) {
                setContent(data.content || {});
                setMatterText(data.content?.matter_text || '');
                // Load existing uploaded files
                if (data.content?.reference_files) {
                    setUploadedFiles(data.content.reference_files.map((f: { name: string; url: string; size?: number; type?: string }) => ({
                        id: f.url, // Use URL as ID for existing files
                        name: f.name,
                        url: f.url,
                        size: f.size || 0,
                        type: f.type || 'application/octet-stream'
                    })));
                }
            }
        };
        fetchMatter();
    }, [orderId]);

    const handleContentChange = (key: string, value: string) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const loadTemplate = () => {
        const template = TEMPLATES[orderType] || TEMPLATES.default;
        setMatterText(template);
        toast.success('Template loaded! Edit as needed.');
    };

    const handleSave = async () => {
        if (!orderId) {
            toast.error('Order not created yet');
            return;
        }

        setLoading(true);
        try {
            // Include uploaded files in the content
            const payload = {
                order_id: orderId,
                matter_type: orderType,
                content: { 
                    ...content, 
                    matter_text: matterText,
                    reference_files: uploadedFiles.map(f => ({
                        name: f.name,
                        url: f.url,
                        type: f.type,
                        size: f.size
                    }))
                },
                status: 'Ready for Design'
            };

            const { error } = await supabase
                .from('job_matters')
                .upsert(payload, { onConflict: 'order_id' });

            if (error) throw error;

            // Update order status
            await supabase
                .from('orders')
                .update({ status: 'Design' })
                .eq('id', orderId);

            toast.success('Matter saved successfully!');
            onComplete();
        } catch (error) {
            console.error('Error saving matter:', error);
            toast.error('Failed to save matter');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        if (orderId) {
            // Update order to indicate matter is pending
            await supabase
                .from('orders')
                .update({ status: 'Awaiting Content' })
                .eq('id', orderId);
        }
        onSkip();
    };

    // File upload functions
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file: globalThis.File): boolean => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (file.size > maxSize) {
            toast.error(`${file.name} is too large. Max 10MB allowed.`);
            return false;
        }
        if (!allowedTypes.includes(file.type)) {
            toast.error(`${file.name} is not a supported file type.`);
            return false;
        }
        return true;
    };

    const uploadFile = async (file: globalThis.File): Promise<UploadedFile | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `matter-references/${orderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('order-files')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('order-files')
                .getPublicUrl(fileName);

            return {
                id: fileName,
                name: file.name,
                url: publicUrl,
                size: file.size,
                type: file.type,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error(`Failed to upload ${file.name}`);
            return null;
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        setUploading(true);
        const newFiles: UploadedFile[] = [];
        
        for (const file of Array.from(files)) {
            if (validateFile(file)) {
                const uploaded = await uploadFile(file);
                if (uploaded) newFiles.push(uploaded);
            }
        }
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setUploading(false);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (newFiles.length > 0) {
            toast.success(`${newFiles.length} file(s) uploaded successfully!`);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        
        setUploading(true);
        const newFiles: UploadedFile[] = [];
        
        for (const file of Array.from(files)) {
            if (validateFile(file)) {
                const uploaded = await uploadFile(file);
                if (uploaded) newFiles.push(uploaded);
            }
        }
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setUploading(false);
        
        if (newFiles.length > 0) {
            toast.success(`${newFiles.length} file(s) uploaded successfully!`);
        }
    };

    const handleRemoveFile = async (fileId: string) => {
        try {
            await supabase.storage
                .from('order-files')
                .remove([fileId]);
            
            setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
            toast.success('File removed');
        } catch (error) {
            console.error('Error removing file:', error);
            toast.error('Failed to remove file');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Matter / Content Entry</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Enter the content details for <span className="font-semibold text-primary-600">{orderType}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">Customer: {customerName}</p>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Matter Entry is Optional but Important</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        You can skip this step and add matter later. Orders without matter will be marked as "Awaiting Content".
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Structured Fields */}
                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                            {orderType.includes('Invitation') ? 'Event Details' : 
                             orderType.includes('Business') ? 'Card Details' : 
                             orderType.includes('Bill') ? 'Company Details' : 'Content Details'}
                        </h3>
                    </div>
                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
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

                {/* Free Text / Matter */}
                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Full Matter Text</h3>
                        <Button size="sm" variant="outline" onClick={loadTemplate} type="button">
                            <Wand2 className="w-4 h-4 mr-2 text-purple-500" />
                            Load Template
                        </Button>
                    </div>
                    <div className="p-4">
                        <TextArea
                            id="matter_text"
                            label="Complete Text / Verses"
                            className="min-h-[300px]"
                            value={matterText}
                            onChange={(e) => setMatterText(e.target.value)}
                            placeholder="Type the complete text content here. For invitations, include verses, names, dates, etc..."
                        />
                    </div>
                </Card>
            </div>

            {/* File Upload Placeholder */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Reference Files</h3>
                    </div>
                    <span className="text-xs text-gray-400">Max 10MB per file • Images & PDFs</span>
                </div>
                <div className="p-4">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    
                    {/* Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-2" />
                                <p className="text-gray-600 dark:text-gray-300">Uploading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="font-medium text-gray-600 dark:text-gray-300">
                                    Drop files here or click to upload
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Reference designs, logos, previous work samples
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Uploaded Files ({uploadedFiles.length})
                            </p>
                            {uploadedFiles.map((file) => (
                                <div 
                                    key={file.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center gap-3">
                                        {file.type.startsWith('image/') ? (
                                            <div className="w-12 h-12 rounded overflow-hidden bg-gray-200">
                                                <img 
                                                    src={file.url} 
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <File className="w-6 h-6 text-blue-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFile(file.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                <Button variant="ghost" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleSkip}
                        className="text-gray-600"
                    >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Skip for Now
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        size="lg"
                        className="min-w-[200px]"
                    >
                        {loading ? (
                            'Saving...'
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Save & Complete
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MatterStep;
