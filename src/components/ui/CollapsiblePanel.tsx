import React, { useState, ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-900">
      <button
        className="w-full flex items-center justify-between px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-100 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="collapsible-content"
      >
        <span>{title}</span>
        <span className="ml-2 transition-transform" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
      </button>
      <div
        id="collapsible-content"
        className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!open}
      >
        <div className="px-4 pb-4 pt-2">{children}</div>
      </div>
    </div>
  );
};

export default CollapsiblePanel;
