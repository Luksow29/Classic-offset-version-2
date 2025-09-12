// src/components/customers/enhancements/CustomerCommunicationLog.tsx
import React, { useState } from 'react';

interface CommunicationLog {
  id: number;
  date: string;
  type: 'Call' | 'Email' | 'WhatsApp' | 'Meeting';
  notes: string;
}

const initialLogs: CommunicationLog[] = [
  { id: 1, date: '2023-10-26', type: 'Email', notes: 'Sent a follow-up email about the new design.' },
  { id: 2, date: '2023-10-24', type: 'Call', notes: 'Discussed the project timeline and budget.' },
];

const CustomerCommunicationLog: React.FC<{ customerId: string }> = ({ customerId }) => {
  const [logs, setLogs] = useState<CommunicationLog[]>(initialLogs);
  const [newLog, setNewLog] = useState({ type: 'Call' as const, notes: '' });

  const handleAddLog = () => {
    if (newLog.notes.trim() === '') return;
    const logToAdd: CommunicationLog = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: newLog.type,
      notes: newLog.notes,
    };
    setLogs([logToAdd, ...logs]);
    setNewLog({ type: 'Call', notes: '' });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h3 className="text-lg font-semibold mb-4">Communication Log</h3>
      
      <div className="flex items-start space-x-3 mb-4">
        <select
          value={newLog.type}
          onChange={(e) => setNewLog({ ...newLog, type: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option>Call</option>
          <option>Email</option>
          <option>WhatsApp</option>
          <option>Meeting</option>
        </select>
        <textarea
          value={newLog.notes}
          onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
          placeholder="Add a note..."
          rows={2}
          className="flex-grow p-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={handleAddLog}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Log
        </button>
      </div>

      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="p-3 bg-gray-50 rounded-md">
            <p className="font-semibold">{log.type} on {log.date}</p>
            <p className="text-gray-600">{log.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerCommunicationLog;