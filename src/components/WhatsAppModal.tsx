import React from 'react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose }) => {
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSend = () => {
    if (!phone || !message) {
      alert('📱 Please enter both phone number and message');
      return;
    }

    const url = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">📲 Send WhatsApp Message</h2>

        <div>
          <label className="block text-sm font-medium">Phone Number (+91...)</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded mt-1"
            placeholder="+91xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            className="w-full border px-3 py-2 rounded mt-1"
            rows={4}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded">
            Cancel
          </button>
          <button onClick={handleSend} className="px-4 py-2 bg-green-600 text-white rounded">
            Send on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
