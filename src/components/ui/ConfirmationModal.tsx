import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'destructive' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = 'destructive'
}) => {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (variant) {
      case 'destructive': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'info': return 'text-info';
      default: return 'text-destructive';
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'destructive': return 'bg-destructive/10 dark:bg-destructive/20';
      case 'warning': return 'bg-warning/10 dark:bg-warning/20';
      case 'info': return 'bg-info/10 dark:bg-info/20';
      default: return 'bg-destructive/10 dark:bg-destructive/20';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'destructive': return 'destructive';
      case 'warning': return 'primary';
      case 'info': return 'primary';
      default: return 'destructive';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${getBgColor()}`}>
          <AlertTriangle className={`h-6 w-6 ${getIconColor()}`} aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-foreground">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
        <Button
          variant={getButtonVariant()}
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
          {confirmText}
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="mt-3 w-full justify-center sm:mt-0 sm:col-start-1"
        >
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;