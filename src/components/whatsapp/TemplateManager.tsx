import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import TemplateFormModal from './TemplateFormModal'; // அடுத்து உருவாக்கும் கூறு
import ConfirmationModal from '../ui/ConfirmationModal'; // ஏற்கெனவே உள்ள கூறு

export interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
}

interface TemplateManagerProps {
  initialTemplates: Template[];
  onDataChange: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ initialTemplates, onDataChange }) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setShowFormModal(true);
  };

  const handleDeleteRequest = (template: Template) => {
    setTemplateToDelete(template);
  };
  
  const confirmDelete = async () => {
    if (!templateToDelete) return;
    
    const promise = supabase.from('whatsapp_templates').delete().eq('id', templateToDelete.id);
    
    await toast.promise(
      (async () => {
        const { error } = await promise;
        if (error) throw error;
        onDataChange();
      })(), 
      {
        loading: 'Deleting template...',
        success: 'Template deleted.',
        error: (err) => err.message,
      }
    );
    
    setTemplateToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Templates</h2>
        <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2"/>Create Template</Button>
      </div>
      
      {initialTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold">No templates found</h3>
          <p className="text-sm text-gray-500">Create your first WhatsApp template to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialTemplates.map(template => (
            <Card key={template.id} className="p-4 flex flex-col justify-between">
              <div>
                  <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{template.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50">{template.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-4">{template.body}</p>
              </div>
              <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t dark:border-gray-700">
                  <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(template)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDeleteRequest(template)}><Trash2 size={16} className="text-red-500"/></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {showFormModal && 
        <TemplateFormModal 
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSave={onDataChange}
          editingTemplate={editingTemplate}
        /> 
      }
      <ConfirmationModal 
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Template"
        description={`Are you sure you want to delete the "${templateToDelete?.name}" template?`}
      />
    </div>
  );
};

export default TemplateManager;
