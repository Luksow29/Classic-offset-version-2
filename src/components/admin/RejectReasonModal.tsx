// src/components/admin/RejectReasonModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal'; // Assuming you have a reusable Modal component
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <Modal isOpen={isOpen} setOpen={onClose} title="Reason for Rejection">
      <div className="space-y-4">
        <TextArea
          id="rejectionReason"
          label="Rejection Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason for rejecting this request..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim() || loading}>
            {loading ? 'Submitting...' : 'Submit Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectReasonModal;
