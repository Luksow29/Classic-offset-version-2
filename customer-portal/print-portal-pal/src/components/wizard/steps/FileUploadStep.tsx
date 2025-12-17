
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';
import { OrderFormData } from '../types';

interface FileUploadStepProps {
    data: OrderFormData;
    updateData: (data: Partial<OrderFormData>) => void;
}

const FileUploadStep: React.FC<FileUploadStepProps> = ({ data, updateData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            updateData({ files: [...data.files, ...newFiles] });
        }
    };

    const removeFile = (index: number) => {
        const newFiles = data.files.filter((_, i) => i !== index);
        updateData({ files: newFiles });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center hover:bg-muted/50 transition-colors">
                <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">Upload Artwork Files</h3>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        Select Files
                    </Button>
                </div>
            </div>

            {data.files.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium">Selected Files ({data.files.length})</h4>
                    <div className="grid gap-2">
                        {data.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFile(index)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadStep;
