
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OrderFormData } from '../types';

interface JobDetailsStepProps {
    data: OrderFormData;
    updateData: (data: Partial<OrderFormData>) => void;
}

const JobDetailsStep: React.FC<JobDetailsStepProps> = ({ data, updateData }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="jobName" className="text-base">Job Name / Reference *</Label>
                    <Input
                        id="jobName"
                        placeholder="e.g. Annual Report 2024"
                        value={data.jobName}
                        onChange={(e) => updateData({ jobName: e.target.value })}
                        className="h-12"
                    />
                    <p className="text-sm text-muted-foreground">Give this job a name so you can easily find it later.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-base">Quantity *</Label>
                    <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={data.quantity}
                        onChange={(e) => updateData({ quantity: parseInt(e.target.value) || 0 })}
                        className="h-12"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Brief description of the job..."
                        value={data.description}
                        onChange={(e) => updateData({ description: e.target.value })}
                        className="min-h-[120px] resize-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default JobDetailsStep;
