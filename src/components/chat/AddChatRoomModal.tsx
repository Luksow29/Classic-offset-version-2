// src/components/chat/AddChatRoomModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddChatRoomModal: React.FC<AddChatRoomModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile } = useUser();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() === '' || !userProfile || !user) {
      toast.error('Topic cannot be empty and you must be logged in!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('chat_rooms').insert({
        topic: topic.trim(),
        created_by: {
          id: user.id,
          name: userProfile.name,
          role: userProfile.role,
        },
        last_message: `Chat room created by ${userProfile.name}`,
        // last_message_at not needed if default now(), but good to be explicit usually. 
        // Supabase defaults handle created_at.
      });

      if (error) throw error;

      toast.success('New chat room created!');
      setTopic('');
      onClose();
    } catch (error: any) {
      console.error("Error creating chat room: ", error);
      toast.error(error.message || 'Failed to create chat room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start a New Chat Room">
      <form onSubmit={handleCreateRoom} className="space-y-4 pt-2">
        <p className="text-sm text-gray-500">
          Create a new chat room to discuss a specific topic with your team.
        </p>
        <Input
          id="topic"
          label="Chat Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Q4 Marketing Plan, Urgent Delivery Updates"
          required
          disabled={loading}
          autoFocus
        />
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !topic.trim()}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddChatRoomModal;
